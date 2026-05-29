import { apiRequest } from "../apiClient.js";

export async function applyForJob(token, applicationData) {
  return await apiRequest("/student/applications", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(applicationData),
  });
}

export async function getStudentApplications(token) {
  return await apiRequest("/student/applications", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
