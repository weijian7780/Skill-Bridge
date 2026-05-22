import test from "node:test";
import assert from "node:assert/strict";

import { getSupabaseConfig } from "./supabaseConfig.js";

test("reports Supabase as not configured when project URL is missing", () => {
  const config = getSupabaseConfig({
    VITE_SUPABASE_PUBLISHABLE_KEY: "public-key",
  });

  assert.equal(config.configured, false);
  assert.equal(config.url, "");
  assert.equal(config.publishableKey, "");
  assert.match(config.reason, /VITE_SUPABASE_URL/);
});

test("reports Supabase as configured when project URL and publishable key exist", () => {
  const config = getSupabaseConfig({
    VITE_SUPABASE_URL: " https://skillbridge.supabase.co ",
    VITE_SUPABASE_PUBLISHABLE_KEY: " publishable-key ",
  });

  assert.equal(config.configured, true);
  assert.equal(config.url, "https://skillbridge.supabase.co");
  assert.equal(config.publishableKey, "publishable-key");
  assert.equal(config.reason, "");
});

test("accepts the older anon key environment variable name", () => {
  const config = getSupabaseConfig({
    VITE_SUPABASE_URL: "https://skillbridge.supabase.co",
    VITE_SUPABASE_ANON_KEY: "anon-key",
  });

  assert.equal(config.configured, true);
  assert.equal(config.publishableKey, "anon-key");
});
