import { useSyncExternalStore } from "react";

export type Theme = "light" | "dark";
const KEY = "settly.theme";

let theme: Theme = load();
const listeners = new Set<() => void>();

function load(): Theme {
  try {
    const t = localStorage.getItem(KEY);
    if (t === "light" || t === "dark") return t;
  } catch {}
  if (typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches) return "dark";
  return "light";
}

function apply() {
  if (typeof document !== "undefined") document.documentElement.dataset.theme = theme;
}
apply();

function emit() {
  try {
    localStorage.setItem(KEY, theme);
  } catch {}
  apply();
  listeners.forEach((l) => l());
}

function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}

export function useTheme(): Theme {
  return useSyncExternalStore(subscribe, () => theme, () => theme);
}

export function toggleTheme() {
  theme = theme === "dark" ? "light" : "dark";
  emit();
}
