/**
 * 星光追随：滑动时点点星光跟随；停下后漫天散开，再聚成 "Feng1917" 渐隐。
 * 鼠标按下不触发。
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = { IDLE: 0, TRAIL: 1, SCATTER: 2, FORM: 3, HOLD: 4, FADE: 5 };
  var TEXT = "Feng1917";
  var IDLE_MS = 280;
  var MOVE_EPS = 1.8;
  var MAX_TRAIL = 120;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var state = STATE.IDLE;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var stars = [];
  var formTargets = [];
  var hueBase = 200;
  var reducedListener;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }

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
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }

  function resetAll() {
    state = STATE.IDLE;
    stars = [];
    formTargets = [];
  }

  function spawnStar(x, y, boost) {
    var speed = boost || 1;
    stars.push({
      x: x + rand(-2, 2),
      y: y + rand(-2, 2),
      vx: rand(-0.35, 0.35) * speed,
      vy: rand(-0.55, 0.15) * speed,
      r: rand(0.8, 2.6),
      life: 1,
      decay: rand(0.35, 0.7),
      tw: rand(0, Math.PI * 2),
      twSpeed: rand(3, 7),
      hue: (hueBase + rand(-40, 80) + 360) % 360,
      alpha: rand(0.55, 1),
      spark: Math.random() > 0.72,
      tx: 0,
      ty: 0,
      ox: 0,
      oy: 0,
    });
    if (stars.length > MAX_TRAIL * 2) {
      stars.splice(0, stars.length - MAX_TRAIL * 2);
    }
  }

  function emitTrail(x, y, dist) {
    var n = 1 + Math.min(4, Math.floor(dist / 8));
    for (var i = 0; i < n; i++) {
      spawnStar(
        lerp(lastX, x, (i + 1) / (n + 1)),
        lerp(lastY, y, (i + 1) / (n + 1)),
        1
      );
    }
    hueBase = (hueBase + dist * 0.35) % 360;
  }

  function buildTextTargets() {
    var off = document.createElement("canvas");
    var fontSize = Math.min(120, Math.max(42, W * 0.09));
    off.width = Math.min(1200, Math.floor(W * 0.92));
    off.height = Math.floor(fontSize * 1.8);
    var octx = off.getContext("2d");
    octx.clearRect(0, 0, off.width, off.height);
    octx.fillStyle = "#fff";
    octx.font = "700 " + fontSize + "px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(TEXT, off.width / 2, off.height / 2);

    var data = octx.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    var step = Math.max(3, Math.floor(fontSize / 18));
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        var i = (y * off.width + x) * 4;
        if (data[i + 3] > 140) {
          // 轻微采样，字形更密
          if (Math.random() > 0.35 || data[i + 3] > 220) {
            pts.push({
              x: (W - off.width) / 2 + x + rand(-0.8, 0.8),
              y: H * 0.42 - off.height / 2 + y + rand(-0.8, 0.8),
            });
          }
        }
      }
    }
    // 打乱，聚拢更自然
    for (var k = pts.length - 1; k > 0; k--) {
      var j = Math.floor(Math.random() * (k + 1));
      var tmp = pts[k];
      pts[k] = pts[j];
      pts[j] = tmp;
    }
    return pts;
  }

  function enterScatter(now) {
    if (stars.length < 8) {
      // 轨迹太短：补一批再散开
      for (var i = 0; i < 40; i++) {
        spawnStar(mouse.x + rand(-20, 20), mouse.y + rand(-20, 20), 1.4);
      }
    }

    // 爆散成漫天星光
    var extra = 90 + Math.floor(Math.random() * 50);
    for (var e = 0; e < extra; e++) {
      var ang = Math.random() * Math.PI * 2;
      var sp = rand(2, 14);
      stars.push({
        x: mouse.x,
        y: mouse.y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - rand(0, 3),
        r: rand(0.7, 3.2),
        life: 1,
        decay: 0,
        tw: rand(0, Math.PI * 2),
        twSpeed: rand(2.5, 6),
        hue: (hueBase + rand(-60, 100) + 360) % 360,
        alpha: rand(0.5, 1),
        spark: Math.random() > 0.55,
        tx: 0,
        ty: 0,
        ox: 0,
        oy: 0,
      });
    }

    for (var s = 0; s < stars.length; s++) {
      var st = stars[s];
      st.vx += rand(-6, 6);
      st.vy += rand(-8, 4);
      st.life = 1;
      st.decay = 0;
    }

    state = STATE.SCATTER;
    phaseStart = now;
    phaseDur = 1400;
  }

  function assignFormTargets() {
    formTargets = buildTextTargets();
    var need = formTargets.length;
    // 不够就补星，太多就截断到目标数附近
    while (stars.length < need) {
      stars.push({
        x: rand(0, W),
        y: rand(0, H),
        vx: 0,
        vy: 0,
        r: rand(0.9, 2.4),
        life: 1,
        decay: 0,
        tw: rand(0, Math.PI * 2),
        twSpeed: rand(3, 7),
        hue: (200 + rand(-30, 90) + 360) % 360,
        alpha: rand(0.6, 1),
        spark: Math.random() > 0.6,
        tx: 0,
        ty: 0,
        ox: 0,
        oy: 0,
      });
    }
    if (stars.length > need * 1.15) {
      stars.length = Math.ceil(need * 1.15);
    }
    for (var i = 0; i < stars.length; i++) {
      var target = formTargets[i % formTargets.length];
      stars[i].ox = stars[i].x;
      stars[i].oy = stars[i].y;
      stars[i].tx = target.x + rand(-1.2, 1.2);
      stars[i].ty = target.y + rand(-1.2, 1.2);
      stars[i].vx = 0;
      stars[i].vy = 0;
      stars[i].life = 1;
      stars[i].alpha = clamp(stars[i].alpha, 0.65, 1);
    }
  }

  function beginTrail(x, y, now) {
    stars = [];
    lastX = x;
    lastY = y;
    mouse.x = x;
    mouse.y = y;
    lastMove = now;
    state = STATE.TRAIL;
    spawnStar(x, y, 1);
    ensureLoop();
  }

  function onMouseDown() {
    if (state === STATE.TRAIL) resetAll();
  }

  function onMouseMove(e) {
    if (e.buttons !== 0) {
      if (state === STATE.TRAIL) resetAll();
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      return;
    }

    mouse.x = e.clientX;
    mouse.y = e.clientY;
    var now = performance.now();
    var dx = mouse.x - lastX;
    var dy = mouse.y - lastY;
    var dist = Math.sqrt(dx * dx + dy * dy);

    if (state === STATE.IDLE || (state === STATE.FADE && stars.length < 3)) {
      beginTrail(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.SCATTER || state === STATE.FORM || state === STATE.HOLD || state === STATE.FADE) {
      // 演出中不打断；结束后再跟
      return;
    }

    if (state === STATE.TRAIL) {
      if (dist >= MOVE_EPS) {
        emitTrail(mouse.x, mouse.y, dist);
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
      }
    }
  }

  function drawStar(s, globalAlpha) {
    var twinkle = 0.55 + 0.45 * Math.sin(s.tw);
    var a = s.alpha * s.life * twinkle * (globalAlpha == null ? 1 : globalAlpha);
    if (a < 0.02) return;
    var r = s.r * (0.75 + twinkle * 0.5);

    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(s.x, s.y);

    // 光晕
    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, r * 4);
    g.addColorStop(0, "hsla(" + s.hue + ", 90%, 85%, 0.85)");
    g.addColorStop(0.35, "hsla(" + s.hue + ", 80%, 70%, 0.35)");
    g.addColorStop(1, "hsla(" + s.hue + ", 80%, 60%, 0)");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, r * 4, 0, Math.PI * 2);
    ctx.fill();

    // 芯
    ctx.fillStyle = "hsla(" + s.hue + ", 100%, 92%, 0.95)";
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    if (s.spark) {
      ctx.strokeStyle = "hsla(" + s.hue + ", 100%, 95%, 0.8)";
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -r * 3.2);
      ctx.lineTo(0, r * 3.2);
      ctx.moveTo(-r * 3.2, 0);
      ctx.lineTo(r * 3.2, 0);
      ctx.stroke();
    }

    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.033, (now - (loop._last || now)) / 1000);
    loop._last = now;
    t += dt;

    ctx.clearRect(0, 0, W, H);

    var i, s;

    if (state === STATE.TRAIL) {
      for (i = stars.length - 1; i >= 0; i--) {
        s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.vx *= 0.96;
        s.vy = s.vy * 0.96 - 0.012;
        s.tw += dt * s.twSpeed;
        s.life -= dt * s.decay;
        if (s.life <= 0) stars.splice(i, 1);
        else drawStar(s);
      }
      if (now - lastMove > IDLE_MS) {
        enterScatter(now);
      }
      if (!stars.length && state === STATE.TRAIL) resetAll();
    } else if (state === STATE.SCATTER) {
      var sp = Math.min(1, (now - phaseStart) / phaseDur);
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        s.vx *= 0.985;
        s.vy *= 0.985;
        s.vy += 0.015;
        s.x += s.vx;
        s.y += s.vy;
        // 慢慢铺满视野：额外漂移
        s.x += Math.sin(t * 0.7 + i) * 0.15;
        s.y += Math.cos(t * 0.5 + i * 0.3) * 0.12;
        s.tw += dt * s.twSpeed;
        // 散开阶段保持明亮
        s.life = 1;
        drawStar(s, 0.75 + (1 - sp) * 0.25);
      }
      if (sp >= 1) {
        assignFormTargets();
        state = STATE.FORM;
        phaseStart = now;
        phaseDur = 1800;
      }
    } else if (state === STATE.FORM) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      var ease = easeInOut(easeOut(fp));
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        s.x = lerp(s.ox, s.tx, ease);
        s.y = lerp(s.oy, s.ty, ease);
        s.tw += dt * s.twSpeed;
        s.r = lerp(s.r, clamp(s.r, 1, 2.2), 0.05);
        drawStar(s, 0.7 + ease * 0.3);
      }
      if (fp >= 1) {
        state = STATE.HOLD;
        phaseStart = now;
        phaseDur = 900;
      }
    } else if (state === STATE.HOLD) {
      var hp = Math.min(1, (now - phaseStart) / phaseDur);
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        // 字形上微微呼吸
        s.x = s.tx + Math.sin(t * 2 + i * 0.2) * 0.35;
        s.y = s.ty + Math.cos(t * 1.7 + i * 0.15) * 0.35;
        s.tw += dt * s.twSpeed;
        drawStar(s, 1);
      }
      if (hp >= 1) {
        state = STATE.FADE;
        phaseStart = now;
        phaseDur = 1200;
      }
    } else if (state === STATE.FADE) {
      var fade = Math.min(1, (now - phaseStart) / phaseDur);
      var ga = 1 - easeOut(fade);
      for (i = 0; i < stars.length; i++) {
        s = stars[i];
        s.x = s.tx + Math.sin(t * 2 + i) * 0.5;
        s.y = s.ty - fade * 12 + Math.cos(t + i) * 0.4;
        s.tw += dt * s.twSpeed;
        drawStar(s, ga);
      }
      if (fade >= 1) resetAll();
    }

    if (state === STATE.IDLE) {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function onVisibility() {
    if (document.hidden) {
      running = false;
      cancelAnimationFrame(raf);
    } else if (state !== STATE.IDLE) {
      ensureLoop();
    }
  }

  function destroy() {
    running = false;
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMouseMove);
    window.removeEventListener("mousedown", onMouseDown);
    document.removeEventListener("visibilitychange", onVisibility);
    if (reducedListener) prefersReduced.removeEventListener("change", reducedListener);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  function init() {
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
    reducedListener = function (ev) { if (ev.matches) destroy(); };
    prefersReduced.addEventListener("change", reducedListener);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
