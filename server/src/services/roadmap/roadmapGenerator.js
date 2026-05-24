import { generateRoadmapWithGemini } from "../llm/geminiRoadmapClient.js";
import { buildLocalRoadmap } from "./localRoadmapBuilder.js";

export async function generateRoadmap({ careerTarget, skillProfile, analysis }) {
  const missingSkills = analysis?.missingSkills ?? [];
  if (missingSkills.length === 0) {
    return {
      overview: "No missing market skills were detected for this target.",
      items: [],
      assumptions: [],
      confidence: 1,
      source: "deterministic",
    };
  }

  const geminiRoadmap = await generateRoadmapWithGemini({ careerTarget, skillProfile, analysis });
  if (geminiRoadmap?.items?.length) {
    return {
      ...geminiRoadmap,
      source: geminiRoadmap.source || "gemini",
    };
  }

  return buildLocalRoadmap({ careerTarget, analysis });
}
