import { getRegionOption } from "../career/regionOptions.js";
import { jobMatchesIndustry } from "../career/industryOptions.js";

export function buildSkillGapAnalysis({ careerTarget, cvDocument, skillProfile, jobs = [] }) {
  const cvSkills = normaliseSkills([
    ...(skillProfile?.technicalSkills ?? []),
    ...(skillProfile?.softSkills ?? []),
    ...(skillProfile?.certifications ?? []),
  ]);

  if (!cvDocument || cvSkills.length === 0 || skillProfile?.provider === "Not extracted yet") {
    return {
      status: "needs_cv",
      readinessScore: 0,
      matchedSkills: [],
      missingSkills: [],
      prioritySkill: "",
      recommendation: "Upload and confirm your latest CV before running skill-gap analysis.",
      marketEvidence: buildMarketEvidence(jobs, cvSkills, careerTarget),
    };
  }

  const marketEvidence = buildMarketEvidence(jobs, cvSkills, careerTarget);
  const requiredSkills = Object.keys(marketEvidence.skillDemand);

  if (requiredSkills.length === 0) {
    return {
      status: "needs_market",
      readinessScore: 0,
      matchedSkills: [],
      missingSkills: [],
      prioritySkill: "",
      recommendation: `Live job-market results are required before comparing your CV against the ${careerTarget?.role || "target role"} market.`,
      marketEvidence,
    };
  }

  const matchedSkills = requiredSkills.filter((skill) => hasSkill(cvSkills, skill));
  const missingSkills = sortMissingSkillsByDemand(
    requiredSkills.filter((skill) => !hasSkill(cvSkills, skill)),
    marketEvidence.skillDemand,
  );
  const readinessScore = averageTopMatchScores(marketEvidence.jobMatches);
  const prioritySkill = missingSkills[0] || "";

  return {
    status: "ready",
    readinessScore,
    matchedSkills,
    missingSkills,
    prioritySkill,
    recommendation: buildRecommendation({ careerTarget, prioritySkill, marketEvidence }),
    marketEvidence,
  };
}

function buildMarketEvidence(jobs = [], cvSkills = [], careerTarget = {}) {
  const skillDemand = {};
  const jobMatches = [];
  let excludedJobCount = 0;
  let partialJobCount = 0;

  for (const [index, job] of jobs.entries()) {
    const requiredSkills = normaliseSkills(getScoredJobRequirementSkills(job));
    if (requiredSkills.length === 0) {
      continue;
    }

    if (!isRelevantJobPosting(job, careerTarget)) {
      excludedJobCount += 1;
      continue;
    }

    for (const skill of requiredSkills) {
      skillDemand[skill] = (skillDemand[skill] || 0) + 1;
    }

    const partialRequirements = Boolean(job.requirements?.partialRequirements);
    if (partialRequirements) {
      partialJobCount += 1;
    }

    const matchedSkills = requiredSkills.filter((skill) => hasSkill(cvSkills, skill));
    const missingSkills = requiredSkills.filter((skill) => !hasSkill(cvSkills, skill));

    jobMatches.push({
      id: String(job.id || job.url || `${job.title || "job"}-${job.company || "company"}-${index}`),
      title: job.title || "Untitled role",
      company: job.company || "Unknown company",
      location: job.location || "Malaysia",
      url: job.url || "",
      source: job.source || "",
      requiredSkills,
      matchedSkills,
      missingSkills,
      matchScore: Math.round((matchedSkills.length / requiredSkills.length) * 100),
      ...(partialRequirements ? { partialRequirements: true, matchLabel: "partial match" } : {}),
    });
  }

  return {
    rawJobCount: jobs.length,
    jobCount: jobMatches.length,
    excludedJobCount,
    partialJobCount,
    skillDemand,
    jobMatches: sortJobMatches(jobMatches),
  };
}

function getScoredJobRequirementSkills(job) {
  const structuredSkills = [
    ...(job?.requirements?.hardSkills ?? []),
    ...(job?.requirements?.tools ?? []),
  ];

  return structuredSkills.length > 0 ? structuredSkills : job.extractedSkills;
}

function isRelevantJobPosting(job, careerTarget = {}) {
  if (!isRelevantLocation(job, careerTarget)) {
    return false;
  }

  if (!isRelevantIndustry(job, careerTarget)) {
    return false;
  }

  const role = normalizeText(careerTarget.role);
  const text = normalizeText(`${job.title || ""} ${job.description || ""}`);
  if (!role) {
    return true;
  }

  if (!text) {
    return false;
  }

  if (text.includes(role)) {
    return true;
  }

  if (isUiUxRole(role)) {
    return containsAny(text, ["ui ux", "ui/ux", "user interface", "user experience", "product designer", "designer"]);
  }

  if (role.includes("data") && role.includes("analyst")) {
    return containsAny(text, [
      "data analyst",
      "business intelligence",
      "bi analyst",
      "report analyst",
      "reporting analyst",
      "analytics analyst",
      "analyst",
    ]) && containsAny(text, ["data", "analytics", "business intelligence", "bi", "report"]);
  }

  if (role.includes("business intelligence") || role === "bi" || role.includes(" bi ")) {
    return containsAny(text, ["business intelligence", "bi analyst", "dashboard", "reporting", "data warehouse"]);
  }

  const roleTokens = meaningfulRoleTokens(role);
  return roleTokens.length === 0 || roleTokens.every((token) => text.includes(token));
}

