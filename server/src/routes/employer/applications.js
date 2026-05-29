import { Router } from "express";

export const employerApplicationsRouter = Router();

// GET /api/employer/applications
employerApplicationsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const jobIdFilter = request.query.job_id;

  try {
    // 1. Fetch employer's job posts to authorize and get job titles
    const jobsUrl = new URL("/rest/v1/job_posts", url);
    jobsUrl.searchParams.set("employer_id", `eq.${employerId}`);
    jobsUrl.searchParams.set("select", "id,title");

    const jobsRes = await fetchImpl(jobsUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!jobsRes.ok) throw new Error("Failed to fetch jobs");
    const jobs = await jobsRes.json();
    
    if (jobs.length === 0) {
      return response.json({ ok: true, applications: [] });
    }

    const jobMap = new Map(jobs.map(j => [j.id, j.title]));
    let validJobIds = jobs.map(j => j.id);

    if (jobIdFilter && validJobIds.includes(jobIdFilter)) {
      validJobIds = [jobIdFilter];
    }

    // 2. Fetch applications for these jobs
    const appsUrl = new URL("/rest/v1/applications", url);
    appsUrl.searchParams.set("job_id", `in.(${validJobIds.join(",")})`);
    appsUrl.searchParams.set("select", "*");
    appsUrl.searchParams.set("order", "applied_at.desc");

    const appsRes = await fetchImpl(appsUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!appsRes.ok) throw new Error("Failed to fetch applications");
    const applications = await appsRes.json();

    if (applications.length === 0) {
      return response.json({ ok: true, applications: [] });
    }

    // 3. Fetch student emails using Admin API
    const authRes = await fetchImpl(`${url}/auth/v1/admin/users`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    let usersMap = new Map();
    if (authRes.ok) {
      const authData = await authRes.json();
      const users = authData.users || [];
      usersMap = new Map(users.map(u => [u.id, u.email]));
    }

    // 4. Map the response
    const enrichedApplications = applications.map(app => ({
      ...app,
      job_title: jobMap.get(app.job_id) || "Unknown Job",
      student_email: usersMap.get(app.student_id) || "Unknown User",
    }));

    response.json({ ok: true, applications: enrichedApplications });
  } catch (error) {
    console.error("Failed to fetch applications:", error);
    response.status(500).json({ error: "Failed to fetch applications" });
  }
});

// GET /api/employer/applications/:id
employerApplicationsRouter.get("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const applicationId = request.params.id;

  try {
    // 1. Fetch application
    const appUrl = new URL("/rest/v1/applications", url);
    appUrl.searchParams.set("id", `eq.${applicationId}`);
    appUrl.searchParams.set("select", "*");

    const appRes = await fetchImpl(appUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });

    if (!appRes.ok) throw new Error("Failed to fetch application");
    const apps = await appRes.json();
    if (apps.length === 0) return response.status(404).json({ error: "Application not found" });
    const application = apps[0];

    // 2. Verify employer owns the job
    const jobUrl = new URL("/rest/v1/job_posts", url);
    jobUrl.searchParams.set("id", `eq.${application.job_id}`);
    jobUrl.searchParams.set("employer_id", `eq.${employerId}`);
    
    const jobRes = await fetchImpl(jobUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    
    const jobs = await jobRes.json();
    if (jobs.length === 0) return response.status(403).json({ error: "Access denied" });
    const job = jobs[0];

    // 3. Fetch student profile
    const profileUrl = new URL("/rest/v1/student_profile_snapshots", url);
    profileUrl.searchParams.set("user_id", `eq.${application.student_id}`);
    
    const profileRes = await fetchImpl(profileUrl.toString(), {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    
    const profiles = await profileRes.json();
    const studentProfile = profiles.length > 0 ? profiles[0] : null;

    // 4. Fetch student email
    const authRes = await fetchImpl(`${url}/auth/v1/admin/users/${application.student_id}`, {
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
      },
    });
    
    let studentEmail = "Unknown User";
    if (authRes.ok) {
      const user = await authRes.json();
      studentEmail = user.email;
    }

    response.json({
      ok: true,
      application: {
        ...application,
        job_title: job.title,
        student_email: studentEmail,
        student_profile: studentProfile,
      }
    });
  } catch (error) {
    console.error("Failed to fetch application details:", error);
    response.status(500).json({ error: "Failed to fetch application details" });
  }
});

// PATCH /api/employer/applications/:id/status
employerApplicationsRouter.patch("/:id/status", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const applicationId = request.params.id;
  const { status } = request.body;

  try {
    // 1. Verify ownership via subquery check (we'll just fetch the app and job first for safety)
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

    // 2. Update status
    const updateUrl = new URL("/rest/v1/applications", url);
    updateUrl.searchParams.set("id", `eq.${applicationId}`);

    const updateRes = await fetchImpl(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ status }),
    });

    if (!updateRes.ok) throw new Error("Failed to update status");
    const updated = await updateRes.json();
    
    response.json({ ok: true, application: updated[0] });
  } catch (error) {
    console.error("Failed to update application status:", error);
    response.status(500).json({ error: "Failed to update status" });
  }
});

// PATCH /api/employer/applications/:id/notes
employerApplicationsRouter.patch("/:id/notes", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const applicationId = request.params.id;
  const { notes } = request.body;

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

    // 2. Update notes
    const updateUrl = new URL("/rest/v1/applications", url);
    updateUrl.searchParams.set("id", `eq.${applicationId}`);

    const updateRes = await fetchImpl(updateUrl.toString(), {
      method: "PATCH",
      headers: {
        apikey: serviceRoleKey,
        Authorization: `Bearer ${serviceRoleKey}`,
        "Content-Type": "application/json",
        Prefer: "return=representation",
      },
      body: JSON.stringify({ notes }),
    });

    if (!updateRes.ok) throw new Error("Failed to update notes");
    const updated = await updateRes.json();
    
    response.json({ ok: true, application: updated[0] });
  } catch (error) {
    console.error("Failed to update application notes:", error);
    response.status(500).json({ error: "Failed to update notes" });
  }
});
