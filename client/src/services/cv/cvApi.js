import { apiRequest } from "../apiClient.js";

export function uploadCv(file) {
  const formData = new FormData();
  formData.append("cv", file);

  return apiRequest("/cv/extract", {
    method: "POST",
    body: formData,
  });
}
