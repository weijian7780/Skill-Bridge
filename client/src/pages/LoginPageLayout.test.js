import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

describe("LoginPage Layout", () => {
  test("warning caption / status is displayed above the login button", () => {
    const loginSource = readFileSync(new URL("./LoginPage.jsx", import.meta.url), "utf8");
    
    const statusIndex = loginSource.indexOf("{formStatus || authStatus}");
    const actualButtonIndex = loginSource.indexOf("bg-primary text-on-primary");
    
    assert.ok(statusIndex !== -1, "Status caption should be present in the source");
    assert.ok(actualButtonIndex !== -1, "Login button should be present in the source");
    
    assert.ok(
      statusIndex < actualButtonIndex,
      "The status caption '{formStatus || authStatus}' must appear before the Login button in the DOM/JSX layout"
    );
  });
});
