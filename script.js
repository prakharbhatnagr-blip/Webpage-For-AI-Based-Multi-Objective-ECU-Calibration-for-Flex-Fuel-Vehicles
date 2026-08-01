"use strict";

const state = { ethanol: 20, rpm: 3000, load: 60, egr: 15, weight: 0.5 };
const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
const finePointer = window.matchMedia("(pointer: fine)").matches;

function clamp(value, min, max) { return Math.min(max, Math.max(min, value)); }
function lerp(a, b, t) { return a + (b - a) * t; }
function smoothstep(edge0, edge1, x) {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1);
  return t * t * (3 - 2 * t);
}

/* ---------------------------------------------------------
   Preloader
--------------------------------------------------------- */
function initPreloader() {
  const fill = document.querySelector("#preload-fill");
  const pct = document.querySelector("#preload-pct");
  const preloader = document.querySelector("#preloader");
  const messages = [
    "Booting ECU neural layer",
    "Loading surrogate control maps",
    "Reading live engine feedback",
    "Calibrating Pareto optimizer",
    "Cluster ready"
  ];
  const status = document.querySelector("#preload-status");
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(100, progress + (progress < 82 ? Math.random() * 9 : 3));
    fill.style.width = `${progress}%`;
    pct.textContent = `${Math.floor(progress)}%`;
    const msg = messages[Math.min(messages.length - 1, Math.floor((progress / 100) * messages.length))];
    status.childNodes[0].textContent = `${msg} — `;
    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => preloader.classList.add("done"), 280);
    }
  }, 90);
}

/* ---------------------------------------------------------
   Custom cursor
--------------------------------------------------------- */
function initCursor() {
  if (!finePointer || reducedMotion) return;
  document.body.classList.add("has-fine-pointer");
  const dot = document.querySelector("#cursor-dot");
  const ring = document.querySelector("#cursor-ring");
  const spotlight = document.querySelector("#cursor-spotlight");
  let mx = 0, my = 0, rx = 0, ry = 0, sx = 0, sy = 0;
  document.addEventListener("mousemove", event => {
    mx = event.clientX; my = event.clientY;
    document.documentElement.style.setProperty("--page-x", `${mx}px`);
    document.documentElement.style.setProperty("--page-y", `${my}px`);
  });
  document.querySelectorAll("a, button, input, .car-card, .result-card").forEach(el => {
    el.addEventListener("mouseenter", () => ring.classList.add("big"));
    el.addEventListener("mouseleave", () => ring.classList.remove("big"));
  });
  (function frame() {
    dot.style.left = `${mx}px`; dot.style.top = `${my}px`;
    rx += (mx - rx) * 0.14; ry += (my - ry) * 0.14;
    sx += (mx - sx) * 0.08; sy += (my - sy) * 0.08;
    ring.style.left = `${rx}px`; ring.style.top = `${ry}px`;
    spotlight.style.left = `${sx}px`; spotlight.style.top = `${sy}px`;
    requestAnimationFrame(frame);
  })();
}

/* ---------------------------------------------------------
   Scroll reveal / counters / progress / magnetic / glow
--------------------------------------------------------- */
function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) entry.target.classList.add("on"); });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal, .reveal-scale").forEach(el => observer.observe(el));
}

function initCounters() {
  const nodes = document.querySelectorAll("[data-counter]");
  if (!nodes.length) return;
  const animate = el => {
    const target = Number(el.getAttribute("data-target")) || 0;
    const suffix = el.getAttribute("data-suffix") || "";
    if (reducedMotion) { el.textContent = target.toLocaleString("en-IN") + suffix; return; }
    const duration = 1300;
    const start = performance.now();
    const step = now => {
      const p = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(eased * target).toLocaleString("en-IN") + suffix;
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting && !entry.target.dataset.counted) {
        entry.target.dataset.counted = "true";
        animate(entry.target);
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.4 });
  nodes.forEach(n => observer.observe(n));
}

