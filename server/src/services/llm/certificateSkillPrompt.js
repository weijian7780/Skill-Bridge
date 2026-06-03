// Prompt for extracting the skills a certificate proves.
// Kept separate from CV extraction so the two can evolve independently.
export function buildCertificateSkillPrompt(certificateText) {
  return [
    "You are reading the text of a training certificate or course completion document.",
    "Identify the concrete, job-relevant skills this certificate demonstrates the holder has learned.",
    "Return valid JSON only. No markdown, no explanation, no code fences.",
    "",
    "Rules:",
    "- title: the certificate's name/title (e.g. \"Google Data Analytics Professional Certificate\"). Empty string if unclear.",
    "- skills: array of specific skills proven (e.g. \"SQL\", \"Data Visualization\", \"Python\"). Prefer widely-used skill names.",
    "- Only include skills clearly implied by the certificate. Never fabricate. Empty array if none are clear.",
    "- Return at most 8 skills.",
    "",
    "Schema:",
    "{",
    '  "title": string,',
    '  "skills": string[]',
    "}",
    "",
    "Certificate text:",
    String(certificateText || "").slice(0, 8000),
  ].join("\n");
}
