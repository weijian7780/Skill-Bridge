import test from "node:test";
import assert from "node:assert/strict";

import { buildMarketEvidenceOverview } from "./marketEvidenceDisplay.js";

test("builds compact market evidence overview from CV and job inputs", () => {
  const overview = buildMarketEvidenceOverview({
    careerTarget: {
      role: "Data Analyst",
      region: "sabah",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    jobs: [{ id: "1" }, { id: "2" }, { id: "raw-empty" }],
    relevantJobCount: 2,
    excludedJobCount: 1,
    skillDemand: {
      Reporting: 3,
      SQL: 1,
      "Power BI": 2,
    },
  });

  assert.equal(overview.title, "Market evidence for Data Analyst");
  assert.equal(overview.subtitle, "Data Analyst roles in Sabah");
  assert.deepEqual(overview.stats, [
    { label: "Relevant job postings", value: "2", detail: "with detected company requirements" },
    { label: "Unrelated provider results", value: "1", detail: "excluded from skill-gap calculation" },
    { label: "Latest CV", value: "latest-cv.pdf", detail: "resume source" },
  ]);
  assert.deepEqual(overview.topDemandedSkills, [
    { skill: "Reporting", count: 3 },
    { skill: "Power BI", count: 2 },
    { skill: "SQL", count: 1 },
  ]);
});

test("uses relevant job posting count when raw provider results include jobs without detected requirements", () => {
  const overview = buildMarketEvidenceOverview({
    careerTarget: {
      role: "Data Analyst",
      region: "all-malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    jobs: [{ id: "1" }, { id: "2" }, { id: "empty-requirements" }],
    relevantJobCount: 2,
    excludedJobCount: 1,
    skillDemand: {
      SQL: 2,
    },
  });

  assert.deepEqual(overview.stats[0], {
    label: "Relevant job postings",
    value: "2",
    detail: "with detected company requirements",
  });
});

test("hides unrelated provider result stat when no jobs were excluded", () => {
  const overview = buildMarketEvidenceOverview({
    careerTarget: {
      role: "Data Analyst",
      region: "all-malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    jobs: [{ id: "1" }],
    relevantJobCount: 1,
    excludedJobCount: 0,
    skillDemand: {
      SQL: 1,
    },
  });

  assert.deepEqual(
    overview.stats.map((stat) => stat.label),
    ["Relevant job postings", "Latest CV"],
  );
});

test("describes missing market and CV inputs without empty dashboard filler", () => {
  const overview = buildMarketEvidenceOverview({
    careerTarget: {
      role: "Data Analyst",
      region: "sabah",
    },
    cvDocument: null,
    jobs: [],
    skillDemand: {},
  });

  assert.equal(overview.stats[0].value, "0");
  assert.equal(overview.stats[1].value, "Not confirmed");
  assert.deepEqual(overview.topDemandedSkills, []);
});
