import { createGeminiChatCompletion } from "./geminiClient.js";
import { buildRoadmapPrompt } from "./roadmapPrompt.js";
import { parseJsonResponse } from "./skillExtractionPrompt.js";

export async function generateRoadmapWithGemini({ careerTarget, skillProfile, analysis }) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const content = await createGeminiChatCompletion({
    model: process.env.GEMINI_MODEL || "gemini-2.5-flash-lite",
    messages: [
      {
        role: "user",
        content: buildRoadmapPrompt({ careerTarget, skillProfile, analysis }),
      },
    ],
    maxTokens: 2500,
  });

  return parseJsonResponse(content);
}
