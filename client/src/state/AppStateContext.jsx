import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { buildSkillGapAnalysis } from "../services/analysis/skillGapEngine.js";
import { normaliseRegionId } from "../services/career/regionOptions.js";
import {
  buildStudentProfileSnapshot,
  loadStudentProfileSnapshot,
  saveStudentProfileSnapshot,
} from "../services/supabase/studentProfileRepository.js";
import { useAuth } from "./AuthContext.jsx";

const AppStateContext = createContext(null);

const initialTarget = {
  role: "Data Analyst",
  industry: "Data / IT",
  region: "all-malaysia",
  companyTypes: ["MNC", "Startup", "GLC"],
};

const initialSkillProfile = {
  provider: "Not extracted yet",
  technicalSkills: [],
  softSkills: [],
  certifications: [],
  education: "UMS Year 3 Computer Science",
  confidence: 0,
  warnings: [],
};

function toCareerTarget(snapshot) {
  const target = snapshot?.career_target ?? {};
  return {
    role: target.role ?? initialTarget.role,
    industry: target.industry ?? initialTarget.industry,
    region: normaliseRegionId(target.region ?? initialTarget.region),
    companyTypes: target.company_types ?? target.companyTypes ?? initialTarget.companyTypes,
  };
}

function toSkillProfile(snapshot) {
  const profile = snapshot?.skill_profile ?? {};
  return {
    provider: profile.provider ?? initialSkillProfile.provider,
    technicalSkills: profile.technical_skills ?? profile.technicalSkills ?? initialSkillProfile.technicalSkills,
    softSkills: profile.soft_skills ?? profile.softSkills ?? initialSkillProfile.softSkills,
    certifications: profile.certifications ?? initialSkillProfile.certifications,
    education: profile.education ?? initialSkillProfile.education,
    confidence: profile.confidence ?? initialSkillProfile.confidence,
    warnings: profile.warnings ?? initialSkillProfile.warnings,
  };
}

function toCvDocument(snapshot) {
  const document = snapshot?.cv_document;
  if (!document) {
    return null;
  }

  return {
    fileName: document.file_name ?? document.fileName ?? "",
    mimeType: document.mime_type ?? document.mimeType ?? "",
    sizeBytes: document.size_bytes ?? document.sizeBytes ?? 0,
    storagePath: document.storage_path ?? document.storagePath ?? "",
    textLength: document.text_length ?? document.textLength ?? 0,
  };
}

export function AppStateProvider({ children }) {
  const { session, supabaseConnection } = useAuth();
  const [careerTarget, setCareerTarget] = useState(initialTarget);
  const [skillProfile, setSkillProfile] = useState(initialSkillProfile);
  const [cvDocument, setCvDocument] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [jobStatus, setJobStatus] = useState("Job API key not configured");
  const [roadmapPlan, setRoadmapPlan] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Sign in to sync profile data.");
  const [loadedProfileFor, setLoadedProfileFor] = useState("");

  const analysis = useMemo(
    () => buildSkillGapAnalysis({ careerTarget, cvDocument, skillProfile, jobs }),
    [careerTarget, cvDocument, skillProfile, jobs],
  );

  const missingSkills = analysis.missingSkills;

  const roadmap = useMemo(
    () => roadmapPlan?.items ?? [],
    [roadmapPlan],
  );

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !supabaseConnection.configured) {
      setLoadedProfileFor("");
      setSyncStatus(userId ? "Supabase is not configured." : "Sign in to sync profile data.");
      return;
    }

    let cancelled = false;

    async function loadSnapshot() {
      setSyncStatus("Loading Supabase profile...");
      const result = await loadStudentProfileSnapshot({
        supabaseClient: supabaseConnection.client,
        userId,
      });

      if (cancelled) {
        return;
      }

      if (result.ok && result.snapshot) {
        setCareerTarget(toCareerTarget(result.snapshot));
        setSkillProfile(toSkillProfile(result.snapshot));
        setCvDocument(toCvDocument(result.snapshot));
        setSyncStatus("Supabase profile loaded.");
      } else if (result.ok) {
        setSyncStatus("No Supabase profile yet. New profile will be saved after changes.");
      } else {
        setSyncStatus(result.reason);
      }

      setLoadedProfileFor(userId);
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, supabaseConnection.client, supabaseConnection.configured]);

  useEffect(() => {
    const userId = session?.user?.id;
    if (!userId || !supabaseConnection.configured || loadedProfileFor !== userId) {
      return;
    }

    let cancelled = false;

    async function saveSnapshot() {
      const snapshot = buildStudentProfileSnapshot({
        userId,
        careerTarget,
        skillProfile,
        missingSkills,
        roadmap,
        cvDocument,
      });

      const result = await saveStudentProfileSnapshot({
        supabaseClient: supabaseConnection.client,
        snapshot,
      });

      if (!cancelled) {
        setSyncStatus(result.ok ? "Supabase profile saved." : result.reason);
      }
    }

    saveSnapshot();

    return () => {
      cancelled = true;
    };
  }, [
    careerTarget,
    cvDocument,
    loadedProfileFor,
    missingSkills,
    roadmap,
    session?.user?.id,
    skillProfile,
    supabaseConnection.client,
    supabaseConnection.configured,
  ]);

  const value = {
    careerTarget,
    setCareerTarget,
    cvDocument,
    setCvDocument,
    skillProfile,
    setSkillProfile,
    jobs,
    setJobs,
    jobStatus,
    setJobStatus,
    analysis,
    missingSkills,
    roadmap,
    roadmapPlan,
    setRoadmapPlan,
    syncStatus,
  };

  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>;
}

export function useAppState() {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used inside AppStateProvider");
  }
  return context;
}
