import test from "node:test";
import assert from "node:assert/strict";
import { matchCertSkillsToGaps } from "./certificateSkillMatch.js";

test("splits certificate skills into gap-closing and extra skills", () => {
  const result = matchCertSkillsToGaps({
    certSkills: ["Python", "SQL", "Teamwork"],
    missingSkills: ["SQL", "Power BI"],
  });
  assert.deepEqual(result.closesGaps, ["SQL"]);
  assert.deepEqual(result.otherSkills, ["Python", "Teamwork"]);
});

test("matching ignores case and punctuation, returns the gap's display form", () => {
  const result = matchCertSkillsToGaps({
    certSkills: ["power bi", "ui/ux"],
    missingSkills: ["Power BI", "UI/UX Principles"],
  });
  assert.deepEqual(result.closesGaps, ["Power BI"]);
  assert.deepEqual(result.otherSkills, ["ui/ux"]);
});

test("de-duplicates repeated certificate skills", () => {
  const result = matchCertSkillsToGaps({
    certSkills: ["SQL", "sql", "SQL "],
    missingSkills: ["SQL"],
  });
  assert.deepEqual(result.closesGaps, ["SQL"]);
  assert.deepEqual(result.otherSkills, []);
});

test("handles empty inputs safely", () => {
  assert.deepEqual(matchCertSkillsToGaps(), { closesGaps: [], otherSkills: [] });
  assert.deepEqual(matchCertSkillsToGaps({ certSkills: ["Python"], missingSkills: [] }), {
    closesGaps: [],
    otherSkills: ["Python"],
  });
});
