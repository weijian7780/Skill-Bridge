import test from "node:test";
import assert from "node:assert/strict";

import { normalizeJoobleJob } from "./jobNormalizer.js";

test("extracts common analyst skills from Jooble titles and snippets", () => {
  const job = normalizeJoobleJob({
    title: "Business Intelligence Analyst",
    company: "Example",
    location: "Malaysia",
    snippet: "Build dashboards, write SQL, prepare reports, and support data analytics in an AWS data warehouse.",
    link: "https://example.test/job",
  });

  assert.deepEqual(job.extractedSkills, [
    "SQL",
    "Data Analytics",
    "Business Intelligence",
    "Dashboards",
    "Reporting",
    "Data Warehouse",
    "AWS",
  ]);
});
