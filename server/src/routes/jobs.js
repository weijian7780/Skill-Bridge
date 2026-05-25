import { Router } from "express";
import { searchMarketJobsWithCache } from "../services/jobs/jobSearchCacheFlow.js";
import { createSupabaseJobCache } from "../services/jobs/supabaseJobCache.js";

export const jobsRouter = Router();

jobsRouter.get("/search", async (request, response, next) => {
  try {
    const role = String(request.query.role || "Data Analyst");
    const location = String(request.query.location || "Malaysia");
    const industry = String(request.query.industry || "");
    const result = await searchMarketJobsWithCache({
      searchContext: { role, location, industry },
      cache: createSupabaseJobCache(),
    });

    response.status(result.configured ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
});
