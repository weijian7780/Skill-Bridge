import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

test("uses an original light job-platform theme", async () => {
  const indexHtml = await readFile(new URL("../../index.html", import.meta.url), "utf8");
  const globalCss = await readFile(new URL("../styles/index.css", import.meta.url), "utf8");

  assert.match(indexHtml, /surface:\s+"#f4f7fb"/);
  assert.match(indexHtml, /primary:\s+"#0b63ce"/);
  assert.match(indexHtml, /"surface-container":\s+"#ffffff"/);
  assert.doesNotMatch(indexHtml, /<html class="dark"/);
  assert.match(globalCss, /background:\s*#f4f7fb/);
  assert.doesNotMatch(globalCss, /background:\s*#051424/);
});

test("home workspace industry filter removes the native select border", async () => {
  const homeSource = await readFile(new URL("../pages/HomePage.jsx", import.meta.url), "utf8");
  const industryStart = homeSource.indexOf("Industry");
  const industryEnd = homeSource.indexOf("</select>", industryStart);
  const industryControl = homeSource.slice(industryStart, industryEnd);

  assert.match(industryControl, /border-0/);
  assert.match(industryControl, /focus:ring-0/);
});
