import test from "node:test";
import assert from "node:assert/strict";

import { buildJobCacheKey, createSupabaseJobCache } from "./supabaseJobCache.js";

test("builds a stable cache key from provider, role, and location", () => {
  assert.equal(
    buildJobCacheKey({
      provider: "Auto",
      version: "job-requirements-v1",
      industry: "Finance",
      role: "  Data   Analyst Intern ",
      location: " Sabah,  Malaysia ",
    }),
    "auto|job-requirements-v1|finance|data analyst intern|sabah, malaysia",
  );
});

test("defaults direct cache keys to current Jooble requirement version", () => {
  assert.equal(
    buildJobCacheKey({
      industry: "data-it",
      role: "Security",
      location: "Malaysia",
    }),
    "jooble|job-requirements-v2|data-it|security|malaysia",
  );
});

test("defaults Supabase job cache keys to Jooble when no provider override is configured", async () => {
  const calls = [];
  const cache = createSupabaseJobCache({
    env: {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
    },
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse([]);
    },
  });

  const result = await cache.get({
    role: "Azure Devops Engineer",
    industry: "data-it",
    location: "Malaysia",
  });

  assert.equal(result.hit, false);
  assert.equal(result.cacheKey, "jooble|job-requirements-v2|data-it|azure devops engineer|malaysia");
  assert.match(calls[0].url, /cache_key=eq\.jooble%7Cjob-requirements-v2%7Cdata-it%7Cazure\+devops\+engineer%7Cmalaysia/);
});

test("loads a valid cached Supabase job search result", async () => {
  const calls = [];
  const cache = createSupabaseJobCache({
    env: {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      JOB_PROVIDER: "auto",
    },
    now: () => new Date("2026-05-22T10:00:00.000Z"),
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse([
        {
          cache_key: "auto|job-requirements-v2|data-it|data analyst|sabah, malaysia",
          expires_at: "2026-05-22T16:00:00.000Z",
          payload: {
            configured: true,
            source: "Jooble",
            jobs: [{ id: "cached-job" }],
          },
        },
      ]);
    },
  });

  const result = await cache.get({
    role: "Data Analyst",
    industry: "data-it",
    location: "Sabah, Malaysia",
  });

  assert.equal(result.hit, true);
  assert.equal(result.cacheKey, "auto|job-requirements-v2|data-it|data analyst|sabah, malaysia");
  assert.equal(result.expiresAt, "2026-05-22T16:00:00.000Z");
  assert.equal(result.result.jobs[0].id, "cached-job");
  assert.match(calls[0].url, /job_search_cache/);
  assert.match(calls[0].url, /cache_key=eq\.auto%7Cjob-requirements-v2%7Cdata-it%7Cdata\+analyst%7Csabah%2C\+malaysia/);
  assert.equal(calls[0].options.headers.apikey, "service-role-key");
  assert.equal(calls[0].options.headers.Authorization, "Bearer service-role-key");
});

test("stores job search results in Supabase with an expiry", async () => {
  const calls = [];
  const cache = createSupabaseJobCache({
    env: {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "service-role-key",
      JOB_PROVIDER: "jooble",
      JOB_CACHE_TTL_MINUTES: "30",
    },
    now: () => new Date("2026-05-22T10:00:00.000Z"),
    fetchImpl: async (url, options) => {
      calls.push({ url: String(url), options });
      return jsonResponse([
        {
          cache_key: "jooble|job-requirements-v2|finance|data analyst|malaysia",
          expires_at: "2026-05-22T10:30:00.000Z",
        },
      ]);
    },
  });

  const result = await cache.set(
    {
      role: "Data Analyst",
      industry: "finance",
      location: "Malaysia",
    },
    {
      configured: true,
      source: "Jooble",
      total: 1,
      jobs: [{ id: "live-job" }],
    },
  );

  const body = JSON.parse(calls[0].options.body);
  assert.equal(result.ok, true);
  assert.equal(result.cacheKey, "jooble|job-requirements-v2|finance|data analyst|malaysia");
  assert.equal(result.expiresAt, "2026-05-22T10:30:00.000Z");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.Prefer, "resolution=merge-duplicates,return=representation");
  assert.equal(body.cache_key, "jooble|job-requirements-v2|finance|data analyst|malaysia");
  assert.equal(body.provider, "jooble");
  assert.equal(body.role, "Data Analyst");
  assert.equal(body.location, "Malaysia");
  assert.equal(body.payload.jobs[0].id, "live-job");
  assert.equal(body.expires_at, "2026-05-22T10:30:00.000Z");
});

test("disables the Supabase job cache when server credentials are missing", async () => {
  const cache = createSupabaseJobCache({
    env: {
      SUPABASE_URL: "https://project.supabase.co",
      SUPABASE_SERVICE_ROLE_KEY: "",
    },
  });

  const result = await cache.get({
    role: "Data Analyst",
    location: "Malaysia",
  });

  assert.equal(result.hit, false);
  assert.equal(result.reason, "Supabase job cache is not configured.");
});

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}
