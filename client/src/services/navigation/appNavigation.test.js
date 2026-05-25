import test from "node:test";
import assert from "node:assert/strict";

import { appNavigationItems } from "./appNavigation.js";

test("main navigation exposes career target editing", () => {
  assert.deepEqual(
    appNavigationItems.map((item) => item.to),
    ["/home", "/target", "/cv", "/analysis", "/roadmap", "/profile"],
  );

  assert.ok(appNavigationItems.some((item) => item.to === "/target" && item.label === "Target"));
});
