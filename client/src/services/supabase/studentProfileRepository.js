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
  if (!cvDocument) {
    return null;
  }

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

function isSupabaseAuthError(error) {
  return Boolean(error?.isAuthError) || Number(error?.status) === 401;
}

function failedProfileResult(error, fallbackReason, extra = {}) {
  const authExpired = isSupabaseAuthError(error);

  return {
    ok: false,
    reason: authExpired
      ? "Supabase session expired. Sign in again to sync profile data."
      : error?.message ?? fallbackReason,
    authExpired,
    ...extra,
  };
}

export function buildStudentProfileSnapshot({
  userId,
  displayName = "",
  location = "",
  discoverable = false,
  university = "UMS",
  studyYear = "Year 3",
  program = "Computer Science",
  careerTarget,
  skillProfile,
  missingSkills,
  roadmap,
  cvDocument,
  readinessScore = 0,
  roadmapProgress = 0,
}) {
  return {
    user_id: userId,
    display_name: displayName,
    location: location,
    discoverable: discoverable,
    university: university,
    study_year: studyYear,
    program: program,
    career_target: {
      role: careerTarget?.role ?? "",
      region: careerTarget?.region ?? "",
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
    return failedProfileResult(error, "Could not save student profile snapshot.", {
      data: null,
    });
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
    return failedProfileResult(error, "Could not load student profile snapshot.", {
      snapshot: null,
    });
  }

  return {
    ok: true,
    reason: "",
    snapshot: data,
  };
}
