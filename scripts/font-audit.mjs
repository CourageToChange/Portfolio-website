/**
 * Which font family/weight combinations does the live page actually render?
 *
 * The page asks Google for eight weights across three families. Grepping the stylesheet for
 * font-weight cannot answer whether a given weight is used, because family and weight are set
 * independently and inherited: a weight can be declared once and land on any family, or on none.
 * The only honest answer comes from asking the browser what it resolved for every element that
 * actually renders text.
 *
 * A weight that renders on nothing can be dropped from the request with no visual change at all.
 */
import { existsSync } from "node:fs";
import { pathToFileURL } from "node:url";
import path from "node:path";

const CANDIDATES = [
  path.resolve(process.cwd(), "../Codex/node_modules/playwright/index.mjs"),
  path.resolve(process.cwd(), "../Puzzle Game/node_modules/playwright/index.mjs"),
];
const found = CANDIDATES.find(existsSync);
if (!found) { console.error("playwright not found"); process.exit(1); }
const { chromium } = await import(pathToFileURL(found).href);

const TARGET = process.argv[2] || "https://noor.noorfamily.uk/";

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

// Record every font file the page actually downloads, so the request list can be compared
// against what is rendered.
const fontFiles = [];
page.on("response", async (r) => {
  if (r.request().resourceType() !== "font") return;
  let size = 0;
  try { size = (await r.body()).length; } catch {}
  fontFiles.push({ url: r.url(), kb: +(size / 1024).toFixed(1) });
});

await page.goto(TARGET, { waitUntil: "networkidle", timeout: 60000 });

const used = await page.evaluate(() => {
  const seen = new Map();
  for (const el of document.querySelectorAll("*")) {
    // Only elements that render their own visible text.
    const ownText = [...el.childNodes]
      .filter((n) => n.nodeType === Node.TEXT_NODE)
      .map((n) => n.textContent.trim())
      .join("");
    if (!ownText) continue;
    const style = getComputedStyle(el);
    if (style.display === "none" || style.visibility === "hidden") continue;

    const family = style.fontFamily.split(",")[0].replace(/["']/g, "").trim();
    const weight = style.fontWeight;
    const key = `${family}|${weight}`;
    const entry = seen.get(key) || { family, weight, count: 0, sample: ownText.slice(0, 40) };
    entry.count++;
    seen.set(key, entry);
  }
  return [...seen.values()].sort((a, b) => b.count - a.count);
});

await browser.close();

console.log(`\nFONT AUDIT  ${TARGET}\n`);
console.log("  RENDERED (family | weight | elements)");
for (const u of used) {
  console.log(`    ${u.family.padEnd(18)} ${String(u.weight).padEnd(5)} ${String(u.count).padStart(4)}   e.g. ${JSON.stringify(u.sample)}`);
}

console.log(`\n  FONT FILES DOWNLOADED (${fontFiles.length}, ${fontFiles.reduce((n, f) => n + f.kb, 0).toFixed(1)} KB)`);
for (const f of fontFiles) {
  console.log(`    ${String(f.kb).padStart(6)} KB  ${f.url.replace("https://fonts.gstatic.com/s/", "")}`);
}

// The requested set, so anything unrendered stands out.
const REQUESTED = {
  Inter: ["400", "500", "600"],
  "JetBrains Mono": ["400", "500"],
  "Space Grotesk": ["500", "600", "700"],
};
console.log("\n  REQUESTED vs RENDERED");
for (const [family, weights] of Object.entries(REQUESTED)) {
  for (const w of weights) {
    const hit = used.find((u) => u.family === family && String(u.weight) === w);
    console.log(`    ${family.padEnd(16)} ${w}   ${hit ? `used on ${hit.count} element(s)` : "NOT RENDERED ANYWHERE"}`);
  }
}
