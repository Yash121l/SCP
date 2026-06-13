import { useCallback, useEffect, useState } from "react";
import type { Theme } from "../features/workspace/workspace.types";

const STORAGE_KEY = "scp-theme";
const VERSION_KEY = "scp-theme-version";
const CURRENT_THEME_VERSION = "2";

function getInitialTheme(): Theme {
  if (window.localStorage.getItem(VERSION_KEY) !== CURRENT_THEME_VERSION) {
    window.localStorage.setItem(VERSION_KEY, CURRENT_THEME_VERSION);
    window.localStorage.setItem(STORAGE_KEY, "dark");
    return "dark";
  }
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === "light" || stored === "dark") return stored;
  return "dark";
}

export function useTheme() {
  const [theme, setTheme] = useState<Theme>(getInitialTheme);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((current) => (current === "dark" ? "light" : "dark"));
  }, []);

  return { theme, setTheme, toggleTheme };
}
