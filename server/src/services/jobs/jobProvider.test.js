import test from "node:test";
import assert from "node:assert/strict";

import { searchMarketJobs } from "./jobProvider.js";

test("uses Jooble first by default and normalizes job skills", async () => {
  const restore = withEnv({
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
    CAREERJET_API_KEY: "careerjet-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    calls.push({ url: String(url), options });

    return jsonResponse({
      totalCount: 1,
      jobs: [
        {
          id: 123,
          title: "Junior Data Analyst",
          company: "Sabah Analytics",
          location: "Sabah",
          snippet: "Build Power BI dashboards and write SQL reports.",
          link: "https://example.test/job/123",
        },
      ],
    });
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Sabah, Malaysia",
      userIp: "127.0.0.1",
      userAgent: "node-test",
      referer: "https://skillbridge.example",
    });

    assert.equal(result.configured, true);
    assert.equal(result.source, "Jooble");
    assert.equal(result.total, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://jooble.org/api/jooble-key");
    assert.equal(JSON.parse(calls[0].options.body).keywords, "Data Analyst");
    assert.equal(JSON.parse(calls[0].options.body).location, "Sabah, Malaysia");
    assert.deepEqual(result.jobs[0].extractedSkills, ["SQL", "Power BI"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("falls back to Careerjet when Jooble is not configured", async () => {
  const restore = withEnv({
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: undefined,
    CAREERJET_API_KEY: "careerjet-key",
    CAREERJET_LOCALE: "en_MY",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    calls.push({ url: String(url), options });

    return jsonResponse({
      hits: 1,
      jobs: [
        {
          title: "Data Analyst Intern",
          company: "UMS Partner",
          location: "Kota Kinabalu",
          description: "Use Python and Excel for reporting.",
          url: "https://example.test/careerjet/1",
        },
      ],
    });
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Sabah, Malaysia",
      userIp: "127.0.0.1",
      userAgent: "node-test",
      referer: "https://skillbridge.example",
    });

    assert.equal(result.configured, true);
    assert.equal(result.source, "Careerjet");
    assert.match(calls[0].url, /^https:\/\/search\.api\.careerjet\.net\/v4\/query/);
    assert.deepEqual(result.attempts.map((attempt) => attempt.source), ["Jooble", "Careerjet"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("can force Careerjet when JOB_PROVIDER is careerjet", async () => {
  const restore = withEnv({
    JOB_PROVIDER: "careerjet",
    JOOBLE_API_KEY: "jooble-key",
    CAREERJET_API_KEY: "careerjet-key",
    CAREERJET_LOCALE: "en_MY",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    calls.push({ url: String(url), options });

    return jsonResponse({
      hits: 0,
      jobs: [],
    });
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Sabah, Malaysia",
      userIp: "127.0.0.1",
      userAgent: "node-test",
      referer: "https://skillbridge.example",
    });

    assert.equal(result.configured, true);
    assert.equal(result.source, "Careerjet");
    assert.equal(calls.length, 1);
    assert.match(calls[0].url, /^https:\/\/search\.api\.careerjet\.net\/v4\/query/);
  } finally {
    restoreFetch();
    restore();
  }
});

function jsonResponse(payload, init = {}) {
  return new Response(JSON.stringify(payload), {
    status: init.status ?? 200,
    headers: { "Content-Type": "application/json" },
  });
}

function withFetch(fetchImplementation) {
  const originalFetch = globalThis.fetch;
  globalThis.fetch = fetchImplementation;

  return () => {
    globalThis.fetch = originalFetch;
  };
}

function withEnv(values) {
  const originalValues = {};

  for (const key of Object.keys(values)) {
    originalValues[key] = process.env[key];
    if (values[key] === undefined) {
      delete process.env[key];
    } else {
      process.env[key] = values[key];
    }
  }

  return () => {
    for (const [key, value] of Object.entries(originalValues)) {
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    }
  };
}
