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

// Distinct student ids who applied to this employer's own job posts.
async function getApplicantStudentIds({ url, serviceRoleKey, fetchImpl }, employerId) {
  const jobsUrl = new URL("/rest/v1/job_posts", url);
  jobsUrl.searchParams.set("employer_id", `eq.${employerId}`);
  jobsUrl.searchParams.set("select", "id");
  const jobsRes = await fetchImpl(jobsUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
  if (!jobsRes.ok) throw new Error(`Supabase error: ${jobsRes.status}`);
  const jobs = await jobsRes.json();
  if (!jobs.length) return [];

  const jobIds = jobs.map((job) => job.id);
  const appsUrl = new URL("/rest/v1/applications", url);
  appsUrl.searchParams.set("job_id", `in.(${jobIds.join(",")})`);
  appsUrl.searchParams.set("select", "student_id");
  const appsRes = await fetchImpl(appsUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
  if (!appsRes.ok) throw new Error(`Supabase error: ${appsRes.status}`);
  const apps = await appsRes.json();

  return [...new Set(apps.map((app) => app.student_id))];
}

// A candidate's certificates, each with a short-lived signed URL for viewing.
// Best-effort: if storage/signing fails the rest of the profile still loads.
async function getCandidateCertificates({ url, serviceRoleKey, fetchImpl }, studentId) {
  try {
    const certUrl = new URL("/rest/v1/student_certificates", url);
    certUrl.searchParams.set("user_id", `eq.${studentId}`);
    certUrl.searchParams.set("select", "id,title,storage_path,file_name,skill_tags");
    certUrl.searchParams.set("order", "created_at.desc");
    const res = await fetchImpl(certUrl.toString(), { headers: serviceHeaders(serviceRoleKey) });
    if (!res.ok) return [];
    const rows = await res.json();

    return await Promise.all(
      rows.map(async (cert) => {
        let viewUrl = "";
        try {
          const signRes = await fetchImpl(`${url}/storage/v1/object/sign/certificates/${cert.storage_path}`, {
            method: "POST",
            headers: serviceHeaders(serviceRoleKey),
            body: JSON.stringify({ expiresIn: 3600 }),
          });
          if (signRes.ok) {
            const signed = await signRes.json();
            viewUrl = `${url}/storage/v1${signed.signedURL}`;
          }
        } catch {
          // ignore signing failure for this certificate
        }
        return { id: cert.id, title: cert.title || cert.file_name, url: viewUrl, skills: cert.skill_tags ?? [] };
      }),
    );
  } catch {
    return [];
  }
}

// GET /  ?skill=&location=  -> search the employer's OWN applicants
candidatesRouter.get("/", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const { skill, location } = request.query;

  try {
    const studentIds = await getApplicantStudentIds(request.supabase, employerId);
    if (studentIds.length === 0) {
      return response.json({ ok: true, candidates: [] });
    }

    const fetchUrl = new URL("/rest/v1/student_profile_snapshots", url);
    fetchUrl.searchParams.set("user_id", `in.(${studentIds.join(",")})`);
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

// GET /:id  -> verified skill profile for one of the employer's applicants
candidatesRouter.get("/:id", async (request, response) => {
  const { url, serviceRoleKey, fetchImpl } = request.supabase;
  const employerId = request.user.id;
  const studentId = request.params.id;

  try {
    const studentIds = await getApplicantStudentIds(request.supabase, employerId);
    if (!studentIds.includes(studentId)) {
      return response.status(404).json({ error: "Candidate not found among your applicants" });
    }

    const fetchUrl = new URL("/rest/v1/student_profile_snapshots", url);
    fetchUrl.searchParams.set("user_id", `eq.${studentId}`);
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
      return response.status(404).json({ error: "Candidate profile not found" });
    }

    const row = rows[0];
    const skillProfile = row.skill_profile || {};
    const certificates = await getCandidateCertificates(request.supabase, studentId);

    response.json({
      ok: true,
      candidate: {
        certificates,
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
