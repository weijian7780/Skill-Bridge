import test from "node:test";
import assert from "node:assert/strict";
import express from "express";

import { requireAuth, requireRole } from "./auth.js";

function fakeFetch(status, body) {
  return async () => ({
    ok: status >= 200 && status < 300,
    status,
    async json() { return body; },
  });
}

function createTestApp(...middlewares) {
  const app = express();
  app.use(express.json());
  app.get("/protected", ...middlewares, (request, response) => {
    response.json({ ok: true, user: request.user });
  });
  return app;
}

function authMiddleware(fetchImpl) {
  return requireAuth({
    supabaseUrl: "https://test.supabase.co",
    supabaseKey: "test-key",
    fetchImpl,
  });
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

test("rejects requests without an Authorization header", async () => {
  const app = createTestApp(authMiddleware(fakeFetch(200, {})));
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`);
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, "Missing or invalid Authorization header");
  } finally {
    await closeServer(server);
  }
});

test("rejects requests with an invalid access token", async () => {
  const app = createTestApp(authMiddleware(fakeFetch(401, { message: "invalid token" })));
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer bad-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 401);
    assert.equal(body.error, "Invalid or expired access token");
  } finally {
    await closeServer(server);
  }
});

test("resolves authenticated user from Supabase and exposes it on the request", async () => {
  const supabaseUser = {
    id: "user-123",
    email: "employer@company.com",
    user_metadata: { role: "employer", company_name: "Acme Corp" },
  };

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return { ok: true, status: 200, async json() { return supabaseUser; } };
  };

  const app = createTestApp(authMiddleware(fetchImpl));
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer valid-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.user.id, "user-123");
    assert.equal(body.user.email, "employer@company.com");
    assert.equal(body.user.role, "employer");

    // Verify it called Supabase with the right token
    assert.equal(calls[0].url, "https://test.supabase.co/auth/v1/user");
    assert.equal(calls[0].options.headers.Authorization, "Bearer valid-token");
    assert.equal(calls[0].options.headers.apikey, "test-key");
  } finally {
    await closeServer(server);
  }
});

test("requireRole rejects a student accessing an employer-only endpoint", async () => {
  const studentUser = {
    id: "student-456",
    email: "student@ums.edu.my",
    user_metadata: { role: "student" },
  };

  const app = createTestApp(
    authMiddleware(fakeFetch(200, studentUser)),
    requireRole("employer"),
  );
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer student-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error, "This endpoint requires the 'employer' role");
  } finally {
    await closeServer(server);
  }
});

test("requireRole allows an employer through an employer-only endpoint", async () => {
  const employerUser = {
    id: "employer-789",
    email: "hr@company.com",
    user_metadata: { role: "employer" },
  };

  const app = createTestApp(
    authMiddleware(fakeFetch(200, employerUser)),
    requireRole("employer"),
  );
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer employer-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.user.role, "employer");
  } finally {
    await closeServer(server);
  }
});

test("requireRole rejects an employer accessing a student-only endpoint", async () => {
  const employerUser = {
    id: "employer-789",
    email: "hr@company.com",
    user_metadata: { role: "employer" },
  };

  const app = createTestApp(
    authMiddleware(fakeFetch(200, employerUser)),
    requireRole("student"),
  );
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer employer-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 403);
    assert.equal(body.error, "This endpoint requires the 'student' role");
  } finally {
    await closeServer(server);
  }
});

test("returns 502 when the Supabase user endpoint is unreachable", async () => {
  const failFetch = async () => { throw new Error("network error"); };

  const app = createTestApp(authMiddleware(failFetch));
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/protected`, {
      headers: { Authorization: "Bearer some-token" },
    });
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.equal(body.error, "Failed to verify access token");
  } finally {
    await closeServer(server);
  }
});