function initScrollProgress() {
  const bar = document.querySelector("#scroll-progress");
  if (!bar) return;
  const update = () => {
    const doc = document.documentElement;
    const max = doc.scrollHeight - doc.clientHeight;
    bar.style.width = `${max > 0 ? (doc.scrollTop / max) * 100 : 0}%`;
  };
  window.addEventListener("scroll", update, { passive: true });
  window.addEventListener("resize", update);
  update();
}

function initMagnetic() {
  if (!finePointer || reducedMotion) return;
  document.querySelectorAll(".magnetic").forEach(el => {
    el.addEventListener("mousemove", event => {
      const rect = el.getBoundingClientRect();
      const relX = event.clientX - rect.left - rect.width / 2;
      const relY = event.clientY - rect.top - rect.height / 2;
      el.style.transform = `translate(${relX * 0.26}px, ${relY * 0.3}px)`;
    });
    el.addEventListener("mouseleave", () => { el.style.transform = "translate(0,0)"; });
  });
}

function initCardGlow() {
  if (!finePointer) return;
  document.querySelectorAll(".card-glow, .problem-grid article, .method-grid article, .e30-grid article, .dataset-grid article, .insight-grid article, .future-grid article, .faq-grid article, .reference-grid article, .about-card").forEach(card => {
    card.classList.add("card-glow");
    card.addEventListener("mousemove", event => {
      const rect = card.getBoundingClientRect();
      card.style.setProperty("--mx", `${event.clientX - rect.left}px`);
      card.style.setProperty("--my", `${event.clientY - rect.top}px`);
    });
  });
}

function initNav() {
  const nav = document.querySelector("#nav");
  const update = () => nav.classList.toggle("slim", window.scrollY > 40);
  window.addEventListener("scroll", update, { passive: true });
  update();
}

function initBackToTop() {
  const btn = document.querySelector("#back-to-top");
  if (!btn) return;
  btn.addEventListener("click", () => window.scrollTo({ top: 0, behavior: reducedMotion ? "auto" : "smooth" }));
}

