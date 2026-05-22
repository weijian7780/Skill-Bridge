import test from "node:test";
import assert from "node:assert/strict";

import {
  applySkillProfileEdits,
  buildCvExtractionDraft,
  listToText,
  textToList,
} from "./cvExtractionDraft.js";

test("builds a latest-CV extraction draft from upload result and browser file", () => {
  const draft = buildCvExtractionDraft({
    file: {
      name: "alex-cv.pdf",
      type: "application/pdf",
      size: 123456,
    },
    uploadResult: {
      document: {
        filename: "server-name.pdf",
        mimeType: "application/pdf",
        textLength: 3200,
      },
      skillProfile: {
        provider: "gemini-2.5-flash",
        technicalSkills: ["Python", "SQL"],
        softSkills: ["Communication"],
        certifications: [],
        education: "UMS Year 3 Computer Science",
        confidence: 0.82,
        warnings: [],
      },
    },
  });

  assert.deepEqual(draft.cvDocument, {
    fileName: "server-name.pdf",
    mimeType: "application/pdf",
    sizeBytes: 123456,
    storagePath: "",
    textLength: 3200,
  });
  assert.deepEqual(draft.skillProfile.technicalSkills, ["Python", "SQL"]);
});

test("converts comma and newline text into a clean unique list", () => {
  assert.deepEqual(textToList("Python, SQL\nPython\n Power BI "), ["Python", "SQL", "Power BI"]);
});

test("applies editable fields to a pending extracted skill profile", () => {
  const profile = applySkillProfileEdits({
    skillProfile: {
      provider: "gemini-2.5-flash",
      technicalSkills: ["Python"],
      softSkills: [],
      certifications: [],
      education: "Old education",
      confidence: 0.5,
      warnings: ["low confidence"],
    },
    edits: {
      technicalSkillsText: "Python, SQL",
      softSkillsText: "Communication",
      certificationsText: "Google Data Analytics",
      education: "UMS Year 3 Computer Science",
    },
  });

  assert.deepEqual(profile, {
    provider: "gemini-2.5-flash",
    technicalSkills: ["Python", "SQL"],
    softSkills: ["Communication"],
    certifications: ["Google Data Analytics"],
    education: "UMS Year 3 Computer Science",
    confidence: 0.5,
    warnings: ["low confidence"],
  });
});

test("converts list to editable text", () => {
  assert.equal(listToText(["Python", "SQL"]), "Python\nSQL");
});
