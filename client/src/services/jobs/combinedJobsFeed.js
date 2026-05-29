export const HOME_JOBS_FEED_MAX_CARDS = 10;
export const DISCOVER_INTERNAL_CARD_COUNT = 7;
export const DISCOVER_MARKET_CARD_COUNT = 3;

export function resolveHomeJobsFeedMode({
  targetRole = "",
  hasSavedCareerTarget = false,
} = {}) {
  if (!hasSavedCareerTarget) {
    return "discover";
  }

  const role = String(targetRole ?? "").trim();
  return role ? "filtered" : "discover";
}

export function shouldFetchFilteredFeedMarketJobs({ mode, targetRole = "" } = {}) {
  return mode === "filtered" && String(targetRole ?? "").trim().length > 0;
}

export function resolveHomeJobsFeedCopy({ mode, targetRole = "" } = {}) {
  const role = String(targetRole ?? "").trim();
  const filteredMode = mode === "filtered" && role.length > 0;

  return {
    eyebrow: "Recommended",
    title: filteredMode ? `Jobs matching ${role}` : "Jobs to explore",
    subtitle: filteredMode
      ? "Employer matches appear first, followed by market listings."
      : "Employer posts and market listings in one feed.",
    loading: "Loading feed...",
    empty: "No listings yet. Save a target role or check back later.",
  };
}

export function resolveFeedMarketJobs({
  marketJobs = [],
  feedMarketJobs = [],
} = {}) {
  if (marketJobs.length > 0) {
    return marketJobs;
  }

  return feedMarketJobs;
}

export function matchesInternalJobRole(job, targetRole) {
  const role = String(targetRole ?? "").trim().toLowerCase();
  if (!role) {
    return false;
  }

  const title = String(job.title ?? "").toLowerCase();
  if (title.includes(role)) {
    return true;
  }

  const category = String(job.category ?? "").toLowerCase();
  if (category.includes(role)) {
    return true;
  }

  const tokens = role.split(/\s+/).filter((token) => token.length >= 3);
  const skills = (job.required_skills ?? []).map((skill) => String(skill).toLowerCase());

  return tokens.some(
    (token) =>
      title.includes(token) ||
      skills.some((skill) => skill.includes(token)),
  );
}

export function hashSeed(seed) {
  let hash = 0;
  const value = String(seed ?? "");
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) | 0;
  }
  return Math.abs(hash);
}

export function seededShuffle(items, seed = "skillbridge") {
  const list = [...items];
  let state = hashSeed(seed);

  for (let index = list.length - 1; index > 0; index -= 1) {
    state = (state * 1103515245 + 12345) & 0x7fffffff;
    const swapIndex = state % (index + 1);
    [list[index], list[swapIndex]] = [list[swapIndex], list[index]];
  }

  return list;
}

export function resolveEmployerCompanyName(job) {
  return job.employer_profiles?.company_name || job.company_name || null;
}

export function attachEmployerProfilesToJobPosts(jobPosts, employerProfiles) {
  const profileMap = {};
  for (const profile of employerProfiles ?? []) {
    profileMap[profile.user_id] = profile;
  }

  return (jobPosts ?? []).map((job) => ({
    ...job,
    employer_profiles: profileMap[job.employer_id] ?? job.employer_profiles ?? null,
  }));
}

export function normalizeInternalJobForFeed(job) {
  return {
    id: `internal-${job.id}`,
    source: "skillbridge",
    badgeLabel: "SkillBridge employer",
    action: "apply",
    applyPath: `/jobs/${job.id}/apply`,
    title: job.title,
    company: resolveEmployerCompanyName(job) ?? "Company name unavailable",
    location: job.location ?? "",
    employmentType: job.employment_type ?? job.job_type ?? "",
    skills: (job.required_skills ?? []).slice(0, 5),
    postedAt: job.created_at ?? null,
    originalJob: job,
  };
}

export function normalizeMarketJobForFeed(job, providerName = "Jooble") {
  return {
    id: `market-${job.id}`,
    source: "market",
    badgeLabel: providerName || job.source || "Jooble",
    action: "view",
    title: job.title,
    company: job.company ?? "Unknown company",
    location: job.location ?? "",
    employmentType: job.jobType ?? "",
    url: job.url ?? "",
    skills: (job.requiredSkills ?? []).slice(0, 5),
    postedAt: job.postedAt ?? null,
    originalJob: job,
  };
}

function dedupeFeedCards(cards) {
  const seen = new Set();
  return cards.filter((card) => {
    if (seen.has(card.id)) {
      return false;
    }
    seen.add(card.id);
    return true;
  });
}

export function buildCombinedJobsFeed({
  mode,
  targetRole = "",
  internalPosts = [],
  marketJobs = [],
  discoverMarketJobs = [],
  seed = "skillbridge",
  maxCards = HOME_JOBS_FEED_MAX_CARDS,
  marketProviderName = "Jooble",
}) {
  if (mode === "discover") {
    const internalCards = seededShuffle(internalPosts, seed)
      .slice(0, DISCOVER_INTERNAL_CARD_COUNT)
      .map(normalizeInternalJobForFeed);
    const marketCards = seededShuffle(discoverMarketJobs, `${seed}-market`)
      .slice(0, DISCOVER_MARKET_CARD_COUNT)
      .map((job) => normalizeMarketJobForFeed(job, marketProviderName));

    return dedupeFeedCards([...internalCards, ...marketCards]).slice(0, maxCards);
  }

  const internalMatches = internalPosts.filter((job) =>
    matchesInternalJobRole(job, targetRole),
  );
  const internalCards = internalMatches.map(normalizeInternalJobForFeed);
  const marketCards = marketJobs.map((job) =>
    normalizeMarketJobForFeed(job, marketProviderName),
  );

  if (internalCards.length > 0) {
    return dedupeFeedCards([...internalCards, ...marketCards]).slice(0, maxCards);
  }

  return dedupeFeedCards(marketCards).slice(0, maxCards);
}
