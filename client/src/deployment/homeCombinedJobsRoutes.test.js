import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../App.jsx", import.meta.url), "utf8")
  .replace(/\s+/g, " ");

test("/jobs redirects students to the home jobs feed anchor", () => {
  assert.match(
    appSource,
    /<Route path="\/jobs" element=\{<RequireAuth><RequireRole role="student"><RequireSetup><Navigate to="\/home#jobs" replace \/><\/RequireSetup><\/RequireRole><\/RequireAuth>\}/,
  );
});

test("home page wires the combined jobs feed anchor", () => {
  const homeSource = readFileSync(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");
  const feedSource = readFileSync(new URL("../components/HomeJobsFeed.jsx", import.meta.url), "utf8");
  assert.match(homeSource, /HomeJobsFeed/);
  assert.match(homeSource, /hasSavedCareerTarget=\{hasSavedCareerTarget\}/);
  assert.match(feedSource, /id="jobs"/);
});

test("job actions live in the detail panel, not the feed list cards", () => {
  // Apply / Open listing buttons belong to the detail panel; the feed list is for
  // browsing and only marks jobs the student already applied to.
  const feedSource = readFileSync(new URL("../components/HomeJobsFeed.jsx", import.meta.url), "utf8");
  const detailSource = readFileSync(new URL("../components/JobDetailPanel.jsx", import.meta.url), "utf8");

  assert.match(detailSource, /Open listing/);
  assert.match(detailSource, /Apply/);
  assert.doesNotMatch(detailSource, /Apply now/);

  assert.match(feedSource, /Applied/);
  assert.doesNotMatch(feedSource, /Open listing/);
});

test("home page contains exact UI phrases", () => {
  const homeSource = readFileSync(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");
  assert.match(homeSource, /Requirement matches/);
  assert.match(homeSource, /Refresh/);
  assert.match(homeSource, /Salary undisclosed/);
  assert.match(homeSource, /Open listing/);
});

