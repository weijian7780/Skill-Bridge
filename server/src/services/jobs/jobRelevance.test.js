import test from "node:test";
import assert from "node:assert/strict";

import {
  filterJobsByRole,
  isRoleRelevantJob,
  roleTokens,
  scoreRoleRelevance,
  summarizeRoleRelevance,
} from "./jobRelevance.js";

test("keeps jobs whose title contains the searched role phrase", () => {
  const job = { title: "Senior Data Analyst" };
  assert.equal(isRoleRelevantJob(job, "Data Analyst"), true);
});

test("keeps jobs that share a SPECIFIC role token in the title", () => {
  const job = { title: "Data Engineer" };
  assert.equal(isRoleRelevantJob(job, "Data Analyst"), true);
});

test("drops jobs that only share a GENERIC role token (the mismatch fix)", () => {
  // "Business Analyst" shares only the generic word "analyst" with "Data Analyst";
  // it does not contain the discriminating word "data", so it must be excluded.
  assert.equal(isRoleRelevantJob({ title: "Business Analyst" }, "Data Analyst"), false);
  assert.equal(isRoleRelevantJob({ title: "Analyst, Business Reporting" }, "Data Analyst"), false);
  assert.equal(isRoleRelevantJob({ title: "Civil Engineer" }, "AI Engineer"), false);
  assert.equal(isRoleRelevantJob({ title: "Software Engineer" }, "AI Engineer"), false);
});

test("keeps generic-token matches when the role is purely generic", () => {
  // "Analyst" alone has no discriminating word, so a generic hit is all we have.
  assert.equal(isRoleRelevantJob({ title: "Business Analyst" }, "Analyst"), true);
});

test("excludes jobs whose title shares no significant role token", () => {
  assert.equal(isRoleRelevantJob({ title: "Heavy Truck Driver" }, "Data Analyst"), false);
  assert.equal(isRoleRelevantJob({ title: "Registered Nurse" }, "Data Analyst"), false);
});

test("does not match role tokens as substrings of longer words", () => {
  // "analyst" must not match "analytics" so we keep word-boundary semantics.
  assert.equal(isRoleRelevantJob({ title: "Google Analytics Specialist" }, "Analyst"), false);
});

test("ignores stopwords so seniority prefixes do not widen the match", () => {
  // "Senior" alone is a stopword; without a real role token it must not match.
  assert.equal(isRoleRelevantJob({ title: "Senior Truck Driver" }, "Senior Data Analyst"), false);
});

test("treats a role with only stopwords as relevant to everything (discover mode)", () => {
  assert.deepEqual(roleTokens("graduate"), []);
  assert.equal(isRoleRelevantJob({ title: "Heavy Truck Driver" }, "graduate"), true);
});

test("excludes jobs with an empty title when the role has real tokens", () => {
  assert.equal(isRoleRelevantJob({ title: "" }, "Data Analyst"), false);
});

test("filterJobsByRole removes unrelated postings but keeps relevant ones", () => {
  const jobs = [
    { title: "Senior Data Analyst" },
    { title: "Heavy Truck Driver" },
    { title: "Data Analytics Intern" },
  ];

  const filtered = filterJobsByRole(jobs, "Data Analyst");
  assert.deepEqual(
    filtered.map((job) => job.title),
    ["Senior Data Analyst", "Data Analytics Intern"],
  );
});

test("filterJobsByRole returns every job when the role collapses to no tokens", () => {
  const jobs = [{ title: "Heavy Truck Driver" }, { title: "Registered Nurse" }];
  assert.deepEqual(filterJobsByRole(jobs, "graduate"), jobs);
});

test("matches roles containing symbols like UI/UX without false splits", () => {
  assert.equal(isRoleRelevantJob({ title: "Mid level UI/UX Designer" }, "UI/UX Designer"), true);
  assert.equal(isRoleRelevantJob({ title: "Backend Engineer" }, "UI/UX Designer"), false);
});

