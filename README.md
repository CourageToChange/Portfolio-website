# Noorun Nobi — Portfolio Website

My personal portfolio site: a single-page, hand-built static website with **no frameworks,
no build step and no dependencies** — just HTML, CSS and a small amount of vanilla
JavaScript. It is self-hosted on my own hardened home server (Proxmox → Nginx Proxy
Manager → Cloudflare).

**Live at:** https://noor.noorfamily.uk

## Why no framework?

The site is a security-focused CV, so the build philosophy matches the content:

- **Small attack surface** — no dependencies means nothing to patch and nothing to audit.
- **Fast** — ~45 KB of code before fonts; everything renders in one round trip.
- **Robust** — works with JavaScript disabled, honours `prefers-reduced-motion`,
  semantic HTML with proper landmarks and a skip link.

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
