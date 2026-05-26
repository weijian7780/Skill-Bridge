import test from "node:test";
import assert from "node:assert/strict";

import { searchMarketJobs } from "./jobProvider.js";

test("uses Gemini to extract hard skills and tools from a full Jooble job description", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: "test-gemini-key",
    GEMINI_BASE_URL: "http://gemini.test/v1beta/openai",
    GEMINI_MODEL: "gemini-3.1-flash-lite",
    GEMINI_FALLBACK_MODELS: "",
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    const requestUrl = String(url);
    const requestBody = JSON.parse(options.body);
    calls.push({ url: requestUrl, body: requestBody });

    if (requestUrl === "https://jooble.org/api/jooble-key") {
      return jsonResponse({
        totalCount: 1,
        jobs: [
          {
            id: 456,
            title: "Big Data Architect",
            company: "Axiata",
            location: "Kuala Lumpur, Malaysia",
            snippet: "Lead enterprise data initiatives.",
            description: `
              Requires advanced knowledge of Big Data analysis and data management tools.
              Hands on experience in Data Management Lifecycle, Data Modelling and Data Governance.
              Experience with Hadoop clusters, Kafka, Flume, Oozie, Hive, HBASE, Spark SQL, Presto,
              ElasticSearch, Solr, Java, Python, R, Linux OS, machine-learning solutions, AI Integration,
              Natural Language Processing, data security, metadata management and data quality.
              TOGAF certification will be an advantage.
              Excellent communication skills and ability to convey complex topics.
            `,
            link: "https://jooble.org/jdp/3396058664902126194",
          },
        ],
      });
    }

    if (requestUrl === "http://gemini.test/v1beta/openai/chat/completions") {
      assert.match(requestBody.messages[0].content, /Hadoop clusters/);
      assert.match(requestBody.messages[0].content, /TOGAF certification/);
      return jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                hardSkills: [
                  "Big Data Analysis",
                  "Data Management Lifecycle",
                  "Data Modelling",
                  "Data Governance",
                  "Machine Learning",
                  "Natural Language Processing",
                ],
                tools: [
                  "Hadoop",
                  "Kafka",
                  "Flume",
                  "Oozie",
                  "Hive",
                  "HBase",
                  "Spark SQL",
                  "Presto",
                  "Elasticsearch",
                  "Solr",
                  "Java",
                  "Python",
                  "R",
                  "Linux",
                ],
                softSkills: ["Communication"],
                certifications: ["TOGAF"],
                education: "Bachelor's degree in computer science or related field",
                experience: "Minimum 8 years of data architecture experience",
                confidence: 0.9,
              }),
            },
          },
        ],
      });
    }

    throw new Error(`Unexpected fetch call: ${requestUrl}`);
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Architect",
      location: "Kuala Lumpur, Malaysia",
    });

    assert.equal(result.jobs[0].requirements.partialRequirements, false);
    assert.deepEqual(result.jobs[0].requirements.hardSkills, [
      "Big Data Analysis",
      "Data Management Lifecycle",
      "Data Modelling",
      "Data Governance",
      "Machine Learning",
      "Natural Language Processing",
    ]);
    assert.deepEqual(result.jobs[0].requirements.tools, [
      "Hadoop",
      "Kafka",
      "Flume",
      "Oozie",
      "Hive",
      "HBase",
      "Spark SQL",
      "Presto",
      "Elasticsearch",
      "Solr",
      "Java",
      "Python",
      "R",
      "Linux",
    ]);
    assert.deepEqual(result.jobs[0].requirements.softSkills, ["Communication"]);
    assert.deepEqual(result.jobs[0].extractedSkills, [
      "Big Data Analysis",
      "Data Management Lifecycle",
      "Data Modelling",
      "Data Governance",
      "Machine Learning",
      "Natural Language Processing",
      "Hadoop",
      "Kafka",
      "Flume",
      "Oozie",
      "Hive",
      "HBase",
      "Spark SQL",
      "Presto",
      "Elasticsearch",
      "Solr",
      "Java",
      "Python",
      "R",
      "Linux",
    ]);
    assert.equal(result.jobs[0].requirements.certifications, undefined);
    assert.equal(calls.length, 2);
  } finally {
    restoreFetch();
    restore();
  }
});

