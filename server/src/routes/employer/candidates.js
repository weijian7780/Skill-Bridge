import { Router } from "express";

export const candidatesRouter = Router();

const VERIFY_CONFIDENCE_THRESHOLD = 0.5;

function serviceHeaders(serviceRoleKey) {
  return {
    apikey: serviceRoleKey,
    Authorization: `Bearer ${serviceRoleKey}`,
    "Content-Type": "application/json",
  };
}

function isVerified(skillProfile) {
  return (
    String(skillProfile?.provider || "").toLowerCase().includes("gemini") &&
    Number(skillProfile?.confidence ?? 0) >= VERIFY_CONFIDENCE_THRESHOLD
  );
}

function allSkills(skillProfile) {
  return [
    ...(skillProfile?.technical_skills ?? []),
    ...(skillProfile?.soft_skills ?? []),
  ];
}

function toCandidateCard(row) {
  return {
    id: row.user_id,
    name: row.display_name || "Candidate",
    location: row.location || "",
    university: row.university || "",
    program: row.program || "",
    readiness: row.readiness_score ?? 0,
    skills: allSkills(row.skill_profile).slice(0, 12),
    verified: isVerified(row.skill_profile),
  };
}

// GET /  ?skill=&location=  -> search discoverable candidates
candidatesRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const { skill, location } = request.query;

  try {
    const fetchUrl = new URL("/rest/v1/student_profile_snapshots", url);
    fetchUrl.searchParams.set("discoverable", "eq.true");
    fetchUrl.searchParams.set(
      "select",
      "user_id,display_name,location,university,program,readiness_score,skill_profile",
    );
    if (location && location !== "all-malaysia") {
      fetchUrl.searchParams.set("location", `eq.${location}`);
    }

    const res = await fetchImpl(fetchUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    let rows = await res.json();

    // Skills live inside the skill_profile JSONB, so filter by skill in-process.
    if (skill) {
      const needle = String(skill).toLowerCase();
      rows = rows.filter((row) =>
        allSkills(row.skill_profile).some((value) => String(value).toLowerCase().includes(needle)),
      );
    }

    response.json({ ok: true, candidates: rows.map(toCandidateCard) });
  } catch (error) {
    console.error("Failed to search candidates:", error);
    response.status(500).json({ error: "Failed to search candidates" });
  }
});

// GET /:id  -> full verified skill profile for one discoverable candidate
candidatesRouter.get("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const studentId = request.params.id;

  try {
    const fetchUrl = new URL("/rest/v1/student_profile_snapshots", url);
    fetchUrl.searchParams.set("user_id", `eq.${studentId}`);
    fetchUrl.searchParams.set("discoverable", "eq.true");
    fetchUrl.searchParams.set(
      "select",
      "user_id,display_name,location,university,program,study_year,readiness_score,skill_profile,career_target",
    );

    const res = await fetchImpl(fetchUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
    if (!res.ok) {
      throw new Error(`Supabase error: ${res.status}`);
    }

    const rows = await res.json();
    if (!rows.length) {
      return response.status(404).json({ error: "Candidate not found or not discoverable" });
    }

    const row = rows[0];
    const skillProfile = row.skill_profile || {};

    response.json({
      ok: true,
      candidate: {
        id: row.user_id,
        name: row.display_name || "Candidate",
        location: row.location || "",
        university: row.university || "",
        program: row.program || "",
        studyYear: row.study_year || "",
        readiness: row.readiness_score ?? 0,
        verified: isVerified(skillProfile),
        targetRole: row.career_target?.role ?? "",
        skillProfile: {
          provider: skillProfile.provider ?? "",
          technicalSkills: skillProfile.technical_skills ?? [],
          softSkills: skillProfile.soft_skills ?? [],
          certifications: skillProfile.certifications ?? [],
          education: skillProfile.education ?? "",
          confidence: skillProfile.confidence ?? 0,
        },
      },
    });
  } catch (error) {
    console.error("Failed to fetch candidate:", error);
    response.status(500).json({ error: "Failed to fetch candidate" });
  }
});
