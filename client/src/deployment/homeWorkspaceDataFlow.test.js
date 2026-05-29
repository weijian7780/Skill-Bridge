import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const homeSource = readFileSync(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");

test("home workspace job loader is not cancelled by its own output state changes", () => {
  const marker = "loadJobs();";
  const effectStart = homeSource.lastIndexOf("useEffect(() =>", homeSource.indexOf(marker));
  const effectEnd = homeSource.indexOf("function saveTargetAndSearch", effectStart);
  const jobLoaderEffect = homeSource.slice(effectStart, effectEnd);
  const dependencyList = jobLoaderEffect.slice(jobLoaderEffect.lastIndexOf("["), jobLoaderEffect.lastIndexOf("]") + 1);

  assert.doesNotMatch(dependencyList, /\bjobs\b/);
  assert.doesNotMatch(dependencyList, /\bloadedJobTargetKey\b/);
  assert.doesNotMatch(dependencyList, /analysis\.status/);
  assert.match(dependencyList, /jobSearchTriggerKey/);
  assert.match(dependencyList, /jobTargetKey/);
});

test("home workspace places refresh in the recommended header", () => {
  const marketDiagnosisStart = homeSource.indexOf("Market diagnosis");
  const recommendedHeaderStart = homeSource.indexOf("Recommended</p>");
  const recommendedHeaderEnd = homeSource.indexOf("<EmptyMarketState", recommendedHeaderStart);

  const marketDiagnosisSection = homeSource.slice(marketDiagnosisStart, recommendedHeaderStart);
  const recommendedMatchesSection = homeSource.slice(recommendedHeaderStart, recommendedHeaderEnd);

  assert.doesNotMatch(marketDiagnosisSection, /Refresh/);
  assert.match(recommendedMatchesSection, /Refresh/);
  assert.match(recommendedMatchesSection, /Requirement matches/);
  assert.match(recommendedMatchesSection, /Compared against your confirmed CV skills/);
  assert.match(recommendedMatchesSection, /Showing \{companyRequirementMatches\.length\} of \{allCompanyRequirementMatches\.length\}/);
});
