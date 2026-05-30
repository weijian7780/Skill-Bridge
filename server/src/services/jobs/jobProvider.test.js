import test from "node:test";
import assert from "node:assert/strict";

import { searchMarketJobs } from "./jobProvider.js";

const two95UiUxFullDescription = `
Mid level and senior UI/UX Designer locals and expats available in Malaysia
TWO95 International, Inc
Malaysia
For Jr./Mid level JD

Requirements:

Minimum 3 years of working experience as a Jr/Mid-level UI/UX Designer.
Portfolio of design projects.
Up-to-date knowledge of FIGMA & UI/UX principles, guidelines & best practices
Team spirit; strong communication skills to collaborate with various stakeholders.
Good time-management skills.
Software/Tools Requirements:

FIGMA
(Optional) FIGJAM/ Miro
Google Suite
Slack
For Senior level JD

Minimum 5 years successful professional design experience, preferably at a digital agency or inhouse Web team for a product-driven business.
Experience with Wordpress, HTML(5), CSS(3)
Experience translating Mockups (e.g. Sketch) into HTML and CSS components
Expertise in Web usability, general UX
Experience with other web UI frameworks like jQuery, HTML5, CSS3, React, Angular, Bootstrap, etc. is a big plus
Experience in web marketing/web design with a strong knowledge of HTML, Photoshop, FTP, web design and development principles
Understanding browser and device compatibility
Strong portfolio of design work and showing solutions to business problems through effective design.
Enthusiastic and self-driven
Team player but able to work on his own initiative
Excellent communicator and presenter
Enjoying working in a dynamic and multi-cultural team and environment
Able to present concepts and lead internal teams to the correct solution.
Having attention to detail
Fluent oral and written English mandatory
`;

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

