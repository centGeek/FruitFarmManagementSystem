import { useSyncExternalStore } from "react";

// Light/dark theme management.
//
// A single module-level store is the source of truth so that every ThemeSwitcher
// instance (desktop navbar, mobile menu, login/register pages) stays in sync — a
// toggle anywhere updates them all. The `dark` class is toggled on <html>, which
// is what Tailwind's class-based dark mode (see tailwind.config.js) keys off.
//
// First visit follows the OS `prefers-color-scheme`; once the user toggles, the
// explicit choice is persisted to localStorage and wins from then on. An inline
// script in index.html applies the same logic before React mounts to avoid a
// flash of the wrong theme on reload.

export type Theme = "light" | "dark";

const STORAGE_KEY = "theme";

function getStoredTheme(): Theme | null {
  try {
    const value = localStorage.getItem(STORAGE_KEY);
    return value === "light" || value === "dark" ? value : null;
  } catch {
    return null;
  }
}

function getSystemTheme(): Theme {
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

function getInitialTheme(): Theme {
  return getStoredTheme() ?? getSystemTheme();
}

function applyTheme(theme: Theme): void {
  const root = document.documentElement;
  root.classList.toggle("dark", theme === "dark");
  // Hints native form controls, scrollbars and the like to render in the right scheme.
  root.style.colorScheme = theme;
}

let current: Theme = getInitialTheme();
applyTheme(current);

let listeners: Array<() => void> = [];

function emit(): void {
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

export function getTheme(): Theme {
  return current;
}

export function setTheme(theme: Theme): void {
  if (theme === current) return;
  current = theme;
  try {
    localStorage.setItem(STORAGE_KEY, theme);
  } catch {
    // Ignore unavailable/blocked storage; the in-memory value still drives the UI.
  }
  applyTheme(theme);
  emit();
}

export function toggleTheme(): void {
  setTheme(current === "dark" ? "light" : "dark");
}

// Follow OS changes only while the user has not made an explicit choice.
window
  .matchMedia?.("(prefers-color-scheme: dark)")
  .addEventListener?.("change", (event) => {
    if (!getStoredTheme()) setTheme(event.matches ? "dark" : "light");
  });

export function useTheme(): { theme: Theme; toggleTheme: () => void; setTheme: (theme: Theme) => void } {
  const theme = useSyncExternalStore(subscribe, getTheme, getTheme);
  return { theme, toggleTheme, setTheme };
}
