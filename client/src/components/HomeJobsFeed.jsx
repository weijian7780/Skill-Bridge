import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Icon } from "./Icon.jsx";
import {
  buildCombinedJobsFeed,
  resolveHomeJobsFeedCopy,
  resolveFeedMarketJobs,
  resolveHomeJobsFeedMode,
  shouldFetchFilteredFeedMarketJobs,
} from "../services/jobs/combinedJobsFeed.js";
import { searchMarketJobs } from "../services/jobs/jobApi.js";
import { fetchActiveJobPosts } from "../services/jobs/internalJobPostsApi.js";

const DISCOVER_MARKET_ROLE = "graduate";

function formatPostedDate(value) {
  if (!value) {
    return "";
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "";
  }

  return `Posted ${date.toLocaleDateString()}`;
}

export function HomeJobsFeed({
  careerTarget,
  hasSavedCareerTarget = false,
  marketJobs = [],
  marketProviderName = "Jooble",
  sessionSeed = "skillbridge",
  supabaseConnection,
  config,
  accessToken,
  selectedJobId = null,
  onSelectJob = null,
  onRefresh = null,
}) {
  const [internalPosts, setInternalPosts] = useState([]);
  const [discoverMarketJobs, setDiscoverMarketJobs] = useState([]);
  const [feedMarketJobs, setFeedMarketJobs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const feedMode = resolveHomeJobsFeedMode({
    targetRole: careerTarget.role,
    hasSavedCareerTarget,
  });
  const feedCopy = useMemo(
    () =>
      resolveHomeJobsFeedCopy({
        mode: feedMode,
        targetRole: careerTarget.role,
      }),
    [careerTarget.role, feedMode],
  );
  const effectiveMarketJobs = resolveFeedMarketJobs({
    marketJobs,
    feedMarketJobs,
  });

  const loadFeedData = async (forceRef = false) => {
    if (!supabaseConnection?.configured || !config) {
      setError("Supabase not configured");
      setInternalPosts([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError("");

    try {
      // Load internal employer posts
      const posts = await fetchActiveJobPosts({ config, accessToken });
      setInternalPosts(posts);

      // Load discover market jobs if in discover mode
      if (feedMode === "discover") {
        const discoverResult = await searchMarketJobs({
          role: DISCOVER_MARKET_ROLE,
          region: careerTarget.region,
          forceRefresh: forceRef,
        });
        setDiscoverMarketJobs(discoverResult.configured ? discoverResult.jobs ?? [] : []);
      }

      // Load filtered feed market jobs if needed
      if (shouldFetchFilteredFeedMarketJobs({ mode: feedMode, targetRole: careerTarget.role })) {
        const filteredResult = await searchMarketJobs({
          role: careerTarget.role,
          region: careerTarget.region,
          forceRefresh: forceRef,
        });
        setFeedMarketJobs(filteredResult.configured ? filteredResult.jobs ?? [] : []);
      }
    } catch (loadError) {
      setError(loadError.message || "Failed to load job listings");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (typeof window === "undefined" || window.location.hash !== "#jobs") {
      return;
    }

    const section = document.getElementById("jobs");
    section?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  // Initial load
  useEffect(() => {
    loadFeedData(false);
  }, [accessToken, config, supabaseConnection?.configured, careerTarget.role, careerTarget.region, feedMode]);

  const handleManualRefresh = () => {
    loadFeedData(true);
    if (onRefresh) {
      onRefresh();
    }
  };

  const feedCards = useMemo(
    () =>
      buildCombinedJobsFeed({
        mode: feedMode,
        targetRole: careerTarget.role,
        internalPosts,
        marketJobs: effectiveMarketJobs,
        discoverMarketJobs,
        seed: sessionSeed,
        marketProviderName,
      }),
    [
      careerTarget.role,
      discoverMarketJobs,
      effectiveMarketJobs,
      feedMode,
      internalPosts,
      marketProviderName,
      sessionSeed,
    ],
  );

  // Automatically select the first job in the feed on desktop if none selected yet
  useEffect(() => {
    if (feedCards.length > 0 && !selectedJobId && onSelectJob && typeof window !== "undefined" && window.innerWidth >= 1024) {
      onSelectJob(feedCards[0]);
    }
  }, [feedCards, selectedJobId, onSelectJob]);

  return (
    <section
      id="jobs"
      className="bg-surface-container border border-outline-variant rounded-xl p-md shadow-sm"
    >
      <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-start sm:justify-between">
        <div>
          <p className="font-label-sm text-label-sm text-primary uppercase tracking-wider">
            {feedCopy.eyebrow}
          </p>
          <h2 className="font-headline-lg text-headline-lg text-on-surface">
            {feedCopy.title}
          </h2>
          <p className="font-body-sm text-body-sm text-on-surface-variant">
            {feedCopy.subtitle}
          </p>
        </div>
        <div className="flex items-center gap-xs mt-2 sm:mt-0">
          <button
            onClick={handleManualRefresh}
            className="inline-flex items-center gap-xs rounded-xl border border-primary px-3 py-2 font-label-sm text-label-sm text-primary transition-colors hover:bg-primary/5 active:scale-[0.98]"
            type="button"
          >
            <Icon name="refresh" className="text-[18px]" />
            Refresh
          </button>
          <span className="inline-flex w-fit items-center gap-xs rounded-full bg-primary-container px-3 py-2 font-label-sm text-label-sm text-primary">
            <Icon name="work" className="text-[18px]" />
            {feedCards.length} shown
          </span>
        </div>
      </div>

      {isLoading ? (
        <div className="py-lg text-center font-body-md text-on-surface-variant flex flex-col items-center justify-center gap-sm">
          <Icon name="sync" className="animate-spin text-primary text-[32px]" />
          <span>{feedCopy.loading}</span>
        </div>
      ) : error ? (
        <p className="py-lg text-center font-body-md text-error">{error}</p>
      ) : feedCards.length === 0 ? (
        <div className="rounded-xl border border-outline-variant bg-surface-container-low p-lg text-center">
          <Icon name="work_off" className="text-[40px] text-on-surface-variant" />
          <p className="mt-sm font-body-md text-body-md text-on-surface-variant">
            {feedCopy.empty}
          </p>
        </div>
      ) : (
        <div className="space-y-sm">
          {feedCards.map((card) => {
            const isActive = card.id === selectedJobId;
            return (
              <article
                key={card.id}
                onClick={() => onSelectJob && onSelectJob(card)}
                className={`cursor-pointer rounded-xl border border-outline-variant bg-surface-container-lowest p-md shadow-sm transition-all hover:border-primary/40 hover:shadow-md ${
                  isActive ? "job-card-active" : ""
                }`}
              >
                <div className="flex flex-col gap-sm md:flex-row md:items-start md:justify-between">
                  <div className="min-w-0">
                    <span className="skill-chip skill-chip-neutral">{card.badgeLabel}</span>
                    <p className="mt-xs font-label-sm text-label-sm text-on-surface-variant">{card.company}</p>
                    <h3 className="mt-xs font-headline-md text-headline-md text-on-surface">{card.title}</h3>
                    <div className="mt-xs flex flex-wrap gap-xs">
                      {card.location && (
                        <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                          <Icon name="location_on" className="text-[16px]" />
                          {card.location}
                        </span>
                      )}
                      {card.employmentType && (
                        <span className="inline-flex items-center gap-1 font-body-sm text-body-sm text-on-surface-variant">
                          <Icon name="work" className="text-[16px]" />
                          {card.employmentType}
                        </span>
                      )}
                    </div>
                    {card.skills.length > 0 && (
                      <div className="mt-sm flex flex-wrap gap-xs">
                        {card.skills.map((skill) => (
                          <span key={skill} className="skill-chip skill-chip-neutral">
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  <div className="flex shrink-0 flex-col items-start gap-sm md:items-end">
                    {card.action === "apply" ? (
                      <Link
                        to={card.applyPath}
                        onClick={(e) => e.stopPropagation()} // Prevents selection trigger on button press
                        className="inline-flex items-center justify-center rounded-xl bg-primary px-xl py-sm font-label-md text-label-md font-bold text-on-primary transition-all hover:bg-secondary active:scale-[0.98]"
                      >
                        Apply
                      </Link>
                    ) : (
                      <a
                        href={card.url}
                        rel="noreferrer"
                        target="_blank"
                        onClick={(e) => e.stopPropagation()} // Prevents selection trigger on button press
                        className="inline-flex items-center justify-center gap-xs rounded-xl border border-primary px-xl py-sm font-label-md text-label-md text-primary transition-colors hover:bg-primary/5"
                      >
                        Open listing
                        <Icon name="open_in_new" className="text-[18px]" />
                      </a>
                    )}
                    {card.postedAt && (
                      <span className="font-label-sm text-label-sm text-on-surface-variant">
                        {formatPostedDate(card.postedAt)}
                      </span>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
