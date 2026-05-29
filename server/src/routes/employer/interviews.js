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

    // 4. Send email to student
    try {
      // Get student email and company info
      const studentUrl = new URL("/rest/v1/applications", url);
      studentUrl.searchParams.set("id", `eq.${application_id}`);
      studentUrl.searchParams.set("select", "student_email,job_posts(title,employer_profiles(company_name))");
      const stRes = await fetchImpl(studentUrl.toString(), {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` }
      });
      const stData = await stRes.json();
      
      if (stData.length > 0) {
        const studentEmail = stData[0].student_email;
        const jobTitle = stData[0].job_posts?.title || "Unknown Job";
        const companyName = stData[0].job_posts?.employer_profiles?.company_name || "Unknown Company";
        
        await sendInterviewInvitation(studentEmail, jobTitle, companyName, {
          scheduled_at, duration_minutes, location, meeting_link
        });
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
