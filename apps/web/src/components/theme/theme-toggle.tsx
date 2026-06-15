import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";
import { Button } from "@scp/ui";

type ThemeMode = "dark" | "light";

const storageKey = "scp-theme";

function readTheme(): ThemeMode {
  if (typeof window === "undefined") {
    return "dark";
  }

  return window.localStorage.getItem(storageKey) === "light" ? "light" : "dark";
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme;
}

export function ThemeToggle() {
  const [theme, setTheme] = useState<ThemeMode>(() => readTheme());

  useEffect(() => {
    applyTheme(theme);
    window.localStorage.setItem(storageKey, theme);
  }, [theme]);

  const isLight = theme === "light";

  return (
    <Button
      aria-label={isLight ? "Switch to dark mode" : "Switch to light mode"}
      onClick={() => setTheme(isLight ? "dark" : "light")}
      size="icon"
      title={isLight ? "Dark mode" : "Light mode"}
      type="button"
    >
      {isLight ? <Moon size={16} /> : <Sun size={16} />}
    </Button>
  );
}
