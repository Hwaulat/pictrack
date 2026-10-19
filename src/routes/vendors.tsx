import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { actions, evalKey, person, projectByCode, ROLE_LABEL, useStore, VENDOR, type Role } from "@/lib/store";

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
  const project = projectByCode(s.code);
  if (!project) return <Shell><p className="py-20 text-muted-foreground">Please <Link to="/" className="underline">enter your code</Link> first.</p></Shell>;
  const days = Math.ceil((+new Date(project.closesAt) - Date.now()) / 864e5);
  const done = project.team.filter((id) => s.evals[evalKey(project.id, id)]?.status === "submitted").length;

  return (
    <Shell right={<button onClick={() => { actions.logout(); nav({ to: "/" }); }} className="hover:text-foreground">Exit</button>}>
      <p className="label-mono mt-10">{project.customer} · {project.name}</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Your {VENDOR} team</h1>
      <p className="mt-3 text-muted-foreground">
        {done} of {project.team.length} rated · closes {new Date(project.closesAt).toLocaleDateString()} · <span className="text-foreground">{days} days left</span>
      </p>
      {(["sales", "technical"] as Role[]).map((role) => (
        <section key={role} className="mt-12">
          <h2 className="label-mono">{ROLE_LABEL[role]} team</h2>
          <ul className="mt-3 divide-y border-y">
            {project.team.map(person).filter((p) => p?.role === role).map((p) => {
              const e = s.evals[evalKey(project.id, p!.id)];
              const status = e?.status === "submitted" ? "Submitted" : e ? "Draft" : "Not started";
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
                    <span className={`label-mono rounded-full border px-3 py-1 ${status === "Submitted" ? "text-success" : ""}`}>
                      {status === "Submitted" ? "✓ " : status === "Draft" ? "◐ " : "○ "}{status}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </Shell>
  );
}
