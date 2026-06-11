import { test, describe } from "node:test";
import assert from "node:assert";
import { readFileSync, existsSync } from "node:fs";
import { fileURLToPath } from "node:url";

describe("Authentication Flow Separation", () => {
  test("App.jsx has a /signup route", () => {
    const appSource = readFileSync(new URL("../App.jsx", import.meta.url), "utf8");
    assert.ok(appSource.includes('path="/signup"'), "App.jsx should contain a route for /signup");
    assert.ok(appSource.includes('<SignupPage'), "App.jsx should render SignupPage on /signup");
  });

  test("LoginPage.jsx does not have a Create Account button but has a link to signup", () => {
    const loginSource = readFileSync(new URL("./LoginPage.jsx", import.meta.url), "utf8");
    
    // Create Account button should be gone
    assert.ok(!loginSource.includes('Create Account\\n                  </button>'), "LoginPage should not have a Create Account button");
    
    // Should have a link to /signup
    assert.ok(loginSource.includes('to="/signup"'), "LoginPage should have a Link to /signup");
  });

  test("SignupPage.jsx exists and has a login link", () => {
    const signupPageUrl = new URL("./SignupPage.jsx", import.meta.url);
    assert.ok(existsSync(signupPageUrl), "SignupPage.jsx should exist");
    
    if (existsSync(signupPageUrl)) {
      const signupSource = readFileSync(signupPageUrl, "utf8");
      assert.ok(signupSource.includes('to="/login"'), "SignupPage should have a Link to the login page");
      assert.ok(signupSource.includes('to="/signup/employer"'), "SignupPage should have a Link to employer signup");
      assert.ok(signupSource.includes('handleCreateAccount'), "SignupPage should handle account creation");
    }
  });

  test("student auth screens use generic email copy and mark Google as student-only", () => {
    const loginSource = readFileSync(new URL("./LoginPage.jsx", import.meta.url), "utf8");
    const signupSource = readFileSync(new URL("./SignupPage.jsx", import.meta.url), "utf8");

    assert.ok(!loginSource.includes("University Email"), "LoginPage should use generic email copy");
    assert.ok(!signupSource.includes("University Email"), "SignupPage should use generic email copy");
    assert.ok(loginSource.includes("For student accounts only."), "LoginPage should mark Google sign-in as student-only");
    assert.ok(signupSource.includes("For student accounts only."), "SignupPage should mark Google sign-in as student-only");
  });
});
