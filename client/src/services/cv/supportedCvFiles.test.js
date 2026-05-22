import test from "node:test";
import assert from "node:assert/strict";

import { SUPPORTED_CV_ACCEPT, SUPPORTED_CV_HELP_TEXT, SUPPORTED_CV_STATUS_TEXT } from "./supportedCvFiles.js";

test("client accepts document and image CV upload formats", () => {
  assert.equal(SUPPORTED_CV_ACCEPT, ".pdf,.docx,.jpg,.jpeg,.png,.webp");
  assert.match(SUPPORTED_CV_HELP_TEXT, /JPG/);
  assert.match(SUPPORTED_CV_HELP_TEXT, /PNG/);
  assert.match(SUPPORTED_CV_HELP_TEXT, /WebP/);
  assert.match(SUPPORTED_CV_STATUS_TEXT, /image/);
});
