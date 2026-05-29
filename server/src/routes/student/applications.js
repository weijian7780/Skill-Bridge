import { Router } from "express";

export const applicationsRouter = Router();

applicationsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/applications", url);
    fetchUrl.searchParams.set("student_id", `eq.${studentId}`);
    fetchUrl.searchParams.set("select", "*,job_posts(*)");
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
      // Handle unique constraint violation gracefully if needed
      if (errorBody.includes("unique_violation")) {
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
