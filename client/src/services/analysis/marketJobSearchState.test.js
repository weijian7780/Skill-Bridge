import test from "node:test";
import assert from "node:assert/strict";

import {
  buildMarketJobTargetKey,
  buildMarketJobSearchTriggerKey,
  buildMarketJobSearchKey,
  shouldReuseLoadedMarketJobs,
} from "./marketJobSearchState.js";

test("reuses loaded market jobs when returning to analysis without changing target", () => {
  assert.equal(
    shouldReuseLoadedMarketJobs({
      jobSearchAttempt: 0,
      jobs: [{ id: "cached-analysis-job" }],
      loadedJobTargetKey: "Data Analyst|data-it|Malaysia",
      currentJobTargetKey: "Data Analyst|data-it|Malaysia",
      analysisStatus: "ready",
    }),
    true,
  );
});

test("does not reuse loaded market jobs when the user explicitly retries", () => {
  assert.equal(
    shouldReuseLoadedMarketJobs({
      jobSearchAttempt: 1,
      jobs: [{ id: "cached-analysis-job" }],
      loadedJobTargetKey: "Data Analyst|data-it|Malaysia",
      currentJobTargetKey: "Data Analyst|data-it|Malaysia",
      analysisStatus: "ready",
    }),
    false,
  );
});

test("does not reuse loaded jobs from a different target", () => {
  assert.equal(
    shouldReuseLoadedMarketJobs({
      jobSearchAttempt: 0,
      jobs: [{ id: "old-target-job" }],
      loadedJobTargetKey: "UI/UX Designer|data-it|Malaysia",
      currentJobTargetKey: "Data Analyst|data-it|Malaysia",
      analysisStatus: "ready",
    }),
    false,
  );
});

test("does not reuse loaded provider jobs that did not produce analysis content", () => {
  assert.equal(
    shouldReuseLoadedMarketJobs({
      jobSearchAttempt: 0,
      jobs: [{ id: "unusable-provider-job" }],
      loadedJobTargetKey: "Data Analyst|data-it|Malaysia",
      currentJobTargetKey: "Data Analyst|data-it|Malaysia",
      analysisStatus: "needs_market",
    }),
    false,
  );
});

test("builds a stable market target key without retry attempts", () => {
  assert.equal(
    buildMarketJobTargetKey({
      role: "Data Analyst",
      industry: "data-it",
      regionSearchValue: "Malaysia",
    }),
    "Data Analyst|data-it|Malaysia",
  );
});

test("builds the same market search key for route remounts with the same target", () => {
  assert.equal(
    buildMarketJobSearchKey({
      role: "Data Analyst",
      industry: "data-it",
      regionSearchValue: "Malaysia",
      jobSearchAttempt: 0,
    }),
    "Data Analyst|data-it|Malaysia|0",
  );
});

test("keeps the search trigger stable while output state changes during loading", () => {
  const beforeClearingJobs = buildMarketJobSearchTriggerKey({
    hasConfirmedCv: true,
    role: "Data Analyst",
    industry: "data-it",
    regionSearchValue: "Malaysia",
    jobSearchAttempt: 0,
    jobs: [{ id: "stale-job" }],
    analysisStatus: "ready",
  });
  const afterClearingJobs = buildMarketJobSearchTriggerKey({
    hasConfirmedCv: true,
    role: "Data Analyst",
    industry: "data-it",
    regionSearchValue: "Malaysia",
    jobSearchAttempt: 0,
    jobs: [],
    analysisStatus: "needs_market",
  });

  assert.equal(afterClearingJobs, beforeClearingJobs);
});
