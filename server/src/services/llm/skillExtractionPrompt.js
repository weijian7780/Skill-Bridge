export function buildExtractionPrompt(cvText) {
  return [
    "You are extracting a structured skill profile from CV text.",
    "Return valid JSON only. No markdown, no explanation, no code fences.",
    "",
    "Rules:",
    "- technicalSkills: hard skills, tools, languages, frameworks, design software (e.g. Python, Figma, AWS).",
    "- softSkills: interpersonal traits (e.g. Communication, Teamwork, Leadership).",
    "- education: include every visible education entry as one semicolon-separated string, preserving degree, field, institution, location, and dates when visible. Use empty string \"\" if none is visible. DO NOT invent.",
    "- certifications: named certifications only. Empty array if none.",
    "- confidence: 0..1, your subjective confidence in the extraction.",
    "- If the CV is an image with poor OCR, extract whatever IS visible and lower confidence. Never fabricate.",
    "",
    "Schema:",
    "{",
    '  "technicalSkills": string[],',
    '  "softSkills": string[],',
    '  "education": string,',
    '  "certifications": string[],',
    '  "confidence": number',
    "}",
    "",
    "CV text:",
    cvText.slice(0, 18000),
  ].join("\n");
}

export function parseJsonResponse(text) {
  const cleaned = String(text || "")
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}
