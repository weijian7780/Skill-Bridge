import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { buildRoadmap } from "../services/analysis/roadmapEngine.js";
import { buildSkillGapAnalysis } from "../services/analysis/skillGapEngine.js";
import {
  applySkillProfileEdits,
  buildCvExtractionDraft,
  buildLatestCvConfirmation,
  listToText,
} from "../services/cv/cvExtractionDraft.js";
import { uploadCv } from "../services/cv/cvApi.js";
import { SUPPORTED_CV_ACCEPT, SUPPORTED_CV_HELP_TEXT, SUPPORTED_CV_STATUS_TEXT } from "../services/cv/supportedCvFiles.js";
import { buildStudentProfileSnapshot } from "../services/supabase/studentProfileRepository.js";
import { useAppState } from "../state/AppStateContext.jsx";
import { useAuth } from "../state/AuthContext.jsx";

function formatBytes(bytes = 0) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function buildEditState(skillProfile) {
  return {
    education: skillProfile.education ?? "",
    technicalSkillsText: listToText(skillProfile.technicalSkills ?? []),
    softSkillsText: listToText(skillProfile.softSkills ?? []),
    certificationsText: listToText(skillProfile.certifications ?? []),
  };
}

export function CvUploadPage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const {
    careerTarget,
    cvDocument,
    setCvDocument,
    setRoadmapPlan,
    setSkillProfile,
    skillProfile,
    syncStatus,
  } = useAppState();
  const [status, setStatus] = useState(SUPPORTED_CV_STATUS_TEXT);
  const [isLoading, setIsLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [edits, setEdits] = useState(null);
  const [isDragging, setIsDragging] = useState(false);

  const reviewedSkillProfile = useMemo(() => {
    if (!pendingDraft || !edits) {
      return null;
    }

    return applySkillProfileEdits({
      skillProfile: pendingDraft.skillProfile,
      edits,
    });
  }, [edits, pendingDraft]);

  const previewJson = useMemo(() => {
    if (!pendingDraft || !reviewedSkillProfile) {
      return null;
    }

    const analysis = buildSkillGapAnalysis({
      careerTarget,
      cvDocument: pendingDraft.cvDocument,
      skillProfile: reviewedSkillProfile,
      jobs: [],
    });
    const missingSkills = analysis.missingSkills;
    return buildStudentProfileSnapshot({
      userId: session?.user?.id ?? "current-supabase-user",
      careerTarget,
      skillProfile: reviewedSkillProfile,
      missingSkills,
      roadmap: buildRoadmap(missingSkills),
      cvDocument: pendingDraft.cvDocument,
    });
  }, [careerTarget, pendingDraft, reviewedSkillProfile, session?.user?.id]);

  async function handleFile(file) {
    if (!file) return;
    setIsLoading(true);
    setPendingDraft(null);
    setEdits(null);
    setStatus(`Extracting ${file.name}...`);

    try {
      const result = await uploadCv(file);
      const draft = buildCvExtractionDraft({ file, uploadResult: result });
      setPendingDraft(draft);
      setEdits(buildEditState(draft.skillProfile));
      setStatus("Extraction complete. Review and confirm before saving as latest CV.");
    } catch (error) {
      setStatus(error.message);
    } finally {
      setIsLoading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function confirmLatestCv({ openAnalysis = false } = {}) {
    const confirmation = buildLatestCvConfirmation({
      pendingDraft,
      reviewedSkillProfile,
    });

    if (!confirmation) {
      return;
    }

    setSkillProfile(confirmation.skillProfile);
    setCvDocument(confirmation.cvDocument);
    setRoadmapPlan(null);
    setPendingDraft(null);
    setEdits(null);
    setStatus("Latest CV confirmed. Supabase sync will save this profile snapshot.");

    if (openAnalysis) {
      navigate("/analysis");
    }
  }

  const savedSkills = skillProfile.technicalSkills ?? [];

  return (
    <PageShell>
      <main className="pt-24 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1280px] mx-auto min-h-screen">
        <div className="mb-lg max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-sm">
            <span className="font-label-md text-label-md text-primary">Step 2 of 4</span>
            <span className="font-label-md text-label-md text-on-surface-variant">CV Analysis</span>
          </div>
          <div className="w-full bg-surface-container-highest h-1 rounded-full overflow-hidden">
            <div className="bg-primary h-full w-1/2 transition-all duration-700 ease-out" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-gutter">
          <section className="lg:col-span-7 flex flex-col gap-gutter">
            <div>
              <h1 className="font-headline-xl-mobile md:font-headline-xl text-headline-xl-mobile md:text-headline-xl text-on-surface mb-xs">
                Upload Your Latest CV
              </h1>
              <p className="font-body-lg text-body-lg text-on-surface-variant mb-lg">
                Extract your CV into a reviewable profile snapshot before saving it as your latest SkillBridge profile.
              </p>
            </div>

            <label
              className={`upload-dashed rounded-xl p-xl flex flex-col items-center justify-center text-center transition-all duration-300 group cursor-pointer ${isDragging ? "bg-surface-container border-primary" : "hover:bg-surface-container"}`}
              onDragLeave={() => setIsDragging(false)}
              onDragOver={(event) => {
                event.preventDefault();
                setIsDragging(true);
              }}
              onDrop={handleDrop}
            >
              <input accept={SUPPORTED_CV_ACCEPT} className="hidden" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
              <div className="w-16 h-16 rounded-full bg-surface-container-high flex items-center justify-center mb-md group-hover:bg-primary-container group-hover:text-on-primary-container transition-colors">
                <Icon name="upload_file" className="text-[32px]" />
              </div>
              <p className="font-headline-md text-headline-md mb-xs">Click or drag to upload</p>
              <p className="font-body-md text-body-md text-on-surface-variant mb-lg">{SUPPORTED_CV_HELP_TEXT}</p>
              <span className="bg-primary text-on-primary px-xl py-3 rounded-xl font-label-md text-label-md font-bold active:scale-95 transition-transform">
                {isLoading ? "Extracting..." : "Upload Latest CV"}
              </span>
            </label>

            <article className="bg-surface-container-low rounded-xl border border-outline-variant/30 p-md">
              <div className="flex items-start gap-sm">
                <Icon name="lock" className="text-primary" />
                <div>
                  <h2 className="font-label-md text-label-md text-on-surface">Privacy boundary</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                    The app stores CV metadata and extracted structured skills. It does not store raw CV text or raw LLM prompts in Supabase.
                  </p>
                </div>
              </div>
            </article>

            {cvDocument && !pendingDraft && (
              <article className="bg-surface-container border border-outline-variant rounded-xl p-md">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
                  <div>
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Saved latest CV</p>
                    <h2 className="font-headline-md text-headline-md text-on-surface mt-1">{cvDocument.fileName}</h2>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-1">
                      {cvDocument.mimeType || "Unknown type"} - {formatBytes(cvDocument.sizeBytes)} - {cvDocument.textLength ?? 0} extracted characters
                    </p>
                  </div>
                  <div className="flex items-center gap-sm">
                    <Icon name="cloud_done" className="text-primary" />
                    <button
                      className="rounded-lg bg-primary px-md py-sm font-label-md text-label-md text-on-primary active:scale-[0.98]"
                      onClick={() => navigate("/analysis")}
                      type="button"
                    >
                      Go to Analysis
                    </button>
                  </div>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">{syncStatus}</p>
              </article>
            )}
          </section>

          <aside className="lg:col-span-5">
            <div className={`bg-surface-container border border-outline-variant rounded-xl p-md sticky top-24 transition-opacity duration-500 ${pendingDraft || savedSkills.length > 0 ? "opacity-100" : "opacity-50"}`}>
              <div className="flex items-center gap-sm mb-md text-primary">
                <Icon name={pendingDraft ? "edit_note" : savedSkills.length > 0 ? "check_circle" : "pending"} filled />
                <h3 className="font-headline-md text-headline-md">
                  {pendingDraft ? "Review extracted CV JSON" : savedSkills.length > 0 ? "Latest CV profile saved" : "Waiting for CV upload"}
                </h3>
              </div>

              {!pendingDraft && savedSkills.length === 0 && (
                <div className="space-y-md">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Upload a CV to generate a structured profile snapshot.
                  </p>
                  <div className="p-md bg-surface-container-high rounded-lg border border-primary/20">
                    <p className="font-label-sm text-label-sm text-primary">{status}</p>
                    <p className="font-body-md text-body-md font-semibold mt-xs">No extracted profile yet</p>
                  </div>
                </div>
              )}

              {!pendingDraft && savedSkills.length > 0 && (
                <div className="space-y-lg">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-sm">Saved technical skills</p>
                    <div className="flex flex-wrap gap-xs">
                      {savedSkills.map((skill) => (
                        <span key={skill} className="px-3 py-1 border rounded-full font-label-md text-label-md bg-primary/10 text-primary border-primary/50">
                          {skill}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="p-md bg-surface-container-high rounded-lg border border-primary/20">
                    <p className="font-label-sm text-label-sm text-primary">{status}</p>
                    <p className="font-body-md text-body-md font-semibold mt-xs">{skillProfile.education}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">Extractor: {skillProfile.provider}</p>
                  </div>
                </div>
              )}

              {pendingDraft && edits && previewJson && (
                <div className="space-y-md">
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Pending latest CV</p>
                    <p className="font-body-md text-body-md text-on-surface mt-xs">{pendingDraft.cvDocument.fileName}</p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      {pendingDraft.cvDocument.mimeType} - {formatBytes(pendingDraft.cvDocument.sizeBytes)} - {pendingDraft.cvDocument.textLength} extracted characters
                    </p>
                  </div>

                  <label className="block space-y-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Education</span>
                    <input
                      className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface focus:border-primary focus:outline-none"
                      onChange={(event) => setEdits({ ...edits, education: event.target.value })}
                      value={edits.education}
                    />
                  </label>

                  <label className="block space-y-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Technical skills</span>
                    <textarea
                      className="min-h-24 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface focus:border-primary focus:outline-none"
                      onChange={(event) => setEdits({ ...edits, technicalSkillsText: event.target.value })}
                      value={edits.technicalSkillsText}
                    />
                  </label>

                  <label className="block space-y-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Soft skills</span>
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface focus:border-primary focus:outline-none"
                      onChange={(event) => setEdits({ ...edits, softSkillsText: event.target.value })}
                      value={edits.softSkillsText}
                    />
                  </label>

                  <label className="block space-y-xs">
                    <span className="font-label-sm text-label-sm text-on-surface-variant">Certifications</span>
                    <textarea
                      className="min-h-20 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface focus:border-primary focus:outline-none"
                      onChange={(event) => setEdits({ ...edits, certificationsText: event.target.value })}
                      value={edits.certificationsText}
                    />
                  </label>

                  <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-sm">
                    <div className="mb-xs flex items-center justify-between gap-sm">
                      <span className="font-label-sm text-label-sm text-primary">JSON to save</span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{reviewedSkillProfile.provider}</span>
                    </div>
                    <pre className="max-h-64 overflow-auto whitespace-pre-wrap break-words font-mono text-xs leading-relaxed text-on-surface-variant">
                      {JSON.stringify(previewJson, null, 2)}
                    </pre>
                  </div>

                  {reviewedSkillProfile.warnings?.length > 0 && (
                    <div className="font-body-sm text-body-sm text-error space-y-1">
                      {reviewedSkillProfile.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                    </div>
                  )}

                  <div className="flex flex-col sm:flex-row gap-sm">
                    <button className="flex-1 rounded-lg bg-primary px-md py-sm font-label-md text-label-md text-on-primary active:scale-[0.98]" onClick={() => confirmLatestCv()} type="button">
                      Confirm Latest CV
                    </button>
                    <button className="flex-1 rounded-lg border border-primary px-md py-sm font-label-md text-label-md text-primary active:scale-[0.98]" onClick={() => confirmLatestCv({ openAnalysis: true })} type="button">
                      Confirm and Analyze
                    </button>
                  </div>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">{status}</p>
                </div>
              )}
            </div>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}
