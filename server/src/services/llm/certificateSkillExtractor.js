import { createGeminiChatCompletion } from "./geminiClient.js";
import { parseJsonResponse } from "./skillExtractionPrompt.js";
import { buildCertificateSkillPrompt } from "./certificateSkillPrompt.js";

// Returns { title, skills[] } for a certificate's text.
// Best-effort: returns empty skills if Gemini is unconfigured or fails, so an
// upload never breaks just because skill extraction did.
export async function extractCertificateSkills(certificateText) {
  const text = String(certificateText || "").trim();
  if (!text || !process.env.GEMINI_API_KEY) {
    return { title: "", skills: [] };
  }

  try {
    const content = await createGeminiChatCompletion({
      model: process.env.GEMINI_MODEL,
      messages: [{ role: "user", content: buildCertificateSkillPrompt(text) }],
      maxTokens: 400,
      responseFormat: { type: "json_object" },
    });
    const parsed = parseJsonResponse(content);
    return {
      title: typeof parsed.title === "string" ? parsed.title.trim() : "",
      skills: Array.isArray(parsed.skills)
        ? parsed.skills.map((s) => String(s || "").trim()).filter(Boolean).slice(0, 8)
        : [],
    };
  } catch {
    return { title: "", skills: [] };
  }
}
