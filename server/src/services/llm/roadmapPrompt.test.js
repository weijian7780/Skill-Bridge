import test from "node:test";
import assert from "node:assert/strict";

import { buildRoadmapPrompt } from "./roadmapPrompt.js";

test("roadmap prompt asks AI for concise visual-card wording", () => {
  const prompt = buildRoadmapPrompt({
    careerTarget: { role: "Data Analyst" },
    skillProfile: { technicalSkills: ["Figma"] },
    analysis: {
      missingSkills: ["Reporting"],
      marketEvidence: { skillDemand: { Reporting: 3 } },
    },
  });

  assert.match(prompt, /Use only the deterministic missing skills/);
  assert.match(prompt, /Do not invent new missing skills/);
  assert.match(prompt, /Order items by the missingSkills order/);
  assert.match(prompt, /Tie every reason to company evidence/);
  assert.match(prompt, /Keep wording short enough for visual cards/);
  assert.match(prompt, /Reporting/);
});

test("roadmap prompt requires explicit what why when and how-to-start fields", () => {
  const prompt = buildRoadmapPrompt({
    careerTarget: { role: "Data Analyst" },
    skillProfile: { technicalSkills: ["Excel"] },
    analysis: {
      missingSkills: ["Power BI"],
      marketEvidence: {
        skillDemand: { "Power BI": 4 },
        jobMatches: [
          { company: "Analytics Sdn Bhd", missingSkills: ["Power BI"] },
        ],
      },
    },
  });

  assert.match(prompt, /what/);
  assert.match(prompt, /why/);
  assert.match(prompt, /when/);
  assert.match(prompt, /howToStart/);
  assert.match(prompt, /successCriteria/);
});
