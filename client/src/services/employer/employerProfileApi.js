import { apiRequest } from "../apiClient.js";

export function getEmployerProfile(token) {
  return apiRequest("/employer/profile", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateEmployerProfile(token, profileData) {
  return apiRequest("/employer/profile", {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(profileData),
  });
}
