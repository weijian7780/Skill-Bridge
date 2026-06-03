import test from "node:test";
import assert from "node:assert/strict";
import { extractCertificateSkills } from "./certificateSkillExtractor.js";
import { buildCertificateSkillPrompt } from "./certificateSkillPrompt.js";

test("returns empty result when no Gemini API key is configured", async () => {
  const original = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const result = await extractCertificateSkills("AWS Certified Cloud Practitioner");
    assert.deepEqual(result, { title: "", skills: [] });
  } finally {
    if (original !== undefined) process.env.GEMINI_API_KEY = original;
  }
});

test("returns empty result for empty input", async () => {
  const result = await extractCertificateSkills("   ");
  assert.deepEqual(result, { title: "", skills: [] });
});

test("prompt asks for title and skills as JSON and truncates long text", () => {
  const prompt = buildCertificateSkillPrompt("x".repeat(20000));
  assert.match(prompt, /"title"/);
  assert.match(prompt, /"skills"/);
  assert.match(prompt, /JSON only/i);
  assert.ok(prompt.length < 9000); // certificate text capped at 8000 chars
});
