import { Router } from "express";
import { requireActiveSubscription } from "../../middleware/subscription.js";

export const jobPostsRouter = Router();

// Posting a job is a premium feature: requires an active employer subscription.
jobPostsRouter.post("/", requireActiveSubscription, async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);

    const payload = {
      ...request.body,
      employer_id: employerId,
    };

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(payload),
    });

    if (!supabaseResponse.ok) {
      const errorBody = await supabaseResponse.text();
      throw new Error(`Supabase error: ${supabaseResponse.status} ${errorBody}`);
    }

    const data = await supabaseResponse.json();
    const job = Array.isArray(data) ? data[0] : data;

    response.status(201).json({ ok: true, job });
  } catch (error) {
    console.error("Failed to create job post:", error);
    response.status(500).json({ error: "Failed to create job post" });
  }
});

jobPostsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);
    fetchUrl.searchParams.set("employer_id", `eq.${employerId}`);
    fetchUrl.searchParams.set("select", "*");
    fetchUrl.searchParams.set("order", "created_at.desc");

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const jobs = await supabaseResponse.json();
    response.json({ ok: true, jobs });
  } catch (error) {
    console.error("Failed to fetch job posts:", error);
    response.status(500).json({ error: "Failed to fetch job posts" });
  }
});

jobPostsRouter.get("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const jobId = request.params.id;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);
    fetchUrl.searchParams.set("id", `eq.${jobId}`);
    fetchUrl.searchParams.set("employer_id", `eq.${employerId}`);
    fetchUrl.searchParams.set("select", "*");

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "GET",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const data = await supabaseResponse.json();
    if (data.length === 0) {
      return response.status(404).json({ error: "Job post not found" });
    }

    response.json({ ok: true, job: data[0] });
  } catch (error) {
    console.error("Failed to fetch job post:", error);
    response.status(500).json({ error: "Failed to fetch job post" });
  }
});

jobPostsRouter.put("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const jobId = request.params.id;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);
    fetchUrl.searchParams.set("id", `eq.${jobId}`);
    fetchUrl.searchParams.set("employer_id", `eq.${employerId}`);

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(request.body),
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const data = await supabaseResponse.json();
    if (data.length === 0) {
      return response.status(404).json({ error: "Job post not found" });
    }

    response.json({ ok: true, job: data[0] });
  } catch (error) {
    console.error("Failed to update job post:", error);
    response.status(500).json({ error: "Failed to update job post" });
  }
});

jobPostsRouter.patch("/:id/status", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const jobId = request.params.id;
  const { status } = request.body;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);
    fetchUrl.searchParams.set("id", `eq.${jobId}`);
    fetchUrl.searchParams.set("employer_id", `eq.${employerId}`);

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    const data = await supabaseResponse.json();
    if (data.length === 0) {
      return response.status(404).json({ error: "Job post not found" });
    }

    response.json({ ok: true, job: data[0] });
  } catch (error) {
    console.error("Failed to update job status:", error);
    response.status(500).json({ error: "Failed to update job status" });
  }
});

jobPostsRouter.delete("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const jobId = request.params.id;

  try {
    const fetchUrl = new URL("/rest/v1/job_posts", url);
    fetchUrl.searchParams.set("id", `eq.${jobId}`);
    fetchUrl.searchParams.set("employer_id", `eq.${employerId}`);

    const supabaseResponse = await fetchImpl(fetchUrl.toString(), {
      method: "DELETE",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!supabaseResponse.ok) {
      throw new Error(`Supabase error: ${supabaseResponse.status}`);
    }

    response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete job post:", error);
    response.status(500).json({ error: "Failed to delete job post" });
  }
});
