import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../App.jsx", import.meta.url), "utf8")
  .replace(/\s+/g, " ");

test("/jobs redirects students to the home jobs feed anchor", () => {
  assert.match(
    appSource,
    /<Route path="\/jobs" element=\{<RequireAuth><RequireRole role="student"><Navigate to="\/home#jobs" replace \/><\/RequireRole><\/RequireAuth>\}/,
  );
});

test("home page wires the combined jobs feed anchor", () => {
  const homeSource = readFileSync(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");
  const feedSource = readFileSync(new URL("../components/HomeJobsFeed.jsx", import.meta.url), "utf8");
  assert.match(homeSource, /HomeJobsFeed/);
  assert.match(homeSource, /hasSavedCareerTarget=\{hasSavedCareerTarget\}/);
  assert.match(feedSource, /id="jobs"/);
});

test("combined jobs feed component uses the exact phrases from the UI spec", () => {
  const feedSource = readFileSync(new URL("../components/HomeJobsFeed.jsx", import.meta.url), "utf8");
  assert.match(feedSource, /Open listing/);
  assert.doesNotMatch(feedSource, /View job/);
  assert.match(feedSource, /Apply/);
  assert.doesNotMatch(feedSource, /Apply now/);
});

test("home page contains exact UI phrases", () => {
  const homeSource = readFileSync(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");
  assert.match(homeSource, /Requirement matches/);
  assert.match(homeSource, /Refresh/);
  assert.match(homeSource, /Salary undisclosed/);
  assert.match(homeSource, /Open listing/);
});

