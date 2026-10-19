import { useState, useEffect } from "react";
import { toast } from "sonner";
import {
  Database,
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  RefreshCw,
  ExternalLink,
  KeyRound,
  ShieldCheck,
  Server,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  getStoredSupabaseCredentials,
  saveSupabaseCredentials,
  clearCustomSupabaseCredentials,
  checkSupabaseConnection,
  type SupabaseStatus,
} from "@/lib/supabase";
import { actions, useStore } from "@/lib/store";

export function DatabaseSettingsDialog({ trigger }: { trigger?: React.ReactNode }) {
  const s = useStore();
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState("");
  const [key, setKey] = useState("");
  const [testing, setTesting] = useState(false);
  const [status, setStatus] = useState<SupabaseStatus>(s.supabaseStatus);
  const [copiedSchema, setCopiedSchema] = useState(false);

  useEffect(() => {
    if (open) {
      const creds = getStoredSupabaseCredentials();
      setUrl(creds.url);
      setKey(creds.key);
      setStatus(s.supabaseStatus);
    }
  }, [open, s.supabaseStatus]);

  const handleTestAndSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setTesting(true);

    try {
      if (url.trim() && key.trim()) {
        saveSupabaseCredentials(url.trim(), key.trim());
      }

      const res = await checkSupabaseConnection();
      setStatus(res);

      if (res.connected) {
        toast.success("Koneksi Supabase berhasil terhubung!");
        await actions.refreshFromDatabase();
      } else {
        toast.error(res.message);
      }
    } catch (err: any) {
      toast.error(`Gagal menghubungkan: ${err?.message || "Periksa URL & Key"}`);
    } finally {
      setTesting(false);
    }
  };

  const handleClear = async () => {
    clearCustomSupabaseCredentials();
    setUrl("");
    setKey("");
    const res = await checkSupabaseConnection();
    setStatus(res);
    toast.info("Kredensial kustom dihapus. Beralih ke penyimpanan lokal.");
  };

  const copySqlSchema = () => {
    const sqlSchema = `-- ==============================================================================
-- PIC TRACK / RAGDALION FEEDBACK - SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_pin ON public.projects(pin);

CREATE TABLE IF NOT EXISTS public.people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sales', 'technical')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_people (
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (project_id, person_id)
);
CREATE INDEX IF NOT EXISTS idx_project_people_proj ON public.project_people(project_id);
CREATE INDEX IF NOT EXISTS idx_project_people_person ON public.project_people(person_id);

CREATE TABLE IF NOT EXISTS public.evaluations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES public.people(id) ON DELETE CASCADE,
  answers JSONB NOT NULL DEFAULT '{}'::jsonb,
  comment TEXT DEFAULT '',
  status TEXT NOT NULL CHECK (status IN ('draft', 'submitted')) DEFAULT 'draft',
  submitted_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  CONSTRAINT unique_project_person UNIQUE (project_id, person_id)
);
CREATE INDEX IF NOT EXISTS idx_evaluations_lookup ON public.evaluations(project_id, person_id);

CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  identifier TEXT PRIMARY KEY,
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow anon read people" ON public.people;
CREATE POLICY "Allow anon read people" ON public.people FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read project_people" ON public.project_people;
CREATE POLICY "Allow anon read project_people" ON public.project_people FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon read evaluations" ON public.evaluations;
CREATE POLICY "Allow anon read evaluations" ON public.evaluations FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon insert/update evaluations" ON public.evaluations;
CREATE POLICY "Allow anon insert/update evaluations" ON public.evaluations FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon read basic projects" ON public.projects;
CREATE POLICY "Allow anon read basic projects" ON public.projects FOR SELECT TO anon, authenticated USING (true);
DROP POLICY IF EXISTS "Allow anon all projects" ON public.projects;
CREATE POLICY "Allow anon all projects" ON public.projects FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon all people" ON public.people;
CREATE POLICY "Allow anon all people" ON public.people FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
DROP POLICY IF EXISTS "Allow anon all project_people" ON public.project_people;
CREATE POLICY "Allow anon all project_people" ON public.project_people FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);
`;

    navigator.clipboard.writeText(sqlSchema);
    setCopiedSchema(true);
    toast.success("Skrip skema SQL disalin! Tempel di SQL Editor Supabase.");
    setTimeout(() => setCopiedSchema(false), 2500);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <button
            type="button"
            className="btn-ghost text-xs px-3 h-9 flex items-center gap-1.5 cursor-pointer"
          >
            <Database className="size-3.5" />
            <span>Database</span>
          </button>
        )}
      </DialogTrigger>

      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <Database className="size-4" />
            </div>
            <div>
              <DialogTitle className="text-lg font-light tracking-tight">
                Integrasi Database Supabase
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Hubungkan cloud database Supabase untuk sinkronisasi proyek, tim, dan rating feedback secara real-time.
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        {/* Status Indicator Banner */}
        <div
          className={`mt-3 flex items-start gap-3 rounded-xl border p-4 text-xs ${
            status.connected
              ? "border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-300"
              : status.configured
                ? "border-amber-500/30 bg-amber-500/5 text-amber-800 dark:text-amber-300"
                : "border-border bg-muted/30 text-muted-foreground"
          }`}
        >
          {status.connected ? (
            <CheckCircle2 className="mt-0.5 size-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
          ) : (
            <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-500" />
          )}
          <div className="flex-1 space-y-1">
            <p className="font-semibold">
              {status.connected
                ? "Supabase Terhubung & Aktif"
                : status.configured
                  ? "Kredensial Ditemukan, Menunggu Sinkronisasi"
                  : "Mode Penyimpanan Lokal (Offline Ready)"}
            </p>
            <p className="text-[11px] leading-relaxed opacity-90">{status.message}</p>
          </div>
        </div>

        {/* Form Inputs */}
        <form onSubmit={handleTestAndSave} className="mt-4 space-y-4">
          <div>
            <label className="label-mono block mb-1 text-xs" htmlFor="supabase-url">
              Project URL
            </label>
            <div className="relative">
              <input
                id="supabase-url"
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-xs font-mono outline-none focus:border-ring"
              />
              <Server className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Dapat diambil dari Supabase Dashboard → Project Settings → API → Project URL
            </p>
          </div>

          <div>
            <label className="label-mono block mb-1 text-xs" htmlFor="supabase-key">
              Anon / Public API Key
            </label>
            <div className="relative">
              <input
                id="supabase-key"
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
                className="h-10 w-full rounded-lg border border-input bg-transparent px-3 text-xs font-mono outline-none focus:border-ring"
              />
              <KeyRound className="absolute right-3 top-2.5 size-4 text-muted-foreground" />
            </div>
            <p className="mt-1 text-[11px] text-muted-foreground">
              Dapat diambil dari Supabase Dashboard → Project Settings → API → Project API keys (anon public)
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t">
            <button
              type="button"
              onClick={copySqlSchema}
              className="btn-ghost text-xs px-3 h-9"
              title="Salin skrip SQL untuk dijalankan di Supabase"
            >
              {copiedSchema ? (
                <Check className="size-3.5 mr-1 text-success" />
              ) : (
                <Copy className="size-3.5 mr-1" />
              )}
              {copiedSchema ? "Skrip Disalin!" : "Salin SQL Schema"}
            </button>

            <div className="flex items-center gap-2">
              {(url || key) && (
                <button
                  type="button"
                  onClick={handleClear}
                  className="btn-ghost text-xs text-muted-foreground hover:text-destructive px-3 h-9"
                >
                  Reset
                </button>
              )}
              <button
                type="submit"
                disabled={testing}
                className="btn text-xs px-4 h-9"
              >
                {testing ? (
                  <span className="flex items-center gap-1.5">
                    <RefreshCw className="size-3.5 animate-spin" /> Menghubungkan...
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5">
                    <ShieldCheck className="size-3.5" /> Uji & Simpan Koneksi
                  </span>
                )}
              </button>
            </div>
          </div>
        </form>

        {/* Petunjuk Penggunaan */}
        <div className="mt-4 rounded-lg bg-muted/40 border p-3.5 space-y-2 text-xs">
          <p className="font-semibold flex items-center gap-1.5">
            <ExternalLink className="size-3.5" /> Cara Mengatur Database Supabase:
          </p>
          <ol className="list-decimal list-inside space-y-1 text-muted-foreground text-[11px] leading-relaxed">
            <li>Buka Dashboard Supabase Anda di <span className="font-mono text-foreground">supabase.com</span></li>
            <li>Klik tombol <strong>"Salin SQL Schema"</strong> di atas.</li>
            <li>Buka menu <strong>SQL Editor</strong> di Supabase → klik <strong>New Query</strong> → Tempel (Paste) skrip → klik <strong>Run</strong>.</li>
            <li>Salin <strong>Project URL</strong> dan <strong>Anon Key</strong> lalu simpan melalui form di atas.</li>
          </ol>
        </div>
      </DialogContent>
    </Dialog>
  );
}
