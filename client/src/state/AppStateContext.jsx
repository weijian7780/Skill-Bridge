import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import { buildSkillGapAnalysis } from "../services/analysis/skillGapEngine.js";
import { normaliseRegionId } from "../services/career/regionOptions.js";
import {
  buildStudentProfileSnapshot,
  loadStudentProfileSnapshot,
  saveStudentProfileSnapshot,
} from "../services/supabase/studentProfileRepository.js";
import { resolveProfileSaveIntent } from "../services/supabase/profileSnapshotSync.js";
import { useAuth } from "./AuthContext.jsx";

const AppStateContext = createContext(null);

const initialTarget = {
  role: "Data Analyst",
  region: "all-malaysia",
};

const initialSkillProfile = {
  provider: "Not extracted yet",
  technicalSkills: [],
  softSkills: [],
  certifications: [],
  education: "",
  confidence: 0,
  warnings: [],
};

function toCareerTarget(snapshot) {
  const target = snapshot?.career_target ?? {};
  return {
    role: target.role ?? initialTarget.role,
    region: normaliseRegionId(target.region ?? initialTarget.region),
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

function calculateRoadmapProgress(roadmap = []) {
  if (roadmap.length === 0) {
    return 0;
  }

  const completedCount = roadmap.filter((item) => {
    const status = String(item.status || "").toLowerCase();
    return status === "completed" || status === "done";
  }).length;

  return Math.round((completedCount / roadmap.length) * 100);
}

export function AppStateProvider({ children }) {
  const { expireSession, session, supabaseConnection } = useAuth();
  const [careerTarget, setCareerTargetState] = useState(initialTarget);
  const [skillProfile, setSkillProfile] = useState(initialSkillProfile);
  const [cvDocument, setCvDocument] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [loadedJobTargetKey, setLoadedJobTargetKey] = useState("");
  const [jobStatus, setJobStatus] = useState("Job API key not configured");
  const [roadmapPlan, setRoadmapPlan] = useState(null);
  const [syncStatus, setSyncStatus] = useState("Sign in to sync profile data.");
  const [loadedProfileFor, setLoadedProfileFor] = useState("");
  const skipProfileSaveFor = useRef("");

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
      skipProfileSaveFor.current = "";
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
        setCareerTargetState(toCareerTarget(result.snapshot));
        setSkillProfile(toSkillProfile(result.snapshot));
        setCvDocument(toCvDocument(result.snapshot));
        setSyncStatus("Supabase profile loaded.");
        skipProfileSaveFor.current = userId;
        setLoadedProfileFor(userId);
      } else if (result.ok) {
        setSyncStatus("No Supabase profile yet. New profile will be saved after changes.");
        skipProfileSaveFor.current = userId;
        setLoadedProfileFor(userId);
      } else {
        setLoadedProfileFor("");
        skipProfileSaveFor.current = "";
        setSyncStatus(result.reason);
        if (result.authExpired) {
          expireSession(result.reason);
        }
      }
    }

    loadSnapshot();

    return () => {
      cancelled = true;
    };
  }, [expireSession, session?.user?.id, supabaseConnection.client, supabaseConnection.configured]);

  useEffect(() => {
    const userId = session?.user?.id;
    const saveIntent = resolveProfileSaveIntent({
      userId,
      supabaseConfigured: supabaseConnection.configured,
      loadedProfileFor,
      skipProfileSaveFor: skipProfileSaveFor.current,
    });
    skipProfileSaveFor.current = saveIntent.nextSkipProfileSaveFor;

    if (!saveIntent.shouldSave) {
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
        readinessScore: analysis.readinessScore,
        roadmapProgress: calculateRoadmapProgress(roadmap),
      });

      const result = await saveStudentProfileSnapshot({
        supabaseClient: supabaseConnection.client,
        snapshot,
      });

      if (!cancelled) {
        if (result.ok) {
          setSyncStatus("Supabase profile saved.");
        } else {
          setSyncStatus(result.reason);
          if (result.authExpired) {
            setLoadedProfileFor("");
            expireSession(result.reason);
          }
        }
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
    analysis.readinessScore,
    expireSession,
    session?.user?.id,
    skillProfile,
    supabaseConnection.client,
    supabaseConnection.configured,
  ]);

  function setCareerTarget(nextTarget) {
    setCareerTargetState(nextTarget);
    setJobs([]);
    setLoadedJobTargetKey("");
    setRoadmapPlan(null);
    setJobStatus("Career target changed. Confirm a latest CV or analyze jobs to load matching market jobs.");
  }

  const value = {
    careerTarget,
    setCareerTarget,
    cvDocument,
    setCvDocument,
    skillProfile,
    setSkillProfile,
    jobs,
    setJobs,
    loadedJobTargetKey,
    setLoadedJobTargetKey,
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
