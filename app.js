/* Austria through Fourier – two independent epicycle chains for x(t) and y(t).
 * Coordinates and mathematics are local; no tracking, libraries, build process or network calls.
 */
(() => {
  "use strict";

  const outline = window.AUSTRIA_BORDER;
  const canvas = document.getElementById("visualization");
  if (!canvas || !Array.isArray(outline) || outline.length < 3) return;
  const ctx = canvas.getContext("2d");
  if (!ctx) return;

  const get = id => document.getElementById(id);
  const $n = get("harmonics"), $nSelect = get("nSelect"), $speed = get("speed"), $timeline = get("timeline");
  const $play = get("play"), $restart = get("restart"), $full = get("fullscreen");
  const $source = get("showOriginal"), $circles = get("showCircles"), $guides = get("showGuides");
  // Native dropdown, with every supported harmonic value.
  $nSelect.replaceChildren();
  for (let k = 1; k <= 100; k++) {
    const option = document.createElement("option");
    option.value = String(k);
    option.textContent = String(k);
    $nSelect.appendChild(option);
  }
  const TWO_PI = 2 * Math.PI, SAMPLE_COUNT = 1024, MAX_N = 100;
  const YELLOW = "#ead27b", MINT = "#72c9b9", WHITE = "#f2f6f7";
  let n = 8, speed = 1, progress = 0, playing = true, lastTime = null;
  let w = 0, h = 0, dpr = 1, shape = [], rms = 0;

  // Equal-arclength sampling ensures that the Fourier transform is independent
  // of the varying geographic vertex density in the original geometry.
  function resampleClosed(vertices, count) {
    const cumulative = [0];
    for (let i = 0; i < vertices.length; i++) {
      const p = vertices[i], q = vertices[(i + 1) % vertices.length];
      cumulative.push(cumulative[i] + Math.hypot(q[0] - p[0], q[1] - p[1]));
    }
    const length = cumulative[cumulative.length - 1];
    const out = [];
    let segment = 0;
    for (let i = 0; i < count; i++) {
      const distance = (i / count) * length;
      while (segment + 1 < cumulative.length - 1 && cumulative[segment + 1] < distance) segment++;
      const a = vertices[segment], b = vertices[(segment + 1) % vertices.length];
      const segLength = cumulative[segment + 1] - cumulative[segment];
      const t = segLength === 0 ? 0 : (distance - cumulative[segment]) / segLength;
      out.push([a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]);
    }
    return out;
  }

  const original = resampleClosed(outline, SAMPLE_COUNT);
  const cx = new Float64Array(MAX_N + 1), sx = new Float64Array(MAX_N + 1);
  const cy = new Float64Array(MAX_N + 1), sy = new Float64Array(MAX_N + 1);

  // Real Fourier series: c0 + sum (a_k cos(k*t) + b_k sin(k*t)).
  // One harmonic = one rotating arm per coordinate, not two arms.
  for (const [x, y] of original) { cx[0] += x / SAMPLE_COUNT; cy[0] += y / SAMPLE_COUNT; }
  for (let k = 1; k <= MAX_N; k++) {
    let ax = 0, bx = 0, ay = 0, by = 0;
    for (let j = 0; j < SAMPLE_COUNT; j++) {
      const t = TWO_PI * k * j / SAMPLE_COUNT;
      const co = Math.cos(t), si = Math.sin(t);
      ax += original[j][0] * co; bx += original[j][0] * si;
      ay += original[j][1] * co; by += original[j][1] * si;
    }
    cx[k] = 2 * ax / SAMPLE_COUNT; sx[k] = 2 * bx / SAMPLE_COUNT;
    cy[k] = 2 * ay / SAMPLE_COUNT; sy[k] = 2 * by / SAMPLE_COUNT;
  }

  const xMin = Math.min(...outline.map(p => p[0])), xMax = Math.max(...outline.map(p => p[0]));
  const yMin = Math.min(...outline.map(p => p[1])), yMax = Math.max(...outline.map(p => p[1]));
  const bboxDiagonal = Math.hypot(xMax - xMin, yMax - yMin);

  function reconstructedAt(t, degree) {
    let x = cx[0], y = cy[0];
    for (let k = 1; k <= degree; k++) {
      const a = k * t, co = Math.cos(a), si = Math.sin(a);
      x += cx[k] * co + sx[k] * si;
      y += cy[k] * co + sy[k] * si;
    }
    return [x, y];
  }

  function rebuild() {
    shape = Array.from({length: SAMPLE_COUNT}, (_, i) => reconstructedAt(TWO_PI * i / SAMPLE_COUNT, n));
    let squared = 0;
    for (let i = 0; i < SAMPLE_COUNT; i++) {
      const dx = shape[i][0] - original[i][0], dy = shape[i][1] - original[i][1];
      squared += dx * dx + dy * dy;
    }
    rms = (100 / bboxDiagonal) * Math.sqrt(squared / SAMPLE_COUNT);
    const label = (rms < 0.1 ? rms.toFixed(3) : rms.toFixed(2)).replace(".", ",") + " %";
    $nSelect.value = String(n);
    get("harmonicsValue").textContent = n;
    get("errorReadout").textContent = label;
    get("errorMetric").textContent = label;
    draw();
  }

  function resize() {
    const rect = canvas.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    w = rect.width; h = rect.height;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw();
  }

  function scene() {
    const square = w / h > 0.82 && w / h < 1.2;
    if (square) {
      return {ox: w * 0.60, oy: h * 0.67, top: h * 0.23, left: w * 0.14, scale: w * 0.35};
    }
    const portrait = w / h < 0.8;
    return {
      ox: w * (portrait ? 0.63 : 0.66),
      oy: h * (portrait ? 0.68 : 0.64),
      top: h * (portrait ? 0.28 : 0.25),
      left: w * (portrait ? 0.10 : 0.12),
      scale: Math.min(w * (portrait ? 0.33 : 0.31), h * (portrait ? 0.22 : 0.29))
    };
  }

  function path(points, s, close) {
    if (!points.length) return;
    ctx.beginPath();
    ctx.moveTo(s.ox + points[0][0] * s.scale, s.oy + points[0][1] * s.scale);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(s.ox + points[i][0] * s.scale, s.oy + points[i][1] * s.scale);
    }
    if (close) ctx.closePath();
  }

  function drawChain(origin, a, b, t, vertical, color, scale, showCircles) {
    let x = origin.x, y = origin.y;
    for (let k = 1; k <= n; k++) {
      const angle = k * t, co = Math.cos(angle), si = Math.sin(angle);
      const vx = vertical ? (b[k] * co - a[k] * si) : (a[k] * co + b[k] * si);
      const vy = vertical ? (a[k] * co + b[k] * si) : (b[k] * co - a[k] * si);
      const nx = x + vx * scale, ny = y + vy * scale;
      const radius = Math.hypot(a[k], b[k]) * scale;
      if (showCircles && radius > 0.65) {
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, TWO_PI);
        ctx.lineWidth = 0.8;
        ctx.strokeStyle = "rgba(154,169,189," + (radius < 2 ? "0.15" : "0.28") + ")";
        ctx.stroke();
      }
      if (showCircles && radius > 0.6) {
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(nx, ny);
        ctx.strokeStyle = color; ctx.globalAlpha = Math.max(0.36, 0.88 - k * 0.006);
        ctx.lineWidth = k <= 8 ? 1.4 : 0.95; ctx.stroke();
        ctx.globalAlpha = 1;
      }
      x = nx; y = ny;
    }
    if (showCircles) {
      ctx.beginPath(); ctx.arc(x, y, 2.5, 0, TWO_PI);
      ctx.fillStyle = color; ctx.fill();
    }
    return {x, y};
  }

  function draw() {
    if (!w || !h) return;
    ctx.clearRect(0, 0, w, h);
    const s = scene();

    // A barely visible mathematical grid remains behind the silhouette.
    ctx.lineWidth = 0.55;
    ctx.strokeStyle = "rgba(111,134,158,0.055)";
    for (let x = 0; x < w; x += 46) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }
    for (let y = 0; y < h; y += 46) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
    }

    if ($source.checked) {
      path(original, s, true);
      ctx.lineWidth = 1.05; ctx.strokeStyle = "rgba(170,184,199,0.29)";
      ctx.stroke();
    }

    // Draw only the portion that the moving pen has reached.
    const count = Math.floor(progress * SAMPLE_COUNT);
    if (count > 0) {
      path(shape.slice(0, Math.min(count + 1, SAMPLE_COUNT)), s, progress >= 1);
      ctx.lineWidth = Math.max(1.4, Math.min(2.3, w / 360));
      ctx.lineJoin = "round"; ctx.lineCap = "round";
      ctx.strokeStyle = "rgba(248,250,251,0.95)";
      ctx.shadowColor = "rgba(255,255,255,0.16)";
      ctx.shadowBlur = 5; ctx.stroke(); ctx.shadowBlur = 0;
    }

    const t = TWO_PI * progress;
    const endX = drawChain({x:s.ox + cx[0] * s.scale, y:s.top}, cx, sx, t, false, YELLOW, s.scale, $circles.checked);
    const endY = drawChain({x:s.left, y:s.oy + cy[0] * s.scale}, cy, sy, t, true, MINT, s.scale, $circles.checked);
    const penX = endX.x, penY = endY.y;

    if ($guides.checked) {
      ctx.save();
      ctx.beginPath(); ctx.setLineDash([3, 5]);
      ctx.lineWidth = 0.9; ctx.strokeStyle = "rgba(175,194,211,0.48)";
      ctx.moveTo(endX.x, endX.y); ctx.lineTo(penX, penY);
      ctx.moveTo(endY.x, endY.y); ctx.lineTo(penX, penY);
      ctx.stroke(); ctx.restore();
    }

    // The guide-line intersection is the drawing pen.
    ctx.beginPath(); ctx.arc(penX, penY, 5, 0, TWO_PI);
    ctx.fillStyle = "rgba(255,255,255,0.13)"; ctx.fill();
    ctx.beginPath(); ctx.arc(penX, penY, 2.6, 0, TWO_PI);
    ctx.fillStyle = WHITE; ctx.fill();
  }

  function updatePlayButton() {
    $play.textContent = playing ? "Ⅱ Pause" : "▶ Abspielen";
    $play.setAttribute("aria-pressed", String(playing));
  }

  function updateProgress() {
    $timeline.value = String(progress * 100);
    get("progressValue").textContent = String(Math.round(progress * 100));
  }

  function animate(now) {
    if (lastTime !== null && playing) {
      const elapsed = Math.min(100, now - lastTime);
      progress += elapsed / 22000 * speed;
      if (progress > 1) progress %= 1;
      updateProgress();
    }
    lastTime = now;
    draw();
    window.requestAnimationFrame(animate);
  }

  $n.addEventListener("input", () => {n = Number($n.value); progress = 0; updateProgress(); rebuild();});
  $nSelect.addEventListener("change", () => {
    n = Number($nSelect.value);
    $n.value = String(n);
    progress = 0;
    updateProgress();
    rebuild();
  });
  $speed.addEventListener("input", () => {
    speed = Number($speed.value);
    get("speedValue").textContent = speed.toFixed(2).replace(/0$/, "").replace(".", ",");
  });
  $timeline.addEventListener("input", () => {
    progress = Number($timeline.value) / 100; playing = false;
    updatePlayButton(); updateProgress(); draw();
  });
  $play.addEventListener("click", () => {
    if (!playing && progress >= 1) progress = 0;
    playing = !playing; updatePlayButton();
  });
  $restart.addEventListener("click", () => {
    progress = 0; playing = true; updatePlayButton(); updateProgress(); draw();
  });
  [$source, $circles, $guides].forEach(el => el.addEventListener("change", draw));
  $full.addEventListener("click", () => {
    const el = get("stage");
    if (document.fullscreenElement) document.exitFullscreen();
    else if (el.requestFullscreen) el.requestFullscreen();
  });
  document.addEventListener("fullscreenchange", () => window.setTimeout(resize, 30));
  document.addEventListener("keydown", event => {
    if (event.code === "Space" && !["INPUT", "BUTTON", "SUMMARY"].includes(document.activeElement.tagName)) {
      event.preventDefault(); $play.click();
    }
  });

  if (window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches) playing = false;
  updatePlayButton(); updateProgress(); rebuild();
  window.addEventListener("resize", resize);
  if ("ResizeObserver" in window) new ResizeObserver(resize).observe(canvas);
  resize();
  window.requestAnimationFrame(animate);
})();
