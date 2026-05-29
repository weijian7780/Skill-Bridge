import { apiRequest } from "../apiClient.js";

export function getStudentApplications(token) {
  return apiRequest("/student/applications", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
