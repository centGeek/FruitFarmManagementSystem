import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import LanguageDetector from "i18next-browser-languagedetector";

// Translation resources are split into per-feature namespace files under
// `locales/<lng>/<namespace>.json`. They are picked up automatically via Vite's
// glob import, so adding a new feature only means dropping in two JSON files
// (pl + en) — no edits to this config are required.
const modules = import.meta.glob("./locales/**/*.json", { eager: true });

type Resources = Record<string, Record<string, unknown>>;
const resources: Resources = {};

for (const path in modules) {
  const match = path.match(/\.\/locales\/([^/]+)\/(.+)\.json$/);
  if (!match) continue;
  const [, lng, namespace] = match;
  resources[lng] ??= {};
  resources[lng][namespace] = (modules[path] as { default: unknown }).default;
}

const namespaces = [
  ...new Set(Object.values(resources).flatMap((byNs) => Object.keys(byNs))),
];

export const SUPPORTED_LANGUAGES = ["pl", "en"] as const;
export type SupportedLanguage = (typeof SUPPORTED_LANGUAGES)[number];

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    // Polish is the default; the choice is remembered in localStorage and
    // toggled from the navbar. We deliberately do NOT auto-detect the browser
    // language so the app always starts in Polish on a fresh visit.
    fallbackLng: "pl",
    supportedLngs: SUPPORTED_LANGUAGES as unknown as string[],
    ns: namespaces.length ? namespaces : ["common"],
    defaultNS: "common",
    fallbackNS: "common",
    interpolation: { escapeValue: false },
    detection: {
      order: ["localStorage"],
      lookupLocalStorage: "i18nextLng",
      caches: ["localStorage"],
    },
  });

export default i18n;
