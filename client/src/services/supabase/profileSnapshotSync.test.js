import assert from "node:assert/strict";
import test from "node:test";
import { resolveProfileSaveIntent } from "./profileSnapshotSync.js";

test("skips the first profile save immediately after Supabase profile load", () => {
  const intent = resolveProfileSaveIntent({
    userId: "student-1",
    supabaseConfigured: true,
    loadedProfileFor: "student-1",
    skipProfileSaveFor: "student-1",
  });

  assert.equal(intent.shouldSave, false);
  assert.equal(intent.nextSkipProfileSaveFor, "");
});

test("allows profile save after the loaded profile has already been marked clean", () => {
  const intent = resolveProfileSaveIntent({
    userId: "student-1",
    supabaseConfigured: true,
    loadedProfileFor: "student-1",
    skipProfileSaveFor: "",
  });

  assert.equal(intent.shouldSave, true);
  assert.equal(intent.nextSkipProfileSaveFor, "");
});

test("does not save profile snapshots before a user profile is loaded", () => {
  const intent = resolveProfileSaveIntent({
    userId: "student-1",
    supabaseConfigured: true,
    loadedProfileFor: "",
    skipProfileSaveFor: "",
  });

  assert.equal(intent.shouldSave, false);
});
