# Scripts

This site has **no test suite**, which makes it the one project here with nothing to catch a
regression. These are the closest thing to one: measure the layout rather than eyeballing it.

## `measure-grid.js`

Measures a card grid across the breakpoints, reporting for each width: column count, per-card
content width, characters per line, whether the status chip wraps, and whether the page scrolls
sideways.

```bash
python -m http.server 8731 --directory site
node scripts/measure-grid.js http://127.0.0.1:8731/
```

Playwright comes from `../Codex/node_modules`, so the Snake repo has to be checked out alongside
this one. That is deliberate; this site keeps zero dependencies of its own, which is a claim its
own README makes to recruiters.

**Why it exists.** PF18 reported the credentials grid as cramped in the 981–1080px band and
assumed the fix was to move 4-up to a wider breakpoint. Measuring showed there was no such
breakpoint: at 4 columns a credentials card holds **187px and ~21 characters per line even at
1440px**, against a comfortable 45–75. The measurement changed the fix from "raise the
breakpoint" to "never go 4-up for prose". Skills gets away with 4-up because its cards hold
short pills.

Comfortable measure is **45–75 characters per line**. Below ~40 with more than one column is
worth looking at.

⚠️ Known, pre-existing, not worth chasing: 621–750px sits at 2-up and ~31 characters. That band
was already 2-up before PF18, and widening it would touch `.cards-3` generally.

## `perf-baseline.mjs`

Core Web Vitals, long tasks, the animation frame rate actually painted, request and byte counts,
the third-party split, and how much of the stylesheet is really used. Runs a phone profile and a
desktop profile.

```bash
node scripts/perf-baseline.mjs                                  # live site
node scripts/perf-baseline.mjs --json docs/perf-2026-08-16.json # keep it for comparison
node scripts/perf-baseline.mjs --url http://127.0.0.1:8731/     # somewhere else
```

It measures the **live url** by default, not a local copy. A local file and the deployed site have
disagreed before on a byte-identical bundle, so what is on this machine proves nothing about what a
visitor loads.

It loads the page once and discards that result before measuring. Without the warm-up, whichever
profile runs first absorbs any cold start and reports it as its own TTFB. Pointed at another
project on 2026-08-16 it produced phone TTFB 2852 ms against desktop 71 ms and an LCP of 3432 ms
that read as a real problem. CPU throttling cannot change server response time, which is what gave
it away. Warm, the same page measured 428 ms.

The phone profile sets `isMobile` and `hasTouch`. Without those the page gets the desktop layout at
a phone width, which measures a page nobody ever sees.

Current numbers and what came of them: `docs/PERF.md`.

## `font-audit.mjs`

Asks the browser what font family and weight it actually resolved for every element that renders
text, and lists that against what the page requested.

```bash
node scripts/font-audit.mjs
```

**Why it exists.** Grepping the stylesheet for `font-weight` cannot tell you whether a weight is
used. Family and weight are set independently and both inherit, so a declared weight can land on
any family, or on none at all. Only the browser knows what it resolved.

It found two things a grep could not. `Space Grotesk:wght@500` is requested and rendered on nothing.
And the CSS asks for `Inter 700`, which is never loaded, so the browser falls back to the heaviest
face it has. That sounded like faux bold until it was measured: 600, 700 and 800 all render the same
string at exactly 423.39px, so the browser is clamping rather than synthesising, and nothing looks
wrong.
