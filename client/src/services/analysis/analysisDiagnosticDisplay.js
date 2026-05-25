import { getRegionAnalysisCopy, getRegionOption } from "../career/regionOptions.js";

export const DEFAULT_SKILL_EVIDENCE_LIMIT = 5;

export function buildDiagnosticScoreDisplay({ analysis, careerTarget }) {
  const topMatchCount = Math.min(analysis?.marketEvidence?.jobMatches?.length ?? 0, 5);
  const role = careerTarget?.role || "target role";
  const region = careerTarget?.region ? getRegionAnalysisCopy(careerTarget.region) : "in your selected location";
  const regionLabel = careerTarget?.region ? getRegionOption(careerTarget.region).label : "selected market";
  const jobCount = analysis?.marketEvidence?.jobCount ?? analysis?.marketEvidence?.jobMatches?.length ?? 0;
  const rawJobCount = analysis?.marketEvidence?.rawJobCount ?? 0;
  const excludedJobCount = analysis?.marketEvidence?.excludedJobCount ?? 0;

  if (analysis?.status === "ready") {
    const partialJobCount = analysis?.marketEvidence?.partialJobCount ?? 0;
    const diagnosis = buildMarketDiagnosis({
      role,
      region,
      jobCount,
      readinessScore: analysis.readinessScore ?? 0,
      matchedSkills: analysis.matchedSkills ?? [],
      missingSkills: analysis.missingSkills ?? [],
      skillDemand: analysis.marketEvidence?.skillDemand ?? {},
    });

    return {
      label: `${role} match`,
      value: `${analysis.readinessScore ?? 0}%`,
      isCalculated: true,
      formula: partialJobCount > 0
        ? `Average partial match across the top ${topMatchCount} company requirement ${topMatchCount === 1 ? "match" : "matches"} because ${partialJobCount} ${partialJobCount === 1 ? "job only exposed a short requirement snippet" : "jobs only exposed short requirement snippets"}.`
        : `Average match across the top ${topMatchCount} company requirement ${topMatchCount === 1 ? "match" : "matches"}.`,
      ...diagnosis,
    };
  }

  if (analysis?.status === "needs_cv") {
    return {
      label: `${role} match`,
      value: "Pending",
      isCalculated: false,
      formula: "Waiting for a confirmed latest CV before score is calculated.",
      diagnosisTitle: "What the market is telling you",
      diagnosisHeadline: "Confirm your latest CV first so SkillBridge can compare real resume skills with company requirements.",
      diagnosisFacts: [
        { label: "Evidence needed", value: "Latest CV skills are not confirmed yet." },
        { label: "Next comparison", value: `${role} jobs ${region} will be compared after upload.` },
      ],
      priorityInterpretation: "Upload and confirm your latest CV before reading market-fit results.",
    };
  }

  if (analysis?.status === "needs_market" && rawJobCount > 0 && jobCount === 0 && excludedJobCount > 0) {
    return {
      label: `${role} match`,
      value: "No local match",
      isCalculated: false,
      formula: `Loaded ${rawJobCount} provider ${pluralise("job", rawJobCount)}, but 0 matched ${role} in ${regionLabel}.`,
      diagnosisTitle: "What the market is telling you",
      diagnosisHeadline: `The job provider returned results, but none matched ${role} in ${regionLabel} after filtering.`,
      diagnosisFacts: [
        { label: "Provider results loaded", value: `${rawJobCount} ${pluralise("job", rawJobCount)} returned.` },
        { label: "Used for scoring", value: "0 jobs matched the selected target." },
        { label: "Filtered out", value: `${excludedJobCount} ${pluralise("job", excludedJobCount)} looked unrelated to the selected role, region, or industry.` },
        { label: "Current target", value: `${role} in ${regionLabel}.` },
      ],
      priorityInterpretation: "Try All Malaysia, another nearby region, or a broader target role before building a roadmap.",
    };
  }

  if (analysis?.status === "needs_market" && rawJobCount > 0 && jobCount === 0) {
    return {
      label: `${role} match`,
      value: "No requirements",
      isCalculated: false,
      formula: `Loaded ${rawJobCount} provider ${pluralise("job", rawJobCount)}, but no hard skills or tools were detected for scoring.`,
      diagnosisTitle: "What the market is telling you",
      diagnosisHeadline: `SkillBridge loaded ${role} jobs ${region}, but could not detect usable hard skills or tools from those posts.`,
      diagnosisFacts: [
        { label: "Provider results loaded", value: `${rawJobCount} ${pluralise("job", rawJobCount)} returned.` },
        { label: "Used for scoring", value: "0 jobs exposed usable hard skills or tools." },
      ],
      priorityInterpretation: "Try a broader target role, reload jobs, or use All Malaysia to find posts with clearer requirement text.",
    };
  }

  return {
    label: `${role} match`,
    value: "Pending",
    isCalculated: false,
    formula: "Waiting for live job requirements before score is calculated.",
    diagnosisTitle: "What the market is telling you",
    diagnosisHeadline: `Waiting for ${role} jobs ${region} before SkillBridge can read company demand.`,
    diagnosisFacts: [
      { label: "Evidence needed", value: "Market job requirements have not loaded yet." },
      { label: "Comparison target", value: `${role} jobs ${region}.` },
    ],
    priorityInterpretation: "Load market jobs before reading priority gaps or company requirement matches.",
  };
}

