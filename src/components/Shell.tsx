import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ children, right }: { children: ReactNode; right?: ReactNode }) {
  return (
    <div className="min-h-screen glow-bg">
      <header className="mx-auto flex max-w-5xl items-center justify-between px-5 py-5">
        <Link to="/" className="font-mono text-sm tracking-[0.3em]">RAGDALION/FB</Link>
        <nav className="flex items-center gap-5 text-sm text-muted-foreground">
          {right}
          <Link to="/admin" className="hover:text-foreground">Admin</Link>
        </nav>
      </header>
      <main className="mx-auto max-w-5xl px-5 pb-20">{children}</main>
    </div>
  );
}
