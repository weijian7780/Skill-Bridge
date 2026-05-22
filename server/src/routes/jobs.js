import { Router } from "express";
import { searchMarketJobsWithCache } from "../services/jobs/jobSearchCacheFlow.js";
import { createSupabaseJobCache } from "../services/jobs/supabaseJobCache.js";

export const jobsRouter = Router();

jobsRouter.get("/search", async (request, response, next) => {
  try {
    const role = String(request.query.role || "Data Analyst");
    const location = String(request.query.location || "Malaysia");
    const userIp = request.headers["x-forwarded-for"]?.split(",")[0]?.trim()
      || request.socket.remoteAddress
      || "127.0.0.1";
    const userAgent = request.get("user-agent") || "SkillBridge/1.0";
    const referer = process.env.CLIENT_PUBLIC_URL || process.env.CLIENT_ORIGIN || request.get("referer") || "http://127.0.0.1:5173";
    const result = await searchMarketJobsWithCache({
      searchContext: { role, location, userIp, userAgent, referer },
      cache: createSupabaseJobCache(),
    });

    response.status(result.configured ? 200 : 503).json(result);
  } catch (error) {
    next(error);
  }
});
