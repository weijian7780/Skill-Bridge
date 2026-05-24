import test from "node:test";
import assert from "node:assert/strict";

import {
  buildCompactRoadmapCards,
  buildRoadmapPageView,
  buildRoadmapGenerationPayload,
  buildSequentialRoadmapPath,
} from "./roadmapDisplay.js";

test("builds compact visual roadmap cards from verbose generated items", () => {
  const [card] = buildCompactRoadmapCards([
    {
      month: 1,
      skill: "Reporting",
      title: "Build a reporting portfolio project for a hiring manager",
      what: "Build a weekly KPI report from raw sales data.",
      why: "Reporting appears in 3 matching company job posts.",
      when: "Month 1: start immediately",
      howToStart: [
        "Choose one CSV dataset.",
        "Create a summary report.",
        "Write three business insights.",
      ],
      successCriteria: "A CV-ready report project with screenshots.",
      objective: "Create an analyst-ready dashboard and explain the reporting decisions.",
      reason: "Reporting appears repeatedly in selected company job requirements.",
      deliverable: "Published dashboard and one-page insight summary",
      resource: "Reporting portfolio project",
      tasks: ["Learn reporting basics", "Build a dashboard", "Write a summary"],
      companyEvidence: ["TWO95", "ResMed", "Zeal"],
    },
  ]);

  assert.equal(card.phase, "Month 1");
  assert.equal(card.statusLabel, "In Progress");
  assert.equal(card.skill, "Reporting");
  assert.deepEqual(card.companyChips, ["TWO95", "ResMed"]);
  assert.equal(card.extraCompanyCount, 1);
  assert.equal(card.taskChips.length, 3);
  assert.equal(card.what, "Build a weekly KPI report from raw sales data.");
  assert.equal(card.why, "Reporting appears in 3 matching company job posts.");
  assert.equal(card.when, "Month 1: start immediately");
  assert.deepEqual(card.howToStart, [
    "Choose one CSV dataset.",
    "Create a summary report.",
    "Write three business insights.",
  ]);
  assert.equal(card.successCriteria, "A CV-ready report project with screenshots.");
});

test("builds a sequential roadmap path from generated roadmap items", () => {
  const path = buildSequentialRoadmapPath([
    { month: 1, skill: "Reporting", title: "Reporting" },
    { month: 2, skill: "BI", title: "BI" },
  ]);

  assert.equal(path[0].stepLabel, "01");
  assert.equal(path[0].isActive, true);
  assert.equal(path[0].isLast, false);
  assert.equal(path[1].stepLabel, "02");
  assert.equal(path[1].isLast, true);
});

test("builds a real roadmap page view from a generated analysis plan", () => {
  const view = buildRoadmapPageView({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    analysis: {
      status: "ready",
      readinessScore: 13,
      missingSkills: ["Reporting", "Business Intelligence", "Data Analytics", "SQL"],
    },
    roadmapPlan: {
      overview: "Close the most repeated company gaps first.",
      source: "gemini",
      assumptions: ["Missing skills are ranked by company demand."],
      items: [
        { month: 1, skill: "Reporting", title: "Reporting", companyEvidence: ["TWO95"] },
        { month: 2, skill: "Business Intelligence", title: "BI", companyEvidence: ["ResMed"] },
        { month: 3, skill: "Data Analytics", title: "Analytics", companyEvidence: ["Zeal"] },
        { month: 4, skill: "SQL", title: "SQL", companyEvidence: ["Extreme Reach"] },
      ],
    },
  });

  assert.equal(view.isGenerated, true);
  assert.equal(view.heroTitle, "Data Analyst Roadmap");
  assert.equal(view.sourceLabel, "Gemini-assisted roadmap");
  assert.equal(view.pathItems.length, 4);
  assert.equal(view.summaryCards[0].value, "4");
  assert.equal(view.basisOverview, "Close the most repeated company gaps first.");
});

test("builds a pre-generation roadmap page view when analysis has not produced a plan", () => {
  const view = buildRoadmapPageView({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    analysis: {
      status: "needs_market",
      missingSkills: [],
    },
    roadmapPlan: null,
  });

  assert.equal(view.isGenerated, false);
  assert.equal(view.heroTitle, "Roadmap not generated yet");
  assert.match(view.emptyStateMessage, /market job evidence/);
  assert.deepEqual(view.pathItems, []);
});

test("builds roadmap generation payload from deterministic analysis output", () => {
  const payload = buildRoadmapGenerationPayload({
    careerTarget: { role: "Data Analyst" },
    skillProfile: { technicalSkills: ["Figma"] },
    analysis: {
      status: "ready",
      readinessScore: 13,
      matchedSkills: ["Figma"],
      missingSkills: ["Reporting"],
      marketEvidence: { skillDemand: { Reporting: 3 } },
      recommendation: "not needed by roadmap API",
    },
  });

  assert.deepEqual(payload.analysis, {
    status: "ready",
    readinessScore: 13,
    matchedSkills: ["Figma"],
    missingSkills: ["Reporting"],
    marketEvidence: { skillDemand: { Reporting: 3 } },
  });
});
