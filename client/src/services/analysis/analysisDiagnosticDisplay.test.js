import test from "node:test";
import assert from "node:assert/strict";

import {
  buildDiagnosticScoreDisplay,
  buildSkillEvidenceRows,
} from "./analysisDiagnosticDisplay.js";

test("shows pending instead of 0 percent when analysis inputs are incomplete", () => {
  const display = buildDiagnosticScoreDisplay({
    analysis: {
      status: "needs_market",
      readinessScore: 0,
      matchedSkills: [],
      missingSkills: [],
      marketEvidence: {
        skillDemand: {},
      },
    },
    careerTarget: {
      role: "Data Analyst",
    },
  });

  assert.equal(display.value, "Pending");
  assert.equal(display.isCalculated, false);
  assert.match(display.formula, /Waiting for live job requirements/);
  assert.equal(display.diagnosisTitle, "What the market is telling you");
  assert.match(display.diagnosisHeadline, /Waiting for Data Analyst jobs/);
  assert.match(display.priorityInterpretation, /Load market jobs/);
});

test("explains the calculated score using top company requirement matches", () => {
  const display = buildDiagnosticScoreDisplay({
    analysis: {
      status: "ready",
      readinessScore: 50,
      matchedSkills: ["SQL"],
      missingSkills: ["Power BI"],
      marketEvidence: {
        skillDemand: {
          SQL: 1,
          "Power BI": 1,
        },
        jobMatches: [
          { matchScore: 50 },
          { matchScore: 40 },
        ],
      },
    },
    careerTarget: {
      role: "Data Analyst",
    },
  });

  assert.equal(display.value, "50%");
  assert.equal(display.isCalculated, true);
  assert.equal(display.formula, "Average match across the top 2 company requirement matches.");
});

test("labels calculated scores as partial when some job requirements came from snippets", () => {
  const display = buildDiagnosticScoreDisplay({
    analysis: {
      status: "ready",
      readinessScore: 50,
      matchedSkills: ["Figma"],
      missingSkills: ["Miro"],
      marketEvidence: {
        partialJobCount: 1,
        skillDemand: {
          Figma: 1,
          Miro: 1,
        },
        jobMatches: [
          { matchScore: 50, partialRequirements: true },
        ],
      },
    },
    careerTarget: {
      role: "UI/UX Designer",
    },
  });

  assert.equal(display.formula, "Average partial match across the top 1 company requirement match because 1 job only exposed a short requirement snippet.");
});

test("summarizes what the market evidence says about the student's CV", () => {
  const display = buildDiagnosticScoreDisplay({
    analysis: {
      status: "ready",
      readinessScore: 13,
      matchedSkills: ["Figma"],
      missingSkills: ["Reporting", "Business Intelligence", "Data Analytics"],
      marketEvidence: {
        jobCount: 10,
        skillDemand: {
          Reporting: 3,
          "Business Intelligence": 2,
          "Data Analytics": 2,
          Figma: 1,
        },
      },
    },
    careerTarget: {
      role: "Data Analyst",
      region: "sabah",
    },
  });

  assert.equal(display.diagnosisTitle, "What the market is telling you");
  assert.equal(
    display.diagnosisHeadline,
    "Data Analyst jobs in Sabah are repeatedly asking for Reporting, Business Intelligence, and Data Analytics. Your CV currently only overlaps with Figma, so your market match is low.",
  );
  assert.deepEqual(display.diagnosisFacts, [
    { label: "Strongest hiring signal", value: "Reporting appears in 3 of 10 jobs." },
    { label: "Repeated company demand", value: "Business Intelligence and Data Analytics each appear in 2 jobs." },
    { label: "Your current overlap", value: "Your CV matched Figma from 1 company requirement." },
    { label: "Main weakness", value: "Your CV does not show the repeated analyst skills companies are asking for." },
  ]);
  assert.equal(
    display.priorityInterpretation,
    "Reporting should be learned first because it appears most often across the selected job posts. Business Intelligence and Data Analytics come next because they appear across multiple company requirements.",
  );
});

test("builds diagnostic skill evidence rows ranked by market demand", () => {
  const rows = buildSkillEvidenceRows({
    skills: ["Power BI", "Reporting", "SQL"],
    skillDemand: {
      SQL: 4,
      "Power BI": 8,
      Reporting: 2,
    },
    jobMatches: [
      { company: "TWO95", missingSkills: ["Power BI", "SQL"], matchedSkills: ["Reporting"] },
      { company: "ResMed", missingSkills: ["Power BI"], matchedSkills: ["SQL"] },
      { company: "Zeal", missingSkills: ["Power BI"], matchedSkills: [] },
    ],
    evidenceKey: "missingSkills",
  });

  assert.deepEqual(rows.map((row) => row.skill), ["Power BI", "SQL", "Reporting"]);
  assert.equal(rows[0].countLabel, "8 jobs");
  assert.deepEqual(rows[0].companies, ["TWO95", "ResMed", "Zeal"]);
  assert.equal(rows[2].countLabel, "2 jobs");
});
