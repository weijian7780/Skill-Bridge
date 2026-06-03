import test from "node:test";
import assert from "node:assert/strict";
import {
  fetchSavedJobs,
  saveJob,
  unsaveJob,
  isJobSaved,
} from "./savedJobsApi.js";

test("savedJobsApi - isJobSaved", () => {
  const savedList = [
    { job_id: "job-1", job_source: "skillbridge" },
    { job_id: "job-2", job_source: "market" },
  ];

  assert.equal(isJobSaved(savedList, "job-1", "skillbridge"), true);
  assert.equal(isJobSaved(savedList, "job-2", "market"), true);
  assert.equal(isJobSaved(savedList, "job-3", "skillbridge"), false);
  assert.equal(isJobSaved(savedList, "job-1", "market"), false);
  assert.equal(isJobSaved(null, "job-1", "skillbridge"), false);
});

test("savedJobsApi - fetchSavedJobs", async () => {
  const mockConfig = {
    url: "https://supabase-project.supabase.co",
    publishableKey: "mock-key",
  };
  const mockToken = "mock-token";
  const expectedJobs = [{ id: "1", job_id: "job-1", job_source: "market" }];

  const originalFetch = globalThis.fetch;
  let calledUrl = null;
  let calledOptions = null;

  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
      json: async () => expectedJobs,
    };
  };

  try {
    const result = await fetchSavedJobs({ config: mockConfig, accessToken: mockToken });
    assert.deepEqual(result, expectedJobs);
    assert.equal(calledUrl, "https://supabase-project.supabase.co/rest/v1/saved_jobs?order=created_at.desc");
    assert.equal(calledOptions.headers.apikey, "mock-key");
    assert.equal(calledOptions.headers.Authorization, "Bearer mock-token");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("savedJobsApi - saveJob", async () => {
  const mockConfig = {
    url: "https://supabase-project.supabase.co",
    publishableKey: "mock-key",
  };
  const mockToken = "mock-token";
  const jobData = { title: "Dev" };
  const mockCreatedRecord = { id: "1", job_id: "job-1", job_source: "market", job_data: jobData };

  const originalFetch = globalThis.fetch;
  let calledUrl = null;
  let calledOptions = null;

  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
      json: async () => [mockCreatedRecord],
    };
  };

  try {
    const result = await saveJob({
      config: mockConfig,
      accessToken: mockToken,
      userId: "user-42",
      jobId: "job-1",
      jobSource: "market",
      jobData,
    });
    assert.deepEqual(result, mockCreatedRecord);
    assert.equal(calledUrl, "https://supabase-project.supabase.co/rest/v1/saved_jobs");
    assert.equal(calledOptions.method, "POST");
    assert.equal(calledOptions.headers.Prefer, "return=representation");
    const parsedBody = JSON.parse(calledOptions.body);
    assert.deepEqual(parsedBody, {
      user_id: "user-42",
      job_id: "job-1",
      job_source: "market",
      job_data: jobData,
    });
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("savedJobsApi - unsaveJob", async () => {
  const mockConfig = {
    url: "https://supabase-project.supabase.co",
    publishableKey: "mock-key",
  };
  const mockToken = "mock-token";

  const originalFetch = globalThis.fetch;
  let calledUrl = null;
  let calledOptions = null;

  globalThis.fetch = async (url, options) => {
    calledUrl = url;
    calledOptions = options;
    return {
      ok: true,
    };
  };

  try {
    await unsaveJob({
      config: mockConfig,
      accessToken: mockToken,
      jobId: "job-1",
      jobSource: "market",
    });
    assert.ok(calledUrl.includes("/rest/v1/saved_jobs"));
    assert.ok(calledUrl.includes("job_id=eq.job-1"));
    assert.ok(calledUrl.includes("job_source=eq.market"));
    assert.equal(calledOptions.method, "DELETE");
  } finally {
    globalThis.fetch = originalFetch;
  }
});
