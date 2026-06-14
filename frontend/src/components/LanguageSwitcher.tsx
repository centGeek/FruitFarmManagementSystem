import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n";

// Compact PL / EN toggle. The selected language is persisted to localStorage by
// i18next's LanguageDetector, so the choice survives reloads. The `Accept-Language`
// header sent to the backend (see apiConfigs) reads from the same stored value.
const LABELS: Record<SupportedLanguage, string> = {
  pl: "PL",
  en: "EN",
};

interface LanguageSwitcherProps {
  className?: string;
}

export default function LanguageSwitcher({ className = "" }: LanguageSwitcherProps) {
  const { i18n, t } = useTranslation();
  const current = (i18n.resolvedLanguage ?? i18n.language ?? "pl").slice(0, 2);

  return (
    <div
      className={`flex items-center gap-0.5 rounded-lg bg-white/10 p-0.5 backdrop-blur-sm ${className}`}
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
            className={`px-2 py-1 rounded-md text-xs font-semibold tracking-wide transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-white/50 ${
              active
                ? "bg-white text-green-700 shadow"
                : "text-white hover:bg-white/20"
            }`}
          >
            {LABELS[lng]}
          </button>
        );
      })}
    </div>
  );
}