function buildMarketDiagnosis({
  role,
  region,
  jobCount,
  readinessScore,
  matchedSkills,
  missingSkills,
  skillDemand,
}) {
  const demandedSkills = Object.entries(skillDemand)
    .map(([skill, count]) => ({ skill, count }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill));
  const repeatedSkills = demandedSkills.filter(({ count }) => count > 1);
  const repeatedDemand = (repeatedSkills.length > 0 ? repeatedSkills : demandedSkills).slice(0, 3);
  const primaryGap = missingSkills
    .map((skill) => ({ skill, count: skillDemand[skill] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))[0];
  const nextRepeatedGaps = missingSkills
    .filter((skill) => skill !== primaryGap?.skill && (skillDemand[skill] ?? 0) > 1)
    .map((skill) => ({ skill, count: skillDemand[skill] ?? 0 }))
    .sort((a, b) => b.count - a.count || a.skill.localeCompare(b.skill))
    .slice(0, 2);
  const matchedSkill = matchedSkills[0];
  const matchedCount = matchedSkill ? skillDemand[matchedSkill] ?? 0 : 0;
  const strongestSignal = demandedSkills[0];
  const repeatedDemandNames = formatList(repeatedDemand.map(({ skill }) => skill));
  const matchQuality = readinessScore < 50 ? "low" : "stronger";
  const roleFamily = role.toLowerCase().includes("analyst") ? "analyst" : role.toLowerCase();

  return {
    diagnosisTitle: "What the market is telling you",
    diagnosisHeadline: repeatedDemandNames
      ? `${role} jobs ${region} are repeatedly asking for ${repeatedDemandNames}. Your CV currently ${matchedSkill ? `only overlaps with ${formatList(matchedSkills)}` : "does not overlap with the detected market requirements"}, so your market match is ${matchQuality}.`
      : `${role} jobs ${region} have loaded, but SkillBridge has not detected repeated requirements yet.`,
    diagnosisFacts: [
      {
        label: "Strongest hiring signal",
        value: strongestSignal
          ? `${strongestSignal.skill} appears in ${strongestSignal.count} of ${jobCount} ${jobCount === 1 ? "job" : "jobs"}.`
          : "No repeated hiring signal detected yet.",
      },
      {
        label: "Repeated company demand",
        value: formatRepeatedDemand(nextRepeatedGaps.length > 0 ? nextRepeatedGaps : repeatedDemand.slice(1)),
      },
      {
        label: "Your current overlap",
        value: matchedSkill
          ? `Your CV matched ${formatList(matchedSkills)} from ${matchedCount} company ${matchedCount === 1 ? "requirement" : "requirements"}.`
          : "Your CV did not match any detected company requirements yet.",
      },
      {
        label: "Main weakness",
        value: missingSkills.length > 0
          ? `Your CV does not show the repeated ${roleFamily} skills companies are asking for.`
          : "Your CV covers all detected repeated company requirements.",
      },
    ],
    priorityInterpretation: primaryGap
      ? `${primaryGap.skill} should be learned first because it appears most often across the selected job posts.${nextRepeatedGaps.length > 0 ? ` ${formatList(nextRepeatedGaps.map(({ skill }) => skill))} ${nextRepeatedGaps.length === 1 ? "comes" : "come"} next because ${nextRepeatedGaps.length === 1 ? "it appears" : "they appear"} across multiple company requirements.` : ""}`
      : "No priority gap is available because no missing market skill was detected.",
  };
}

function formatRepeatedDemand(skills) {
  if (skills.length === 0) {
    return "No secondary repeated demand detected yet.";
  }

  const [first, ...rest] = skills;
  if (rest.length > 0 && rest.every(({ count }) => count === first.count)) {
    return `${formatList(skills.map(({ skill }) => skill))} each appear in ${first.count} jobs.`;
  }

  return skills
    .map(({ skill, count }) => `${skill} appears in ${count} ${count === 1 ? "job" : "jobs"}`)
    .join("; ") + ".";
}

function formatList(items) {
  const filtered = items.filter(Boolean);
  if (filtered.length === 0) {
    return "";
  }

  if (filtered.length === 1) {
    return filtered[0];
  }

  if (filtered.length === 2) {
    return `${filtered[0]} and ${filtered[1]}`;
  }

  return `${filtered.slice(0, -1).join(", ")}, and ${filtered[filtered.length - 1]}`;
}

function pluralise(label, count) {
  return count === 1 ? label : `${label}s`;
}

export function buildSkillEvidenceRows({
  skills = [],
  skillDemand = {},
  jobMatches = [],
  evidenceKey,
}) {
  return [...skills]
    .sort((a, b) => {
      const demandDifference = (skillDemand[b] || 0) - (skillDemand[a] || 0);
      return demandDifference !== 0 ? demandDifference : a.localeCompare(b);
    })
    .map((skill) => {
      const count = skillDemand[skill] || 0;
      const companies = jobMatches
        .filter((job) => (job[evidenceKey] ?? []).includes(skill))
        .map((job) => String(job.company || "").trim())
        .filter(Boolean);

      return {
        skill,
        count,
        countLabel: `${count} ${count === 1 ? "job" : "jobs"}`,
        companies: [...new Set(companies)].slice(0, 3),
      };
    });
}

export function getVisibleSkillEvidenceRows(
  rows = [],
  { showAll = false, limit = DEFAULT_SKILL_EVIDENCE_LIMIT } = {},
) {
  return showAll ? rows : rows.slice(0, limit);
}

export function shouldShowSkillEvidenceToggle(
  rows = [],
  limit = DEFAULT_SKILL_EVIDENCE_LIMIT,
) {
  return rows.length > limit;
}

export function getSkillEvidenceToggleLabel(showAll) {
  return showAll ? "Show less" : "Show more";
}
