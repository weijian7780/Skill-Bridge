import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { generateRoadmap } from "./roadmapGenerator.js";
import { buildLocalRoadmap } from "./localRoadmapBuilder.js";

test("uses Gemini chat completions for roadmap generation when configured", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const requests = [];
  const geminiServer = http.createServer(async (request, response) => {
    requests.push({
      method: request.method,
      url: request.url,
      body: JSON.parse(await readRequestBody(request)),
    });

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              overview: "Build proof for the highest-frequency missing market skills.",
              items: [
                {
                  month: "Month 1",
                  skill: "Reporting",
                  title: "Reporting portfolio sprint",
                  what: "Build a report from a small dataset.",
                  why: "Reporting appears in 3 matching jobs.",
                  when: "Month 1: start immediately",
                  howToStart: ["Pick one dataset", "Create three charts", "Write insights"],
                  successCriteria: "A CV-ready report with screenshots.",
                  objective: "Prove reporting skill.",
                  description: "Create a concise reporting artifact.",
                  reason: "Reporting appears in 3 matching jobs.",
                  deliverable: "Report PDF",
                  resource: "Power BI tutorial",
                  tasks: ["Pick one dataset", "Create three charts", "Write insights"],
                  companyEvidence: ["TWO95", "ResMed"],
                },
              ],
              assumptions: [],
              confidence: 0.83,
              source: "gemini",
            }),
          },
        },
      ],
    }));
  }).listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${geminiServer.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

    const roadmap = await generateRoadmap({
      careerTarget: { role: "Data Analyst" },
      skillProfile: { technicalSkills: ["Figma"] },
      analysis: {
        missingSkills: ["Reporting"],
        marketEvidence: {
          skillDemand: { Reporting: 3 },
          jobMatches: [
            { company: "TWO95", missingSkills: ["Reporting"] },
            { company: "ResMed", missingSkills: ["Reporting"] },
          ],
        },
      },
    });

    assert.equal(roadmap.source, "gemini");
    assert.equal(roadmap.items[0].skill, "Reporting");
    assert.match(roadmap.items[0].successCriteria, /CV-ready/);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].url, "/v1beta/openai/chat/completions");
    assert.equal(requests[0].body.model, "gemini-2.5-flash-lite");
    assert.match(requests[0].body.messages[0].content, /Create a concise career roadmap/);
    assert.match(requests[0].body.messages[0].content, /Reporting/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(geminiServer);
  }
});

test("generates roadmap items from deterministic missing skills and company evidence", () => {
  const roadmap = buildLocalRoadmap({
    careerTarget: { role: "Data Analyst" },
    analysis: {
      missingSkills: ["Reporting"],
      marketEvidence: {
        skillDemand: { Reporting: 3 },
        jobMatches: [
          { company: "TWO95", missingSkills: ["Reporting"] },
          { company: "ResMed", missingSkills: ["Reporting"] },
        ],
      },
    },
  });

  assert.equal(roadmap.items.length, 1);
  assert.equal(roadmap.items[0].skill, "Reporting");
  assert.deepEqual(roadmap.items[0].companyEvidence, ["TWO95", "ResMed"]);
  assert.match(roadmap.items[0].reason, /3 matching jobs/);
});

test("builds roadmap items with what why when and how-to-start guidance", () => {
  const roadmap = buildLocalRoadmap({
    careerTarget: { role: "Data Analyst" },
    analysis: {
      missingSkills: ["Power BI", "SQL"],
      marketEvidence: {
        skillDemand: {
          "Power BI": 4,
          SQL: 2,
        },
        jobMatches: [
          { company: "Analytics Sdn Bhd", missingSkills: ["Power BI", "SQL"] },
          { company: "BI Malaysia", missingSkills: ["Power BI"] },
        ],
      },
    },
  });

  assert.equal(roadmap.items[0].skill, "Power BI");
  assert.match(roadmap.items[0].what, /Power BI/i);
  assert.match(roadmap.items[0].why, /4 matching jobs/);
  assert.equal(roadmap.items[0].when, "Month 1: start immediately");
  assert.deepEqual(roadmap.items[0].howToStart.slice(0, 2), [
    "Follow one beginner Power BI tutorial using a small CSV dataset.",
    "Rebuild one dashboard from a real job-relevant business question.",
  ]);
  assert.match(roadmap.items[0].successCriteria, /CV-ready/i);
  assert.deepEqual(roadmap.items[0].companyEvidence, ["Analytics Sdn Bhd", "BI Malaysia"]);
});

test("does not call the roadmap AI when no missing skills exist", async () => {
  const previousEnv = captureEnv(["GEMINI_API_KEY"]);
  process.env.GEMINI_API_KEY = "fake-key-that-should-not-be-used";

  try {
    const roadmap = await generateRoadmap({
      careerTarget: { role: "Data Analyst" },
      skillProfile: { technicalSkills: ["Reporting"] },
      analysis: {
        missingSkills: [],
        marketEvidence: {},
      },
    });

    assert.equal(roadmap.source, "deterministic");
    assert.deepEqual(roadmap.items, []);
  } finally {
    restoreEnvSnapshot(previousEnv);
  }
});

function captureEnv(names) {
  return Object.fromEntries(names.map((name) => [name, process.env[name]]));
}

function restoreEnvSnapshot(snapshot) {
  for (const [name, value] of Object.entries(snapshot)) {
    if (value === undefined) {
      delete process.env[name];
      continue;
    }

    process.env[name] = value;
  }
}

function readRequestBody(request) {
  return new Promise((resolve, reject) => {
    let body = "";
    request.setEncoding("utf8");
    request.on("data", (chunk) => {
      body += chunk;
    });
    request.on("end", () => resolve(body));
    request.on("error", reject);
  });
}

function closeServer(server) {
  return new Promise((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
}
