import "../../config/env.js";
import { GoogleGenAI } from "@google/genai";

export async function generateRoadmapWithGemini({ careerTarget, skillProfile, analysis }) {
  if (!process.env.GEMINI_API_KEY) {
    return null;
  }

  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

  const response = await ai.models.generateContent({
    model,
    contents: buildRoadmapPrompt({ careerTarget, skillProfile, analysis }),
    config: {
      responseMimeType: "application/json",
    },
  });

  return JSON.parse(response.text);
}

export function buildRoadmapPrompt({ careerTarget, skillProfile, analysis }) {
  return [
    "Create a concise career roadmap for SkillBridge.",
    "Use only the deterministic missing skills supplied below.",
    "Do not invent new missing skills.",
    "Order items by the missingSkills order; that order is already ranked by market frequency.",
    "Tie every reason to company evidence, repeated demand, or skillDemand counts from the supplied marketEvidence.",
    "Make each deliverable a concrete portfolio artifact that can improve the student's CV.",
    "Return JSON with: overview, items, assumptions, confidence, source.",
    "Each item must include: month, skill, title, what, why, when, howToStart, successCriteria, objective, description, reason, deliverable, resource, tasks, companyEvidence.",
    "what: explain the concrete thing the student should learn or build for this missing skill.",
    "why: explain why this skill matters using only company evidence, repeated demand, or skillDemand counts.",
    "when: give a month-level schedule such as 'Month 1: start immediately' or 'Month 2: after SQL basics'.",
    "howToStart: return 3 short first actions the student can do this week.",
    "successCriteria: state what finished CV-ready evidence should exist.",
    "Keep tasks aligned with howToStart for backward compatibility.",
    "Keep wording short enough for visual cards.",
    "",
    JSON.stringify({
      careerTarget,
      education: skillProfile?.education,
      confirmedCvSkills: [
        ...(skillProfile?.technicalSkills ?? []),
        ...(skillProfile?.softSkills ?? []),
        ...(skillProfile?.certifications ?? []),
      ],
      missingSkills: analysis?.missingSkills ?? [],
      marketEvidence: analysis?.marketEvidence ?? {},
    }),
  ].join("\n");
}
