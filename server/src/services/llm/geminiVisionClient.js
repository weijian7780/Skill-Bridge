import "../../config/env.js";
import { GoogleGenAI } from "@google/genai";

export async function extractCvImageTextWithGemini({ buffer, filename, mimeType }) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("Image CV upload requires GEMINI_API_KEY because JPG, PNG, and WebP files need vision OCR.");
    error.statusCode = 400;
    throw error;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: [
      {
        role: "user",
        parts: [
          {
            text: buildCvImageTextPrompt(filename),
          },
          {
            inlineData: {
              mimeType,
              data: buffer.toString("base64"),
            },
          },
        ],
      },
    ],
  });

  return response.text;
}

function buildCvImageTextPrompt(filename) {
  return [
    `Extract readable CV text from this image file: ${filename}.`,
    "Only return the text visible in the CV image.",
    "Preserve headings such as education, experience, projects, skills, certifications, and contact summary where visible.",
    "Do not invent missing content.",
  ].join("\n");
}
