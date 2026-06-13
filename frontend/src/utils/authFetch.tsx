import { BACKEND_URL } from "./apiConfigs";

let isRefreshing = false;
let refreshSubscribers: Array<(success: boolean) => void> = [];

const onRefreshed = (success: boolean) => {
  refreshSubscribers.forEach(cb => cb(success));
  refreshSubscribers = [];
};

const addRefreshSubscriber = (callback: (success: boolean) => void) => {
  refreshSubscribers.push(callback);
};

const requestBackendToGenerateAccessToken = async () => {
  try {
    const res = await fetch(`${BACKEND_URL}/api/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
    });

    if (!res.ok) {
      throw new Error('Refresh failed');
    }

    return true;
  } catch (error) {
    console.error("Nie udało się odświeżyć tokenu:", error);
    window.location.href = "/login";
    return false;
  }
};

export const authFetch = async (url: string, options: RequestInit = {}) => {
  let res = await fetch(url, { ...options, credentials: 'include' });

  if (res.status === 403) {
    if (!isRefreshing) {
      isRefreshing = true;
      const refreshed = await requestBackendToGenerateAccessToken();
      isRefreshing = false;
      onRefreshed(refreshed);

      if (refreshed) {
        res = await fetch(url, { ...options, credentials: 'include' });
      }
    } else {
      const refreshed = await new Promise(resolve => addRefreshSubscriber(resolve));
      if (refreshed) {
        res = await fetch(url, { ...options, credentials: 'include' });
      }
    }
  }

  return res;
};