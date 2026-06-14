// Domyślnie pusty string → wszystkie wywołania `${BACKEND_URL}/api/...` są RELATYWNE.
// Front i backend dzielą origin: w dev przez proxy Vite (server.proxy w vite.config.ts),
// w produkcji/Compose przez reverse-proxy nginx (location /api → BACKEND_ORIGIN).
// Dzięki temu znika CORS, ciasteczka działają na SameSite=Lax, a frontend nie zależy od adresu backendu.
// Override przez VITE_BACKEND_URL zostaje dostępny, gdyby ktoś chciał uderzać do backendu bezpośrednio.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

// Language chosen in the UI (persisted by i18next's LanguageDetector under
// `i18nextLng`). Sent as `Accept-Language` so the backend can localize
// validation/error messages via its LocaleResolver. Falls back to Polish.
const getCurrentLanguage = (): string => {
  try {
    return (localStorage.getItem("i18nextLng") ?? "pl").slice(0, 2);
  } catch {
    return "pl";
  }
};

export const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
    "Accept-Language": getCurrentLanguage(),
  };
};
