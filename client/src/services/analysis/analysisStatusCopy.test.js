import test from "node:test";
import assert from "node:assert/strict";

import { buildAnalysisActionLabel, buildAnalysisScoreMessage } from "./analysisStatusCopy.js";

test("explains that job API rejection blocks real score calculation", () => {
  const message = buildAnalysisScoreMessage({
    analysisStatus: "needs_market",
    jobStatus: "Jooble rejected the request with 403. Check JOOBLE_API_KEY.",
    matchedCount: 0,
  });

  assert.match(message, /Job-market data is unavailable/);
  assert.match(message, /403/);
  assert.equal(
    buildAnalysisActionLabel({
      analysisStatus: "needs_market",
      jobStatus: "Jooble rejected the request with 403.",
    }),
    "Job API Unavailable",
  );
});

test("explains that a stopped local API server blocks job-market results", () => {
  const message = buildAnalysisScoreMessage({
    analysisStatus: "needs_market",
    jobStatus: "Failed to fetch",
    matchedCount: 0,
  });

  assert.match(message, /local API server/);
  assert.match(message, /4000/);
  assert.equal(
    buildAnalysisActionLabel({
      analysisStatus: "needs_market",
      jobStatus: "Failed to fetch",
    }),
    "Retry Job Search",
  );
});
