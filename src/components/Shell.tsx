import { Link, useNavigate } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { LogOut } from "lucide-react";
import { toast } from "sonner";
import { ThemeToggle } from "@/components/ThemeToggle";
import { LanguageToggle } from "@/components/LanguageToggle";
import { useLanguage } from "@/lib/i18n";
import { actions, useStore } from "@/lib/store";

export function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  const { t, lang } = useLanguage();
  const s = useStore();
  const nav = useNavigate();

  const handleAdminLogout = () => {
    actions.logoutAdmin();
    toast.info(lang === "id" ? "Akses admin berhasil keluar" : "Admin logged out");
    nav({ to: "/admin" });
  };

  return (
    <div className="min-h-screen glow-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-mono text-sm tracking-[0.3em]">RAGDALION/FB</Link>
        <nav className="flex items-center gap-3 sm:gap-4 text-sm text-muted-foreground">
          {right}
          <LanguageToggle />
          <ThemeToggle />
          {s.isAdminAuthenticated && (
            <button
              type="button"
              onClick={handleAdminLogout}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive transition-colors cursor-pointer"
              title={lang === "id" ? "Keluar Admin" : "Logout Admin"}
            >
              <LogOut className="size-3.5" />
              <span>Logout</span>
            </button>
          )}
          <Link to="/admin" className="hover:text-foreground">{t.admin}</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">{children}</main>
    </div>
  );
}