function initChapter() {
  const section = document.querySelector("#journey");
  const frames = document.querySelectorAll("#chapter-frames .chapter-frame");
  const dots = document.querySelectorAll("#chapter-dots span");
  const indexEl = document.querySelector("#chapter-index");
  const titleEl = document.querySelector("#chapter-title");
  const textEl = document.querySelector("#chapter-text");
  if (!section || !frames.length) return;

  const scenes = [
    { title: "Context", text: "India's move toward higher ethanol blending raises compatibility and calibration questions for every vehicle on the road." },
    { title: "Problem", text: "Blend changes affect air-fuel ratio, combustion temperature, knock margin, BSFC, and NOx — all at once." },
    { title: "Method", text: "Surrogate models predict engine outputs from live parameters — no dyno test needed for every setting." },
    { title: "Optimizer", text: "A grid search over ECU controls selects a Pareto-aware operating point in real time." },
    { title: "Impact", text: "Adaptive calibration prepares vehicles for the E20 to E30 ethanol transition already underway." }
  ];
  const count = frames.length;
  let lastIdx = -1;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = clamp(total > 0 ? -rect.top / total : 0, 0, 1);

      if (rect.bottom > 0 && rect.top < window.innerHeight) {
        const frameFloat = clamp(progress * count, 0, count - 0.001);
        const idx = Math.floor(frameFloat);
        const f = frameFloat - idx;

        frames.forEach((frame, i) => {
          let opacity = 0;
          if (i === idx) opacity = 1 - smoothstep(0.72, 1, f);
          else if (i === idx + 1) opacity = smoothstep(0, 0.28, f);
          frame.style.opacity = String(opacity);
          frame.classList.toggle("is-on", opacity > 0.02);
        });

        if (idx !== lastIdx) {
          lastIdx = idx;
          const scene = scenes[idx] || scenes[scenes.length - 1];
          if (titleEl) titleEl.textContent = scene.title;
          if (textEl) textEl.textContent = scene.text;
          if (indexEl) indexEl.textContent = `${String(idx + 1).padStart(2, "0")} — ${String(count).padStart(2, "0")}`;
          dots.forEach((dot, i) => dot.classList.toggle("is-on", i === idx));
        }

        const textOpacity = smoothstep(0, 0.12, f) * (1 - smoothstep(0.8, 1, f));
        if (titleEl) titleEl.style.opacity = String(Math.max(0.35, textOpacity));
      }

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------------------------------------------------------
   Hero scroll-scrub "video" renderer
   The animation frame is a pure function of scroll progress,
   so scrolling literally scrubs through the sequence.
--------------------------------------------------------- */
function initHeroScrub() {
  const section = document.querySelector("#hero");
  const photo = document.querySelector("#hero-photo");
  const copy = document.querySelector("#hero-copy");
  const cue = document.querySelector("#scroll-cue");
  if (!section || !photo) return;

  let ticking = false;
  function onScroll() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(() => {
      const rect = section.getBoundingClientRect();
      const total = section.offsetHeight - window.innerHeight;
      const progress = clamp(total > 0 ? -rect.top / total : 0, 0, 1);

      // cinematic dolly-in on the photo, driven purely by scroll position
      const scale = lerp(1.06, 1.34, progress);
      const shiftY = lerp(0, -46, progress);
      photo.style.transform = `scale(${scale}) translateY(${shiftY}px)`;

      if (copy) {
        const fadeOut = smoothstep(0.42, 0.78, progress);
        copy.style.opacity = String(1 - fadeOut);
        copy.style.transform = `translateY(${progress * -60}px) scale(${1 - progress * 0.05})`;
      }
      if (cue) cue.style.opacity = String(1 - smoothstep(0.02, 0.1, progress));

      ticking = false;
    });
  }
  window.addEventListener("scroll", onScroll, { passive: true });
  onScroll();
}

/* ---------------------------------------------------------
   Simulator (predict + canvas)
--------------------------------------------------------- */
function predict(values) {
  const ethanol = values.ethanol / 100, rpm = values.rpm / 7500, load = values.load / 100, egr = values.egr / 40;
  const timing = clamp(21 + ethanol * 13 - rpm * 5.8 + load * 8.4 - egr * 4.2, 11, 39);
  const nox = clamp(2.8 - ethanol * 0.82 - egr * 1.25 + rpm * 0.56 + load * 0.34, 0.18, 3.2);
  const bsfc = clamp(260 + ethanol * 38 - load * 28 + rpm * 18 - egr * 14, 185, 315);
  const objective = values.weight * bsfc + (1 - values.weight) * nox * 100;
  return { timing, nox, bsfc, objective };
}

function updateSimulator() {
  const r = predict(state);
  document.querySelector("#ethanol-out").value = `E${state.ethanol}`;
  document.querySelector("#rpm-out").value = state.rpm;
  document.querySelector("#load-out").value = `${state.load}%`;
  document.querySelector("#egr-out").value = `${state.egr}%`;
  document.querySelector("#weight-out").value = state.weight.toFixed(2);
  document.querySelector("#timing-read").textContent = `${r.timing.toFixed(1)} deg`;
  document.querySelector("#nox-read").textContent = `${r.nox.toFixed(2)} g/kWh`;
  document.querySelector("#bsfc-read").textContent = `${r.bsfc.toFixed(1)} g/kWh`;
  document.querySelector("#objective-read").textContent = r.objective.toFixed(1);
}

function initControls() {
  const map = { ethanol: Number, rpm: Number, load: Number, egr: Number, weight: v => Number(v) / 100 };
  Object.keys(map).forEach(key => {
    const input = document.querySelector(`#${key}`);
    input.addEventListener("input", () => {
      state[key] = map[key](input.value);
      updateSimulator();
      drawSimulator();
    });
  });
  updateSimulator();
}

