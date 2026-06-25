import path from "node:path";
import mammoth from "mammoth";
import pdf from "pdf-parse";

const SUPPORTED_IMAGE_FORMATS = [
  {
    label: "JPEG",
    mimeType: "image/jpeg",
    extensions: [".jpg", ".jpeg"],
    hasSignature: (buffer) => buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff,
  },
  {
    label: "PNG",
    mimeType: "image/png",
    extensions: [".png"],
    hasSignature: (buffer) => buffer.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex")),
  },
  {
    label: "WebP",
    mimeType: "image/webp",
    extensions: [".webp"],
    hasSignature: (buffer) => {
      const header = buffer.subarray(0, 16).toString("latin1");
      return header.startsWith("RIFF") && header.includes("WEBP");
    },
  },
];

// True when the upload is one of the supported image formats, judged by MIME
// type or file extension. Lets a route choose image extraction over text parsing.
export function isImageUpload({ filename, mimeType }) {
  const extension = path.extname(String(filename || "")).toLowerCase();
  return SUPPORTED_IMAGE_FORMATS.some(
    (format) => format.mimeType === mimeType || format.extensions.includes(extension),
  );
}

export async function parseCvBuffer({ buffer, filename, mimeType, imageTextExtractor }) {
  const extension = path.extname(filename).toLowerCase();

  if (mimeType === "application/pdf" || extension === ".pdf") {
    validatePdfSignature(buffer);
    const parsed = await pdf(buffer);
    return { text: cleanText(parsed.text), parser: "pdf-parse" };
  }

  if (
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    extension === ".docx"
  ) {
    const parsed = await mammoth.extractRawText({ buffer });
    return { text: cleanText(parsed.value), parser: "mammoth" };
  }

  const imageFormat = detectImageFormat({ buffer, extension, mimeType });
  if (imageFormat) {
    if (!imageTextExtractor) {
      throw createFormatError("Image CV upload requires Gemini vision OCR. Configure GEMINI_API_KEY, then upload JPG, PNG, or WebP.");
    }

    const extractedText = await imageTextExtractor({
      buffer,
      filename,
      mimeType: imageFormat.mimeType,
    });

    return { text: cleanText(extractedText), parser: "gemini-vision-ocr" };
  }

  const error = new Error("Unsupported CV format. Upload a PDF, DOCX, JPG, PNG, or WebP file.");
  error.statusCode = 400;
  throw error;
}

function createFormatError(message) {
  const error = new Error(message);
  error.statusCode = 400;
  return error;
}

function validatePdfSignature(buffer) {
  const header = buffer.subarray(0, 16).toString("latin1");

  if (header.startsWith("%PDF")) {
    return;
  }

  if (header.startsWith("RIFF") && header.includes("WEBP")) {
    throw createFormatError("This file is a WebP image renamed as .pdf. Upload it as .webp, or upload a real PDF/DOCX file.");
  }

  if (header.startsWith("\x89PNG")) {
    throw createFormatError("This file is a PNG image renamed as .pdf. Upload it as .png, or upload a real PDF/DOCX file.");
  }

  if (buffer[0] === 0xff && buffer[1] === 0xd8) {
    throw createFormatError("This file is a JPEG image renamed as .pdf. Upload it as .jpg, or upload a real PDF/DOCX file.");
  }

  throw createFormatError("This file is not a valid PDF. Upload a real PDF/DOCX file, or upload JPG, PNG, or WebP as an image file.");
}

function detectImageFormat({ buffer, extension, mimeType }) {
  const imageFormat = SUPPORTED_IMAGE_FORMATS.find(
    (format) => format.mimeType === mimeType || format.extensions.includes(extension),
  );

  if (!imageFormat) {
    return null;
  }

  if (!imageFormat.hasSignature(buffer)) {
    throw createFormatError(`This file is not a valid ${imageFormat.label} image. Upload a valid JPG, PNG, or WebP CV image.`);
  }

  return imageFormat;
}

function cleanText(text) {
  return String(text || "")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
}
