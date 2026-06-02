import { apiRequest } from "../apiClient.js";

export function searchCandidates(token, { skill = "", location = "" } = {}) {
  const params = new URLSearchParams();
  if (skill) params.set("skill", skill);
  if (location) params.set("location", location);
  const query = params.toString();
  return apiRequest(`/employer/candidates${query ? `?${query}` : ""}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function getCandidate(token, id) {
  return apiRequest(`/employer/candidates/${encodeURIComponent(id)}`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}
