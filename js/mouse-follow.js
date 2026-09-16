/**
 * 鼠标跟随：渐变铭文
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
      hue: 28 + Math.random() * 42,
      drift: (Math.random() - 0.5) * 0.35,
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

  function drawGlyphs(now) {
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = "600 15px 'Noto Serif SC','Source Han Serif SC','Songti SC',Georgia,serif";

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

  function loop(now) {
    if (!active || !ctx) {
      running = false;
      return;
    }

    ctx.clearRect(0, 0, W, H);
    drawGlyphs(now);

    if (glyphs.length) {
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
    } else if (active && glyphs.length) {
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
    document.removeEventListener("visibilitychange", onVisibility);
    if (reducedListener) {
      prefersReduced.removeEventListener("change", reducedListener);
      reducedListener = null;
    }
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
    canvas = null;
    ctx = null;
    glyphs = [];
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
