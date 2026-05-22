import "../../config/env.js";
import { GoogleGenAI } from "@google/genai";
import { buildExtractionPrompt, parseJsonResponse } from "./skillExtractionRouter.js";

export async function extractWithGemini(cvText) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: buildExtractionPrompt(cvText),
    config: {
      responseMimeType: "application/json",
    },
  });

  return parseJsonResponse(response.text);
}
