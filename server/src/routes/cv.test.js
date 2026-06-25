import test from "node:test";
import assert from "node:assert/strict";
import http from "node:http";

import { createApp } from "../app.js";

test("CV image upload extracts a skill profile directly from the image in one Gemini call", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  const requests = [];
  const geminiServer = http.createServer(async (request, response) => {
    requests.push(JSON.parse(await readRequestBody(request)));

    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [
        {
          message: {
            content: JSON.stringify({
              technicalSkills: ["Python", "SQL", "Power BI"],
              softSkills: ["Communication"],
              education: "UMS Computer Science",
              certifications: [],
              confidence: 0.88,
            }),
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
    assert.equal(body.skillProfile.provider, "Gemini (image)");
    // A single vision call that sends the image and asks for structured JSON -
    // never a verbatim-OCR pass (which trips Gemini's RECITATION filter).
    assert.equal(requests.length, 1);
    assert.equal(requests[0].model, "gemini-2.5-flash-lite");
    assert.equal(requests[0].response_format.type, "json_object");
    assert.match(requests[0].messages[0].content[1].image_url.url, /data:image\/jpeg;base64,/);
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

test("CV image upload degrades gracefully (no 502) when Gemini auth fails", async () => {
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

    // An image the model can't read must not crash the upload as a 502 - the
    // student gets an editable empty profile plus a warning explaining why.
    assert.equal(response.status, 200);
    assert.deepEqual(body.skillProfile.technicalSkills, []);
    assert.ok(body.skillProfile.warnings.some((w) => /403/.test(w)));
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
  }
});

test("CV image upload degrades gracefully when Gemini returns malformed JSON", async () => {
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

    assert.equal(response.status, 200);
    assert.deepEqual(body.skillProfile.technicalSkills, []);
    assert.ok(body.skillProfile.warnings.some((w) => /invalid JSON/.test(w)));
  } finally {
    restoreEnvSnapshot(previousEnv);
    await closeServer(appServer);
    await closeServer(geminiServer);
  }
});

test("CV image upload degrades gracefully and surfaces the finish_reason when Gemini blocks the content", async () => {
  const previousEnv = captureEnv([
    "GEMINI_API_KEY",
    "GEMINI_BASE_URL",
    "GEMINI_MODEL",
  ]);
  // Mirrors the real RECITATION block: 200 OK, but an empty content with a
  // content_filter finish_reason.
  const geminiServer = http.createServer(async (_request, response) => {
    response.writeHead(200, { "Content-Type": "application/json" });
    response.end(JSON.stringify({
      choices: [{ finish_reason: "content_filter: RECITATION", message: {} }],
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
    assert.deepEqual(body.skillProfile.technicalSkills, []);
    assert.ok(body.skillProfile.warnings.some((w) => /no message content/.test(w)));
    assert.ok(body.skillProfile.warnings.some((w) => /content_filter|RECITATION/.test(w)));
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
