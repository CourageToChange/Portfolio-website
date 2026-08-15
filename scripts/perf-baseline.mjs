/**
 * Portfolio performance baseline.
 *
 * The site has NO tests, so nothing catches a regression. This script exists to give the
 * optimization phase the one thing it needs to be safe: numbers taken before anything changes,
 * repeatable afterwards, on the LIVE url rather than a local file. Local and live have disagreed
 * before on a byte-identical bundle, so measuring the file on disk proves nothing about what a
 * recruiter loads.
 *
 * Usage:
 *   node scripts/perf-baseline.mjs                       # live site, phone + desktop
 *   node scripts/perf-baseline.mjs --url http://...       # somewhere else
 *   node scripts/perf-baseline.mjs --json out.json        # save for comparison
 *
 * Requires playwright. This repo has no dependencies by design, so it borrows the install from
 * a sibling project rather than adding one here.
 */
import { writeFileSync, existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

// Borrowed from a sibling project rather than adding a dependency here: "no dependencies I have
// not read" is a claim this site makes to recruiters, and a measurement script is not worth
// weakening it. Resolved at run time so the path is checked rather than assumed.
const PLAYWRIGHT_CANDIDATES = [
  path.resolve(process.cwd(), "../Codex/node_modules/playwright/index.mjs"),
  path.resolve(process.cwd(), "../Puzzle Game/node_modules/playwright/index.mjs"),
  path.resolve(process.cwd(), "../Signal Room/frontend/node_modules/playwright/index.mjs"),
];
const playwrightPath = PLAYWRIGHT_CANDIDATES.find(existsSync);
if (!playwrightPath) {
  console.error("playwright not found. Looked in:\n  " + PLAYWRIGHT_CANDIDATES.join("\n  "));
  process.exit(1);
}
const { chromium } = await import(pathToFileURL(playwrightPath).href);

const args = process.argv.slice(2);
const opt = (name, fallback) => {
  const i = args.indexOf(`--${name}`);
  return i === -1 ? fallback : args[i + 1];
};

// Not named URL: that would shadow the global URL constructor used further down.
const TARGET = opt("url", "https://noor.noorfamily.uk/");
const JSON_OUT = opt("json", null);

// 🔴 hasTouch + isMobile are mandatory for the phone profile. Without them the page gets the
// desktop layout at a phone width, which measures something nobody ever sees.
const PROFILES = [
  {
    name: "phone",
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
    cpuThrottle: 4,
  },
  {
    name: "desktop",
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    isMobile: false,
    hasTouch: false,
    cpuThrottle: 1,
  },
];

/** Collects Core Web Vitals from inside the page. */
const VITALS = `
new Promise((resolve) => {
  const out = { lcp: 0, cls: 0, longTasks: 0, longTaskMs: 0 };
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) out.lcp = Math.max(out.lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) if (!e.hadRecentInput) out.cls += e.value;
    }).observe({ type: "layout-shift", buffered: true });
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) { out.longTasks++; out.longTaskMs += e.duration; }
    }).observe({ type: "longtask", buffered: true });
  } catch {}
  setTimeout(() => {
    const nav = performance.getEntriesByType("navigation")[0] || {};
    const paint = performance.getEntriesByType("paint");
    out.ttfb = nav.responseStart || 0;
    out.domContentLoaded = nav.domContentLoadedEventEnd || 0;
    out.fcp = (paint.find((p) => p.name === "first-contentful-paint") || {}).startTime || 0;
    resolve(out);
  }, 5000);
})`;

/** Measures frames actually painted over one second, while the animations run. */
const FPS = `
new Promise((resolve) => {
  let frames = 0;
  const started = performance.now();
  const tick = () => { frames++; if (performance.now() - started < 1000) requestAnimationFrame(tick); else resolve(frames); };
  requestAnimationFrame(tick);
})`;

async function measure(browser, profile) {
  const context = await browser.newContext({
    viewport: profile.viewport,
    deviceScaleFactor: profile.deviceScaleFactor,
    isMobile: profile.isMobile,
    hasTouch: profile.hasTouch,
    // A PWA re-registers its service worker on every load; this page has none, but blocking
    // keeps the run deterministic if one is ever added.
    serviceWorkers: "block",
  });

  const page = await context.newPage();
  const requests = [];
  page.on("response", async (r) => {
    let size = 0;
    try { size = (await r.body()).length; } catch {}
    requests.push({
      url: r.url(),
      status: r.status(),
      type: r.request().resourceType(),
      bytes: size,
      thirdParty: !r.url().includes("noorfamily.uk"),
    });
  });
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });

  const cdp = await context.newCDPSession(page);
  if (profile.cpuThrottle > 1) {
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: profile.cpuThrottle });
  }
  // DOM must be enabled before CSS, or CSS.enable fails with "DOM agent needs to be enabled first".
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");
  await cdp.send("CSS.startRuleUsageTracking");

  await page.goto(TARGET, { waitUntil: "load", timeout: 60000 });
  const vitals = await page.evaluate(VITALS);
  const fps = await page.evaluate(FPS);

  // Unused CSS, the thing the report says to check rather than guess at.
  const usage = await cdp.send("CSS.stopRuleUsageTracking");
  let cssUsed = 0, cssTotal = 0;
  for (const r of usage.ruleUsage || []) {
    const span = r.endOffset - r.startOffset;
    cssTotal += span;
    if (r.used) cssUsed += span;
  }

  await context.close();

  const totalBytes = requests.reduce((n, r) => n + r.bytes, 0);
  const thirdPartyBytes = requests.filter((r) => r.thirdParty).reduce((n, r) => n + r.bytes, 0);

  return {
    profile: profile.name,
    ttfbMs: +vitals.ttfb.toFixed(0),
    fcpMs: +vitals.fcp.toFixed(0),
    lcpMs: +vitals.lcp.toFixed(0),
    cls: +vitals.cls.toFixed(4),
    domContentLoadedMs: +vitals.domContentLoaded.toFixed(0),
    longTasks: vitals.longTasks,
    longTaskMs: +vitals.longTaskMs.toFixed(0),
    fps,
    requests: requests.length,
    totalKB: +(totalBytes / 1024).toFixed(1),
    thirdPartyKB: +(thirdPartyBytes / 1024).toFixed(1),
    thirdPartyHosts: [...new Set(requests.filter((r) => r.thirdParty).map((r) => new URL(r.url).host))],
    cssUsedPct: cssTotal ? +((cssUsed / cssTotal) * 100).toFixed(1) : null,
    consoleErrors,
  };
}

