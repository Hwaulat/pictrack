import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import {
  Copy,
  Check,
  Key,
  Users,
  FolderKanban,
  Plus,
  Shield,
  ShieldAlert,
  Lock,
  Unlock,
  Trash2,
  Loader2,
} from "lucide-react";
import { Shell } from "@/components/Shell";
import { avg, evalKey, ROLE_LABEL, useStore, VENDOR, actions, type Role } from "@/lib/store";
import { useLanguage } from "@/lib/i18n";
import { AddCustomerDialog } from "@/components/AddCustomerDialog";
import { AddUserDialog } from "@/components/AddUserDialog";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Team performance & management — Ragdalion Feedback" },
      { name: "description", content: "Monitor each Ragdalion sales and technical team member and manage customers and PINs." },
      { property: "og:title", content: "Team performance & management — Ragdalion Feedback" },
      { property: "og:description", content: "Monitor team members and manage customer access PINs." },
    ],
  }),
  component: AdminPage,
});

const THRESHOLD = 3;

function Score({ v }: { v: number }) {
  return (
    <div className="flex items-center gap-3">
      <div className="h-1 w-24 bg-muted">
        <div
          className={`h-1 ${v && v < THRESHOLD ? "bg-destructive" : "bg-foreground"}`}
          style={{ width: `${(v / 5) * 100}%` }}
        />
      </div>
      <span className="w-14 font-mono">
        {v ? v.toFixed(1) : "—"}
        {v && v < THRESHOLD ? " ⚠" : ""}
      </span>
    </div>
  );
}

// -------------------------------------------------------------
// Admin Security Gate Component
// -------------------------------------------------------------
function AdminSecurityGate() {
  const { t } = useLanguage();
  const [passcode, setPasscode] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passcode || loading) return;

    setLoading(true);
    setErrorMsg("");

    try {
      const res = await actions.loginAdmin(passcode);
      if (res.success) {
        toast.success("Akses administrator berhasil dibuka.");
      } else {
        setErrorMsg(res.error || t.admin_passcode_invalid);
        toast.error(res.error || t.admin_passcode_invalid);
      }
    } catch {
      setErrorMsg(t.admin_passcode_invalid);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Shell>
      <div className="flex min-h-[70vh] flex-col items-center justify-center">
        <div className="w-full max-w-md rounded-2xl border border-border bg-card/60 p-8 shadow-sm backdrop-blur">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-full bg-foreground text-background">
              <Shield className="size-5" />
            </div>
            <div>
              <p className="label-mono text-[11px] text-muted-foreground">Admin Security</p>
              <h1 className="text-xl font-light tracking-tight">{t.admin_auth_title}</h1>
            </div>
          </div>

          <p className="mt-4 text-xs text-muted-foreground leading-relaxed">
            {t.admin_auth_desc}
          </p>

          <form onSubmit={handleLogin} className="mt-6 space-y-4">
            <div>
              <label htmlFor="admin-passcode" className="label-mono block mb-1.5 text-xs">
                {t.admin_passcode_label}
              </label>
              <div className="relative">
                <input
                  id="admin-passcode"
                  type="password"
                  value={passcode}
                  onChange={(e) => {
                    setPasscode(e.target.value);
                    if (errorMsg) setErrorMsg("");
                  }}
                  autoComplete="current-password"
                  placeholder={t.admin_passcode_placeholder}
                  className="h-11 w-full rounded-lg border border-input bg-transparent px-3.5 pr-10 font-mono text-sm tracking-wider outline-none focus:border-ring"
                />
                <Lock className="absolute right-3.5 top-3 size-4 text-muted-foreground" />
              </div>
            </div>

            {errorMsg && (
              <div className="flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/10 p-2.5 text-xs text-destructive">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" />
                <span>{errorMsg}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={!passcode || loading}
              className="btn w-full h-11 text-sm justify-center"
            >
              {loading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="size-4 animate-spin" /> Verifying...
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Unlock className="size-4" /> {t.admin_login_btn}
                </span>
              )}
            </button>
          </form>
        </div>
      </div>
    </Shell>
  );
}

