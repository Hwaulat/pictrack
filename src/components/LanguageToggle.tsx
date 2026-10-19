import { useLanguage } from "@/lib/i18n";
import { cn } from "@/lib/utils";

export function LanguageToggle() {
  const { lang, setLang } = useLanguage();

  return (
    <div
      role="tablist"
      aria-label="Pilih bahasa / Select language"
      className="inline-flex h-7 items-center justify-center rounded-full border border-input/60 bg-muted/30 p-0.5 text-muted-foreground"
    >
      <button
        type="button"
        role="tab"
        id="tab-lang-en"
        aria-selected={lang === "en"}
        aria-controls="tabpanel-lang"
        onClick={() => setLang("en")}
        title="English"
        className={cn(
          "h-6 rounded-full px-2.5 text-[11px] font-mono font-medium tracking-wider transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          lang === "en"
            ? "bg-foreground text-background shadow-xs font-semibold"
            : "opacity-50 hover:opacity-90 hover:text-foreground"
        )}
      >
        EN
      </button>
      <button
        type="button"
        role="tab"
        id="tab-lang-id"
        aria-selected={lang === "id"}
        aria-controls="tabpanel-lang"
        onClick={() => setLang("id")}
        title="Bahasa Indonesia"
        className={cn(
          "h-6 rounded-full px-2.5 text-[11px] font-mono font-medium tracking-wider transition-all duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
          lang === "id"
            ? "bg-foreground text-background shadow-xs font-semibold"
            : "opacity-50 hover:opacity-90 hover:text-foreground"
        )}
      >
        ID
      </button>
    </div>
  );
}
