import { useSyncExternalStore } from "react";

export const VENDOR = "Ragdalion";
export type Role = "sales" | "technical";
export const ROLE_LABEL: Record<Role, string> = { sales: "Sales", technical: "Technical" };
export const QUESTIONS: Record<Role, string[]> = {
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
};
export const SCALE = ["Very dissatisfied", "Dissatisfied", "Neutral", "Satisfied", "Very satisfied"];

export type Person = { id: string; name: string; role: Role; title: string };
export const PEOPLE: Person[] = [
  { id: "s1", name: "Andi Pratama", role: "sales", title: "Account Manager" },
  { id: "s2", name: "Rina Kusuma", role: "sales", title: "Sales Executive" },
  { id: "s3", name: "Dimas Saputra", role: "sales", title: "Presales Consultant" },
  { id: "t1", name: "Budi Santoso", role: "technical", title: "Project Manager" },
  { id: "t2", name: "Sari Wulandari", role: "technical", title: "Network Engineer" },
  { id: "t3", name: "Fajar Nugroho", role: "technical", title: "System Engineer" },
  { id: "t4", name: "Maya Lestari", role: "technical", title: "Support Engineer" },
];
export const person = (id: string) => PEOPLE.find((p) => p.id === id);

export type Project = { id: string; name: string; customer: string; code: string; closesAt: string; team: string[] };
const inDays = (d: number) => new Date(Date.now() + d * 864e5).toISOString();
export const PROJECTS: Project[] = [
  { id: "p1", name: "Data Center Upgrade", customer: "PT Sinar Mas", code: "DEMO-2026", closesAt: inDays(6), team: ["s1", "s3", "t1", "t2", "t3"] },
  { id: "p2", name: "Branch Network Rollout", customer: "Acme Corp", code: "ACME-1234", closesAt: inDays(3), team: ["s2", "t1", "t4", "t2"] },
  { id: "p3", name: "Cloud Migration", customer: "Bank Nusa", code: "NUSA-7788", closesAt: inDays(10), team: ["s1", "s2", "t3", "t4"] },
];
export const projectByCode = (c: string | null) => PROJECTS.find((p) => p.code === c);

export type Answers = Record<string, number | "na">;
export type Evaluation = {
  projectId: string;
  personId: string;
  answers: Answers;
  comment: string;
  status: "draft" | "submitted";
  submittedAt?: string;
  updatedAt: string;
};
type State = { code: string | null; evals: Record<string, Evaluation> };

export const evalKey = (projectId: string, personId: string) => `${projectId}:${personId}`;
function seed(projectId: string, personId: string, scores: number[], comment = ""): [string, Evaluation] {
  const p = person(personId)!;
  const now = new Date().toISOString();
  return [evalKey(projectId, personId), {
    projectId, personId, comment, status: "submitted", submittedAt: now, updatedAt: now,
    answers: Object.fromEntries(QUESTIONS[p.role].map((q, i) => [q, scores[i] ?? 4] as [string, number])),
  }];
}
const SEED: Record<string, Evaluation> = Object.fromEntries([
  seed("p2", "s2", [4, 5, 4, 5, 5], "Rina always replied the same day."),
  seed("p2", "t1", [3, 2, 3, 3, 2, 3], "Timeline slipped twice without notice."),
  seed("p2", "t4", [5, 4, 5, 5, 4, 5], "Very helpful during go-live."),
  seed("p3", "s1", [4, 4, 3, 4, 4]),
  seed("p3", "t3", [2, 2, 3, 2, 3, 2], "Migration issues took long to resolve."),
  seed("p3", "t4", [4, 5, 4, 4, 5, 4]),
]);

const KEY = "vfa-state-v2";
let state: State = { code: null, evals: SEED };
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) { const s = JSON.parse(raw); state = { code: s.code, evals: { ...SEED, ...s.evals } }; }
  } catch {}
}
function set(next: Partial<State>) {
  state = { ...state, ...next };
  localStorage.setItem(KEY, JSON.stringify(state));
  subs.forEach((f) => f());
}
const SERVER: State = { code: null, evals: SEED };
export function useStore() {
  return useSyncExternalStore(
    (f) => { load(); subs.add(f); f(); return () => subs.delete(f); },
    () => { load(); return state; },
    () => SERVER,
  );
}
export const actions = {
  login(code: string) {
    const c = code.trim().toUpperCase();
    if (!projectByCode(c)) return false;
    set({ code: c });
    return true;
  },
  logout() { set({ code: null }); },
  save(e: Evaluation) {
    set({ evals: { ...state.evals, [evalKey(e.projectId, e.personId)]: { ...e, updatedAt: new Date().toISOString() } } });
  },
};

export function avg(a: Answers) {
  const n = Object.values(a).filter((v): v is number => typeof v === "number");
  return n.length ? n.reduce((s, x) => s + x, 0) / n.length : 0;
}
