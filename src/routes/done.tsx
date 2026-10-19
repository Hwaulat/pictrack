import { createFileRoute, Link } from "@tanstack/react-router";
import { Shell } from "@/components/Shell";

export const Route = createFileRoute("/done")({
  head: () => ({
    meta: [
      { title: "Thank you — Vendor Feedback" },
      { name: "description", content: "Your vendor feedback was received." },
      { property: "og:title", content: "Thank you — Vendor Feedback" },
      { property: "og:description", content: "Your vendor feedback was received." },
    ],
  }),
  component: () => (
    <Shell>
      <section className="flex min-h-[70vh] flex-col justify-center">
        <p className="label-mono text-success">✓ Received</p>
        <h1 className="mt-6 text-5xl font-light tracking-tight sm:text-6xl">Thank you.</h1>
        <p className="mt-4 max-w-md text-muted-foreground">You can edit your answers until the feedback window closes.</p>
        <Link to="/vendors" className="btn mt-10 self-start">Back to vendors</Link>
      </section>
    </Shell>
  ),
});
