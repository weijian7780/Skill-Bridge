const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

export async function apiRequest(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, options);
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = data.error || data.message || `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  return data;
}
