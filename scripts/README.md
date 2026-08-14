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
