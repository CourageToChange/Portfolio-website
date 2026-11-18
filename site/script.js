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
    /* handled by the transform pass below */
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

  /* ---------- Section titles: decrypt on scroll ---------- */
  if (!reducedMotion && "IntersectionObserver" in window) {
    var titleGlyphs = "ABCDEFGHIJKLMNOPQRSTUVWXYZ#$%&@?!<>/01";
    var titleIo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        titleIo.unobserve(entry.target);
        var node = entry.target.lastChild; // text node after the section number
        if (!node || node.nodeType !== 3) return;
        var finalVal = node.nodeValue;
        var rev = 0;
        var tick = setInterval(function () {
          node.nodeValue = finalVal.split("").map(function (c, i) {
            if (c === " " || i < rev) return c;
            return titleGlyphs[Math.floor(Math.random() * titleGlyphs.length)];
          }).join("");
          rev += 0.7;
          if (rev >= finalVal.length) {
            node.nodeValue = finalVal;
            clearInterval(tick);
          }
        }, 40);
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".section__title").forEach(function (t) { titleIo.observe(t); });
  }

  /* ---------- Magnetic buttons ---------- */
  if (window.matchMedia("(hover: hover) and (pointer: fine)").matches && !reducedMotion) {
    document.querySelectorAll(".hero__actions .btn, .contact__actions .btn").forEach(function (btn) {
      btn.addEventListener("pointermove", function (e) {
        var r = btn.getBoundingClientRect();
        var x = e.clientX - r.left - r.width / 2;
        var y = e.clientY - r.top - r.height / 2;
        btn.style.transform = "translate(" + (x * 0.16).toFixed(1) + "px," + (y * 0.3).toFixed(1) + "px)";
      });
      btn.addEventListener("pointerleave", function () { btn.style.transform = ""; });
    });
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
    ["● active (running) — 7 hardened services\n  fail2ban ✓  firewall ✓  2FA ✓  TLS ✓  backups ✓", false, 250],
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


/* ---------- Desktop improvements ---------- */
(function () {
  "use strict";
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var fine = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
  var root = document.documentElement;

  // One rAF-throttled scroll pass: progress bar (transform, no layout) and timeline fill.
  var progress = document.getElementById("progress");
  var timeline = document.querySelector(".timeline");
  var items = timeline ? timeline.querySelectorAll(".timeline__item") : [];
  var queued = false;
  function pass() {
    queued = false;
    var max = root.scrollHeight - window.innerHeight;
    if (progress) progress.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : 0);
    if (timeline) {
      var r = timeline.getBoundingClientRect();
      var mark = window.innerHeight * 0.6;
      var f = Math.max(0, Math.min(1, (mark - r.top) / r.height));
      timeline.style.setProperty("--tl", f.toFixed(4));
      items.forEach(function (it) { it.classList.toggle("is-passed", it.getBoundingClientRect().top + 14 < mark); });
    }
  }
  function ask() { if (!queued) { queued = true; requestAnimationFrame(pass); } }
  window.addEventListener("scroll", ask, { passive: true });
  window.addEventListener("resize", ask, { passive: true });
  pass();

  // Section rail, built from the numbers already on the page.
  var secs = document.querySelectorAll("main section[id]");
  if (secs.length && "IntersectionObserver" in window) {
    var rail = document.createElement("nav");
    rail.className = "rail";
    rail.setAttribute("aria-hidden", "true");
    var links = {};
    secs.forEach(function (s) {
      var num = s.querySelector(".section__num");
      if (!num) return;
      var a = document.createElement("a");
      a.href = "#" + s.id; a.tabIndex = -1; a.textContent = num.textContent;
      rail.appendChild(a); links[s.id] = a;
    });
    document.body.appendChild(rail);
    secs.forEach(function (s) {
      new IntersectionObserver(function (es) {
        es.forEach(function (e) {
          if (e.isIntersecting) Object.keys(links).forEach(function (id) { links[id].classList.toggle("is-active", id === s.id); });
        });
      }, { rootMargin: "-40% 0px -55% 0px" }).observe(s);
    });
    var hero = document.querySelector(".hero");
    if (hero) new IntersectionObserver(function (es) {
      rail.classList.toggle("is-on", !es[0].isIntersecting);
    }, { threshold: 0.35 }).observe(hero);
  }

  // Diagram traffic: runs only while the diagram is on screen.
  var fig = document.querySelector(".diagram");
  var svg = fig && fig.querySelector(".dia--wide");
  if (svg && !reduced && "IntersectionObserver" in window) {
    var NS = "http://www.w3.org/2000/svg";
    var g = document.createElementNS(NS, "g");
    [["pkCf", "bad", 0], ["pkFw", "bad", 0.9], ["pkCf", "bad", 2.1], ["pkOk", "ok", 1.5], ["pkFw", "bad", 3.4], ["pkCf", "bad", 4.4]].forEach(function (d) {
      var c = document.createElementNS(NS, "circle");
      c.setAttribute("r", d[1] === "ok" ? 4 : 3);
      c.setAttribute("class", "pk pk--" + d[1]);
      c.style.setProperty("--an", d[0]);
      c.style.setProperty("--dl", d[2] + "s");
      g.appendChild(c);
    });
    svg.insertBefore(g, svg.querySelector(".dia-node"));
    new IntersectionObserver(function (es) {
      fig.classList.toggle("is-live", es[0].isIntersecting);
    }, { threshold: 0.25 }).observe(fig);
  }

  // Terminal follows the pointer a little.
  var heroEl = document.querySelector(".hero");
  var term = document.querySelector(".terminal");
  if (heroEl && term && fine && !reduced) {
    heroEl.addEventListener("pointermove", function (e) {
      var r = heroEl.getBoundingClientRect();
      var x = (e.clientX - r.left) / r.width - 0.5;
      var y = (e.clientY - r.top) / r.height - 0.5;
      term.style.setProperty("--try", (-4 + x * 7).toFixed(2) + "deg");
      term.style.setProperty("--trx", (-y * 6).toFixed(2) + "deg");
    }, { passive: true });
    heroEl.addEventListener("pointerleave", function () {
      term.style.removeProperty("--try"); term.style.removeProperty("--trx");
    });
  }
})();

