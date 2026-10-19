import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { actions, CODES, PROJECT, useStore, VENDORS } from "@/lib/store";

export const Route = createFileRoute("/vendors")({
  head: () => ({
    meta: [
      { title: "Your vendors — Vendor Feedback" },
      { name: "description", content: "See which vendors are waiting for your feedback." },
      { property: "og:title", content: "Your vendors — Vendor Feedback" },
      { property: "og:description", content: "See which vendors are waiting for your feedback." },
    ],
  }),
  component: Vendors,
});

function Vendors() {
  const s = useStore();
  const nav = useNavigate();
  if (!s.code) return <Shell><p className="py-20 text-muted-foreground">Please <Link to="/" className="underline">enter your code</Link> first.</p></Shell>;
  const days = Math.ceil((+new Date(PROJECT.closesAt) - Date.now()) / 864e5);

  return (
    <Shell right={<button onClick={() => { actions.logout(); nav({ to: "/" }); }} className="hover:text-foreground">Exit</button>}>
      <p className="label-mono mt-10">{CODES[s.code]} · {PROJECT.name}</p>
      <h1 className="mt-4 text-4xl font-light tracking-tight sm:text-5xl">Your vendors</h1>
      <p className="mt-3 text-muted-foreground">
        Window closes {new Date(PROJECT.closesAt).toLocaleString()} · <span className="text-foreground">{days} days left</span>
      </p>
      <ul className="mt-10 divide-y border-y">
        {VENDORS.map((v) => {
          const e = s.evals[`${s.code}:${v.id}`];
          const status = e?.status === "submitted" ? "Submitted" : e ? "Draft" : "Not started";
          return (
            <li key={v.id}>
              <Link to="/feedback/$vendorId" params={{ vendorId: v.id }} className="flex items-center justify-between gap-4 py-6 transition-colors hover:bg-card px-2">
                <div>
                  <p className="text-xl">{v.name}</p>
                  <p className="text-sm text-muted-foreground">{v.scope}</p>
                </div>
                <span className={`label-mono rounded-full border px-3 py-1 ${status === "Submitted" ? "text-success" : ""}`}>
                  {status === "Submitted" ? "✓ " : status === "Draft" ? "◐ " : "○ "}{status}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </Shell>
  );
}
