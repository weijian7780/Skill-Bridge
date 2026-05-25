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

test("home workspace places refresh jobs in the recommended matches header", () => {
  const marketDiagnosisStart = homeSource.indexOf("Market diagnosis");
  const recommendedMatchesStart = homeSource.indexOf("Recommended matches");
  const recommendedMatchesEnd = homeSource.indexOf("<EmptyMarketState", recommendedMatchesStart);

  const marketDiagnosisSection = homeSource.slice(marketDiagnosisStart, recommendedMatchesStart);
  const recommendedMatchesSection = homeSource.slice(recommendedMatchesStart, recommendedMatchesEnd);

  assert.doesNotMatch(marketDiagnosisSection, /Refresh jobs/);
  assert.match(recommendedMatchesSection, /Refresh jobs/);
  assert.match(recommendedMatchesSection, /Showing \{companyRequirementMatches\.length\} of \{allCompanyRequirementMatches\.length\}/);
});
