import test from "node:test";
import assert from "node:assert/strict";

import { buildSkillGapAnalysis } from "./skillGapEngine.js";

test("compares confirmed CV skills against live market job skills", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Python", "SQL", "Excel"],
      softSkills: ["Communication"],
      confidence: 0.82,
    },
    jobs: [
      {
        title: "Junior Data Analyst",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        title: "BI Analyst",
        extractedSkills: ["Power BI", "Tableau"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 25);
  assert.deepEqual(analysis.matchedSkills, ["SQL"]);
  assert.deepEqual(analysis.missingSkills, ["Power BI", "Tableau"]);
  assert.equal(analysis.prioritySkill, "Power BI");
  assert.match(analysis.recommendation, /Power BI/);
  assert.equal(analysis.marketEvidence.jobCount, 2);
  assert.equal(analysis.marketEvidence.skillDemand["Power BI"], 2);
});

test("requires live market jobs before calculating the skill gap", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Python", "SQL", "Excel"],
    },
    jobs: [],
  });

  assert.equal(analysis.status, "needs_market");
  assert.equal(analysis.readinessScore, 0);
  assert.deepEqual(analysis.matchedSkills, []);
  assert.deepEqual(analysis.missingSkills, []);
  assert.match(analysis.recommendation, /Live job-market results/);
});

test("requires a confirmed latest CV before analysis is ready", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Sabah, Malaysia",
    },
    cvDocument: null,
    skillProfile: {
      provider: "Not extracted yet",
      technicalSkills: [],
    },
    jobs: [
      {
        title: "Junior Data Analyst",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "needs_cv");
  assert.equal(analysis.readinessScore, 0);
  assert.deepEqual(analysis.matchedSkills, []);
  assert.deepEqual(analysis.missingSkills, []);
  assert.match(analysis.recommendation, /Upload and confirm/);
  assert.equal(analysis.marketEvidence.jobCount, 1);
});

test("matches equivalent CV and market skill names", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Data Analysis", "PowerBI"],
    },
    jobs: [
      {
        title: "Business Intelligence Analyst",
        extractedSkills: ["Data Analytics", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 100);
  assert.deepEqual(analysis.matchedSkills, ["Data Analytics", "Power BI"]);
  assert.deepEqual(analysis.missingSkills, []);
});

test("keeps per-company job requirement matches as market evidence", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL", "Data Analysis"],
    },
    jobs: [
      {
        id: "job-1",
        title: "BI Analyst",
        company: "TWO95 International",
        location: "Malaysia",
        url: "https://example.test/job-1",
        extractedSkills: ["SQL", "Power BI", "Data Analytics"],
      },
      {
        id: "job-2",
        title: "Report Analyst",
        company: "ResMed",
        location: "Kuala Lumpur",
        extractedSkills: ["Reporting", "Data Warehouse"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.deepEqual(analysis.marketEvidence.jobMatches[0], {
    id: "job-1",
    title: "BI Analyst",
    company: "TWO95 International",
    location: "Malaysia",
    url: "https://example.test/job-1",
    source: "",
    requiredSkills: ["SQL", "Power BI", "Data Analytics"],
    matchedSkills: ["SQL", "Data Analytics"],
    missingSkills: ["Power BI"],
    matchScore: 67,
  });
  assert.deepEqual(analysis.marketEvidence.jobMatches[1].matchedSkills, []);
  assert.deepEqual(analysis.marketEvidence.jobMatches[1].missingSkills, ["Reporting", "Data Warehouse"]);
});

test("does not score a company match when no job requirements are detected", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "job-without-skills",
        title: "Senior Business Analyst - Trading System",
        company: "Zeal Group",
        location: "Malaysia",
        source: "Jooble",
        extractedSkills: [],
      },
    ],
  });

  assert.deepEqual(analysis.marketEvidence.jobMatches, []);
});

test("counts only relevant job postings with detected company requirements", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "relevant",
        title: "Data Analyst",
        company: "Relevant Sdn Bhd",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        id: "irrelevant-empty",
        title: "Data Analyst",
        company: "No Requirement Sdn Bhd",
        extractedSkills: [],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.rawJobCount, 2);
  assert.equal(analysis.marketEvidence.jobCount, 1);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.id),
    ["relevant"],
  );
  assert.equal(analysis.marketEvidence.skillDemand["SQL"], 1);
});

