import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync } from "node:fs";

describe("Auth Status Message", () => {
  test("AuthContext does not initialize authStatus to 'Ready'", () => {
    const authContextSource = readFileSync(new URL("./state/AuthContext.jsx", import.meta.url), "utf8");
    assert.ok(!authContextSource.includes('"Ready"'), "authStatus should not be initialized to 'Ready'");
  });

  test("LoginPage conditionally renders the status box or has no empty bordered box", () => {
    const loginSource = readFileSync(new URL("./pages/LoginPage.jsx", import.meta.url), "utf8");
    assert.ok(loginSource.includes('{(formStatus || authStatus) && ('), "Should conditionally render the status message box only when there is a message");
  });

  test("LoginPage warning message should be red on error", () => {
    const loginSource = readFileSync(new URL("./pages/LoginPage.jsx", import.meta.url), "utf8");
    assert.ok(loginSource.includes('text-error'), "Should have text-error class for the status message");
    // Ensure the condition applies error styles based on an error state, not just config.configured
    assert.ok(loginSource.includes('isError'), "Should track isError state to apply red warning styling");
  });
});
