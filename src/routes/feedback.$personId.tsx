import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, evalKey, person, projectByCode, QUESTIONS, ROLE_LABEL, SCALE, useStore, VENDOR, type Evaluation } from "@/lib/store";

export const Route = createFileRoute("/feedback/$personId")({
  head: () => ({
    meta: [
      { title: "Rate a team member — Ragdalion Feedback" },
      { name: "description", content: "Rate how a Ragdalion team member performed on your project." },
      { property: "og:title", content: "Rate a team member — Ragdalion Feedback" },
      { property: "og:description", content: "Rate how a Ragdalion team member performed on your project." },
    ],
  }),
  component: Feedback,
});

function Feedback() {
  const { personId } = Route.useParams();
  const s = useStore();
  const nav = useNavigate();
  const project = projectByCode(s.code);
  const p = person(personId);
  const [review, setReview] = useState(false);
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!project || ev) return;
    setEv(s.evals[evalKey(project.id, personId)] ?? {
      projectId: project.id, personId, answers: {}, comment: "", status: "draft", updatedAt: new Date().toISOString(),
    });
  }, [project, personId, ev, s.evals]);

  useEffect(() => { if (ev && ev.status === "draft") actions.save(ev); }, [ev]);

  if (!project || !p || !project.team.includes(p.id))
    return <Shell><p className="py-20 text-muted-foreground">Please <Link to="/" className="underline">enter your code</Link> first.</p></Shell>;
  if (!ev) return <Shell><div /></Shell>;

  const qs = QUESTIONS[p.role];
  const low = Object.values(ev.answers).some((v) => v === 1 || v === 2);
  const valid = qs.every((q) => ev.answers[q] !== undefined) && (!low || ev.comment.trim().length > 0);

  const submit = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    actions.save({ ...ev, status: "submitted", submittedAt: ev.submittedAt ?? new Date().toISOString() });
    nav({ to: "/done" });
  };

  return (
    <Shell>
      <Link to="/vendors" className="label-mono mt-6 inline-block hover:text-foreground">← Team</Link>
      <p className="label-mono mt-6">{VENDOR} · {ROLE_LABEL[p.role]} · {project.name}</p>
      <h1 className="mt-3 text-4xl font-light tracking-tight">{p.name}</h1>
      <p className="text-muted-foreground">{p.title}</p>
      <ol className="mt-8 grid grid-cols-2 gap-2" aria-label="Progress">
        {["Rate", "Review"].map((l, i) => {
          const on = i === 0 || review;
          return (
            <li key={l} aria-current={(i === 1) === review ? "step" : undefined}>
              <div className={`h-px ${on ? "bg-foreground" : "bg-border"}`} />
              <p className={`label-mono mt-2 ${on ? "text-foreground" : ""}`}>0{i + 1} {l}</p>
            </li>
          );
        })}
      </ol>

      {!review ? (
        <div className="mt-10 space-y-10">
          {qs.map((q) => (
            <fieldset key={q}>
              <legend className="text-lg">{q}</legend>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[1, 2, 3, 4, 5, "na" as const].map((v) => {
                  const sel = ev.answers[q] === v;
                  return (
                    <label key={String(v)} className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors focus-within:border-ring ${sel ? "border-foreground bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                      <input type="radio" name={q} className="sr-only" checked={sel}
                        onChange={() => setEv({ ...ev, answers: { ...ev.answers, [q]: v } })} />
                      <span className="font-mono text-lg">{v === "na" ? "N/A" : v}</span>
                      <span className="text-[10px] leading-tight opacity-70">{v === "na" ? "Not applicable" : SCALE[v - 1]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div>
            <label htmlFor="c" className="text-lg">Anything you would like to add about {p.name.split(" ")[0]}?</label>
            {low && <p className="mt-1 text-sm text-destructive">Please tell us why — a comment is required for low ratings.</p>}
            <textarea id="c" rows={4} value={ev.comment} onChange={(e) => setEv({ ...ev, comment: e.target.value })}
              className="mt-3 w-full rounded-md border border-input bg-transparent p-4 outline-none focus:border-ring" />
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => nav({ to: "/vendors" })}>Back</button>
            <button className="btn" disabled={!valid} onClick={() => { setReview(true); scrollTo(0, 0); }}>Next →</button>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          <section className="rounded-md border p-6">
            <div className="flex items-center justify-between">
              <h2 className="label-mono">Your ratings</h2>
              <button className="text-sm underline" onClick={() => setReview(false)}>Edit</button>
            </div>
            <dl className="mt-4 space-y-2">
              {qs.map((q) => (
                <div key={q} className="flex justify-between gap-4 text-sm">
                  <dt className="text-muted-foreground">{q}</dt>
                  <dd className="font-mono">{ev.answers[q] === "na" ? "N/A" : `${ev.answers[q]} / 5`}</dd>
                </div>
              ))}
            </dl>
            {ev.comment && <p className="mt-4 border-t pt-4 text-sm">"{ev.comment}"</p>}
          </section>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setReview(false)}>Back</button>
            <button className="btn" disabled={sending} onClick={submit}>{sending ? "Sending…" : ev.status === "submitted" ? "Update feedback" : "Submit feedback"}</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
