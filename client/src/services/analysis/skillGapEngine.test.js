import test from "node:test";
import assert from "node:assert/strict";

import { buildSkillGapAnalysis } from "./skillGapEngine.js";

test("compares confirmed CV skills against live market job skills", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Python", "SQL", "Excel"],
      softSkills: ["Communication"],
      confidence: 0.82,
    },
    jobs: [
      {
        title: "Junior Data Analyst",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        title: "BI Analyst",
        extractedSkills: ["Power BI", "Tableau"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 33);
  assert.deepEqual(analysis.matchedSkills, ["SQL"]);
  assert.deepEqual(analysis.missingSkills, ["Power BI", "Tableau"]);
  assert.equal(analysis.prioritySkill, "Power BI");
  assert.match(analysis.recommendation, /Power BI/);
  assert.equal(analysis.marketEvidence.jobCount, 2);
  assert.equal(analysis.marketEvidence.skillDemand["Power BI"], 2);
});

test("requires live market jobs before calculating the skill gap", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Python", "SQL", "Excel"],
    },
    jobs: [],
  });

  assert.equal(analysis.status, "needs_market");
  assert.equal(analysis.readinessScore, 0);
  assert.deepEqual(analysis.matchedSkills, []);
  assert.deepEqual(analysis.missingSkills, []);
  assert.match(analysis.recommendation, /Live job-market results/);
});

test("requires a confirmed latest CV before analysis is ready", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: null,
    skillProfile: {
      provider: "Not extracted yet",
      technicalSkills: [],
    },
    jobs: [
      {
        title: "Junior Data Analyst",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "needs_cv");
  assert.equal(analysis.readinessScore, 0);
  assert.deepEqual(analysis.matchedSkills, []);
  assert.deepEqual(analysis.missingSkills, []);
  assert.match(analysis.recommendation, /Upload and confirm/);
  assert.equal(analysis.marketEvidence.jobCount, 1);
});

test("matches equivalent CV and market skill names", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Data Analysis", "PowerBI"],
    },
    jobs: [
      {
        title: "Business Intelligence Analyst",
        extractedSkills: ["Data Analytics", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 100);
  assert.deepEqual(analysis.matchedSkills, ["Data Analytics", "Power BI"]);
  assert.deepEqual(analysis.missingSkills, []);
});

test("keeps per-company job requirement matches as market evidence", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL", "Data Analysis"],
    },
    jobs: [
      {
        id: "job-1",
        title: "BI Analyst",
        company: "TWO95 International",
        location: "Malaysia",
        url: "https://example.test/job-1",
        extractedSkills: ["SQL", "Power BI", "Data Analytics"],
      },
      {
        id: "job-2",
        title: "Report Analyst",
        company: "ResMed",
        location: "Kuala Lumpur",
        extractedSkills: ["Reporting", "Data Warehouse"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.deepEqual(analysis.marketEvidence.jobMatches[0], {
    id: "job-1",
    title: "BI Analyst",
    company: "TWO95 International",
    location: "Malaysia",
    url: "https://example.test/job-1",
    source: "",
    requiredSkills: ["SQL", "Power BI", "Data Analytics"],
    matchedSkills: ["SQL", "Data Analytics"],
    missingSkills: ["Power BI"],
    matchScore: 67,
  });
  assert.deepEqual(analysis.marketEvidence.jobMatches[1].matchedSkills, []);
  assert.deepEqual(analysis.marketEvidence.jobMatches[1].missingSkills, ["Reporting", "Data Warehouse"]);
});

test("does not score a company match when no job requirements are detected", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "job-without-skills",
        title: "Senior Business Analyst - Trading System",
        company: "Zeal Group",
        location: "Malaysia",
        source: "Jooble",
        extractedSkills: [],
      },
    ],
  });

  assert.equal(analysis.marketEvidence.jobMatches[0].matchScore, null);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].requiredSkills, []);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].missingSkills, []);
});
