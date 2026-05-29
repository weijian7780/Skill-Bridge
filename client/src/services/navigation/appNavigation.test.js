import test from "node:test";
import assert from "node:assert/strict";

import { appNavigationItems } from "./appNavigation.js";

test("main navigation exposes the compact workspace routes", () => {
  assert.deepEqual(
    appNavigationItems.map((item) => item.to),
    ["/home", "/roadmap", "/applications", "/profile"],
  );

  assert.ok(appNavigationItems.some((item) => item.to === "/home" && item.label === "Home"));
  assert.ok(appNavigationItems.some((item) => item.to === "/roadmap" && item.label === "Roadmap"));
  assert.ok(appNavigationItems.some((item) => item.to === "/applications" && item.label === "Applications"));
  assert.ok(appNavigationItems.some((item) => item.to === "/profile" && item.label === "Profile"));
  assert.ok(!appNavigationItems.some((item) => item.label === "Jobs"));
});
