import test from "node:test";
import assert from "node:assert/strict";

import { createApp } from "./app.js";

test("root endpoint identifies the API service and health route", async () => {
  const server = createApp().listen(0);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(body.ok, true);
    assert.equal(body.service, "skillbridge-server");
    assert.equal(body.health, "/api/health");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});

test("allows Vite dev origins when the client runs on a fallback port", async () => {
  const server = createApp().listen(0);

  try {
    const { port } = server.address();
    const response = await fetch(`http://127.0.0.1:${port}/api/health`, {
      headers: {
        Origin: "http://127.0.0.1:5175",
      },
    });

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("access-control-allow-origin"), "http://127.0.0.1:5175");
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
});
