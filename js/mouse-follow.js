/**
 * 鼠标跟随：渐变铭文；左键点击断环涟漪 + 「功德 +1」
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
  var lastSpawnX = 0;
  var lastSpawnY = 0;
  var charIndex = 0;

  var glyphs = [];
  var clickFx = [];

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

  function spawnGlyph(x, y) {
    var offset = (Math.random() - 0.5) * 10;
    glyphs.push({
      x: x + offset,
      y: y + offset,
      char: nextChar(),
      born: performance.now(),
      life: 2200 + Math.random() * 900,
      hue: Math.random() * 360,
      sat: 52 + Math.random() * 38,
      light: 38 + Math.random() * 28,
      drift: (Math.random() - 0.5) * 0.35,
      fontPx: 10 + Math.random() * 20,
      sizeWobble: 0.85 + Math.random() * 0.35,
    });
    if (glyphs.length > MAX_GLYPHS) glyphs.shift();
  }

  function onMouseMove(e) {
    var x = e.clientX;
    var y = e.clientY;
    var dx = x - lastSpawnX;
    var dy = y - lastSpawnY;
    if (dx * dx + dy * dy >= SPAWN_DIST * SPAWN_DIST) {
      spawnGlyph(x, y);
      lastSpawnX = x;
      lastSpawnY = y;
    }
    ensureLoop();
  }

  function buildIrregularStrokes() {
    var strokes = [];
    var n = 3 + ((Math.random() * 3) | 0);
    var cursor = Math.random() * Math.PI * 2;
    var i, k, steps, span, pts;
    for (i = 0; i < n; i++) {
      span = (Math.PI * 2 / n) * (0.22 + Math.random() * 0.42);
      steps = 4 + ((Math.random() * 5) | 0);
      pts = [];
      for (k = 0; k <= steps; k++) {
        pts.push({
          t: k / steps,
          radial: (Math.random() - 0.5) * 16,
          twist: (Math.random() - 0.5) * 0.14,
        });
      }
      strokes.push({ start: cursor, span: span, pts: pts });
      cursor += span + 0.25 + Math.random() * 0.65;
    }
    return strokes;
  }

  function spawnClickFx(x, y) {
    clickFx.push({
      x: x,
      y: y,
      born: performance.now(),
      strokes: buildIrregularStrokes(),
      floater: { y: 0, opacity: 1 },
    });
  }

  function onMouseDown(e) {
    if (e.button !== 0) return;
    var t = e.target;
    if (t && t.closest && t.closest("#follow-toggle")) return;
    spawnClickFx(e.clientX, e.clientY);
    ensureLoop();
  }

  function drawClickFxItem(f, now) {
    var t = now - f.born;
    if (t > 1400) return false;

    f.floater.y -= 0.55;
    f.floater.opacity = Math.max(0, 1 - t / 900);

    var x = f.x;
    var y = f.y;
    var rp = Math.min(1, t / 700);
    var radius = 16 + rp * 58;
    var alpha = 0.42 * (1 - rp);
    var scale = radius / 42;
    var stroke, j, pt, ang, r, px, py, idx;
    ctx.strokeStyle = "rgba(180, 120, 60, " + alpha + ")";
    ctx.lineWidth = 0.65;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    for (j = 0; j < f.strokes.length; j++) {
      stroke = f.strokes[j];
      ctx.beginPath();
      for (idx = 0; idx < stroke.pts.length; idx++) {
        pt = stroke.pts[idx];
        ang = stroke.start + stroke.span * pt.t + pt.twist;
        r = radius + pt.radial * scale;
        px = x + Math.cos(ang) * r;
        py = y + Math.sin(ang) * r;
        if (idx === 0) ctx.moveTo(px, py);
        else ctx.lineTo(px, py);
      }
      ctx.stroke();
    }

    ctx.save();
    ctx.translate(x, y - 36 + f.floater.y);
    ctx.font = "12px 'Noto Serif SC','Source Han Serif SC',serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(92, 83, 71, " + (f.floater.opacity * 0.85) + ")";
    ctx.fillText("功德 +1", 0, 0);
    ctx.restore();

    return true;
  }

  function drawClickFx(now) {
    for (var i = clickFx.length - 1; i >= 0; i--) {
      if (!drawClickFxItem(clickFx[i], now)) clickFx.splice(i, 1);
    }
  }

  function drawGlyphs(now) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    var fontFamily = "'Noto Serif SC','Source Han Serif SC','Songti SC',Georgia,serif";

    for (var i = glyphs.length - 1; i >= 0; i--) {
      var g = glyphs[i];
      var p = (now - g.born) / g.life;
      if (p >= 1) {
        glyphs.splice(i, 1);
        continue;
      }

      var pulse = 0.45 + Math.sin(now * 0.004 + g.x * 0.01) * 0.22;
      var alpha = (1 - p) * pulse * 0.72;
      var lifeScale = p < 0.12 ? 0.55 + (p / 0.12) * 0.45 : 1 - (p - 0.12) * 0.28;
      var fontSize = g.fontPx * g.sizeWobble * lifeScale * (0.92 + pulse * 0.14);

      g.x += g.drift;
      g.y -= 0.12;

      var pad = fontSize * 0.85;
      var grd = ctx.createLinearGradient(g.x - pad, g.y - pad, g.x + pad, g.y + pad);
      var h2 = (g.hue + 24) % 360;
      var h3 = (g.hue + 48) % 360;
      grd.addColorStop(0, "hsla(" + g.hue + ", " + g.sat + "%, " + g.light + "%, " + alpha + ")");
      grd.addColorStop(0.5, "hsla(" + h2 + ", " + Math.min(100, g.sat + 12) + "%, " + Math.min(72, g.light + 14) + "%, " + (alpha * 0.95) + ")");
      grd.addColorStop(1, "hsla(" + h3 + ", " + g.sat + "%, " + Math.max(28, g.light - 8) + "%, " + (alpha * 0.35) + ")");

      ctx.save();
      ctx.font = "600 " + fontSize.toFixed(2) + "px " + fontFamily;
      ctx.fillStyle = grd;
      ctx.shadowColor = "hsla(" + g.hue + ", " + g.sat + "%, " + g.light + "%, " + (alpha * 0.35) + ")";
      ctx.shadowBlur = Math.min(12, fontSize * 0.45);
      ctx.fillText(g.char, g.x, g.y);
      ctx.restore();
    }
  }

  function loop(now) {
    if (!active || !ctx) {
      running = false;
      return;
    }

    ctx.clearRect(0, 0, W, H);
    drawGlyphs(now);
    drawClickFx(now);

    if (glyphs.length || clickFx.length) {
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
    } else if (active && (glyphs.length || clickFx.length)) {
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
    glyphs = [];
    clickFx = [];
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
    lastSpawnX = 0;
    lastSpawnY = 0;
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
