import { apiRequest } from "../apiClient.js";

export function createEmployerInterview(token, interviewData) {
  return apiRequest("/employer/interviews", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(interviewData),
  });
}

export function getEmployerInterviews(token, applicationId) {
  return apiRequest(`/employer/interviews?application_id=${applicationId}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateEmployerInterview(token, id, interviewData) {
  return apiRequest(`/employer/interviews/${id}`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(interviewData),
  });
}

export function deleteEmployerInterview(token, id) {
  return apiRequest(`/employer/interviews/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