/* ---------- Desktop side margins: the hero's network carries on down both sides ---------- */
(function () {
  "use strict";
  var mq = window.matchMedia("(prefers-reduced-motion: no-preference)");
  var roomy = window.matchMedia("(min-width: 1360px)"); // roomy side margins; below this, two thin strips in the page gutters
  var builtW = 0, builtH = 0, narrow = false;
  var hero = document.querySelector(".hero");
  if (!hero || !("IntersectionObserver" in window)) return;

  var wrap = document.createElement("div");
  wrap.className = "sides";
  wrap.setAttribute("aria-hidden", "true");
  wrap.innerHTML = '<span class="sides__glow sides__glow--l"></span><span class="sides__glow sides__glow--r"></span><canvas></canvas><canvas></canvas>';
  document.body.appendChild(wrap);
  var canvases = wrap.querySelectorAll("canvas");
  var sides = [];
  var DPR = 1, GW = 0, H = 0, WORLD = 0;
  var on = false, raf = 0, last = 0;
  var scrollNow = window.scrollY, scrollEase = scrollNow;
  var mouse = { x: -9999, y: -9999 };
  var LINK = 150, MOUSE = 210;

  function build() {
    DPR = Math.min(window.devicePixelRatio || 1, 2);
    narrow = !roomy.matches;
    H = narrow ? Math.max(window.innerHeight, canvases[0].clientHeight) : window.innerHeight;
    builtW = window.innerWidth; builtH = window.innerHeight;
    // Margin beside the 1080px column, less a little air so nothing sits against the text.
    if (narrow) {
      // The gap between the screen edge and the text, plus a few px that fade out under the mask.
      var col = document.querySelector("main .container") || document.querySelector(".container");
      var gut = col ? col.getBoundingClientRect().left + (parseFloat(getComputedStyle(col).paddingLeft) || 0) : 22;
      GW = Math.round(Math.max(22, gut)) + 4;
    } else GW = Math.max(0, Math.floor((window.innerWidth - 1080) / 2) - 24);
    WORLD = H * 1.6;
    wrap.style.setProperty("--gw", GW + "px");
    sides = [];
    canvases.forEach(function (c, idx) {
      c.width = Math.max(1, GW * DPR); c.height = H * DPR;
      var ctx = c.getContext("2d");
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      var count = Math.max(narrow ? 7 : 8, Math.min(64, Math.round((GW * WORLD) / 12000)));
      var nodes = [];
      for (var i = 0; i < count; i++) {
        var z = 0.35 + Math.random() * 0.65; // depth: far ones are small, dim and move less
        nodes.push({ x: Math.random() * GW, y: Math.random() * WORLD, vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16, z: z, sy: 0 });
      }
      sides.push({ ctx: ctx, nodes: nodes, left: idx === 0, pulse: null, wait: 600 + Math.random() * 1500 });
    });
  }

  function frame(t) {
    raf = 0;
    if (!on) return;
    var dt = Math.min(50, t - (last || t)); last = t;
    var k = dt / 16.67;
    scrollEase += (scrollNow - scrollEase) * Math.min(1, 0.07 * k);
    sides.forEach(function (s) {
      var ctx = s.ctx, n = s.nodes, i, j, a, b, dx, dy, d;
      var ox = s.left ? 0 : window.innerWidth - GW;
      ctx.clearRect(0, 0, GW, H);
      for (i = 0; i < n.length; i++) {
        a = n[i];
        a.x += a.vx * k; a.y += a.vy * k;
        if (a.x < 0 || a.x > GW) a.vx *= -1;
        // Parallax: nearer nodes travel further as the page scrolls.
        var y = (a.y - scrollEase * (0.05 + 0.04 * a.z)) % WORLD;
        if (y < 0) y += WORLD;
        a.sy = y - (WORLD - H) / 2;
      }
      ctx.lineWidth = 1;
      var links = [];
      for (i = 0; i < n.length; i++) {
        a = n[i];
        if (a.sy < -LINK || a.sy > H + LINK) continue;
        for (j = i + 1; j < n.length; j++) {
          b = n[j];
          dx = a.x - b.x; dy = a.sy - b.sy; d = dx * dx + dy * dy;
          if (d < LINK * LINK) {
            ctx.strokeStyle = "rgba(79,227,193," + (0.17 * (1 - Math.sqrt(d) / LINK) * Math.min(a.z, b.z)).toFixed(3) + ")";
            ctx.beginPath(); ctx.moveTo(a.x, a.sy); ctx.lineTo(b.x, b.sy); ctx.stroke();
            links.push(i, j);
          }
        }
        dx = a.x + ox - mouse.x; dy = a.sy - mouse.y; d = dx * dx + dy * dy;
        if (!narrow && d < MOUSE * MOUSE) {
          ctx.strokeStyle = "rgba(79,227,193," + (0.26 * (1 - Math.sqrt(d) / MOUSE)).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(a.x, a.sy); ctx.lineTo(mouse.x - ox, mouse.y); ctx.stroke();
        }
        ctx.fillStyle = "rgba(160,182,205," + (0.28 + 0.4 * a.z).toFixed(2) + ")";
        ctx.beginPath(); ctx.arc(a.x, a.sy, 0.8 + 1.5 * a.z, 0, 6.2832); ctx.fill();
      }
      // Now and then one mint signal runs along a link.
      if (!s.pulse) {
        s.wait -= dt;
        if (s.wait <= 0 && links.length) {
          var pick = Math.floor(Math.random() * (links.length / 2)) * 2;
          s.pulse = { a: n[links[pick]], b: n[links[pick + 1]], t: 0 };
          s.wait = 2800 + Math.random() * 3600;
        }
      } else {
        var p = s.pulse; p.t += dt / 900;
        if (p.t >= 1) s.pulse = null;
        else {
          var e = p.t * p.t * (3 - 2 * p.t);
          var px = p.a.x + (p.b.x - p.a.x) * e, py = p.a.sy + (p.b.sy - p.a.sy) * e;
          var al = Math.sin(Math.PI * p.t);
          ctx.strokeStyle = "rgba(79,227,193," + (0.5 * al).toFixed(3) + ")";
          ctx.beginPath(); ctx.moveTo(p.a.x, p.a.sy); ctx.lineTo(px, py); ctx.stroke();
          ctx.fillStyle = "rgba(79,227,193," + al.toFixed(3) + ")";
          ctx.shadowColor = "rgba(79,227,193,.9)"; ctx.shadowBlur = 10;
          ctx.beginPath(); ctx.arc(px, py, 2.4, 0, 6.2832); ctx.fill();
          ctx.shadowBlur = 0;
        }
      }
    });
    raf = requestAnimationFrame(frame);
  }

  var pastHero = false;
  function sync() {
    var want = mq.matches && pastHero && !document.hidden && (narrow || GW >= 110) && !document.documentElement.classList.contains("lab-open");
    wrap.classList.toggle("is-on", want);
    if (want && !on) { on = true; last = 0; scrollEase = scrollNow = window.scrollY; if (!raf) raf = requestAnimationFrame(frame); }
    else if (!want && on) { on = false; }
  }
  new IntersectionObserver(function (es) { pastHero = !es[0].isIntersecting; sync(); }, { threshold: 0.3 }).observe(hero);
  window.addEventListener("scroll", function () { scrollNow = window.scrollY; }, { passive: true });
  window.addEventListener("pointermove", function (e) { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
  document.addEventListener("pointerleave", function () { mouse.x = mouse.y = -9999; });
  document.addEventListener("visibilitychange", sync);
  document.addEventListener("lab:toggle", sync);
  var rt = 0;
  window.addEventListener("resize", function () {
    clearTimeout(rt);
    rt = setTimeout(function () {
      if (window.innerWidth === builtW && Math.abs(window.innerHeight - builtH) < 160) return;
      build(); sync();
    }, 150);
  }, { passive: true });
  if (roomy.addEventListener) roomy.addEventListener("change", function () { build(); sync(); });
  if (mq.addEventListener) mq.addEventListener("change", sync);
  build(); sync();
})();

/* ---------- Desktop content motion: cascade ---------- */
(function () {
  "use strict";
  document.querySelectorAll(".cards-3, .minis").forEach(function (grid) {
    grid.classList.add("cascade");
    var kids = Array.prototype.filter.call(grid.children, function (k) { return k.classList.contains("reveal"); });
    // Position within its own row, so each row starts again from the left.
    var rowTop = null, col = 0;
    kids.forEach(function (k) {
      var top = k.offsetTop;
      if (rowTop === null || Math.abs(top - rowTop) > 4) { rowTop = top; col = 0; }
      k.style.setProperty("--i", col++);
      k.addEventListener("transitionend", function done(e) {
        if (e.target !== k || e.propertyName !== "opacity") return;
        k.classList.add("is-settled");
        k.removeEventListener("transitionend", done);
      });
      k.querySelectorAll(".pill").forEach(function (p, n) { p.style.setProperty("--pi", n); });
    });
  });
})();

/* ---------- Flagship project: click the card for a walkthrough ----------
   Every word shown is the page's own case study, cloned at open time. Nothing new is written here. */
(function () {
  "use strict";
  var card = document.querySelector(".project--flagship");
  var details = card && card.querySelector(".project__details");
  var wide = card && card.querySelector(".dia--wide");
  if (!card || !details || !wide || typeof HTMLDialogElement === "undefined") return;
  var mq = window.matchMedia("(min-width: 1280px)");   // side-by-side panel; below it, a full-screen sheet
  var touch = window.matchMedia("(hover: none)").matches;
  card.classList.add("has-lab");
  if ("IntersectionObserver" in window) {
    var warm = new IntersectionObserver(function (es) {
      if (!es[0].isIntersecting) return;
      warm.disconnect();
      // Build the panel now, while idle, so a tap on a slow phone only has to open it.
      (window.requestIdleCallback || setTimeout)(function () { if (!dlg) build(); import("./vendor/three/three.module.min.js").then(function () { return import("./stage3d.js"); }).catch(function () {}); });
    }, { rootMargin: "700px 0px" });
    warm.observe(card);
  }

  // Which part of the diagram each paragraph is about, keyed by the words it starts with.
  var BLOCK = { "What I built": ["host", "chips"], "Security hardening": ["cloudflare", "firewall", "tunnel", "host"], "Data protection": ["host", "chips"], "The backup that": ["host"] };
  var ITEM = {
    "Platform": ["host"], "Architecture": ["host", "chips"], "Services": ["chips"],
    "Access control": ["host"], "Network": ["firewall"], "Intrusion prevention": ["firewall", "host"],
    "Perimeter": ["internet", "cloudflare", "tunnel"], "Data": ["host"], "Operations": ["host"],
    "Backups": ["host"], "Documents": ["host"], "Photos": ["immich"], "The media library": ["plex"], "Reliability": ["host"]
  };
  function lookup(table, text) {
    text = text.trim();
    for (var k in table) if (text.indexOf(k) === 0) return table[k];
    return [];
  }

  // The 3D model (stage3d.js) tells the same story in time: how far it has run for each section.
  var TARGET = { "Why I built": 0.44, "What I built": 0.97, "Security hardening": 0.8, "Data protection": 0.97, "The backup that": 0.97 };
  var LAYER = { internet: 0, cloudflare: 1, firewall: 2, tunnel: 3, host: 4, chips: 4, immich: 4, plex: 4 };
  function targetFor(text) { text = text.trim(); for (var k in TARGET) if (text.indexOf(k) === 0) return TARGET[k]; return 0.97; }

  var dlg, stage, right, steps, blockFocus = [], closing = false;
  var s3 = null, scene3d, legend = [], current = null, pinned = -1;
  function unpin() { pinned = -1; legend.forEach(function (el) { el.classList.remove("is-pinned"); }); }
  function hover3d(keys) {
    if (!s3 || pinned > -1) return;
    if (!keys) { s3.setFocus(null); return; }
    var layers = [], name = "";
    keys.forEach(function (k) { if (layers.indexOf(LAYER[k]) < 0) layers.push(LAYER[k]); if (k === "immich" || k === "plex") name = k; });
    s3.setFocus(layers, name);
  }
  function load3d() {
    if (s3 || load3d.tried || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    load3d.tried = true;
    var probe = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
    if (!probe) return;
    var ext = probe.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();
    var svg = stage.querySelector("svg");
    var chips = Array.prototype.map.call(svg.querySelectorAll(".dia-chip text"), function (t) { return t.textContent.trim(); });
    var names = chips.filter(function (n) { return n.indexOf("this website") === 0; }).concat(chips.filter(function (n) { return n.indexOf("this website") !== 0; }));
    var holder = scene3d.querySelector(".lab__canvas");
    scene3d.hidden = false; // it needs a size to be built at; it stays invisible until it is ready
    import("./stage3d.js").then(function (m) {
      return m.create(holder, names, function (layers) {
        legend.forEach(function (el, i) { el.classList.toggle("is-active", layers.indexOf(i) > -1); });
      });
    }).then(function (api) {
      s3 = api;
      holder.addEventListener("stage3d:lost", function () { s3 = null; scene3d.hidden = true; stage.hidden = false; });
      stage.hidden = true;
      scene3d.classList.add("is-ready");
      if (dlg.open) { s3.reset(); s3.start(); s3.setTarget(current ? current.p : 0.44); }
    }).catch(function () { scene3d.hidden = true; stage.hidden = false; });
  }

  function setFocus(keys) {
    stage.classList.toggle("has-focus", keys.length > 0);
    var anyChip = keys.indexOf("chips") > -1 || keys.indexOf("immich") > -1 || keys.indexOf("plex") > -1;
    stage.querySelectorAll("[data-k]").forEach(function (el) {
      var k = el.dataset.k, n = el.dataset.name;
      var lit = keys.indexOf(k) > -1 || (n && keys.indexOf(n) > -1) || (k === "chip" && keys.indexOf("chips") > -1) || (k === "host" && anyChip);
      el.classList.toggle("is-lit", lit);
    });
  }

  function build() {
    dlg = document.createElement("dialog");
    dlg.className = "lab";
    dlg.setAttribute("aria-label", card.querySelector("h3").textContent);

    var close = document.createElement("button");
    close.className = "lab__close"; close.type = "button"; close.setAttribute("aria-label", "Close"); close.textContent = "×";
    close.addEventListener("click", shut);

    var left = document.createElement("div"); left.className = "lab__left";
    left.appendChild(card.querySelector(".project__head").cloneNode(true));
    stage = document.createElement("div"); stage.className = "diagram is-live lab__stage"; stage.setAttribute("aria-hidden", "true");
    // Narrow screens fall back to the tall diagram if 3D is unavailable; it has the same parts under the same class names.
    var svg = ((!mq.matches && card.querySelector(".dia--narrow")) || wide).cloneNode(true);
    svg.setAttribute("class", "dia--wide");
    stage.appendChild(svg);
    // The 3D model's home, with the five layer names taken from the diagram's own labels.
    scene3d = document.createElement("div"); scene3d.className = "lab__scene"; scene3d.hidden = true; scene3d.setAttribute("aria-hidden", "true");
    var cv = document.createElement("div"); cv.className = "lab__canvas"; scene3d.appendChild(cv);
    var lg = document.createElement("div"); lg.className = "lab__legend";
    Array.prototype.map.call(svg.querySelectorAll(".dia-node"), function (g) { return g.querySelector("text").textContent; })
      .concat([svg.querySelector(".dia-host-label").textContent]).forEach(function (word) {
        var sp = document.createElement("span"); sp.textContent = word; lg.appendChild(sp); legend.push(sp);
        // Click a layer's name to pick it out on the model; click again to let the story carry on.
        var idx = legend.length - 1;
        sp.addEventListener("click", function () {
          if (!s3) return;
          pinned = pinned === idx ? -1 : idx;
          legend.forEach(function (el, i) { el.classList.toggle("is-pinned", i === pinned); });
          if (pinned < 0) { s3.setFocus(null); s3.setTarget(current ? current.p : 0.44); }
          else { s3.setFocus([pinned], ""); s3.setTarget(pinned === 4 ? 0.97 : 0.58); } // the layers must be apart to see one
        });
      });
    scene3d.appendChild(lg);
    left.appendChild(scene3d); left.appendChild(stage);
    var o = 0;
    ["internet", "cloudflare", "firewall", "tunnel"].forEach(function (name, i) {
      var g = svg.querySelectorAll(".dia-node")[i];
      if (g) { g.dataset.k = name; g.style.setProperty("--o", o++); }
    });
    var host = svg.querySelector(".dia-host");
    if (host) { host.dataset.k = "host"; host.style.setProperty("--o", o++); }
    svg.querySelectorAll(".dia-chip").forEach(function (g) {
      g.dataset.k = "chip"; g.dataset.name = (g.textContent.trim().split(/\s/)[0] || "").toLowerCase(); g.style.setProperty("--o", o++);
    });
    var note = svg.lastElementChild;
    if (note && note.tagName.toLowerCase() === "text") { note.dataset.k = "chip"; note.style.setProperty("--o", o++); }

    right = document.createElement("div"); right.className = "lab__right"; right.tabIndex = 0;
    steps = document.createElement("div"); steps.className = "lab__steps";
    var blocks = [];
    Array.prototype.forEach.call(details.querySelector(".project__case").children, function (child, i) {
      var c = child.cloneNode(true);
      c.style.setProperty("--o", i);
      right.appendChild(c);
      var h = c.querySelector("h4");
      if (!h) return;
      var b = document.createElement("button");
      b.type = "button"; b.textContent = h.textContent;
      b.addEventListener("click", function () { c.scrollIntoView({ block: "start" }); });
      steps.appendChild(b);
      blocks.push({ el: c, btn: b, focus: lookup(BLOCK, h.textContent), p: targetFor(h.textContent) });
      c.querySelectorAll("li").forEach(function (li) {
        var keys = lookup(ITEM, li.textContent);
        if (!keys.length) return;
        li.addEventListener("pointerenter", function () { li.classList.add("is-on"); setFocus(keys); hover3d(keys); });
        li.addEventListener("pointerleave", function () { li.classList.remove("is-on"); setFocus(blockFocus); hover3d(null); });
        // Touch has no hover: tap a point to light its part, tap again to let go.
        if (touch) li.addEventListener("click", function () {
          var was = li.classList.contains("is-on");
          right.querySelectorAll("li.is-on").forEach(function (o) { o.classList.remove("is-on"); });
          if (was) { setFocus(blockFocus); hover3d(null); } else { li.classList.add("is-on"); setFocus(keys); hover3d(keys); }
        });
      });
    });
    left.appendChild(steps);

    dlg.appendChild(close); dlg.appendChild(left); dlg.appendChild(right);
    document.body.appendChild(dlg);

    // The block being read decides what the diagram shows.
    var queued = false;
    function pick() {
      queued = false;
      var line = right.getBoundingClientRect().top + 110, now = blocks[0];
      blocks.forEach(function (b) { if (b.el.getBoundingClientRect().top <= line) now = b; });
      if (now === current) return;
      current = now;
      blocks.forEach(function (b) { b.btn.classList.toggle("is-active", b === now); });
      blockFocus = now.focus;
      if (!right.querySelector("li.is-on")) setFocus(blockFocus);
      if (s3) { if (pinned > -1) { unpin(); s3.setFocus(null); } s3.setTarget(now.p); }
    }
    right.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(pick); } }, { passive: true });
    dlg.addEventListener("lab:open", function () { current = null; pick(); });

    dlg.addEventListener("cancel", function (e) { e.preventDefault(); shut(); });
    dlg.addEventListener("click", function (e) { if (e.target === dlg) shut(); });
    // The page behind must not scroll while the walkthrough is open.
    dlg.addEventListener("wheel", function (e) {
      var inScroller = e.target.closest && e.target.closest(".lab__right, .lab__left");
      if (!inScroller) e.preventDefault();
    }, { passive: false });
    left.style.overscrollBehavior = "contain";
  }

  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var REST = "perspective(1700px) translate3d(0px, 0px, 0px) scale(1, 1) rotateX(0deg) rotateY(0deg)";
  // Where the card sits, written as a transform of the panel, so the panel can lift out of the card in 3D.
  function fromCard() {
    var c = card.getBoundingClientRect(), d = dlg.getBoundingClientRect();
    var top = Math.max(c.top, 0), bottom = Math.min(c.bottom, window.innerHeight);
    var h = Math.max(120, bottom - top);
    var dx = c.left + c.width / 2 - (d.left + d.width / 2);
    var dy = top + h / 2 - (d.top + d.height / 2);
    return "perspective(1700px) translate3d(" + dx.toFixed(1) + "px, " + dy.toFixed(1) + "px, 0px) scale(" +
      (c.width / d.width).toFixed(4) + ", " + Math.min(1, h / d.height).toFixed(4) + ") rotateX(-22deg) rotateY(9deg)";
  }

  function open() {
    if (!dlg) build();
    if (dlg.open) return;
    closing = false;
    dlg.classList.remove("is-closing");
    right.scrollTop = 0; blockFocus = []; setFocus([]);
    stage.style.removeProperty("--srx"); stage.style.removeProperty("--sry");
    if (!mq.matches) document.documentElement.style.overflow = "hidden"; // the page behind a full-screen sheet must not scroll
    dlg.showModal();
    right.focus({ preventScroll: true });
    unpin();
    if (s3) { s3.setFocus(null); s3.reset(); }
    dlg.dispatchEvent(new Event("lab:open"));
    document.documentElement.classList.add("lab-open"); document.dispatchEvent(new Event("lab:toggle"));
    if (s3) setTimeout(function () { if (dlg.open && !closing) s3.start(); }, 380);
    else setTimeout(function () { if (dlg.open && !closing) load3d(); }, 740); // not while the panel is lifting out
    if (!calm.matches) {
      dlg.style.transition = "none"; dlg.style.transform = "none";
      var start = fromCard();
      dlg.style.transform = start;
      void dlg.offsetWidth;
      dlg.style.transition = "";
    }
    requestAnimationFrame(function () { dlg.classList.add("is-open"); dlg.style.transform = calm.matches ? "none" : REST; });
  }
  function shut() {
    if (closing || !dlg.open) return;
    closing = true;
    dlg.classList.remove("is-open"); dlg.classList.add("is-closing");
    if (!calm.matches) {
      dlg.style.transform = "none";
      var back = fromCard();
      dlg.style.transform = REST;
      void dlg.offsetWidth;
      dlg.style.transform = back;
    }
    setTimeout(function () {
      dlg.close(); closing = false; document.documentElement.style.overflow = ""; if (s3) s3.stop();
      document.documentElement.classList.remove("lab-open"); document.dispatchEvent(new Event("lab:toggle"));
    }, 420);
  }

  card.addEventListener("click", function (e) {
    if (e.target.closest("a")) return;
    var onSummary = e.target.closest("summary");
    if (!onSummary) {
      if (e.target.closest(".project__case")) return;
      if (String(window.getSelection && window.getSelection()) !== "") return;
    }
    e.preventDefault();
    open();
  });
})();