// -------------------------------------------------------------
// Main Admin Dashboard
// -------------------------------------------------------------
function AdminPage() {
  const s = useStore();
  const { t, lang } = useLanguage();
  const [activeTab, setActiveTab] = useState<"overview" | "customers" | "team">("overview");
  const [role, setRole] = useState<Role | "all">("all");
  const [open, setOpen] = useState<string | null>(null);
  const [copiedPin, setCopiedPin] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  // If not authenticated as Admin, show Security Gate
  if (!s.isAdminAuthenticated) {
    return <AdminSecurityGate />;
  }

  const submitted = Object.values(s.evals).filter((e) => e.status === "submitted");
  const invited = s.projects.reduce((n, p) => n + p.team.length + 1, 0);

  const companyEvals = submitted.filter((e) => e.personId === "company");
  const companyAvgScore = companyEvals.length
    ? companyEvals.reduce((total, e) => total + avg(e.answers), 0) / companyEvals.length
    : 0;

  const people = s.people
    .filter((p) => role === "all" || p.role === role)
    .map((p) => {
      const projects = s.projects.filter((pr) => pr.team.includes(p.id));
      const es = submitted.filter((e) => e.personId === p.id);
      return {
        ...p,
        projects,
        es,
        score: es.length ? es.reduce((total, e) => total + avg(e.answers), 0) / es.length : 0,
      };
    });

  const copyPin = (pin: string) => {
    navigator.clipboard.writeText(pin);
    setCopiedPin(pin);
    toast.success(`${t.toast_pin_copied} (${pin})`);
    setTimeout(() => setCopiedPin(null), 2000);
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await actions.refreshFromDatabase();
    toast.success("Data berhasil disinkronisasi.");
    setRefreshing(false);
  };

  const handleDeleteCustomer = (id: string, name: string) => {
    actions.deleteCustomer(id);
    toast.success(`Proyek "${name}" berhasil dihapus.`);
  };

  const handleDeletePerson = (id: string, name: string) => {
    actions.deletePerson(id);
    toast.success(`Anggota tim "${name}" berhasil dihapus.`);
  };

  return (
    <Shell>
      {/* Top Header */}
      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="label-mono">{t.admin_tag}</p>
          <h1 className="mt-2 text-3xl font-light tracking-tight sm:text-5xl">{t.admin_title}</h1>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <AddCustomerDialog
            trigger={
              <button className="btn text-xs sm:text-sm px-3.5 h-9">
                <Plus className="size-3.5 mr-1" /> {t.add_customer}
              </button>
            }
          />
          <AddUserDialog
            trigger={
              <button className="btn-ghost text-xs sm:text-sm px-3.5 h-9">
                <Plus className="size-3.5 mr-1" /> {t.add_team_member}
              </button>
            }
          />
        </div>
      </div>

      {/* Main Admin Navigation Tabs */}
      <div className="mt-8 border-b pb-4">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)}>
          <TabsList className="h-9 rounded-full bg-muted/40 p-1 border border-input/60">
            <TabsTrigger
              value="overview"
              className="rounded-full px-4 text-xs font-mono font-medium data-[state=active]:bg-foreground data-[state=active]:text-background cursor-pointer"
            >
              <FolderKanban className="size-3.5 mr-1.5 inline" /> {t.tab_overview}
            </TabsTrigger>
            <TabsTrigger
              value="customers"
              className="rounded-full px-4 text-xs font-mono font-medium data-[state=active]:bg-foreground data-[state=active]:text-background cursor-pointer"
            >
              <Key className="size-3.5 mr-1.5 inline" /> {t.tab_customers} ({s.projects.length})
            </TabsTrigger>
            <TabsTrigger
              value="team"
              className="rounded-full px-4 text-xs font-mono font-medium data-[state=active]:bg-foreground data-[state=active]:text-background cursor-pointer"
            >
              <Users className="size-3.5 mr-1.5 inline" /> {t.tab_team} ({s.people.length})
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* TAB 1: OVERVIEW & PERFORMANCE */}
      {activeTab === "overview" && (
        <section className="mt-8 space-y-12">
          {/* KPI Stat Cards */}
          <div className="grid grid-cols-1 divide-y sm:grid-cols-3 sm:divide-x sm:divide-y-0 border-y">
            {[
              [t.stat_projects, s.projects.length],
              [t.stat_ratings_expected, invited],
              [t.stat_submitted, submitted.length],
            ].map(([label, count]) => (
              <div key={String(label)} className="p-5">
                <p className="label-mono">{label}</p>
                <p className="mt-2 font-mono text-4xl font-light">{count}</p>
              </div>
            ))}
          </div>

          {/* Projects Quick View */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <h2 className="label-mono">{t.section_projects}</h2>
              <button
                onClick={() => setActiveTab("customers")}
                className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer"
              >
                View all PINs →
              </button>
            </div>

            {s.projects.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <p className="font-light">{t.no_projects_yet}</p>
              </div>
            ) : (
              <ul className="divide-y border-y">
                {s.projects.map((pr) => {
                  const companyOk = s.evals[evalKey(pr.id, "company")]?.status === "submitted";
                  const teamDone = pr.team.filter(
                    (id) => s.evals[evalKey(pr.id, id)]?.status === "submitted",
                  ).length;
                  const done = teamDone + (companyOk ? 1 : 0);
                  const total = pr.team.length + 1;
                  return (
                    <li key={pr.id} className="flex flex-wrap items-center justify-between gap-3 py-4">
                      <div>
                        <p className="font-medium">{pr.name}</p>
                        <p className="text-sm text-muted-foreground">
                          {pr.customer} · {lang === "id" ? "ditutup" : "closes"}{" "}
                          {new Date(pr.closesAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US")}
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-xs rounded border border-border px-2 py-0.5 bg-muted/30">
                          PIN: {pr.pin || pr.code}
                        </span>
                        <span className="font-mono text-sm">
                          {done}/{total} {t.rated_count}
                        </span>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          {/* People Performance List */}
          <div>
            <div className="flex items-end justify-between gap-4 mb-3">
              <h2 className="label-mono">{t.section_people}</h2>
              <div className="flex gap-1 rounded-full border p-1 text-sm">
                {(["all", "sales", "technical"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className={`rounded-full px-4 py-1 text-xs font-mono transition-colors cursor-pointer ${
                      role === r
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "all" ? t.filter_all : r === "sales" ? t.filter_sales : t.filter_technical}
                  </button>
                ))}
              </div>
            </div>

            {people.length === 0 ? (
              <div className="rounded-xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                <p className="font-light">{t.no_team_yet}</p>
              </div>
            ) : (
              <ul className="divide-y border-y">
                {people.map((p) => (
                  <li key={p.id}>
                    <button
                      onClick={() => setOpen(open === p.id ? null : p.id)}
                      aria-expanded={open === p.id}
                      className="flex w-full flex-wrap items-center justify-between gap-4 px-2 py-5 text-left hover:bg-card transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <span className="flex size-9 items-center justify-center rounded-full border font-mono text-xs">
                          {p.name.split(" ").map((w) => w[0]).join("")}
                        </span>
                        <div>
                          <p className="text-lg font-normal">{p.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {p.role === "sales" ? t.filter_sales : t.filter_technical} · {p.title} ·{" "}
                            {p.projects.length} {t.projects_count} · {p.es.length} {t.ratings_count}
                          </p>
                        </div>
                      </div>
                      <Score v={p.score} />
                    </button>

                    {open === p.id && (
                      <div className="space-y-3 px-2 pb-6 pt-2">
                        {p.projects.length === 0 ? (
                          <p className="text-xs text-muted-foreground pl-12">{t.no_projects_assigned}</p>
                        ) : (
                          p.projects.map((pr) => {
                            const e = s.evals[evalKey(pr.id, p.id)];
                            const ok = e?.status === "submitted";
                            return (
                              <div key={pr.id} className="rounded-md border p-4 bg-muted/10">
                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <p className="label-mono">
                                    {pr.name} · {pr.customer}
                                  </p>
                                  {ok ? (
                                    <Score v={avg(e.answers)} />
                                  ) : (
                                    <span className="label-mono">
                                      {e ? `◐ ${t.status_draft}` : `○ ${t.score_waiting}`}
                                    </span>
                                  )}
                                </div>
                                {ok && (
                                  <dl className="mt-3 grid gap-1 text-sm sm:grid-cols-2">
                                    {Object.entries(e.answers).map(([q, v]) => (
                                      <div key={q} className="flex justify-between gap-3">
                                        <dt className="text-muted-foreground">{q}</dt>
                                        <dd className="font-mono">{v === "na" ? "N/A" : v}</dd>
                                      </div>
                                    ))}
                                  </dl>
                                )}
                                {ok && e.comment && (
                                  <p className="mt-3 border-t pt-3 text-sm italic text-foreground/90">
                                    "{e.comment}"
                                  </p>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-3 text-xs text-muted-foreground">{t.admin_footnote}</p>
          </div>

          {/* Company / Office Evaluation Section */}
          <div className="rounded-xl border border-border bg-card/40 p-6 space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xl">🏢</span>
                  <h2 className="text-xl font-normal">{t.section_company_eval}</h2>
                </div>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t.company_eval_subtitle}
                </p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="label-mono text-[10px] text-muted-foreground">{t.filter_all} {t.ratings_count}</p>
                  <p className="font-mono text-sm">{companyEvals.length} / {s.projects.length} {t.rated_count}</p>
                </div>
                <div className="rounded-lg border px-4 py-2 bg-background/50">
                  <p className="label-mono text-[10px] text-muted-foreground">Avg Score</p>
                  <div className="mt-1">
                    <Score v={companyAvgScore} />
                  </div>
                </div>
              </div>
            </div>

            {companyEvals.length === 0 ? (
              <div className="rounded-lg border border-dashed p-6 text-center text-xs text-muted-foreground">
                <p>{t.no_company_evals}</p>
              </div>
            ) : (
              <div className="space-y-4">
                {companyEvals.map((ce) => {
                  const pr = s.projects.find((p) => p.id === ce.projectId);
                  const clientName = pr ? `${pr.customer} — ${pr.name}` : ce.projectId;
                  const score = avg(ce.answers);
                  const cleanAnswers = Object.entries(ce.answers).filter(
                    ([k]) => !k.startsWith("_")
                  );
                  return (
                    <div key={ce.projectId} className="rounded-lg border p-5 bg-card/60 space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3 border-b pb-3">
                        <div>
                          <p className="font-medium text-base">{clientName}</p>
                          <p className="text-xs text-muted-foreground">
                            {ce.submittedAt
                              ? new Date(ce.submittedAt).toLocaleDateString(lang === "id" ? "id-ID" : "en-US")
                              : ""}
                          </p>
                        </div>
                        <Score v={score} />
                      </div>

                      {/* Answer Breakdown */}
                      <dl className="grid gap-2 text-xs sm:grid-cols-2">
                        {cleanAnswers.map(([q, v]) => (
                          <div key={q} className="flex justify-between gap-3 bg-muted/30 px-3 py-2 rounded">
                            <dt className="text-muted-foreground truncate">{q}</dt>
                            <dd className="font-mono font-medium">{v === "na" ? "N/A" : `${v}/5`}</dd>
                          </div>
                        ))}
                      </dl>

                      {/* Points of Attention (Apa yang perlu diperhatikan) */}
                      {ce.attentionPoints && (
                        <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-4 text-xs">
                          <p className="label-mono text-amber-600 dark:text-amber-400 font-semibold mb-1 flex items-center gap-1.5">
                            <span>⚠️</span> {t.attention_points_label}
                          </p>
                          <p className="whitespace-pre-wrap text-foreground/90 mt-1 leading-relaxed">{ce.attentionPoints}</p>
                        </div>
                      )}

                      {/* Improvement / Development Points (Apa yang perlu dikembangkan) */}
                      {ce.improvementPoints && (
                        <div className="rounded-lg border border-blue-500/30 bg-blue-500/5 p-4 text-xs">
                          <p className="label-mono text-blue-600 dark:text-blue-400 font-semibold mb-1 flex items-center gap-1.5">
                            <span>🚀</span> {t.improvement_points_label}
                          </p>
                          <p className="whitespace-pre-wrap text-foreground/90 mt-1 leading-relaxed">{ce.improvementPoints}</p>
                        </div>
                      )}

                      {/* General Comment */}
                      {ce.comment && (
                        <div className="border-t pt-2.5 text-xs text-muted-foreground italic">
                          "{ce.comment}"
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </section>
      )}

      {/* TAB 2: CUSTOMERS & PINS */}
      {activeTab === "customers" && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-light tracking-tight">{t.tab_customers}</h2>
              <p className="text-sm text-muted-foreground">
                Manage customer access codes. Customers use their auto-generated PIN to log in.
              </p>
            </div>
            <AddCustomerDialog />
          </div>

          {s.projects.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <Key className="mx-auto size-8 text-muted-foreground/60 mb-2" />
              <p className="text-base font-medium text-foreground">{t.no_customers_found}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t.no_projects_yet}
              </p>
            </div>
          ) : (
            <div className="divide-y border-y">
              {s.projects.map((pr) => {
                const days = Math.ceil((+new Date(pr.closesAt) - Date.now()) / 864e5);
                const companyOk = s.evals[evalKey(pr.id, "company")]?.status === "submitted";
                const teamDone = pr.team.filter(
                  (id) => s.evals[evalKey(pr.id, id)]?.status === "submitted",
                ).length;
                const done = teamDone + (companyOk ? 1 : 0);
                const totalRatings = pr.team.length + 1;
                const activePin = pr.pin || pr.code;
                const isCopied = copiedPin === activePin;

                return (
                  <div key={pr.id} className="py-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-lg font-medium">{pr.customer}</h3>
                        <span className="label-mono text-[10px] text-muted-foreground">
                          {days > 0 ? `${days}d left` : "Closed"}
                        </span>
                      </div>
                      <p className="text-sm text-foreground/90">{pr.name}</p>

                      {/* Team avatars & Company eval badge */}
                      <div className="flex flex-wrap items-center gap-1.5 pt-1">
                        <span className="text-xs text-muted-foreground mr-1">Evaluations:</span>
                        <span
                          title="Evaluasi Ragdalion / Kantor"
                          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border bg-card/60"
                        >
                          🏢 {VENDOR}
                          {companyOk && <span className="text-success text-[10px]">✓</span>}
                        </span>
                        {pr.team.map((personId) => {
                          const p = s.people.find((x) => x.id === personId);
                          if (!p) return null;
                          const isSubmitted = s.evals[evalKey(pr.id, p.id)]?.status === "submitted";
                          return (
                            <span
                              key={p.id}
                              title={`${p.name} (${ROLE_LABEL[p.role]} - ${p.title})`}
                              className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] border ${
                                p.role === "sales"
                                  ? "bg-accent/40 border-border"
                                  : "bg-muted/60 border-border"
                              }`}
                            >
                              {p.name.split(" ")[0]}
                              {isSubmitted && <span className="text-success text-[10px]">✓</span>}
                            </span>
                          );
                        })}
                      </div>
                    </div>

                    {/* PIN & Status Badge & Delete */}
                    <div className="flex items-center gap-4 shrink-0">
                      <div className="flex flex-col items-end gap-1">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                          {t.pin_col}
                        </span>
                        <div className="flex items-center gap-1.5 rounded-full border border-input bg-card px-3 py-1 font-mono text-sm font-semibold tracking-wider">
                          <span>{activePin}</span>
                          <button
                            type="button"
                            onClick={() => copyPin(activePin)}
                            className="text-muted-foreground hover:text-foreground cursor-pointer p-0.5"
                            title={t.copy_pin}
                          >
                            {isCopied ? (
                              <Check className="size-3.5 text-success" />
                            ) : (
                              <Copy className="size-3.5" />
                            )}
                          </button>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-1 pl-3 border-l">
                        <span className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                          {t.status_col}
                        </span>
                        <span className="font-mono text-sm">
                          {done}/{totalRatings}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={() => handleDeleteCustomer(pr.id, pr.name)}
                        className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                        title="Delete project"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>
      )}

      {/* TAB 3: TEAM MEMBERS */}
      {activeTab === "team" && (
        <section className="mt-8 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-2xl font-light tracking-tight">{t.tab_team}</h2>
              <p className="text-sm text-muted-foreground">
                Manage sales and technical team members and their assigned projects.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <div className="flex gap-1 rounded-full border p-1 text-sm">
                {(["all", "sales", "technical"] as const).map((r) => (
                  <button
                    key={r}
                    onClick={() => setRole(r)}
                    aria-pressed={role === r}
                    className={`rounded-full px-3 py-1 text-xs font-mono transition-colors cursor-pointer ${
                      role === r
                        ? "bg-primary text-primary-foreground font-semibold"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {r === "all" ? t.filter_all : r === "sales" ? t.filter_sales : t.filter_technical}
                  </button>
                ))}
              </div>
              <AddUserDialog />
            </div>
          </div>

          {people.length === 0 ? (
            <div className="rounded-xl border border-dashed p-12 text-center text-muted-foreground">
              <Users className="mx-auto size-8 text-muted-foreground/60 mb-2" />
              <p className="text-base font-medium text-foreground">{t.no_members_found}</p>
              <p className="text-xs text-muted-foreground mt-1 max-w-sm mx-auto">
                {t.no_team_yet}
              </p>
            </div>
          ) : (
            <div className="divide-y border-y">
              {people.map((p) => (
                <div key={p.id} className="py-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <span className="flex size-10 items-center justify-center rounded-full border font-mono text-xs font-medium">
                      {p.name.split(" ").map((w) => w[0]).join("")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-base font-medium">{p.name}</p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-mono uppercase tracking-wider border ${
                            p.role === "sales"
                              ? "bg-accent/40 border-border text-foreground"
                              : "bg-muted/60 border-border text-muted-foreground"
                          }`}
                        >
                          {p.role}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground">{p.title}</p>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-4">
                    <div className="text-left md:text-right">
                      <p className="text-[10px] uppercase font-mono tracking-wider text-muted-foreground">
                        {t.assigned_projects} ({p.projects.length})
                      </p>
                      <div className="flex flex-wrap gap-1 mt-1 justify-start md:justify-end">
                        {p.projects.length === 0 ? (
                          <span className="text-xs text-muted-foreground italic">
                            {t.no_projects_assigned}
                          </span>
                        ) : (
                          p.projects.map((pr) => (
                            <span
                              key={pr.id}
                              className="font-mono text-[11px] rounded bg-muted/40 border border-border px-2 py-0.5"
                            >
                              {pr.customer}
                            </span>
                          ))
                        )}
                      </div>
                    </div>

                    <div className="border-l pl-4">
                      <Score v={p.score} />
                      <p className="text-[10px] text-muted-foreground font-mono mt-1 text-right">
                        {p.es.length} ratings
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => handleDeletePerson(p.id, p.name)}
                      className="text-muted-foreground hover:text-destructive p-1 transition-colors cursor-pointer"
                      title="Delete team member"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </Shell>
  );
}
