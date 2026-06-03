import test from "node:test";
import assert from "node:assert/strict";

import {
  attachEmployerProfilesToJobPosts,
  buildCombinedJobsFeed,
  matchesInternalJobRole,
  resolveHomeJobsFeedCopy,
  resolveEmployerCompanyName,
  resolveFeedMarketJobs,
  resolveHomeJobsFeedMode,
  scoreInternalJobRole,
  seededShuffle,
  shouldFetchFilteredFeedMarketJobs,
} from "./combinedJobsFeed.js";

test("resolveHomeJobsFeedMode uses discover when target role is empty", () => {
  assert.equal(resolveHomeJobsFeedMode({ targetRole: "" }), "discover");
  assert.equal(resolveHomeJobsFeedMode({ targetRole: "   " }), "discover");
  assert.equal(resolveHomeJobsFeedMode({ targetRole: "Data Analyst", hasSavedCareerTarget: true }), "filtered");
});

test("resolveHomeJobsFeedMode uses discover before the first saved target", () => {
  assert.equal(
    resolveHomeJobsFeedMode({ targetRole: "Data Analyst", hasSavedCareerTarget: false }),
    "discover",
  );
});

test("resolveHomeJobsFeedCopy uses neutral feed wording instead of a job page tone", () => {
  assert.deepEqual(
    resolveHomeJobsFeedCopy({ mode: "discover", targetRole: "" }),
    {
      eyebrow: "Recommended",
      title: "Jobs to explore",
      subtitle: "Employer posts and market listings in one feed.",
      loading: "Loading feed...",
      empty: "No listings yet. Save a target role or check back later.",
    },
  );

  assert.deepEqual(
    resolveHomeJobsFeedCopy({ mode: "filtered", targetRole: "Data Analyst" }),
    {
      eyebrow: "Recommended",
      title: "Jobs matching Data Analyst",
      subtitle: "Employer matches appear first, followed by market listings.",
      loading: "Loading feed...",
      empty: "No listings yet. Save a target role or check back later.",
    },
  );
});

test("resolveFeedMarketJobs prefers analysis market jobs when present", () => {
  const analysisJobs = [{ id: "analysis-1" }];
  const feedJobs = [{ id: "feed-1" }];

  assert.deepEqual(
    resolveFeedMarketJobs({ marketJobs: analysisJobs, feedMarketJobs: feedJobs }),
    analysisJobs,
  );
});

test("resolveFeedMarketJobs falls back to feed-only market jobs", () => {
  const feedJobs = [{ id: "feed-1" }];

  assert.deepEqual(resolveFeedMarketJobs({ marketJobs: [], feedMarketJobs: feedJobs }), feedJobs);
});

test("shouldFetchFilteredFeedMarketJobs only for filtered mode with a role", () => {
  assert.equal(
    shouldFetchFilteredFeedMarketJobs({ mode: "filtered", targetRole: "Data Analyst" }),
    true,
  );
  assert.equal(
    shouldFetchFilteredFeedMarketJobs({ mode: "discover", targetRole: "Data Analyst" }),
    false,
  );
  assert.equal(shouldFetchFilteredFeedMarketJobs({ mode: "filtered", targetRole: "  " }), false);
});

test("matchesInternalJobRole matches title, category, or required skills", () => {
  const job = {
    title: "Junior Data Analyst",
    category: "Analytics",
    required_skills: ["Python", "SQL"],
  };

  assert.equal(matchesInternalJobRole(job, "Data Analyst"), true);
  assert.equal(matchesInternalJobRole(job, "Python"), true);
  assert.equal(matchesInternalJobRole(job, "Designer"), false);
});

test("seededShuffle is stable for the same seed", () => {
  const items = [{ id: 1 }, { id: 2 }, { id: 3 }, { id: 4 }, { id: 5 }, { id: 6 }];
  const first = seededShuffle(items, "session-a").map((item) => item.id);
  const second = seededShuffle(items, "session-a").map((item) => item.id);

  assert.deepEqual(first, second);
  assert.notEqual(first.join(","), items.map((item) => item.id).join(","));
});

test("buildCombinedJobsFeed discover mode is internal-heavy with market slice", () => {
  const feed = buildCombinedJobsFeed({
    mode: "discover",
    internalPosts: Array.from({ length: 12 }, (_, index) => ({
      id: `internal-${index}`,
      title: `Role ${index}`,
      employer_profiles: { company_name: `Company ${index}` },
    })),
    discoverMarketJobs: Array.from({ length: 5 }, (_, index) => ({
      id: `market-${index}`,
      title: `Market ${index}`,
      company: `Vendor ${index}`,
      url: `https://example.com/${index}`,
      source: "Jooble",
    })),
    seed: "test-seed",
    maxCards: 10,
  });

  assert.equal(feed.length, 10);
  assert.equal(feed.filter((item) => item.source === "skillbridge").length, 7);
  assert.equal(feed.filter((item) => item.source === "market").length, 3);
  assert.equal(feed[0].badgeLabel, "SkillBridge employer");
  assert.equal(feed[feed.length - 1].action, "view");
});

