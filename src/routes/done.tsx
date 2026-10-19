import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";
import { useLanguage } from "@/lib/i18n";

export const Route = createFileRoute("/done")({
  head: () => ({
    meta: [
      { title: "Thank you — Vendor Feedback" },
      { name: "description", content: "Your vendor feedback was received." },
      { property: "og:title", content: "Thank you — Vendor Feedback" },
      { property: "og:description", content: "Your vendor feedback was received." },
    ],
  }),
  component: Done,
});

function Done() {
  const { t } = useLanguage();

  return (
    <Shell>
      <section className="flex min-h-[70vh] flex-col justify-center">
        <p className="label-mono text-success">{t.done_received}</p>
        <h1 className="mt-6 text-5xl font-light tracking-tight sm:text-6xl">{t.done_title}</h1>
        <p className="mt-4 max-w-md text-muted-foreground">{t.done_desc}</p>
        <Link to="/vendors" className="btn mt-10 self-start">{t.done_back}</Link>
      </section>
    </Shell>
  );
}
