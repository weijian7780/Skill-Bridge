import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { buildAnalysisActionLabel, buildAnalysisScoreMessage } from "../services/analysis/analysisStatusCopy.js";
import {
  getCompanyMatchToggleLabel,
  getVisibleCompanyMatches,
  shouldShowCompanyMatchToggle,
} from "../services/analysis/companyMatchDisplay.js";
import { searchMarketJobs } from "../services/jobs/jobApi.js";
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
    skillProfile,
  } = useAppState();
  const [jobSearchAttempt, setJobSearchAttempt] = useState(0);
  const [showAllCompanyMatches, setShowAllCompanyMatches] = useState(false);
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
  const scoreMessage = buildAnalysisScoreMessage({
    analysisStatus: analysis.status,
    jobStatus,
    matchedCount: matchedSkills.length,
  });
  const actionLabel = buildAnalysisActionLabel({
    analysisStatus: analysis.status,
    jobStatus,
  });
  const topDemandedSkills = useMemo(
    () =>
      Object.entries(analysis.marketEvidence.skillDemand)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 4),
    [analysis.marketEvidence.skillDemand],
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

  useEffect(() => {
    if (!hasConfirmedCv) {
      return;
    }

    const searchKey = `${careerTarget.role}|${careerTarget.region}|${jobSearchAttempt}`;
    if (lastJobSearchKey.current === searchKey) {
      return;
    }

    let cancelled = false;
    lastJobSearchKey.current = searchKey;
    setJobs([]);
    setJobStatus(`Loading market jobs for ${careerTarget.role} in ${careerTarget.region}...`);

    async function loadJobs() {
      try {
        const result = await searchMarketJobs({
          role: careerTarget.role,
          region: careerTarget.region,
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
  }, [careerTarget.region, careerTarget.role, hasConfirmedCv, jobSearchAttempt, setJobStatus, setJobs]);

  function retryJobSearch() {
    setJobSearchAttempt((attempt) => attempt + 1);
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
            <h3 className="font-label-md text-label-md text-on-surface-variant mb-6 uppercase tracking-wider">{careerTarget.role.toUpperCase()} MATCH</h3>
            <div className="radial-progress relative mb-4" style={{ "--value": analysis.readinessScore }}>
              <span className="font-headline-xl text-headline-xl text-primary">{analysis.readinessScore}%</span>
            </div>
            <p className="font-body-sm text-body-sm text-on-surface-variant">
              {scoreMessage}
            </p>
          </section>

          <section className="md:col-span-8 bg-surface-container border border-outline-variant rounded-xl p-md flex flex-col justify-between">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Icon name="smart_toy" className="text-primary" />
                <h3 className="font-headline-md text-headline-md text-primary">AI Recommendation</h3>
              </div>
              <p className="font-headline-lg text-headline-lg leading-relaxed text-on-surface">
                {analysis.recommendation}
              </p>
              {isReady && analysis.prioritySkill && (
                <p className="font-body-sm text-body-sm text-on-surface-variant mt-sm">
                  Priority gap: <span className="text-primary font-semibold">{analysis.prioritySkill}</span>
                </p>
              )}
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
              ) : (
                <Link className="bg-primary hover:bg-primary-container text-on-primary px-8 py-3 rounded-xl font-headline-md transition-all active:scale-95 flex items-center gap-2 group" to={isReady ? "/roadmap" : "/cv"}>
                  {actionLabel}
                  <Icon name="arrow_forward" className="group-hover:translate-x-1 transition-transform" />
                </Link>
              )}
            </div>
          </section>

          <section className="md:col-span-6 bg-surface-container border border-outline-variant rounded-xl p-md">
            <div className="flex items-center gap-2 mb-6">
              <Icon name="check_circle" className="text-primary" />
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Matched Skills</h3>
            </div>
            <div className="flex flex-wrap gap-sm">
              {matchedSkills.map((skill) => (
                <div key={skill} className="bg-primary-container/20 border border-primary/30 text-primary px-4 py-2 rounded-full font-label-md flex items-center gap-2">
                  {skill}
                  <Icon name="verified" filled className="text-[16px]" />
                </div>
              ))}
              {matchedSkills.length === 0 && (
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
              <h3 className="font-label-md text-label-md text-on-surface uppercase tracking-wider">Gaps to Bridge</h3>
            </div>
            <div className="space-y-4">
              <div className="flex flex-wrap gap-sm">
                {missingSkills.slice(0, 2).map((skill) => (
                  <div key={skill} className="border-2 border-orange-500/50 text-orange-400 px-4 py-2 rounded-xl font-label-md flex items-center gap-2 bg-orange-500/5">
                    <Icon name="priority_high" className="text-[18px]" />
                    {skill}
                  </div>
                ))}
                {missingSkills.length === 0 && (
                  <p className="font-body-sm text-body-sm text-on-surface-variant">
                    {isReady
                      ? "No missing market job skills detected for the current target."
                      : analysis.status === "needs_market"
                        ? "Market job skills are required before gaps can be calculated."
                        : "Confirm a latest CV to calculate gaps."}
                  </p>
                )}
              </div>
              {missingSkills.length > 2 && (
                <div className="flex flex-wrap gap-sm">
                  {missingSkills.slice(2).map((skill) => (
                    <div key={skill} className="bg-surface-container-highest border border-outline-variant text-on-surface-variant px-4 py-2 rounded-xl font-label-md">
                      {skill}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container-low border border-outline-variant rounded-xl p-md overflow-hidden relative group">
            <div className="absolute inset-0 opacity-10 pointer-events-none">
              <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,#57f1db_0%,transparent_50%)]" />
            </div>
            <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
              <div className="w-full md:w-1/3 h-32 rounded-lg bg-surface-container-high border border-outline-variant overflow-hidden">
                <div className="w-full h-full bg-[linear-gradient(135deg,#0d1c2d,#57f1db22),repeating-linear-gradient(90deg,#57f1db22_0_2px,transparent_2px_32px)]" />
              </div>
              <div className="flex-1">
                <h4 className="font-headline-md text-headline-md text-on-surface mb-2">Market Evidence for {careerTarget.role}</h4>
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {jobStatus}
                </p>
                <div className="mt-sm grid grid-cols-1 md:grid-cols-3 gap-sm">
                  <div className="rounded-lg border border-outline-variant bg-surface-container p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Latest CV</p>
                    <p className="font-body-sm text-body-sm text-on-surface mt-xs">{cvDocument?.fileName || "Not confirmed"}</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-surface-container p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Extractor</p>
                    <p className="font-body-sm text-body-sm text-on-surface mt-xs">{skillProfile.provider}</p>
                  </div>
                  <div className="rounded-lg border border-outline-variant bg-surface-container p-sm">
                    <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider">Jobs Used</p>
                    <p className="font-body-sm text-body-sm text-on-surface mt-xs">{jobs.length}</p>
                  </div>
                </div>
                {topDemandedSkills.length > 0 && (
                  <div className="mt-sm flex flex-wrap gap-xs">
                    {topDemandedSkills.map(([skill, count]) => (
                      <span key={skill} className="bg-surface-container-high text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                        {skill}: {count}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </section>

          <section className="md:col-span-12 bg-surface-container border border-outline-variant rounded-xl p-md">
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
                  Showing {companyRequirementMatches.length} of {analysis.marketEvidence.jobCount}
                </span>
              )}
            </div>

            {companyRequirementMatches.length === 0 ? (
              <p className="font-body-sm text-body-sm text-on-surface-variant">
                No company requirement evidence is available yet. Upload a CV and load market jobs first.
              </p>
            ) : (
              <>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-sm">
                  {companyRequirementMatches.map((job) => (
                    <article key={job.id} className="bg-surface-container-low border border-outline-variant rounded-xl p-md">
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

                      <div className="space-y-sm">
                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                            Requirements Detected
                          </p>
                          <div className="flex flex-wrap gap-xs">
                            {job.requiredSkills.length > 0 ? (
                              job.requiredSkills.map((skill) => (
                                <span key={skill} className="bg-surface-container-highest text-on-surface-variant px-3 py-1 rounded-full font-label-sm text-label-sm">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="font-body-sm text-body-sm text-on-surface-variant">No skills detected from this job text.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                            Matched With CV
                          </p>
                          <div className="flex flex-wrap gap-xs">
                            {job.matchedSkills.length > 0 ? (
                              job.matchedSkills.map((skill) => (
                                <span key={skill} className="bg-primary-container/20 border border-primary/30 text-primary px-3 py-1 rounded-full font-label-sm text-label-sm">
                                  {skill}
                                </span>
                              ))
                            ) : job.requiredSkills.length === 0 ? (
                              <span className="font-body-sm text-body-sm text-on-surface-variant">No detected requirements to compare with your CV.</span>
                            ) : (
                              <span className="font-body-sm text-body-sm text-on-surface-variant">No resume overlap for this company yet.</span>
                            )}
                          </div>
                        </div>

                        <div>
                          <p className="font-label-sm text-label-sm text-on-surface-variant uppercase tracking-wider mb-xs">
                            Still Missing
                          </p>
                          <div className="flex flex-wrap gap-xs">
                            {job.requiredSkills.length === 0 ? (
                              <span className="font-body-sm text-body-sm text-on-surface-variant">No requirements were detected from this job post, so missing skills cannot be calculated.</span>
                            ) : job.missingSkills.length > 0 ? (
                              job.missingSkills.map((skill) => (
                                <span key={skill} className="border border-orange-500/50 text-orange-400 bg-orange-500/5 px-3 py-1 rounded-full font-label-sm text-label-sm">
                                  {skill}
                                </span>
                              ))
                            ) : (
                              <span className="font-body-sm text-body-sm text-primary">Your CV covers all detected requirements for this job.</span>
                            )}
                          </div>
                        </div>
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
