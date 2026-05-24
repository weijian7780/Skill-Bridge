import { apiRequest } from "../apiClient.js";
import { buildRoadmapGenerationPayload } from "./roadmapDisplay.js";

export function generateRoadmapFromAnalysis({ careerTarget, skillProfile, analysis }) {
  return apiRequest("/roadmap/generate", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(buildRoadmapGenerationPayload({
      careerTarget,
      skillProfile,
      analysis,
    })),
  });
}
