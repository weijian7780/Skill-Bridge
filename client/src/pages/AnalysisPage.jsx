import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { buildAnalysisActionLabel } from "../services/analysis/analysisStatusCopy.js";
import {
  buildDiagnosticScoreDisplay,
  buildSkillEvidenceRows,
} from "../services/analysis/analysisDiagnosticDisplay.js";
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
    jobStatus,
    setJobs,
    setJobStatus,
    setRoadmapPlan,
    skillProfile,
  } = useAppState();
  const navigate = useNavigate();
  const [jobSearchAttempt, setJobSearchAttempt] = useState(0);
  const [showAllCompanyMatches, setShowAllCompanyMatches] = useState(false);
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
  const actionLabel = buildAnalysisActionLabel({
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

  useEffect(() => {
    if (!hasConfirmedCv) {
      return;
    }

    const searchKey = `${careerTarget.role}|${regionSearchValue}|${jobSearchAttempt}`;
    if (lastJobSearchKey.current === searchKey) {
      return;
    }

    let cancelled = false;
    lastJobSearchKey.current = searchKey;
    setJobs([]);
    setJobStatus(`Loading market jobs for ${careerTarget.role} ${regionAnalysisCopy}...`);

    async function loadJobs() {
      try {
        const result = await searchMarketJobs({
          role: careerTarget.role,
          region: regionSearchValue,
        });

        if (cancelled) {
          return;
        }

        const loadedJobs = result.jobs ?? [];
        const providerName = result.source || "Job provider";
        const cacheLabel = result.cached ? "cached " : "";
        setJobs(loadedJobs);
        setJobStatus(
          result.configured
            ? `Loaded ${loadedJobs.length} ${cacheLabel}${providerName} jobs for this target.`
            : result.message || "Job API key not configured.",
        );
      } catch (error) {
        if (!cancelled) {
          setJobs([]);
          setJobStatus(error.message);
          lastJobSearchKey.current = "";
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [careerTarget.role, hasConfirmedCv, jobSearchAttempt, regionAnalysisCopy, regionSearchValue, setJobStatus, setJobs]);

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
          <section className="md:col-span-4 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col items-center justify-center text-center">
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

          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between">
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
            <div className="mt-8 flex justify-end">
              {analysis.status === "needs_market" ? (
                <button
                  className="bg-surface-container-highest text-on-surface-variant px-8 py-3 rounded-xl font-headline-md flex items-center gap-2 hover:border hover:border-primary disabled:cursor-not-allowed"
                  disabled={!hasConfirmedCv}
                  onClick={retryJobSearch}
                >
                  {actionLabel}
                </button>
              ) : analysis.status === "ready" ? (
                <button
                  className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center gap-2 group disabled:cursor-not-allowed disabled:opacity-60"
                  disabled={isGeneratingRoadmap}
                  onClick={generateRoadmap}
                  type="button"
                >
                  {isGeneratingRoadmap ? "Generating Roadmap..." : "Build Roadmap From These Gaps"}
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </button>
              ) : (
                <Link className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center gap-2 group" to={isReady ? "/roadmap" : "/cv"}>
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

          <section className="md:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
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
                    {analysis.status === "needs_market"
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

          <section className="md:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="flag" className="text-secondary" />
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Priority Gaps by Market Frequency</h3>
            </div>
            <div className="space-y-sm">
              {missingSkillRows.map((row, index) => (
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
                      : analysis.status === "needs_market"
                        ? "Market job skills are required before gaps can be calculated."
                        : "Confirm a latest CV to calculate gaps."}
                  </p>
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-12 border border-outline-variant rounded-xl bg-surface-container p-md">
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
                    No market requirements detected yet.
                  </p>
                )}
              </div>
            </div>
          </section>

          <section id="company-matches" className="md:col-span-12 bg-surface-container border border-outline-variant rounded-xl p-md scroll-mt-24">
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-sm mb-md">
              <div>
                <div className="flex items-center gap-2 mb-xs">
                  <Icon name="business_center" className="text-primary" />
                  <h3 className="font-headline-md text-headline-md text-on-surface">Company Requirement Matches</h3>
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
                No company requirements found yet. Try changing your target role, choosing All Malaysia, checking job API configuration, or uploading and confirming your CV again.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
                  {companyRequirementMatches.map((job) => (
                    <article key={job.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-md hover:border-primary/50 transition-colors">
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
                        </div>
                        <div className="min-w-16 text-center rounded-lg border border-primary/30 bg-primary/10 px-3 py-2">
                          <span className="block font-headline-md text-headline-md text-primary">
                            {job.matchScore === null ? "N/A" : `${job.matchScore}%`}
                          </span>
                          <span className="block font-label-sm text-label-sm text-on-surface-variant">
                            {job.matchScore === null ? "not scored" : "match"}
                          </span>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-sm">
                        <RequirementBlock title="Matched skills" skills={job.matchedSkills} emptyText="No matched skills detected" variant="matched" />
                        <RequirementBlock title="Missing skills" skills={job.missingSkills} emptyText="No missing skills detected" variant="missing" />
                      </div>

                      {job.url && (
                        <a
                          className="inline-flex items-center gap-xs text-primary hover:underline font-label-md text-label-md mt-md"
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
