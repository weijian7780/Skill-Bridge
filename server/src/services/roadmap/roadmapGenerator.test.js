import test from "node:test";
import assert from "node:assert/strict";

import { generateRoadmap } from "./roadmapGenerator.js";
import { buildLocalRoadmap } from "./localRoadmapBuilder.js";

test("generates roadmap items from deterministic missing skills and company evidence", () => {
  const roadmap = buildLocalRoadmap({
    careerTarget: { role: "Data Analyst" },
    analysis: {
      missingSkills: ["Reporting"],
      marketEvidence: {
        skillDemand: { Reporting: 3 },
        jobMatches: [
          { company: "TWO95", missingSkills: ["Reporting"] },
          { company: "ResMed", missingSkills: ["Reporting"] },
        ],
      },
    },
  });

  assert.equal(roadmap.items.length, 1);
  assert.equal(roadmap.items[0].skill, "Reporting");
  assert.deepEqual(roadmap.items[0].companyEvidence, ["TWO95", "ResMed"]);
  assert.match(roadmap.items[0].reason, /3 matching jobs/);
});

test("builds roadmap items with what why when and how-to-start guidance", () => {
  const roadmap = buildLocalRoadmap({
    careerTarget: { role: "Data Analyst" },
    analysis: {
      missingSkills: ["Power BI", "SQL"],
      marketEvidence: {
        skillDemand: {
          "Power BI": 4,
          SQL: 2,
        },
        jobMatches: [
          { company: "Analytics Sdn Bhd", missingSkills: ["Power BI", "SQL"] },
          { company: "BI Malaysia", missingSkills: ["Power BI"] },
        ],
      },
    },
  });

  assert.equal(roadmap.items[0].skill, "Power BI");
  assert.match(roadmap.items[0].what, /Power BI/i);
  assert.match(roadmap.items[0].why, /4 matching jobs/);
  assert.equal(roadmap.items[0].when, "Month 1: start immediately");
  assert.deepEqual(roadmap.items[0].howToStart.slice(0, 2), [
    "Follow one beginner Power BI tutorial using a small CSV dataset.",
    "Rebuild one dashboard from a real job-relevant business question.",
  ]);
  assert.match(roadmap.items[0].successCriteria, /CV-ready/i);
  assert.deepEqual(roadmap.items[0].companyEvidence, ["Analytics Sdn Bhd", "BI Malaysia"]);
});

test("does not call the roadmap AI when no missing skills exist", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = "fake-key-that-should-not-be-used";

  try {
    const roadmap = await generateRoadmap({
      careerTarget: { role: "Data Analyst" },
      skillProfile: { technicalSkills: ["Reporting"] },
      analysis: {
        missingSkills: [],
        marketEvidence: {},
      },
    });

    assert.equal(roadmap.source, "deterministic");
    assert.deepEqual(roadmap.items, []);
  } finally {
    if (previousKey) {
      process.env.GEMINI_API_KEY = previousKey;
    } else {
      delete process.env.GEMINI_API_KEY;
    }
  }
});
