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
      marketEvidence: buildMarketEvidence(jobs, cvSkills),
    };
  }

  const marketEvidence = buildMarketEvidence(jobs, cvSkills);
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
  const readinessScore = requiredSkills.length === 0
    ? 0
    : Math.round((matchedSkills.length / requiredSkills.length) * 100);
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

function buildMarketEvidence(jobs = [], cvSkills = []) {
  const skillDemand = {};
  const jobMatches = [];

  for (const [index, job] of jobs.entries()) {
    const requiredSkills = normaliseSkills(job.extractedSkills);
    for (const skill of requiredSkills) {
      skillDemand[skill] = (skillDemand[skill] || 0) + 1;
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
      matchScore: requiredSkills.length === 0
        ? null
        : Math.round((matchedSkills.length / requiredSkills.length) * 100),
    });
  }

  return {
    jobCount: jobs.length,
    skillDemand,
    jobMatches: sortJobMatches(jobMatches),
  };
}

function sortJobMatches(jobMatches) {
  return [...jobMatches].sort((a, b) => {
    const matchedDifference = b.matchedSkills.length - a.matchedSkills.length;
    if (matchedDifference !== 0) {
      return matchedDifference;
    }

    const scoreDifference = scoreValue(b.matchScore) - scoreValue(a.matchScore);
    if (scoreDifference !== 0) {
      return scoreDifference;
    }

    const missingDifference = a.missingSkills.length - b.missingSkills.length;
    if (missingDifference !== 0) {
      return missingDifference;
    }

    return a.title.localeCompare(b.title);
  });
}

function scoreValue(matchScore) {
  return typeof matchScore === "number" ? matchScore : -1;
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
