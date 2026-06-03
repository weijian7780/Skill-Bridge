import { apiRequest } from "../apiClient.js";

export async function uploadCertificate(token, file, title) {
  const formData = new FormData();
  formData.append("certificate", file);
  formData.append("title", title || file.name);
  return await apiRequest("/student/certificates", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}` },
    body: formData,
  });
}

export async function listCertificates(token) {
  return await apiRequest("/student/certificates", {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function getCertificateUrl(token, id) {
  return await apiRequest(`/student/certificates/${id}/url`, {
    method: "GET",
    headers: { Authorization: `Bearer ${token}` },
  });
}

export async function deleteCertificate(token, id) {
  return await apiRequest(`/student/certificates/${id}`, {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}` },
  });
}
