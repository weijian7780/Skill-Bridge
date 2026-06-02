import test from "node:test";
import assert from "node:assert/strict";
import express from "express";
import { requireActiveSubscription, isActiveSubscription } from "./subscription.js";

function createTestApp(subscriptionRows) {
  const app = express();
  app.use((request, _response, next) => {
    request.user = { id: "employer-123", role: "employer" };
    request.supabase = {
      url: "https://test.supabase.co",
      serviceRoleKey: "test-key",
      fetchImpl: async () => ({ ok: true, status: 200, async json() { return subscriptionRows; } }),
    };
    next();
  });
  app.use(requireActiveSubscription);
  app.get("/gated", (_request, response) => response.json({ ok: true }));
  return app;
}

function listen(app) {
  const server = app.listen(0);
  return { server, baseUrl: `http://127.0.0.1:${server.address().port}` };
}

test("isActiveSubscription: active with no expiry is allowed", () => {
  assert.equal(isActiveSubscription({ status: "active" }), true);
});

test("isActiveSubscription: expired subscription is rejected", () => {
  assert.equal(isActiveSubscription({ status: "active", expires_at: "2000-01-01T00:00:00Z" }), false);
});

test("isActiveSubscription: inactive status is rejected", () => {
  assert.equal(isActiveSubscription({ status: "inactive" }), false);
});

test("blocks the request with 402 when there is no active subscription", async () => {
  const app = createTestApp([{ status: "inactive" }]);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/gated`);
    assert.equal(response.status, 402);
    const body = await response.json();
    assert.equal(body.code, "subscription_required");
  } finally {
    server.close();
  }
});

test("allows the request through when an active subscription exists", async () => {
  const app = createTestApp([{ status: "active", expires_at: "2999-01-01T00:00:00Z" }]);
  const { server, baseUrl } = listen(app);
  try {
    const response = await fetch(`${baseUrl}/gated`);
    assert.equal(response.status, 200);
    const body = await response.json();
    assert.equal(body.ok, true);
  } finally {
    server.close();
  }
});
