import { extractWithGemini } from "./geminiClient.js";
import { extractWithRules } from "./ruleBasedExtractor.js";
export { buildExtractionPrompt, parseJsonResponse } from "./skillExtractionPrompt.js";

export async function extractSkillProfile(cvText) {
  const warnings = [];

  if (process.env.GEMINI_API_KEY) {
    try {
      return withDefaults(await extractWithGemini(cvText), "Gemini", warnings);
    } catch (error) {
      warnings.push(`Gemini extraction failed: ${error.message}`);
    }
  } else {
    warnings.push("Gemini API key not configured");
  }

  return withDefaults(extractWithRules(cvText), "Local rule fallback", warnings);
}

function withDefaults(profile, provider, warnings) {
  const education = typeof profile.education === "string" ? profile.education.trim() : "";
  const technicalSkills = Array.isArray(profile.technicalSkills) ? profile.technicalSkills : [];
  const softSkills = Array.isArray(profile.softSkills) ? profile.softSkills : [];
  const certifications = Array.isArray(profile.certifications) ? profile.certifications : [];

  const finalWarnings = [...warnings];
  if (!education) {
    finalWarnings.push("Education was not detected from the CV. Please fill it in manually.");
  }
  if (technicalSkills.length === 0) {
    finalWarnings.push("No technical skills detected. The CV may be image-only or stylized - please add skills manually.");
  }

  return {
    provider,
    technicalSkills,
    softSkills,
    education,
    certifications,
    confidence: Number.isFinite(profile.confidence) ? profile.confidence : 0.5,
    warnings: finalWarnings,
  };
}
