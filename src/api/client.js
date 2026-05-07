/**
 * Low-level HTTP client.
 * Automatically attaches the JWT and handles JSON serialization.
 */

const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

function getHeaders(isFormData = false) {
  const token = localStorage.getItem("access_token");
  return {
    ...(!isFormData && { "Content-Type": "application/json" }),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function request(method, path, body, isFormData = false) {
  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers: getHeaders(isFormData),
    ...(body != null ? { body: isFormData ? body : JSON.stringify(body) } : {}),
  });

  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const data = await res.json();
      message = data?.message ?? data?.error ?? message;
    } catch {}
    throw new Error(message);
  }

  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

export const http = {
  get: (path) => request("GET", path),
  post: (path, body) => request("POST", path, body),
  put: (path, body) => request("PUT", path, body),
  patch: (path, body) => request("PATCH", path, body),
  delete: (path) => request("DELETE", path),
  upload: (path, form) => request("POST", path, form, true),
};
