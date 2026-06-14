import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

// Compact PL / EN toggle. The selected language is persisted to localStorage by
// i18next's LanguageDetector, so the choice survives reloads. The `Accept-Language`
// header sent to the backend (see apiConfigs) reads from the same stored value.
//
// Two visual variants (mirroring ThemeSwitcher):
// - "navbar"  — translucent white-on-color chip for the coloured nav/footer bars.
// - "surface" — neutral chip that stays legible on the light/dark page backgrounds
//               of the public pages (login/register).
const LABELS: Record<SupportedLanguage, string> = {
  pl: "PL",
  en: "EN",
};

interface LanguageSwitcherProps {
  className?: string;
  variant?: "navbar" | "surface";
}

export default function LanguageSwitcher({ className = "", variant = "navbar" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "pl").slice(0, 2);

  const isSurface = variant === "surface";
  const containerClass = isSurface
    ? "border border-gray-300 dark:border-gray-600 bg-white/80 dark:bg-gray-800/80"
    : "bg-white/10";
  const activeClass = isSurface
    ? "bg-green-600 text-white shadow"
    : "bg-white text-green-700 shadow";
  const inactiveClass = isSurface
    ? "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
    : "text-white hover:bg-white/20";
  const ringClass = isSurface ? "focus:ring-green-500/40" : "focus:ring-white/50";

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg p-0.5 backdrop-blur-sm ${containerClass} ${className}`}
      role="group"
      aria-label={t("language.label")}
    >
      {SUPPORTED_LANGUAGES.map((lng) => {
        const active = current === lng;
        return (
          <button
            key={lng}
            type="button"
            onClick={() => i18n.changeLanguage(lng)}
            aria-pressed={active}
            title={`${t("language.switchTo")}: ${t(`language.${lng}`)}`}
            className={`px-2 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 ${ringClass} ${
              active ? activeClass : inactiveClass
            }`}
          >
            {LABELS[lng]}
          </button>
        );
      })}
    </div>
  );
}
