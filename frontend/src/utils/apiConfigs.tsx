export const BACKEND_URL = "http://localhost:8091";

export const getAuthToken = () => {
  return (
    localStorage.getItem("authToken") || sessionStorage.getItem("authToken")
  );
};

export const getAuthHeaders = () => {
  const token = getAuthToken();
  return {
    "Content-Type": "application/json",
    ...(token && { Authorization: `Bearer ${token}` }),
  };
};
