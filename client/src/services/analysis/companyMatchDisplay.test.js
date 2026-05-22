import test from "node:test";
import assert from "node:assert/strict";

import {
  getCompanyMatchToggleLabel,
  getVisibleCompanyMatches,
  shouldShowCompanyMatchToggle,
} from "./companyMatchDisplay.js";

test("shows six company requirement matches by default and all matches after expansion", () => {
  const jobMatches = Array.from({ length: 10 }, (_, index) => ({
    id: `job-${index + 1}`,
    title: `Job ${index + 1}`,
  }));

  assert.equal(getVisibleCompanyMatches(jobMatches).length, 6);
  assert.equal(getVisibleCompanyMatches(jobMatches, { showAll: true }).length, 10);
  assert.equal(shouldShowCompanyMatchToggle(jobMatches), true);
  assert.equal(getCompanyMatchToggleLabel(false), "Show more");
  assert.equal(getCompanyMatchToggleLabel(true), "Show less");
});

test("does not show the company match toggle when six or fewer jobs are visible", () => {
  const jobMatches = Array.from({ length: 6 }, (_, index) => ({
    id: `job-${index + 1}`,
    title: `Job ${index + 1}`,
  }));

  assert.equal(getVisibleCompanyMatches(jobMatches).length, 6);
  assert.equal(shouldShowCompanyMatchToggle(jobMatches), false);
});
