import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";

export function ThemeToggle() {
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as "dark" | "light" | null;
    if (stored === "light" || stored === "dark") {
      setTheme(stored);
      document.documentElement.classList.toggle("dark", stored === "dark");
      document.documentElement.classList.toggle("light", stored === "light");
    } else {
      // Default to dark theme to maintain the project's original styling
      const initialTheme: "dark" | "light" = "dark";
      setTheme(initialTheme);
      document.documentElement.classList.add("dark");
      document.documentElement.classList.remove("light");
    }
  }, []);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setTheme(nextTheme);
    localStorage.setItem("theme", nextTheme);
    document.documentElement.classList.toggle("dark", nextTheme === "dark");
    document.documentElement.classList.toggle("light", nextTheme === "light");
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className="inline-flex items-center gap-0.5 rounded-full border border-input/60 bg-muted/30 p-0.5 text-muted-foreground transition-colors hover:border-input hover:text-foreground cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      title={theme === "dark" ? "Mode Terang (Light Mode)" : "Mode Gelap (Dark Mode)"}
      aria-label="Toggle dark/light mode"
    >
      <span
        className={`flex size-6 items-center justify-center rounded-full transition-all duration-200 ${
          mounted && theme === "light"
            ? "bg-foreground text-background shadow-xs"
            : "opacity-40 hover:opacity-80"
        }`}
      >
        <Sun className="size-3.5" />
      </span>
      <span
        className={`flex size-6 items-center justify-center rounded-full transition-all duration-200 ${
          mounted && theme === "dark"
            ? "bg-foreground text-background shadow-xs"
            : "opacity-40 hover:opacity-80"
        }`}
      >
        <Moon className="size-3.5" />
      </span>
    </button>
  );
}