/* ---------- Other project cards: the same walkthrough, each with its own 3D model ----------
   Words are the card's own summary and case study, cloned at open time. One entry per card that has a model.
   Desktop: a side-by-side panel. Below 1280px: the same full-screen sheet as the home server card. */
(function () {
  "use strict";
  if (typeof HTMLDialogElement === "undefined") return;
  var MODELS = [
    { title: "Retro Snake Arena", file: "./snake3d.js", tint: "#4fe3c1" },
    { title: "Bloom", file: "./bloom3d.js", tint: "#ff8fb8" },
    { title: "Patchwork", file: "./patch3d.js", tint: "#f0a868" },
    { title: "Signal Room", file: "./signal3d.js", tint: "#6fa8ff" },
    { title: "LocalPhotoPDF", file: "./pdf3d.js", tint: "#ff6b78" }
  ];
  var mq = window.matchMedia("(min-width: 1280px)");
  var calm = window.matchMedia("(prefers-reduced-motion: reduce)");
  var REST = "perspective(1700px) translate3d(0px, 0px, 0px) scale(1, 1) rotateX(0deg) rotateY(0deg)";
  if (calm.matches) return; // the inline case study stays as it is
  var probe = document.createElement("canvas").getContext("webgl2", { failIfMajorPerformanceCaveat: true });
  if (!probe) return;
  var ext = probe.getExtension("WEBGL_lose_context"); if (ext) ext.loseContext();

  var small = function () { return !mq.matches || window.matchMedia("(hover: none)").matches; };
  var kept = []; // on phones only the last three models opened stay built (phones cap live 3D contexts)
  var idle = window.requestIdleCallback || function (f) { return setTimeout(f, 300); };

  document.querySelectorAll(".project").forEach(function (card) {
    var h3 = card.querySelector("h3"), details = card.querySelector(".project__details");
    if (!h3 || !details || card.classList.contains("project--flagship")) return;
    var model = MODELS.filter(function (m) { return h3.textContent.trim().indexOf(m.title) === 0; })[0];
    // Without a 3D model there is nothing a panel would add over the inline case study.
    if (!model) return;
    card.classList.add("has-lab");
    // Fetch and parse the 3D code while the card is still coming up the page, so a click never waits for it.
    if ("IntersectionObserver" in window) {
      var warm = new IntersectionObserver(function (es) {
        if (!es[0].isIntersecting) return;
        warm.disconnect();
        // Build the panel now, while idle, so a tap on a slow phone only has to open it.
        idle(function () { if (!dlg) build(); import("./vendor/three/three.module.min.js").then(function () { return import(model.file); }).catch(function () {}); });
      }, { rootMargin: "700px 0px" });
      warm.observe(card);
    }

    var dlg, right, scene, cv, s3 = null, loading = false, closing = false, blocks = [], current = null;

    function fromCard() {
      var c = card.getBoundingClientRect(), d = dlg.getBoundingClientRect();
      var top = Math.max(c.top, 0), bottom = Math.min(c.bottom, window.innerHeight), h = Math.max(120, bottom - top);
      return "perspective(1700px) translate3d(" + (c.left + c.width / 2 - d.left - d.width / 2).toFixed(1) + "px, " + (top + h / 2 - d.top - d.height / 2).toFixed(1) +
        "px, 0px) scale(" + (c.width / d.width).toFixed(4) + ", " + Math.min(1, h / d.height).toFixed(4) + ") rotateX(-22deg) rotateY(9deg)";
    }

    // The model is built when the panel opens and handed back when it closes: phones allow only a few at once.
    function load() {
      if (s3 || loading) return;
      loading = true;
      import(model.file).then(function (m) { return m.create(cv); }).then(function (api) {
        loading = false;
        if (!dlg.open || closing) { if (api.destroy) api.destroy(); return; }
        s3 = api; scene.hidden = false; scene.classList.add("is-ready");
        if (small()) { kept = kept.filter(function (k) { return k !== kill; }); kept.push(kill); while (kept.length > 3) kept.shift()(); }
        s3.setTarget(current ? current.p : 0); s3.start();
      }).catch(function () { loading = false; scene.hidden = true; });
    }

    function kill() { if (!s3) return; s3.stop(); if (s3.destroy) s3.destroy(); s3 = null; scene.classList.remove("is-ready"); }

    function build() {
      dlg = document.createElement("dialog"); dlg.className = "lab lab--model"; dlg.style.setProperty("--lab-tint", model.tint); dlg.setAttribute("aria-label", h3.textContent);
      var close = document.createElement("button");
      close.className = "lab__close"; close.type = "button"; close.setAttribute("aria-label", "Close"); close.textContent = "×";
      close.addEventListener("click", shut);
      var left = document.createElement("div"); left.className = "lab__left";
      var head = card.querySelector(".project__head").cloneNode(true);
      // The title keeps every word; its second half is its own span so a phone can show the name alone on one line.
      var t = head.querySelector("h3"), cut = t.textContent.indexOf(" — ");
      if (cut > 0) {
        var a = document.createElement("span"), b = document.createElement("span");
        a.className = "lab__name"; a.textContent = t.textContent.slice(0, cut);
        b.className = "lab__tag"; b.textContent = t.textContent.slice(cut);
        t.textContent = ""; t.appendChild(a); t.appendChild(b);
      }
      left.appendChild(head);
      scene = document.createElement("div"); scene.className = "lab__scene"; scene.setAttribute("aria-hidden", "true");
      cv = document.createElement("div"); cv.className = "lab__canvas"; scene.appendChild(cv);
      cv.addEventListener("stage3d:lost", function () { s3 = null; scene.hidden = true; });
      left.appendChild(scene);
      var steps = document.createElement("div"); steps.className = "lab__steps";
      right = document.createElement("div"); right.className = "lab__right"; right.tabIndex = 0;
      var summary = card.querySelector(".project__summary");
      if (summary) { var sc = summary.cloneNode(true); sc.style.setProperty("--o", 0); right.appendChild(sc); }
      Array.prototype.forEach.call(details.querySelector(".project__case").children, function (child, i) {
        var c = child.cloneNode(true); c.style.setProperty("--o", i + 1); right.appendChild(c);
        var h = c.querySelector("h4"); if (!h) return;
        var b = document.createElement("button"); b.type = "button"; b.textContent = h.textContent;
        b.addEventListener("click", function () { c.scrollIntoView({ block: "start" }); });
        steps.appendChild(b); blocks.push({ el: c, btn: b, p: blocks.length ? 1 : 0.5 });
      });
      left.appendChild(steps);
      dlg.appendChild(close); dlg.appendChild(left); dlg.appendChild(right);
      document.body.appendChild(dlg);

      var queued = false;
      function pick() {
        queued = false;
        var line = right.getBoundingClientRect().top + 110, now = null;
        blocks.forEach(function (b) { if (b.el.getBoundingClientRect().top <= line) now = b; });
        if (now === current) return;
        current = now;
        blocks.forEach(function (b) { b.btn.classList.toggle("is-active", b === now); });
        if (s3) s3.setTarget(now ? now.p : 0);
      }
      right.addEventListener("scroll", function () { if (!queued) { queued = true; requestAnimationFrame(pick); } }, { passive: true });
      dlg.addEventListener("cancel", function (e) { e.preventDefault(); shut(); });
      dlg.addEventListener("click", function (e) { if (e.target === dlg) shut(); });
      dlg.addEventListener("wheel", function (e) { if (!(e.target.closest && e.target.closest(".lab__right, .lab__left"))) e.preventDefault(); }, { passive: false });
    }

    function open() {
      if (!dlg) build();
      if (dlg.open) return;
      closing = false; dlg.classList.remove("is-closing");
      right.scrollTop = 0; current = null;
      blocks.forEach(function (b) { b.btn.classList.remove("is-active"); });
      if (!mq.matches) document.documentElement.style.overflow = "hidden"; // the page behind a full-screen sheet must not scroll
      scene.hidden = false;
      document.documentElement.classList.add("lab-open"); document.dispatchEvent(new Event("lab:toggle"));
      dlg.showModal(); right.focus({ preventScroll: true });
      // A kept model just starts again. A new one is built only once the panel has finished lifting out.
      if (s3) { s3.reset(); setTimeout(function () { if (dlg.open && !closing && s3) s3.start(); }, 380); }
      else setTimeout(function () { if (dlg.open && !closing) load(); }, 740);
      dlg.style.transition = "none"; dlg.style.transform = "none";
      var start = fromCard();
      dlg.style.transform = start; void dlg.offsetWidth; dlg.style.transition = "";
      requestAnimationFrame(function () { dlg.classList.add("is-open"); dlg.style.transform = REST; });
    }
    function shut() {
      if (closing || !dlg.open) return;
      closing = true; dlg.classList.remove("is-open"); dlg.classList.add("is-closing");
      dlg.style.transform = "none"; var back = fromCard();
      dlg.style.transform = REST; void dlg.offsetWidth; dlg.style.transform = back;
      setTimeout(function () {
        dlg.close(); closing = false; document.documentElement.style.overflow = "";
        document.documentElement.classList.remove("lab-open"); document.dispatchEvent(new Event("lab:toggle"));
        if (s3) s3.stop();
      }, 420);
    }

    card.addEventListener("click", function (e) {
      if (e.target.closest("a")) return;
      if (!e.target.closest("summary")) {
        if (e.target.closest(".project__case")) return;
        if (String(window.getSelection && window.getSelection()) !== "") return;
      }
      e.preventDefault(); open();
    });
  });
})();