function fitCanvas(canvas, height = 420) {
  const width = canvas.clientWidth || 900;
  const r = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(width * r);
  canvas.height = Math.floor(height * r);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(r, 0, 0, r, 0, 0);
  return { ctx, width, height };
}

function drawSimulator() {
  const canvas = document.querySelector("#sim-canvas");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas, 430);
  const left = 60, bottom = 52, plotW = width - left - 24, plotH = height - bottom - 24;
  ctx.fillStyle = "#08080a"; ctx.fillRect(0, 0, width, height);

  const cols = 26, rows = 16, cw = plotW / cols, ch = plotH / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const timing = 10 + (i / cols) * 30, load = (j / rows) * 100;
      const nox = 2.8 - state.ethanol / 125 - state.egr / 32 + state.rpm / 13000 + load / 230 + timing / 90;
      const n = clamp((nox - 0.2) / 3.2, 0, 1);
      const v = Math.round(24 + n * 130);
      ctx.fillStyle = `rgba(${v}, ${v}, ${v}, .8)`;
      ctx.fillRect(left + i * cw, 18 + j * ch, cw - 1, ch - 1);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,.24)"; ctx.strokeRect(left, 18, plotW, plotH);
  ctx.fillStyle = "rgba(255,255,255,.4)"; ctx.font = "9px 'DM Mono', monospace"; ctx.textAlign = "center";
  ctx.fillText("INJECTION TIMING", left + plotW / 2, height - 14);
  ctx.save(); ctx.translate(18, 18 + plotH / 2); ctx.rotate(-Math.PI / 2);
  ctx.fillText("ENGINE LOAD", 0, 0); ctx.restore();

  const current = predict(state);
  const ox = left + ((current.timing - 10) / 30) * plotW;
  const oy = 18 + (state.load / 100) * plotH;
  ctx.strokeStyle = "white"; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(ox, oy, 11, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = "white"; ctx.beginPath(); ctx.arc(ox, oy, 3, 0, Math.PI * 2); ctx.fill();
  ctx.textAlign = "left"; ctx.fillText("AI OPTIMAL", ox + 16, oy - 8);
}

function initSimulatorAnimation() {
  drawSimulator();
  window.addEventListener("resize", () => { drawSimulator(); });
}

/* ---------------------------------------------------------
   Smooth wheel scroll — buttery, eased scrolling on desktop
   so every scroll-linked effect above feels fluid, not jumpy.
--------------------------------------------------------- */
function initSmoothScroll() {
  if (!finePointer || reducedMotion) return;
  let target = window.scrollY;
  let current = target;
  let raf = null;

  function tick() {
    current += (target - current) * 0.12;
    if (Math.abs(target - current) < 0.4) current = target;
    window.scrollTo(0, current);
    if (current !== target) raf = requestAnimationFrame(tick);
    else raf = null;
  }

  window.addEventListener("wheel", event => {
    if (event.ctrlKey) return; // allow pinch-zoom
    event.preventDefault();
    const max = document.documentElement.scrollHeight - window.innerHeight;
    target = clamp(target + event.deltaY, 0, max);
    if (!raf) raf = requestAnimationFrame(tick);
  }, { passive: false });

  window.addEventListener("scroll", () => {
    if (!raf) { target = window.scrollY; current = window.scrollY; }
  }, { passive: true });

  document.querySelectorAll('a[href^="#"]').forEach(link => {
    link.addEventListener("click", () => {
      requestAnimationFrame(() => { target = window.scrollY; current = window.scrollY; });
    });
  });
}

/* ---------------------------------------------------------
   Boot
--------------------------------------------------------- */
initPreloader();
initCursor();
initReveal();
initCounters();
initScrollProgress();
initMagnetic();
initCardGlow();
initNav();
initBackToTop();
initChapter();
initHeroScrub();
initControls();
initSimulatorAnimation();
initSmoothScroll();
