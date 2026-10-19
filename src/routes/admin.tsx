import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { avg, CODES, PROJECT, useStore, VENDORS } from "@/lib/store";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Dashboard — Vendor Feedback" },
      { name: "description", content: "Response rates and vendor ratings by Sales and Technical area." },
      { property: "og:title", content: "Dashboard — Vendor Feedback" },
      { property: "og:description", content: "Response rates and vendor ratings by area." },
    ],
  }),
  component: Admin,
});

const THRESHOLD = 3;

function Admin() {
  const s = useStore();
  const [q, setQ] = useState("");
  const evals = Object.values(s.evals);
  const submitted = evals.filter((e) => e.status === "submitted");
  const invited = Object.keys(CODES).length * VENDORS.length;

  const rows = VENDORS.map((v) => {
    const es = submitted.filter((e) => e.vendorId === v.id);
    const m = (k: "sales" | "technical") => es.length ? es.reduce((t, e) => t + avg(e[k]), 0) / es.length : 0;
    return { ...v, n: es.length, sales: m("sales"), technical: m("technical") };
  });
  const comments = submitted.flatMap((e) => [
    { v: e.vendorId, a: "Sales", c: e.salesComment, who: e.customer },
    { v: e.vendorId, a: "Technical", c: e.technicalComment, who: e.customer },
  ]).filter((x) => x.c && x.c.toLowerCase().includes(q.toLowerCase()));

  return (
    <Shell>
      <p className="label-mono mt-10">Dashboard · {PROJECT.name}</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Vendor performance</h1>

      <div className="mt-10 grid grid-cols-3 border-y divide-x">
        {[["Invited", invited], ["Started", evals.length], ["Submitted", submitted.length]].map(([l, n]) => (
          <div key={l} className="p-5">
            <p className="label-mono">{l}</p>
            <p className="mt-2 font-mono text-4xl font-light">{n}</p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-sm text-muted-foreground">Response rate {Math.round((submitted.length / invited) * 100)}%</p>

      <h2 className="label-mono mt-14">Average rating by area</h2>
      <table className="mt-4 w-full text-left text-sm">
        <thead className="label-mono"><tr className="border-b"><th className="py-3">Vendor</th><th>Sales</th><th>Technical</th><th className="text-right">Responses</th></tr></thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="py-4 text-base">{r.name}</td>
              {(["sales", "technical"] as const).map((k) => (
                <td key={k} className="w-1/3 pr-6">
                  <div className="flex items-center gap-3">
                    <div className="h-1 flex-1 bg-muted"><div className={`h-1 ${r[k] < THRESHOLD ? "bg-destructive" : "bg-foreground"}`} style={{ width: `${(r[k] / 5) * 100}%` }} /></div>
                    <span className="w-16 font-mono">{r[k] ? r[k].toFixed(1) : "—"}{r[k] && r[k] < THRESHOLD ? " ⚠" : ""}</span>
                  </div>
                </td>
              ))}
              <td className="text-right font-mono">{r.n}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-14 flex items-end justify-between gap-4">
        <h2 className="label-mono">Comments</h2>
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search comments" aria-label="Search comments"
          className="h-10 rounded-full border border-input bg-transparent px-4 text-sm outline-none focus:border-ring" />
      </div>
      <ul className="mt-4 divide-y border-y">
        {comments.map((c, i) => (
          <li key={i} className="py-4">
            <p className="label-mono">{VENDORS.find((v) => v.id === c.v)?.name} · {c.a} · {c.who}</p>
            <p className="mt-1">{c.c}</p>
          </li>
        ))}
        {!comments.length && <li className="py-6 text-muted-foreground">No comments yet.</li>}
      </ul>
    </Shell>
  );
}
