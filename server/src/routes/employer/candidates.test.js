import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { candidatesRouter } from "./candidates.js";

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

test("GET /candidates only queries discoverable profiles and maps cards", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return { ok: true, status: 200, async json() { return sampleRows; } };
  };
  const app = createTestApp(fetchImpl);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/candidates?location=sabah`);
    const body = await response.json();

    const url = new URL(calls[0]);
    assert.equal(url.searchParams.get("discoverable"), "eq.true");
    assert.equal(url.searchParams.get("location"), "eq.sabah");
    assert.equal(body.candidates.length, 2);
    assert.equal(body.candidates[0].name, "Alex Tan");
    assert.equal(body.candidates[0].verified, true);   // Gemini + 0.8 confidence
    assert.equal(body.candidates[1].verified, false);  // confidence 0.3 below threshold
  } finally {
    server.close();
  }
});

test("GET /candidates filters by skill in-process", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, async json() { return sampleRows; } });
  const app = createTestApp(fetchImpl);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/candidates?skill=python`);
    const body = await response.json();
    assert.equal(body.candidates.length, 1);
    assert.equal(body.candidates[0].id, "stu-1");
  } finally {
    server.close();
  }
});

test("GET /candidates/:id returns the verified skill profile of a discoverable candidate", async () => {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    return { ok: true, status: 200, async json() { return [sampleRows[0]]; } };
  };
  const app = createTestApp(fetchImpl);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/candidates/stu-1`);
    const body = await response.json();

    const url = new URL(calls[0]);
    assert.equal(url.searchParams.get("user_id"), "eq.stu-1");
    assert.equal(url.searchParams.get("discoverable"), "eq.true");
    assert.equal(body.candidate.name, "Alex Tan");
    assert.equal(body.candidate.verified, true);
    assert.deepEqual(body.candidate.skillProfile.technicalSkills, ["SQL", "Python"]);
  } finally {
    server.close();
  }
});

test("GET /candidates/:id returns 404 when the candidate is not discoverable", async () => {
  const fetchImpl = async () => ({ ok: true, status: 200, async json() { return []; } });
  const app = createTestApp(fetchImpl);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/candidates/stu-x`);
    assert.equal(response.status, 404);
  } finally {
    server.close();
  }
});
