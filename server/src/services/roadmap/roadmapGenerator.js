import { generateRoadmapWithGemini } from "../llm/geminiRoadmapClient.js";
import { buildLocalRoadmap } from "./localRoadmapBuilder.js";
import { addResourcesToRoadmapItems } from "./roadmapResources.js";

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

  const localRoadmap = buildLocalRoadmap({ careerTarget, analysis });

  try {
    const geminiRoadmap = await generateRoadmapWithGemini({ careerTarget, skillProfile, analysis });
    const alignedGeminiRoadmap = alignGeminiRoadmapToAnalysis({
      geminiRoadmap,
      localRoadmap,
      missingSkills,
    });

    if (alignedGeminiRoadmap) {
      return {
        ...alignedGeminiRoadmap,
        items: addResourcesToRoadmapItems(alignedGeminiRoadmap.items, careerTarget),
        source: alignedGeminiRoadmap.source || "gemini",
      };
    }
  } catch {
    // Keep roadmap generation usable when the hosted AI endpoint is unavailable.
  }

  return localRoadmap;
}

function alignGeminiRoadmapToAnalysis({ geminiRoadmap, localRoadmap, missingSkills }) {
  const geminiItems = Array.isArray(geminiRoadmap?.items) ? geminiRoadmap.items : [];
  if (geminiItems.length === 0) {
    return null;
  }

  const itemsBySkill = new Map();
  for (const item of geminiItems) {
    const key = skillKey(item?.skill);
    if (!key || itemsBySkill.has(key)) {
      continue;
    }
    itemsBySkill.set(key, item);
  }

  const alignedItems = [];
  for (const [index, skill] of missingSkills.entries()) {
    const geminiItem = itemsBySkill.get(skillKey(skill));
    const localItem = localRoadmap.items[index];
    if (!geminiItem || !localItem) {
      return null;
    }

    alignedItems.push({
      ...localItem,
      ...geminiItem,
      month: index + 1,
      skill,
      when: localItem.when,
      why: localItem.why,
      reason: localItem.reason,
      companyEvidence: localItem.companyEvidence,
      resources: localItem.resources,
    });
  }

  return {
    ...geminiRoadmap,
    overview: geminiRoadmap.overview || localRoadmap.overview,
    assumptions: Array.isArray(geminiRoadmap.assumptions) ? geminiRoadmap.assumptions : localRoadmap.assumptions,
    confidence: Number.isFinite(geminiRoadmap.confidence) ? geminiRoadmap.confidence : localRoadmap.confidence,
    items: alignedItems,
  };
}

function skillKey(skill) {
  return String(skill || "")
    .trim()
    .toLowerCase();
}
