import { Router } from "express";
import multer from "multer";
import { parseCvBuffer, isImageUpload } from "../services/cvParser.js";
import { extractSkillProfile, extractSkillProfileFromImage } from "../services/llm/skillExtractionRouter.js";

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

    const { buffer, originalname: filename, mimetype: mimeType } = request.file;

    let skillProfile;
    let textLength = 0;

    if (isImageUpload({ filename, mimeType })) {
      // Image CVs: extract structured skills straight from the image. Verbatim
      // OCR trips Gemini's RECITATION filter on common resume templates.
      skillProfile = await extractSkillProfileFromImage({ buffer, mimeType, filename });
    } else {
      const parsed = await parseCvBuffer({ buffer, filename, mimeType });
      textLength = parsed.text.length;
      skillProfile = await extractSkillProfile(parsed.text);
    }

    response.json({
      document: { filename, mimeType, textLength },
      skillProfile,
    });
  } catch (error) {
    next(error);
  }
});
