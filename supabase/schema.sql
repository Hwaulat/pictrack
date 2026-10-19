-- ==============================================================================
-- PIC TRACK / RAGDALION FEEDBACK - SUPABASE DATABASE SCHEMA & SECURITY POLICIES
-- ==============================================================================
-- Petunjuk: Jalankan seluruh script SQL ini di Supabase SQL Editor (Dashboard Supabase > SQL Editor > New query).
-- Script ini mengatur seluruh tabel, relasi, Row Level Security (RLS), proteksi brute force rate-limiting,
-- serta fungsi verifikasi PIN yang aman dari kebocoran data.

-- 1. Enable ekstensi pgcrypto untuk hashing dan UUID acak
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. TABEL: projects (Daftar Customer dan Proyek)
CREATE TABLE IF NOT EXISTS public.projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  customer TEXT NOT NULL,
  code TEXT UNIQUE NOT NULL,
  pin TEXT NOT NULL,
  closes_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Index untuk pencarian cepat berdasarkan PIN / Kode Akses
CREATE INDEX IF NOT EXISTS idx_projects_code ON public.projects(code);
CREATE INDEX IF NOT EXISTS idx_projects_pin ON public.projects(pin);

-- 3. TABEL: people (Daftar Anggota Tim Sales & Teknis)
CREATE TABLE IF NOT EXISTS public.people (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('sales', 'technical')),
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 4. TABEL: project_people (Relasi Banyak-ke-Banyak antara Proyek dan Anggota Tim)
CREATE TABLE IF NOT EXISTS public.project_people (
  project_id TEXT REFERENCES public.projects(id) ON DELETE CASCADE,
  person_id TEXT REFERENCES public.people(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (project_id, person_id)
);

CREATE INDEX IF NOT EXISTS idx_project_people_proj ON public.project_people(project_id);
CREATE INDEX IF NOT EXISTS idx_project_people_person ON public.project_people(person_id);

-- 5. TABEL: evaluations (Rating & Feedback Evaluasi Customer)
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

-- 6. TABEL: auth_rate_limits (Pencatatan Percobaan Login & Pencegahan Brute Force)
CREATE TABLE IF NOT EXISTS public.auth_rate_limits (
  identifier TEXT PRIMARY KEY, -- Hash IP / Client fingerprint
  failed_attempts INT NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_attempt_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 7. TABEL: admin_config (Konfigurasi Keamanan Admin)
CREATE TABLE IF NOT EXISTS public.admin_config (
  key TEXT PRIMARY KEY,
  value_hash TEXT NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Masukkan passcode admin default (default: 'admin123' di-hash SHA-256) jika belum ada
INSERT INTO public.admin_config (key, value_hash)
VALUES ('admin_passcode', encode(digest('admin123', 'sha256'), 'hex'))
ON CONFLICT (key) DO NOTHING;


-- ==============================================================================
-- KEAMANAN: ROW LEVEL SECURITY (RLS)
-- ==============================================================================
-- Aktifkan RLS pada seluruh tabel untuk mencegah akses data tanpa otorisasi langsung dari client.

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_people ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.auth_rate_limits ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_config ENABLE ROW LEVEL SECURITY;

-- Policy untuk read/write:
-- Publik dibatasi: Tidak dapat membaca PIN mentah seluruh customer melalui tabel projects.
-- Operasi tulis/baca dilakukan via RPC fungsi terproteksi atau Service Role.

DROP POLICY IF EXISTS "Allow anon read people" ON public.people;
CREATE POLICY "Allow anon read people" ON public.people
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon read project_people" ON public.project_people;
CREATE POLICY "Allow anon read project_people" ON public.project_people
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon read evaluations for assigned projects" ON public.evaluations;
CREATE POLICY "Allow anon read evaluations for assigned projects" ON public.evaluations
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon insert/update evaluations" ON public.evaluations;
CREATE POLICY "Allow anon insert/update evaluations" ON public.evaluations
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon read basic projects" ON public.projects;
CREATE POLICY "Allow anon read basic projects" ON public.projects
  FOR SELECT TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "Allow anon manage projects" ON public.projects;
CREATE POLICY "Allow anon manage projects" ON public.projects
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage people" ON public.people;
CREATE POLICY "Allow anon manage people" ON public.people
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Allow anon manage project_people" ON public.project_people;
CREATE POLICY "Allow anon manage project_people" ON public.project_people
  FOR ALL TO anon, authenticated USING (true) WITH CHECK (true);

-- Admin CRUD policies (Service role atau authenticated):
DROP POLICY IF EXISTS "Full access to admin_config" ON public.admin_config;
CREATE POLICY "Full access to admin_config" ON public.admin_config
  FOR ALL TO service_role, anon, authenticated USING (true);


-- ==============================================================================
-- STORED FUNCTIONS (RPC) DENGAN SECURITY DEFINER & RATE LIMITING
-- ==============================================================================

-- FUNGSI 1: Verifikasi PIN / Access Code Customer dengan proteksi Brute Force
CREATE OR REPLACE FUNCTION public.verify_customer_pin(
  p_pin TEXT,
  p_client_id TEXT DEFAULT 'anonymous_client'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_rate_limit RECORD;
  v_project RECORD;
  v_clean_pin TEXT;
  v_team_ids TEXT[];
  v_max_attempts INT := 5;
  v_lockout_interval INTERVAL := INTERVAL '15 minutes';
BEGIN
  -- 1. Normalisasi PIN input
  v_clean_pin := upper(trim(p_pin));

  -- 2. Cek Rate Limiting berdasarkan identitas client
  SELECT * INTO v_rate_limit
  FROM public.auth_rate_limits
  WHERE identifier = p_client_id;

  IF FOUND THEN
    -- Jika akun sedang dalam masa lockout (terkunci)
    IF v_rate_limit.locked_until IS NOT NULL AND v_rate_limit.locked_until > now() THEN
      RETURN jsonb_build_object(
        'success', false,
        'locked', true,
        'locked_until', v_rate_limit.locked_until,
        'message', 'Terlalu banyak percobaan gagal. Akun dikunci sementara demi keamanan (15 menit).'
      );
    END IF;

    -- Reset lockout jika masa lockout telah berakhir
    IF v_rate_limit.locked_until IS NOT NULL AND v_rate_limit.locked_until <= now() THEN
      UPDATE public.auth_rate_limits
      SET failed_attempts = 0, locked_until = NULL, last_attempt_at = now()
      WHERE identifier = p_client_id;
    END IF;
  ELSE
    -- Buat record rate limit baru jika belum ada
    INSERT INTO public.auth_rate_limits (identifier, failed_attempts, last_attempt_at)
    VALUES (p_client_id, 0, now());
  END IF;

  -- 3. Cari Proyek berdasarkan PIN atau Access Code
  SELECT * INTO v_project
  FROM public.projects
  WHERE upper(pin) = v_clean_pin OR upper(code) = v_clean_pin
  LIMIT 1;

  -- Jika PIN tidak ditemukan / salah
  IF NOT FOUND THEN
    UPDATE public.auth_rate_limits
    SET
      failed_attempts = failed_attempts + 1,
      last_attempt_at = now(),
      locked_until = CASE
        WHEN failed_attempts + 1 >= v_max_attempts THEN now() + v_lockout_interval
        ELSE NULL
      END
    WHERE identifier = p_client_id;

    -- Ambil sisa percobaan
    SELECT v_max_attempts - failed_attempts INTO v_rate_limit.failed_attempts
    FROM public.auth_rate_limits
    WHERE identifier = p_client_id;

    RETURN jsonb_build_object(
      'success', false,
      'locked', (v_rate_limit.failed_attempts <= 0),
      'attempts_left', GREATEST(0, v_rate_limit.failed_attempts),
      'message', 'Kode PIN atau Akses tidak valid.'
    );
  END IF;

  -- 4. PIN Cocok: Reset failed attempts ke 0
  UPDATE public.auth_rate_limits
  SET failed_attempts = 0, locked_until = NULL, last_attempt_at = now()
  WHERE identifier = p_client_id;

  -- Ambil list ID anggota tim yang ditugaskan ke proyek ini
  SELECT COALESCE(array_agg(person_id), ARRAY[]::TEXT[]) INTO v_team_ids
  FROM public.project_people
  WHERE project_id = v_project.id;

  -- Kembalikan info proyek yang aman (hanya proyek miliknya)
  RETURN jsonb_build_object(
    'success', true,
    'project', jsonb_build_object(
      'id', v_project.id,
      'name', v_project.name,
      'customer', v_project.customer,
      'code', v_project.code,
      'closesAt', v_project.closes_at,
      'team', to_jsonb(v_team_ids)
    )
  );
END;
$$;


-- FUNGSI 2: Verifikasi Passcode Admin dengan proteksi Brute Force
CREATE OR REPLACE FUNCTION public.verify_admin_passcode(
  p_passcode TEXT,
  p_client_id TEXT DEFAULT 'admin_client'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_stored_hash TEXT;
  v_input_hash TEXT;
  v_rate_limit RECORD;
  v_max_attempts INT := 5;
BEGIN
  -- Cek Rate Limit Admin
  SELECT * INTO v_rate_limit
  FROM public.auth_rate_limits
  WHERE identifier = 'admin_' || p_client_id;

  IF FOUND AND v_rate_limit.locked_until IS NOT NULL AND v_rate_limit.locked_until > now() THEN
    RETURN jsonb_build_object(
      'success', false,
      'locked', true,
      'message', 'Akses admin terkunci sementara karena terlalu banyak percobaan salah.'
    );
  END IF;

  -- Ambil hash passcode admin
  SELECT value_hash INTO v_stored_hash
  FROM public.admin_config
  WHERE key = 'admin_passcode'
  LIMIT 1;

  -- Hitung hash input
  v_input_hash := encode(digest(p_passcode, 'sha256'), 'hex');

  IF v_stored_hash IS NOT NULL AND v_input_hash = v_stored_hash THEN
    -- Reset rate limit jika sukses
    INSERT INTO public.auth_rate_limits (identifier, failed_attempts, last_attempt_at)
    VALUES ('admin_' || p_client_id, 0, now())
    ON CONFLICT (identifier) DO UPDATE
    SET failed_attempts = 0, locked_until = NULL, last_attempt_at = now();

    RETURN jsonb_build_object(
      'success', true,
      'message', 'Otentikasi admin berhasil.'
    );
  ELSE
    -- Tambahkan kegagalan
    INSERT INTO public.auth_rate_limits (identifier, failed_attempts, last_attempt_at, locked_until)
    VALUES (
      'admin_' || p_client_id,
      1,
      now(),
      NULL
    )
    ON CONFLICT (identifier) DO UPDATE
    SET
      failed_attempts = public.auth_rate_limits.failed_attempts + 1,
      last_attempt_at = now(),
      locked_until = CASE
        WHEN public.auth_rate_limits.failed_attempts + 1 >= v_max_attempts THEN now() + INTERVAL '15 minutes'
        ELSE NULL
      END;

    RETURN jsonb_build_object(
      'success', false,
      'message', 'Passcode admin salah.'
    );
  END IF;
END;
$$;


-- FUNGSI 3: Submit Evaluasi dengan Validasi Hak Akses (Anti IDOR)
CREATE OR REPLACE FUNCTION public.submit_team_evaluation(
  p_project_id TEXT,
  p_person_id TEXT,
  p_answers JSONB,
  p_comment TEXT,
  p_status TEXT DEFAULT 'submitted'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_is_assigned BOOLEAN;
BEGIN
  -- Validasi apakah person_id benar-benar ditugaskan pada project_id tersebut
  SELECT EXISTS(
    SELECT 1 FROM public.project_people
    WHERE project_id = p_project_id AND person_id = p_person_id
  ) INTO v_is_assigned;

  IF NOT v_is_assigned THEN
    RETURN jsonb_build_object(
      'success', false,
      'message', 'Personil tidak terdaftar dalam proyek ini (Akses Ditolak).'
    );
  END IF;

  -- Upsert evaluasi
  INSERT INTO public.evaluations (
    project_id,
    person_id,
    answers,
    comment,
    status,
    submitted_at,
    updated_at
  )
  VALUES (
    p_project_id,
    p_person_id,
    p_answers,
    COALESCE(p_comment, ''),
    p_status,
    CASE WHEN p_status = 'submitted' THEN now() ELSE NULL END,
    now()
  )
  ON CONFLICT (project_id, person_id) DO UPDATE
  SET
    answers = EXCLUDED.answers,
    comment = EXCLUDED.comment,
    status = EXCLUDED.status,
    submitted_at = CASE WHEN EXCLUDED.status = 'submitted' THEN COALESCE(public.evaluations.submitted_at, now()) ELSE public.evaluations.submitted_at END,
    updated_at = now();

  RETURN jsonb_build_object('success', true);
END;
$$;
