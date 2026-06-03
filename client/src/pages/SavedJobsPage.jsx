import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PageShell } from "../components/PageShell.jsx";
import { Icon } from "../components/Icon.jsx";
import JobDetailPanel from "../components/JobDetailPanel.jsx";
import { useAuth } from "../state/AuthContext.jsx";
import { fetchSavedJobs, saveJob, unsaveJob, isJobSaved } from "../services/jobs/savedJobsApi.js";

export function SavedJobsPage() {
  const { session, supabaseConnection, config } = useAuth();

  const [savedJobs, setSavedJobs] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!session?.accessToken || !supabaseConnection?.configured || !config) {
        setIsLoading(false);
        return;
      }
      try {
        const saved = await fetchSavedJobs({ config, accessToken: session.accessToken });
        if (active) setSavedJobs(saved);
      } catch (err) {
        if (active) setError(err.message || "Failed to load saved jobs.");
      } finally {
        if (active) setIsLoading(false);
      }
    }
    load();
    return () => {
      active = false;
    };
  }, [session?.accessToken, supabaseConnection?.configured, config]);

  // Save/un-save toggle, shared by the detail-panel heart and the card Remove button.
  const handleToggleSaveJob = async (jobCard) => {
    if (!session?.accessToken) return;
    const alreadySaved = isJobSaved(savedJobs, jobCard.id, jobCard.source);
    try {
      if (alreadySaved) {
        await unsaveJob({ config, accessToken: session.accessToken, jobId: jobCard.id, jobSource: jobCard.source });
        setSavedJobs((current) => current.filter((x) => !(x.job_id === jobCard.id && x.job_source === jobCard.source)));
      } else {
        const newSaved = await saveJob({
          config,
          accessToken: session.accessToken,
          userId: session.user.id,
          jobId: jobCard.id,
          jobSource: jobCard.source,
          jobData: jobCard,
        });
        setSavedJobs((current) => [newSaved, ...current]);
      }
    } catch (err) {
      console.error("Failed to toggle save job:", err);
    }
  };

  const cards = savedJobs.map((saved) => saved.job_data).filter(Boolean);

  return (
    <PageShell>
      <main className="pt-20 pb-8 px-margin-mobile md:px-margin-desktop max-w-[1440px] mx-auto space-y-md">
        <div className="mb-md">
          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">SkillBridge workspace</p>
          <h1 className="font-headline-lg md:font-headline-xl text-headline-lg md:text-headline-xl text-on-surface font-extrabold tracking-tight">
            Saved Jobs
          </h1>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            Jobs you bookmarked. Open one to analyze your match, or remove it from your list.
          </p>
        </div>

        {isLoading ? (
          <div className="py-lg text-center font-body-md text-on-surface-variant flex flex-col items-center gap-sm">
            <Icon name="sync" className="animate-spin text-primary text-[32px]" />
            <span>Loading saved jobs...</span>
          </div>
        ) : error ? (
          <p className="py-lg text-center font-body-md text-error">{error}</p>
        ) : cards.length === 0 ? (
          <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
            <Icon name="bookmark_border" className="text-[40px] text-on-surface-variant" />
            <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
              No saved jobs yet. Open a job from{" "}
              <Link to="/home" className="text-primary underline">Home</Link>{" "}
              and tap the heart to save it here.
            </p>
          </div>
        ) : (
          <div className="split-pane">
            {/* Left list */}
            <div className="split-pane-list pr-0 lg:pr-md space-y-sm">
              {cards.map((card) => {
                const isActive = card.id === selectedJob?.id;
                return (
                  <article
                    key={card.id}
                    onClick={() => setSelectedJob(card)}
                    className={`cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${isActive ? "job-card-active" : ""}`}
                  >
                    <div className="flex items-start justify-between gap-sm">
                      <div className="min-w-0">
                        <span className="skill-chip skill-chip-neutral">{card.badgeLabel}</span>
                        <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">{card.company}</p>
                        <h3 className="mt-xs font-headline-md text-headline-md text-on-surface">{card.title}</h3>
                        {card.location && (
                          <span className="mt-xs inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                            <Icon name="location_on" className="text-[16px]" />
                            {card.location}
                          </span>
                        )}
                        {card.skills?.length > 0 && (
                          <div className="mt-sm flex flex-wrap gap-xs">
                            {card.skills.map((skill) => (
                              <span key={skill} className="skill-chip skill-chip-neutral">{skill}</span>
                            ))}
                          </div>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={(event) => {
                          event.stopPropagation();
                          handleToggleSaveJob(card);
                          if (selectedJob?.id === card.id) setSelectedJob(null);
                        }}
                        title="Remove from saved"
                        aria-label="Remove from saved"
                        className="inline-flex shrink-0 items-center gap-xs rounded-lg border border-outline-variant px-2 py-1 font-label-sm text-label-sm text-on-surface-variant transition-colors hover:border-error hover:text-error"
                      >
                        <Icon name="bookmark_remove" className="text-[16px]" />
                        Remove
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>

            {/* Right desktop detail panel */}
            <div className="hidden lg:block split-pane-detail pl-md">
              <JobDetailPanel
                job={selectedJob}
                isSaved={selectedJob ? isJobSaved(savedJobs, selectedJob.id, selectedJob.source) : false}
                onToggleSave={handleToggleSaveJob}
              />
            </div>
          </div>
        )}

        {/* Mobile full-screen detail overlay */}
        {selectedJob && (
          <div className="detail-overlay lg:hidden">
            <JobDetailPanel
              job={selectedJob}
              isSaved={isJobSaved(savedJobs, selectedJob.id, selectedJob.source)}
              onToggleSave={handleToggleSaveJob}
              onClose={() => setSelectedJob(null)}
            />
          </div>
        )}
      </main>
    </PageShell>
  );
}
