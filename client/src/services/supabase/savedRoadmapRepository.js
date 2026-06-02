const SAVED_ROADMAPS_TABLE = "saved_roadmaps";

function isSupabaseAuthError(error) {
  return Boolean(error?.isAuthError) || Number(error?.status) === 401;
}

function failedResult(error, fallbackReason, extra = {}) {
  const authExpired = isSupabaseAuthError(error);
  return {
    ok: false,
    reason: authExpired
      ? "Supabase session expired. Sign in again to manage saved roadmaps."
      : error?.message ?? fallbackReason,
    authExpired,
    ...extra,
  };
}

function uniqueCompanies(jobMatches = []) {
  const seen = new Set();
  const companies = [];
  for (const match of jobMatches) {
    const company = String(match?.company || "").trim();
    if (company && !seen.has(company.toLowerCase())) {
      seen.add(company.toLowerCase());
      companies.push(company);
    }
  }
  return companies;
}

// Pure: turn the current app state into the row persisted as one history entry.
export function buildSavedRoadmap({ userId, careerTarget, analysis, roadmapPlan, title }) {
  const role = careerTarget?.role || "Career target";
  const region = careerTarget?.region || "";
  const generatedTitle = title || `${role}${region ? ` · ${region}` : ""}`;

  return {
    user_id: userId,
    title: generatedTitle,
    target_role: role,
    target_region: region,
    missing_skills: analysis?.missingSkills ?? [],
    companies: uniqueCompanies(analysis?.marketEvidence?.jobMatches),
    readiness_score: analysis?.readinessScore ?? 0,
    roadmap_items: roadmapPlan?.items ?? [],
    generation_basis: {
      basis: roadmapPlan?.basis ?? "",
      assumptions: roadmapPlan?.assumptions ?? [],
    },
  };
}

export async function saveRoadmap({ supabaseClient, record }) {
  if (!supabaseClient) {
    return { ok: false, reason: "Supabase is not configured.", roadmap: null };
  }

  const { data, error } = await supabaseClient.insert(SAVED_ROADMAPS_TABLE, record);
  if (error) {
    return failedResult(error, "Could not save the roadmap.", { roadmap: null });
  }

  return { ok: true, reason: "", roadmap: data };
}

export async function listSavedRoadmaps({ supabaseClient, userId }) {
  if (!supabaseClient) {
    return { ok: false, reason: "Supabase is not configured.", roadmaps: [] };
  }

  const { data, error } = await supabaseClient.list(SAVED_ROADMAPS_TABLE, {
    eq: { user_id: userId },
    order: "created_at.desc",
  });

  if (error) {
    return failedResult(error, "Could not load saved roadmaps.", { roadmaps: [] });
  }

  return { ok: true, reason: "", roadmaps: Array.isArray(data) ? data : [] };
}

export async function deleteSavedRoadmap({ supabaseClient, id }) {
  if (!supabaseClient) {
    return { ok: false, reason: "Supabase is not configured." };
  }

  const { error } = await supabaseClient.remove(SAVED_ROADMAPS_TABLE, { eq: { id } });
  if (error) {
    return failedResult(error, "Could not delete the roadmap.");
  }

  return { ok: true, reason: "" };
}
