import { useSyncExternalStore } from "react";
import { getSupabase, isSupabaseConfigured, checkSupabaseConnection, type SupabaseStatus } from "./supabase";

export const VENDOR = "Ragdalion";
export type Role = "sales" | "technical";
export type EvaluationTarget = Role | "company";
export const ROLE_LABEL: Record<EvaluationTarget, string> = {
  sales: "Sales",
  technical: "Technical",
  company: "Kantor / Perusahaan",
};
export const QUESTIONS: Record<EvaluationTarget, string[]> = {
  sales: [
    "Responsiveness to requests",
    "Clarity of proposal and quotation",
    "Transparency on price and scope changes",
    "Communication and relationship",
    "Overall satisfaction",
  ],
  technical: [
    "Quality of work delivered",
    "Adherence to schedule",
    "Technical competence",
    "Handling of problems and support",
    "Communication on progress",
    "Overall satisfaction",
  ],
  company: [
    "Ease of coordination and collaboration with Ragdalion",
    "Overall quality of services and solutions delivered",
    "Transparency, governance, and commitment adherence",
    "Professionalism and organizational culture",
    "Overall satisfaction partnering with Ragdalion",
  ],
};
export const SCALE = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];

export type Person = { id: string; name: string; role: Role; title: string };
// Clean database: Zero dummy people
export const SEED_PEOPLE: Person[] = [];
export const PEOPLE: Person[] = [];

export type Project = {
  id: string;
  name: string;
  customer: string;
  code: string;
  pin: string;
  closesAt: string;
  team: string[];
};

// Clean database: Zero dummy projects
export const SEED_PROJECTS: Project[] = [];
export const PROJECTS: Project[] = [];

export function generatePin(): string {
  // Generate random 6-digit PIN securely
  const array = new Uint32Array(1);
  if (typeof window !== "undefined" && window.crypto) {
    window.crypto.getRandomValues(array);
    const val = array[0] ?? Math.floor(Math.random() * 900000);
    return (100000 + (val % 900000)).toString();
  }
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export type Answers = Record<string, number | "na">;
export type Evaluation = {
  projectId: string;
  personId: string;
  answers: Answers;
  comment: string;
  attentionPoints?: string;
  improvementPoints?: string;
  status: "draft" | "submitted";
  submittedAt?: string;
  updatedAt: string;
};

export const evalKey = (projectId: string, personId: string) => `${projectId}:${personId}`;

// Clean database: Zero dummy evaluations
const SEED_EVALS: Record<string, Evaluation> = {};

export type State = {
  code: string | null;
  projects: Project[];
  people: Person[];
  evals: Record<string, Evaluation>;
  isAdminAuthenticated: boolean;
  supabaseStatus: SupabaseStatus;
  authLockoutUntil: number | null;
  authAttemptsLeft: number;
};

const STORAGE_KEY = "pictrack-clean-v1";
const ADMIN_SESSION_KEY = "pictrack-admin-auth-session";
const ATTEMPTS_KEY = "pictrack-auth-attempts";
const LOCKOUT_KEY = "pictrack-auth-lockout";
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes lockout

let state: State = {
  code: null,
  projects: [],
  people: [],
  evals: {},
  isAdminAuthenticated: false,
  supabaseStatus: {
    configured: false,
    connected: false,
    source: "none",
    message: "Memuat database...",
  },
  authLockoutUntil: null,
  authAttemptsLeft: MAX_ATTEMPTS,
};

let loaded = false;
const subs = new Set<() => void>();

function getRemainingLockout(lockoutKey: string): number | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(lockoutKey);
  if (!raw) return null;
  const expiry = parseInt(raw, 10);
  if (Date.now() < expiry) {
    return expiry;
  }
  localStorage.removeItem(lockoutKey);
  return null;
}

