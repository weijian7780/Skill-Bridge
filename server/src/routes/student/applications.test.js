import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { applicationsRouter } from "./applications.js";

function createTestApp(mockUser, fetchImpl) {
  const app = express();
  app.use(express.json());
  
  app.use((request, response, next) => {
    if (!mockUser) {
      return response.status(401).json({ error: "Authentication required" });
    }
    if (mockUser.role !== "student") {
      return response.status(403).json({ error: "This endpoint requires the 'student' role" });
    }
    request.user = mockUser;
    
    request.supabase = {
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      fetchImpl,
    };
    next();
  });

  app.use("/applications", applicationsRouter);
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

test("POST /applications submits application successfully", async () => {
  const mockApplication = { id: "app-1", job_id: "job-1", status: "pending" };
  
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname === "/rest/v1/job_posts") {
      return { ok: true, status: 200, async json() { return [{ id: "job-1", status: "active" }]; } };
    }
    if (parsedUrl.pathname === "/rest/v1/applications") {
      return { ok: true, status: 201, async json() { return [mockApplication]; } };
    }
    throw new Error("Unexpected URL");
  };

  const app = createTestApp({ id: "student-123", role: "student" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: "job-1", cover_letter: "Hire me" }),
    });
    const body = await response.json();

    assert.equal(response.status, 201);
    assert.equal(body.ok, true);
    assert.equal(body.application.id, "app-1");
  } finally {
    await closeServer(server);
  }
});

test("POST /applications fails if job is not active", async () => {
  const fetchImpl = async (url) => {
    const parsedUrl = new URL(url);
    if (parsedUrl.pathname === "/rest/v1/job_posts") {
      return { ok: true, status: 200, async json() { return [{ id: "job-1", status: "paused" }]; } };
    }
    throw new Error("Should not reach insert");
  };

  const app = createTestApp({ id: "student-123", role: "student" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/applications`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ job_id: "job-1", cover_letter: "Hire me" }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.equal(body.error, "Job is not active or does not exist");
  } finally {
    await closeServer(server);
  }
});

test("GET /applications lists student applications", async () => {
  const mockApplication = { id: "app-1", job_id: "job-1", status: "pending" };
  
  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, async json() { return [mockApplication]; } };
  };

  const app = createTestApp({ id: "student-123", role: "student" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/applications`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.applications.length, 1);
    
    const lastCall = calls[0];
    const url = new URL(lastCall.url);
    assert.equal(url.pathname, "/rest/v1/applications");
    assert.equal(url.searchParams.get("student_id"), "eq.student-123");
  } finally {
    await closeServer(server);
  }
});
