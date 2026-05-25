import test from "node:test";
import assert from "node:assert/strict";

import { buildRoadmap } from "./roadmapEngine.js";

test("does not create placeholder roadmap items when no market gaps exist", () => {
  assert.deepEqual(buildRoadmap([]), []);
});

test("builds roadmap items only from detected missing skills", () => {
  const roadmap = buildRoadmap(["Power BI"]);

  assert.equal(roadmap.length, 1);
  assert.equal(roadmap[0].title, "Power BI Dashboards");
});
