import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { profileRouter } from "./profile.js";

function createTestApp(mockUser, fetchImpl) {
  const app = express();
  app.use(express.json());
  
  // Mock auth middleware
  app.use((request, response, next) => {
    if (!mockUser) {
      return response.status(401).json({ error: "Authentication required" });
    }
    if (mockUser.role !== "employer") {
      return response.status(403).json({ error: "This endpoint requires the 'employer' role" });
    }
    request.user = mockUser;
    
    // Inject mock fetch and config for testing
    request.supabase = {
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      fetchImpl,
    };
    next();
  });

  app.use("/profile", profileRouter);
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

test("GET /profile returns 401 if user is not authenticated", async () => {
  const app = createTestApp(null, null);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/profile`);
    assert.equal(response.status, 401);
  } finally {
    await closeServer(server);
  }
});

test("GET /profile returns 403 if user is not an employer", async () => {
  const app = createTestApp({ id: "123", role: "student" }, null);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/profile`);
    assert.equal(response.status, 403);
  } finally {
    await closeServer(server);
  }
});

test("GET /profile fetches the employer profile from Supabase using the authenticated user id", async () => {
  const mockProfile = {
    id: "profile-123",
    user_id: "employer-123",
    company_name: "Acme Corp",
    industry: "Tech",
  };

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return [mockProfile];
      },
    };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/profile`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.profile.company_name, "Acme Corp");
    
    // Verify Supabase request
    const lastCall = calls[0];
    const url = new URL(lastCall.url);
    assert.equal(url.pathname, "/rest/v1/employer_profiles");
    assert.equal(url.searchParams.get("user_id"), "eq.employer-123");
    assert.equal(url.searchParams.get("select"), "*");
    assert.equal(lastCall.options.headers.Authorization, "Bearer test-key");
  } finally {
    await closeServer(server);
  }
});

test("GET /profile returns empty profile when no profile exists", async () => {
  const fetchImpl = async () => ({
    ok: true,
    status: 200,
    async json() { return []; },
  });

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/profile`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.profile, null);
  } finally {
    await closeServer(server);
  }
});

test("PUT /profile updates the employer profile in Supabase and returns the updated profile", async () => {
  const mockProfile = {
    id: "profile-123",
    user_id: "employer-123",
    company_name: "Acme Corp Updated",
    industry: "Tech",
  };

  const calls = [];
  const fetchImpl = async (url, options) => {
    calls.push({ url, options });
    return {
      ok: true,
      status: 200,
      async json() {
        return [mockProfile];
      },
    };
  };

  const app = createTestApp({ id: "employer-123", role: "employer" }, fetchImpl);
  const { server, baseUrl } = listen(app);

  try {
    const response = await fetch(`${baseUrl}/profile`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ company_name: "Acme Corp Updated", industry: "Tech" }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.profile.company_name, "Acme Corp Updated");
    
    // Verify Supabase request
    const lastCall = calls[0];
    const url = new URL(lastCall.url);
    assert.equal(url.pathname, "/rest/v1/employer_profiles");
    assert.equal(url.searchParams.get("on_conflict"), "user_id");
    assert.equal(lastCall.options.headers.Prefer, "resolution=merge-duplicates,return=representation");
    
    const requestBody = JSON.parse(lastCall.options.body);
    assert.equal(requestBody.user_id, "employer-123");
    assert.equal(requestBody.company_name, "Acme Corp Updated");
    assert.equal(requestBody.industry, "Tech");
  } finally {
    await closeServer(server);
  }
});
