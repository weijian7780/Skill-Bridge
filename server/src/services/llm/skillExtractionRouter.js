import { extractWithGemini } from "./geminiClient.js";
import { extractWithRules } from "./ruleBasedExtractor.js";

export async function extractSkillProfile(cvText) {
  const warnings = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      return withDefaults(await extractWithGemini(cvText), "Gemini 2.5 Flash", warnings);
    } catch (error) {
      warnings.push(`Gemini extraction failed: ${error.message}`);
    }
  } else {
    warnings.push("Gemini API key not configured");
  }

  return withDefaults(extractWithRules(cvText), "Local rule fallback", warnings);
}

export function buildExtractionPrompt(cvText) {
  return [
    "Extract a structured skill profile from this CV text.",
    "Return valid JSON only. No markdown.",
    "Schema:",
    "{",
    '  "technicalSkills": string[],',
    '  "softSkills": string[],',
    '  "education": string,',
    '  "certifications": string[],',
    '  "confidence": number',
    "}",
    "CV text:",
    cvText.slice(0, 18000),
  ].join("\n");
}

function withDefaults(profile, provider, warnings) {
  return {
    provider,
    technicalSkills: Array.isArray(profile.technicalSkills) ? profile.technicalSkills : [],
    softSkills: Array.isArray(profile.softSkills) ? profile.softSkills : [],
    education: profile.education || "UMS Year 3 Computer Science",
    certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
    confidence: Number.isFinite(profile.confidence) ? profile.confidence : 0.5,
    warnings,
  };
}

export function parseJsonResponse(text) {
  const cleaned = String(text || "")
    .replace(/^```json/i, "")
    .replace(/^```/i, "")
    .replace(/```$/i, "")
    .trim();
  return JSON.parse(cleaned);
}
