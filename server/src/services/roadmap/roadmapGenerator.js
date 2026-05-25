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

  try {
    const geminiRoadmap = await generateRoadmapWithGemini({ careerTarget, skillProfile, analysis });
    if (geminiRoadmap?.items?.length) {
      return {
        ...geminiRoadmap,
        source: geminiRoadmap.source || "gemini",
      };
    }
  } catch {
    // Keep roadmap generation usable when the hosted AI endpoint is unavailable.
  }

  return buildLocalRoadmap({ careerTarget, analysis });
}
