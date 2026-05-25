import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

async function readJsonConfig(path) {
  return JSON.parse(await readFile(new URL(path, import.meta.url), "utf8"));
}

function assertSpaFallback(config) {
  assert.deepEqual(config.rewrites, [
    {
      source: "/(.*)",
      destination: "/index.html",
    },
  ]);
}

test("Vercel rewrites React Router routes to the Vite entrypoint", async () => {
  const clientConfig = await readJsonConfig("../../vercel.json");
  const rootConfig = await readJsonConfig("../../../vercel.json");

  assertSpaFallback(clientConfig);
  assertSpaFallback(rootConfig);
});
