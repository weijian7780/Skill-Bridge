import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { extractSkillProfile } from "./skillExtractionRouter.js";

test("uses Gemini chat completions for CV skill extraction when configured", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
    "GEMINI_FALLBACK_MODELS",
  ]);
  const requests = [];
  const server = http.createServer(async (request, response) => {
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
              technicalSkills: ["Python", "SQL"],
              softSkills: ["Communication"],
              education: "UMS Computer Science",
              certifications: ["Google Data Analytics"],
              confidence: 0.91,
            }),
          },
        },
      ],
    }));
  }).listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${server.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
    delete process.env.GEMINI_FALLBACK_MODELS;

    const profile = await extractSkillProfile("UMS Computer Science CV with Python, SQL, and Communication.");

    assert.equal(profile.provider, "Gemini");
    assert.deepEqual(profile.technicalSkills, ["Python", "SQL"]);
    assert.deepEqual(profile.softSkills, ["Communication"]);
    assert.equal(profile.education, "UMS Computer Science");
    assert.equal(profile.confidence, 0.91);
    assert.equal(requests.length, 1);
    assert.equal(requests[0].method, "POST");
    assert.equal(requests[0].url, "/v1beta/openai/chat/completions");
    assert.equal(requests[0].body.model, "gemini-2.5-flash-lite");
    assert.equal(requests[0].body.temperature, 0);
    assert.match(requests[0].body.messages[0].content, /Return valid JSON only/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(server);
  }
});

test("uses the next Gemini chat model when the primary model returns transient 503", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
    "GEMINI_FALLBACK_MODELS",
  ]);
  const requests = [];
  const server = http.createServer(async (request, response) => {
    const body = JSON.parse(await readRequestBody(request));
    requests.push(body);

    if (body.model === "gemini-2.5-flash-lite") {
      response.writeHead(503, { "Content-Type": "application/json" });
      response.end(JSON.stringify([
        {
          error: {
            code: 503,
            message: "This model is currently experiencing high demand. Please try again later.",
            status: "UNAVAILABLE",
          },
        },
      ]));
      return;
    }

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              technicalSkills: ["Figma", "Adobe XD"],
              softSkills: ["User research"],
              education: "Master of Science in HCI - New York University",
              certifications: [],
              confidence: 0.88,
            }),
          },
        },
      ],
    }));
  }).listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${server.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
    process.env.GEMINI_FALLBACK_MODELS = "gemini-3.1-flash-lite";

    const profile = await extractSkillProfile("Max Johnson UX Designer CV with Figma and Adobe XD.");

    assert.equal(profile.provider, "Gemini");
    assert.deepEqual(profile.technicalSkills, ["Figma", "Adobe XD"]);
    assert.equal(profile.education, "Master of Science in HCI - New York University");
    assert.equal(requests.length, 2);
    assert.equal(requests[0].model, "gemini-2.5-flash-lite");
    assert.equal(requests[1].model, "gemini-3.1-flash-lite");
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(server);
  }
});

test("does not invent education when Gemini returns empty education", async () => {
  const previousEnv = captureEnv(["GEMINI_API_KEY", "GEMINI_BASE_URL", "GEMINI_MODEL", "GEMINI_FALLBACK_MODELS"]);
  const server = http.createServer(async (_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              technicalSkills: ["Figma", "Adobe XD"],
              softSkills: [],
              education: "",
              certifications: [],
              confidence: 0.6,
            }),
          },
        },
      ],
    }));
  }).listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${server.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";
    delete process.env.GEMINI_FALLBACK_MODELS;

    const profile = await extractSkillProfile("UX Designer CV - Max Johnson - Figma, Adobe XD");

    assert.equal(profile.provider, "Gemini");
    assert.deepEqual(profile.technicalSkills, ["Figma", "Adobe XD"]);
    assert.equal(profile.education, "", "education must stay empty when LLM returns empty - never invent UMS placeholder");
    assert.ok(profile.warnings.some((w) => /education/i.test(w)), "should warn that education was missing from extraction");
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(server);
  }
});

test("falls back from missing Gemini directly to local rules", async () => {
  const previousEnv = captureEnv(["GEMINI_API_KEY"]);
  delete process.env.GEMINI_API_KEY;

  try {
    const profile = await extractSkillProfile("UMS Computer Science CV with Python, SQL, and Communication.");

    assert.equal(profile.provider, "Local rule fallback");
    assert.deepEqual(profile.warnings, ["Gemini API key not configured"]);
    assert.equal(profile.education, "Computer Science");
    assert.ok(profile.technicalSkills.includes("Python"));
    assert.ok(profile.technicalSkills.includes("SQL"));
  } finally {
    restoreEnvSnapshot(previousEnv);
  }
});

test("local fallback extracts visible UX education entries from a resume education section", async () => {
  const previousEnv = captureEnv(["GEMINI_API_KEY"]);
  delete process.env.GEMINI_API_KEY;

  try {
    const profile = await extractSkillProfile([
      "Max Johnson",
      "UX Designer",
      "Profile Summary: Experienced UX Designer specializing in user research, interaction design, and prototyping.",
      "Skills: Figma, Adobe XD, Sketch, InVision, Photoshop.",
      "Education:",
      "Master of Science in HCI - New York University, New York (Jan 2016 - Dec 2018)",
      "Bachelor of Science in UX Design - University of Washington, Washington (Jan 2011 - Dec 2015)",
    ].join("\n"));

    assert.equal(profile.provider, "Local rule fallback");
    assert.match(profile.education, /Master of Science in HCI - New York University/);
    assert.match(profile.education, /Bachelor of Science in UX Design - University of Washington/);
    assert.ok(!profile.warnings.some((warning) => /Education was not detected/i.test(warning)));
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
