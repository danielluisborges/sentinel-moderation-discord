import { Moon, Sun } from "lucide-react";
import { useState } from "react";
import { cn } from "../utils/cn.js";

type Theme = "dark" | "light";

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>(
    () =>
      (document.documentElement.dataset.theme as Theme | undefined) ?? "dark",
  );

  function toggleTheme() {
    const nextTheme = theme === "dark" ? "light" : "dark";
    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("sentinel-theme", nextTheme);
    setTheme(nextTheme);
  }

  const isLight = theme === "light";
  const Icon = isLight ? Moon : Sun;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isLight ? "Ativar tema escuro" : "Ativar tema claro"}
      title={isLight ? "Tema escuro" : "Tema claro"}
      className={cn(
        "grid size-9 shrink-0 place-items-center rounded-lg border border-slate-700 bg-slate-900/70 text-slate-300 transition hover:border-slate-600 hover:text-white",
        isLight && "bg-white text-slate-700 hover:text-slate-950",
      )}
    >
      <Icon size={17} aria-hidden="true" />
    </button>
  );
}
