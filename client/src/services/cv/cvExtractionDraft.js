export function textToList(value) {
  const seen = new Set();
  return String(value ?? "")
    .split(/[,\n]/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter((item) => {
      const key = item.toLowerCase();
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
}

export function listToText(list = []) {
  return list.join("\n");
}

export function buildCvExtractionDraft({ file, uploadResult }) {
  const skillProfile = uploadResult.skillProfile ?? {};
  return {
    cvDocument: {
      fileName: uploadResult.document?.filename ?? file.name,
      mimeType: uploadResult.document?.mimeType ?? file.type,
      sizeBytes: file.size,
      storagePath: "",
      textLength: uploadResult.document?.textLength ?? 0,
    },
    skillProfile: {
      provider: skillProfile.provider ?? "unknown",
      technicalSkills: skillProfile.technicalSkills ?? [],
      softSkills: skillProfile.softSkills ?? [],
      certifications: skillProfile.certifications ?? [],
      education: skillProfile.education ?? "",
      confidence: skillProfile.confidence ?? 0,
      warnings: skillProfile.warnings ?? [],
    },
  };
}

export function applySkillProfileEdits({ skillProfile, edits }) {
  return {
    provider: skillProfile.provider,
    technicalSkills: textToList(edits.technicalSkillsText),
    softSkills: textToList(edits.softSkillsText),
    certifications: textToList(edits.certificationsText),
    education: edits.education.trim(),
    confidence: skillProfile.confidence,
    warnings: skillProfile.warnings ?? [],
  };
}

export function buildLatestCvConfirmation({ pendingDraft, reviewedSkillProfile }) {
  if (!pendingDraft || !reviewedSkillProfile) {
    return null;
  }

  return {
    cvDocument: pendingDraft.cvDocument,
    skillProfile: reviewedSkillProfile,
  };
}
