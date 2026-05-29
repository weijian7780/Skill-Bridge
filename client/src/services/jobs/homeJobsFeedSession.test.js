import test from "node:test";
import assert from "node:assert/strict";

import {
  markCareerTargetSaved,
  readHasSavedCareerTarget,
} from "./homeJobsFeedSession.js";

function createMemoryStorage() {
  const values = new Map();

  return {
    getItem(key) {
      return values.has(key) ? values.get(key) : null;
    },
    setItem(key, value) {
      values.set(key, String(value));
    },
  };
}

test("readHasSavedCareerTarget is false until the student saves a target", () => {
  const storage = createMemoryStorage();

  assert.equal(readHasSavedCareerTarget(storage), false);

  markCareerTargetSaved(storage);

  assert.equal(readHasSavedCareerTarget(storage), true);
});
