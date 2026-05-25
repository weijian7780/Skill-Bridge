import "../../config/env.js";
import { buildExtractionPrompt, parseJsonResponse } from "./skillExtractionPrompt.js";

const DEFAULT_BASE_URL = "https://generativelanguage.googleapis.com/v1beta/openai";
const DEFAULT_MODEL = "gemini-3.1-flash-lite";
const DEFAULT_FALLBACK_MODELS = ["gemini-3.1-flash-lite", "gemini-2.5-flash-lite"];

export async function extractWithGemini(cvText) {
  const content = await createGeminiChatCompletion({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: buildExtractionPrompt(cvText),
      },
    ],
    maxTokens: 900,
  });

  return parseJsonResponse(content);
}

export async function extractCvImageTextWithGemini({ buffer, filename, mimeType }) {
  return createGeminiChatCompletion({
    model: process.env.GEMINI_MODEL || DEFAULT_MODEL,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: buildCvImageTextPrompt(filename),
          },
          {
            type: "image_url",
            image_url: {
              url: `data:${mimeType};base64,${buffer.toString("base64")}`,
            },
          },
        ],
      },
    ],
    maxTokens: 3000,
  });
}

export async function createGeminiChatCompletion({ model, messages, maxTokens }) {
  if (!process.env.GEMINI_API_KEY) {
    const error = new Error("GEMINI_API_KEY is not configured.");
    error.statusCode = 400;
    throw error;
  }

  const candidates = buildModelCandidates(model);
  let lastError;

  for (const [index, candidateModel] of candidates.entries()) {
    const response = await fetch(buildChatCompletionsUrl(), {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: candidateModel,
        messages,
        temperature: 0,
        max_tokens: maxTokens,
      }),
    });

    const text = await response.text();
    if (!response.ok) {
      lastError = createGeminiHttpError(response.status, text);
      if (isTransientStatus(response.status) && index < candidates.length - 1) {
        continue;
      }

      throw lastError;
    }

    return parseChatCompletionContent(text);
  }

  throw lastError;
}

function buildChatCompletionsUrl() {
  const baseUrl = process.env.GEMINI_BASE_URL || DEFAULT_BASE_URL;
  return new URL("chat/completions", `${baseUrl.replace(/\/+$/, "")}/`).toString();
}

function summarizeErrorBody(text) {
  if (!text) {
    return "empty response body";
  }

  try {
    const payload = JSON.parse(text);
    return payload?.error?.message || payload?.detail || text.slice(0, 300);
  } catch {
    return text.slice(0, 300);
  }
}

function buildModelCandidates(primaryModel) {
  return unique([
    primaryModel || DEFAULT_MODEL,
    ...parseModelList(process.env.GEMINI_FALLBACK_MODELS),
    ...DEFAULT_FALLBACK_MODELS,
  ]);
}

function parseModelList(value) {
  return String(value || "")
    .split(",")
    .map((model) => model.trim())
    .filter(Boolean);
}

function unique(values) {
  return [...new Set(values.filter(Boolean))];
}

function isTransientStatus(status) {
  return [429, 500, 502, 503, 504].includes(status);
}

function createGeminiHttpError(status, text) {
  const error = new Error(`Gemini chat completion failed (${status}): ${summarizeErrorBody(text)}`);
  error.statusCode = 502;
  return error;
}

function parseChatCompletionContent(text) {
  let payload;
  try {
    payload = JSON.parse(text);
  } catch {
    const error = new Error("Gemini chat completion returned invalid JSON.");
    error.statusCode = 502;
    throw error;
  }

  const content = payload?.choices?.[0]?.message?.content;
  if (!content) {
    const error = new Error("Gemini chat completion returned no message content.");
    error.statusCode = 502;
    throw error;
  }

  return content;
}

function buildCvImageTextPrompt(filename) {
  return [
    `Extract readable CV text from this image file: ${filename}.`,
    "Only return the text visible in the CV image.",
    "Preserve name, title, contact details, profile, skills, languages, hobbies, work experience, and education where visible.",
    "For education, preserve degree, institution, location, and dates.",
    "Do not invent missing content.",
  ].join("\n");
}
