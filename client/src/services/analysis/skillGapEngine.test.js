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
    provider: "Gemini",
      technicalSkills: ["Python", "SQL", "Excel"],
      softSkills: ["Communication"],
      confidence: 0.82,
    },
    jobs: [
      {
        title: "Junior Data Analyst",
        location: "Sabah, Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        title: "BI Analyst",
        location: "Sabah, Malaysia",
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
    provider: "Gemini",
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
        location: "Sabah, Malaysia",
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
    provider: "Gemini",
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
    provider: "Gemini",
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

test("keeps job listing metadata for company requirement cards", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "job-with-meta",
        title: "Data Analyst",
        company: "Blue Hiring Sdn Bhd",
        location: "Kuala Lumpur",
        salary: "RM 4,000 - RM 6,000",
        jobType: "Full-time",
        source: "Jooble",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.marketEvidence.jobMatches[0].salary, "RM 4,000 - RM 6,000");
  assert.equal(analysis.marketEvidence.jobMatches[0].jobType, "Full-time");
  assert.equal(analysis.marketEvidence.jobMatches[0].source, "Jooble");
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
    provider: "Gemini",
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
    provider: "Gemini",
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
    provider: "Gemini",
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

test("excludes company postings outside the selected target industry", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      industry: "finance",
      region: "Malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "finance-data-analyst",
        title: "Finance Data Analyst",
        company: "Bank Analytics",
        location: "Malaysia",
        description: "Build reporting for banking and financial operations.",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        id: "marketing-data-analyst",
        title: "Marketing Data Analyst",
        company: "Campaign Studio",
        location: "Malaysia",
        description: "Build campaign dashboards and social media performance reports.",
        extractedSkills: ["SQL", "Tableau"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.rawJobCount, 2);
  assert.equal(analysis.marketEvidence.excludedJobCount, 1);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.id),
    ["finance-data-analyst"],
  );
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
    provider: "Gemini",
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

test("shows missing UI/UX hard skills when the CV only matches Figma", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "UI/UX Designer",
      industry: "data-it",
      region: "all-malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.webp",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["Figma", "Adobe XD", "Sketch", "InVision", "Photoshop"],
      softSkills: [],
      certifications: [],
    },
    jobs: [
      {
        id: "two95-uiux",
        title: "Mid level and senior UI/UX Designer locals and expats available in Malaysia",
        company: "TWO95 International, Inc",
        location: "Malaysia",
        source: "Jooble",
        extractedSkills: [
          "Figma",
          "FigJam",
          "Miro",
          "Google Suite",
          "Slack",
          "UI/UX Principles",
          "UI/UX Guidelines",
          "UI/UX Best Practices",
        ],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 13);
  assert.deepEqual(analysis.matchedSkills, ["Figma"]);
  assert.deepEqual(analysis.missingSkills, [
    "FigJam",
    "Google Suite",
    "Miro",
    "Slack",
    "UI/UX Best Practices",
    "UI/UX Guidelines",
    "UI/UX Principles",
  ]);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].missingSkills, [
    "FigJam",
    "Miro",
    "Google Suite",
    "Slack",
    "UI/UX Principles",
    "UI/UX Guidelines",
    "UI/UX Best Practices",
  ]);
});

test("scores job gaps from structured hard skills and tools only", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Architect",
      region: "kuala-lumpur",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["Kafka"],
      softSkills: ["Communication"],
      certifications: ["TOGAF"],
    },
    jobs: [
      {
        id: "data-architect",
        title: "Data Architect",
        company: "Axiata",
        location: "Kuala Lumpur, Malaysia",
        extractedSkills: ["Legacy Snippet Skill", "Communication", "TOGAF"],
        requirements: {
          hardSkills: ["Data Governance"],
          tools: ["Kafka"],
          softSkills: ["Communication"],
          certifications: ["TOGAF"],
          partialRequirements: false,
        },
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.readinessScore, 50);
  assert.deepEqual(analysis.matchedSkills, ["Kafka"]);
  assert.deepEqual(analysis.missingSkills, ["Data Governance"]);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].requiredSkills, ["Data Governance", "Kafka"]);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].matchedSkills, ["Kafka"]);
  assert.deepEqual(analysis.marketEvidence.jobMatches[0].missingSkills, ["Data Governance"]);
});

test("keeps snippet-only job requirements as partial market evidence", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "UI/UX Designer",
      region: "all-malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.webp",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["Figma"],
    },
    jobs: [
      {
        id: "snippet-only-uiux",
        title: "UI/UX Designer",
        company: "TWO95 International, Inc",
        location: "Malaysia",
        requirements: {
          hardSkills: ["UI/UX Best Practices"],
          tools: ["Figma", "Miro"],
          partialRequirements: true,
        },
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.partialJobCount, 1);
  assert.equal(analysis.marketEvidence.jobMatches[0].partialRequirements, true);
  assert.equal(analysis.marketEvidence.jobMatches[0].matchLabel, "partial match");
  assert.deepEqual(analysis.matchedSkills, ["Figma"]);
  assert.deepEqual(analysis.missingSkills, ["Miro", "UI/UX Best Practices"]);
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
    provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs,
  });
  const changedCvAnalysis = buildSkillGapAnalysis({
    careerTarget,
    cvDocument,
    skillProfile: {
    provider: "Gemini",
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
    provider: "Gemini",
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

test("excludes stale company matches outside the selected target region", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "kuala-lumpur",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "old-penang-result",
        title: "Data Analyst",
        company: "TWO95 International",
        location: "Penang, Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        id: "current-kl-result",
        title: "Data Analyst",
        company: "KL Analytics",
        location: "Kuala Lumpur, Malaysia",
        extractedSkills: ["SQL", "Tableau"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.excludedJobCount, 1);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.company),
    ["KL Analytics"],
  );
  assert.deepEqual(analysis.missingSkills, ["Tableau"]);
});

test("keeps Malaysia-wide provider jobs for state targets when the provider has country-level location precision", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "penang",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "provider-country-level-result",
        title: "Data Analyst",
        company: "Malaysia-wide Analytics",
        location: "Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
      {
        id: "explicit-other-state-result",
        title: "Data Analyst",
        company: "KL Analytics",
        location: "Kuala Lumpur, Malaysia",
        extractedSkills: ["SQL", "Tableau"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.excludedJobCount, 1);
  assert.deepEqual(
    analysis.marketEvidence.jobMatches.map((job) => job.company),
    ["Malaysia-wide Analytics"],
  );
  assert.deepEqual(analysis.missingSkills, ["Power BI"]);
});

test("keeps Malaysia-wide provider jobs for remote targets when remote precision is unavailable", () => {
  const analysis = buildSkillGapAnalysis({
    careerTarget: {
      role: "Data Analyst",
      region: "remote-malaysia",
    },
    cvDocument: {
      fileName: "latest-cv.pdf",
    },
    skillProfile: {
      provider: "Gemini",
      technicalSkills: ["SQL"],
    },
    jobs: [
      {
        id: "provider-country-level-result",
        title: "Data Analyst",
        company: "Malaysia-wide Analytics",
        location: "Malaysia",
        extractedSkills: ["SQL", "Power BI"],
      },
    ],
  });

  assert.equal(analysis.status, "ready");
  assert.equal(analysis.marketEvidence.jobCount, 1);
  assert.equal(analysis.marketEvidence.jobMatches[0].company, "Malaysia-wide Analytics");
});
