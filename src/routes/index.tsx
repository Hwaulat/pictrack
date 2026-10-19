import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { ShieldAlert, Lock, ArrowRight, Loader2 } from "lucide-react";
import { Shell } from "@/components/Shell";
import { actions, useStore } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Ragdalion Feedback — Enter your access code" },
      { name: "description", content: "Rate your project vendors on Sales and Technical performance in under five minutes." },
      { property: "og:title", content: "Vendor Feedback" },
      { property: "og:description", content: "Rate your project vendors on Sales and Technical performance." },
    ],
  }),
  component: Index,
});

function Index() {
  const nav = useNavigate();
  const s = useStore();
  const { t } = useLanguage();
  const [code, setCode] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  const isLocked = Boolean(s.authLockoutUntil && s.authLockoutUntil > Date.now());

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLocked || loading || !code.trim()) return;

    setLoading(true);
    setErr("");

    try {
      const res = await actions.login(code);
      if (res.success) {
        nav({ to: "/vendors" });
      } else {
        setErr(res.error || t.code_invalid);
      }
    } catch {
      setErr(t.code_invalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <section className="flex min-h-[75vh] flex-col justify-center">
        <div className="flex items-center gap-2">
          <p className="label-mono">{t.window_open}</p>
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
            <Lock className="size-2.5" /> RLS Secure
          </span>
        </div>
        <h1 className="mt-6 max-w-3xl text-5xl font-light leading-[1.05] tracking-tight sm:text-7xl">
          {t.index_title}
        </h1>
        <p className="mt-6 max-w-xl text-lg text-muted-foreground">
          {t.index_desc}
        </p>

        <form onSubmit={submit} className="mt-12 flex max-w-md flex-col gap-3">
          <label htmlFor="code" className="label-mono flex items-center justify-between">
            <span>{t.access_code}</span>
            {s.authAttemptsLeft < 5 && !isLocked && (
              <span className="text-[11px] font-normal text-amber-500">
                {t.attempts_remaining(s.authAttemptsLeft)}
              </span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              id="code"
              value={code}
              onChange={(e) => {
                setCode(e.target.value);
                if (err) setErr("");
              }}
              disabled={isLocked || loading}
              autoComplete="off"
              maxLength={12}
              placeholder={t.code_placeholder}
              className="h-12 flex-1 rounded-full border border-input bg-transparent px-5 font-mono uppercase tracking-widest outline-none focus:border-ring disabled:opacity-50"
            />
            <button
              type="submit"
              className="btn min-w-[120px]"
              disabled={!code.trim() || isLocked || loading}
            >
              {loading ? (
                <span className="flex items-center gap-1.5">
                  <Loader2 className="size-4 animate-spin" /> ...
                </span>
              ) : (
                <span className="flex items-center gap-1">
                  {t.continue_btn}
                </span>
              )}
            </button>
          </div>

          {/* Security alert / Error message */}
          {(isLocked || err) && (
            <div
              role="alert"
              className={`mt-1 flex items-start gap-2 rounded-lg p-3 text-xs ${
                isLocked
                  ? "border border-destructive/30 bg-destructive/10 text-destructive"
                  : "text-destructive"
              }`}
            >
              <ShieldAlert className="mt-0.5 size-4 shrink-0" />
              <span>{isLocked ? t.too_many_attempts : err}</span>
            </div>
          )}

          {/* Database empty note if no projects configured yet */}
          {s.projects.length === 0 && (
            <p className="mt-2 text-xs text-muted-foreground/80">
              {t.no_projects_yet}
            </p>
          )}
        </form>
      </section>
    </Shell>
  );
}