test("fetches a full Jooble job page before extracting required hard skills and tools", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: "test-gemini-key",
    GEMINI_BASE_URL: "http://gemini.test/v1beta/openai",
    GEMINI_MODEL: "gemini-3.1-flash-lite",
    GEMINI_FALLBACK_MODELS: "",
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const calls = [];
  const restoreFetch = withFetch(async (url, options = {}) => {
    const requestUrl = String(url);
    calls.push({ url: requestUrl, options });

    if (requestUrl === "https://jooble.org/api/jooble-key") {
      return jsonResponse({
        totalCount: 1,
        jobs: [
          {
            id: "two95-uiux",
            title: "Mid level and senior UI/UX Designer locals and expats available in Malaysia",
            company: "TWO95 International, Inc",
            location: "Malaysia",
            snippet: "Up-to-date knowledge of FIGMA & UI/UX principles, guidelines & best practices.",
            link: "https://jooble.org/jdp/-2210350391055282614",
          },
        ],
      });
    }

    if (requestUrl === "https://jooble.org/jdp/-2210350391055282614") {
      return htmlResponse(`<html><body><main>${two95UiUxFullDescription}</main></body></html>`);
    }

    if (requestUrl === "http://gemini.test/v1beta/openai/chat/completions") {
      const requestBody = JSON.parse(options.body);
      assert.match(requestBody.messages[0].content, /Software\/Tools Requirements/);
      assert.match(requestBody.messages[0].content, /Wordpress/);
      assert.match(requestBody.messages[0].content, /Slack/);
      assert.match(requestBody.messages[0].content, /"partialRequirements": false/);

      return jsonResponse({
        choices: [
          {
            message: {
              content: JSON.stringify({
                jobs: [
                  {
                    id: "two95-uiux",
                    hardSkills: [
                      "UI/UX Principles",
                      "UI/UX Guidelines",
                      "UI/UX Best Practices",
                      "HTML/CSS Component Translation",
                      "Web Usability",
                      "Web Design",
                      "Web Development Principles",
                      "Browser Compatibility",
                    ],
                    tools: [
                      "Figma",
                      "Google Suite",
                      "Slack",
                      "WordPress",
                      "HTML5",
                      "CSS3",
                      "Sketch",
                      "Photoshop",
                      "FTP",
                    ],
                    optionalTools: ["FigJam", "Miro", "jQuery", "React", "Angular", "Bootstrap"],
                    softSkills: ["Teamwork", "Communication", "Time Management", "Self-driven", "Attention to Detail"],
                    education: "",
                    experience: "Minimum 3 years for Jr/Mid level or 5 years for senior level.",
                    partialRequirements: false,
                    confidence: 0.92,
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
      role: "UI/UX Designer",
      location: "Malaysia",
    });

    assert.equal(result.jobs[0].requirements.partialRequirements, false);
    assert.equal(result.jobs[0].requirements.sourceText, "description");
    assert.deepEqual(result.jobs[0].requirements.hardSkills, [
      "UI/UX Principles",
      "UI/UX Guidelines",
      "UI/UX Best Practices",
      "HTML/CSS Component Translation",
      "Web Usability",
      "Web Design",
      "Web Development Principles",
      "Browser Compatibility",
    ]);
    assert.deepEqual(result.jobs[0].requirements.tools, [
      "Figma",
      "Google Suite",
      "Slack",
      "WordPress",
      "HTML5",
      "CSS3",
      "Sketch",
      "Photoshop",
      "FTP",
    ]);
    assert.deepEqual(result.jobs[0].requirements.optionalTools, [
      "FigJam",
      "Miro",
      "jQuery",
      "React",
      "Angular",
      "Bootstrap",
    ]);
    assert.deepEqual(result.jobs[0].extractedSkills, [
      "UI/UX Principles",
      "UI/UX Guidelines",
      "UI/UX Best Practices",
      "HTML/CSS Component Translation",
      "Web Usability",
      "Web Design",
      "Web Development Principles",
      "Browser Compatibility",
      "Figma",
      "Google Suite",
      "Slack",
      "WordPress",
      "HTML5",
      "CSS3",
      "Sketch",
      "Photoshop",
      "FTP",
    ]);
    assert.equal(calls.length, 3);
  } finally {
    restoreFetch();
    restore();
  }
});

test("local fallback excludes visibly optional tools from full Jooble descriptions", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
  });
  const restoreFetch = withFetch(async (url) => {
    const requestUrl = String(url);

    if (requestUrl === "https://jooble.org/api/jooble-key") {
      return jsonResponse({
        totalCount: 1,
        jobs: [
          {
            id: "two95-uiux",
            title: "Mid level and senior UI/UX Designer locals and expats available in Malaysia",
            company: "TWO95 International, Inc",
            location: "Malaysia",
            snippet: "Up-to-date knowledge of FIGMA & UI/UX principles, guidelines & best practices.",
            link: "https://jooble.org/jdp/-2210350391055282614",
          },
        ],
      });
    }

    if (requestUrl === "https://jooble.org/jdp/-2210350391055282614") {
      return htmlResponse(`<html><body><main>${two95UiUxFullDescription}</main></body></html>`);
    }

    throw new Error(`Unexpected fetch call: ${requestUrl}`);
  });

  try {
    const result = await searchMarketJobs({
      role: "UI/UX Designer",
      location: "Malaysia",
    });

    assert.equal(result.jobs[0].requirements.partialRequirements, false);
    assert.ok(result.jobs[0].requirements.tools.includes("Figma"));
    assert.ok(result.jobs[0].requirements.tools.includes("Google Suite"));
    assert.ok(result.jobs[0].requirements.tools.includes("Slack"));
    assert.ok(result.jobs[0].requirements.tools.includes("WordPress"));
    assert.ok(result.jobs[0].requirements.tools.includes("HTML5"));
    assert.ok(result.jobs[0].requirements.tools.includes("CSS3"));
    assert.ok(result.jobs[0].requirements.tools.includes("Sketch"));
    assert.ok(result.jobs[0].requirements.tools.includes("Photoshop"));
    assert.ok(result.jobs[0].requirements.tools.includes("FTP"));
    assert.deepEqual(result.jobs[0].requirements.optionalTools, ["FigJam", "Miro", "jQuery", "React", "Angular", "Bootstrap"]);
    assert.equal(result.jobs[0].extractedSkills.includes("FigJam"), false);
    assert.equal(result.jobs[0].extractedSkills.includes("Miro"), false);
    assert.equal(result.jobs[0].extractedSkills.includes("React"), false);
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

test("excludes Jooble results whose role is unrelated to the searched target role", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
    JOOBLE_FETCH_FULL_DESCRIPTION: "false",
  });
  const restoreFetch = withFetch(async () =>
    jsonResponse({
      totalCount: 3,
      jobs: [
        {
          id: "relevant-data-analyst",
          title: "Senior Data Analyst",
          company: "Sabah Analytics",
          location: "Malaysia",
          snippet: "Build Power BI dashboards and write SQL reports for the analytics team.",
          link: "https://example.test/job/data-analyst",
        },
        {
          id: "unrelated-truck-driver",
          title: "Heavy Truck Driver",
          company: "Logistics Sdn Bhd",
          location: "Malaysia",
          snippet: "Deliver goods across the Klang Valley. Valid GDL license required.",
          link: "https://example.test/job/truck-driver",
        },
        {
          id: "unrelated-nurse",
          title: "Registered Nurse",
          company: "Hospital Besar",
          location: "Malaysia",
          snippet: "Provide patient care in the intensive care ward.",
          link: "https://example.test/job/nurse",
        },
      ],
    }),
  );

  try {
    const result = await searchMarketJobs({
      role: "Data Analyst",
      location: "Malaysia",
    });

    const titles = result.jobs.map((job) => job.title);
    assert.deepEqual(titles, ["Senior Data Analyst"]);
  } finally {
    restoreFetch();
    restore();
  }
});

test("keeps morphological variants of the searched role (biotech -> biotechnology)", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
    JOOBLE_FETCH_FULL_DESCRIPTION: "false",
  });
  const restoreFetch = withFetch(async () =>
    jsonResponse({
      totalCount: 4,
      jobs: [
        {
          id: "biotech-associate",
          title: "Biotechnology Research Associate",
          company: "Genome Labs",
          location: "Malaysia",
          snippet: "Run molecular biology assays and document experimental results.",
          link: "https://example.test/job/biotech-associate",
        },
        {
          id: "biotechnologist",
          title: "Biotechnologist",
          company: "BioNova",
          location: "Malaysia",
          snippet: "Develop bioprocesses for therapeutic protein production.",
          link: "https://example.test/job/biotechnologist",
        },
        {
          id: "lab-tech",
          title: "Lab Technician",
          company: "General Diagnostics",
          location: "Malaysia",
          snippet: "Prepare samples and maintain laboratory equipment.",
          link: "https://example.test/job/lab-tech",
        },
        {
          id: "truck-driver",
          title: "Heavy Truck Driver",
          company: "Logistics Sdn Bhd",
          location: "Malaysia",
          snippet: "Deliver goods across the Klang Valley.",
          link: "https://example.test/job/truck-driver",
        },
      ],
    }),
  );

  try {
    const result = await searchMarketJobs({ role: "biotech", location: "Malaysia" });
    const titles = result.jobs.map((job) => job.title);
    assert.deepEqual(titles, ["Biotechnology Research Associate", "Biotechnologist"]);
    assert.equal(result.noRelevantMatches, false);
  } finally {
    restoreFetch();
    restore();
  }
});

test("flags an empty result with a warning when no provider job matches the role", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
    JOOBLE_FETCH_FULL_DESCRIPTION: "false",
  });
  const restoreFetch = withFetch(async () =>
    jsonResponse({
      totalCount: 2,
      jobs: [
        {
          id: "lab-tech",
          title: "Lab Technician",
          company: "General Diagnostics",
          location: "Malaysia",
          snippet: "Prepare samples and maintain laboratory equipment.",
          link: "https://example.test/job/lab-tech",
        },
        {
          id: "nurse",
          title: "Registered Nurse",
          company: "Hospital Besar",
          location: "Malaysia",
          snippet: "Provide patient care in the intensive care ward.",
          link: "https://example.test/job/nurse",
        },
      ],
    }),
  );

  try {
    const result = await searchMarketJobs({ role: "biotech", location: "Malaysia" });
    assert.deepEqual(result.jobs, []);
    assert.equal(result.noRelevantMatches, true);
    assert.equal(result.totalBeforeRelevanceFilter, 2);
    assert.match(result.warning, /biotech/i);
  } finally {
    restoreFetch();
    restore();
  }
});

test("does not flag a warning when the provider itself returns nothing", async () => {
  const restore = withEnv({
    GEMINI_API_KEY: undefined,
    JOB_PROVIDER: undefined,
    JOOBLE_API_KEY: "jooble-key",
    JOOBLE_FETCH_FULL_DESCRIPTION: "false",
  });
  const restoreFetch = withFetch(async () =>
    jsonResponse({ totalCount: 0, jobs: [] }),
  );

  try {
    const result = await searchMarketJobs({ role: "biotech", location: "Malaysia" });
    assert.deepEqual(result.jobs, []);
    assert.equal(result.noRelevantMatches, false);
    assert.equal(result.totalBeforeRelevanceFilter, 0);
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

function htmlResponse(payload, init = {}) {
  return new Response(payload, {
    status: init.status ?? 200,
    headers: { "Content-Type": "text/html" },
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
