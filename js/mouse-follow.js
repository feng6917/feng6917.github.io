/**
 * 鼠标跟随：渐变铭文拖尾 + 点击敲木鱼
 * 开关：右上角「开启跟随 / 关闭跟随」，localStorage 记忆（默认关闭）
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STORAGE_KEY = "feng6917-follow";

  function purgeLegacyFireworksStorage() {
    try {
      localStorage.removeItem("feng6917-fireworks");
    } catch (e) { /* ignore */ }
  }

  var INSCRIPTION =
    "观自在菩萨行深般若波罗蜜多时照见五蕴皆空度一切苦厄舍利子色不异空空不异色色即是空空即是色" +
    "受想行识亦复如是是诸法空相不生不灭不垢不净不增不减";

  var canvas, ctx, raf = 0, running = false, active = false;
  var toggleBtn = null;
  var reducedListener;
  var W = 0, H = 0;
  var mouse = { x: -9999, y: -9999 };
  var lastSpawnX = 0;
  var lastSpawnY = 0;
  var charIndex = 0;
  var frame = 0;

  var trailPoints = [];
  var glyphs = [];
  var fishes = [];

  var MAX_TRAIL = 48;
  var SPAWN_DIST = 22;
  var MAX_GLYPHS = 36;

  function isEnabled() {
    try {
      return localStorage.getItem(STORAGE_KEY) === "1";
    } catch (e) {
      return false;
    }
  }

  function setEnabled(on) {
    try {
      localStorage.setItem(STORAGE_KEY, on ? "1" : "0");
    } catch (e) { /* ignore */ }
  }

  function updateToggleLabel() {
    if (!toggleBtn) return;
    toggleBtn.setAttribute("aria-pressed", active ? "true" : "false");
    toggleBtn.title = active ? "关闭跟随效果" : "开启跟随效果";
    toggleBtn.setAttribute("aria-label", active ? "关闭跟随效果" : "开启跟随效果");
    toggleBtn.textContent = active ? "关闭跟随" : "开启跟随";
  }

  function resize() {
    W = window.innerWidth;
    H = window.innerHeight;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.floor(W * dpr);
    canvas.height = Math.floor(H * dpr);
    canvas.style.width = W + "px";
    canvas.style.height = H + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function ensureLoop() {
    if (!running && active) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }

  function nextChar() {
    var ch = INSCRIPTION.charAt(charIndex % INSCRIPTION.length);
    charIndex++;
    return ch;
  }

  function pushTrailPoint(x, y) {
    var now = performance.now();
    trailPoints.push({ x: x, y: y, t: now });
    if (trailPoints.length > MAX_TRAIL) trailPoints.shift();
  }

  function spawnGlyph(x, y) {
    var offset = (Math.random() - 0.5) * 10;
    glyphs.push({
      x: x + offset,
      y: y + offset,
      char: nextChar(),
      born: performance.now(),
      life: 2200 + Math.random() * 900,
      hue: 28 + Math.random() * 42,
      drift: (Math.random() - 0.5) * 0.35,
    });
    if (glyphs.length > MAX_GLYPHS) glyphs.shift();
  }

  function spawnFish(x, y) {
    fishes.push({
      x: x,
      y: y,
      born: performance.now(),
      knock: 0,
      ripples: [
        { born: performance.now(), delay: 0 },
        { born: performance.now(), delay: 90 },
        { born: performance.now(), delay: 180 },
      ],
      floater: { y: 0, opacity: 1 },
    });
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    pushTrailPoint(mouse.x, mouse.y);

    var dx = mouse.x - lastSpawnX;
    var dy = mouse.y - lastSpawnY;
    if (dx * dx + dy * dy >= SPAWN_DIST * SPAWN_DIST) {
      spawnGlyph(mouse.x, mouse.y);
      lastSpawnX = mouse.x;
      lastSpawnY = mouse.y;
    }
    ensureLoop();
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    spawnFish(e.clientX, e.clientY);
    ensureLoop();
  }

  function drawTrail(now) {
    if (trailPoints.length < 2) return;

    for (var i = 1; i < trailPoints.length; i++) {
      var a = trailPoints[i - 1];
      var b = trailPoints[i];
      var age = now - b.t;
      var fade = Math.max(0, 1 - age / 520);
      if (fade <= 0.02) continue;

      var grd = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
      grd.addColorStop(0, "hsla(32, 55%, 58%, " + (fade * 0.08) + ")");
      grd.addColorStop(0.5, "hsla(18, 70%, 52%, " + (fade * 0.28) + ")");
      grd.addColorStop(1, "hsla(8, 65%, 48%, " + (fade * 0.45) + ")");

      ctx.strokeStyle = grd;
      ctx.lineWidth = 2 + fade * 2.5;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(a.x, a.y);
      ctx.lineTo(b.x, b.y);
      ctx.stroke();
    }

    while (trailPoints.length && now - trailPoints[0].t > 600) {
      trailPoints.shift();
    }
  }

  function drawGlyphs(now) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var font = "600 15px 'Noto Serif SC','Source Han Serif SC','Songti SC',Georgia,serif";
    ctx.font = font;

    for (var i = glyphs.length - 1; i >= 0; i--) {
      var g = glyphs[i];
      var p = (now - g.born) / g.life;
      if (p >= 1) {
        glyphs.splice(i, 1);
        continue;
      }

      var pulse = 0.45 + Math.sin(now * 0.004 + g.x * 0.01) * 0.22;
      var alpha = (1 - p) * pulse * 0.72;
      var scale = 0.85 + (1 - p) * 0.35;

      g.x += g.drift;
      g.y -= 0.12;

      var grd = ctx.createLinearGradient(g.x - 12, g.y - 12, g.x + 12, g.y + 12);
      grd.addColorStop(0, "hsla(" + g.hue + ", 62%, 42%, " + alpha + ")");
      grd.addColorStop(0.5, "hsla(" + (g.hue + 18) + ", 78%, 55%, " + (alpha * 0.95) + ")");
      grd.addColorStop(1, "hsla(" + (g.hue + 36) + ", 55%, 38%, " + (alpha * 0.35) + ")");

      ctx.save();
      ctx.translate(g.x, g.y);
      ctx.scale(scale, scale);
      ctx.fillStyle = grd;
      ctx.shadowColor = "hsla(" + g.hue + ", 70%, 50%, " + (alpha * 0.35) + ")";
      ctx.shadowBlur = 8;
      ctx.fillText(g.char, 0, 0);
      ctx.restore();
    }
  }

  function drawWoodFish(f, now) {
    var t = now - f.born;
    if (t > 1400) return false;

    if (t < 120) {
      f.knock = Math.sin((t / 120) * Math.PI) * 0.22;
    } else {
      f.knock *= 0.92;
    }

    f.floater.y -= 0.55;
    f.floater.opacity = Math.max(0, 1 - t / 900);

    var x = f.x;
    var y = f.y;
    var squash = 1 - f.knock * 0.35;
    var stretch = 1 + f.knock * 0.15;

    ctx.save();
    ctx.translate(x, y);
    ctx.scale(stretch, squash);

    ctx.fillStyle = "#8b5a2b";
    ctx.strokeStyle = "#5c3d1e";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.ellipse(0, 0, 38, 26, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = "#a0713f";
    ctx.beginPath();
    ctx.ellipse(-8, -4, 22, 14, -0.15, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "#4a3018";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.moveTo(-32, 2);
    ctx.lineTo(32, 2);
    ctx.stroke();

    ctx.fillStyle = "#3d2814";
    ctx.beginPath();
    ctx.arc(28, -6, 4, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = "rgba(74,48,24,0.5)";
    ctx.lineWidth = 1;
    for (var s = -20; s <= 20; s += 10) {
      ctx.beginPath();
      ctx.moveTo(s, -14);
      ctx.lineTo(s + 4, 14);
      ctx.stroke();
    }

    ctx.restore();

    for (var r = 0; r < f.ripples.length; r++) {
      var rip = f.ripples[r];
      var rt = t - rip.delay;
      if (rt < 0 || rt > 700) continue;
      var rp = rt / 700;
      var radius = 20 + rp * 56;
      ctx.strokeStyle = "rgba(180, 120, 60, " + (0.45 * (1 - rp)) + ")";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y + 8, radius, 0, Math.PI * 2);
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(x, y - 48 + f.floater.y);
    ctx.font = "700 18px 'Noto Serif SC','Source Han Serif SC',serif";
    ctx.fillStyle = "rgba(120, 72, 36, " + f.floater.opacity + ")";
    ctx.textAlign = "center";
    ctx.fillText("咚", 0, 0);
    ctx.font = "12px 'Noto Serif SC',serif";
    ctx.fillStyle = "rgba(92, 83, 71, " + (f.floater.opacity * 0.85) + ")";
    ctx.fillText("功德 +1", 0, 18);
    ctx.restore();

    return true;
  }

  function drawFishes(now) {
    for (var i = fishes.length - 1; i >= 0; i--) {
      if (!drawWoodFish(fishes[i], now)) fishes.splice(i, 1);
    }
  }

  function hasWork(now) {
    if (fishes.length) return true;
    if (glyphs.length) return true;
    if (trailPoints.length >= 2) {
      var last = trailPoints[trailPoints.length - 1];
      if (now - last.t < 400) return true;
    }
    return false;
  }

  function loop(now) {
    if (!active || !ctx) {
      running = false;
      return;
    }

    frame++;
    ctx.clearRect(0, 0, W, H);

    drawTrail(now);
    drawGlyphs(now);
    drawFishes(now);

    if (hasWork(now)) {
      raf = requestAnimationFrame(loop);
    } else {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (active && hasWork(performance.now())) {
      ensureLoop();
    }
  }

  function destroy() {
    running = false;
    active = false;
    cancelAnimationFrame(raf);
    raf = 0;
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("visibilitychange", onVisibility);
    if (reducedListener) {
      prefersReduced.removeEventListener("change", reducedListener);
      reducedListener = null;
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    trailPoints = [];
    glyphs = [];
    fishes = [];
    updateToggleLabel();
  }

  function init() {
    if (active) return;
    canvas = document.createElement("canvas");
    canvas.setAttribute("aria-hidden", "true");
    canvas.style.cssText =
      "position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:99999;";
    document.body.appendChild(canvas);
    ctx = canvas.getContext("2d");
    resize();
    window.addEventListener("resize", resize);
    window.addEventListener("mousemove", onMouseMove, { passive: true });
    window.addEventListener("mousedown", onMouseDown, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedListener = function (ev) {
      if (ev.matches) {
        destroy();
        if (toggleBtn && toggleBtn.parentNode) toggleBtn.parentNode.removeChild(toggleBtn);
        toggleBtn = null;
      }
    };
    prefersReduced.addEventListener("change", reducedListener);
    active = true;
    lastSpawnX = mouse.x;
    lastSpawnY = mouse.y;
    updateToggleLabel();
  }

  function createToggle() {
    if (toggleBtn) return;
    toggleBtn = document.createElement("button");
    toggleBtn.type = "button";
    toggleBtn.id = "follow-toggle";
    toggleBtn.style.cssText = [
      "position:fixed",
      "top:12px",
      "right:12px",
      "z-index:100000",
      "margin:0",
      "padding:6px 12px",
      "border:1px solid rgba(58,52,44,0.18)",
      "border-radius:8px",
      "background:rgba(253,252,250,0.88)",
      "color:#3a342c",
      "font:12px/1.3 'Noto Serif SC','Source Han Serif SC','Songti SC',Georgia,serif",
      "letter-spacing:0.02em",
      "cursor:pointer",
      "box-shadow:0 2px 10px rgba(58,52,44,0.08)",
      "backdrop-filter:blur(6px)",
      "-webkit-backdrop-filter:blur(6px)",
      "user-select:none",
      "transition:background .15s ease, border-color .15s ease, opacity .15s ease"
    ].join(";");
    toggleBtn.addEventListener("mouseenter", function () {
      toggleBtn.style.background = "rgba(253,252,250,0.98)";
      toggleBtn.style.borderColor = "rgba(58,52,44,0.28)";
    });
    toggleBtn.addEventListener("mouseleave", function () {
      toggleBtn.style.background = "rgba(253,252,250,0.88)";
      toggleBtn.style.borderColor = "rgba(58,52,44,0.18)";
    });
    toggleBtn.addEventListener("click", function () {
      if (active) {
        setEnabled(false);
        destroy();
      } else {
        setEnabled(true);
        init();
      }
    });
    document.body.appendChild(toggleBtn);
    updateToggleLabel();
  }

  function boot() {
    purgeLegacyFireworksStorage();
    createToggle();
    if (isEnabled()) init();
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