test("matches morphological variants of a long role token (biotech)", () => {
  assert.equal(isRoleRelevantJob({ title: "Biotechnology Research Associate" }, "biotech"), true);
  assert.equal(isRoleRelevantJob({ title: "Biotechnologist" }, "biotech"), true);
  assert.equal(isRoleRelevantJob({ title: "Biotech Process Engineer" }, "biotechnology"), true);
});

test("does not stem-match unrelated titles for a long role token", () => {
  assert.equal(isRoleRelevantJob({ title: "Lab Technician" }, "biotech"), false);
  assert.equal(isRoleRelevantJob({ title: "Biomedical Scientist" }, "biotech"), false);
});

test("does not stem-match short role tokens into longer words", () => {
  // "data" is below the stem-prefix threshold, so it must not match "database".
  assert.equal(isRoleRelevantJob({ title: "Database Administrator" }, "data"), false);
  // "analyst" and "analytics" are not prefixes of each other, so no false match.
  assert.equal(isRoleRelevantJob({ title: "Google Analytics Specialist" }, "Analyst"), false);
});

test("summarizeRoleRelevance flags no relevant matches when provider returned jobs", () => {
  const jobs = [{ title: "Lab Technician" }, { title: "Registered Nurse" }];
  const summary = summarizeRoleRelevance(jobs, "biotech");

  assert.deepEqual(summary.relevantJobs, []);
  assert.equal(summary.totalBeforeRelevanceFilter, 2);
  assert.equal(summary.noRelevantMatches, true);
  assert.match(summary.warning, /biotech/i);
});

test("summarizeRoleRelevance does not warn when provider returned nothing", () => {
  const summary = summarizeRoleRelevance([], "biotech");

  assert.deepEqual(summary.relevantJobs, []);
  assert.equal(summary.totalBeforeRelevanceFilter, 0);
  assert.equal(summary.noRelevantMatches, false);
  assert.equal(summary.warning, "");
});

test("summarizeRoleRelevance does not warn when relevant jobs exist", () => {
  const jobs = [{ title: "Biotechnologist" }, { title: "Lab Technician" }];
  const summary = summarizeRoleRelevance(jobs, "biotech");

  assert.deepEqual(
    summary.relevantJobs.map((job) => job.title),
    ["Biotechnologist"],
  );
  assert.equal(summary.noRelevantMatches, false);
  assert.equal(summary.warning, "");
});

test("scoreRoleRelevance ranks exact phrase match above generic-token-only match", () => {
  const aiEngineer = { title: "AI Engineer" };
  const softwareEngineer = { title: "Software Engineer" };

  const aiScore = scoreRoleRelevance(aiEngineer, "AI Engineer");
  const softwareScore = scoreRoleRelevance(softwareEngineer, "AI Engineer");

  assert.ok(aiScore > softwareScore, `AI Engineer (${aiScore}) should score higher than Software Engineer (${softwareScore})`);
  assert.ok(aiScore > 0, "AI Engineer should have positive score");
});

test("roleTokens keeps short meaningful tokens like ai, ml, qa, ux", () => {
  assert.deepEqual(roleTokens("AI Engineer"), ["ai", "engineer"]);
  assert.deepEqual(roleTokens("ML Engineer"), ["ml", "engineer"]);
  assert.deepEqual(roleTokens("QA Tester"), ["qa", "tester"]);
  assert.deepEqual(roleTokens("UX Designer"), ["ux", "designer"]);
});

test("filterJobsByRole drops generic-only matches and ranks specific matches first", () => {
  const jobs = [
    { title: "Software Engineer" },   // generic "engineer" only -> dropped
    { title: "AI Engineer" },         // specific "ai" + phrase -> kept, top
    { title: "AI Research Engineer" },// specific "ai" -> kept
    { title: "Civil Engineer" },      // generic "engineer" only -> dropped
  ];

  const titles = filterJobsByRole(jobs, "AI Engineer").map((job) => job.title);

  // Only the jobs that share the discriminating word "ai" survive.
  assert.deepEqual(titles, ["AI Engineer", "AI Research Engineer"]);
  // Exact phrase match ranks above a partial specific match.
  assert.equal(titles[0], "AI Engineer");
});
