import { Router } from "express";

export const employerStatsRouter = Router();

employerStatsRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;

  try {
    // 1. Fetch total jobs
    const jobsUrl = new URL("/rest/v1/job_posts", url);
    jobsUrl.searchParams.set("employer_id", `eq.${employerId}`);
    jobsUrl.searchParams.set("select", "id,status,created_at");

    const jobsRes = await fetchImpl(jobsUrl.toString(), {
      headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
    });
    const jobs = await jobsRes.json();
    const jobIds = jobs.map(j => j.id);

    // 2. Fetch applications for these jobs
    let applications = [];
    if (jobIds.length > 0) {
      const appsUrl = new URL("/rest/v1/applications", url);
      appsUrl.searchParams.set("job_id", `in.(${jobIds.join(",")})`);
      appsUrl.searchParams.set("select", "id,status,applied_at");

      const appsRes = await fetchImpl(appsUrl.toString(), {
        headers: { apikey: serviceRoleKey, Authorization: `Bearer ${serviceRoleKey}` },
      });
      applications = await appsRes.json();
    }

    // 3. Compute stats
    const totalJobs = jobs.length;
    const activeJobs = jobs.filter(j => j.status === "active").length;
    const totalApplications = applications.length;

    // Status distribution
    const statusCounts = applications.reduce((acc, app) => {
      acc[app.status] = (acc[app.status] || 0) + 1;
      return acc;
    }, {});

    const statusDistribution = Object.entries(statusCounts).map(([name, value]) => ({ name, value }));

    // Applications over time (last 7 days)
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return d.toISOString().split("T")[0];
    }).reverse();

    const appsOverTime = last7Days.map(date => {
      return {
        date: date,
        applications: applications.filter(a => typeof a.applied_at === "string" && a.applied_at.startsWith(date)).length
      };
    });

    response.json({
      ok: true,
      stats: {
        totalJobs,
        activeJobs,
        totalApplications,
        statusDistribution,
        appsOverTime
      }
    });
  } catch (error) {
    console.error("Failed to fetch employer stats:", error);
    response.status(500).json({ error: "Failed to fetch stats" });
  }
});
