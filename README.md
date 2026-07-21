# Noorun Nobi — Portfolio Website

My portfolio site. One page, hand-written HTML and CSS with a bit of vanilla JavaScript,
no framework and no build step. It runs on my own server at home, behind Nginx Proxy
Manager and Cloudflare.

**Live at:** https://noor.noorfamily.uk

## Why no framework?

Mostly because it's a CV for security work and it would be a bit embarrassing to ship it
with forty dependencies I'd never read. The only third party the page talks to is Google
Fonts; everything else is mine, so there's very little to patch and very little to audit. It's about 80 KB before fonts, so it renders in one round trip. It still works with
JavaScript turned off, it honours `prefers-reduced-motion`, and the markup is semantic
with real landmarks and a skip link.

I also just wanted to write it myself.

## Structure

```
site/            the deployable website (copy this folder to the web root)
  index.html     single page — all content
  styles.css     theme, layout, animations
  script.js      scroll reveals, terminal animation, particle network, card tilt
  assets/        favicon, downloadable CV
cv/              print-source for the CV PDF
```

## Local preview

```
python -m http.server 8731 --directory site
```

## Regenerating the CV PDF

The CV is maintained as `cv/cv.html` (print-optimised, ATS-friendly) and exported with
headless Edge/Chrome:

```
msedge --headless --disable-gpu --no-pdf-header-footer ^
  --print-to-pdf="site/assets/cv/Noorun-Nobi-CV.pdf" "cv/cv.html"
```
