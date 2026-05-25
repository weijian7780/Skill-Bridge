import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import {
  buildDiagnosticScoreDisplay,
  buildSkillEvidenceRows,
  getSkillEvidenceToggleLabel,
  getVisibleSkillEvidenceRows,
  shouldShowSkillEvidenceToggle,
} from "../services/analysis/analysisDiagnosticDisplay.js";
import {
  buildMarketJobTargetKey,
  buildMarketJobSearchTriggerKey,
  shouldReuseLoadedMarketJobs,
} from "../services/analysis/marketJobSearchState.js";
import {
  getCompanyMatchToggleLabel,
  getVisibleCompanyMatches,
  shouldShowCompanyMatchToggle,
} from "../services/analysis/companyMatchDisplay.js";
import { buildMarketEvidenceOverview } from "../services/analysis/marketEvidenceDisplay.js";
import { industryOptions } from "../services/career/industryOptions.js";
import {
  getRegionAnalysisCopy,
  getRegionOption,
  getRegionSearchValue,
  regionOptions,
} from "../services/career/regionOptions.js";
import {
  applySkillProfileEdits,
  buildCvExtractionDraft,
  buildLatestCvConfirmation,
  listToText,
} from "../services/cv/cvExtractionDraft.js";
import { uploadCv } from "../services/cv/cvApi.js";
import {
  SUPPORTED_CV_ACCEPT,
  SUPPORTED_CV_HELP_TEXT,
  SUPPORTED_CV_STATUS_TEXT,
} from "../services/cv/supportedCvFiles.js";
import { searchMarketJobs } from "../services/jobs/jobApi.js";
import { generateRoadmapFromAnalysis } from "../services/roadmap/roadmapApi.js";
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

