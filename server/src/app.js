import cors from "cors";
import express from "express";
import { buildCorsOptions } from "./config/cors.js";
import { cvRouter } from "./routes/cv.js";
import { jobsRouter } from "./routes/jobs.js";
import { roadmapRouter } from "./routes/roadmap.js";

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

  app.use((error, _request, response, _next) => {
    console.error(error);
    response.status(error.statusCode || 500).json({
      error: error.message || "Unexpected server error",
    });
  });

  return app;
}
