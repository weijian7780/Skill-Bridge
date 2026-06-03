// Pure helper: given the skills a certificate proves and the student's current
// missing skills, work out which gaps it can close and which skills are extra.
//
// - closesGaps: skills present in BOTH the certificate and the missing list
//   (returned in the missing list's display form, so the UI matches the gap chart).
// - otherSkills: certificate skills that are not in the missing list.
export function matchCertSkillsToGaps({ certSkills = [], missingSkills = [] } = {}) {
  const missingByKey = new Map();
  for (const skill of missingSkills) {
    const key = normalize(skill);
    if (key) missingByKey.set(key, skill);
  }

  const closesGaps = [];
  const otherSkills = [];
  const seen = new Set();

  for (const raw of certSkills) {
    const skill = String(raw || "").trim();
    const key = normalize(skill);
    if (!key || seen.has(key)) continue;
    seen.add(key);

    if (missingByKey.has(key)) {
      closesGaps.push(missingByKey.get(key)); // display form from the gap list
    } else {
      otherSkills.push(skill);
    }
  }

  return { closesGaps, otherSkills };
}

function normalize(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^a-z0-9+#/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}
