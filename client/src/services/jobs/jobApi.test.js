import test from "node:test";
import assert from "node:assert/strict";

import { buildMarketJobSearchPath } from "./jobApi.js";

test("builds job search URL with target-market search value instead of internal region id", () => {
  assert.equal(
    buildMarketJobSearchPath({
      role: "Data Analyst",
      region: "sabah",
    }),
    "/jobs/search?role=Data+Analyst&location=Sabah%2C+Malaysia",
  );
});

test("builds job search URL for all Malaysia target market", () => {
  assert.equal(
    buildMarketJobSearchPath({
      role: "Business Intelligence Intern",
      region: "all-malaysia",
    }),
    "/jobs/search?role=Business+Intelligence+Intern&location=Malaysia",
  );
});

test("builds job search URL from a changed user target", () => {
  assert.equal(
    buildMarketJobSearchPath({
      role: "UI/UX Designer",
      region: "penang",
    }),
    "/jobs/search?role=UI%2FUX+Designer&location=Penang%2C+Malaysia",
  );
});

test("includes selected industry in the job search URL", () => {
  assert.equal(
    buildMarketJobSearchPath({
      role: "Data Analyst",
      region: "all-malaysia",
      industry: "Finance",
    }),
    "/jobs/search?role=Data+Analyst&location=Malaysia&industry=finance",
  );
});

test("adds cache-bypass refresh flag for manual market job refresh", () => {
  assert.equal(
    buildMarketJobSearchPath({
      role: "Azure Devops Engineer",
      region: "all-malaysia",
      industry: "data-it",
      forceRefresh: true,
    }),
    "/jobs/search?role=Azure+Devops+Engineer&location=Malaysia&industry=data-it&refresh=true",
  );
});
