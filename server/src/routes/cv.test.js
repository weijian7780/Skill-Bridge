import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { createApp } from "../app.js";

test("CV image upload uses Gemini vision OCR before Gemini skill extraction", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const requests = [];
  const geminiServer = http.createServer(async (request, response) => {
    const body = JSON.parse(await readRequestBody(request));
    requests.push(body);

    const content = requests.length === 1
      ? "Alex Mercer\nTechnical Skills: Python, SQL, Power BI"
      : JSON.stringify({
        technicalSkills: ["Python", "SQL", "Power BI"],
        softSkills: ["Communication"],
        education: "UMS Computer Science",
        certifications: [],
        confidence: 0.88,
      });

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [
        {
          message: {
            content,
          },
        },
      ],
    }));
  }).listen(0);
  const appServer = createApp().listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${geminiServer.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

    const imageBuffer = Buffer.from("ffd8ffe000104a4649460001", "hex");
    const formData = new FormData();
    formData.append("cv", new Blob([imageBuffer], { type: "image/jpeg" }), "latest-cv.jpg");

    const { port } = appServer.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cv/extract`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.document.filename, "latest-cv.jpg");
    assert.deepEqual(body.skillProfile.technicalSkills, ["Python", "SQL", "Power BI"]);
    assert.equal(body.skillProfile.provider, "Gemini");
    assert.equal(requests.length, 2);
    assert.equal(requests[0].model, "gemini-2.5-flash-lite");
    assert.match(requests[0].messages[0].content[1].image_url.url, /data:image\/jpeg;base64,/);
    assert.equal(requests[1].model, "gemini-2.5-flash-lite");
    assert.match(requests[1].messages[0].content, /Alex Mercer/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
  }
});

test("CV upload returns 413 when the file is larger than 10 MB", async () => {
  const appServer = createApp().listen(0);

  try {
    const oversizedBuffer = new Uint8Array(11 * 1024 * 1024);
    oversizedBuffer[0] = 0xff;
    oversizedBuffer[1] = 0xd8;
    oversizedBuffer[2] = 0xff;
    const formData = new FormData();
    formData.append("cv", new Blob([oversizedBuffer], { type: "image/jpeg" }), "oversized-cv.jpg");

    const { port } = appServer.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cv/extract`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 413);
    assert.match(body.error, /File too large/);
  } finally {
    await closeServer(appServer);
  }
});

test("CV image upload returns 502 Bad Gateway when Gemini returns 403 Authorization failed", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const geminiServer = http.createServer(async (_request, response) => {
    response.writeHead(403, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      error: { message: "API key invalid" },
    }));
  }).listen(0);
  const appServer = createApp().listen(0);

  try {
    process.env.GEMINI_API_KEY = "invalid-test-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${geminiServer.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

    const imageBuffer = Buffer.from("ffd8ffe000104a4649460001", "hex");
    const formData = new FormData();
    formData.append("cv", new Blob([imageBuffer], { type: "image/jpeg" }), "latest-cv.jpg");

    const { port } = appServer.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cv/extract`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.match(body.error, /Gemini chat completion failed \(403\)/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
  }
});

test("CV image upload returns 502 Bad Gateway when Gemini returns malformed JSON", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const geminiServer = http.createServer(async (_request, response) => {
    response.writeHead(200, { "Content-Type": "text/plain" });
    response.end("not json");
  }).listen(0);
  const appServer = createApp().listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${geminiServer.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

    const imageBuffer = Buffer.from("ffd8ffe000104a4649460001", "hex");
    const formData = new FormData();
    formData.append("cv", new Blob([imageBuffer], { type: "image/jpeg" }), "latest-cv.jpg");

    const { port } = appServer.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cv/extract`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.match(body.error, /Gemini chat completion returned invalid JSON/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
  }
});

test("CV image upload returns 502 Bad Gateway when Gemini returns no message content", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const geminiServer = http.createServer(async (_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({ choices: [{ message: {} }] }));
  }).listen(0);
  const appServer = createApp().listen(0);

  try {
    process.env.GEMINI_API_KEY = "test-gemini-key";
    process.env.GEMINI_BASE_URL = `http://127.0.0.1:${geminiServer.address().port}/v1beta/openai`;
    process.env.GEMINI_MODEL = "gemini-2.5-flash-lite";

    const imageBuffer = Buffer.from("ffd8ffe000104a4649460001", "hex");
    const formData = new FormData();
    formData.append("cv", new Blob([imageBuffer], { type: "image/jpeg" }), "latest-cv.jpg");

    const { port } = appServer.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/cv/extract`, {
      method: "POST",
      body: formData,
    });
    const body = await response.json();

    assert.equal(response.status, 502);
    assert.match(body.error, /Gemini chat completion returned no message content/);
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
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
