import test from "node:test";
import assert from "node:assert/strict";

import {
  getRegionAnalysisCopy,
  getRegionOption,
  getRegionSearchValue,
  normaliseRegionId,
  regionOptions,
} from "./regionOptions.js";

test("uses All Malaysia as the default searchable region", () => {
  assert.equal(regionOptions[0].id, "all-malaysia");
  assert.equal(getRegionOption("all-malaysia").label, "All Malaysia");
  assert.equal(getRegionSearchValue("all-malaysia"), "Malaysia");
  assert.equal(getRegionAnalysisCopy("all-malaysia"), "across Malaysia");
});

test("normalises old saved region labels into stable region ids", () => {
  assert.equal(normaliseRegionId("Sabah"), "sabah");
  assert.equal(normaliseRegionId("Sabah, Malaysia"), "sabah");
  assert.equal(normaliseRegionId("Kuala Lumpur"), "kuala-lumpur");
  assert.equal(normaliseRegionId("Remote"), "remote-malaysia");
  assert.equal(normaliseRegionId("Singapore"), "all-malaysia");
});

test("includes Malaysia states and federal territories as target-market options", () => {
  assert.deepEqual(
    regionOptions.map((option) => option.id),
    [
      "all-malaysia",
      "remote-malaysia",
      "sabah",
      "sarawak",
      "selangor",
      "kuala-lumpur",
      "penang",
      "johor",
      "perak",
      "pahang",
      "kelantan",
      "terengganu",
      "kedah",
      "negeri-sembilan",
      "melaka",
      "perlis",
      "putrajaya",
      "labuan",
    ],
  );
});