function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;

  // Purge old dummy storage if present
  try {
    localStorage.removeItem("vfa-state-v3");
    localStorage.removeItem("vfa-state-v2");
    localStorage.removeItem("vfa-state");
  } catch {}

  // Check admin session
  const adminAuth = sessionStorage.getItem(ADMIN_SESSION_KEY) === "true";

  // Check PIN login rate-limiting lockout
  const lockoutUntil = getRemainingLockout(LOCKOUT_KEY);
  const attemptsRaw = localStorage.getItem(ATTEMPTS_KEY);
  const failedAttempts = attemptsRaw ? parseInt(attemptsRaw, 10) : 0;
  const attemptsLeft = Math.max(0, MAX_ATTEMPTS - failedAttempts);

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const s = JSON.parse(raw);
      state = {
        code: s.code ?? null,
        projects: Array.isArray(s.projects) ? s.projects : [],
        people: Array.isArray(s.people) ? s.people : [],
        evals: s.evals && typeof s.evals === "object" ? s.evals : {},
        isAdminAuthenticated: adminAuth,
        supabaseStatus: {
          configured: isSupabaseConfigured(),
          connected: false,
          source: "none",
          message: "Menghubungkan ke Supabase...",
        },
        authLockoutUntil: lockoutUntil,
        authAttemptsLeft: lockoutUntil ? 0 : attemptsLeft,
      };
    } else {
      state = {
        ...state,
        isAdminAuthenticated: adminAuth,
        authLockoutUntil: lockoutUntil,
        authAttemptsLeft: lockoutUntil ? 0 : attemptsLeft,
      };
    }
  } catch {
    state = {
      ...state,
      isAdminAuthenticated: adminAuth,
    };
  }

  // Initialize Supabase check & sync in background
  initSupabaseSync();
}

function set(next: Partial<State>) {
  state = { ...state, ...next };
  if (typeof window !== "undefined") {
    try {
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          code: state.code,
          projects: state.projects,
          people: state.people,
          evals: state.evals,
        })
      );
    } catch {}
  }
  subs.forEach((f) => f());
}

// Supabase synchronization
let realtimeSubscribed = false;

async function initSupabaseSync() {
  const status = await checkSupabaseConnection();
  set({ supabaseStatus: status });

  const client = getSupabase();
  if (!status.connected || !client) return;

  try {
    // 1. Fetch people
    const { data: peopleData, error: peopleErr } = await client
      .from("people")
      .select("*")
      .order("created_at", { ascending: true });

    // 2. Fetch projects
    const { data: projectsData, error: projErr } = await client
      .from("projects")
      .select("*")
      .order("created_at", { ascending: false });

    // 3. Fetch project assignments
    const { data: assignmentsData } = await client
      .from("project_people")
      .select("*");

    // 4. Fetch evaluations
    const { data: evalsData } = await client
      .from("evaluations")
      .select("*");

    if (!peopleErr && !projErr) {
      const remotePeople: Person[] = (peopleData || []).map((p: any) => ({
        id: p.id,
        name: p.name,
        role: p.role,
        title: p.title,
      }));

      const remoteProjects: Project[] = (projectsData || []).map((pr: any) => {
        const team = (assignmentsData || [])
          .filter((a: any) => a.project_id === pr.id)
          .map((a: any) => a.person_id);
        return {
          id: pr.id,
          name: pr.name,
          customer: pr.customer,
          code: pr.code,
          pin: pr.pin,
          closesAt: pr.closes_at,
          team,
        };
      });

      const remoteEvals: Record<string, Evaluation> = {};
      (evalsData || []).forEach((ev: any) => {
        remoteEvals[evalKey(ev.project_id, ev.person_id)] = {
          projectId: ev.project_id,
          personId: ev.person_id,
          answers: ev.answers || {},
          comment: ev.comment || "",
          attentionPoints: ev.answers?._attentionPoints || "",
          improvementPoints: ev.answers?._improvementPoints || "",
          status: ev.status,
          submittedAt: ev.submitted_at,
          updatedAt: ev.updated_at,
        };
      });

      set({
        people: remotePeople,
        projects: remoteProjects,
        evals: remoteEvals,
      });
    }

    // Subscribe to Realtime Postgres Changes once
    if (!realtimeSubscribed) {
      realtimeSubscribed = true;
      client
        .channel("pictrack-realtime-sync")
        .on("postgres_changes", { event: "*", schema: "public", table: "projects" }, () => {
          initSupabaseSync();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "people" }, () => {
          initSupabaseSync();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "project_people" }, () => {
          initSupabaseSync();
        })
        .on("postgres_changes", { event: "*", schema: "public", table: "evaluations" }, () => {
          initSupabaseSync();
        })
        .subscribe();
    }
  } catch (e) {
    console.warn("Supabase fetch failed, continuing with local state", e);
  }
}

