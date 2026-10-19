import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { actions, evalKey, person, projectByCode, ROLE_LABEL, useStore, VENDOR, type Role } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Your project team — Ragdalion Feedback" },
      { name: "description", content: "Rate each Ragdalion sales and technical team member on your project." },
      { property: "og:title", content: "Your project team — Ragdalion Feedback" },
      { property: "og:description", content: "Rate each Ragdalion team member on your project." },
    ],
  }),
  component: Team,
});

function Team() {
  const s = useStore();
  const nav = useNavigate();
  const { t, lang } = useLanguage();
  const project = projectByCode(s.code);
  if (!project) return <Shell><p className="py-20 text-muted-foreground">{t.please_enter_code} <Link to="/" className="underline">{t.enter_code_link}</Link></p></Shell>;
  const days = Math.ceil((+new Date(project.closesAt) - Date.now()) / 864e5);
  const companyEval = s.evals[evalKey(project.id, "company")];
  const companyDone = companyEval?.status === "submitted";
  const teamDone = project.team.filter((id) => s.evals[evalKey(project.id, id)]?.status === "submitted").length;
  const done = teamDone + (companyDone ? 1 : 0);
  const total = project.team.length + 1;

  return (
    <Shell right={<button onClick={() => { actions.logout(); nav({ to: "/" }); }} className="hover:text-foreground">{t.exit}</button>}>
      <p className="label-mono mt-10">{project.customer} · {project.name}</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">{t.your_team(VENDOR)}</h1>
      <p className="mt-3 text-muted-foreground">
        {t.rated_progress(done, total, new Date(project.closesAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US"), days)}
      </p>

      {/* Ragdalion / Office Evaluation Section */}
      <section className="mt-12">
        <h2 className="label-mono">{t.company_team}</h2>
        <div className="mt-3 divide-y border-y">
          <Link
            to="/feedback/$personId"
            params={{ personId: "company" }}
            className="flex items-center justify-between gap-4 px-2 py-5 transition-colors hover:bg-card"
          >
            <div className="flex items-center gap-4">
              <span className="flex size-10 items-center justify-center rounded-full border font-mono text-base bg-muted/30">
                🏢
              </span>
              <div>
                <p className="text-lg font-medium">{t.company_eval_card_title(VENDOR)}</p>
                <p className="text-sm text-muted-foreground">{t.company_eval_card_desc}</p>
              </div>
            </div>
            <span className={`label-mono rounded-full border px-3 py-1 shrink-0 ${companyDone ? "text-success border-success/30" : ""}`}>
              {companyDone ? "✓ " : companyEval ? "◐ " : "○ "}
              {companyDone ? t.status_submitted : companyEval ? t.status_draft : t.status_not_started}
            </span>
          </Link>
        </div>
      </section>

      {(["sales", "technical"] as Role[]).map((role) => {
        const members = project.team.map(person).filter((p) => p?.role === role);
        return (
          <section key={role} className="mt-12">
            <h2 className="label-mono">{role === "sales" ? t.sales_team : t.technical_team}</h2>
            {members.length === 0 ? (
              <p className="py-4 text-xs text-muted-foreground italic border-y mt-3">
                {t.no_team_assigned}
              </p>
            ) : (
              <ul className="mt-3 divide-y border-y">
                {members.map((p) => {
                  const e = s.evals[evalKey(project.id, p!.id)];
                  const statusText = e?.status === "submitted" ? t.status_submitted : e ? t.status_draft : t.status_not_started;
                  const isSubmitted = e?.status === "submitted";
                  return (
                    <li key={p!.id}>
                      <Link to="/feedback/$personId" params={{ personId: p!.id }} className="flex items-center justify-between gap-4 px-2 py-5 transition-colors hover:bg-card">
                        <div className="flex items-center gap-4">
                          <span className="flex size-10 items-center justify-center rounded-full border font-mono text-xs">
                            {p!.name.split(" ").map((w) => w[0]).join("")}
                          </span>
                          <div>
                            <p className="text-lg">{p!.name}</p>
                            <p className="text-sm text-muted-foreground">{p!.title}</p>
                          </div>
                        </div>
                        <span className={`label-mono rounded-full border px-3 py-1 ${isSubmitted ? "text-success border-success/30" : ""}`}>
                          {isSubmitted ? "✓ " : e ? "◐ " : "○ "}{statusText}
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        );
      })}
    </Shell>
  );
}
