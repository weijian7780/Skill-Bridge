import { Router } from "express";
import { generateRoadmap } from "../services/roadmap/roadmapGenerator.js";

export const roadmapRouter = Router();

roadmapRouter.post("/generate", async (request, response, next) => {
  try {
    const { careerTarget, skillProfile, analysis } = request.body ?? {};
    const missingSkills = analysis?.missingSkills ?? [];

    if (!Array.isArray(missingSkills) || missingSkills.length === 0) {
      response.status(400).json({
        error: "Roadmap generation requires deterministic missing skills from the analysis page.",
      });
      return;
    }

    const roadmap = await generateRoadmap({ careerTarget, skillProfile, analysis });
    response.json({ roadmap });
  } catch (error) {
    next(error);
  }
});