function hasConfirmedProfile(skillProfile) {
  return (
    skillProfile?.provider &&
    skillProfile.provider !== "Not extracted yet"
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const {
    analysis,
    careerTarget,
    cvDocument,
    jobs,
    loadedJobTargetKey,
    jobStatus,
    setCareerTarget,
    setCvDocument,
    setJobs,
    setJobStatus,
    setLoadedJobTargetKey,
    setRoadmapPlan,
    setSkillProfile,
    skillProfile,
    syncStatus,
  } = useAppState();
  const [draft, setDraft] = useState(careerTarget);
  const [jobSearchAttempt, setJobSearchAttempt] = useState(0);
  const [showAllCompanyMatches, setShowAllCompanyMatches] = useState(false);
  const [showAllMissingSkills, setShowAllMissingSkills] = useState(false);
  const [roadmapGenerationStatus, setRoadmapGenerationStatus] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const [cvStatus, setCvStatus] = useState(SUPPORTED_CV_STATUS_TEXT);
  const [isCvLoading, setIsCvLoading] = useState(false);
  const [pendingDraft, setPendingDraft] = useState(null);
  const [edits, setEdits] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const lastJobSearchKey = useRef("");

  const displayName = session?.user?.email?.split("@")[0] || "Student";
  const isReady = analysis.status === "ready";
  const hasConfirmedCv = analysis.status !== "needs_cv";
  const missingSkills = analysis.missingSkills;
  const matchedSkills = analysis.matchedSkills;
  const regionOption = getRegionOption(careerTarget.region);
  const regionSearchValue = getRegionSearchValue(careerTarget.region);
  const regionAnalysisCopy = getRegionAnalysisCopy(careerTarget.region);
  const suggestedRole = suggestTargetRole({ careerTarget, skillProfile });
  const savedTechnicalSkills = skillProfile.technicalSkills ?? [];
  const confirmedCvSkills = [
    ...(skillProfile.technicalSkills ?? []),
    ...(skillProfile.softSkills ?? []),
    ...(skillProfile.certifications ?? []),
  ].filter(Boolean);
  const hasLoadedProviderJobs = (analysis.marketEvidence.rawJobCount ?? 0) > 0;
  const hasLoadedUnusableMarketJobs = analysis.status === "needs_market" && hasLoadedProviderJobs;
  const scoreDisplay = useMemo(
    () => buildDiagnosticScoreDisplay({ analysis, careerTarget }),
    [analysis, careerTarget],
  );
  const matchedSkillRows = useMemo(
    () =>
      buildSkillEvidenceRows({
        skills: matchedSkills,
        skillDemand: analysis.marketEvidence.skillDemand,
        jobMatches: analysis.marketEvidence.jobMatches,
        evidenceKey: "matchedSkills",
      }),
    [analysis.marketEvidence.jobMatches, analysis.marketEvidence.skillDemand, matchedSkills],
  );
  const missingSkillRows = useMemo(
    () =>
      buildSkillEvidenceRows({
        skills: missingSkills,
        skillDemand: analysis.marketEvidence.skillDemand,
        jobMatches: analysis.marketEvidence.jobMatches,
        evidenceKey: "missingSkills",
      }),
    [analysis.marketEvidence.jobMatches, analysis.marketEvidence.skillDemand, missingSkills],
  );
  const visibleMissingSkillRows = useMemo(
    () => getVisibleSkillEvidenceRows(missingSkillRows, { showAll: showAllMissingSkills }),
    [missingSkillRows, showAllMissingSkills],
  );
  const showMissingSkillToggle = useMemo(
    () => shouldShowSkillEvidenceToggle(missingSkillRows),
    [missingSkillRows],
  );
  const marketEvidenceOverview = useMemo(
    () =>
      buildMarketEvidenceOverview({
        careerTarget,
        cvDocument,
        jobs,
        relevantJobCount: analysis.marketEvidence.jobCount,
        excludedJobCount: analysis.marketEvidence.excludedJobCount,
        skillDemand: analysis.marketEvidence.skillDemand,
      }),
    [analysis.marketEvidence.excludedJobCount, analysis.marketEvidence.jobCount, analysis.marketEvidence.skillDemand, careerTarget, cvDocument, jobs],
  );
  const allCompanyRequirementMatches = analysis.marketEvidence.jobMatches ?? [];
  const companyRequirementMatches = useMemo(
    () => getVisibleCompanyMatches(allCompanyRequirementMatches, { showAll: showAllCompanyMatches }),
    [allCompanyRequirementMatches, showAllCompanyMatches],
  );
  const showCompanyMatchToggle = useMemo(
    () => shouldShowCompanyMatchToggle(allCompanyRequirementMatches),
    [allCompanyRequirementMatches],
  );
  const jobTargetKey = useMemo(
    () => buildMarketJobTargetKey({
      role: careerTarget.role,
      industry: careerTarget.industry,
      regionSearchValue,
    }),
    [careerTarget.industry, careerTarget.role, regionSearchValue],
  );
  const jobSearchTriggerKey = useMemo(
    () => buildMarketJobSearchTriggerKey({
      hasConfirmedCv,
      role: careerTarget.role,
      industry: careerTarget.industry,
      regionSearchValue,
      jobSearchAttempt,
    }),
    [careerTarget.industry, careerTarget.role, hasConfirmedCv, jobSearchAttempt, regionSearchValue],
  );
  const reviewedSkillProfile = useMemo(() => {
    if (!pendingDraft || !edits) {
      return null;
    }

    return applySkillProfileEdits({
      skillProfile: pendingDraft.skillProfile,
      edits,
    });
  }, [edits, pendingDraft]);
  const searchStatusLabel = jobStatus?.startsWith("Loading")
    ? "Loading jobs..."
    : hasConfirmedCv
      ? "Analyze jobs"
      : "Save target";

  useEffect(() => {
    setDraft(careerTarget);
  }, [careerTarget]);

  useEffect(() => {
    if (!jobSearchTriggerKey) {
      return;
    }

    if (lastJobSearchKey.current === jobSearchTriggerKey) {
      return;
    }

    if (shouldReuseLoadedMarketJobs({
      jobSearchAttempt,
      jobs,
      loadedJobTargetKey,
      currentJobTargetKey: jobTargetKey,
      analysisStatus: analysis.status,
    })) {
      lastJobSearchKey.current = jobSearchTriggerKey;
      return;
    }

    let cancelled = false;
    lastJobSearchKey.current = jobSearchTriggerKey;
    setJobs([]);
    setLoadedJobTargetKey("");
    setJobStatus(`Loading market jobs for ${careerTarget.role} ${regionAnalysisCopy}...`);

    async function loadJobs() {
      try {
        const result = await searchMarketJobs({
          role: careerTarget.role,
          industry: careerTarget.industry,
          region: careerTarget.region,
          forceRefresh: jobSearchAttempt > 0,
        });

        if (cancelled) {
          return;
        }

        const loadedJobs = result.jobs ?? [];
        const providerName = result.source || "Job provider";
        const cacheLabel = result.cached ? "cached " : "";
        const locationPrecisionNote = buildLocationPrecisionNote({
          regionId: careerTarget.region,
          jobs: loadedJobs,
        });
        setJobs(loadedJobs);
        setLoadedJobTargetKey(jobTargetKey);
        setJobStatus(
          result.configured
            ? `Loaded ${loadedJobs.length} ${cacheLabel}${providerName} jobs for this target.${locationPrecisionNote}`
            : result.message || "Job API key not configured.",
        );
      } catch (error) {
        if (!cancelled) {
          setJobs([]);
          setLoadedJobTargetKey("");
          setJobStatus(error.message);
          lastJobSearchKey.current = "";
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [careerTarget.industry, careerTarget.region, careerTarget.role, jobSearchAttempt, jobSearchTriggerKey, jobTargetKey, regionAnalysisCopy, setJobStatus, setJobs, setLoadedJobTargetKey]);

  function saveTargetAndSearch(event) {
    event.preventDefault();

    const nextTarget = {
      ...draft,
      role: draft.role.trim() || careerTarget.role,
    };
    const targetUnchanged =
      nextTarget.role === careerTarget.role &&
      nextTarget.industry === careerTarget.industry &&
      nextTarget.region === careerTarget.region;

    setShowAllCompanyMatches(false);
    setShowAllMissingSkills(false);
    setCareerTarget(nextTarget);

    if (targetUnchanged && hasConfirmedCv) {
      setJobSearchAttempt((attempt) => attempt + 1);
    }
  }

  function retryJobSearch() {
    if (!hasConfirmedCv) {
      return;
    }

    setJobSearchAttempt((attempt) => attempt + 1);
  }

  function applySuggestion() {
    if (!suggestedRole) {
      return;
    }

    setDraft((current) => ({
      ...current,
      role: suggestedRole,
    }));
  }

  async function handleFile(file) {
    if (!file) return;
    setIsCvLoading(true);
    setPendingDraft(null);
    setEdits(null);
    setCvStatus(`Extracting ${file.name}...`);

    try {
      const result = await uploadCv(file);
      const extractionDraft = buildCvExtractionDraft({ file, uploadResult: result });
      setPendingDraft(extractionDraft);
      setEdits(buildEditState(extractionDraft.skillProfile));
      setCvStatus("Extraction complete. Review and confirm it as your latest CV.");
    } catch (error) {
      setCvStatus(error.message);
    } finally {
      setIsCvLoading(false);
    }
  }

  function handleDrop(event) {
    event.preventDefault();
    setIsDragging(false);
    handleFile(event.dataTransfer.files?.[0]);
  }

  function confirmLatestCv() {
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
    setCvStatus("Latest CV confirmed. Job matching will use this profile.");
    setJobSearchAttempt((attempt) => attempt + 1);
  }

  async function generateRoadmap() {
    if (!isReady) {
      return;
    }

    if (missingSkills.length === 0) {
      setRoadmapPlan({
        overview: "No missing market skills were detected for this target.",
        items: [],
        assumptions: [],
        confidence: 1,
        source: "deterministic",
      });
      navigate("/roadmap");
      return;
    }

    setIsGeneratingRoadmap(true);
    setRoadmapGenerationStatus("");

    try {
      const result = await generateRoadmapFromAnalysis({
        careerTarget,
        skillProfile,
        analysis,
      });
      setRoadmapPlan(result.roadmap);
      navigate("/roadmap");
    } catch (error) {
      setRoadmapGenerationStatus(error.message);
    } finally {
      setIsGeneratingRoadmap(false);
    }
  }

  return (
    <PageShell>
      <main className="pt-20 pb-32 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto">
        <section className="bg-surface-container border border-outline-variant rounded-xl p-sm md:p-md shadow-sm">
          <div className="mb-sm flex flex-col gap-xs md:flex-row md:items-end md:justify-between">
            <div>
              <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">SkillBridge workspace</p>
              <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface">
                Find jobs that match your CV
              </h1>
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                Hello, {displayName}. Search a target, upload a CV, and compare live job requirements in one page.
              </p>
            </div>
            <span className="inline-flex w-fit items-center gap-xs rounded-full bg-primary-container px-3 py-2 font-label-sm text-label-sm text-primary">
              <Icon name="location_on" className="text-[18px]" />
              {regionOption.label}
            </span>
          </div>

          <form className="grid grid-cols-1 gap-sm lg:grid-cols-[minmax(0,1.6fr)_minmax(220px,0.65fr)_auto]" onSubmit={saveTargetAndSearch}>
            <label className="relative block">
              <span className="sr-only">Target role</span>
              <Icon name="search" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <input
                className="h-14 w-full rounded-xl border border-outline-variant bg-surface-container-lowest pl-12 pr-4 font-body-lg text-body-lg text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                onChange={(event) => setDraft({ ...draft, role: event.target.value })}
                placeholder="Job title, keyword, or skill"
                value={draft.role}
              />
            </label>
            <label className="relative block">
              <span className="sr-only">Region preference</span>
              <Icon name="location_on" className="absolute left-4 top-1/2 -translate-y-1/2 text-primary" />
              <select
                className="h-14 w-full appearance-none rounded-xl border border-outline-variant bg-surface-container-lowest pl-12 pr-10 font-body-md text-body-md text-on-surface shadow-sm outline-none transition-all focus:border-primary focus:ring-4 focus:ring-primary/10"
                onChange={(event) => setDraft({ ...draft, region: event.target.value })}
                value={draft.region}
              >
                {regionOptions.map((region) => (
                  <option key={region.id} value={region.id}>{region.label}</option>
                ))}
              </select>
              <Icon name="expand_more" className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-variant" />
            </label>
            <button
              className="h-14 rounded-xl bg-primary px-xl font-label-md text-label-md font-bold text-on-primary shadow-sm transition-all hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary"
              type="submit"
            >
              {searchStatusLabel}
            </button>
          </form>

          <div className="mt-sm flex flex-col gap-sm lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-xs">
              <label className="inline-flex items-center gap-xs rounded-full border border-outline-variant bg-surface-container-lowest px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
                Industry
                <select
                  className="bg-transparent font-label-sm text-label-sm text-on-surface outline-none"
                  onChange={(event) => setDraft({ ...draft, industry: event.target.value })}
                  value={draft.industry}
                >
                  {industryOptions.map((industry) => (
                    <option key={industry.id} value={industry.id}>{industry.label}</option>
                  ))}
                </select>
              </label>
              {suggestedRole && (
                <button
                  className="inline-flex items-center gap-xs rounded-full border border-primary bg-primary-container px-3 py-2 font-label-sm text-label-sm text-primary transition-colors hover:bg-primary-container/80"
                  onClick={applySuggestion}
                  type="button"
                >
                  <Icon name="auto_awesome" className="text-[18px]" />
                  Try {suggestedRole}
                </button>
              )}
              <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high px-3 py-2 font-label-sm text-label-sm text-on-surface-variant">
                <Icon name={hasConfirmedCv ? "check_circle" : "pending"} className="text-[18px] text-primary" />
                {hasConfirmedCv ? "CV confirmed" : "CV required"}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">{jobStatus}</p>
          </div>
        </section>

        <div className="mt-gutter grid grid-cols-1 gap-gutter lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="space-y-gutter">
            <div className="grid grid-cols-1 gap-sm md:grid-cols-3">
              <SummaryCard
                icon="query_stats"
                label={scoreDisplay.label}
                value={scoreDisplay.value}
                detail={scoreDisplay.formula}
              />
              <SummaryCard
                icon="check_circle"
                label="Matched skills"
                value={matchedSkills.length}
                detail={matchedSkills.length > 0 ? "Found in current market jobs" : "No CV overlap detected yet"}
              />
              <SummaryCard
                icon="flag"
                label="Priority gaps"
                value={missingSkills.length}
                detail={missingSkills.length > 0 ? "Hard skills or tools to improve" : "No missing market skills yet"}
              />
            </div>

            <article className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div>
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Market diagnosis</p>
                <h2 className="mt-xs font-headline-lg text-headline-lg text-on-surface">
                  {scoreDisplay.diagnosisTitle}
                </h2>
                <p className="mt-xs max-w-3xl font-body-md text-body-md text-on-surface-variant">
                  {scoreDisplay.diagnosisHeadline}
                </p>
              </div>
              <div className="mt-sm grid grid-cols-1 gap-sm md:grid-cols-2">
                {scoreDisplay.diagnosisFacts.map((fact) => (
                  <div key={fact.label} className="rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {fact.label}
                    </p>
                    <p className="mt-xs font-body-sm text-body-sm text-on-surface">{fact.value}</p>
                  </div>
                ))}
              </div>
              <div className="mt-sm rounded-lg border border-primary/20 bg-primary-container/30 p-sm">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                  Priority interpretation
                </p>
                <p className="mt-xs font-body-sm text-body-sm text-on-surface">{scoreDisplay.priorityInterpretation}</p>
              </div>
            </article>

            <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="mb-md flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
                <div>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Recommended matches</p>
                  <h2 className="font-headline-lg text-headline-lg text-on-surface">Company requirement matches</h2>
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    Live job posts compared against your confirmed CV skills.
                  </p>
                </div>
                <div className="flex shrink-0 flex-col items-start gap-xs md:items-end">
                  <button
                    className="inline-flex items-center justify-center gap-xs rounded-xl border border-primary px-md py-sm font-label-md text-label-md text-primary transition-colors hover:bg-primary/5 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={!hasConfirmedCv}
                    onClick={retryJobSearch}
                    type="button"
                  >
                    <Icon name="refresh" className="text-[18px]" />
                    Refresh jobs
                  </button>
                  {companyRequirementMatches.length > 0 && (
                    <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                      Showing {companyRequirementMatches.length} of {allCompanyRequirementMatches.length}
                    </span>
                  )}
                </div>
              </div>

              {companyRequirementMatches.length === 0 ? (
                <EmptyMarketState
                  hasLoadedUnusableMarketJobs={hasLoadedUnusableMarketJobs}
                  hasConfirmedCv={hasConfirmedCv}
                  onSearch={retryJobSearch}
                />
              ) : (
                <>
                  <div className="space-y-sm">
                    {companyRequirementMatches.map((job) => (
                      <article key={job.id} className="rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md">
                        <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
                          <div className="min-w-0">
                            <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                              {job.company}
                            </p>
                            <h3 className="mt-xs font-headline-md text-headline-md text-on-surface">
                              {job.title}
                            </h3>
                            <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                              {[job.location, job.source].filter(Boolean).join(" | ")}
                            </p>
                            <div className="mt-xs flex flex-wrap gap-xs">
                              <ListingMeta icon="payments" label={job.salary || "Salary not stated"} />
                              {job.jobType && <ListingMeta icon="work" label={job.jobType} />}
                            </div>
                          </div>
                          <div className="w-fit rounded-xl border border-primary/30 bg-primary-container px-4 py-2 text-center">
                            <span className="block font-headline-md text-headline-md text-primary">
                              {job.matchScore === null ? "N/A" : `${job.matchScore}%`}
                            </span>
                            <span className="block font-label-sm text-label-sm text-on-surface-variant">
                              {job.matchScore === null ? "not scored" : job.matchLabel || "match"}
                            </span>
                          </div>
                        </div>

                        <div className="mt-sm grid grid-cols-1 gap-sm md:grid-cols-2">
                          <RequirementBlock title="Matched skills" skills={job.matchedSkills} emptyText="No matched skills detected" variant="matched" />
                          <RequirementBlock title="Missing skills" skills={job.missingSkills} emptyText="No missing skills detected" variant="missing" />
                        </div>

                        {job.requiredSkills.length > 0 && (
                          <div className="mt-sm flex flex-wrap gap-xs">
                            {job.requiredSkills.slice(0, 5).map((skill) => (
                              <span key={skill} className="skill-chip skill-chip-neutral">
                                {skill}
                              </span>
                            ))}
                            {job.requiredSkills.length > 5 && (
                              <span className="skill-chip skill-chip-neutral">
                                +{job.requiredSkills.length - 5} more
                              </span>
                            )}
                          </div>
                        )}

                        {job.url && (
                          <a
                            className="mt-md inline-flex items-center gap-xs font-label-md text-label-md text-primary hover:underline"
                            href={job.url}
                            rel="noreferrer"
                            target="_blank"
                          >
                            Open job post
                            <Icon name="open_in_new" className="text-[18px]" />
                          </a>
                        )}
                      </article>
                    ))}
                  </div>

                  {showCompanyMatchToggle && (
                    <div className="mt-md flex justify-center">
                      <button
                        className="inline-flex items-center gap-xs rounded-xl border border-primary px-6 py-3 font-label-md text-label-md text-primary transition-all hover:bg-primary/5 active:scale-[0.98]"
                        onClick={() => setShowAllCompanyMatches((current) => !current)}
                        type="button"
                      >
                        {getCompanyMatchToggleLabel(showAllCompanyMatches)}
                        <Icon name={showAllCompanyMatches ? "expand_less" : "expand_more"} />
                      </button>
                    </div>
                  )}
                </>
              )}
            </section>
          </section>

          <aside className="space-y-gutter lg:sticky lg:top-20 lg:self-start">
            <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="flex items-center gap-sm">
                <div className="grid h-10 w-10 place-items-center rounded-lg bg-primary-container text-primary">
                  <Icon name="upload_file" />
                </div>
                <div>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Latest CV</p>
                  <h2 className="font-headline-md text-headline-md text-on-surface">
                    {pendingDraft ? "Review extracted profile" : cvDocument ? "Profile saved" : "Upload CV"}
                  </h2>
                </div>
              </div>

              <label
                className={`mt-sm flex cursor-pointer flex-col items-center justify-center rounded-xl border border-dashed p-md text-center transition-colors ${
                  isDragging ? "border-primary bg-primary-container/40" : "border-outline-variant bg-surface-container-lowest hover:border-primary"
                }`}
                onDragLeave={() => setIsDragging(false)}
                onDragOver={(event) => {
                  event.preventDefault();
                  setIsDragging(true);
                }}
                onDrop={handleDrop}
              >
                <input accept={SUPPORTED_CV_ACCEPT} className="hidden" type="file" onChange={(event) => handleFile(event.target.files?.[0])} />
                <Icon name="cloud_upload" className="text-[32px] text-primary" />
                <p className="mt-xs font-label-md text-label-md text-on-surface">
                  {isCvLoading ? "Extracting..." : "Click or drag CV"}
                </p>
                <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{SUPPORTED_CV_HELP_TEXT}</p>
              </label>

              {cvDocument && !pendingDraft && (
                <div className="mt-sm rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Saved file</p>
                  <p className="mt-xs break-words font-label-md text-label-md text-on-surface">{cvDocument.fileName}</p>
                  <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                    {cvDocument.mimeType || "Unknown type"} - {formatBytes(cvDocument.sizeBytes)} - {cvDocument.textLength ?? 0} extracted characters
                  </p>
                  <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{syncStatus}</p>
                </div>
              )}

              {pendingDraft && edits && (
                <div className="mt-sm space-y-sm">
                  <div className="rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                    <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Pending file</p>
                    <p className="mt-xs break-words font-label-md text-label-md text-on-surface">{pendingDraft.cvDocument.fileName}</p>
                    <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                      {pendingDraft.cvDocument.mimeType} - {formatBytes(pendingDraft.cvDocument.sizeBytes)} - {pendingDraft.cvDocument.textLength} extracted characters
                    </p>
                  </div>
                  <CompactEditField
                    label="Education"
                    onChange={(value) => setEdits({ ...edits, education: value })}
                    value={edits.education}
                  />
                  <CompactTextArea
                    label="Technical skills"
                    onChange={(value) => setEdits({ ...edits, technicalSkillsText: value })}
                    value={edits.technicalSkillsText}
                  />
                  <CompactTextArea
                    label="Soft skills"
                    onChange={(value) => setEdits({ ...edits, softSkillsText: value })}
                    value={edits.softSkillsText}
                  />
                  {reviewedSkillProfile?.warnings?.length > 0 && (
                    <div className="space-y-xs rounded-lg border border-error/20 bg-error-container/20 p-sm font-body-sm text-body-sm text-error">
                      {reviewedSkillProfile.warnings.map((warning) => <p key={warning}>{warning}</p>)}
                    </div>
                  )}
                  <button
                    className="w-full rounded-xl bg-primary px-md py-sm font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-secondary active:scale-[0.98]"
                    onClick={confirmLatestCv}
                    type="button"
                  >
                    Confirm and analyze
                  </button>
                </div>
              )}

              <p className="mt-sm font-body-sm text-body-sm text-on-surface-variant">{cvStatus}</p>
              {!pendingDraft && savedTechnicalSkills.length > 0 && (
                <div className="mt-sm flex flex-wrap gap-xs">
                  {savedTechnicalSkills.slice(0, 8).map((skill) => (
                    <span key={skill} className="skill-chip skill-chip-positive">{skill}</span>
                  ))}
                </div>
              )}
            </section>

            <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between gap-sm">
                <div>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Priority gaps</p>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Market frequency</h2>
                </div>
                <Icon name="flag" className="text-primary" />
              </div>

              <div className="mt-sm space-y-sm">
                {visibleMissingSkillRows.map((row, index) => (
                  <div key={row.skill} className={`${index === 0 ? "border-orange-300 bg-orange-50" : "border-outline-variant bg-surface-container-low"} rounded-lg border p-sm`}>
                    <div className="flex items-start justify-between gap-sm">
                      <span className={`font-label-md text-label-md ${index === 0 ? "text-orange-700" : "text-on-surface"}`}>
                        {row.skill}
                      </span>
                      <span className="font-label-sm text-label-sm text-on-surface-variant">{row.countLabel}</span>
                    </div>
                    {row.companies.length > 0 && (
                      <div className="mt-xs flex flex-wrap gap-xs">
                        {row.companies.map((company) => (
                          <span key={company} className="skill-chip skill-chip-neutral">{company}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {missingSkillRows.length === 0 && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isReady
                      ? "No missing market job skills detected for the current target."
                      : hasLoadedUnusableMarketJobs
                        ? "Loaded jobs did not produce usable company requirements for this target."
                        : analysis.status === "needs_market"
                          ? "Load market jobs to calculate missing hard skills and tools."
                          : "Confirm a latest CV to calculate gaps."}
                  </p>
                )}
                {showMissingSkillToggle && (
                  <button
                    className="inline-flex w-full items-center justify-center gap-xs rounded-xl border border-primary px-4 py-3 font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
                    onClick={() => setShowAllMissingSkills((current) => !current)}
                    type="button"
                  >
                    {getSkillEvidenceToggleLabel(showAllMissingSkills)}
                    <Icon name={showAllMissingSkills ? "expand_less" : "expand_more"} />
                  </button>
                )}
              </div>
            </section>

            <section className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
              <div className="flex items-center justify-between gap-sm">
                <div>
                  <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">Roadmap</p>
                  <h2 className="font-headline-md text-headline-md text-on-surface">Build from detected gaps</h2>
                </div>
                <Icon name="map" className="text-primary" />
              </div>
              <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">
                {marketEvidenceOverview.subtitle}
              </p>
              <button
                className="mt-sm inline-flex w-full items-center justify-center gap-xs rounded-xl bg-primary px-md py-sm font-label-md text-label-md font-bold text-on-primary transition-colors hover:bg-secondary active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary"
                disabled={!isReady || isGeneratingRoadmap}
                onClick={generateRoadmap}
                type="button"
              >
                {isGeneratingRoadmap
                  ? "Generating..."
                  : missingSkills.length === 0
                    ? "Review no-gap result"
                    : "Build roadmap"}
                <Icon name="arrow_forward" className="text-[18px]" />
              </button>
              {roadmapGenerationStatus && (
                <p className="mt-sm font-body-sm text-body-sm text-error">{roadmapGenerationStatus}</p>
              )}
              {matchedSkillRows.length > 0 && (
                <div className="mt-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Matched evidence</p>
                  <div className="mt-xs flex flex-wrap gap-xs">
                    {matchedSkillRows.slice(0, 6).map((row) => (
                      <span key={row.skill} className="skill-chip skill-chip-positive">
                        {row.skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
              {confirmedCvSkills.length > 0 && matchedSkillRows.length === 0 && (
                <div className="mt-sm">
                  <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">CV skills</p>
                  <div className="mt-xs flex flex-wrap gap-xs">
                    {confirmedCvSkills.slice(0, 6).map((skill) => (
                      <span key={skill} className="skill-chip skill-chip-neutral">
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </section>
          </aside>
        </div>
      </main>
    </PageShell>
  );
}

function SummaryCard({ icon, label, value, detail }) {
  return (
    <article className="rounded-xl border border-outline-variant bg-surface-container p-sm shadow-sm">
      <div className="flex items-start gap-sm">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-primary-container text-primary">
          <Icon name={icon} />
        </div>
        <div className="min-w-0">
          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">{label}</p>
          <p className="mt-xs font-headline-md text-headline-md text-on-surface">{value}</p>
          <p className="mt-xs font-body-sm text-body-sm text-on-surface-variant">{detail}</p>
        </div>
      </div>
    </article>
  );
}

function ListingMeta({ icon, label }) {
  return (
    <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface">
      <Icon name={icon} className="text-[16px] text-primary" />
      {label}
    </span>
  );
}

function RequirementBlock({ title, skills, emptyText, variant = "default" }) {
  const chipClassName = {
    default: "skill-chip skill-chip-neutral",
    matched: "skill-chip skill-chip-positive",
    missing: "skill-chip skill-chip-warning",
  }[variant];

  return (
    <div className="rounded-lg bg-surface-container-low border border-outline-variant p-sm">
      <p className="mb-xs font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
        {title}
      </p>
      <div className="flex flex-wrap gap-xs">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span key={skill} className={chipClassName}>
              {skill}
            </span>
          ))
        ) : (
          <span className="font-body-sm text-body-sm text-on-surface-variant">{emptyText}</span>
        )}
      </div>
    </div>
  );
}

function EmptyMarketState({ hasLoadedUnusableMarketJobs, hasConfirmedCv, onSearch }) {
  return (
    <div className="rounded-xl border border-outline-variant bg-surface-container-lowest p-lg text-center">
      <div className="mx-auto grid h-12 w-12 place-items-center rounded-full bg-primary-container text-primary">
        <Icon name={hasConfirmedCv ? "search" : "upload_file"} />
      </div>
      <h3 className="mt-sm font-headline-md text-headline-md text-on-surface">
        {hasConfirmedCv ? "No company matches loaded" : "Upload CV to start analysis"}
      </h3>
      <p className="mx-auto mt-xs max-w-xl font-body-sm text-body-sm text-on-surface-variant">
        {hasLoadedUnusableMarketJobs
          ? "Jobs were loaded, but none produced usable hard-skill or tool requirements for this target. Try All Malaysia or a broader role keyword."
          : hasConfirmedCv
            ? "Click Analyze jobs to fetch live job requirements for the current target."
            : "The app needs a confirmed latest CV before it can compare your skills with market jobs."}
      </p>
      {hasConfirmedCv && (
        <button
          className="mt-sm inline-flex items-center gap-xs rounded-xl bg-primary px-md py-sm font-label-md text-label-md text-on-primary transition-colors hover:bg-secondary active:scale-[0.98]"
          onClick={onSearch}
          type="button"
        >
          Analyze jobs
          <Icon name="arrow_forward" className="text-[18px]" />
        </button>
      )}
    </div>
  );
}

function CompactEditField({ label, onChange, value }) {
  return (
    <label className="block space-y-xs">
      <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      <input
        className="w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function CompactTextArea({ label, onChange, value }) {
  return (
    <label className="block space-y-xs">
      <span className="font-label-sm text-label-sm text-on-surface-variant">{label}</span>
      <textarea
        className="min-h-20 w-full rounded-lg border border-outline-variant bg-surface-container-lowest px-sm py-sm text-on-surface outline-none focus:border-primary focus:ring-4 focus:ring-primary/10"
        onChange={(event) => onChange(event.target.value)}
        value={value}
      />
    </label>
  );
}

function suggestTargetRole({ careerTarget, skillProfile }) {
  if (!hasConfirmedProfile(skillProfile)) {
    return "";
  }

  const profileText = [
    ...(skillProfile.technicalSkills ?? []),
    ...(skillProfile.softSkills ?? []),
    ...(skillProfile.certifications ?? []),
    skillProfile.education ?? "",
  ].join(" ").toLowerCase();
  const currentRole = String(careerTarget?.role || "").toLowerCase();

  if (!profileText.trim()) {
    return "";
  }

  if (
    containsAny(profileText, ["figma", "adobe xd", "sketch", "invision", "user research", "ux design"]) &&
    !containsAny(currentRole, ["ui", "ux", "designer"])
  ) {
    return "UI/UX Designer";
  }

  if (
    containsAny(profileText, ["power bi", "business intelligence", "dashboard", "sql"]) &&
    !containsAny(currentRole, ["business intelligence", "bi analyst"])
  ) {
    return "Business Intelligence Analyst";
  }

  if (
    containsAny(profileText, ["react", "javascript", "typescript", "frontend"]) &&
    !containsAny(currentRole, ["frontend", "front end"])
  ) {
    return "Frontend Developer";
  }

  return "";
}

function containsAny(text, fragments) {
  return fragments.some((fragment) => text.includes(fragment));
}

function buildLocationPrecisionNote({ regionId, jobs = [] }) {
  if (!regionId || regionId === "all-malaysia" || jobs.length === 0) {
    return "";
  }

  const locations = uniqueNormalized(
    jobs.map((job) => job.location),
  );

  if (locations.length === 1 && locations[0] === "malaysia") {
    return " Provider returned Malaysia-wide locations, not state-specific locations.";
  }

  return "";
}

function uniqueNormalized(values = []) {
  return [...new Set(
    values
      .map((value) => String(value || "").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim())
      .filter(Boolean),
  )];
}
