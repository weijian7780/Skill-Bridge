import test from "node:test";
import assert from "node:assert/strict";

import { parseCvBuffer } from "./cvParser.js";

test("rejects a WebP image renamed as a PDF with a clear validation error", async () => {
  const webpHeader = Buffer.from("52494646b27801005745425056503820", "hex");

  await assert.rejects(
    () => parseCvBuffer({
      buffer: webpHeader,
      filename: "test.pdf",
      mimeType: "application/pdf",
    }),
    (error) => {
      assert.equal(error.statusCode, 400);
      assert.match(error.message, /WebP image/);
      assert.match(error.message, /\.webp/);
      return true;
    },
  );
});

test("extracts text from native CV images through the provided OCR extractor", async () => {
  const cases = [
    {
      buffer: Buffer.from("ffd8ffe000104a464946", "hex"),
      filename: "latest-cv.jpg",
      mimeType: "image/jpeg",
    },
    {
      buffer: Buffer.from("89504e470d0a1a0a0000000d49484452", "hex"),
      filename: "latest-cv.png",
      mimeType: "image/png",
    },
    {
      buffer: Buffer.from("52494646b27801005745425056503820", "hex"),
      filename: "latest-cv.webp",
      mimeType: "image/webp",
    },
  ];

  for (const cvImage of cases) {
    const seen = [];
    const parsed = await parseCvBuffer({
      ...cvImage,
      imageTextExtractor: async (input) => {
        seen.push(input);
        return "Alex Mercer\nTechnical Skills: Python, SQL, Power BI";
      },
    });

    assert.equal(parsed.parser, "gemini-vision-ocr");
    assert.equal(parsed.text, "Alex Mercer\nTechnical Skills: Python, SQL, Power BI");
    assert.equal(seen.length, 1);
    assert.equal(seen[0].filename, cvImage.filename);
    assert.equal(seen[0].mimeType, cvImage.mimeType);
  }
});
