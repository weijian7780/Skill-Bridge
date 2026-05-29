import cors from "cors";
import express from "express";
import { buildCorsOptions } from "./config/cors.js";
import { cvRouter } from "./routes/cv.js";
import { jobsRouter } from "./routes/jobs.js";
import { roadmapRouter } from "./routes/roadmap.js";
import { profileRouter } from "./routes/employer/profile.js";
import { jobPostsRouter } from "./routes/employer/jobPosts.js";
import { employerApplicationsRouter } from "./routes/employer/applications.js";
import { employerStatsRouter } from "./routes/employer/stats.js";
import { employerInterviewsRouter } from "./routes/employer/interviews.js";
import { applicationsRouter } from "./routes/student/applications.js";
import { requireAuth, requireRole } from "./middleware/auth.js";

export function createApp() {
  const app = express();

  app.use(cors(buildCorsOptions()));
  app.use(express.json({ limit: "1mb" }));

  app.get("/", (_request, response) => {
    response.json({
      ok: true,
      service: "skillbridge-server",
      health: "/api/health",
      routes: {
        cv: "/api/cv",
        jobs: "/api/jobs/search",
        roadmap: "/api/roadmap/generate",
      },
    });
  });

  app.get("/api/health", (_request, response) => {
    response.json({ ok: true, service: "skillbridge-server" });
  });

  app.use("/api/cv", cvRouter);
  app.use("/api/jobs", jobsRouter);
  app.use("/api/roadmap", roadmapRouter);

  // Protected employer routes
  const authConfig = {
    supabaseUrl: process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "",
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_KEY || "",
  };
  
  // Inject supabase context for protected routes to use
  app.use("/api/employer", (request, _response, next) => {
    request.supabase = {
      url: authConfig.supabaseUrl,
      serviceRoleKey: authConfig.supabaseKey,
      fetchImpl: fetch,
    };
    next();
  });
  
  app.use("/api/employer", requireAuth(authConfig));
  app.use("/api/employer", requireRole("employer"));
  app.use("/api/employer/profile", profileRouter);
  app.use("/api/employer/job-posts", jobPostsRouter);
  app.use("/api/employer/applications", employerApplicationsRouter);
  app.use("/api/employer/stats", employerStatsRouter);
  app.use("/api/employer/interviews", employerInterviewsRouter);

  // Protected student routes
  app.use("/api/student", (request, _response, next) => {
    request.supabase = {
      url: authConfig.supabaseUrl,
      serviceRoleKey: authConfig.supabaseKey,
      fetchImpl: fetch,
    };
    next();
  });
  app.use("/api/student", requireAuth(authConfig));
  app.use("/api/student", requireRole("student"));
  app.use("/api/student/applications", applicationsRouter);

  app.use((error, _request, response, _next) => {
    console.error(error);
    const statusCode = error.statusCode || (error.code === "LIMIT_FILE_SIZE" ? 413 : 500);
    response.status(statusCode).json({
      error: error.message || "Unexpected server error",
    });
  });

  return app;
}
