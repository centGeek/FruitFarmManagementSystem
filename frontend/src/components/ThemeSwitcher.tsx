import { useTranslation } from "react-i18next";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "../utils/theme";

// Compact light/dark toggle. The choice is held in a shared store (see utils/theme),
// so all instances stay in sync. Shows the Moon in light mode (click to go dark) and
// the Sun in dark mode (click to go light).
//
// Two visual variants:
// - "navbar"  — translucent white-on-color chip, matches LanguageSwitcher on the
//               coloured nav/footer bars.
// - "surface" — neutral chip that stays legible on the light or dark page backgrounds
//               of the public pages (login/register).

interface ThemeSwitcherProps {
  className?: string;
  variant?: "navbar" | "surface";
}

export default function ThemeSwitcher({ className = "", variant = "navbar" }: ThemeSwitcherProps) {
  const { theme, toggleTheme } = useTheme();
  const { t } = useTranslation();
  const isDark = theme === "dark";

  const base =
    "inline-flex items-center justify-center rounded-lg p-2 transition-all duration-200 focus:outline-none";
  const variantClass =
    variant === "surface"
      ? "border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-700 focus:ring-2 focus:ring-green-500/40"
      : "bg-white/10 text-white backdrop-blur-sm hover:bg-white/20 focus:ring-2 focus:ring-white/50";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-pressed={isDark}
      title={isDark ? t("theme.switchToLight") : t("theme.switchToDark")}
      aria-label={t("theme.toggle")}
      className={`${base} ${variantClass} ${className}`}
    >
      {isDark ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
