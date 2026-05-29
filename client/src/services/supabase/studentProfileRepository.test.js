import test from "node:test";
import assert from "node:assert/strict";

import { buildStudentProfileSnapshot } from "./studentProfileRepository.js";
import { loadStudentProfileSnapshot } from "./studentProfileRepository.js";
import { saveStudentProfileSnapshot } from "./studentProfileRepository.js";

test("builds a Supabase profile snapshot without storing raw CV text", () => {
  const snapshot = buildStudentProfileSnapshot({
    userId: "user-123",
    careerTarget: {
      role: "Data Analyst",
      industry: "data-it",
      region: "Sabah, Malaysia",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["Python", "Excel"],
      softSkills: ["Communication"],
      certifications: [],
      education: "UMS Year 3 Computer Science",
      confidence: 0.82,
      warnings: [],
      rawText: "private raw CV text must not be stored",
      rawPrompt: "private LLM prompt must not be stored",
    },
    missingSkills: ["Power BI"],
    roadmap: [
      {
        title: "Power BI Dashboards",
        status: "upcoming",
        reason: "Requested in analyst roles",
      },
    ],
    cvDocument: {
      fileName: "alex-cv.pdf",
      mimeType: "application/pdf",
      sizeBytes: 1200,
      storagePath: "users/user-123/cv/alex-cv.pdf",
      rawText: "private raw CV text must not be stored",
    },
  });

  assert.equal(snapshot.user_id, "user-123");
  assert.equal(snapshot.career_target.role, "Data Analyst");
  assert.equal("industry" in snapshot.career_target, false);
  assert.deepEqual(snapshot.skill_profile.technical_skills, ["Python", "Excel"]);
  assert.deepEqual(snapshot.cv_document, {
    file_name: "alex-cv.pdf",
    mime_type: "application/pdf",
    size_bytes: 1200,
    storage_path: "users/user-123/cv/alex-cv.pdf",
    text_length: 0,
  });
  assert.deepEqual(snapshot.missing_skills, ["Power BI"]);
  assert.deepEqual(snapshot.roadmap_items[0].title, "Power BI Dashboards");
  assert.equal(JSON.stringify(snapshot).includes("private raw CV text"), false);
  assert.equal(JSON.stringify(snapshot).includes("private LLM prompt"), false);
});

test("does not write prototype profile metrics when calculated values are missing", () => {
  const snapshot = buildStudentProfileSnapshot({
    userId: "user-123",
    careerTarget: {},
    skillProfile: {},
    missingSkills: [],
    roadmap: [],
    cvDocument: null,
  });

  assert.equal(snapshot.university, "UMS");
  assert.equal(snapshot.study_year, "Year 3");
  assert.equal(snapshot.program, "Computer Science");
  assert.equal(snapshot.readiness_score, 0);
  assert.equal(snapshot.roadmap_progress, 0);
});

test("loads the current user's Supabase profile snapshot", async () => {
  const calls = [];
  const result = await loadStudentProfileSnapshot({
    supabaseClient: {
      async select(table, options) {
        calls.push({ table, options });
        return {
          data: {
            user_id: "user-123",
            career_target: { role: "Data Analyst" },
          },
          error: null,
        };
      },
    },
    userId: "user-123",
  });

  assert.deepEqual(calls, [
    {
      table: "student_profile_snapshots",
      options: { eq: { user_id: "user-123" } },
    },
  ]);
  assert.equal(result.ok, true);
  assert.equal(result.snapshot.career_target.role, "Data Analyst");
});

test("does not load profile snapshots without a configured Supabase client", async () => {
  const result = await loadStudentProfileSnapshot({
    supabaseClient: null,
    userId: "user-123",
  });

  assert.equal(result.ok, false);
  assert.match(result.reason, /not configured/);
  assert.equal(result.snapshot, null);
});

test("flags Supabase profile save auth failures", async () => {
  const result = await saveStudentProfileSnapshot({
    supabaseClient: {
      async upsert() {
        return {
          data: null,
          error: {
            status: 401,
            isAuthError: true,
            message: "JWT expired",
          },
        };
      },
    },
    snapshot: {
      user_id: "user-123",
    },
  });

  assert.equal(result.ok, false);
  assert.equal(result.authExpired, true);
  assert.match(result.reason, /sign in again/i);
});
