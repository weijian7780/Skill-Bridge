import test from "node:test";
import assert from "node:assert/strict";

import { searchMarketJobsWithCache } from "./jobSearchCacheFlow.js";

test("uses cached market jobs without calling the external job provider", async () => {
  let providerCalls = 0;
  const result = await searchMarketJobsWithCache({
    searchContext: {
      role: "Data Analyst Intern",
      location: "Sabah, Malaysia",
    },
    cache: {
      async get(searchContext) {
        assert.equal(searchContext.role, "Data Analyst Intern");
        return {
          hit: true,
          cacheKey: "auto|data analyst intern|sabah, malaysia",
          result: {
            configured: true,
            source: "Jooble",
            total: 1,
            jobs: [{ id: "cached-job", title: "Cached Analyst Job" }],
          },
        };
      },
      async set() {
        throw new Error("Cache should not be written on a cache hit.");
      },
    },
    async searcher() {
      providerCalls += 1;
      return {
        configured: true,
        source: "Jooble",
        jobs: [],
      };
    },
  });

  assert.equal(providerCalls, 0);
  assert.equal(result.cached, true);
  assert.equal(result.cacheStatus, "hit");
  assert.equal(result.jobs[0].id, "cached-job");
});

test("stores successful market job provider results after a cache miss", async () => {
  const writes = [];
  const result = await searchMarketJobsWithCache({
    searchContext: {
      role: "Data Analyst Intern",
      location: "Sabah, Malaysia",
    },
    cache: {
      async get() {
        return {
          hit: false,
          cacheKey: "auto|data analyst intern|sabah, malaysia",
        };
      },
      async set(searchContext, providerResult) {
        writes.push({ searchContext, providerResult });
        return {
          ok: true,
          cacheKey: "auto|data analyst intern|sabah, malaysia",
          expiresAt: "2026-05-22T12:00:00.000Z",
        };
      },
    },
    async searcher() {
      return {
        configured: true,
        source: "Jooble",
        total: 1,
        jobs: [{ id: "live-job", title: "Live Analyst Job" }],
      };
    },
  });

  assert.equal(result.cached, false);
  assert.equal(result.cacheStatus, "stored");
  assert.equal(result.cacheExpiresAt, "2026-05-22T12:00:00.000Z");
  assert.equal(writes.length, 1);
  assert.equal(writes[0].searchContext.role, "Data Analyst Intern");
  assert.equal(writes[0].providerResult.jobs[0].id, "live-job");
});

test("refreshes market jobs by bypassing a cached result and storing the live result", async () => {
  let reads = 0;
  const writes = [];
  const result = await searchMarketJobsWithCache({
    searchContext: {
      role: "Azure Devops Engineer",
      location: "Malaysia",
      industry: "data-it",
    },
    forceRefresh: true,
    cache: {
      async get() {
        reads += 1;
        return {
          hit: true,
          cacheKey: "jooble|job-requirements-v1|azure devops engineer|malaysia",
          result: {
            configured: true,
            source: "Jooble",
            jobs: [{ id: "stale-job" }],
          },
        };
      },
      async set(searchContext, providerResult) {
        writes.push({ searchContext, providerResult });
        return {
          ok: true,
          cacheKey: "jooble|job-requirements-v1|azure devops engineer|malaysia",
          expiresAt: "2026-05-25T12:00:00.000Z",
        };
      },
    },
    async searcher() {
      return {
        configured: true,
        source: "Jooble",
        total: 1,
        jobs: [{ id: "live-job", title: "Fresh Azure DevOps Job" }],
      };
    },
  });

  assert.equal(reads, 0);
  assert.equal(writes.length, 1);
  assert.equal(result.cached, false);
  assert.equal(result.cacheStatus, "refreshed");
  assert.equal(result.jobs[0].id, "live-job");
});

test("does not cache not-configured job provider results", async () => {
  let writes = 0;
  const result = await searchMarketJobsWithCache({
    searchContext: {
      role: "Data Analyst Intern",
      location: "Sabah, Malaysia",
    },
    cache: {
      async get() {
        return {
          hit: false,
          cacheKey: "auto|data analyst intern|sabah, malaysia",
        };
      },
      async set() {
        writes += 1;
        return { ok: true };
      },
    },
    async searcher() {
      return {
        configured: false,
        source: "Job Provider",
        jobs: [],
      };
    },
  });

  assert.equal(writes, 0);
  assert.equal(result.cached, false);
  assert.equal(result.cacheStatus, "miss");
});
