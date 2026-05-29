import test from "node:test";
import assert from "node:assert";
import { employerInterviewsRouter } from "./interviews.js";

// A simple mock for express request/response to test the route behavior
function createMockRes() {
  const res = {
    statusCode: 200,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(data) {
      this.body = data;
      return this;
    }
  };
  return res;
}

test("interviews router exists and has a POST route", () => {
  assert.ok(employerInterviewsRouter);
  const postRoute = employerInterviewsRouter.stack.find(
    (layer) => layer.route && layer.route.methods.post
  );
  assert.ok(postRoute, "POST route should be defined");
  assert.strictEqual(postRoute.route.path, "/");
});

test("POST /interviews requires application_id and scheduled_at", async () => {
  const postRoute = employerInterviewsRouter.stack.find(
    (layer) => layer.route && layer.route.methods.post
  );
  const handler = postRoute.route.stack[0].handle;

  const req = {
    body: {
      duration_minutes: 30
    },
    supabase: {},
    user: { id: "user-123" }
  };
  const res = createMockRes();

  await handler(req, res);
  
  assert.strictEqual(res.statusCode, 400);
  assert.strictEqual(res.body.error, "application_id and scheduled_at are required");
});
