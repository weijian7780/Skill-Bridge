import { Router } from "express";
import { sendInterviewInvitation } from "../../services/emailService.js";

export const employerInterviewsRouter = Router();

// POST /api/employer/interviews
employerInterviewsRouter.post("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const { application_id, scheduled_at, duration_minutes, location, meeting_link, notes } = request.body;

  if (!application_id || !scheduled_at) {
    return response.status(400).json({ error: "application_id and scheduled_at are required" });
  }

  try {
    // 1. Verify ownership of the application's job
    const appUrl = new URL("/rest/v1/applications", url);
    appUrl.searchParams.set("id", `eq.${application_id}`);
    appUrl.searchParams.set("select", "job_id");

    const appRes = await fetchImpl(appUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const apps = await appRes.json();
    if (apps.length === 0) return response.status(404).json({ error: "Application not found" });

    const jobUrl = new URL("/rest/v1/job_posts", url);
    jobUrl.searchParams.set("id", `eq.${apps[0].job_id}`);
    jobUrl.searchParams.set("employer_id", `eq.${employerId}`);
    const jobRes = await fetchImpl(jobUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const jobs = await jobRes.json();
    if (jobs.length === 0) return response.status(403).json({ error: "Access denied" });

    // 2. Insert interview
    const insertUrl = new URL("/rest/v1/interviews", url);
    const insertRes = await fetchImpl(insertUrl.toString(), {
      method: "POST",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({
        application_id,
        scheduled_at,
        duration_minutes: duration_minutes || 30,
        location,
        meeting_link,
        notes,
        status: "scheduled"
      }),
    });

    if (!insertRes.ok) throw new Error("Failed to create interview");
    const created = await insertRes.json();

    // 3. Update application status to 'interview'
    const updateUrl = new URL("/rest/v1/applications", url);
    updateUrl.searchParams.set("id", `eq.${application_id}`);
    await fetchImpl(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status: "interview" }),
    });

    // 4. Send email to student (best-effort)
    try {
      const svcHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };

      // Job title via the applications -> job_posts FK (this embed is valid).
      const studentUrl = new URL("/rest/v1/applications", url);
      studentUrl.searchParams.set("id", `eq.${application_id}`);
      studentUrl.searchParams.set("select", "student_id,job_posts(title)");
      const stRes = await fetchImpl(studentUrl.toString(), { headers: svcHeaders });
      const stData = await stRes.json();

      if (Array.isArray(stData) && stData.length > 0) {
        const jobTitle = stData[0].job_posts?.title || "the role";

        // Company name: fetched separately (no FK between job_posts and employer_profiles).
        let companyName = "the company";
        const profUrl = new URL("/rest/v1/employer_profiles", url);
        profUrl.searchParams.set("user_id", `eq.${employerId}`);
        profUrl.searchParams.set("select", "company_name");
        const profRes = await fetchImpl(profUrl.toString(), { headers: svcHeaders });
        if (profRes.ok) {
          const prof = await profRes.json();
          companyName = prof[0]?.company_name || companyName;
        }

        // Student email lives in auth.users, not applications.
        const authRes = await fetchImpl(`${url}/auth/v1/admin/users/${stData[0].student_id}`, { headers: svcHeaders });
        if (authRes.ok) {
          const user = await authRes.json();
          if (user.email) {
            await sendInterviewInvitation(user.email, jobTitle, companyName, {
              scheduled_at, duration_minutes, location, meeting_link
            });
          }
        }
      }
    } catch (emailErr) {
      console.error("Non-fatal: Failed to trigger email", emailErr);
    }
    
    response.json({ ok: true, interview: created[0] });
  } catch (error) {
    console.error("Failed to create interview:", error);
    response.status(500).json({ error: "Failed to create interview" });
  }
});

