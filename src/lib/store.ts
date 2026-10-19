import { useSyncExternalStore } from "react";

export type Area = "sales" | "technical";
export const QUESTIONS: Record<Area, string[]> = {
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

export const PROJECT = {
  name: "Jakarta HQ Fit-out",
  closesAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 6).toISOString(),
};
export const VENDORS = [
  { id: "v1", name: "Arcadia Systems", scope: "Network & infrastructure" },
  { id: "v2", name: "Nusantara Build", scope: "Civil works" },
  { id: "v3", name: "Helix Interiors", scope: "Interior fit-out" },
];
export const CODES: Record<string, string> = { "DEMO-2026": "PT Sinar Mas", "ACME-1234": "Acme Corp" };

export type Answers = Record<string, number | "na">;
export type Evaluation = {
  vendorId: string;
  customer: string;
  sales: Answers;
  technical: Answers;
  salesComment: string;
  technicalComment: string;
  status: "draft" | "submitted";
  submittedAt?: string;
  updatedAt: string;
};
type State = { code: string | null; evals: Record<string, Evaluation> };

const KEY = "vfa-state";
const SEED: Record<string, Evaluation> = {
  "ACME-1234:v1": seed("v1", "Acme Corp", [4, 5, 4, 4, 4], [5, 4, 5, 4, 4, 5], "Quick turnaround on quotes.", "Solid delivery."),
  "ACME-1234:v2": seed("v2", "Acme Corp", [3, 2, 2, 3, 2], [3, 2, 3, 2, 3, 2], "Scope changes were not communicated.", "Delays on phase 2."),
  "ACME-1234:v3": seed("v3", "Acme Corp", [5, 4, 4, 5, 5], [4, 4, 5, 4, 5, 4], "", "Great finish quality."),
};
function seed(v: string, c: string, s: number[], t: number[], sc: string, tc: string): Evaluation {
  const toA = (arr: number[], a: Area) => Object.fromEntries(QUESTIONS[a].map((q, i) => [q, arr[i] as number]));
  const now = new Date().toISOString();
  return { vendorId: v, customer: c, sales: toA(s, "sales"), technical: toA(t, "technical"), salesComment: sc, technicalComment: tc, status: "submitted", submittedAt: now, updatedAt: now };
}

let state: State = { code: null, evals: SEED };
let loaded = false;
const subs = new Set<() => void>();
function load() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) state = { ...state, ...JSON.parse(raw), evals: { ...SEED, ...JSON.parse(raw).evals } };
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
    if (!CODES[c]) return false;
    set({ code: c });
    return true;
  },
  logout() { set({ code: null }); },
  save(e: Evaluation) {
    if (!state.code) return;
    set({ evals: { ...state.evals, [`${state.code}:${e.vendorId}`]: { ...e, updatedAt: new Date().toISOString() } } });
  },
  get(vendorId: string) { return state.code ? state.evals[`${state.code}:${vendorId}`] : undefined; },
};

export function avg(a: Answers) {
  const n = Object.values(a).filter((v): v is number => typeof v === "number");
  return n.length ? n.reduce((s, x) => s + x, 0) / n.length : 0;
}
