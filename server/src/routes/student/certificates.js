import { Router } from "express";
import multer from "multer";
import { parseCvBuffer } from "../../services/cvParser.js";
import { extractCvImageTextWithGemini } from "../../services/llm/geminiClient.js";
import { extractCertificateSkills } from "../../services/llm/certificateSkillExtractor.js";

export const certificatesRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function safeFileName(name) {
  return String(name || "certificate").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

function serviceHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

// POST /  (multipart: file field "certificate", text field "title")
// Uploads the file to the private `certificates` bucket and stores a metadata row.
certificatesRouter.post("/", upload.single("certificate"), async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  if (!request.file) {
    return response.status(400).json({ error: "No certificate file uploaded" });
  }

  const title = String(request.body?.title || request.file.originalname || "Certificate").slice(0, 200);
  const path = `${studentId}/cert-${Date.now()}-${safeFileName(request.file.originalname)}`;

  try {
    const uploadRes = await fetchImpl(`${url}/storage/v1/object/certificates/${path}`, {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": request.file.mimetype || "application/octet-stream",
        "x-upsert": "true",
      },
      body: request.file.buffer,
    });

    if (!uploadRes.ok) {
      const errorBody = await uploadRes.text();
      throw new Error(`Storage upload failed: ${uploadRes.status} ${errorBody}`);
    }

    // Best-effort: read the certificate and detect the skills it proves.
    // Never let extraction failure block the upload.
    const skillTags = await detectCertificateSkills(request.file);

    const insertRes = await fetchImpl(new URL("/rest/v1/student_certificates", url).toString(), {
      method: "POST",
      headers: { ...serviceHeaders(serviceRoleKey), Prefer: "return=representation" },
      body: JSON.stringify({
        user_id: studentId,
        title,
        skill_tags: skillTags,
        storage_path: path,
        file_name: request.file.originalname || "",
        mime_type: request.file.mimetype || "",
      }),
    });

    if (!insertRes.ok) {
      const errorBody = await insertRes.text();
      throw new Error(`Supabase insert error: ${insertRes.status} ${errorBody}`);
    }

    const data = await insertRes.json();
    response.status(201).json({ ok: true, certificate: Array.isArray(data) ? data[0] : data });
  } catch (error) {
    console.error("Failed to upload certificate:", error);
    response.status(500).json({ error: "Failed to upload certificate" });
  }
});

// GET /  -> the student's own certificates
certificatesRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/student_certificates", url);
    fetchUrl.searchParams.set("user_id", `eq.${studentId}`);
    fetchUrl.searchParams.set("select", "*");
    fetchUrl.searchParams.set("order", "created_at.desc");

    const res = await fetchImpl(fetchUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
    if (!res.ok) throw new Error(`Supabase error: ${res.status}`);

    const certificates = await res.json();
    response.json({ ok: true, certificates });
  } catch (error) {
    console.error("Failed to fetch certificates:", error);
    response.status(500).json({ error: "Failed to fetch certificates" });
  }
});

// GET /:id/url  -> short-lived signed URL so the student can view their own file
certificatesRouter.get("/:id/url", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  try {
    const path = await getOwnedCertificatePath({ url, serviceRoleKey, fetchImpl }, studentId, request.params.id);
    if (!path) return response.status(404).json({ error: "Certificate not found" });

    const signed = await signCertificateUrl({ url, serviceRoleKey, fetchImpl }, path);
    response.json({ ok: true, url: signed });
  } catch (error) {
    console.error("Failed to generate certificate URL:", error);
    response.status(500).json({ error: "Failed to generate certificate URL" });
  }
});

// DELETE /:id  -> remove the file from storage and the metadata row
certificatesRouter.delete("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  try {
    const path = await getOwnedCertificatePath({ url, serviceRoleKey, fetchImpl }, studentId, request.params.id);
    if (!path) return response.status(404).json({ error: "Certificate not found" });

    // Best-effort storage delete; the metadata row is the source of truth.
    await fetchImpl(`${url}/storage/v1/object/certificates/${path}`, {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });

    const deleteUrl = new URL("/rest/v1/student_certificates", url);
    deleteUrl.searchParams.set("id", `eq.${request.params.id}`);
    deleteUrl.searchParams.set("user_id", `eq.${studentId}`);
    const delRes = await fetchImpl(deleteUrl.toString(), {
      method: "DELETE",
      headers: serviceHeaders(serviceRoleKey),
    });
    if (!delRes.ok) throw new Error(`Supabase delete error: ${delRes.status}`);

    response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete certificate:", error);
    response.status(500).json({ error: "Failed to delete certificate" });
  }
});

// --- helpers ----------------------------------------------------------------

// Parse the uploaded file to text, then ask the LLM which skills it proves.
// Returns [] on any failure so the upload itself is never affected.
async function detectCertificateSkills(file) {
  try {
    const parsed = await parseCvBuffer({
      buffer: file.buffer,
      filename: file.originalname,
      mimeType: file.mimetype,
      imageTextExtractor: extractCvImageTextWithGemini,
    });
    const { skills } = await extractCertificateSkills(parsed.text);
    return Array.isArray(skills) ? skills : [];
  } catch (error) {
    console.error("Certificate skill extraction failed (non-fatal):", error.message);
    return [];
  }
}

// Returns the storage_path only if the certificate belongs to this student.
async function getOwnedCertificatePath({ url, serviceRoleKey, fetchImpl }, studentId, certificateId) {
  const fetchUrl = new URL("/rest/v1/student_certificates", url);
  fetchUrl.searchParams.set("id", `eq.${certificateId}`);
  fetchUrl.searchParams.set("user_id", `eq.${studentId}`);
  fetchUrl.searchParams.set("select", "storage_path");
  const res = await fetchImpl(fetchUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
  if (!res.ok) throw new Error(`Supabase error: ${res.status}`);
  const rows = await res.json();
  return rows.length ? rows[0].storage_path : null;
}

export async function signCertificateUrl({ url, serviceRoleKey, fetchImpl }, path) {
  const signRes = await fetchImpl(`${url}/storage/v1/object/sign/certificates/${path}`, {
    method: "POST",
    headers: serviceHeaders(serviceRoleKey),
    body: JSON.stringify({ expiresIn: 3600 }),
  });
  if (!signRes.ok) throw new Error(`Failed to sign certificate URL: ${signRes.status}`);
  const signed = await signRes.json();
  return `${url}/storage/v1${signed.signedURL}`;
}
