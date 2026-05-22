import "./config/env.js";
import cors from "cors";
import express from "express";
import { cvRouter } from "./routes/cv.js";
import { jobsRouter } from "./routes/jobs.js";

const app = express();
const port = Number(process.env.PORT || 4000);

app.use(cors({ origin: process.env.CLIENT_ORIGIN || "http://127.0.0.1:5173" }));
app.use(express.json({ limit: "1mb" }));

app.get("/api/health", (_request, response) => {
  response.json({ ok: true, service: "skillbridge-server" });
});

app.use("/api/cv", cvRouter);
app.use("/api/jobs", jobsRouter);

app.use((error, _request, response, _next) => {
  console.error(error);
  response.status(error.statusCode || 500).json({
    error: error.message || "Unexpected server error",
  });
});

app.listen(port, () => {
  console.log(`SkillBridge server listening on http://localhost:${port}`);
});
