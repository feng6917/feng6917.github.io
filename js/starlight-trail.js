/**
 * 烟花追随
 * - 滑动时显示烟花粒子；按下不触发
 * - <2s 停下：烟花自然消散，不聚字
 * - ≥2s 停下：屏幕中央砰放一朵大烟花，散开后余烬聚成「Big 胆」，再渐隐
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = { IDLE: 0, TRAIL: 1, BOOM: 2, FORM: 3, HOLD: 4, FADE: 5, DIE: 6 };
  var TEXT = "Big 胆";
  var IDLE_MS = 300;
  var MIN_FORM_MS = 2000;
  var MOVE_EPS = 2;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var state = STATE.IDLE;
  var moveStart = 0;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var particles = [];
  var sparks = [];
  var formTargets = [];
  var boomCenter = { x: 0, y: 0 };
  var flash = 0;
  var reducedListener;

  var PALETTE = [
    [255, 80, 120],
    [255, 180, 60],
    [120, 220, 255],
    [180, 120, 255],
    [100, 255, 180],
    [255, 240, 120],
    [255, 120, 200],
  ];

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }

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
    particles = [];
    sparks = [];
    formTargets = [];
    flash = 0;
  }

  function rgb(c, a) {
    return "rgba(" + c[0] + "," + c[1] + "," + c[2] + "," + a + ")";
  }

  function emitTrailFirework(x, y, dist) {
    var color = pick(PALETTE);
    var n = 2 + Math.min(5, (dist / 6) | 0);
    for (var i = 0; i < n; i++) {
      var ang = rand(0, Math.PI * 2);
      var sp = rand(0.4, 2.8);
      particles.push({
        x: x + rand(-3, 3),
        y: y + rand(-3, 3),
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - rand(0.5, 2),
        life: 1,
        decay: rand(1.1, 2.2),
        r: rand(1.2, 2.8),
        color: color,
        trail: true,
        gravity: 0.04,
        ox: 0, oy: 0, tx: 0, ty: 0,
      });
    }
    // 偶发小爆
    if (Math.random() > 0.82) {
      miniBurst(x, y, pick(PALETTE), 10 + (Math.random() * 8) | 0, 2.5);
    }
    if (particles.length > 280) particles.splice(0, particles.length - 280);
  }

  function miniBurst(x, y, color, count, power) {
    for (var i = 0; i < count; i++) {
      var ang = (i / count) * Math.PI * 2 + rand(-0.1, 0.1);
      var sp = rand(power * 0.4, power);
      particles.push({
        x: x,
        y: y,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        life: 1,
        decay: rand(0.9, 1.6),
        r: rand(1, 2.4),
        color: color,
        trail: false,
        gravity: 0.05,
        ox: 0, oy: 0, tx: 0, ty: 0,
      });
    }
  }

  function bigBoom(cx, cy) {
    boomCenter.x = cx;
    boomCenter.y = cy;
    flash = 1;
    particles = [];
    sparks = [];

    var rings = [
      { n: 48, power: 7, color: pick(PALETTE) },
      { n: 36, power: 10, color: pick(PALETTE) },
      { n: 28, power: 13, color: pick(PALETTE) },
      { n: 40, power: 5.5, color: pick(PALETTE) },
    ];

    for (var r = 0; r < rings.length; r++) {
      var ring = rings[r];
      for (var i = 0; i < ring.n; i++) {
        var ang = (i / ring.n) * Math.PI * 2 + rand(-0.05, 0.05);
        var sp = ring.power * rand(0.75, 1.15);
        particles.push({
          x: cx,
          y: cy,
          vx: Math.cos(ang) * sp,
          vy: Math.sin(ang) * sp,
          life: 1,
          decay: rand(0.35, 0.55),
          r: rand(1.6, 3.4),
          color: ring.color,
          trail: false,
          gravity: 0.035,
          sparkle: Math.random() > 0.4,
          ox: 0, oy: 0, tx: 0, ty: 0,
        });
      }
    }

    // 二次碎屑
    for (var j = 0; j < 60; j++) {
      var a2 = rand(0, Math.PI * 2);
      var s2 = rand(2, 11);
      particles.push({
        x: cx,
        y: cy,
        vx: Math.cos(a2) * s2,
        vy: Math.sin(a2) * s2 - rand(0, 2),
        life: 1,
        decay: rand(0.4, 0.7),
        r: rand(0.8, 2.2),
        color: pick(PALETTE),
        trail: false,
        gravity: 0.045,
        sparkle: true,
        ox: 0, oy: 0, tx: 0, ty: 0,
      });
    }

    // 闪光碎星
    for (var k = 0; k < 30; k++) {
      sparks.push({
        x: cx,
        y: cy,
        vx: rand(-3, 3),
        vy: rand(-3, 3),
        life: 1,
        r: rand(1, 3),
      });
    }
  }

  function buildTextTargets() {
    var off = document.createElement("canvas");
    var fontSize = Math.min(130, Math.max(48, W * 0.11));
    off.width = Math.min(1100, Math.floor(W * 0.9));
    off.height = Math.floor(fontSize * 1.9);
    var octx = off.getContext("2d");
    octx.clearRect(0, 0, off.width, off.height);
    octx.fillStyle = "#fff";
    octx.font = "800 " + fontSize + "px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(TEXT, off.width / 2, off.height / 2);

    var data = octx.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    var step = Math.max(3, Math.floor(fontSize / 16));
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        var idx = (y * off.width + x) * 4;
        if (data[idx + 3] > 130) {
          if (Math.random() > 0.3 || data[idx + 3] > 210) {
            pts.push({
              x: (W - off.width) / 2 + x + rand(-0.6, 0.6),
              y: H * 0.42 - off.height / 2 + y + rand(-0.6, 0.6),
            });
          }
        }
      }
    }
    for (var k = pts.length - 1; k > 0; k--) {
      var j = (Math.random() * (k + 1)) | 0;
      var tmp = pts[k];
      pts[k] = pts[j];
      pts[j] = tmp;
    }
    return pts;
  }

  function assignFormTargets() {
    formTargets = buildTextTargets();
    var need = Math.max(formTargets.length, 80);
    // 保留仍较亮的粒子作为「余烬」
    particles = particles.filter(function (p) { return p.life > 0.15; });
    while (particles.length < need) {
      var ang = rand(0, Math.PI * 2);
      var rad = rand(20, Math.min(W, H) * 0.35);
      particles.push({
        x: boomCenter.x + Math.cos(ang) * rad,
        y: boomCenter.y + Math.sin(ang) * rad,
        vx: 0,
        vy: 0,
        life: 1,
        decay: 0,
        r: rand(1.4, 2.8),
        color: pick(PALETTE),
        trail: false,
        gravity: 0,
        sparkle: Math.random() > 0.5,
        ox: 0, oy: 0, tx: 0, ty: 0,
      });
    }
    if (particles.length > need * 1.2) {
      particles.length = Math.ceil(need * 1.2);
    }
    for (var i = 0; i < particles.length; i++) {
      var p = particles[i];
      var target = formTargets[i % formTargets.length];
      p.ox = p.x;
      p.oy = p.y;
      p.tx = target.x + rand(-1, 1);
      p.ty = target.y + rand(-1, 1);
      p.vx = 0;
      p.vy = 0;
      p.life = 1;
      p.decay = 0;
      p.gravity = 0;
    }
  }

  function beginTrail(x, y, now) {
    particles = [];
    sparks = [];
    lastX = x;
    lastY = y;
    mouse.x = x;
    mouse.y = y;
    moveStart = now;
    lastMove = now;
    state = STATE.TRAIL;
    emitTrailFirework(x, y, 4);
    ensureLoop();
  }

  function onStop(now) {
    var dur = Math.max(0, lastMove - moveStart);
    if (dur < MIN_FORM_MS) {
      // 不足 2 秒：不聚字，粒子自行燃尽
      state = STATE.DIE;
      phaseStart = now;
      phaseDur = 900;
      for (var i = 0; i < particles.length; i++) {
        particles[i].decay = rand(1.2, 2.4);
        particles[i].vy -= rand(0.2, 1);
      }
      return;
    }
    // ≥2s：中央大烟花
    bigBoom(W * 0.5, H * 0.42);
    state = STATE.BOOM;
    phaseStart = now;
    phaseDur = 1600;
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

    if (state === STATE.IDLE || (state === STATE.DIE && particles.length < 2)) {
      beginTrail(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.BOOM || state === STATE.FORM || state === STATE.HOLD || state === STATE.FADE) {
      return;
    }

    if (state === STATE.TRAIL) {
      if (dist >= MOVE_EPS) {
        emitTrailFirework(mouse.x, mouse.y, dist);
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
      }
    }
  }

  function drawParticle(p, ga) {
    var a = p.life * (ga == null ? 1 : ga);
    if (a < 0.03) return;
    ctx.save();
    ctx.globalAlpha = a;
    ctx.translate(p.x, p.y);

    var g = ctx.createRadialGradient(0, 0, 0, 0, 0, p.r * 3.5);
    g.addColorStop(0, rgb([255, 255, 255], 0.95));
    g.addColorStop(0.25, rgb(p.color, 0.85));
    g.addColorStop(1, rgb(p.color, 0));
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 3.5, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = rgb([255, 255, 245], 0.9);
    ctx.beginPath();
    ctx.arc(0, 0, p.r * 0.55, 0, Math.PI * 2);
    ctx.fill();

    if (p.sparkle) {
      ctx.strokeStyle = rgb(p.color, 0.7);
      ctx.lineWidth = 0.8;
      ctx.beginPath();
      ctx.moveTo(0, -p.r * 2.8);
      ctx.lineTo(0, p.r * 2.8);
      ctx.moveTo(-p.r * 2.8, 0);
      ctx.lineTo(p.r * 2.8, 0);
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

    // 爆炸闪光
    if (flash > 0.01) {
      ctx.fillStyle = "rgba(255, 245, 220, " + (flash * 0.28) + ")";
      ctx.fillRect(0, 0, W, H);
      flash *= 0.9;
    }

    var i, p;

    if (state === STATE.TRAIL) {
      for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        p.vy += p.gravity;
        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.98;
        p.life -= dt * p.decay;
        if (p.life <= 0) particles.splice(i, 1);
        else drawParticle(p);
      }
      if (now - lastMove > IDLE_MS) onStop(now);
      if (!particles.length && state === STATE.TRAIL) resetAll();
    } else if (state === STATE.DIE) {
      for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        p.vy += p.gravity || 0.05;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * (p.decay || 1.5);
        if (p.life <= 0) particles.splice(i, 1);
        else drawParticle(p);
      }
      if (!particles.length) resetAll();
    } else if (state === STATE.BOOM) {
      var bp = Math.min(1, (now - phaseStart) / phaseDur);
      for (i = particles.length - 1; i >= 0; i--) {
        p = particles[i];
        p.vy += p.gravity;
        p.vx *= 0.99;
        p.vy *= 0.99;
        p.x += p.vx;
        p.y += p.vy;
        p.life -= dt * p.decay;
        if (p.life <= 0.08) {
          // 保留余烬进聚字，不要删光
          p.life = 0.2;
          p.decay = 0;
          p.vx *= 0.3;
          p.vy *= 0.3;
        }
        drawParticle(p, 0.85 + (1 - bp) * 0.15);
      }
      for (i = sparks.length - 1; i >= 0; i--) {
        var sk = sparks[i];
        sk.x += sk.vx;
        sk.y += sk.vy;
        sk.life -= dt * 1.8;
        if (sk.life <= 0) sparks.splice(i, 1);
        else {
          ctx.globalAlpha = sk.life;
          ctx.fillStyle = "#fff8e8";
          ctx.beginPath();
          ctx.arc(sk.x, sk.y, sk.r * sk.life, 0, Math.PI * 2);
          ctx.fill();
          ctx.globalAlpha = 1;
        }
      }
      if (bp >= 1) {
        assignFormTargets();
        state = STATE.FORM;
        phaseStart = now;
        phaseDur = 1600;
      }
    } else if (state === STATE.FORM) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      var ease = easeInOut(easeOut(fp));
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x = lerp(p.ox, p.tx, ease);
        p.y = lerp(p.oy, p.ty, ease);
        p.life = 1;
        drawParticle(p, 0.75 + ease * 0.25);
      }
      if (fp >= 1) {
        state = STATE.HOLD;
        phaseStart = now;
        phaseDur = 1000;
      }
    } else if (state === STATE.HOLD) {
      var hp = Math.min(1, (now - phaseStart) / phaseDur);
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x = p.tx + Math.sin(t * 2.2 + i * 0.2) * 0.4;
        p.y = p.ty + Math.cos(t * 1.8 + i * 0.15) * 0.4;
        drawParticle(p, 1);
      }
      if (hp >= 1) {
        state = STATE.FADE;
        phaseStart = now;
        phaseDur = 1300;
      }
    } else if (state === STATE.FADE) {
      var fade = Math.min(1, (now - phaseStart) / phaseDur);
      var ga = 1 - easeOut(fade);
      for (i = 0; i < particles.length; i++) {
        p = particles[i];
        p.x = p.tx + Math.sin(t * 2 + i) * 0.6;
        p.y = p.ty - fade * 16 + Math.cos(t + i) * 0.5;
        drawParticle(p, ga);
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
