
import puppeteer from "puppeteer";

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({
    headless: true, // We must use new headless or just headless true
    args: [
      "--use-fake-ui-for-media-stream",
      "--use-fake-device-for-media-stream"
    ]
  });

  const logs = [];
  const captureLogs = (page, role) => {
    page.on("console", msg => {
      const text = msg.text();
      if (text.includes("[LIVEKIT")) {
        console.log(`[${role}] ${text}`);
        logs.push(`[${role}] ${text}`);
      }
    });
  };

  try {
    // Tab 1: Health Worker
    console.log("Opening Health Worker...");
    const hwPage = await browser.newPage();
    captureLogs(hwPage, "HEALTH_WORKER");
    
    // Login Health Worker
    await hwPage.goto("http://localhost:3003/login");
    await hwPage.waitForSelector("input[type=email]");
    await hwPage.type("input[type=email]", "ashaworker@example.com");
    await hwPage.type("input[type=password]", "password");
    await hwPage.click("button[type=submit]");
    await hwPage.waitForNavigation();
    
    // Go to Mradul Tiwari consultation (patient ID: cmugm76ho0017i1hggodvmlie)
    await hwPage.goto("http://localhost:3003/patients/cmugm76ho0017i1hggodvmlie/consultation");
    
    // Tab 2: Doctor
    console.log("Opening Doctor...");
    const docPage = await browser.newPage();
    captureLogs(docPage, "DOCTOR");
    
    // Login Doctor
    await docPage.goto("http://localhost:3001/login");
    await docPage.waitForSelector("input[type=email]");
    await docPage.type("input[type=email]", "doctor@example.com");
    await docPage.type("input[type=password]", "password");
    await docPage.click("button[type=submit]");
    await docPage.waitForNavigation();
    
    // Go to IN_PROGRESS appointment consultation
    await docPage.goto("http://localhost:3001/consultation/cmugm76mb003qi1hgsku38mu1");

    console.log("Waiting for PreJoin screens...");
    // Wait for the PreJoin screen on both and click Join
    // In livekit-components-react, the prejoin submit button has class `lk-button`
    await hwPage.waitForSelector(".lk-button", { timeout: 10000 }).catch(() => {});
    await docPage.waitForSelector(".lk-button", { timeout: 10000 }).catch(() => {});

    console.log("Clicking Join...");
    await hwPage.evaluate(() => {
      const btn = document.querySelector(".lk-button");
      if (btn) btn.click();
    });
    
    await docPage.evaluate(() => {
      const btn = document.querySelector(".lk-button");
      if (btn) btn.click();
    });

    console.log("Waiting for 10 seconds to collect WebRTC events...");
    await new Promise(resolve => setTimeout(resolve, 10000));

  } catch (err) {
    console.error("Test error:", err);
  } finally {
    await browser.close();
  }
}

run();

