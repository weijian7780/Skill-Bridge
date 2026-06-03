import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { candidatesRouter } from "./candidates.js";

const sampleRows = [
  {
    user_id: "stu-1",
    display_name: "Alex Tan",
    location: "sabah",
    university: "UMS",
    program: "CS",
    readiness_score: 70,
    skill_profile: { provider: "Gemini", confidence: 0.8, technical_skills: ["SQL", "Python"], soft_skills: [] },
  },
  {
    user_id: "stu-2",
    display_name: "Mei Ling",
    location: "sabah",
    university: "UMS",
    program: "IT",
    readiness_score: 55,
    skill_profile: { provider: "Gemini", confidence: 0.3, technical_skills: ["Figma"], soft_skills: [] },
  },
];

// Routes for the employer's own applicants. The flow hits 3 tables:
// job_posts -> applications -> student_profile_snapshots.
function makeFetchImpl({ jobs = [{ id: "job-1" }], apps = [{ student_id: "stu-1" }, { student_id: "stu-2" }], snapshots = sampleRows } = {}) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    if (String(url).includes("/job_posts")) return { ok: true, status: 200, async json() { return jobs; } };
    if (String(url).includes("/applications")) return { ok: true, status: 200, async json() { return apps; } };
    if (String(url).includes("/student_profile_snapshots")) return { ok: true, status: 200, async json() { return snapshots; } };
    return { ok: true, status: 200, async json() { return []; } };
  };
  return { fetchImpl, calls };
}

function createTestApp(fetchImpl) {
  const app = express();
  app.use(express.json());
  app.use((request, _response, next) => {
    request.user = { id: "employer-123", role: "employer" };
    request.supabase = { url: "https://test.supabase.co", serviceRoleKey: "test-key", fetchImpl };
    next();
  });
  app.use("/candidates", candidatesRouter);
  return app;
}

function listen(app) {
  const server = app.listen(0);
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

test("GET /candidates returns only the employer's applicants", async () => {
  const { fetchImpl, calls } = makeFetchImpl();
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/candidates`);
    const body = await response.json();

    // It scopes to applicants via job_posts -> applications -> snapshots.
    assert.ok(calls.some((u) => u.includes("/job_posts")));
    assert.ok(calls.some((u) => u.includes("/applications")));
    const snapshotCall = calls.find((u) => u.includes("/student_profile_snapshots"));
    assert.ok(new URL(snapshotCall).searchParams.get("user_id").startsWith("in."));
    assert.equal(body.candidates.length, 2);
    assert.equal(body.candidates[0].verified, true);  // Gemini + 0.8
    assert.equal(body.candidates[1].verified, false); // 0.3 below threshold
  } finally {
    server.close();
  }
});

test("GET /candidates returns empty when the employer has no applicants", async () => {
  const { fetchImpl } = makeFetchImpl({ jobs: [] });
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/candidates`);
    const body = await response.json();
    assert.deepEqual(body.candidates, []);
  } finally {
    server.close();
  }
});

test("GET /candidates filters applicants by skill in-process", async () => {
  const { fetchImpl } = makeFetchImpl();
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/candidates?skill=python`);
    const body = await response.json();
    assert.equal(body.candidates.length, 1);
    assert.equal(body.candidates[0].id, "stu-1");
  } finally {
    server.close();
  }
});

test("GET /candidates/:id returns the profile of an applicant", async () => {
  const { fetchImpl } = makeFetchImpl({ snapshots: [sampleRows[0]] });
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/candidates/stu-1`);
    const body = await response.json();
    assert.equal(body.candidate.name, "Alex Tan");
    assert.equal(body.candidate.verified, true);
  } finally {
    server.close();
  }
});

test("GET /candidates/:id returns 404 for a student who did not apply", async () => {
  const { fetchImpl } = makeFetchImpl(); // applicants are stu-1, stu-2
  const { server, baseUrl } = listen(createTestApp(fetchImpl));
  try {
    const response = await fetch(`${baseUrl}/candidates/stu-999`);
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});
