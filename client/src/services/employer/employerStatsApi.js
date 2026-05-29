import { apiRequest } from "../apiClient.js";

export function getEmployerStats(token) {
  return apiRequest("/employer/stats", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
