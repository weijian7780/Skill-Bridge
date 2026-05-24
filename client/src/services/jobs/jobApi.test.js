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
