import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const appSource = readFileSync(new URL("../App.jsx", import.meta.url), "utf8")
  .replace(/\s+/g, " ");
const roadmapSource = readFileSync(new URL("../pages/RoadmapPage.jsx", import.meta.url), "utf8")
  .replace(/\s+/g, " ");
const roadmapDisplaySource = readFileSync(new URL("../services/roadmap/roadmapDisplay.js", import.meta.url), "utf8");

test("legacy target, cv, and analysis routes enter the compact home workspace", () => {
  for (const path of ["/target", "/cv", "/analysis"]) {
    assert.match(
      appSource,
      new RegExp(`<Route path="${path}" element=\\{<RequireAuth><Navigate to="/home" replace /></RequireAuth>\\}`),
    );
  }
});

test("roadmap empty state sends users back to the compact workspace", () => {
  assert.match(roadmapSource, /to="\/home"/);
  assert.match(roadmapSource, /Open Workspace/);
  assert.doesNotMatch(roadmapDisplaySource, /analysis page/i);
});
