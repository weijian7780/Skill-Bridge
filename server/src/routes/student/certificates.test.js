import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { certificatesRouter } from "./certificates.js";

const sampleRow = {
  id: "cert-1",
  user_id: "stu-123",
  title: "AWS Cloud Practitioner",
  storage_path: "stu-123/cert-1.pdf",
  file_name: "aws.pdf",
  skill_tags: [],
};

// fetchImpl branches by URL: storage object, sign endpoint, and the REST table.
function makeFetchImpl({ rows = [sampleRow], storageOk = true } = {}) {
  const calls = [];
  const fetchImpl = async (url, options = {}) => {
    calls.push({ url: String(url), method: options.method || "GET" });
    if (String(url).includes("/storage/v1/object/sign/")) {
      return { ok: true, status: 200, async json() { return { signedURL: "/object/sign/certificates/x?token=abc" }; } };
    }
    if (String(url).includes("/storage/v1/object/")) {
      return { ok: storageOk, status: storageOk ? 200 : 500, async text() { return "storage err"; } };
    }
    // REST: /rest/v1/student_certificates
    return {
      ok: true,
      status: 200,
      async json() { return rows; },
      async text() { return JSON.stringify(rows); },
    };
  };
  return { fetchImpl, calls };
}

function createTestApp(fetchImpl) {
  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    request.user = { id: "stu-123", role: "student" };
    request.supabase = { url: "https://test.supabase.co", serviceRoleKey: "test-key", fetchImpl };
    next();
  });
  app.use("/certificates", certificatesRouter);
  return app;
}

function listen(app) {
  const server = app.listen(0);
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

test("GET /certificates lists the student's own certificates", async () => {
  const { fetchImpl, calls } = makeFetchImpl();
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/certificates`);
    const body = await response.json();
    assert.equal(body.certificates.length, 1);
    const restCall = calls.find((c) => c.url.includes("/student_certificates"));
    assert.equal(new URL(restCall.url).searchParams.get("user_id"), "eq.stu-123");
  } finally {
    server.close();
  }
});

test("GET /certificates/:id/url returns a signed URL for an owned certificate", async () => {
  const { fetchImpl } = makeFetchImpl();
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/certificates/cert-1/url`);
    const body = await response.json();
    assert.ok(body.url.includes("/storage/v1/object/sign/certificates/"));
  } finally {
    server.close();
  }
});

test("GET /certificates/:id/url returns 404 for a certificate the student does not own", async () => {
  const { fetchImpl } = makeFetchImpl({ rows: [] });
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/certificates/cert-999/url`);
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});

test("DELETE /certificates/:id removes an owned certificate", async () => {
  const { fetchImpl, calls } = makeFetchImpl();
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/certificates/cert-1`, { method: "DELETE" });
    const body = await response.json();
    assert.equal(body.ok, true);
    assert.ok(calls.some((c) => c.method === "DELETE" && c.url.includes("/storage/v1/object/certificates/")));
    assert.ok(calls.some((c) => c.method === "DELETE" && c.url.includes("/student_certificates")));
  } finally {
    server.close();
  }
});

test("DELETE /certificates/:id returns 404 for a certificate the student does not own", async () => {
  const { fetchImpl } = makeFetchImpl({ rows: [] });
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/certificates/cert-999`, { method: "DELETE" });
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});
