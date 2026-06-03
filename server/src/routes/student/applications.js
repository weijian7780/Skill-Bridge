import { Router } from "express";
import multer from "multer";

export const applicationsRouter = Router();

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

function safeFileName(name) {
  return String(name || "resume").replace(/[^a-zA-Z0-9._-]/g, "_").slice(-80);
}

// Upload a resume file to the public `resumes` bucket and return its public URL.
applicationsRouter.post("/resume", upload.single("resume"), async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  if (!request.file) {
    return response.status(400).json({ error: "No resume file uploaded" });
  }

  const path = `${studentId}/resume-${Date.now()}-${safeFileName(request.file.originalname)}`;

  try {
    const uploadUrl = `${url}/storage/v1/object/resumes/${path}`;
    const uploadRes = await fetchImpl(uploadUrl, {
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

    // Store the path (private bucket). Employers get a short-lived signed URL on demand.
    response.status(201).json({ ok: true, path });
  } catch (error) {
    console.error("Failed to upload resume:", error);
    response.status(500).json({ error: "Failed to upload resume" });
  }
});

applicationsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/applications", url);
    fetchUrl.searchParams.set("student_id", `eq.${studentId}`);
    fetchUrl.searchParams.set("select", "*,job_posts(*),interviews(*)");
    fetchUrl.searchParams.set("order", "applied_at.desc");

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      console.error("Supabase GET applications error:", errorBody);
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const applications = await supabaseResponse.json();
    response.json({ ok: true, applications });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    response.status(500).json({ error: "Failed to fetch applications" });
  }
});

applicationsRouter.post("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;
  const { job_id, cover_letter, resume_storage_path, portfolio_url, github_url } = request.body;

  if (!job_id) {
    return response.status(400).json({ error: "job_id is required" });
  }

  try {
    // 1. Validate the job is active
    const jobUrl = new URL("/rest/v1/job_posts", url);
    jobUrl.searchParams.set("id", `eq.${job_id}`);
    jobUrl.searchParams.set("select", "id,status");

    const jobResponse = await fetchImpl(jobUrl.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!jobResponse.ok) {
      throw new Error("Failed to validate job");
    }

    const jobs = await jobResponse.json();
    if (jobs.length === 0 || jobs[0].status !== "active") {
      return response.status(400).json({ error: "Job is not active or does not exist" });
    }

    // 2. Insert application
    const insertUrl = new URL("/rest/v1/applications", url);
    const payload = {
      job_id,
      student_id: studentId,
      status: "pending",
      cover_letter,
      resume_storage_path,
      portfolio_url,
      github_url,
    };

    const insertResponse = await fetchImpl(insertUrl.toString(), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!insertResponse.ok) {
      const errorBody = await insertResponse.text();
      // PostgREST reports a unique-constraint violation as code 23505 ("duplicate key").
      if (errorBody.includes("23505") || errorBody.includes("duplicate key")) {
        return response.status(409).json({ error: "You have already applied for this job" });
      }
      throw new Error(`Supabase insert error: ${insertResponse.status} ${errorBody}`);
    }

    const data = await insertResponse.json();
    const application = Array.isArray(data) ? data[0] : data;

    response.status(201).json({ ok: true, application });
  } catch (error) {
    console.error("Failed to submit application:", error);
    response.status(500).json({ error: "Failed to submit application" });
  }
});
