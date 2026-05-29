import { chromium } from "playwright";
import { exec } from "child_process";
import { promisify } from "util";

const execAsync = promisify(exec);

async function run() {
  console.log("Starting server...");
  const server = exec("npm run dev", { cwd: "./" });
  
  await new Promise(resolve => setTimeout(resolve, 5000)); // wait for vite
  
  console.log("Launching browser...");
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  page.on("pageerror", err => console.log("PAGE ERROR:", err.message));
  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("CONSOLE ERROR:", msg.text());
    }
  });

  try {
    console.log("Navigating to /home...");
    await page.goto("http://localhost:5173/", { waitUntil: "networkidle" });
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if we need to login
    const loginButton = await page.$("button:has-text('Log in')");
    if (loginButton) {
      console.log("Logging in...");
      await page.fill("input[type='email']", "student@example.com");
      await page.fill("input[type='password']", "password123");
      await loginButton.click();
      await new Promise(resolve => setTimeout(resolve, 5000));
    }

    console.log("Navigating to /home again...");
    await page.goto("http://localhost:5173/home", { waitUntil: "networkidle" });
    await new Promise(resolve => setTimeout(resolve, 2000));

    console.log("Done.");
  } finally {
    await browser.close();
    server.kill();
  }
}

run().catch(console.error);
