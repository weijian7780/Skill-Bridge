import { apiRequest } from "../apiClient.js";

export function getEmployerSubscription(token) {
  return apiRequest("/employer/subscription", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export function activateEmployerSubscription(token, plan = "professional") {
  return apiRequest("/employer/subscription/activate", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ plan }),
  });
}

export function cancelEmployerSubscription(token) {
  return apiRequest("/employer/subscription/cancel", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
  });
}