const browser = await chromium.launch();
const results = [];
for (const profile of PROFILES) {
  results.push(await measure(browser, profile));
}
await browser.close();

console.log(`\nBASELINE  ${URL}`);
console.log(`taken     ${new Date().toISOString()}\n`);
for (const r of results) {
  console.log(`  ${r.profile.toUpperCase()}  (CPU x${PROFILES.find((p) => p.name === r.profile).cpuThrottle})`);
  console.log(`    TTFB ${r.ttfbMs}ms   FCP ${r.fcpMs}ms   LCP ${r.lcpMs}ms   CLS ${r.cls}`);
  console.log(`    long tasks ${r.longTasks} (${r.longTaskMs}ms total)   animation ${r.fps} fps`);
  console.log(`    ${r.requests} requests, ${r.totalKB} KB total, ${r.thirdPartyKB} KB third-party ${JSON.stringify(r.thirdPartyHosts)}`);
  console.log(`    CSS rules used: ${r.cssUsedPct}%`);
  if (r.consoleErrors.length) console.log(`    console errors: ${JSON.stringify(r.consoleErrors)}`);
  console.log();
}

// The thresholds that decide whether anything is worth doing at all.
const phone = results.find((r) => r.profile === "phone");
console.log("  VERDICT");
console.log(`    LCP  ${phone.lcpMs}ms  ${phone.lcpMs < 2500 ? "good (<2500)" : "NEEDS WORK"}`);
console.log(`    CLS  ${phone.cls}  ${phone.cls < 0.1 ? "good (<0.1)" : "NEEDS WORK"}`);
console.log(`    FPS  ${phone.fps}  ${phone.fps >= 50 ? "smooth" : "JANKY on a throttled phone"}`);

if (JSON_OUT) {
  writeFileSync(JSON_OUT, JSON.stringify({ url: TARGET, takenAt: new Date().toISOString(), results }, null, 2));
  console.log(`\n  saved ${JSON_OUT}`);
}
