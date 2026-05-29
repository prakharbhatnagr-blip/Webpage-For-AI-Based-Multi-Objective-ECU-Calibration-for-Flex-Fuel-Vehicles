const state = {
  ethanol: 20,
  rpm: 3000,
  load: 60,
  egr: 15,
  weight: 0.5
};

function clamp(value, min, max) {
  return Math.min(max, Math.max(min, value));
}

function initPreloader() {
  const messages = [
    "Ignition on - ECU self-test",
    "Sweeping speed and RPM meters",
    "Reading live engine feedback",
    "Loading surrogate control maps",
    "Cluster ready"
  ];
  const number = document.querySelector("#preload-number");
  const cluster = document.querySelector("#boot-cluster");
  const speedRead = document.querySelector("#speed-read");
  const rpmRead = document.querySelector("#rpm-boot-read");
  const message = document.querySelector("#preload-message");
  let progress = 0;
  const timer = setInterval(() => {
    progress = Math.min(100, progress + (progress < 86 ? Math.random() * 5 : 2));
    const phase = progress / 100;
    const sweep = phase < 0.55
      ? phase / 0.55
      : phase < 0.88
        ? 1 - ((phase - 0.55) / 0.33) * 0.82
        : 0.18 + ((phase - 0.88) / 0.12) * 0.06;
    const speed = Math.round(sweep * 260);
    const rpm = sweep * 9;
    const speedAngle = -128 + sweep * 256;
    const rpmAngle = -128 + sweep * 256;
    number.textContent = `${Math.floor(progress)}%`;
    speedRead.textContent = String(speed).padStart(3, "0");
    rpmRead.textContent = rpm.toFixed(1);
    cluster.style.setProperty("--speed-angle", `${speedAngle}deg`);
    cluster.style.setProperty("--rpm-angle", `${rpmAngle}deg`);
    cluster.style.setProperty("--speed-fill", `${sweep * 260}deg`);
    cluster.style.setProperty("--rpm-fill", `${sweep * 260}deg`);
    message.textContent = messages[Math.min(messages.length - 1, Math.floor((progress / 100) * messages.length))];
    if (progress >= 100) {
      clearInterval(timer);
      setTimeout(() => document.querySelector("#preloader").classList.add("done"), 300);
    }
  }, 34);
}

function initCursor() {
  const dot = document.querySelector("#cursor-dot");
  const ring = document.querySelector("#cursor-ring");
  const spotlight = document.querySelector("#cursor-spotlight");
  let mx = 0;
  let my = 0;
  let rx = 0;
  let ry = 0;
  let sx = 0;
  let sy = 0;
  document.addEventListener("mousemove", event => {
    mx = event.clientX;
    my = event.clientY;
    document.documentElement.style.setProperty("--page-x", `${event.clientX}px`);
    document.documentElement.style.setProperty("--page-y", `${event.clientY}px`);
  });
  document.querySelectorAll("a, button, input, .car-card, .result-card").forEach(element => {
    element.addEventListener("mouseenter", () => ring.classList.add("big"));
    element.addEventListener("mouseleave", () => ring.classList.remove("big"));
  });
  function frame() {
    dot.style.left = `${mx}px`;
    dot.style.top = `${my}px`;
    rx += (mx - rx) * 0.12;
    ry += (my - ry) * 0.12;
    sx += (mx - sx) * 0.08;
    sy += (my - sy) * 0.08;
    ring.style.left = `${rx}px`;
    ring.style.top = `${ry}px`;
    spotlight.style.left = `${sx}px`;
    spotlight.style.top = `${sy}px`;
    requestAnimationFrame(frame);
  }
  frame();
}

function initReveal() {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) entry.target.classList.add("on");
    });
  }, { threshold: 0.12 });
  document.querySelectorAll(".reveal").forEach(element => observer.observe(element));
}

function initNav() {
  const nav = document.querySelector("#nav");
  window.addEventListener("scroll", () => {
    nav.classList.toggle("slim", window.scrollY > 60);
  }, { passive: true });
}

