import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { actions, evalKey, person, projectByCode, QUESTIONS, ROLE_LABEL, SCALE, useStore, VENDOR, type Evaluation } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

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
  const { t, lang } = useLanguage();
  const project = projectByCode(s.code);
  const isCompany = personId === "company";
  const p = isCompany
    ? {
        id: "company",
        name: VENDOR,
        role: "company" as const,
        title: lang === "id" ? "Evaluasi Kantor & Layanan Perusahaan" : "Office & Company Evaluation",
      }
    : person(personId);

  const [review, setReview] = useState(false);
  const [ev, setEv] = useState<Evaluation | null>(null);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!project || ev) return;
    setEv(
      s.evals[evalKey(project.id, personId)] ?? {
        projectId: project.id,
        personId,
        answers: {},
        comment: "",
        attentionPoints: "",
        improvementPoints: "",
        status: "draft",
        updatedAt: new Date().toISOString(),
      }
    );
  }, [project, personId, ev, s.evals]);

  useEffect(() => {
    if (ev && ev.status === "draft") actions.save(ev);
  }, [ev]);

  if (!project || !p || (!isCompany && !project.team.includes(p.id)))
    return (
      <Shell>
        <p className="py-20 text-muted-foreground">
          {t.please_enter_code}{" "}
          <Link to="/" className="underline">
            {t.enter_code_link}
          </Link>
        </p>
      </Shell>
    );
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
      <Link to="/vendors" className="label-mono mt-6 inline-block hover:text-foreground">{t.back_to_team}</Link>
      <p className="label-mono mt-6">{VENDOR} · {ROLE_LABEL[p.role]} · {project.name}</p>
      <h1 className="mt-3 text-4xl font-light tracking-tight">{p.name}</h1>
      <p className="text-muted-foreground">{p.title}</p>
      <ol className="mt-8 grid grid-cols-2 gap-2" aria-label="Progress">
        {[t.step_rate, t.step_review].map((l, i) => {
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
          {qs.map((q, qIndex) => {
            const translatedQ = t.questions[p.role][qIndex] ?? q;
            return (
              <fieldset key={q}>
                <legend className="text-lg">{translatedQ}</legend>
                <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-6">
                  {[1, 2, 3, 4, 5, "na" as const].map((v) => {
                    const sel = ev.answers[q] === v;
                    return (
                      <label key={String(v)} className={`flex min-h-16 cursor-pointer flex-col items-center justify-center rounded-md border px-2 py-2 text-center transition-colors focus-within:border-ring ${sel ? "border-foreground bg-primary text-primary-foreground" : "hover:bg-accent"}`}>
                        <input type="radio" name={q} className="sr-only" checked={sel}
                          onChange={() => setEv({ ...ev, answers: { ...ev.answers, [q]: v } })} />
                        <span className="font-mono text-lg">{v === "na" ? "N/A" : v}</span>
                        <span className="text-[10px] leading-tight opacity-70">{v === "na" ? t.not_applicable : t.scale[v - 1]}</span>
                      </label>
                    );
                  })}
                </div>
              </fieldset>
            );
          })}

          {isCompany && (
            <div className="space-y-6 rounded-lg border p-6 bg-card/40">
              <div>
                <label htmlFor="attention" className="text-lg font-medium block">
                  {t.attention_points_label}
                </label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {lang === "id"
                    ? "Tuliskan apa yang perlu diperhatikan, dievaluasi, atau diperbaiki dari operasional & koordinasi Ragdalion."
                    : "Note any specific points of concern, process bottlenecks, or critical areas needing attention."}
                </p>
                <textarea
                  id="attention"
                  rows={3}
                  value={ev.attentionPoints ?? ""}
                  onChange={(e) => setEv({ ...ev, attentionPoints: e.target.value })}
                  placeholder={t.attention_points_placeholder}
                  className="w-full rounded-md border border-input bg-transparent p-3.5 text-sm outline-none focus:border-ring transition-colors"
                />
              </div>

              <div>
                <label htmlFor="improvement" className="text-lg font-medium block">
                  {t.improvement_points_label}
                </label>
                <p className="text-xs text-muted-foreground mt-1 mb-3">
                  {lang === "id"
                    ? "Tuliskan apa yang perlu dikembangkan, ditingkatkan, atau inovasi baru untuk kemitraan ke depan."
                    : "Note any services, team skills, innovations, or enhancements you would like to see developed."}
                </p>
                <textarea
                  id="improvement"
                  rows={3}
                  value={ev.improvementPoints ?? ""}
                  onChange={(e) => setEv({ ...ev, improvementPoints: e.target.value })}
                  placeholder={t.improvement_points_placeholder}
                  className="w-full rounded-md border border-input bg-transparent p-3.5 text-sm outline-none focus:border-ring transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label htmlFor="c" className="text-lg">{t.add_comment_label(isCompany ? VENDOR : (p.name.split(" ")[0] || p.name))}</label>
            {low && <p className="mt-1 text-sm text-destructive">{t.comment_required}</p>}
            <textarea id="c" rows={4} value={ev.comment} onChange={(e) => setEv({ ...ev, comment: e.target.value })}
              className="mt-3 w-full rounded-md border border-input bg-transparent p-4 outline-none focus:border-ring" />
          </div>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => nav({ to: "/vendors" })}>{t.btn_back}</button>
            <button className="btn" disabled={!valid} onClick={() => { setReview(true); scrollTo(0, 0); }}>{t.btn_next}</button>
          </div>
        </div>
      ) : (
        <div className="mt-10 space-y-8">
          <section className="rounded-md border p-6">
            <div className="flex items-center justify-between">
              <h2 className="label-mono">{t.review_title}</h2>
              <button className="text-sm underline" onClick={() => setReview(false)}>{t.btn_edit_answers}</button>
            </div>
            <dl className="mt-4 space-y-2">
              {qs.map((q, qIndex) => {
                const translatedQ = t.questions[p.role][qIndex] ?? q;
                return (
                  <div key={q} className="flex justify-between gap-4 text-sm">
                    <dt className="text-muted-foreground">{translatedQ}</dt>
                    <dd className="font-mono">{ev.answers[q] === "na" ? "N/A" : `${ev.answers[q]} / 5`}</dd>
                  </div>
                );
              })}
            </dl>
            {isCompany && ev.attentionPoints && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-mono text-muted-foreground">{t.attention_points_label}</p>
                <p className="mt-1.5 text-sm rounded bg-muted/40 p-3 text-foreground whitespace-pre-wrap">{ev.attentionPoints}</p>
              </div>
            )}
            {isCompany && ev.improvementPoints && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-mono text-muted-foreground">{t.improvement_points_label}</p>
                <p className="mt-1.5 text-sm rounded bg-muted/40 p-3 text-foreground whitespace-pre-wrap">{ev.improvementPoints}</p>
              </div>
            )}
            {ev.comment && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-mono text-muted-foreground">{t.add_comment_label(isCompany ? VENDOR : p.name)}</p>
                <p className="mt-1 text-sm italic">"{ev.comment}"</p>
              </div>
            )}
          </section>
          <div className="flex justify-between">
            <button className="btn-ghost" onClick={() => setReview(false)}>{t.btn_back}</button>
            <button className="btn" disabled={sending} onClick={submit}>{sending ? t.submitting : t.btn_submit}</button>
          </div>
        </div>
      )}
    </Shell>
  );
}
