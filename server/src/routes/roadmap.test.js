import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "../app.js";

test("roadmap route generates a learning roadmap from analysis evidence", async () => {
  const previousKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  const server = createApp().listen(0);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/roadmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        careerTarget: { role: "Data Analyst", region: "Sabah, Malaysia" },
        skillProfile: { technicalSkills: ["Figma"] },
        analysis: {
          missingSkills: ["Reporting", "Business Intelligence"],
          marketEvidence: {
            skillDemand: {
              Reporting: 3,
              "Business Intelligence": 2,
            },
            jobMatches: [
              { company: "TWO95", missingSkills: ["Reporting"] },
              { company: "ResMed", missingSkills: ["Reporting", "Business Intelligence"] },
            ],
          },
        },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.roadmap.items.length, 2);
    assert.equal(body.roadmap.items[0].skill, "Reporting");
    assert.match(body.roadmap.items[0].reason, /3 matching jobs/);
    assert.match(body.roadmap.items[0].what, /report/i);
    assert.match(body.roadmap.items[0].why, /3 matching jobs/);
    assert.match(body.roadmap.items[0].when, /Month 1/);
    assert.equal(body.roadmap.items[0].howToStart.length, 3);
    assert.match(body.roadmap.items[0].successCriteria, /CV-ready/i);
  } finally {
    if (previousKey) {
      process.env.GEMINI_API_KEY = previousKey;
    }
    await closeServer(server);
  }
});

test("roadmap route rejects requests without deterministic missing skills", async () => {
  const server = createApp().listen(0);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/roadmap/generate`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        analysis: {
          missingSkills: [],
        },
      }),
    });
    const body = await response.json();

    assert.equal(response.status, 400);
    assert.match(body.error, /deterministic missing skills/);
  } finally {
    await closeServer(server);
  }
});

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