export const person = (id: string) => {
  load();
  return state.people.find((p) => p.id === id);
};

export const projectByCode = (c: string | null) => {
  if (!c) return undefined;
  load();
  const clean = c.trim().toUpperCase();
  return state.projects.find(
    (p) => p.code.toUpperCase() === clean || (p.pin && p.pin.toUpperCase() === clean)
  );
};

const SERVER: State = {
  code: null,
  projects: [],
  people: [],
  evals: {},
  isAdminAuthenticated: false,
  supabaseStatus: {
    configured: false,
    connected: false,
    source: "none",
    message: "Server render",
  },
  authLockoutUntil: null,
  authAttemptsLeft: MAX_ATTEMPTS,
};

export function useStore() {
  return useSyncExternalStore(
    (f) => {
      load();
      subs.add(f);
      f();
      return () => subs.delete(f);
    },
    () => {
      load();
      return state;
    },
    () => SERVER,
  );
}

// Anti-brute force delay
const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

export const actions = {
  // Customer Login with Rate Limiting and Anti-Brute Force Protection
  async login(codeOrPin: string): Promise<{ success: boolean; error?: string; locked?: boolean; remainingSeconds?: number }> {
    load();

    // 1. Check if user is locked out
    const lockoutUntil = getRemainingLockout(LOCKOUT_KEY);
    if (lockoutUntil) {
      const remainingSeconds = Math.ceil((lockoutUntil - Date.now()) / 1000);
      set({ authLockoutUntil: lockoutUntil, authAttemptsLeft: 0 });
      return {
        success: false,
        locked: true,
        remainingSeconds,
        error: `Terlalu banyak percobaan. Sistem terkunci selama ${Math.ceil(remainingSeconds / 60)} menit demi keamanan.`,
      };
    }

    // Artificial delay to throttle rapid brute-force automation
    await delay(350);

    const c = codeOrPin.trim().toUpperCase();
    if (!c || c.length < 4) {
      return { success: false, error: "Format PIN atau Kode Akses tidak valid." };
    }

    // 2. If Supabase is connected, check RPC or query projects
    const client = getSupabase();
    if (client) {
      try {
        const { data: rpcRes, error: rpcErr } = await client.rpc("verify_customer_pin", {
          p_pin: c,
          p_client_id: "browser_client",
        });

        if (!rpcErr && rpcRes) {
          if (rpcRes.success) {
            localStorage.removeItem(ATTEMPTS_KEY);
            localStorage.removeItem(LOCKOUT_KEY);
            set({ code: rpcRes.project.code, authLockoutUntil: null, authAttemptsLeft: MAX_ATTEMPTS });
            return { success: true };
          }
          if (rpcRes.locked) {
            const until = Date.now() + LOCKOUT_DURATION_MS;
            localStorage.setItem(LOCKOUT_KEY, until.toString());
            set({ authLockoutUntil: until, authAttemptsLeft: 0 });
            return { success: false, locked: true, remainingSeconds: 900, error: rpcRes.message };
          }
        }
      } catch (err) {
        // Fallback to direct query if RPC not installed
      }

      try {
        const { data: proj } = await client
          .from("projects")
          .select("*")
          .or(`pin.eq.${c},code.eq.${c}`)
          .limit(1);

        if (proj && proj.length > 0) {
          localStorage.removeItem(ATTEMPTS_KEY);
          localStorage.removeItem(LOCKOUT_KEY);
          set({ code: proj[0].code, authLockoutUntil: null, authAttemptsLeft: MAX_ATTEMPTS });
          return { success: true };
        }
      } catch {}
    }

    // 3. Local Verification with brute-force tracking
    const found = state.projects.find(
      (p) => p.code.toUpperCase() === c || (p.pin && p.pin.toUpperCase() === c)
    );

    if (found) {
      // Reset attempts on successful authentication
      localStorage.removeItem(ATTEMPTS_KEY);
      localStorage.removeItem(LOCKOUT_KEY);
      set({ code: found.code, authLockoutUntil: null, authAttemptsLeft: MAX_ATTEMPTS });
      return { success: true };
    }

    // Failed attempt handling
    const attemptsRaw = localStorage.getItem(ATTEMPTS_KEY);
    const failedAttempts = (attemptsRaw ? parseInt(attemptsRaw, 10) : 0) + 1;
    localStorage.setItem(ATTEMPTS_KEY, failedAttempts.toString());

    if (failedAttempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem(LOCKOUT_KEY, lockUntil.toString());
      set({ authLockoutUntil: lockUntil, authAttemptsLeft: 0 });
      return {
        success: false,
        locked: true,
        remainingSeconds: 900,
        error: "Terlalu banyak percobaan gagal. Akun dikunci sementara selama 15 menit.",
      };
    }

    const attemptsRemaining = MAX_ATTEMPTS - failedAttempts;
    set({ authAttemptsLeft: attemptsRemaining });
    return {
      success: false,
      error: `PIN atau Kode Akses tidak valid. (Tersisa ${attemptsRemaining} percobaan)`,
    };
  },

  logout() {
    set({ code: null });
  },

  // Admin Authentication Gate
  async loginAdmin(passcode: string): Promise<{ success: boolean; error?: string; locked?: boolean }> {
    load();
    const adminLockout = getRemainingLockout("pictrack-admin-lockout");
    if (adminLockout) {
      return {
        success: false,
        locked: true,
        error: "Akses admin terkunci sementara selama 15 menit karena kesalahan berulang.",
      };
    }

    await delay(300);

    const env = import.meta.env as Record<string, string | undefined>;
    const validPasscode = env["VITE_ADMIN_PASSCODE"] || "admin123";

    if (passcode === validPasscode) {
      localStorage.removeItem("pictrack-admin-attempts");
      localStorage.removeItem("pictrack-admin-lockout");
      sessionStorage.setItem(ADMIN_SESSION_KEY, "true");
      set({ isAdminAuthenticated: true });
      return { success: true };
    }

    // Track failed admin attempts
    const rawAttempts = localStorage.getItem("pictrack-admin-attempts");
    const attempts = (rawAttempts ? parseInt(rawAttempts, 10) : 0) + 1;
    localStorage.setItem("pictrack-admin-attempts", attempts.toString());

    if (attempts >= MAX_ATTEMPTS) {
      const lockUntil = Date.now() + LOCKOUT_DURATION_MS;
      localStorage.setItem("pictrack-admin-lockout", lockUntil.toString());
      return {
        success: false,
        locked: true,
        error: "Terlalu banyak percobaan passcode yang salah. Akses admin dikunci selama 15 menit.",
      };
    }

    return {
      success: false,
      error: `Passcode admin salah. Tersisa ${MAX_ATTEMPTS - attempts} kesempatan.`,
    };
  },

  logoutAdmin() {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
    set({ isAdminAuthenticated: false });
  },

  checkAdminAuth(): boolean {
    load();
    return state.isAdminAuthenticated;
  },

  // Database Save Evaluation (with Supabase sync)
  async save(e: Evaluation) {
    const updatedEvals = {
      ...state.evals,
      [evalKey(e.projectId, e.personId)]: {
        ...e,
        updatedAt: new Date().toISOString(),
      },
    };
    set({ evals: updatedEvals });

    // Sync to Supabase
    const client = getSupabase();
    if (client) {
      try {
        const payloadAnswers = {
          ...e.answers,
          ...(e.attentionPoints ? { _attentionPoints: e.attentionPoints } : {}),
          ...(e.improvementPoints ? { _improvementPoints: e.improvementPoints } : {}),
        };
        await client.from("evaluations").upsert({
          project_id: e.projectId,
          person_id: e.personId,
          answers: payloadAnswers,
          comment: e.comment || "",
          status: e.status,
          submitted_at: e.status === "submitted" ? (e.submittedAt || new Date().toISOString()) : null,
          updated_at: new Date().toISOString(),
        }, { onConflict: "project_id,person_id" });
      } catch (err) {
        console.error("Failed to sync evaluation to Supabase", err);
      }
    }
  },

  // Add Customer Project (with Supabase sync)
  async addCustomer(data: {
    customer: string;
    projectName: string;
    closesInDays?: number;
    pin?: string;
    team?: string[];
  }): Promise<Project> {
    load();
    const pin = data.pin && data.pin.trim() ? data.pin.trim().toUpperCase() : generatePin();
    const id = "p_" + Date.now();
    const closesAt = new Date(Date.now() + (data.closesInDays ?? 7) * 864e5).toISOString();
    const newProject: Project = {
      id,
      name: data.projectName.trim(),
      customer: data.customer.trim(),
      code: pin,
      pin,
      closesAt,
      team: data.team ?? [],
    };

    set({ projects: [newProject, ...state.projects] });

    // Sync to Supabase
    const client = getSupabase();
    if (client) {
      try {
        await client.from("projects").insert({
          id: newProject.id,
          name: newProject.name,
          customer: newProject.customer,
          code: newProject.code,
          pin: newProject.pin,
          closes_at: newProject.closesAt,
        });

        if (newProject.team.length > 0) {
          const assignments = newProject.team.map((personId) => ({
            project_id: newProject.id,
            person_id: personId,
          }));
          await client.from("project_people").insert(assignments);
        }
      } catch (err) {
        console.error("Failed to sync project to Supabase", err);
      }
    }

    return newProject;
  },

  // Add Team Member (with Supabase sync)
  async addPerson(data: {
    name: string;
    title: string;
    role: Role;
    projectIds?: string[];
  }): Promise<Person> {
    load();
    const id = `${data.role === "sales" ? "s" : "t"}_${Date.now()}`;
    const newPerson: Person = {
      id,
      name: data.name.trim(),
      title: data.title.trim(),
      role: data.role,
    };

    const updatedProjects = state.projects.map((pr) => {
      if (data.projectIds?.includes(pr.id)) {
        if (!pr.team.includes(id)) {
          return { ...pr, team: [...pr.team, id] };
        }
      }
      return pr;
    });

    set({
      people: [...state.people, newPerson],
      projects: updatedProjects,
    });

    // Sync to Supabase
    const client = getSupabase();
    if (client) {
      try {
        await client.from("people").insert({
          id: newPerson.id,
          name: newPerson.name,
          title: newPerson.title,
          role: newPerson.role,
        });

        if (data.projectIds && data.projectIds.length > 0) {
          const assignments = data.projectIds.map((pId) => ({
            project_id: pId,
            person_id: newPerson.id,
          }));
          await client.from("project_people").insert(assignments);
        }
      } catch (err) {
        console.error("Failed to sync person to Supabase", err);
      }
    }

    return newPerson;
  },

  // Assign Person to Projects (with Supabase sync)
  async assignPersonToProjects(personId: string, projectIds: string[]) {
    load();
    const updatedProjects = state.projects.map((pr) => {
      const shouldInclude = projectIds.includes(pr.id);
      const hasPerson = pr.team.includes(personId);
      if (shouldInclude && !hasPerson) {
        return { ...pr, team: [...pr.team, personId] };
      }
      if (!shouldInclude && hasPerson) {
        return { ...pr, team: pr.team.filter((id) => id !== personId) };
      }
      return pr;
    });

    set({ projects: updatedProjects });

    const client = getSupabase();
    if (client) {
      try {
        // Delete previous assignments for this person
        await client.from("project_people").delete().eq("person_id", personId);

        // Insert new assignments
        if (projectIds.length > 0) {
          const records = projectIds.map((pId) => ({
            project_id: pId,
            person_id: personId,
          }));
          await client.from("project_people").insert(records);
        }
      } catch (err) {
        console.error("Failed to sync assignments to Supabase", err);
      }
    }
  },

  // Delete Customer Project
  async deleteCustomer(projectId: string) {
    load();
    set({
      projects: state.projects.filter((pr) => pr.id !== projectId),
    });

    const client = getSupabase();
    if (client) {
      try {
        await client.from("projects").delete().eq("id", projectId);
      } catch (err) {
        console.error("Failed to delete project from Supabase", err);
      }
    }
  },

  // Delete Person
  async deletePerson(personId: string) {
    load();
    set({
      people: state.people.filter((p) => p.id !== personId),
      projects: state.projects.map((pr) => ({
        ...pr,
        team: pr.team.filter((id) => id !== personId),
      })),
    });

    const client = getSupabase();
    if (client) {
      try {
        await client.from("people").delete().eq("id", personId);
      } catch (err) {
        console.error("Failed to delete person from Supabase", err);
      }
    }
  },

  // Refresh data from database
  async refreshFromDatabase() {
    await initSupabaseSync();
  },
};

export function avg(a: Answers) {
  const n = Object.values(a).filter((v): v is number => typeof v === "number");
  return n.length ? n.reduce((s, x) => s + x, 0) / n.length : 0;
}
