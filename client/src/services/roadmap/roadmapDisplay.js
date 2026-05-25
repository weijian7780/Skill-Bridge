export function buildCompactRoadmapCards(items = []) {
  return items.map((item, index) => {
    const howToStart = toList(item.howToStart ?? item.tasks);
    const tasks = toList(item.tasks);
    const companyEvidence = toList(item.companyEvidence, { splitCommas: true });

    return {
      phase: `Month ${item.month ?? index + 1}`,
      statusLabel: index === 0 ? "In Progress" : index === 1 ? "Next" : "Later",
      statusIcon: index === 0 ? "sync" : index === 1 ? "schedule" : "lock",
      skill: item.skill || item.title || "Skill gap",
      title: truncate(item.title, 52),
      what: truncate(item.what || item.objective || item.description, 120),
      why: truncate(item.why || item.reason || item.whyNow, 140),
      when: truncate(item.when || `Month ${item.month ?? index + 1}`, 72),
      howToStart: howToStart
        .map((task) => truncate(task, 72))
        .filter(Boolean)
        .slice(0, 3),
      successCriteria: truncate(item.successCriteria || item.deliverable, 120),
      objective: truncate(item.objective || item.description, 86),
      reason: truncate(item.reason || item.whyNow, 96),
      proof: truncate(item.deliverable, 72),
      resource: truncate(item.resource || item.resourceSearchQuery, 54),
      companyChips: companyEvidence
        .map((company) => String(company || "").trim())
        .filter(Boolean)
        .slice(0, 2),
      extraCompanyCount: Math.max(0, companyEvidence.length - 2),
      taskChips: tasks
        .map((task) => truncate(task, 42))
        .filter(Boolean)
        .slice(0, 3),
    };
  });
}

export function buildSequentialRoadmapPath(items = []) {
  return buildCompactRoadmapCards(items).map((item, index) => ({
    ...item,
    stepLabel: String(index + 1).padStart(2, "0"),
    isActive: index === 0,
    isLast: index === items.length - 1,
  }));
}

export function buildRoadmapPageView({ careerTarget, analysis, roadmapPlan }) {
  const items = Array.isArray(roadmapPlan?.items) ? roadmapPlan.items : [];
  const hasGeneratedPlan = Boolean(roadmapPlan);
  const hasNoGaps = hasGeneratedPlan && items.length === 0 && analysis?.status === "ready";
  const isGenerated = items.length > 0 || hasNoGaps;
  const role = careerTarget?.role || "Career";
  const region = careerTarget?.region || "selected market";

  if (!isGenerated) {
    return {
      isGenerated: false,
      hasNoGaps: false,
      heroTitle: "Roadmap not generated yet",
      heroSubtitle: `${role} roles in ${region}`,
      emptyStateMessage: buildEmptyStateMessage(analysis?.status),
      sourceLabel: "No generated plan",
      summaryCards: [],
      pathItems: [],
      basisOverview: "",
      assumptions: [],
    };
  }

  const missingSkills = analysis?.missingSkills ?? [];
  const readinessScore = analysis?.readinessScore ?? 0;

  if (hasNoGaps) {
    return {
      isGenerated: true,
      hasNoGaps: true,
      heroTitle: "No priority gaps detected",
      heroSubtitle: `${role} roles in ${region}`,
      emptyStateMessage: "",
      sourceLabel: "No priority gaps",
      summaryCards: [
        {
          label: "Skills planned",
          value: "0",
          detail: "Your CV covers every detected repeated market requirement.",
        },
        {
          label: "Current match",
          value: `${readinessScore}%`,
          detail: "Based on the loaded company requirement evidence.",
        },
        {
          label: "Next action",
          value: "Keep fresh",
          detail: "Change target, upload a newer CV, or reload jobs when market evidence changes.",
        },
      ],
      pathItems: [],
      basisOverview: roadmapPlan?.overview || "No missing market skills were detected for this target.",
      assumptions: toList(roadmapPlan?.assumptions),
    };
  }

  return {
    isGenerated: true,
    hasNoGaps: false,
    heroTitle: `${role} Roadmap`,
    heroSubtitle: `${items.length} market gap ${items.length === 1 ? "skill" : "skills"} planned for ${region}`,
    emptyStateMessage: "",
    sourceLabel: sourceLabel(roadmapPlan?.source),
    summaryCards: [
      {
        label: "Skills planned",
        value: String(items.length),
        detail: missingSkills.slice(0, 3).join(", ") || "Generated from analysis gaps",
      },
      {
        label: "Current match",
        value: `${readinessScore}%`,
        detail: "Before completing this roadmap",
      },
      {
        label: "Evidence source",
        value: sourceLabel(roadmapPlan?.source),
        detail: "Missing skills still come from deterministic company comparison.",
      },
    ],
    pathItems: buildSequentialRoadmapPath(items),
    basisOverview: roadmapPlan?.overview || `Roadmap generated from ${role} company requirements.`,
    assumptions: toList(roadmapPlan?.assumptions),
  };
}

export function buildRoadmapGenerationPayload({ careerTarget, skillProfile, analysis }) {
  return {
    careerTarget,
    skillProfile,
    analysis: {
      status: analysis.status,
      readinessScore: analysis.readinessScore,
      matchedSkills: analysis.matchedSkills,
      missingSkills: analysis.missingSkills,
      marketEvidence: analysis.marketEvidence,
    },
  };
}

function buildEmptyStateMessage(status) {
  if (status === "needs_cv") {
    return "Upload and confirm your latest CV before generating a roadmap.";
  }

  if (status === "needs_market") {
    return "Load market job evidence before generating a roadmap from company requirements.";
  }

  return "Open the analysis page and build a roadmap from the detected missing skills.";
}

function sourceLabel(source) {
  if (source === "gemini") {
    return "Gemini-assisted roadmap";
  }

  if (source === "local-rules" || source === "deterministic") {
    return "Rule-based roadmap";
  }

  return "Generated roadmap";
}

function truncate(value, maxLength) {
  const text = String(value || "").replace(/\s+/g, " ").trim();
  return text.length <= maxLength ? text : `${text.slice(0, Math.max(0, maxLength - 3)).trim()}...`;
}

function toList(value, { splitCommas = false } = {}) {
  if (Array.isArray(value)) {
    return value;
  }

  if (value === null || value === undefined) {
    return [];
  }

  const text = String(value).trim();
  if (!text) {
    return [];
  }

  if (splitCommas) {
    return text.split(/[,;\n]/).map((item) => item.trim()).filter(Boolean);
  }

  if (text.includes("\n")) {
    return text.split(/\n/).map((item) => item.trim()).filter(Boolean);
  }

  return [text];
}
