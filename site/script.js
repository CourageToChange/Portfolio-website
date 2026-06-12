/* Noorun Nobi — portfolio interactions
   Kept deliberately small: reveals, nav state, mobile menu, hero terminal. */

(function () {
  "use strict";

  // Mark JS as available — CSS only hides .reveal elements under html.js,
  // so the site is fully readable with JavaScript disabled.
  document.documentElement.classList.add("js");

  var reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Footer year ---------- */
  var year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());

  /* ---------- Scroll progress bar ---------- */
  var progress = document.getElementById("progress");
  function updateProgress() {
    var max = document.documentElement.scrollHeight - window.innerHeight;
    progress.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
  }
  window.addEventListener("scroll", updateProgress, { passive: true });
  window.addEventListener("resize", updateProgress, { passive: true });
  updateProgress();

  /* ---------- Card glow + 3D tilt ---------- */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var interactive = document.querySelectorAll(".card, .mini, .project");
  interactive.forEach(function (el) {
    el.classList.add("glow");
    el.addEventListener("pointermove", function (e) {
      var r = el.getBoundingClientRect();
      var x = e.clientX - r.left;
      var y = e.clientY - r.top;
      el.style.setProperty("--mx", x + "px");
      el.style.setProperty("--my", y + "px");
      // Tilt only small cards, with a fine pointer, and no reduced-motion
      if (finePointer && !reducedMotion && !el.classList.contains("project")) {
        var ry = ((x / r.width) - 0.5) * 5;   // degrees
        var rx = (0.5 - (y / r.height)) * 5;
        el.style.setProperty("--rx", rx.toFixed(2) + "deg");
        el.style.setProperty("--ry", ry.toFixed(2) + "deg");
      }
    });
    el.addEventListener("pointerleave", function () {
      el.style.setProperty("--rx", "0deg");
      el.style.setProperty("--ry", "0deg");
    });
  });

  /* ---------- Hero particle network ---------- */
  var canvas = document.getElementById("netCanvas");
  if (canvas && !reducedMotion) {
    var ctx = canvas.getContext("2d");
    var nodes = [];
    var mouse = { x: -9999, y: -9999 };
    var running = true;
    var W = 0, H = 0, DPR = 1;

    function sizeCanvas() {
      DPR = Math.min(window.devicePixelRatio || 1, 2);
      W = canvas.clientWidth;
      H = canvas.clientHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var target = Math.min(80, Math.floor((W * H) / 22000));
      while (nodes.length < target) {
        nodes.push({
          x: Math.random() * W, y: Math.random() * H,
          vx: (Math.random() - 0.5) * 0.35,
          vy: (Math.random() - 0.5) * 0.35,
          r: 1 + Math.random() * 1.4
        });
      }
      nodes.length = target;
    }

    var LINK = 130, MOUSE_LINK = 170;
    function frame() {
      if (!running) return;
      ctx.clearRect(0, 0, W, H);
      var i, j, a, b, dx, dy, d2;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        a.x += a.vx; a.y += a.vy;
        if (a.x < 0 || a.x > W) a.vx *= -1;
        if (a.y < 0 || a.y > H) a.vy *= -1;
      }
      ctx.lineWidth = 1;
      for (i = 0; i < nodes.length; i++) {
        a = nodes[i];
        for (j = i + 1; j < nodes.length; j++) {
          b = nodes[j];
          dx = a.x - b.x; dy = a.y - b.y; d2 = dx * dx + dy * dy;
          if (d2 < LINK * LINK) {
            ctx.strokeStyle = "rgba(79,227,193," + (0.10 * (1 - Math.sqrt(d2) / LINK)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        dx = a.x - mouse.x; dy = a.y - mouse.y; d2 = dx * dx + dy * dy;
        if (d2 < MOUSE_LINK * MOUSE_LINK) {
          ctx.strokeStyle = "rgba(79,227,193," + (0.22 * (1 - Math.sqrt(d2) / MOUSE_LINK)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(143,163,184,0.5)";
        ctx.beginPath(); ctx.arc(a.x, a.y, a.r, 0, Math.PI * 2); ctx.fill();
      }
      requestAnimationFrame(frame);
    }

    var hero = canvas.parentElement;
    hero.addEventListener("pointermove", function (e) {
      var r = canvas.getBoundingClientRect();
      mouse.x = e.clientX - r.left;
      mouse.y = e.clientY - r.top;
    });
    hero.addEventListener("pointerleave", function () { mouse.x = -9999; mouse.y = -9999; });
    document.addEventListener("visibilitychange", function () {
      var wasRunning = running;
      running = !document.hidden;
      if (running && !wasRunning) requestAnimationFrame(frame);
    });
    window.addEventListener("resize", sizeCanvas, { passive: true });
    sizeCanvas();
    requestAnimationFrame(frame);
  }

  /* ---------- Nav: scrolled state ---------- */
  var nav = document.getElementById("nav");
  function onScroll() {
    nav.classList.toggle("is-scrolled", window.scrollY > 10);
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- Nav: mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var links = document.getElementById("navLinks");
  toggle.addEventListener("click", function () {
    var open = links.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  links.addEventListener("click", function (e) {
    if (e.target.tagName === "A") {
      links.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });

  /* ---------- Scroll reveals ---------- */
  var revealEls = document.querySelectorAll(".reveal, .reveal-up");
  if (reducedMotion || !("IntersectionObserver" in window)) {
    revealEls.forEach(function (el) { el.classList.add("is-visible"); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add("is-visible");
          io.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -40px 0px" });
    revealEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- Nav: active section highlight ---------- */
  var sections = document.querySelectorAll("main section[id]");
  var navAnchors = document.querySelectorAll(".nav__links a[href^='#']");
  if ("IntersectionObserver" in window) {
    var sectionIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        var id = entry.target.id;
        navAnchors.forEach(function (a) {
          a.classList.toggle("is-active", a.getAttribute("href") === "#" + id);
        });
      });
    }, { rootMargin: "-40% 0px -55% 0px" });
    sections.forEach(function (s) { sectionIo.observe(s); });
  }

  /* ---------- Hero title decrypt effect ---------- */
  var heroTitle = document.querySelector(".hero__title");
  if (heroTitle && !reducedMotion) {
    var finalText = heroTitle.textContent;
    var glyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@?!<>/01";
    var revealed = 0;
    setTimeout(function () {
      var scramble = setInterval(function () {
        heroTitle.textContent = finalText.split("").map(function (c, i) {
          if (c === " " || i < revealed) return c;
          return glyphs[Math.floor(Math.random() * glyphs.length)];
        }).join("");
        revealed += 0.6;
        if (revealed >= finalText.length) {
          heroTitle.textContent = finalText;
          clearInterval(scramble);
        }
      }, 38);
    }, 250);
  }

  /* ---------- Hero terminal typing ---------- */
  var term = document.getElementById("terminalBody");
  if (!term) return;

  // [textOrHTML, isCommand, pauseAfterMs]
  var script = [
    ["whoami", true, 350],
    ["noorun-nobi — security professional, London", false, 250],
    ["cat focus.txt", true, 350],
    ["cyber/IT apprenticeship · SOC Tier 1 · service desk", false, 250],
    ["ls ~/skills", true, 350],
    ["python  java  c  bash  linux  networking", false, 250],
    ["systemctl status homelab", true, 350],
    ["● active (running) — 6 hardened services\n  fail2ban ✓  firewall ✓  2FA ✓  TLS ✓  backups ✓", false, 250],
    ["", true, 0] // final empty prompt with cursor
  ];

  function renderInstant() {
    var html = "";
    script.forEach(function (line) {
      if (line[1]) html += '<span class="t-prompt">$ </span>' + line[0] + "\n";
      else html += '<span class="t-out">' + line[0] + "</span>\n";
    });
    term.innerHTML = html.replace(/\n$/, "") + '<span class="terminal__cursor"></span>';
  }

  if (reducedMotion) {
    renderInstant();
    return;
  }

  var lineIdx = 0;
  var charIdx = 0;
  var doneHTML = "";

  function cursor() { return '<span class="terminal__cursor"></span>'; }

  function typeStep() {
    if (lineIdx >= script.length) return;
    var entry = script[lineIdx];
    var text = entry[0];
    var isCmd = entry[1];

    if (isCmd) {
      // Type commands character by character
      if (charIdx === 0 && text === "") {
        term.innerHTML = doneHTML + '<span class="t-prompt">$ </span>' + cursor();
        return; // final resting prompt
      }
      charIdx++;
      var partial = text.slice(0, charIdx);
      term.innerHTML = doneHTML + '<span class="t-prompt">$ </span>' + partial + cursor();
      if (charIdx >= text.length) {
        doneHTML += '<span class="t-prompt">$ </span>' + text + "\n";
        charIdx = 0;
        lineIdx++;
        setTimeout(typeStep, entry[2]);
      } else {
        setTimeout(typeStep, 34 + Math.random() * 46);
      }
    } else {
      // Print output lines whole
      doneHTML += '<span class="t-out">' + text + "</span>\n";
      term.innerHTML = doneHTML + cursor();
      lineIdx++;
      setTimeout(typeStep, entry[2]);
    }
  }

  // Start typing when the terminal scrolls into view (it's in the hero, so ~immediately)
  setTimeout(typeStep, 650);
})();
