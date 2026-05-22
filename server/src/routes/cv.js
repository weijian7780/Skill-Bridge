import { Router } from "express";
import multer from "multer";
import { parseCvBuffer } from "../services/cvParser.js";
import { extractCvImageTextWithGemini } from "../services/llm/geminiVisionClient.js";
import { extractSkillProfile } from "../services/llm/skillExtractionRouter.js";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
});

export const cvRouter = Router();

cvRouter.post("/extract", upload.single("cv"), async (request, response, next) => {
  try {
    if (!request.file) {
      response.status(400).json({ error: "No CV file uploaded" });
      return;
    }

    const parsed = await parseCvBuffer({
      buffer: request.file.buffer,
      filename: request.file.originalname,
      mimeType: request.file.mimetype,
      imageTextExtractor: extractCvImageTextWithGemini,
    });

    const skillProfile = await extractSkillProfile(parsed.text);

    response.json({
      document: {
        filename: request.file.originalname,
        mimeType: request.file.mimetype,
        textLength: parsed.text.length,
      },
      skillProfile,
    });
  } catch (error) {
    next(error);
  }
});
