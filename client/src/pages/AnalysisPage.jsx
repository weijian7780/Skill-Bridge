import { useEffect, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Icon } from "../components/Icon.jsx";
import { PageShell } from "../components/PageShell.jsx";
import { buildAnalysisActionLabel, buildAnalysisScoreMessage } from "../services/analysis/analysisStatusCopy.js";
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
  const lastJobSearchKey = useRef("");
  const isReady = analysis.status === "ready";
  const hasConfirmedCv = analysis.status !== "needs_cv";
  const missingSkills = analysis.missingSkills;
  const matchedSkills = analysis.matchedSkills;
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

  useEffect(() => {
    if (!hasConfirmedCv) {
      return;
    }

    const searchKey = `${careerTarget.role}|${careerTarget.region}`;
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
        setJobs(loadedJobs);
        setJobStatus(
          result.configured
            ? `Loaded ${loadedJobs.length} ${providerName} jobs for this target.`
            : result.message || "Job API key not configured.",
        );
      } catch (error) {
        if (!cancelled) {
          setJobs([]);
          setJobStatus(error.message);
        }
      }
    }

    loadJobs();

    return () => {
      cancelled = true;
    };
  }, [careerTarget.region, careerTarget.role, hasConfirmedCv, setJobStatus, setJobs]);

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
                <button className="bg-surface-container-highest text-on-surface-variant px-8 py-3 rounded-xl font-headline-md flex items-center gap-2 cursor-not-allowed" disabled>
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
                <p className="font-body-sm text-body-sm text-on-surface-variant">
                  {analysis.status === "needs_market" ? "Market job skills have not loaded yet." : "No confirmed CV skills yet."}
                </p>
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
        </div>
      </main>
    </PageShell>
  );
}
