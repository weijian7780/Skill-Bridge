// Builds the profile "Readiness Snapshot" radar from REAL analysis + CV data
// (no cosmetic offsets). Each axis is a genuine 0..100 signal:
//  - Market Match:   the live job-market readiness score.
//  - Skill Coverage: % of required market skills the student already has.
//  - Technical:      breadth of extracted technical skills.
//  - Soft Skills:    breadth of extracted soft skills.
//  - CV Confidence:  the AI extractor's confidence in the parsed CV.
const TECHNICAL_PER_SKILL = 12;
const SOFT_PER_SKILL = 20;

function clampScore(value) {
  return Math.max(0, Math.min(100, Math.round(value || 0)));
}

export function buildReadinessRadar({ analysis = {}, skillProfile = {} }) {
  const matched = Array.isArray(analysis.matchedSkills) ? analysis.matchedSkills.length : 0;
  const missing = Array.isArray(analysis.missingSkills) ? analysis.missingSkills.length : 0;
  const totalRequired = matched + missing;

  const skillCoverage = totalRequired > 0 ? (matched / totalRequired) * 100 : 0;
  const technical = (skillProfile.technicalSkills?.length ?? 0) * TECHNICAL_PER_SKILL;
  const soft = (skillProfile.softSkills?.length ?? 0) * SOFT_PER_SKILL;
  const cvConfidence = (skillProfile.confidence ?? 0) * 100;

  return [
    { subject: "Market Match", A: clampScore(analysis.readinessScore), fullMark: 100 },
    { subject: "Skill Coverage", A: clampScore(skillCoverage), fullMark: 100 },
    { subject: "Technical", A: clampScore(technical), fullMark: 100 },
    { subject: "Soft Skills", A: clampScore(soft), fullMark: 100 },
    { subject: "CV Confidence", A: clampScore(cvConfidence), fullMark: 100 },
  ];
}
