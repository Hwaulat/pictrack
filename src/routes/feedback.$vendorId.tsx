import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, QUESTIONS, SCALE, useStore, VENDORS, CODES, type Area, type Evaluation } from "@/lib/store";

export const Route = createFileRoute("/feedback/$vendorId")({
  head: () => ({
    meta: [
      { title: "Give feedback — Vendor Feedback" },
      { name: "description", content: "Rate a vendor's Sales and Technical teams." },
      { property: "og:title", content: "Give feedback — Vendor Feedback" },
      { property: "og:description", content: "Rate a vendor's Sales and Technical teams." },
    ],
  }),
  component: Feedback,
});

const STEPS = ["Sales", "Technical", "Review"] as const;

function Feedback() {
  const { vendorId } = Route.useParams();
  const s = useStore();
  const nav = useNavigate();
  const vendor = VENDORS.find((v) => v.id === vendorId);
  const [step, setStep] = useState(0);
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!s.code || ev) return;
    setEv(actions.get(vendorId) ?? {
      vendorId, customer: CODES[s.code] ?? "", sales: {}, technical: {}, salesComment: "", technicalComment: "",
      status: "draft", updatedAt: new Date().toISOString(),
    });
  }, [s.code, vendorId, ev]);

  // autosave drafts
  useEffect(() => { if (ev && ev.status === "draft") actions.save(ev); }, [ev]);

  if (!s.code || !vendor) return <Shell><p className="py-20 text-muted-foreground">Please <Link to="/" className="underline">enter your code</Link> first.</p></Shell>;
  if (!ev) return <Shell><div /></Shell>;

  const area: Area | null = step === 0 ? "sales" : step === 1 ? "technical" : null;
  const lowScore = (a: Area) => Object.values(ev[a]).some((v) => v === 1 || v === 2);
  const areaValid = (a: Area) =>
    QUESTIONS[a].every((q) => ev[a][q] !== undefined) &&
    (!lowScore(a) || ev[`${a}Comment`].trim().length > 0);

  const submit = async () => {
    setSending(true);
    await new Promise((r) => setTimeout(r, 600));
    actions.save({ ...ev, status: "submitted", submittedAt: ev.submittedAt ?? new Date().toISOString() });
    nav({ to: "/done" });
  };

  return (
    <Shell>
      <Link to="/vendors" className="label-mono mt-6 inline-block hover:text-foreground">← All vendors</Link>
      <h1 className="mt-4 text-4xl font-light tracking-tight">{vendor.name}</h1>
      <ol className="mt-8 grid grid-cols-3 gap-2" aria-label="Progress">
        {STEPS.map((l, i) => (
          <li key={l} aria-current={i === step ? "step" : undefined}>
            <div className={`h-px ${i <= step ? "bg-foreground" : "bg-border"}`} />
            <p className={`label-mono mt-2 ${i === step ? "text-foreground" : ""}`}>0{i + 1} {l}</p>
          </li>
        ))}
      </ol>

      {area && (
        <div className="mt-10 space-y-10">
          {QUESTIONS[area].map((q) => (
            <fieldset key={q}>
              <legend className="text-lg">{q}</legend>
              <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                {[1, 2, 3, 4, 5, "na" as const].map((v) => {
                  const sel = ev[area][q] === v;
                  return (
                    <label key={String(v)} className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors focus-within:border-ring ${sel ? "border-foreground bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                      <input type="radio" name={q} className="sr-only" checked={sel}
                        onChange={() => setEv({ ...ev, [area]: { ...ev[area], [q]: v } })} />
                      <span className="font-mono text-lg">{v === "na" ? "N/A" : v}</span>
                      <span className="text-[10px] leading-tight opacity-70">{v === "na" ? "Not applicable" : SCALE[v - 1]}</span>
                    </label>
                  );
                })}
              </div>
            </fieldset>
          ))}
          <div>
            <label htmlFor="c" className="text-lg">Anything you would like to add?</label>
            {lowScore(area) && <p className="mt-1 text-sm text-destructive">Please tell us why — a comment is required for low ratings.</p>}
            <textarea id="c" rows={4} value={ev[`${area}Comment`]}
              onChange={(e) => setEv({ ...ev, [`${area}Comment`]: e.target.value })}
              className="mt-3 w-full rounded-md border border-input bg-transparent p-4 outline-none focus:border-ring" />
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => step ? setStep(step - 1) : nav({ to: "/vendors" })}>Back</button>
            <button className="btn" disabled={!areaValid(area)} onClick={() => { setStep(step + 1); scrollTo(0, 0); }}>Next →</button>
          </div>
        </div>
      )}

      {step === 2 && (
        <div className="mt-10 space-y-8">
          {(["sales", "technical"] as Area[]).map((a, i) => (
            <section key={a} className="rounded-md border p-6">
              <div className="flex items-center justify-between">
                <h2 className="label-mono">{a}</h2>
                <button className="text-sm underline" onClick={() => setStep(i)}>Edit</button>
              </div>
              <dl className="mt-4 space-y-2">
                {QUESTIONS[a].map((q) => (
                  <div key={q} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{q}</dt>
                    <dd className="font-mono">{ev[a][q] === "na" ? "N/A" : `${ev[a][q]} / 5`}</dd>
                  </div>
                ))}
              </dl>
              {ev[`${a}Comment`] && <p className="mt-4 border-t pt-4 text-sm">"{ev[`${a}Comment`]}"</p>}
            </section>
          ))}
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setStep(1)}>Back</button>
            <button className="btn" disabled={sending} onClick={submit}>{sending ? "Sending…" : ev.status === "submitted" ? "Update feedback" : "Submit feedback"}</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
