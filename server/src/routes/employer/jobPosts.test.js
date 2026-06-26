import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { jobPostsRouter } from "./jobPosts.js";

function createTestApp(mockUser, fetchImpl) {
  const app = express();
  app.use(express.json());
  
  app.use((request, response, next) => {
    if (!mockUser) {
      return response.status(401).json({ error: "Authentication required" });
    }
    if (mockUser.role !== "employer") {
      return response.status(403).json({ error: "This endpoint requires the 'employer' role" });
    }
    request.user = mockUser;
    
    request.supabase = {
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      fetchImpl,
    };
    next();
  });

  app.use("/job-posts", jobPostsRouter);
  return app;
}

function listen(app) {
  const server = app.listen(0);
  const { port } = server.address();
  const baseUrl = `http://127.0.0.1:${port}`;
  return { server, baseUrl };
}

async function closeServer(server) {
  await new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}

test("POST /job-posts creates a new job post in Supabase and returns it", async () => {
  const mockCreatedJob = {
    id: "job-123",
    employer_id: "employer-123",
    title: "Software Engineer",
    status: "draft",
  };

  const calls = [];
  const fetchImpl = async (url, options) => {
    // The subscription gate checks employer_subscriptions first; report active.
    if (String(url).includes("employer_subscriptions")) {
      return { ok: true, status: 200, async json() { return [{ status: "active", expires_at: "2999-01-01T00:00:00Z" }]; } };
    }
    calls.push({ url, options });
    return {
      ok: true,
      status: 201,
      async json() {
        return [mockCreatedJob];
      },
    };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Software Engineer" }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.job.id, "job-123");
    
    const lastCall = calls[0];
    const url = new URL(lastCall.url);
    assert.equal(url.pathname, "/rest/v1/job_posts");
    assert.equal(lastCall.options.headers.Prefer, "return=representation");
    
    const requestBody = JSON.parse(lastCall.options.body);
    assert.equal(requestBody.employer_id, "employer-123");
    assert.equal(requestBody.title, "Software Engineer");
  } finally {
    await closeServer(server);
  }
});

test("GET /job-posts lists only the employer's own job posts from Supabase", async () => {
  const mockJobs = [
    { id: "job-1", title: "Dev" },
    { id: "job-2", title: "Designer" },
  ];

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return mockJobs;
      },
    };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.jobs.length, 2);
    assert.equal(body.jobs[0].title, "Dev");
    
    const lastCall = calls[0];
    const url = new URL(lastCall.url);
    assert.equal(url.pathname, "/rest/v1/job_posts");
    assert.equal(url.searchParams.get("employer_id"), "eq.employer-123");
    assert.equal(url.searchParams.get("order"), "created_at.desc");
  } finally {
    await closeServer(server);
  }
});

test("GET /job-posts/:id returns a specific job post belonging to the employer", async () => {
  const mockJob = { id: "job-123", title: "Dev" };
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() { return [mockJob]; },
    };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts/job-123`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.job.title, "Dev");
    
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get("id"), "eq.job-123");
    assert.equal(url.searchParams.get("employer_id"), "eq.employer-123");
  } finally {
    await closeServer(server);
  }
});

test("PUT /job-posts/:id updates a job post", async () => {
  const mockJob = { id: "job-123", title: "Updated Dev" };
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, async json() { return [mockJob]; } };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts/job-123`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "Updated Dev" }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.job.title, "Updated Dev");
    
    const url = new URL(calls[0].url);
    assert.equal(url.searchParams.get("id"), "eq.job-123");
    assert.equal(url.searchParams.get("employer_id"), "eq.employer-123");
    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.title, "Updated Dev");
  } finally {
    await closeServer(server);
  }
});

test("PATCH /job-posts/:id/status updates job status", async () => {
  const mockJob = { id: "job-123", status: "active" };
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, async json() { return [mockJob]; } };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts/job-123/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "active" }),
    });
    
    assert.equal(response.status, 200);
    
    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.status, "active");
  } finally {
    await closeServer(server);
  }
});

test("PATCH /job-posts/:id/status rejects an invalid status with 400 and never calls Supabase", async () => {
  let called = false;
  const fetchImpl = async () => { called = true; return { ok: true, status: 200, async json() { return []; } }; };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts/job-123/status`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: "banana" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /Invalid job status/);
    assert.equal(called, false, "must reject before touching Supabase");
  } finally {
    await closeServer(server);
  }
});

test("PATCH /job-posts/:id/status accepts every valid status", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, async json() { return [{ id: "job-123" }]; } });
  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    for (const status of ["draft", "active", "paused", "closed"]) {
      const response = await fetch(`${baseUrl}/job-posts/job-123/status`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      assert.equal(response.status, 200, `status "${status}" should be accepted`);
    }
  } finally {
    await closeServer(server);
  }
});

test("DELETE /job-posts/:id deletes a job post", async () => {
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 204 };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/job-posts/job-123`, {
      method: "DELETE",
    });
    
    assert.equal(response.status, 200);
    
    const lastCall = calls[0];
    assert.equal(lastCall.options.method, "DELETE");
    const url = new URL(lastCall.url);
    assert.equal(url.searchParams.get("id"), "eq.job-123");
    assert.equal(url.searchParams.get("employer_id"), "eq.employer-123");
  } finally {
    await closeServer(server);
  }
});
