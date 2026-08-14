/* Measure the credentials grid across the band PF18 reported as cramped.
 * Checks columns, per-card content width, characters per line, whether the
 * status chip wraps, and that the page never scrolls sideways. */
const path = require("path");
const CODEX = "C:/Users/NNobi/Desktop/Proxmox/Codex";
const { chromium } = require(path.join(CODEX, "node_modules", "playwright"));

const URL = process.argv[2] || "http://127.0.0.1:8731/";
const WIDTHS = [360, 620, 621, 980, 981, 1024, 1080, 1099, 1100, 1440];

(async () => {
  const browser = await chromium.launch();
  const page = await browser.newPage();
  for (const width of WIDTHS) {
    await page.setViewportSize({ width, height: 900 });
    await page.goto(URL, { waitUntil: "domcontentloaded" });
    const r = await page.evaluate(() => {
      const grid = document.querySelector(".cards-3--creds");
      if (!grid) return null;
      const cols = getComputedStyle(grid).gridTemplateColumns.split(" ").length;
      const card = grid.querySelector(".card");
      const cs = getComputedStyle(card);
      const inner = card.getBoundingClientRect().width
        - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      // characters per line on the longest paragraph in the first card
      let cpl = 0;
      for (const p of card.querySelectorAll("p")) {
        const t = (p.textContent || "").trim();
        if (!t) continue;
        const lines = Math.max(1, Math.round(
          p.getBoundingClientRect().height / parseFloat(getComputedStyle(p).lineHeight)));
        cpl = Math.max(cpl, Math.round(t.length / lines));
      }
      const chip = grid.querySelector(".cred__status");
      const chipLines = chip
        ? Math.round(chip.getBoundingClientRect().height
            / parseFloat(getComputedStyle(chip).lineHeight))
        : 0;
      return {
        cols,
        inner: Math.round(inner),
        cpl,
        chipLines,
        overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth
      };
    });
    if (!r) { console.log(`${width}px  no .cards-3--creds found`); continue; }
    const flag = (r.cpl < 40 && r.cols > 1) || r.chipLines > 1 || r.overflow ? "  <-- FLAG" : "";
    console.log(
      `${String(width).padStart(4)}px  cols=${r.cols}  card=${String(r.inner).padStart(3)}px  ` +
      `~${String(r.cpl).padStart(2)} chars/line  chipLines=${r.chipLines}  ` +
      `sideScroll=${r.overflow}${flag}`);
  }
  await browser.close();
})();
