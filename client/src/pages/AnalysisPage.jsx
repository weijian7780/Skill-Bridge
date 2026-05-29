import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import {
  buildAnalysisActionLabel,
  buildMarketRefreshActionLabel,
} from "../services/analysis/analysisStatusCopy.js";
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
import { getRegionAnalysisCopy, getRegionSearchValue } from "../services/career/regionOptions.js";
import { searchMarketJobs } from "../services/jobs/jobApi.js";
import { generateRoadmapFromAnalysis } from "../services/roadmap/roadmapApi.js";
import { useAppState } from "../state/AppStateContext.jsx";

export function AnalysisPage() {
  const {
    analysis,
    careerTarget,
    cvDocument,
    jobs,
    loadedJobTargetKey,
    jobStatus,
    setLoadedJobTargetKey,
    setJobs,
    setJobStatus,
    setRoadmapPlan,
    skillProfile,
  } = useAppState();
  const navigate = useNavigate();
  const [jobSearchAttempt, setJobSearchAttempt] = useState(0);
  const [showAllCompanyMatches, setShowAllCompanyMatches] = useState(false);
  const [showAllMissingSkills, setShowAllMissingSkills] = useState(false);
  const [roadmapGenerationStatus, setRoadmapGenerationStatus] = useState("");
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  const lastJobSearchKey = useRef("");
  const isReady = analysis.status === "ready";
  const hasConfirmedCv = analysis.status !== "needs_cv";
  const missingSkills = analysis.missingSkills;
  const matchedSkills = analysis.matchedSkills;
  const confirmedCvSkills = [
    ...(skillProfile.technicalSkills ?? []),
    ...(skillProfile.softSkills ?? []),
    ...(skillProfile.certifications ?? []),
  ].filter(Boolean);
  const hasLoadedProviderJobs = (analysis.marketEvidence.rawJobCount ?? 0) > 0;
  const hasLoadedUnusableMarketJobs = analysis.status === "needs_market" && hasLoadedProviderJobs;
  const actionLabel = buildAnalysisActionLabel({
    analysisStatus: analysis.status,
    jobStatus,
  });
  const refreshActionLabel = buildMarketRefreshActionLabel({
    analysisStatus: analysis.status,
    jobStatus,
  });
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
    [analysis.marketEvidence.skillDemand, careerTarget, cvDocument, jobs],
  );
  const regionSearchValue = getRegionSearchValue(careerTarget.region);
  const regionAnalysisCopy = getRegionAnalysisCopy(careerTarget.region);
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
      regionSearchValue,
    }),
    [careerTarget.role, regionSearchValue],
  );
  const jobSearchTriggerKey = useMemo(
    () => buildMarketJobSearchTriggerKey({
      hasConfirmedCv,
      role: careerTarget.role,
      regionSearchValue,
      jobSearchAttempt,
    }),
    [careerTarget.role, hasConfirmedCv, jobSearchAttempt, regionSearchValue],
  );

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
          region: careerTarget.region,
          forceRefresh: jobSearchAttempt > 0,
        });

        if (cancelled) {
          return;
        }

        const loadedJobs = result.jobs ?? [];
        const providerName = result.source || "Job provider";
        const cacheLabel = result.cached ? "cached " : "";
        setJobs(loadedJobs);
        setLoadedJobTargetKey(jobTargetKey);
        setJobStatus(
          result.configured
            ? `Loaded ${loadedJobs.length} ${cacheLabel}${providerName} jobs for this target.`
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
  }, [careerTarget.role, jobSearchAttempt, jobSearchTriggerKey, jobTargetKey, regionAnalysisCopy, regionSearchValue, setJobStatus, setJobs, setLoadedJobTargetKey]);

  function retryJobSearch() {
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
      <main className="pt-24 px-margin-mobile md:px-margin-desktop max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex flex-col">
            <span className="font-label-sm text-label-sm text-on-surface-variant mb-1">ANALYSIS PHASE</span>
            <h2 className="font-headline-lg text-headline-lg text-on-surface">Step 3 of 4</h2>
          </div>
          <div className="flex gap-2">
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="w-12 h-1 bg-primary rounded-full" />
            <div className="w-12 h-1 bg-surface-container-high rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-gutter">
          <section className="md:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center shadow-sm">
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-6 uppercase tracking-wider">{scoreDisplay.label}</h3>
            <div className="radial-progress relative mb-4" style={{ "--value": scoreDisplay.isCalculated ? analysis.readinessScore : 0 }}>
              <span className={`${scoreDisplay.isCalculated ? "font-headline-xl text-headline-xl" : "font-headline-md text-headline-md"} text-primary`}>
                {scoreDisplay.value}
              </span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {scoreDisplay.formula}
            </p>
          </section>

          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between shadow-sm">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="query_stats" className="text-primary" />
                <h3 className="font-headline-md text-headline-md text-primary">{scoreDisplay.diagnosisTitle}</h3>
              </div>
              <p className="font-headline-lg text-headline-lg leading-relaxed text-on-surface">
                {scoreDisplay.diagnosisHeadline}
              </p>
              <div className="mt-md grid grid-cols-1 md:grid-cols-2 gap-sm">
                {scoreDisplay.diagnosisFacts.map((fact) => (
                  <div key={fact.label} className="rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                      {fact.label}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface">
                      {fact.value}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-sm rounded-lg border border-primary/20 bg-primary-container/10 p-sm">
                <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider mb-xs">
                  Priority interpretation
                </p>
                <p className="font-body-sm text-body-sm text-on-surface">
                  {scoreDisplay.priorityInterpretation}
                </p>
              </div>
            </div>
            <div className="mt-8 flex flex-col sm:flex-row justify-end gap-sm">
              {analysis.status === "needs_market" ? (
                <button
                  className="bg-primary hover:bg-secondary text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-primary"
                  disabled={!hasConfirmedCv}
                  onClick={retryJobSearch}
                >
                  <Icon name={hasLoadedProviderJobs ? "refresh" : "search"} />
                  {actionLabel}
                </button>
              ) : analysis.status === "ready" ? (
                <>
                  <button
                    className="border border-primary text-primary hover:bg-primary/10 px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center justify-center gap-2 disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isGeneratingRoadmap}
                    onClick={retryJobSearch}
                    type="button"
                  >
                    <Icon name="refresh" />
                    {refreshActionLabel}
                  </button>
                  <button
                    className="bg-primary hover:bg-secondary text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center justify-center gap-2 group disabled:cursor-not-allowed disabled:opacity-60"
                    disabled={isGeneratingRoadmap}
                    onClick={generateRoadmap}
                    type="button"
                  >
                    {isGeneratingRoadmap
                      ? "Generating Roadmap..."
                      : missingSkills.length === 0
                        ? "Review No-Gap Result"
                        : "Build Roadmap From These Gaps"}
                    <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                  </button>
                </>
              ) : (
                <Link className="bg-primary hover:bg-secondary text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center gap-2 group" to={isReady ? "/roadmap" : "/cv"}>
                  {actionLabel}
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
            {roadmapGenerationStatus && (
              <p className="mt-sm font-body-sm text-body-sm text-error">
                {roadmapGenerationStatus}
              </p>
            )}
          </section>

          <section className="md:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="check_circle" className="text-primary" />
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Matched Skills with Evidence</h3>
            </div>
            <div className="space-y-sm">
              {matchedSkillRows.map((row) => (
                <div key={row.skill} className="rounded-lg border border-primary/20 bg-primary-container/10 p-sm">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-xs">
                    <div className="flex items-center gap-xs text-primary">
                      <Icon name="verified" filled className="text-[16px]" />
                      <span className="font-label-md text-label-md">{row.skill}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{row.countLabel}</span>
                  </div>
                  {row.companies.length > 0 && (
                    <div className="flex flex-wrap gap-xs mt-xs">
                      {row.companies.map((company) => (
                        <span key={company} className="bg-surface-container-highest border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                          {company}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {matchedSkillRows.length === 0 && (
                <div className="space-y-sm">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {hasLoadedUnusableMarketJobs
                      ? "Jobs were loaded, but none produced scorable company requirements for this target."
                      : analysis.status === "needs_market"
                      ? "Market job skills have not loaded yet."
                      : isReady
                        ? "No CV skills matched the current market skills yet."
                        : "No confirmed CV skills yet."}
                  </p>
                  {isReady && confirmedCvSkills.length > 0 && (
                    <div className="flex flex-wrap gap-xs">
                      {confirmedCvSkills.slice(0, 8).map((skill) => (
                        <span key={skill} className="bg-surface-container-highest border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                          CV: {skill}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="flag" className="text-secondary" />
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Priority Gaps by Market Frequency</h3>
            </div>
            <div className="space-y-sm">
              {visibleMissingSkillRows.map((row, index) => (
                <div key={row.skill} className={`${index === 0 ? "border-orange-500/50 bg-orange-500/5" : "border-outline-variant bg-surface-container-low"} rounded-lg border p-sm`}>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-xs">
                    <div className={index === 0 ? "text-orange-400" : "text-on-surface"}>
                      <span className="font-label-md text-label-md">{row.skill}</span>
                    </div>
                    <span className="font-label-sm text-label-sm text-on-surface-variant">{row.countLabel}</span>
                  </div>
                  {row.companies.length > 0 && (
                    <div className="flex flex-wrap gap-xs mt-xs">
                      {row.companies.map((company) => (
                        <span key={company} className="bg-surface-container-highest border border-outline-variant text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                          {company}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
              {missingSkillRows.length === 0 && (
                <div className="flex flex-wrap gap-sm">
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isReady
                      ? "No missing market job skills detected for the current target."
                      : hasLoadedUnusableMarketJobs
                        ? "No gaps can be calculated because the loaded jobs produced no usable company requirements for this target."
                      : analysis.status === "needs_market"
                        ? "Market job skills are required before gaps can be calculated."
                        : "Confirm a latest CV to calculate gaps."}
                  </p>
                </div>
              )}
              {showMissingSkillToggle && (
                <div className="flex justify-center pt-xs">
                  <button
                    className="inline-flex items-center gap-xs border border-primary text-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:bg-primary/10 active:scale-95 transition-all"
                    onClick={() => setShowAllMissingSkills((current) => !current)}
                    type="button"
                  >
                    {getSkillEvidenceToggleLabel(showAllMissingSkills)}
                    <Icon name={showAllMissingSkills ? "expand_less" : "expand_more"} />
                  </button>
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-12 border border-outline-variant rounded-xl bg-surface-container p-md shadow-sm">
            <div className="flex flex-col gap-md">
              <div className="space-y-xs">
                <div className="flex items-center gap-2">
                  <Icon name="database" className="text-primary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">
                    {marketEvidenceOverview.title}
                  </h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {marketEvidenceOverview.subtitle}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                {marketEvidenceOverview.stats.map((stat) => (
                  <div key={stat.label} className="rounded-lg border border-outline-variant bg-surface-container-low p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      {stat.label}
                    </p>
                    <p className="font-headline-md text-headline-md text-on-surface mt-xs break-words">
                      {stat.value}
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      {stat.detail}
                    </p>
                  </div>
                ))}
              </div>

              <div className="rounded-lg border border-outline-variant bg-surface-container-lowest p-sm">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-sm">
                  <div>
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">
                      Top requirements from market jobs
                    </p>
                    <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                      Ranked by how often each skill appears in the loaded job posts.
                    </p>
                  </div>
                  <a className="inline-flex items-center gap-xs text-primary font-label-md text-label-md hover:underline" href="#company-matches">
                    Review companies
                    <Icon name="arrow_downward" className="text-[18px]" />
                  </a>
                </div>

                {marketEvidenceOverview.topDemandedSkills.length > 0 ? (
                  <div className="mt-sm flex flex-wrap gap-xs">
                    {marketEvidenceOverview.topDemandedSkills.map(({ skill, count }) => (
                      <span key={skill} className="inline-flex items-center gap-xs bg-surface-container-high border border-outline-variant text-on-surface px-3 py-1 rounded-full font-label-sm text-label-sm">
                        <span className="text-primary">{skill}</span>
                        <span className="text-on-surface-variant">{count}</span>
                      </span>
                    ))}
                  </div>
                ) : (
                  <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
                    {hasLoadedUnusableMarketJobs
                      ? "No hard skills or tools were detected from the loaded provider jobs."
                      : "No market requirements detected yet."}
                  </p>
                )}
              </div>
            </div>
          </section>

          <section id="company-matches" className="md:col-span-12 bg-surface-container border border-outline-variant rounded-xl p-md scroll-mt-24 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-sm mb-md">
              <div>
                <div className="flex items-center gap-2 mb-xs">
                  <Icon name="business_center" className="text-primary" />
                <h3 className="font-headline-md text-headline-md text-on-surface">Requirement matches</h3>
                </div>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  These are the live job posts used to compare company requirements against your latest CV skills.
                </p>
              </div>
              {companyRequirementMatches.length > 0 && (
                <span className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                  Showing {companyRequirementMatches.length} of {allCompanyRequirementMatches.length}
                </span>
              )}
            </div>

            {companyRequirementMatches.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                {hasLoadedUnusableMarketJobs
                  ? "No company requirements were usable for this target. Try choosing All Malaysia, selecting a nearby region, or broadening the target role."
                  : "No company requirements found yet. Try changing your target role, choosing All Malaysia, checking job API configuration, or uploading and confirming your CV again."}
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
                  {companyRequirementMatches.map((job) => (
                    <article key={job.id} className="bg-surface-container border border-outline-variant rounded-xl p-md hover:border-primary/50 hover:shadow-md transition-all">
                      <div className="flex items-start justify-between gap-sm mb-sm">
                        <div>
                          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
                            {job.company}
                          </p>
                          <h4 className="font-headline-md text-headline-md text-on-surface mt-xs">
                            {job.title}
                          </h4>
                          <p className="font-body-sm text-body-sm text-on-surface-variant mt-xs">
                            {[job.location, job.source].filter(Boolean).join(" | ")}
                          </p>
                          <div className="mt-xs flex flex-wrap gap-xs">
                            <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface">
                              <Icon name="payments" className="text-[16px] text-primary" />
                                {job.salary || "Salary undisclosed"}
                            </span>
                            {job.jobType && (
                              <span className="inline-flex items-center gap-xs rounded-full bg-surface-container-high border border-outline-variant px-3 py-1 font-label-sm text-label-sm text-on-surface">
                                <Icon name="work" className="text-[16px] text-primary" />
                                {job.jobType}
                              </span>
                            )}
                          </div>
                        </div>
                        <div className="min-w-16 text-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                          <span className="block font-headline-md text-headline-md text-primary">
                            {job.matchScore === null ? "N/A" : `${job.matchScore}%`}
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            {job.matchScore === null ? "not scored" : job.matchLabel || "match"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                        <RequirementBlock title="Matched skills" skills={job.matchedSkills} emptyText="No matched skills detected" variant="matched" />
                        <RequirementBlock title="Missing skills" skills={job.missingSkills} emptyText="No missing skills detected" variant="missing" />
                      </div>

                      {job.requiredSkills.length > 0 && (
                        <div className="mt-sm flex flex-wrap gap-xs">
                          {job.requiredSkills.slice(0, 5).map((skill) => (
                            <span key={skill} className="rounded-full bg-primary-container text-primary px-3 py-1 font-label-sm text-label-sm">
                              {skill}
                            </span>
                          ))}
                          {job.requiredSkills.length > 5 && (
                            <span className="rounded-full bg-surface-container-high text-on-surface-variant px-3 py-1 font-label-sm text-label-sm">
                              +{job.requiredSkills.length - 5} more
                            </span>
                          )}
                        </div>
                      )}

                      {job.url && (
                        <a
                          className="inline-flex items-center gap-xs text-primary hover:underline font-label-md text-label-md mt-md"
                          href={job.url}
                          rel="noreferrer"
                          target="_blank"
                        >
                            Open listing
                          <Icon name="open_in_new" className="text-[18px]" />
                        </a>
                      )}
                    </article>
                  ))}
                </div>

                {showCompanyMatchToggle && (
                  <div className="flex justify-center mt-md">
                    <button
                      className="inline-flex items-center gap-xs border border-primary text-primary px-6 py-3 rounded-xl font-label-md text-label-md hover:bg-primary/10 active:scale-95 transition-all"
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
        </div>
      </main>
    </PageShell>
  );
}

function RequirementBlock({ title, skills, emptyText, variant = "default" }) {
  const chipClassName = {
    default: "bg-surface-container-highest text-on-surface-variant",
    matched: "bg-primary-container/20 border border-primary/30 text-primary",
    missing: "border border-orange-500/50 text-orange-400 bg-orange-500/5",
  }[variant];

  return (
    <div className="rounded-lg bg-surface-container-lowest border border-outline-variant/60 p-sm">
      <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
        {title}
      </p>
      <div className="flex flex-wrap gap-xs">
        {skills.length > 0 ? (
          skills.map((skill) => (
            <span key={skill} className={`${chipClassName} px-3 py-1 rounded-full font-label-sm text-label-sm`}>
              {skill}
            </span>
          ))
        ) : (
          <span className={`font-body-sm text-body-sm ${variant === "missing" && emptyText.startsWith("Your CV") ? "text-primary" : "text-on-surface-variant"}`}>
            {emptyText}
          </span>
        )}
      </div>
    </div>
  );
}
