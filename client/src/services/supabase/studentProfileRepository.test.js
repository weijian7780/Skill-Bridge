import test from "node:test";
import assert from "node:assert/strict";

import { buildStudentProfileSnapshot } from "./studentProfileRepository.js";
import { loadStudentProfileSnapshot } from "./studentProfileRepository.js";

test("builds a Supabase profile snapshot without storing raw CV text", () => {
  const snapshot = buildStudentProfileSnapshot({
    userId: "user-123",
    careerTarget: {
      role: "Data Analyst",
      industry: "Data / IT",
      region: "Sabah, Malaysia",
      companyTypes: ["MNC"],
    },
    skillProfile: {
      provider: "gemini-2.5-flash",
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
