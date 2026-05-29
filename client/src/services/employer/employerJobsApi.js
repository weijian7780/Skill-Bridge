import { apiRequest } from "../apiClient.js";

export function getEmployerJobs(token) {
  return apiRequest("/employer/job-posts", {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function getEmployerJob(token, id) {
  return apiRequest(`/employer/job-posts/${id}`, {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}

export function createEmployerJob(token, jobData) {
  return apiRequest("/employer/job-posts", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });
}

export function updateEmployerJob(token, id, jobData) {
  return apiRequest(`/employer/job-posts/${id}`, {
    method: "PUT",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(jobData),
  });
}

export function updateEmployerJobStatus(token, id, status) {
  return apiRequest(`/employer/job-posts/${id}/status`, {
    method: "PATCH",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ status }),
  });
}

export function deleteEmployerJob(token, id) {
  return apiRequest(`/employer/job-posts/${id}`, {
    method: "DELETE",
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
}
