import test from "node:test";
import assert from "node:assert/strict";

import { extractSkillProfile } from "./skillExtractionRouter.js";

test("falls back from missing Gemini directly to local rules", async () => {
  const originalGeminiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const profile = await extractSkillProfile("UMS Computer Science CV with Python, SQL, and Communication.");

    assert.equal(profile.provider, "Local rule fallback");
    assert.deepEqual(profile.warnings, ["Gemini API key not configured"]);
    assert.ok(profile.technicalSkills.includes("Python"));
    assert.ok(profile.technicalSkills.includes("SQL"));
  } finally {
    restoreEnv("GEMINI_API_KEY", originalGeminiKey);
  }
});

function restoreEnv(name, value) {
  if (value === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = value;
}