function initHoverReactions() {
  const selector = [
    ".car-card",
    ".result-card",
    ".problem-grid article",
    ".journey-rail article",
    ".e30-grid article",
    ".expect-copy article",
    ".method-grid article",
    ".dataset-grid article",
    ".loop-grid article",
    ".compare-grid article",
    ".insight-grid article",
    ".script-grid article",
    ".future-grid article",
    ".faq-grid article",
    ".reference-grid article",
    ".metric-stack article",
    ".readouts article",
    ".button",
    ".nav-cta"
  ].join(",");

  document.querySelectorAll(selector).forEach(element => {
    element.classList.add("reactive");
    element.addEventListener("mousemove", event => {
      const rect = element.getBoundingClientRect();
      const x = (event.clientX - rect.left) / rect.width;
      const y = (event.clientY - rect.top) / rect.height;
      element.style.setProperty("--mx", `${(x * 100).toFixed(1)}%`);
      element.style.setProperty("--my", `${(y * 100).toFixed(1)}%`);
      element.style.setProperty("--rx", `${((0.5 - y) * 8).toFixed(2)}deg`);
      element.style.setProperty("--ry", `${((x - 0.5) * 10).toFixed(2)}deg`);
    });
    element.addEventListener("mouseleave", () => {
      element.style.setProperty("--rx", "0deg");
      element.style.setProperty("--ry", "0deg");
      element.style.setProperty("--mx", "50%");
      element.style.setProperty("--my", "50%");
    });
  });
}

function predict(values) {
  const ethanol = values.ethanol / 100;
  const rpm = values.rpm / 7500;
  const load = values.load / 100;
  const egr = values.egr / 40;
  const timing = clamp(21 + ethanol * 13 - rpm * 5.8 + load * 8.4 - egr * 4.2, 11, 39);
  const nox = clamp(2.8 - ethanol * 0.82 - egr * 1.25 + rpm * 0.56 + load * 0.34, 0.18, 3.2);
  const bsfc = clamp(260 + ethanol * 38 - load * 28 + rpm * 18 - egr * 14, 185, 315);
  const objective = values.weight * bsfc + (1 - values.weight) * nox * 100;
  return { timing, nox, bsfc, objective };
}

function updateSimulator() {
  const result = predict(state);
  document.querySelector("#ethanol-out").value = `E${state.ethanol}`;
  document.querySelector("#rpm-out").value = state.rpm;
  document.querySelector("#load-out").value = `${state.load}%`;
  document.querySelector("#egr-out").value = `${state.egr}%`;
  document.querySelector("#weight-out").value = state.weight.toFixed(2);
  document.querySelector("#timing-read").textContent = `${result.timing.toFixed(1)} deg`;
  document.querySelector("#nox-read").textContent = `${result.nox.toFixed(2)} g/kWh`;
  document.querySelector("#bsfc-read").textContent = `${result.bsfc.toFixed(1)} g/kWh`;
  document.querySelector("#objective-read").textContent = result.objective.toFixed(1);
}

function initControls() {
  const map = {
    ethanol: value => Number(value),
    rpm: value => Number(value),
    load: value => Number(value),
    egr: value => Number(value),
    weight: value => Number(value) / 100
  };
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
  const ratio = window.devicePixelRatio || 1;
  canvas.width = Math.floor(width * ratio);
  canvas.height = Math.floor(height * ratio);
  const ctx = canvas.getContext("2d");
  ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
  return { ctx, width, height };
}