function isRelevantIndustry(job, careerTarget = {}) {
  if (!careerTarget.industry) {
    return true;
  }

  return jobMatchesIndustry(job, careerTarget.industry);
}

function isRelevantLocation(job, careerTarget = {}) {
  const region = getRegionOption(careerTarget.region);
  if (region.id === "all-malaysia") {
    return true;
  }

  const location = normalizeText(job.location);
  if (!location) {
    return false;
  }

  if (region.id === "remote-malaysia") {
    return containsAny(location, ["remote", "hybrid"]);
  }

  return containsAny(location, [
    region.label,
    region.searchValue,
    region.searchValue.replace(/,\s*Malaysia/i, ""),
  ]);
}

function isUiUxRole(role) {
  return role.includes("ui") || role.includes("ux") || role.includes("designer") || role.includes("user interface") || role.includes("user experience");
}

function meaningfulRoleTokens(role) {
  const stopWords = new Set([
    "junior",
    "senior",
    "intern",
    "internship",
    "entry",
    "level",
    "trainee",
    "assistant",
  ]);

  return role
    .split(" ")
    .map((token) => token.trim())
    .filter((token) => token.length > 1 && !stopWords.has(token));
}

function containsAny(text, fragments) {
  return fragments.some((fragment) => text.includes(normalizeText(fragment)));
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sortJobMatches(jobMatches) {
  return [...jobMatches].sort((a, b) => {
    const scoreDifference = b.matchScore - a.matchScore;
    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const matchedDifference = b.matchedSkills.length - a.matchedSkills.length;
    if (matchedDifference !== 0) {
      return matchedDifference;
    }

    const requirementDifference = b.requiredSkills.length - a.requiredSkills.length;
    if (requirementDifference !== 0) {
      return requirementDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

function averageTopMatchScores(jobMatches) {
  const topMatches = jobMatches.slice(0, 5);
  if (topMatches.length === 0) {
    return 0;
  }

  const totalScore = topMatches.reduce((sum, job) => sum + job.matchScore, 0);
  return Math.round(totalScore / topMatches.length);
}

function sortMissingSkillsByDemand(skills, skillDemand) {
  return [...skills].sort((a, b) => {
    const demandDifference = (skillDemand[b] || 0) - (skillDemand[a] || 0);
    return demandDifference !== 0 ? demandDifference : a.localeCompare(b);
  });
}

function buildRecommendation({ careerTarget, prioritySkill, marketEvidence }) {
  if (!prioritySkill) {
    return `Your confirmed CV already covers the skills found in the current job-market results for ${careerTarget?.role || "your target role"}.`;
  }

  const demandCount = marketEvidence.skillDemand[prioritySkill] || 0;
  if (demandCount > 0) {
    return `Focus on ${prioritySkill} first because it appears in ${demandCount} matching ${pluralise("job post", demandCount)} for ${careerTarget?.role || "your target role"}.`;
  }

  return `Focus on ${prioritySkill} first because it is missing from your CV but present in the current job-market results.`;
}

function hasSkill(cvSkills, requiredSkill) {
  const required = requiredSkill.toLowerCase();
  return cvSkills.some((skill) => skill.toLowerCase() === required);
}

function normaliseSkills(skills = []) {
  return unique(
    skills
      .map((skill) => String(skill || "").trim())
      .filter(Boolean)
      .map(toDisplaySkill),
  );
}

function toDisplaySkill(skill) {
  const canonical = {
    analytics: "Data Analytics",
    "data analysis": "Data Analytics",
    "data analytics": "Data Analytics",
    powerbi: "Power BI",
    "power bi": "Power BI",
    sql: "SQL",
    python: "Python",
    excel: "Excel",
    tableau: "Tableau",
    "business intelligence": "Business Intelligence",
    dashboard: "Dashboards",
    dashboards: "Dashboards",
    report: "Reporting",
    reports: "Reporting",
    reporting: "Reporting",
    "data warehouse": "Data Warehouse",
    "data warehousing": "Data Warehouse",
    edw: "Data Warehouse",
    aws: "AWS",
    "amazon web services": "AWS",
    azure: "Azure",
    "microsoft azure": "Azure",
    figma: "Figma",
    figjam: "FigJam",
    "fig jam": "FigJam",
    miro: "Miro",
    "google suite": "Google Suite",
    "google workspace": "Google Suite",
    "g suite": "Google Suite",
    slack: "Slack",
    "ui/ux principles": "UI/UX Principles",
    "ui ux principles": "UI/UX Principles",
    "ux principles": "UI/UX Principles",
    "ui/ux guidelines": "UI/UX Guidelines",
    "ui ux guidelines": "UI/UX Guidelines",
    "ux guidelines": "UI/UX Guidelines",
    "ui/ux best practices": "UI/UX Best Practices",
    "ui ux best practices": "UI/UX Best Practices",
    "ux best practices": "UI/UX Best Practices",
  };
  return canonical[skill.toLowerCase()] || skill;
}

function unique(items) {
  const seen = new Set();
  return items.filter((item) => {
    const key = item.toLowerCase();
    if (seen.has(key)) {
      return false;
    }
    seen.add(key);
    return true;
  });
}

function pluralise(label, count) {
  return count === 1 ? label : `${label}s`;
}