test("excludes company postings that do not match the current career target role", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Figma", "SQL"],
    },
    jobs: [
      {
        id: "ui-ux-designer",
        title: "UI UX Designer",
        company: "Design Studio",
        location: "Malaysia",
        extractedSkills: ["Figma"],
      },
      {
        id: "data-analyst",
        title: "Junior Data Analyst",
        company: "Analytics Sdn Bhd",
        location: "Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.rawJobCount, 2);
  assert.equal(analysis.marketEvidence.excludedJobCount, 1);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.id),
    ["data-analyst"],
  );
  assert.deepEqual(analysis.matchedSkills, ["SQL"]);
  assert.deepEqual(analysis.missingSkills, ["Power BI"]);
});

test("uses the same resume skills against a different career target to find different related companies", () => {
  const uiUxAnalysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "UI UX Designer",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["Figma", "SQL"],
    },
    jobs: [
      {
        id: "ui-ux-designer",
        title: "UI UX Designer",
        company: "Design Studio",
        location: "Malaysia",
        extractedSkills: ["Figma"],
      },
      {
        id: "data-analyst",
        title: "Junior Data Analyst",
        company: "Analytics Sdn Bhd",
        location: "Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(uiUxAnalysis.status, "ready");
  assert.deepEqual(
    uiUxAnalysis.marketEvidence.jobMatches.map((job) => job.id),
    ["ui-ux-designer"],
  );
  assert.deepEqual(uiUxAnalysis.matchedSkills, ["Figma"]);
  assert.deepEqual(uiUxAnalysis.missingSkills, []);
});

test("recalculates market gaps when the confirmed resume skills change", () => {
  const careerTarget = {
    role: "Data Analyst",
    region: "Malaysia",
  };
  const cvDocument = {
    fileName: "latest-cv.pdf",
  };
  const jobs = [
    {
      id: "data-analyst",
      title: "Data Analyst",
      company: "Analytics Sdn Bhd",
      location: "Malaysia",
      extractedSkills: ["SQL", "Power BI", "Excel"],
    },
  ];

  const firstAnalysis = buildSkillGapAnalysis({
    careerTarget,
    cvDocument,
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL"],
    },
    jobs,
  });
  const changedCvAnalysis = buildSkillGapAnalysis({
    careerTarget,
    cvDocument,
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL", "Power BI", "Excel"],
    },
    jobs,
  });

  assert.deepEqual(firstAnalysis.matchedSkills, ["SQL"]);
  assert.deepEqual(firstAnalysis.missingSkills, ["Excel", "Power BI"]);
  assert.equal(firstAnalysis.readinessScore, 33);
  assert.deepEqual(changedCvAnalysis.matchedSkills, ["SQL", "Power BI", "Excel"]);
  assert.deepEqual(changedCvAnalysis.missingSkills, []);
  assert.equal(changedCvAnalysis.readinessScore, 100);
});

test("ranks relevant company requirements by job match percentage then matched skill count", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini 2.5 Flash",
      technicalSkills: ["SQL", "Excel", "Python", "Data Analytics"],
    },
    jobs: [
      {
        id: "wide-lower-score",
        title: "Data Analyst",
        company: "Wide Analytics",
        location: "Selangor",
        extractedSkills: ["SQL", "Excel", "Python", "Power BI", "Tableau"],
      },
      {
        id: "perfect-small",
        title: "Junior Data Analyst",
        company: "Exact BI",
        location: "Kuala Lumpur",
        extractedSkills: ["SQL", "Excel"],
      },
      {
        id: "perfect-large",
        title: "Business Intelligence Analyst",
        company: "Exact Analytics",
        location: "Penang",
        extractedSkills: ["SQL", "Excel", "Python"],
      },
      {
        id: "zero-match",
        title: "Data Analyst",
        company: "Gap Analytics",
        location: "Johor",
        extractedSkills: ["AWS", "Azure"],
      },
      {
        id: "empty-skills",
        title: "Data Analyst",
        company: "No Skills Sdn Bhd",
        location: "Sabah",
        extractedSkills: [],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 65);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.id),
    ["perfect-large", "perfect-small", "wide-lower-score", "zero-match"],
  );
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].matchedSkills, ["SQL", "Excel", "Python"]);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].missingSkills, []);
  assert.equal(analysis.marketEvidence.jobMatches[0].matchScore, 100);
  assert.equal(analysis.marketEvidence.jobMatches[3].matchScore, 0);
});