test("buildCombinedJobsFeed filtered mode lists internal matches before market jobs", () => {
  const feed = buildCombinedJobsFeed({
    mode: "filtered",
    targetRole: "Data Analyst",
    internalPosts: [
      { id: "a", title: "Data Analyst Intern", employer_profiles: { company_name: "Acme" } },
      { id: "b", title: "Chef", employer_profiles: { company_name: "Kitchen" } },
    ],
    marketJobs: [
      { id: "m1", title: "Analyst", company: "Market Co", url: "https://example.com/1", source: "Jooble" },
      { id: "m2", title: "Designer", company: "Design Co", url: "https://example.com/2", source: "Jooble" },
    ],
    maxCards: 10,
  });

  assert.equal(feed[0].source, "skillbridge");
  assert.equal(feed[0].title, "Data Analyst Intern");
  assert.ok(feed.some((item) => item.source === "market"));
  assert.equal(feed.filter((item) => item.source === "skillbridge").length, 1);
});

test("buildCombinedJobsFeed filtered mode without internal matches returns market only", () => {
  const feed = buildCombinedJobsFeed({
    mode: "filtered",
    targetRole: "DevOps Engineer",
    internalPosts: [{ id: "a", title: "Chef", employer_profiles: { company_name: "Kitchen" } }],
    marketJobs: [
      { id: "m1", title: "DevOps Engineer", company: "Cloud Co", url: "https://example.com/1", source: "Jooble" },
    ],
    maxCards: 10,
  });

  assert.equal(feed.length, 1);
  assert.equal(feed[0].source, "market");
  assert.equal(feed[0].action, "view");
});

test("buildCombinedJobsFeed caps results at maxCards", () => {
  const feed = buildCombinedJobsFeed({
    mode: "filtered",
    targetRole: "Engineer",
    internalPosts: Array.from({ length: 8 }, (_, index) => ({
      id: `i-${index}`,
      title: `Software Engineer ${index}`,
      employer_profiles: { company_name: `Co ${index}` },
    })),
    marketJobs: Array.from({ length: 8 }, (_, index) => ({
      id: `m-${index}`,
      title: `Engineer ${index}`,
      company: `Market ${index}`,
      url: `https://example.com/${index}`,
      source: "Jooble",
    })),
    maxCards: 10,
  });

  assert.equal(feed.length, 10);
});

test("resolveEmployerCompanyName prefers joined employer profile", () => {
  assert.equal(
    resolveEmployerCompanyName({
      employer_profiles: { company_name: "Rydox Automation" },
    }),
    "Rydox Automation",
  );
});

test("attachEmployerProfilesToJobPosts maps profiles by employer_id", () => {
  const posts = attachEmployerProfilesToJobPosts(
    [{ id: "job-1", employer_id: "emp-1", title: "Analyst" }],
    [{ user_id: "emp-1", company_name: "Acme Corp" }],
  );

  assert.equal(posts[0].employer_profiles.company_name, "Acme Corp");
  assert.equal(resolveEmployerCompanyName(posts[0]), "Acme Corp");
});

test("scoreInternalJobRole ranks exact phrase match above generic-token-only match", () => {
  const aiEngineer = { title: "AI Engineer", category: "", required_skills: [] };
  const softwareEngineer = { title: "Software Engineer", category: "", required_skills: [] };

  const aiScore = scoreInternalJobRole(aiEngineer, "AI Engineer");
  const softwareScore = scoreInternalJobRole(softwareEngineer, "AI Engineer");

  assert.ok(aiScore > softwareScore, `AI Engineer (${aiScore}) should score higher than Software Engineer (${softwareScore})`);
  assert.ok(aiScore > 0, "AI Engineer should have positive score");
});

test("buildCombinedJobsFeed drops generic-only matches and sorts the rest by score", () => {
  const feed = buildCombinedJobsFeed({
    mode: "filtered",
    targetRole: "AI Engineer",
    internalPosts: [
      { id: "1", title: "Software Engineer", employer_profiles: { company_name: "Co A" } }, // generic only -> dropped
      { id: "2", title: "AI Engineer", employer_profiles: { company_name: "Co B" } },       // phrase match -> kept, first
      { id: "3", title: "AI Research Engineer", employer_profiles: { company_name: "Co C" } }, // specific "ai" -> kept
      { id: "4", title: "Machine Learning Engineer", employer_profiles: { company_name: "Co D" } }, // generic only -> dropped
    ],
    marketJobs: [],
  });

  const titles = feed.map((job) => job.title);
  assert.deepEqual(titles, ["AI Engineer", "AI Research Engineer"]);
  assert.equal(feed[0].title, "AI Engineer"); // exact phrase ranks first
});
