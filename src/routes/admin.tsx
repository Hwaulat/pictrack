import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { avg, evalKey, PEOPLE, person, PROJECTS, ROLE_LABEL, useStore, VENDOR, type Role } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Team performance — Ragdalion Feedback" },
      { name: "description", content: "Monitor each Ragdalion sales and technical team member across their projects." },
      { property: "og:title", content: "Team performance — Ragdalion Feedback" },
      { property: "og:description", content: "Monitor each Ragdalion team member across their projects." },
    ],
  }),
  component: Admin,
});

const THRESHOLD = 3;

function Score({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 w-24 bg-muted"><div className={`h-1 ${v && v < THRESHOLD ? "bg-destructive" : "bg-foreground"}`} style={{ width: `${(v / 5) * 100}%` }} /></div>
      <span className="w-14 font-mono">{v ? v.toFixed(1) : "—"}{v && v < THRESHOLD ? " ⚠" : ""}</span>
    </div>
  );
}

function Admin() {
  const s = useStore();
  const [role, setRole] = useState<Role | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const submitted = Object.values(s.evals).filter((e) => e.status === "submitted");
  const invited = PROJECTS.reduce((n, p) => n + p.team.length, 0);

  const people = PEOPLE.filter((p) => role === "all" || p.role === role).map((p) => {
    const projects = PROJECTS.filter((pr) => pr.team.includes(p.id));
    const es = submitted.filter((e) => e.personId === p.id);
    return { ...p, projects, es, score: es.length ? es.reduce((t, e) => t + avg(e.answers), 0) / es.length : 0 };
  });

  return (
    <Shell>
      <p className="label-mono mt-10">Dashboard · {VENDOR}</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Team performance</h1>

      <div className="mt-10 grid grid-cols-3 divide-x border-y">
        {[["Projects", PROJECTS.length], ["Ratings expected", invited], ["Submitted", submitted.length]].map(([l, n]) => (
          <div key={l} className="p-5">
            <p className="label-mono">{l}</p>
            <p className="mt-2 font-mono text-4xl font-light">{n}</p>
          </div>
        ))}
      </div>

      <h2 className="label-mono mt-14">Projects</h2>
      <ul className="mt-3 divide-y border-y">
        {PROJECTS.map((pr) => {
          const done = pr.team.filter((id) => s.evals[evalKey(pr.id, id)]?.status === "submitted").length;
          return (
            <li key={pr.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
              <div>
                <p>{pr.name}</p>
                <p className="text-sm text-muted-foreground">{pr.customer} · closes {new Date(pr.closesAt).toLocaleDateString()}</p>
              </div>
              <span className="font-mono text-sm">{done}/{pr.team.length} rated</span>
            </li>
          );
        })}
      </ul>

      <div className="mt-14 flex items-end justify-between gap-4">
        <h2 className="label-mono">People</h2>
        <div className="flex gap-1 rounded-full border p-1 text-sm">
          {(["all", "sales", "technical"] as const).map((r) => (
            <button key={r} onClick={() => setRole(r)} aria-pressed={role === r}
              className={`rounded-full px-4 py-1.5 ${role === r ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"}`}>
              {r === "all" ? "All" : ROLE_LABEL[r]}
            </button>
          ))}
        </div>
      </div>
      <ul className="mt-3 divide-y border-y">
        {people.map((p) => (
          <li key={p.id}>
            <button onClick={() => setOpen(open === p.id ? null : p.id)} aria-expanded={open === p.id}
              className="flex w-full flex-wrap items-center justify-between gap-4 px-2 py-5 text-left hover:bg-card">
              <div>
                <p className="text-lg">{p.name}</p>
                <p className="text-sm text-muted-foreground">{ROLE_LABEL[p.role]} · {p.title} · {p.projects.length} projects · {p.es.length} ratings</p>
              </div>
              <Score v={p.score} />
            </button>
            {open === p.id && (
              <div className="space-y-3 px-2 pb-6">
                {p.projects.map((pr) => {
                  const e = s.evals[evalKey(pr.id, p.id)];
                  const ok = e?.status === "submitted";
                  return (
                    <div key={pr.id} className="rounded-md border p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <p className="label-mono">{pr.name} · {pr.customer}</p>
                        {ok ? <Score v={avg(e.answers)} /> : <span className="label-mono">{e ? "◐ Draft" : "○ Waiting"}</span>}
                      </div>
                      {ok && (
                        <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                          {Object.entries(e.answers).map(([q, v]) => (
                            <div key={q} className="flex justify-between gap-3">
                              <dt className="text-muted-foreground">{q}</dt><dd className="font-mono">{v === "na" ? "N/A" : v}</dd>
                            </div>
                          ))}
                        </dl>
                      )}
                      {ok && e.comment && <p className="mt-3 border-t pt-3 text-sm">"{e.comment}"</p>}
                    </div>
                  );
                })}
              </div>
            )}
          </li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-muted-foreground">Low-score flag below {THRESHOLD.toFixed(1)} · {person("t1")?.name} works on multiple projects — open a row to see each one.</p>
    </Shell>
  );
}
