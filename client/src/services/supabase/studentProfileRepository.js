function sanitizeSkillProfile(skillProfile = {}) {
  return {
    provider: skillProfile.provider ?? "unknown",
    technical_skills: skillProfile.technicalSkills ?? [],
    soft_skills: skillProfile.softSkills ?? [],
    certifications: skillProfile.certifications ?? [],
    education: skillProfile.education ?? "",
    confidence: skillProfile.confidence ?? 0,
    warnings: skillProfile.warnings ?? [],
  };
}

function sanitizeCvDocument(cvDocument = {}) {
  if (!cvDocument.fileName && !cvDocument.storagePath) {
    return null;
  }

  return {
    file_name: cvDocument.fileName ?? "",
    mime_type: cvDocument.mimeType ?? "",
    size_bytes: cvDocument.sizeBytes ?? 0,
    storage_path: cvDocument.storagePath ?? "",
    text_length: cvDocument.textLength ?? 0,
  };
}

function sanitizeRoadmapItems(roadmap = []) {
  return roadmap.map((item) => ({
    title: item.title ?? "",
    status: item.status ?? "upcoming",
    reason: item.reason ?? "",
    resource: item.resource ?? "",
  }));
}

export function buildStudentProfileSnapshot({
  userId,
  careerTarget,
  skillProfile,
  missingSkills,
  roadmap,
  cvDocument,
  readinessScore = 68,
  roadmapProgress = 25,
}) {
  return {
    user_id: userId,
    university: "UMS",
    study_year: "Year 3",
    program: "Computer Science",
    career_target: {
      role: careerTarget?.role ?? "",
      industry: careerTarget?.industry ?? "",
      region: careerTarget?.region ?? "",
      company_types: careerTarget?.companyTypes ?? [],
    },
    skill_profile: sanitizeSkillProfile(skillProfile),
    missing_skills: missingSkills ?? [],
    roadmap_items: sanitizeRoadmapItems(roadmap),
    cv_document: sanitizeCvDocument(cvDocument),
    readiness_score: readinessScore,
    roadmap_progress: roadmapProgress,
  };
}

export async function saveStudentProfileSnapshot({ supabaseClient, snapshot }) {
  if (!supabaseClient) {
    return {
      ok: false,
      reason: "Supabase is not configured.",
      data: null,
    };
  }

  const { data, error } = await supabaseClient.upsert(
    "student_profile_snapshots",
    snapshot,
    { onConflict: "user_id" },
  );

  if (error) {
    return {
      ok: false,
      reason: error.message,
      data: null,
    };
  }

  return {
    ok: true,
    reason: "",
    data,
  };
}

export async function loadStudentProfileSnapshot({ supabaseClient, userId }) {
  if (!supabaseClient) {
    return {
      ok: false,
      reason: "Supabase is not configured.",
      snapshot: null,
    };
  }

  const { data, error } = await supabaseClient.select(
    "student_profile_snapshots",
    { eq: { user_id: userId } },
  );

  if (error) {
    return {
      ok: false,
      reason: error.message ?? "Could not load student profile snapshot.",
      snapshot: null,
    };
  }

  return {
    ok: true,
    reason: "",
    snapshot: data,
  };
}
