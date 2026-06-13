// Domyślnie pusty string → wszystkie wywołania `${BACKEND_URL}/api/...` są RELATYWNE.
// Front i backend dzielą origin: w dev przez proxy Vite (server.proxy w vite.config.ts),
// w produkcji/Compose przez reverse-proxy nginx (location /api → BACKEND_ORIGIN).
// Dzięki temu znika CORS, ciasteczka działają na SameSite=Lax, a frontend nie zależy od adresu backendu.
// Override przez VITE_BACKEND_URL zostaje dostępny, gdyby ktoś chciał uderzać do backendu bezpośrednio.
export const BACKEND_URL = import.meta.env.VITE_BACKEND_URL ?? "";

export const getAuthHeaders = () => {
  return {
    "Content-Type": "application/json",
  };
};
