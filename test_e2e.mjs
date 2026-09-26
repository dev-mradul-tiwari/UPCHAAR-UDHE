import puppeteer from "puppeteer";
import jwt from "jsonwebtoken";

const DOCTOR_ID = "cmugm76fj000si1hgsmpx5ity";
const HW_ID = "cmu9o89mg0000i1zs5lg872nx";
const PATIENT_ID = "cmugm76ho0017i1hggodvmlie";
const APPOINTMENT_ID = "cmugm76mb003qi1hgsku38mu1";

const doctorJwt = jwt.sign(
  { sub: DOCTOR_ID, role: "DOCTOR" },
  "replace-me-with-a-long-random-string",
  { expiresIn: "1h" }
);

async function run() {
  console.log("Launching browser...");
  const browser = await puppeteer.launch({ headless: "new", args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream'] });
  
  const docPage = await browser.newPage();
  await docPage.setCookie({ name: "upchaar_doctor_token", value: doctorJwt, domain: "localhost", path: "/" });
  console.log("Navigating Doctor to consultation...");
  await docPage.goto(`http://localhost:3001/consultation/${APPOINTMENT_ID}`);
  
  const hwPage = await browser.newPage();
  await hwPage.setCookie({ name: "worker_session", value: HW_ID, domain: "localhost", path: "/" });
  console.log("Navigating Health Worker to consultation...");
  await hwPage.goto(`http://localhost:3003/patients/${PATIENT_ID}/consultation`);
  
  console.log("Waiting for Doctor PreJoin...");
  await docPage.waitForSelector('button[type="submit"]', { timeout: 10000 });
  await docPage.click('button[type="submit"]');
  
  console.log("Waiting for Health Worker PreJoin...");
  await hwPage.waitForSelector('button[type="submit"]', { timeout: 10000 });
  await hwPage.click('button[type="submit"]');

  console.log("Waiting 5 seconds for WebRTC connection...");
  await new Promise(r => setTimeout(r, 5000));
  
  const extractLogs = async (page) => {
    return await page.evaluate(() => {
      const roomBadge = document.querySelector('.lk-room-name');
      const countBadge = document.querySelector('.lk-participant-count');
      const tiles = Array.from(document.querySelectorAll('.lk-participant-tile')).map(t => t.textContent.trim());
      const videoElements = Array.from(document.querySelectorAll('video')).map(v => v.videoWidth + 'x' + v.videoHeight);
      
      const diagBadge = document.querySelector('#livekit-diagnostics')?.textContent;

      return {
        roomName: roomBadge ? roomBadge.textContent : 'none',
        count: countBadge ? countBadge.textContent : 'none',
        tiles,
        videos: videoElements,
        diag: diagBadge
      };
    });
  };

  console.log("DOCTOR STATE:", await extractLogs(docPage));
  console.log("HEALTH WORKER STATE:", await extractLogs(hwPage));

  await browser.close();
}

run().catch(console.error);
