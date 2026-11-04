import { loadPlaywright, serve } from "../tests/runtime.mjs";
const { chromium } = await loadPlaywright();
const server = await serve("public", "/", {
  "/share-card.html": "scripts/share-card.html",
});
let browser;
try {
  browser = await chromium.launch({ headless: true });
  const page = await browser.newPage({
    viewport: { width: 1200, height: 630 },
    deviceScaleFactor: 1,
  });
  await page.goto(server.origin + "/share-card.html", {
    waitUntil: "networkidle",
  });
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: "public/assets/share-card.png" });
  console.log("Rendered public/assets/share-card.png (1200 × 630).");
} finally {
  await browser?.close();
  await server.close();
}
