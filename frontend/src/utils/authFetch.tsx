import { BACKEND_URL } from "./apiConfigs";

let isRefreshing = false;
let refreshSubscribers = [];

const onRefreshed = () => {
  refreshSubscribers.forEach(cb => cb());
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback) => {
  refreshSubscribers.push(callback);
};

const refreshAccessToken = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include', // wysyła ciasteczka
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    // backend ustawia nowe ciasteczko accessToken, nie musimy niczego zwracać
    return true;
  } catch (error) {
    console.error("Nie udało się odświeżyć tokenu:", error);
    window.location.href = "/login";
    return false;
  }
};

export const authFetch = async (url, options = {}) => {
  let res = await fetch(url, { ...options, credentials: 'include' });

  if (res.status === 403) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await refreshAccessToken();
      isRefreshing = false;

      if (refreshed) {
        onRefreshed();
        res = await fetch(url, { ...options, credentials: 'include' });
      }
    } else {
      // jeśli odświeżanie trwa, poczekaj aż się skończy
      await new Promise(resolve => addRefreshSubscriber(resolve));
      res = await fetch(url, { ...options, credentials: 'include' });
    }
  }

  return res;
};