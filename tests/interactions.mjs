import assert from "node:assert/strict";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { loadPlaywright, loadAxe, serve } from "./runtime.mjs";

const { chromium, webkit } = await loadPlaywright();
const { default: AxeBuilder } = await loadAxe();
const results = [];
const screenshots = "test/scratch/interaction-shots";
await mkdir(screenshots, { recursive: true });
await mkdir("artifacts", { recursive: true });
const server = await serve();
const report = {
  at: new Date().toISOString(),
  target: "dist/ served at /preview/",
  results,
};
let browser;
let activePage;
async function test(name, run) {
  try {
    const detail = await run();
    results.push({ name, passed: true, ...(detail ? { detail } : {}) });
    console.log(`PASS ${name}`);
  } catch (error) {
    const message = /browserType\.launch/.test(error.message)
      ? "Browser launch failed: required runtime libraries are unavailable."
      : error.message;
    results.push({ name, passed: false, error: message });
    console.log(`FAIL ${name}: ${message}`);
    await activePage?.keyboard.press("Escape").catch(() => {});
  }
}
async function checkNoOverflow(page, label) {
  const width = await page.evaluate(() => ({
    scroll: document.documentElement.scrollWidth,
    client: document.documentElement.clientWidth,
  }));
  assert.ok(
    width.scroll <= width.client + 1,
    `${label}: ${width.scroll} > ${width.client}`,
  );
}
async function save(page) {
  return page.evaluate(() => JSON.parse(localStorage.getItem("myth-arena-v1")));
}
async function axe(page, state) {
  const result = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
    .analyze();
  assert.deepEqual(
    result.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target),
    })),
    [],
    `Accessibility violations in ${state}`,
  );
  return `${result.passes.length} rules passed; ${result.incomplete.length} require manual review`;
}
try {
  browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  activePage = page;
  page.setDefaultTimeout(8000);
  const failures = [];
  const external = [];
  page.on("pageerror", (error) => failures.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") failures.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failures.push(`${response.status()} ${new URL(response.url()).pathname}`);
  });
  await page.route("**/*", (route) => {
    const url = route.request().url();
    if (url.startsWith(server.origin) || url.startsWith("data:"))
      return route.continue();
    external.push(url);
    return route.abort();
  });

  await test("Production export, metadata, fonts and local assets", async () => {
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);
    assert.match(await page.title(), /Myth Arena/);
    for (const selector of [
      'meta[name="description"]',
      'meta[property="og:title"]',
      'meta[property="og:image"]',
    ])
      assert.ok(await page.locator(selector).getAttribute("content"));
    const image = await page
      .locator('meta[property="og:image"]')
      .getAttribute("content");
    const response = await page.request.get(new URL(image, server.url).href);
    assert.equal(response.status(), 200);
    assert.equal(response.headers()["content-type"], "image/png");
    const imageBytes = await response.body();
    assert.equal(imageBytes.subarray(1, 4).toString(), "PNG");
    assert.equal(
      await page.evaluate(
        () =>
          document.fonts.check('14px "DM Sans"') &&
          document.fonts.check('64px "DM Serif Display"'),
      ),
      true,
    );
    assert.equal(await page.locator(".egg-card").count(), 3);
    assert.deepEqual(external, []);
    assert.deepEqual(failures, []);
  });
  await test("Responsive overview and first mobile screen", async () => {
    for (const width of [320, 390, 620, 760, 900, 1060, 1250, 1440, 1920]) {
      await page.setViewportSize({ width, height: 844 });
      await checkNoOverflow(page, `overview ${width}`);
      if (width === 390) {
        const main = await page
          .getByRole("button", { name: "Enter the arena", exact: true })
          .boundingBox();
        const product = await page.locator(".hero-image").boundingBox();
        assert.ok(
          main.y + main.height < 744 && product.y < 400,
          "Product and main action must be on first screen",
        );
        await page.screenshot({
          path: "artifacts/mobile-390.jpg",
          type: "jpeg",
          quality: 85,
        });
      }
    }
    await page.setViewportSize({ width: 1440, height: 1000 });
    await page.screenshot({
      path: "artifacts/desktop-1440.jpg",
      type: "jpeg",
      quality: 85,
    });
  });
  await test("Overview automated accessibility", () => axe(page, "overview"));
  await test("Keyboard guide dialog, Escape, focus containment and return", async () => {
    const trigger = page.getByRole("button", {
      name: "How to play Myth Arena",
    });
    await trigger.focus();
    await page.keyboard.press("Enter");
    assert.equal(await page.getByRole("dialog").isVisible(), true);
    assert.equal(
      await page.evaluate(
        () => document.activeElement.closest("dialog") !== null,
      ),
      true,
    );
    await page.keyboard.press("Tab");
    assert.equal(
      await page.evaluate(
        () => document.activeElement.closest("dialog") !== null,
      ),
      true,
    );
    await page.keyboard.press("Escape");
    assert.equal(await page.getByRole("dialog").count(), 0);
    assert.equal(
      await trigger.evaluate((el) => document.activeElement === el),
      true,
    );
  });
  await test("Egg filters, keyboard hatching, reveal, counts and persistence", async () => {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: /^Hatchery/ })
      .click();
    await page.getByRole("button", { name: "Fire", exact: true }).click();
    assert.equal(await page.locator(".egg-card").count(), 1);
    assert.match(await page.locator(".egg-card").innerText(), /Ember egg/);
    await page.getByRole("button", { name: /^All eggs/ }).click();
    const hatch = page.getByRole("button", {
      name: "Hatch verdant egg",
      exact: true,
    });
    await hatch.focus();
    await page.keyboard.press("Enter");
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Hatch verdant egg", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Mossfang has awakened." })
      .waitFor();
    assert.equal((await save(page)).dragons.length, 2);
    assert.equal((await save(page)).eggs.length, 2);
    await page
      .getByRole("button", { name: "Select for battle", exact: true })
      .click();
    await page
      .getByRole("heading", { name: "Your dragon. Your strategy." })
      .waitFor();
    assert.equal((await save(page)).selected, "mossfang");
    await page.reload({ waitUntil: "networkidle" });
    assert.equal((await save(page)).selected, "mossfang");
    assert.equal(
      await page.getByRole("radio", { checked: true }).first().count(),
      1,
    );
  });
  await test("Collection search, element filter, empty recovery and dragon details", async () => {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: "My dragons" })
      .click();
    await page
      .getByLabel("Search dragons", { exact: true })
      .fill("no such dragon");
    await page.getByRole("heading", { name: "No dragons found." }).waitFor();
    await page.getByRole("button", { name: "Clear filters" }).click();
    assert.equal(await page.locator(".collection-dragon").count(), 2);
    await page.getByLabel("Element", { exact: true }).selectOption("Nature");
    assert.equal(await page.locator(".collection-dragon").count(), 1);
    await page.getByRole("button", { name: /View Mossfang/ }).click();
    await page.getByRole("dialog").waitFor();
    assert.match(await page.getByRole("dialog").innerText(), /140/);
    await page.keyboard.press("Escape");
    await page
      .getByLabel("Element", { exact: true })
      .selectOption("All elements");
    await checkNoOverflow(page, "dragon collection");
  });
  await test("AI battle guard, charge, burst, victory, XP and replay", async () => {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: "Battle arena" })
      .click();
    await page
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    assert.equal(
      await page.getByRole("button", { name: /^Elemental burst/ }).isDisabled(),
      true,
    );
    await page.getByRole("button", { name: /^Strike/ }).click();
    await page.getByRole("button", { name: /^Strike/ }).click();
    await page
      .getByText("Heavy strike incoming. A good time to guard.")
      .waitFor();
    const before = Number(
      await page
        .getByRole("progressbar", { name: "Your dragon health", exact: true })
        .getAttribute("aria-valuenow"),
    );
    await page.getByRole("button", { name: /^Guard/ }).click();
    const after = Number(
      await page
        .getByRole("progressbar", { name: "Your dragon health", exact: true })
        .getAttribute("aria-valuenow"),
    );
    assert.equal(before - after, 10);
    assert.equal(
      await page.getByRole("button", { name: /^Elemental burst/ }).isDisabled(),
      false,
    );
    await page.getByRole("button", { name: /^Elemental burst/ }).click();
    for (
      let i = 0;
      i < 8 && (await page.getByRole("button", { name: /^Strike/ }).count());
      i++
    )
      await page.getByRole("button", { name: /^Strike/ }).click();
    await page.getByRole("heading", { name: "The arena is yours." }).waitFor();
    assert.equal((await save(page)).wins, 1);
    assert.equal((await save(page)).battles, 1);
    assert.equal((await save(page)).xp, 60);
    await page.getByRole("button", { name: "Battle again" }).click();
    assert.equal(
      await page
        .getByRole("progressbar", { name: "Your dragon health", exact: true })
        .getAttribute("aria-valuenow"),
      "140",
    );
    assert.equal((await save(page)).xp, 60);
    await page.reload({ waitUntil: "networkidle" });
    assert.equal(
      await page
        .getByRole("button", { name: "Start battle", exact: true })
        .isVisible(),
      true,
    );
  });
  await test("Local PvP player selection, alternating moves, guard, result and rematch", async () => {
    await page.getByRole("button", { name: "Local PvP", exact: true }).click();
    await page
      .getByLabel("Player 2: choose your dragon", { exact: true })
      .selectOption("ashwing");
    await page
      .getByRole("button", { name: "Start local duel", exact: true })
      .click();
    await page.getByRole("heading", { name: "Player 1, your move." }).waitFor();
    await page.getByRole("button", { name: /^Guard/ }).click();
    await page.getByRole("heading", { name: "Player 2, your move." }).waitFor();
    await page.getByRole("button", { name: /^Strike/ }).click();
    assert.equal(
      await page
        .getByRole("progressbar", { name: "Player 1 health" })
        .getAttribute("aria-valuenow"),
      "131",
    );
    for (
      let i = 0;
      i < 30 && (await page.getByRole("button", { name: /^Strike/ }).count());
      i++
    ) {
      const charge = await page
        .getByRole("button", { name: /^Elemental burst/ })
        .isEnabled();
      await page
        .getByRole("button", { name: charge ? /^Elemental burst/ : /^Strike/ })
        .click();
    }
    await page
      .getByRole("heading", { name: /Player [12] conquers the arena/ })
      .waitFor();
    assert.equal((await save(page)).xp, 60);
    assert.equal((await save(page)).battles, 1);
    await page.screenshot({ path: screenshots + "/duel-result.png" });
    await page
      .getByRole("button", { name: "Start rematch", exact: true })
      .click();
    await page.getByRole("heading", { name: "Player 1, your move." }).waitFor();
    await page.reload({ waitUntil: "networkidle" });
  });
  await test("AI defeat, honest reward, and retry", async () => {
    await page.getByRole("radio", { name: /Veteran/ }).check();
    await page
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    for (
      let i = 0;
      i < 25 && (await page.getByRole("button", { name: /^Guard/ }).count());
      i++
    )
      await page.getByRole("button", { name: /^Guard/ }).click();
    await page.getByRole("heading", { name: "Every legend learns." }).waitFor();
    assert.equal((await save(page)).wins, 1);
    assert.equal((await save(page)).battles, 2);
    assert.equal((await save(page)).xp, 80);
    await page
      .getByRole("button", { name: "Choose a dragon", exact: true })
      .click();
  });
  await test("Profile validation, rename, export and reset cancellation", async () => {
    await page
      .locator(".sidebar")
      .getByRole("button", { name: /Local profile/ })
      .click();
    await page.getByLabel("Keeper name", { exact: true }).fill("A");
    await page.getByRole("button", { name: "Save name" }).click();
    assert.equal(
      await page.getByLabel("Keeper name").getAttribute("aria-invalid"),
      "true",
    );
    await page.getByLabel("Keeper name").fill("Ember Keeper");
    await page.getByRole("button", { name: "Save name" }).click();
    assert.equal((await save(page)).name, "Ember Keeper");
    await page
      .locator(".sidebar")
      .getByRole("button", { name: /Local profile/ })
      .click();
    const download = page.waitForEvent("download");
    await page.getByRole("button", { name: "Export progress" }).click();
    const file = await download;
    assert.equal(file.suggestedFilename(), "myth-arena-progress.json");
    const exported = await readFile(await file.path(), "utf8");
    assert.equal(JSON.parse(exported).name, "Ember Keeper");
    await page
      .getByRole("button", { name: "Reset progress", exact: true })
      .click();
    await page.getByRole("button", { name: "Keep my progress" }).click();
    assert.equal((await save(page)).name, "Ember Keeper");
    await page.keyboard.press("Escape");
  });
  await test("All eggs hatched, empty hatchery and filter recovery", async () => {
    await page
      .locator(".sidebar")
      .getByRole("link", { name: /^Hatchery/ })
      .click();
    for (const egg of ["ember", "storm"]) {
      await page
        .getByRole("button", { name: `Hatch ${egg} egg`, exact: true })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: `Hatch ${egg} egg`, exact: true })
        .click();
      await page
        .getByRole("button", { name: "View collection", exact: true })
        .click();
      await page
        .locator(".sidebar")
        .getByRole("link", { name: /^Hatchery/ })
        .click();
    }
    await page.getByRole("heading", { name: "Your nest is empty." }).waitFor();
    assert.equal((await save(page)).dragons.length, 4);
    await page.getByRole("button", { name: "View your dragons" }).click();
  });
  await test("All views reflow at phone widths and 200% text enlargement", async () => {
    for (const width of [320, 390, 620, 900, 1440]) {
      await page.setViewportSize({ width, height: 844 });
      for (const view of ["overview", "hatchery", "dragons", "arena"]) {
        await page.goto(server.url + "#" + view, { waitUntil: "networkidle" });
        await checkNoOverflow(page, `${view} ${width}`);
      }
    }
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(server.url, { waitUntil: "networkidle" });
    await page.addStyleTag({ content: "html { font-size: 200% !important; }" });
    await checkNoOverflow(page, "200% text enlargement");
    await page.screenshot({
      path: screenshots + "/text-200-percent.png",
      fullPage: true,
    });
    await page.reload({ waitUntil: "networkidle" });
  });
  await test("Reduced motion and visible keyboard focus", async () => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    const button = page.getByRole("button", {
      name: "Enter the arena",
      exact: true,
    });
    await button.focus();
    const styles = await button.evaluate((el) => ({
      outline: getComputedStyle(el).outlineWidth,
      transition: getComputedStyle(el).transitionDuration,
    }));
    assert.equal(styles.outline, "2px");
    assert.equal(styles.transition, "0s");
    assert.equal(
      await page.evaluate(
        () =>
          document.getAnimations().filter((a) => a.playState === "running")
            .length,
      ),
      0,
    );
    await page.screenshot({ path: screenshots + "/keyboard-focus.png" });
  });
  await test("Arena setup, battle and dialog automated accessibility", async () => {
    await page.goto(server.url + "#arena", { waitUntil: "networkidle" });
    await axe(page, "arena setup");
    await page
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    await axe(page, "active battle");
    await page.getByRole("button", { name: "How to play Myth Arena" }).click();
    await axe(page, "guide modal");
    await page.keyboard.press("Escape");
  });
  await test("Corrupt saved progress recovers without crashing", async () => {
    await page.evaluate(() =>
      localStorage.setItem("myth-arena-v1", "{bad json"),
    );
    await page.reload({ waitUntil: "networkidle" });
    await page.getByText(/Saved progress could not be read/).waitFor();
    assert.equal((await save(page)).dragons.length, 1);
  });
  await test("Blocked storage keeps the game playable with an honest notice", async () => {
    const isolated = await browser.newContext({
      viewport: { width: 390, height: 844 },
    });
    await isolated.addInitScript(() => {
      Object.defineProperty(window, "localStorage", {
        get() {
          throw new DOMException("Unavailable", "SecurityError");
        },
      });
    });
    const blocked = await isolated.newPage();
    await blocked.goto(server.url, { waitUntil: "networkidle" });
    await blocked.getByText(/Progress cannot be saved/).waitFor();
    await blocked.getByRole("button", { name: "Enter the arena" }).click();
    await blocked
      .getByRole("button", { name: "Start battle", exact: true })
      .click();
    assert.equal(
      await blocked.getByRole("button", { name: /^Strike/ }).isVisible(),
      true,
    );
    await isolated.close();
  });
  await test("Mobile touch hatching, AI battle and local PvP at 320 and 390", async () => {
    for (const width of [320, 390]) {
      const mobile = await browser.newContext({
        viewport: { width, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      });
      try {
        const p = await mobile.newPage();
        p.setDefaultTimeout(8000);
        const errors = [];
        p.on("pageerror", (e) => errors.push(e.message));
        await p.goto(server.url, { waitUntil: "networkidle" });
        await p
          .locator(".mobile-nav")
          .getByRole("link", { name: "Hatchery", exact: true })
          .tap();
        await p
          .getByRole("button", { name: "Hatch verdant egg", exact: true })
          .tap();
        await checkNoOverflow(p, `hatch dialog ${width}`);
        await p
          .getByRole("dialog")
          .getByRole("button", { name: "Hatch verdant egg", exact: true })
          .tap();
        await p
          .getByRole("button", { name: "Select for battle", exact: true })
          .tap();
        await p
          .getByRole("button", { name: "Start battle", exact: true })
          .tap();
        await checkNoOverflow(p, `active AI battle ${width}`);
        await p.getByRole("button", { name: /^Strike/ }).tap();
        assert.equal(
          await p
            .getByRole("progressbar", {
              name: "Your dragon health",
              exact: true,
            })
            .getAttribute("aria-valuenow"),
          "121",
        );
        await p.reload({ waitUntil: "networkidle" });
        await p.getByRole("button", { name: "Local PvP", exact: true }).tap();
        await p
          .getByLabel("Player 2: choose your dragon", { exact: true })
          .selectOption("ashwing");
        await p
          .getByRole("button", { name: "Start local duel", exact: true })
          .tap();
        await p.getByRole("button", { name: /^Guard/ }).tap();
        await p
          .getByRole("heading", { name: "Player 2, your move." })
          .waitFor();
        await p.getByRole("button", { name: /^Strike/ }).tap();
        await checkNoOverflow(p, `active local duel ${width}`);
        assert.equal(
          await p
            .getByRole("progressbar", { name: "Player 1 health" })
            .getAttribute("aria-valuenow"),
          "131",
        );
        await axe(p, `mobile local duel ${width}`);
        if (width === 390) {
          await p.evaluate(() => {
            if (document.activeElement instanceof HTMLElement)
              document.activeElement.blur();
            window.scrollTo({ top: 0, behavior: "auto" });
          });
          await p.waitForTimeout(180);
          await p.screenshot({
            path: "artifacts/mobile-duel.jpg",
            type: "jpeg",
            quality: 85,
            fullPage: true,
          });
        }
        assert.deepEqual(errors, []);
      } finally {
        await mobile.close();
      }
    }
  });
  await test("No browser script, console, resource, or external-request failures", async () => {
    assert.deepEqual(failures, []);
    assert.deepEqual(external, []);
  });

  await test("WebKit mobile hatch and battle flow", async () => {
    let safari;
    try {
      safari = await webkit.launch({ headless: true });
      const p = await safari.newPage({
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        isMobile: true,
        hasTouch: true,
      });
      const errors = [];
      p.on("pageerror", (e) => errors.push(e.message));
      await p.goto(server.url, { waitUntil: "networkidle" });
      await checkNoOverflow(p, "WebKit overview");
      await p.getByRole("button", { name: "Explore the hatchery" }).click();
      await p
        .getByRole("button", { name: "Hatch verdant egg", exact: true })
        .click();
      await p
        .getByRole("dialog")
        .getByRole("button", { name: "Hatch verdant egg", exact: true })
        .click();
      await p.getByRole("button", { name: "Select for battle" }).click();
      await p
        .getByRole("button", { name: "Start battle", exact: true })
        .click();
      for (
        let i = 0;
        i < 10 && (await p.getByRole("button", { name: /^Strike/ }).count());
        i++
      )
        await p.getByRole("button", { name: /^Strike/ }).click();
      await p.getByRole("heading", { name: "The arena is yours." }).waitFor();
      assert.deepEqual(errors, []);
      await p.screenshot({ path: screenshots + "/webkit-victory.png" });
    } finally {
      await safari?.close();
    }
  });
} finally {
  await browser?.close();
  await server.close();
  report.passed = results.filter((r) => r.passed).length;
  report.failed = results.filter((r) => !r.passed).length;
  await writeFile(
    "artifacts/interaction-results.json",
    JSON.stringify(report, null, 2) + "\n",
  );
  console.log(`${report.passed} passed, ${report.failed} failed.`);
}
if (report.failed) process.exitCode = 1;
