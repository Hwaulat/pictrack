import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Shell } from "@/components/Shell";
import { actions } from "@/lib/store";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vendor Feedback — Enter your access code" },
      { name: "description", content: "Rate your project vendors on Sales and Technical performance in under five minutes." },
      { property: "og:title", content: "Vendor Feedback" },
      { property: "og:description", content: "Rate your project vendors on Sales and Technical performance." },
    ],
  }),
  component: Index,
});

function Index() {
  const nav = useNavigate();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [fails, setFails] = useState(0);
  const locked = fails >= 5;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    if (locked) return;
    if (actions.login(code)) nav({ to: "/vendors" });
    else { setFails((f) => f + 1); setErr("That code didn't work. Check it and try again."); }
  };

  return (
    <Shell>
      <section className="flex min-h-[75vh] flex-col justify-center">
        <p className="label-mono">Feedback window · open</p>
        <h1 className="mt-6 max-w-3xl text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
          Tell us how your vendors performed.
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          Rate each vendor on Sales and Technical. Takes about five minutes per vendor. No account needed.
        </p>
        <form onSubmit={submit} className="mt-12 flex max-w-md flex-col gap-3">
          <label htmlFor="code" className="label-mono">Access code</label>
          <div className="flex gap-2">
            <input
              id="code" value={code} onChange={(e) => setCode(e.target.value)} autoComplete="off"
              placeholder="XXXX-0000"
              className="h-12 flex-1 rounded-full border border-input bg-transparent px-5 font-mono uppercase tracking-widest outline-none focus:border-ring"
            />
            <button className="btn" disabled={!code || locked}>Continue →</button>
          </div>
          <p role="alert" className="min-h-5 text-sm text-destructive">
            {locked ? "Too many attempts. Try again in 15 minutes." : err}
          </p>
          <p className="text-xs text-muted-foreground">Demo codes: <span className="font-mono">DEMO-2026</span> or <span className="font-mono">ACME-1234</span></p>
        </form>
      </section>
    </Shell>
  );
}
