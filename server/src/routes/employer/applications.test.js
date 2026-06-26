import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { employerApplicationsRouter } from "./applications.js";

function createTestApp(mockUser, fetchImpl) {
  const app = express();
  app.use(express.json());
  app.use((request, response, next) => {
    request.user = mockUser;
    request.supabase = { url: "https://test.supabase.co", serviceRoleKey: "test-key", fetchImpl };
    next();
  });
  app.use("/applications", employerApplicationsRouter);
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

// Routes the ownership chain for a status update on an application the employer owns.
function ownedApplicationFetch(updatedStatus) {
  return async (url, options) => {
    if (String(url).includes("/rest/v1/applications") && options?.method === "PATCH") {
      return { ok: true, status: 200, async json() { return [{ id: "app-1", status: updatedStatus }]; } };
    }
    if (String(url).includes("/rest/v1/applications")) {
      return { ok: true, status: 200, async json() { return [{ job_id: "job-1" }]; } };
    }
    if (String(url).includes("/rest/v1/job_posts")) {
      return { ok: true, status: 200, async json() { return [{ id: "job-1" }]; } };
    }
    return { ok: true, status: 200, async json() { return []; } };
  };
}

test("PATCH /applications/:id/status rejects an invalid status with 400 and never calls Supabase", async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return { ok: true, status: 200, async json() { return []; } }; };

  const app = createTestApp({ id: "employer-1", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/applications/app-1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "promoted" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /Invalid application status/);
    assert.equal(called, false, "must reject before touching Supabase");
  } finally {
    await closeServer(server);
  }
});

test("PATCH /applications/:id/status accepts every valid status", async () => {
  for (const status of ["pending", "reviewed", "shortlisted", "interview", "hired", "rejected"]) {
    const app = createTestApp({ id: "employer-1", role: "employer" }, ownedApplicationFetch(status));
    const { server, baseUrl } = listen(app);
    try {
      const response = await fetch(`${baseUrl}/applications/app-1/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      assert.equal(response.status, 200, `status "${status}" should be accepted`);
    } finally {
      await closeServer(server);
    }
  }
});

test("PATCH /applications/:id/status rejects a missing status with 400", async () => {
  const app = createTestApp({ id: "employer-1", role: "employer" }, async () => ({ ok: true, status: 200, async json() { return []; } }));
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/applications/app-1/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    assert.equal(response.status, 400);
  } finally {
    await closeServer(server);
  }
});