test("marks snippet-only Jooble requirements as partial", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const restoreFetch = withFetch(async () => jsonResponse({
    totalCount: 1,
    jobs: [
      {
        id: 789,
        title: "UI/UX Designer",
        company: "TWO95 International, Inc",
        location: "Malaysia",
        snippet: "Knowledge of Figma, UI/UX best practices, Miro and Slack.",
        link: "https://jooble.org/jdp/snippet-only",
      },
    ],
  }));

  try {
    const result = await searchMarketJobs({
      role: "UI/UX Designer",
      location: "Malaysia",
    });

    assert.equal(result.jobs[0].requirements.partialRequirements, true);
    assert.equal(result.jobs[0].requirements.sourceText, "snippet");
    assert.deepEqual(result.jobs[0].extractedSkills, ["Figma", "Miro", "Slack", "UI/UX Best Practices"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("extracts a Jooble result page with one Gemini request", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: "test-gemini-key",
    GEMINI_BASE_URL: "http://gemini.test/v1beta/openai",
    GEMINI_MODEL: "gemini-3.1-flash-lite",
    GEMINI_FALLBACK_MODELS: "",
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    const requestUrl = String(url);
    const requestBody = JSON.parse(options.body);
    calls.push({ url: requestUrl, body: requestBody });

    if (requestUrl === "https://jooble.org/api/jooble-key") {
      return jsonResponse({
        totalCount: 2,
        jobs: [
          {
            id: "job-1",
            title: "Data Governance Analyst",
            company: "Axiata",
            location: "Malaysia",
            description: "Requires data governance, metadata management, Kafka and Python.",
            link: "https://example.test/job-1",
          },
          {
            id: "job-2",
            title: "BI Analyst",
            company: "Analytics Sdn Bhd",
            location: "Malaysia",
            description: "Requires data warehousing, dashboard design, Power BI and SQL.",
            link: "https://example.test/job-2",
          },
        ],
      });
    }

    if (requestUrl === "http://gemini.test/v1beta/openai/chat/completions") {
      assert.match(requestBody.messages[0].content, /job-1/);
      assert.match(requestBody.messages[0].content, /job-2/);
      return jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                jobs: [
                  {
                    id: "job-1",
                    hardSkills: ["Data Governance", "Metadata Management"],
                    tools: ["Kafka", "Python"],
                    softSkills: [],
                    confidence: 0.88,
                  },
                  {
                    id: "job-2",
                    hardSkills: ["Data Warehousing", "Dashboard Design"],
                    tools: ["Power BI", "SQL"],
                    softSkills: [],
                    confidence: 0.86,
                  },
                ],
              }),
            },
          },
        ],
      });
    }

    throw new Error(`Unexpected fetch call: ${requestUrl}`);
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Malaysia",
    });

    const geminiCalls = calls.filter((call) => call.url.includes("/chat/completions"));
    assert.equal(geminiCalls.length, 1);
    assert.deepEqual(result.jobs[0].extractedSkills, ["Data Governance", "Metadata Management", "Kafka", "Python"]);
    assert.deepEqual(result.jobs[1].extractedSkills, ["Data Warehousing", "Dashboard Design", "Power BI", "SQL"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("uses Jooble first by default and normalizes job skills", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
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
    assert.equal(result.providerMode, "jooble");
    assert.equal(result.total, 1);
    assert.equal(calls.length, 1);
    assert.equal(calls[0].url, "https://jooble.org/api/jooble-key");
    assert.equal(JSON.parse(calls[0].options.body).keywords, "Data Analyst");
    assert.equal(JSON.parse(calls[0].options.body).location, "Sabah, Malaysia");
    assert.deepEqual(result.jobs[0].extractedSkills, ["SQL", "Power BI", "Dashboards", "Reporting"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("ignores legacy industry values when searching Jooble by role", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    calls.push({ url: String(url), options });

    return jsonResponse({
      totalCount: 1,
      jobs: [
        {
          id: "finance-data-analyst",
          title: "Finance Data Analyst",
          company: "Bank Analytics",
          location: "Malaysia",
          snippet: "Build SQL reports for banking and financial teams.",
          link: "https://example.test/job/finance-data-analyst",
        },
      ],
    });
  });

  try {
    await searchMarketJobs({
      role: "Data Analyst",
      industry: "finance",
      location: "Malaysia",
    });

    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.keywords, "Data Analyst");
    assert.equal(requestBody.location, "Malaysia");
  } finally {
    restoreFetch();
    restore();
  }
});

test("uses the default target role instead of industry keywords when role is empty", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options) => {
    calls.push({ url: String(url), options });

    return jsonResponse({
      totalCount: 0,
      jobs: [],
    });
  });

  try {
    await searchMarketJobs({
      role: "",
      industry: "data-it",
      location: "Malaysia",
    });

    const requestBody = JSON.parse(calls[0].options.body);
    assert.equal(requestBody.keywords, "Data Analyst");
    assert.equal(requestBody.location, "Malaysia");
  } finally {
    restoreFetch();
    restore();
  }
});

test("reports not configured when Jooble is missing", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: undefined,
  });

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Sabah, Malaysia",
      userIp: "127.0.0.1",
      userAgent: "node-test",
      referer: "https://skillbridge.example",
    });

    assert.equal(result.configured, false);
    assert.equal(result.source, "Jooble");
    assert.equal(result.providerMode, "jooble");
    assert.match(result.message, /Jooble API key not configured/);
    assert.deepEqual(result.attempts, [
      {
        source: "Jooble",
        configured: false,
        total: 0,
        jobs: 0,
        message: "Jooble API key not configured. Add JOOBLE_API_KEY to server/.env.",
      },
    ]);
  } finally {
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