function drawFramework() {
  const canvas = document.querySelector("#framework-canvas");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas, 420);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#050505";
  ctx.fillRect(0, 0, width, height);

  const layers = [
    { x: width * 0.16, title: "Sensors", nodes: ["Fuel blend", "Engine load", "Intake temp", "Cylinder pressure"] },
    { x: width * 0.5, title: "AI ECU", nodes: ["BSFC model", "NOx model", "Optimizer"] },
    { x: width * 0.84, title: "Actuators", nodes: ["Injection timing", "Fuel pressure", "EGR rate", "Boost pressure"] }
  ];

  ctx.strokeStyle = "rgba(255,255,255,.10)";
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 48) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
  for (let y = 0; y < height; y += 48) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(width, y);
    ctx.stroke();
  }

  ctx.font = "10px DM Mono, monospace";
  ctx.textAlign = "center";
  layers.forEach(layer => {
    ctx.fillStyle = "rgba(255,255,255,.34)";
    ctx.fillText(`// ${layer.title.toUpperCase()}`, layer.x, 36);
    layer.nodes.forEach((node, index) => {
      const y = 98 + index * 72;
      ctx.fillStyle = "rgba(0,0,0,.92)";
      ctx.strokeStyle = index === 1 && layer.title === "AI ECU" ? "rgba(255,255,255,.72)" : "rgba(255,255,255,.22)";
      ctx.strokeRect(layer.x - 82, y - 22, 164, 44);
      ctx.fillRect(layer.x - 82, y - 22, 164, 44);
      ctx.fillStyle = "rgba(255,255,255,.72)";
      ctx.fillText(node, layer.x, y + 4);
    });
  });

  const lines = [
    [0.16, 98, 0.5, 98], [0.16, 170, 0.5, 170], [0.16, 242, 0.5, 242], [0.16, 314, 0.5, 242],
    [0.5, 98, 0.84, 98], [0.5, 170, 0.84, 170], [0.5, 242, 0.84, 242], [0.5, 242, 0.84, 314]
  ];
  ctx.strokeStyle = "rgba(255,255,255,.16)";
  lines.forEach(([x1, y1, x2, y2]) => {
    ctx.beginPath();
    ctx.moveTo(width * x1 + 82, y1);
    ctx.bezierCurveTo(width * (x1 + x2) / 2, y1, width * (x1 + x2) / 2, y2, width * x2 - 82, y2);
    ctx.stroke();
  });
}

function drawSimulator() {
  const canvas = document.querySelector("#sim-canvas");
  if (!canvas) return;
  const { ctx, width, height } = fitCanvas(canvas, 430);
  const left = 60;
  const bottom = 52;
  const plotW = width - left - 24;
  const plotH = height - bottom - 24;
  ctx.fillStyle = "#060606";
  ctx.fillRect(0, 0, width, height);

  const cols = 26;
  const rows = 16;
  const cw = plotW / cols;
  const ch = plotH / rows;
  for (let i = 0; i < cols; i++) {
    for (let j = 0; j < rows; j++) {
      const timing = 10 + (i / cols) * 30;
      const load = (j / rows) * 100;
      const nox = 2.8 - state.ethanol / 125 - state.egr / 32 + state.rpm / 13000 + load / 230 + timing / 90;
      const n = clamp((nox - 0.2) / 3.2, 0, 1);
      ctx.fillStyle = `rgba(${Math.round(225 * n)}, ${Math.round(225 * (1 - n))}, ${Math.round(190 * (1 - n))}, .62)`;
      ctx.fillRect(left + i * cw, 18 + j * ch, cw - 1, ch - 1);
    }
  }

  ctx.strokeStyle = "rgba(255,255,255,.28)";
  ctx.strokeRect(left, 18, plotW, plotH);
  ctx.fillStyle = "rgba(255,255,255,.42)";
  ctx.font = "9px DM Mono, monospace";
  ctx.textAlign = "center";
  ctx.fillText("INJECTION TIMING", left + plotW / 2, height - 14);
  ctx.save();
  ctx.translate(18, 18 + plotH / 2);
  ctx.rotate(-Math.PI / 2);
  ctx.fillText("ENGINE LOAD", 0, 0);
  ctx.restore();

  const current = predict(state);
  const ox = left + ((current.timing - 10) / 30) * plotW;
  const oy = 18 + (state.load / 100) * plotH;
  ctx.strokeStyle = "white";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ox, oy, 11, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = "white";
  ctx.beginPath();
  ctx.arc(ox, oy, 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.textAlign = "left";
  ctx.fillText("AI OPTIMAL", ox + 16, oy - 8);
}

function initSimulatorAnimation() {
  drawFramework();
  drawSimulator();
  window.addEventListener("resize", () => {
    drawFramework();
    drawSimulator();
  });
}

initPreloader();
initCursor();
initReveal();
initNav();
initHoverReactions();
initControls();
initSimulatorAnimation();
