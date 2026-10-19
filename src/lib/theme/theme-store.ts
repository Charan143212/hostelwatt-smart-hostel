import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
export const THEME_KEY = "hostelwatt-theme";

const listeners = new Set<() => void>();

function read(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

export function setTheme(theme: Theme) {
  const root = document.documentElement;
  root.classList.add("theme-transition");
  root.classList.toggle("dark", theme === "dark");
  root.style.colorScheme = theme;
  try { localStorage.setItem(THEME_KEY, theme); } catch { /* ignore */ }
  window.setTimeout(() => root.classList.remove("theme-transition"), 350);
  listeners.forEach((l) => l());
}

export function useTheme(): Theme {
  return useSyncExternalStore(
    (cb) => { listeners.add(cb); return () => listeners.delete(cb); },
    read,
    () => "light",
  );
}

/** Runs before first paint so the saved theme applies without a flash. Defaults to light. */
export const themeInitScript = `(function(){try{var t=localStorage.getItem("${THEME_KEY}");if(t==="dark"){document.documentElement.classList.add("dark");document.documentElement.style.colorScheme="dark";}}catch(e){}})();`;
