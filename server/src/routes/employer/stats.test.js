import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { employerStatsRouter } from "./stats.js";

function createTestApp(mockUser, fetchImpl) {
  const app = express();
  app.use(express.json());
  app.use((request, response, next) => {
    request.user = mockUser;
    request.supabase = { url: "https://test.supabase.co", serviceRoleKey: "test-key", fetchImpl };
    next();
  });
  app.use("/stats", employerStatsRouter);
  return app;
}

function listen(app) {
  const server = app.listen(0);
  const { port } = server.address();
  return { server, baseUrl: `http://127.0.0.1:${port}` };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => server.close((e) => (e ? reject(e) : resolve())));
}

test("GET /stats does not 500 when an application has a null applied_at", async () => {
  const fetchImpl = async (url) => {
    if (String(url).includes("/rest/v1/job_posts")) {
      return { ok: true, status: 200, async json() { return [{ id: "job-1", status: "active", created_at: "2026-06-01T00:00:00Z" }]; } };
    }
    // One application with a null date (the crash case) and one valid.
    return {
      ok: true,
      status: 200,
      async json() {
        return [
          { id: "a1", status: "pending", applied_at: null },
          { id: "a2", status: "hired", applied_at: new Date().toISOString() },
        ];
      },
    };
  };

  const app = createTestApp({ id: "employer-1", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/stats`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.stats.totalJobs, 1);
    assert.equal(body.stats.totalApplications, 2);
    assert.equal(body.stats.appsOverTime.length, 7);
    // The valid application falls on today; the null one is simply ignored.
    const todayKey = new Date().toISOString().split("T")[0];
    const todayBucket = body.stats.appsOverTime.find((d) => d.date === todayKey);
    assert.equal(todayBucket.applications, 1);
  } finally {
    await closeServer(server);
  }
});
