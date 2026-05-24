import { getRegionAnalysisCopy } from "../career/regionOptions.js";

export function buildMarketEvidenceOverview({
  careerTarget,
  cvDocument,
  jobs = [],
  relevantJobCount,
  excludedJobCount = 0,
  skillDemand = {},
}) {
  const topDemandedSkills = Object.entries(skillDemand)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 5)
    .map(([skill, count]) => ({ skill, count }));

  const role = careerTarget?.role || "Target role";
  const regionCopy = careerTarget?.region ? getRegionAnalysisCopy(careerTarget.region) : "";
  const comparedJobCount = typeof relevantJobCount === "number" ? relevantJobCount : jobs.length;

  return {
    title: `Market evidence for ${careerTarget?.role || "target role"}`,
    subtitle: regionCopy
      ? `${role} roles ${regionCopy}`
      : "Live job data used for skill-gap scoring",
    stats: [
      {
        label: "Relevant job postings",
        value: String(comparedJobCount),
        detail: "with detected company requirements",
      },
      ...(excludedJobCount > 0
        ? [{
            label: "Unrelated provider results",
            value: String(excludedJobCount),
            detail: "excluded from skill-gap calculation",
          }]
        : []),
      {
        label: "Latest CV",
        value: cvDocument?.fileName || "Not confirmed",
        detail: cvDocument ? "resume source" : "upload required",
      },
    ],
    topDemandedSkills,
  };
}
