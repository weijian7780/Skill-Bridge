import test from "node:test";
import assert from "node:assert/strict";

import { extractWithRules } from "./ruleBasedExtractor.js";

test("classifies Communication and Teamwork as soft skills only, never technical", () => {
  const cv = [
    "Technical Skills",
    "Python",
    "SQL",
    "Soft Skills",
    "Communication",
    "Teamwork",
  ].join("\n");

  const { technicalSkills, softSkills } = extractWithRules(cv);

  assert.ok(technicalSkills.includes("Python"));
  assert.ok(technicalSkills.includes("SQL"));
  assert.ok(!technicalSkills.includes("Communication"), "Communication must not be a technical skill");
  assert.ok(!technicalSkills.includes("Teamwork"), "Teamwork must not be a technical skill");
  assert.ok(softSkills.includes("Communication"));
  assert.ok(softSkills.includes("Teamwork"));
});

test("a skill never appears in both the technical and soft lists", () => {
  const cv = [
    "Technical Skills",
    "Python, Communication",
    "Soft Skills",
    "Communication, Teamwork",
  ].join("\n");

  const { technicalSkills, softSkills } = extractWithRules(cv);
  const overlap = technicalSkills.filter((s) => softSkills.includes(s));
  assert.deepEqual(overlap, []);
});

test("reads the skills the CV actually lists, not just a fixed keyword set", () => {
  // 'Kubernetes' and 'Apache Spark' are NOT in the keyword list, but they are
  // listed under Technical Skills, so a section-aware reader must find them.
  const cv = [
    "Technical Skills",
    "Kubernetes",
    "Apache Spark",
    "Terraform",
  ].join("\n");

  const { technicalSkills } = extractWithRules(cv);
  assert.ok(technicalSkills.includes("Kubernetes"));
  assert.ok(technicalSkills.includes("Apache Spark"));
  assert.ok(technicalSkills.includes("Terraform"));
});

test("does not pull coursework words into technical skills", () => {
  // Statistics / Machine Learning appear only in coursework, never under the
  // Technical Skills section, so they must not be reported as skills.
  const cv = [
    "Education",
    "Relevant coursework: Statistics, Machine Learning, Data Visualization.",
    "Technical Skills",
    "Python",
    "SQL",
    "Projects",
    "Built a dashboard.",
  ].join("\n");

  const { technicalSkills } = extractWithRules(cv);
  assert.deepEqual(technicalSkills, ["Python", "SQL"]);
  assert.ok(!technicalSkills.includes("Statistics"));
  assert.ok(!technicalSkills.includes("Machine Learning"));
});

test("handles a comma-separated skills section on one line", () => {
  const cv = [
    "Technical Skills",
    "Figma, Sketch, Adobe XD, HTML, CSS",
    "Soft Skills",
    "Stakeholder communication, empathy",
  ].join("\n");

  const { technicalSkills, softSkills } = extractWithRules(cv);
  assert.deepEqual(technicalSkills, ["Figma", "Sketch", "Adobe XD", "HTML", "CSS"]);
  assert.ok(softSkills.includes("Stakeholder communication"));
});

test("falls back to keyword matching when there is no Skills section", () => {
  // A heading-less one-liner: section reader finds nothing, so the keyword
  // scan must still surface the recognisable skills.
  const { technicalSkills, softSkills } = extractWithRules(
    "UMS Computer Science CV with Python, SQL, and Communication.",
  );

  assert.ok(technicalSkills.includes("Python"));
  assert.ok(technicalSkills.includes("SQL"));
  assert.ok(!technicalSkills.includes("Communication"));
  assert.ok(softSkills.includes("Communication"));
});

test("splits a single generic Skills section into technical and soft", () => {
  const cv = [
    "Skills",
    "Python, SQL, Communication, Teamwork",
  ].join("\n");

  const { technicalSkills, softSkills } = extractWithRules(cv);
  assert.ok(technicalSkills.includes("Python"));
  assert.ok(technicalSkills.includes("SQL"));
  assert.ok(!technicalSkills.includes("Communication"));
  assert.ok(softSkills.includes("Communication"));
  assert.ok(softSkills.includes("Teamwork"));
});

test("returns empty arrays for empty input without throwing", () => {
  const profile = extractWithRules("");
  assert.deepEqual(profile.technicalSkills, []);
  assert.deepEqual(profile.softSkills, []);
});