// Verify the employer owns the job behind a given interview.
async function verifyInterviewOwnership({ url, serviceRoleKey, fetchImpl }, interviewId, employerId) {
  const ivUrl = new URL("/rest/v1/interviews", url);
  ivUrl.searchParams.set("id", `eq.${interviewId}`);
  ivUrl.searchParams.set("select", "id,application_id");
  const ivRes = await fetchImpl(ivUrl.toString(), {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const ivs = await ivRes.json();
  if (!ivs.length) return { ok: false, status: 404, error: "Interview not found" };

  const appUrl = new URL("/rest/v1/applications", url);
  appUrl.searchParams.set("id", `eq.${ivs[0].application_id}`);
  appUrl.searchParams.set("select", "job_id");
  const appRes = await fetchImpl(appUrl.toString(), {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const apps = await appRes.json();
  if (!apps.length) return { ok: false, status: 404, error: "Application not found" };

  const jobUrl = new URL("/rest/v1/job_posts", url);
  jobUrl.searchParams.set("id", `eq.${apps[0].job_id}`);
  jobUrl.searchParams.set("employer_id", `eq.${employerId}`);
  const jobRes = await fetchImpl(jobUrl.toString(), {
    headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
  });
  const jobs = await jobRes.json();
  if (!jobs.length) return { ok: false, status: 403, error: "Access denied" };

  return { ok: true, applicationId: ivs[0].application_id };
}

// Look up the candidate's email + job/company for an application, then email them.
async function emailCandidateAboutInterview({ url, serviceRoleKey, fetchImpl }, { applicationId, employerId, scheduleData, rescheduled }) {
  const svcHeaders = { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` };

  const appUrl = new URL("/rest/v1/applications", url);
  appUrl.searchParams.set("id", `eq.${applicationId}`);
  appUrl.searchParams.set("select", "student_id,job_posts(title)");
  const appRes = await fetchImpl(appUrl.toString(), { headers: svcHeaders });
  const apps = await appRes.json();
  if (!Array.isArray(apps) || !apps.length) return;

  const jobTitle = apps[0].job_posts?.title || "the role";

  let companyName = "the company";
  const profUrl = new URL("/rest/v1/employer_profiles", url);
  profUrl.searchParams.set("user_id", `eq.${employerId}`);
  profUrl.searchParams.set("select", "company_name");
  const profRes = await fetchImpl(profUrl.toString(), { headers: svcHeaders });
  if (profRes.ok) {
    const prof = await profRes.json();
    companyName = prof[0]?.company_name || companyName;
  }

  const authRes = await fetchImpl(`${url}/auth/v1/admin/users/${apps[0].student_id}`, { headers: svcHeaders });
  if (authRes.ok) {
    const user = await authRes.json();
    if (user.email) {
      await sendInterviewInvitation(user.email, jobTitle, companyName, scheduleData, { rescheduled });
    }
  }
}

// PATCH /api/employer/interviews/:id  -> edit a scheduled interview
employerInterviewsRouter.patch("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const interviewId = request.params.id;

  try {
    const owns = await verifyInterviewOwnership(request.supabase, interviewId, employerId);
    if (!owns.ok) return response.status(owns.status).json({ error: owns.error });

    const allowed = ["scheduled_at", "duration_minutes", "location", "meeting_link", "notes", "status"];
    const updates = {};
    for (const key of allowed) {
      if (key in request.body) updates[key] = request.body[key];
    }

    const updateUrl = new URL("/rest/v1/interviews", url);
    updateUrl.searchParams.set("id", `eq.${interviewId}`);
    const updateRes = await fetchImpl(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify(updates),
    });

    if (!updateRes.ok) throw new Error("Failed to update interview");
    const updated = await updateRes.json();

    // Notify the candidate that their interview was rescheduled (best-effort).
    try {
      const iv = updated[0];
      await emailCandidateAboutInterview(request.supabase, {
        applicationId: owns.applicationId,
        employerId,
        scheduleData: {
          scheduled_at: iv.scheduled_at,
          duration_minutes: iv.duration_minutes,
          location: iv.location,
          meeting_link: iv.meeting_link,
        },
        rescheduled: true,
      });
    } catch (emailErr) {
      console.error("Non-fatal: failed to send reschedule email", emailErr);
    }

    response.json({ ok: true, interview: updated[0] });
  } catch (error) {
    console.error("Failed to update interview:", error);
    response.status(500).json({ error: "Failed to update interview" });
  }
});

// DELETE /api/employer/interviews/:id  -> cancel/remove a scheduled interview
employerInterviewsRouter.delete("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const interviewId = request.params.id;

  try {
    const owns = await verifyInterviewOwnership(request.supabase, interviewId, employerId);
    if (!owns.ok) return response.status(owns.status).json({ error: owns.error });

    const deleteUrl = new URL("/rest/v1/interviews", url);
    deleteUrl.searchParams.set("id", `eq.${interviewId}`);
    const deleteRes = await fetchImpl(deleteUrl.toString(), {
      method: "DELETE",
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });

    if (!deleteRes.ok) throw new Error("Failed to delete interview");
    response.json({ ok: true });
  } catch (error) {
    console.error("Failed to delete interview:", error);
    response.status(500).json({ error: "Failed to delete interview" });
  }
});

// GET /api/employer/interviews?application_id=...
employerInterviewsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const applicationId = request.query.application_id;

  if (!applicationId) {
    return response.status(400).json({ error: "application_id is required" });
  }

  try {
    // 1. Verify ownership
    const appUrl = new URL("/rest/v1/applications", url);
    appUrl.searchParams.set("id", `eq.${applicationId}`);
    appUrl.searchParams.set("select", "job_id");

    const appRes = await fetchImpl(appUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const apps = await appRes.json();
    if (apps.length === 0) return response.status(404).json({ error: "Application not found" });

    const jobUrl = new URL("/rest/v1/job_posts", url);
    jobUrl.searchParams.set("id", `eq.${apps[0].job_id}`);
    jobUrl.searchParams.set("employer_id", `eq.${employerId}`);
    const jobRes = await fetchImpl(jobUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const jobs = await jobRes.json();
    if (jobs.length === 0) return response.status(403).json({ error: "Access denied" });

    // 2. Fetch interviews
    const getUrl = new URL("/rest/v1/interviews", url);
    getUrl.searchParams.set("application_id", `eq.${applicationId}`);
    getUrl.searchParams.set("order", "scheduled_at.desc");

    const getRes = await fetchImpl(getUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      }
    });

    if (!getRes.ok) throw new Error("Failed to fetch interviews");
    const interviews = await getRes.json();

    response.json({ ok: true, interviews });
  } catch (error) {
    console.error("Failed to fetch interviews:", error);
    response.status(500).json({ error: "Failed to fetch interviews" });
  }
});
