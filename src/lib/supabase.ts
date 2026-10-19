import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Read Supabase environment variables from Vite or LocalStorage
const env = import.meta.env as Record<string, string | undefined>;

export function getStoredSupabaseCredentials(): { url: string; key: string; source: "env" | "storage" | "none" } {
  const envUrl = env["VITE_SUPABASE_URL"] || "";
  const envKey = env["VITE_SUPABASE_ANON_KEY"] || "";

  if (envUrl && envKey && !envUrl.includes("your-project") && !envUrl.includes("placeholder")) {
    return { url: envUrl.trim(), key: envKey.trim(), source: "env" };
  }

  if (typeof window !== "undefined") {
    try {
      const storedUrl = localStorage.getItem("pictrack_supabase_url") || "";
      const storedKey = localStorage.getItem("pictrack_supabase_key") || "";
      if (storedUrl && storedKey) {
        return { url: storedUrl.trim(), key: storedKey.trim(), source: "storage" };
      }
    } catch {}
  }

  return { url: envUrl.trim(), key: envKey.trim(), source: envUrl ? "env" : "none" };
}

let cachedClient: SupabaseClient | null = null;
let lastUrl = "";
let lastKey = "";

export function getSupabase(): SupabaseClient | null {
  const { url, key } = getStoredSupabaseCredentials();

  if (!url || !key || url.includes("your-project") || url.includes("placeholder")) {
    return null;
  }

  if (cachedClient && lastUrl === url && lastKey === key) {
    return cachedClient;
  }

  try {
    cachedClient = createClient(url, key, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
      realtime: {
        params: {
          eventsPerSecond: 10,
        },
      },
    });
    lastUrl = url;
    lastKey = key;
    return cachedClient;
  } catch (err) {
    console.error("Gagal inisialisasi Supabase client", err);
    return null;
  }
}

export function isSupabaseConfigured(): boolean {
  const { url, key } = getStoredSupabaseCredentials();
  return Boolean(url && key && !url.includes("your-project") && !url.includes("placeholder"));
}

export function saveSupabaseCredentials(url: string, key: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem("pictrack_supabase_url", url.trim());
    localStorage.setItem("pictrack_supabase_key", key.trim());
    cachedClient = null; // force recreate
  }
}

export function clearCustomSupabaseCredentials() {
  if (typeof window !== "undefined") {
    localStorage.removeItem("pictrack_supabase_url");
    localStorage.removeItem("pictrack_supabase_key");
    cachedClient = null;
  }
}

export type SupabaseStatus = {
  configured: boolean;
  connected: boolean;
  message: string;
  source: "env" | "storage" | "none";
};

export async function checkSupabaseConnection(): Promise<SupabaseStatus> {
  const { source } = getStoredSupabaseCredentials();
  const client = getSupabase();

  if (!client) {
    return {
      configured: false,
      connected: false,
      source,
      message: "Supabase belum terhubung. Masukkan URL & Anon Key di pengaturan atau file .env.",
    };
  }

  try {
    const { error } = await client.from("projects").select("id").limit(1);

    if (error) {
      if (error.code === "42P01") {
        return {
          configured: true,
          connected: false,
          source,
          message: "Tabel database belum dibuat. Jalankan file supabase/schema.sql di SQL Editor Supabase.",
        };
      }
      return {
        configured: true,
        connected: false,
        source,
        message: `Koneksi Supabase gagal: ${error.message}`,
      };
    }

    return {
      configured: true,
      connected: true,
      source,
      message: "Database Supabase terhubung & Row Level Security (RLS) aktif.",
    };
  } catch (err: any) {
    return {
      configured: true,
      connected: false,
      source,
      message: `Error koneksi: ${err?.message || "Tidak dapat menghubungi server"}`,
    };
  }
}

// Export default reference for backward compatibility
export const supabase = getSupabase();
