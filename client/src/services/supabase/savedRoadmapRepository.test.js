import test from "node:test";
import assert from "node:assert/strict";

import {
  buildSavedRoadmap,
  deleteSavedRoadmap,
  listSavedRoadmaps,
  saveRoadmap,
} from "./savedRoadmapRepository.js";

test("builds a saved roadmap record from app state", () => {
  const record = buildSavedRoadmap({
    userId: "user-123",
    careerTarget: { role: "Data Analyst", region: "selangor" },
    analysis: {
      readinessScore: 42,
      missingSkills: ["SQL", "Power BI"],
      marketEvidence: { jobMatches: [{ company: "Acme" }, { company: "Globex" }, { company: "Acme" }] },
    },
    roadmapPlan: { items: [{ title: "Learn SQL" }], basis: "market evidence", assumptions: ["entry level"] },
  });

  assert.equal(record.user_id, "user-123");
  assert.equal(record.target_role, "Data Analyst");
  assert.equal(record.target_region, "selangor");
  assert.deepEqual(record.missing_skills, ["SQL", "Power BI"]);
  assert.deepEqual(record.companies, ["Acme", "Globex"]);
  assert.equal(record.readiness_score, 42);
  assert.deepEqual(record.roadmap_items, [{ title: "Learn SQL" }]);
  assert.match(record.title, /Data Analyst/);
});

test("saves a roadmap through the supabase client and returns the stored row", async () => {
  const calls = [];
  const supabaseClient = {
    async insert(table, record) {
      calls.push({ table, record });
      return { data: { id: "rm-1", ...record }, error: null };
    },
  };

  const result = await saveRoadmap({
    supabaseClient,
    record: { user_id: "user-123", target_role: "Data Analyst" },
  });

  assert.equal(calls[0].table, "saved_roadmaps");
  assert.equal(result.ok, true);
  assert.equal(result.roadmap.id, "rm-1");
});

test("lists saved roadmaps newest first for a user", async () => {
  const calls = [];
  const supabaseClient = {
    async list(table, options) {
      calls.push({ table, options });
      return { data: [{ id: "b" }, { id: "a" }], error: null };
    },
  };

  const result = await listSavedRoadmaps({ supabaseClient, userId: "user-123" });

  assert.equal(calls[0].table, "saved_roadmaps");
  assert.deepEqual(calls[0].options.eq, { user_id: "user-123" });
  assert.equal(calls[0].options.order, "created_at.desc");
  assert.equal(result.ok, true);
  assert.equal(result.roadmaps.length, 2);
});

test("deletes a saved roadmap by id", async () => {
  const calls = [];
  const supabaseClient = {
    async remove(table, options) {
      calls.push({ table, options });
      return { data: null, error: null };
    },
  };

  const result = await deleteSavedRoadmap({ supabaseClient, id: "rm-1" });

  assert.equal(calls[0].table, "saved_roadmaps");
  assert.deepEqual(calls[0].options.eq, { id: "rm-1" });
  assert.equal(result.ok, true);
});

test("reports an auth error when the supabase client rejects the save", async () => {
  const supabaseClient = {
    async insert() {
      return { data: null, error: { status: 401, isAuthError: true, message: "JWT expired" } };
    },
  };

  const result = await saveRoadmap({ supabaseClient, record: { user_id: "user-123" } });

  assert.equal(result.ok, false);
  assert.equal(result.authExpired, true);
});
