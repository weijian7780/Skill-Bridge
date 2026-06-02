import { apiRequest } from "../apiClient.js";

export function getEmployerApplications(token, jobId = null) {
  const url = jobId ? `/employer/applications?job_id=${encodeURIComponent(jobId)}` : `/employer/applications`;
  return apiRequest(url, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getEmployerApplication(token, id) {
  return apiRequest(`/employer/applications/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getApplicationResumeUrl(token, id) {
  return apiRequest(`/employer/applications/${id}/resume-url`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function updateApplicationStatus(token, id, status) {
  return apiRequest(`/employer/applications/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export function updateApplicationNotes(token, id, notes) {
  return apiRequest(`/employer/applications/${id}/notes`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ notes }),
  });
}
