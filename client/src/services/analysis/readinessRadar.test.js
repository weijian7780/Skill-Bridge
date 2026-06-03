import test from "node:test";
import assert from "node:assert/strict";

import { buildReadinessRadar } from "./readinessRadar.js";

test("derives each radar axis from real analysis and CV data", () => {
  const radar = buildReadinessRadar({
    analysis: {
      readinessScore: 60,
      matchedSkills: ["SQL", "Python", "Excel"],
      missingSkills: ["Power BI"], // 3 of 4 required => 75% coverage
    },
    skillProfile: {
      technicalSkills: ["SQL", "Python", "Excel", "Java", "C++"], // 5 * 12 = 60
      softSkills: ["Communication", "Teamwork"], // 2 * 20 = 40
      confidence: 0.8, // => 80
    },
  });

  const bySubject = Object.fromEntries(radar.map((r) => [r.subject, r.A]));
  assert.equal(bySubject["Market Match"], 60);
  assert.equal(bySubject["Skill Coverage"], 75);
  assert.equal(bySubject["Technical"], 60);
  assert.equal(bySubject["Soft Skills"], 40);
  assert.equal(bySubject["CV Confidence"], 80);
});

test("returns all zeros when no analysis or CV data exists", () => {
  const radar = buildReadinessRadar({ analysis: {}, skillProfile: {} });
  assert.ok(radar.every((axis) => axis.A === 0));
  assert.equal(radar.length, 5);
});

test("clamps scores to a 0..100 range", () => {
  const radar = buildReadinessRadar({
    analysis: { readinessScore: 999, matchedSkills: [], missingSkills: [] },
    skillProfile: { technicalSkills: new Array(20).fill("x"), confidence: 1 },
  });
  assert.ok(radar.every((axis) => axis.A >= 0 && axis.A <= 100));
});
