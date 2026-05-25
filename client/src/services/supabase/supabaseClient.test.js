import test from "node:test";
import assert from "node:assert/strict";

import { createSupabaseConnection } from "./supabaseClient.js";

test("does not create a Supabase client when configuration is missing", () => {
  const result = createSupabaseConnection({
    env: {},
    createClient: () => {
      throw new Error("createClient should not be called");
    },
  });

  assert.equal(result.configured, false);
  assert.equal(result.client, null);
  assert.match(result.reason, /VITE_SUPABASE_URL/);
});

test("creates a Supabase REST client with the configured project URL and key", async () => {
  const calls = [];
  const result = createSupabaseConnection({
    env: {
      VITE_SUPABASE_URL: "https://skillbridge.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    },
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 201,
        async json() {
          return [{ user_id: "user-123" }];
        },
      };
    },
  });

  assert.equal(result.configured, true);
  const response = await result.client.upsert(
    "student_profile_snapshots",
    { user_id: "user-123" },
    { onConflict: "user_id" },
  );

  assert.equal(calls[0].url, "https://skillbridge.supabase.co/rest/v1/student_profile_snapshots?on_conflict=user_id");
  assert.equal(calls[0].options.method, "POST");
  assert.equal(calls[0].options.headers.apikey, "publishable-key");
  assert.equal(calls[0].options.headers.Authorization, undefined);
  assert.equal(calls[0].options.headers.Prefer, "resolution=merge-duplicates,return=representation");
  assert.equal(calls[0].options.body, JSON.stringify({ user_id: "user-123" }));
  assert.deepEqual(response, {
    data: { user_id: "user-123" },
    error: null,
  });
});

test("uses an access token for authenticated Supabase REST requests", async () => {
  const calls = [];
  const result = createSupabaseConnection({
    env: {
      VITE_SUPABASE_URL: "https://skillbridge.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    },
    accessToken: "user-jwt",
    fetchImpl: async (url, options) => {
      calls.push({ url, options });
      return {
        ok: true,
        status: 200,
        async json() {
          return [];
        },
      };
    },
  });

  await result.client.select("student_profile_snapshots", { eq: { user_id: "user-123" } });

  assert.equal(calls[0].options.headers.Authorization, "Bearer user-jwt");
  assert.equal(calls[0].url, "https://skillbridge.supabase.co/rest/v1/student_profile_snapshots?user_id=eq.user-123");
});

test("marks rejected Supabase REST requests as auth errors", async () => {
  const result = createSupabaseConnection({
    env: {
      VITE_SUPABASE_URL: "https://skillbridge.supabase.co",
      VITE_SUPABASE_PUBLISHABLE_KEY: "publishable-key",
    },
    accessToken: "expired-jwt",
    fetchImpl: async () => ({
      ok: false,
      status: 401,
      async json() {
        return { message: "JWT expired" };
      },
    }),
  });

  const response = await result.client.upsert(
    "student_profile_snapshots",
    { user_id: "user-123" },
    { onConflict: "user_id" },
  );

  assert.equal(response.error.status, 401);
  assert.equal(response.error.isAuthError, true);
  assert.equal(response.error.message, "JWT expired");
});
