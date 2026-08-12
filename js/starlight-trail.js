/**
 * 真实感烟花追随（参考 CanvasFireworks 物理与爆炸类型）
 * https://github.com/hh996655/CanvasFireworks
 *
 * - 滑动：升空小烟花 + 拖尾粒子
 * - <2s 停下：燃尽，不聚字
 * - ≥2s 停下：屏幕一朵大烟花（随机类型）→ 余烬聚成「Big 胆」→ 渐隐
 * - 按下不触发
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
  var MOVE_EPS = 2.5;

  // —— 参考 CanvasFireworks 的物理参数 ——
  var GRAVITY = 0.15;
  var AIR = 0.98;
  var MIN_FORCE = 5;
  var MAX_FORCE = 12;
  var MAX_PARTICLES = 2200;
  var HUES = [0, 30, 60, 120, 180, 240, 300, 330];
  var TYPES = ["standard", "heart", "doubleSpiral", "multiLayer", "comet"];

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var state = STATE.IDLE;
  var moveStart = 0;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var lastLaunch = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var rockets = [];
  var particles = [];
  var formTargets = [];
  var boomCenter = { x: 0, y: 0 };
  var flash = 0;
  var reducedListener;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 3); }
  function easeInOut(p) {
    return p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2;
  }
  function rand(a, b) { return a + Math.random() * (b - a); }
  function pick(arr) { return arr[(Math.random() * arr.length) | 0]; }
  function hsl(h, a) {
    if (a == null || a >= 1) return "hsl(" + h + ", 100%, 55%)";
    return "hsla(" + h + ", 100%, 55%, " + a + ")";
  }
  function randomColor() {
    return "hsl(" + pick(HUES) + ", 100%, 55%)";
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
    if (!running) {
      running = true;
      raf = requestAnimationFrame(loop);
    }
  }

  function resetAll() {
    state = STATE.IDLE;
    rockets = [];
    particles = [];
    formTargets = [];
    flash = 0;
  }

  function makeParticle(x, y, color, type) {
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      size: Math.random() * 3 + 1,
      life: 1,
      maxLife: 1,
      color: color,
      type: type || "standard",
      trail: [],
      maxTrail: type === "comet" ? 18 : 10,
      rot: Math.random() * Math.PI * 2,
      rotSpeed: Math.random() * 0.1 - 0.05,
      ox: 0, oy: 0, tx: 0, ty: 0,
      forming: false,
    };
  }

  function setVelocity(p, vx, vy) {
    p.vx = vx;
    p.vy = vy;
  }

  // —— 爆炸类型（对齐 CanvasFireworks/fireworks_types.js）——
  function createStandard(x, y, color) {
    var list = [];
    var count = 80;
    for (var i = 0; i < count; i++) {
      var p = makeParticle(x, y, color, "standard");
      var angle = (Math.PI * 2 * i) / count;
      var force = rand(MIN_FORCE, MAX_FORCE);
      setVelocity(p, Math.cos(angle) * force, Math.sin(angle) * force);
      list.push(p);
    }
    return list;
  }

  function createHeart(x, y, color) {
    var list = [];
    var count = 120;
    for (var i = 0; i < count; i++) {
      var p = makeParticle(x, y, color, "heart");
      var tt = (Math.PI * 2 * i) / count;
      var xOff = 16 * Math.pow(Math.sin(tt), 3);
      var yOff = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
      var force = rand(4, 12);
      var angle = Math.atan2(yOff, xOff);
      setVelocity(p, Math.cos(angle) * force, Math.sin(angle) * force);
      list.push(p);
    }
    return list;
  }

  function createDoubleSpiral(x, y, color) {
    var list = [];
    var count = 100;
    for (var i = 0; i < count; i++) {
      var p = makeParticle(x, y, color, "doubleSpiral");
      var tt = i / count;
      var spiralRadius = tt * 30;
      var angle = tt * Math.PI * 8;
      var xOff, yOff;
      if (i % 2 === 0) {
        xOff = Math.cos(angle) * spiralRadius;
        yOff = Math.sin(angle) * spiralRadius;
      } else {
        xOff = -Math.cos(angle) * spiralRadius;
        yOff = Math.sin(angle) * spiralRadius;
      }
      var force = rand(3, 9);
      var dir = Math.atan2(yOff, xOff);
      setVelocity(p, Math.cos(dir) * force, Math.sin(dir) * force);
      list.push(p);
    }
    return list;
  }

  function createMultiLayer(x, y, baseHue) {
    var list = [];
    var layers = 4;
    var per = 38;
    for (var layer = 0; layer < layers; layer++) {
      var hue = HUES[(HUES.indexOf(baseHue) + layer) % HUES.length];
      if (hue < 0) hue = pick(HUES);
      var color = hsl(hue);
      for (var i = 0; i < per; i++) {
        var p = makeParticle(x, y, color, "multiLayer");
        var force = (layer + 1) * rand(2, 5);
        var angle = (Math.PI * 2 * i) / per + (layer * Math.PI) / 4;
        setVelocity(p, Math.cos(angle) * force, Math.sin(angle) * force);
        p.size = (layer + 1) * (Math.random() * 1 + 0.5);
        list.push(p);
      }
    }
    return list;
  }

  function createComet(x, y, color) {
    var list = [];
    var count = 60;
    for (var i = 0; i < count; i++) {
      var p = makeParticle(x, y, color, "comet");
      var angle = (Math.PI * 2 * i) / count;
      var force = rand(5, 15);
      var ring = 30;
      setVelocity(
        p,
        (Math.cos(angle) * ring) / 10 + Math.cos(angle) * force,
        (Math.sin(angle) * ring) / 10 + Math.sin(angle) * force
      );
      p.size = Math.random() * 4 + 2;
      list.push(p);
    }
    return list;
  }

  function explodeByType(type, x, y, color, hue) {
    switch (type) {
      case "heart": return createHeart(x, y, color);
      case "doubleSpiral": return createDoubleSpiral(x, y, color);
      case "multiLayer": return createMultiLayer(x, y, hue != null ? hue : pick(HUES));
      case "comet": return createComet(x, y, color);
      default: return createStandard(x, y, color);
    }
  }

  function pushParticles(list) {
    for (var i = 0; i < list.length; i++) {
      particles.push(list[i]);
    }
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  function launchRocket(fromX, fromY, toX, toY, type, isBig) {
    var hue = pick(HUES);
    var color = hsl(hue);
    var angle = Math.atan2(toY - fromY, toX - fromX);
    angle += (Math.random() - 0.5) * 0.35;
    var speed = isBig ? rand(14, 18) : rand(8, 13);
    rockets.push({
      x: fromX,
      y: fromY,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - rand(1.5, 4),
      color: color,
      hue: hue,
      type: type || pick(TYPES),
      trail: [],
      maxTrail: isBig ? 24 : 16,
      exploded: false,
      big: !!isBig,
    });
  }

  function updateRockets() {
    var spawned = [];
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > r.maxTrail) r.trail.shift();

      r.vy += GRAVITY * 0.85;
      r.vx *= AIR;
      r.vy *= AIR;
      r.x += r.vx;
      r.y += r.vy;

      // 参考实现：开始下落时爆炸
      if (!r.exploded && r.vy > 0) {
        r.exploded = true;
        flash = Math.max(flash, r.big ? 1 : 0.35);
        spawned = spawned.concat(explodeByType(r.type, r.x, r.y, r.color, r.hue));
        if (r.big) {
          boomCenter.x = r.x;
          boomCenter.y = r.y;
          // 大烟花附加第二层随机类型
          spawned = spawned.concat(
            explodeByType(pick(TYPES), r.x, r.y, randomColor(), pick(HUES))
          );
        }
        rockets.splice(i, 1);
        continue;
      }

      if (r.x < -40 || r.x > W + 40 || r.y > H + 40) {
        rockets.splice(i, 1);
      }
    }
    if (spawned.length) pushParticles(spawned);
  }

  function updateParticles(dt, decayScale) {
    decayScale = decayScale == null ? 1 : decayScale;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (p.forming) continue;

      p.life -= dt * decayScale * (0.55 + (1 - p.life) * 0.4);
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.trail.push({ x: p.x, y: p.y, life: p.life });
      if (p.trail.length > p.maxTrail) p.trail.shift();

      p.rot += p.rotSpeed;
      p.vy += GRAVITY;
      p.vx *= AIR;
      p.vy *= AIR;
      p.x += p.vx;
      p.y += p.vy;
    }
  }

  function drawTrailDots(trail, color, size) {
    for (var i = 0; i < trail.length; i++) {
      var tr = trail[i];
      var k = i / trail.length;
      var op = (tr.life != null ? tr.life : 1) * k * 0.55;
      var sz = size * k;
      if (op < 0.02) continue;
      ctx.globalAlpha = op;
      var g = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, sz * 2.2);
      g.addColorStop(0, color);
      g.addColorStop(0.5, color.replace("hsl", "hsla").replace(")", ", 0.55)"));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, sz * 2.2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRocket(r) {
    drawTrailDots(r.trail, r.color, 3);
    ctx.globalAlpha = 1;
    var g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 8);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.3, r.color);
    g.addColorStop(0.7, r.color.replace("hsl", "hsla").replace(")", ", 0.5)"));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = r.color;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticle(p, ga) {
    var op = p.life * (ga == null ? 1 : ga);
    if (op < 0.02) return;

    drawTrailDots(p.trail, p.color, p.size);

    ctx.globalAlpha = op;
    var glow = p.type === "comet" ? p.size * 3.5 : p.size * 3;
    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
    if (p.type === "comet") {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.3, p.color);
      g.addColorStop(0.7, p.color.replace("hsl", "hsla").replace(")", ", 0.7)"));
    } else {
      g.addColorStop(0, "#ffffff");
      g.addColorStop(0.25, p.color);
      g.addColorStop(0.6, p.color.replace("hsl", "hsla").replace(")", ", 0.65)"));
    }
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = p.color;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function buildTextTargets() {
    var off = document.createElement("canvas");
    var fontSize = Math.min(130, Math.max(48, W * 0.11));
    off.width = Math.min(1100, Math.floor(W * 0.9));
    off.height = Math.floor(fontSize * 1.9);
    var octx = off.getContext("2d");
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
        if (data[idx + 3] > 130 && (Math.random() > 0.28 || data[idx + 3] > 210)) {
          pts.push({
            x: (W - off.width) / 2 + x + rand(-0.6, 0.6),
            y: H * 0.42 - off.height / 2 + y + rand(-0.6, 0.6),
          });
        }
      }
    }
    for (var k = pts.length - 1; k > 0; k--) {
      var j = (Math.random() * (k + 1)) | 0;
      var tmp = pts[k]; pts[k] = pts[j]; pts[j] = tmp;
    }
    return pts;
  }

  function assignFormTargets() {
    formTargets = buildTextTargets();
    var need = Math.max(formTargets.length, 100);
    // 保留余烬
    particles = particles.filter(function (p) { return p.life > 0.12; });
    while (particles.length < need) {
      var ang = rand(0, Math.PI * 2);
      var rad = rand(30, Math.min(W, H) * 0.32);
      var p = makeParticle(
        boomCenter.x + Math.cos(ang) * rad,
        boomCenter.y + Math.sin(ang) * rad,
        randomColor(),
        "standard"
      );
      p.life = 1;
      particles.push(p);
    }
    if (particles.length > need * 1.15) particles.length = Math.ceil(need * 1.15);
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var target = formTargets[i % formTargets.length];
      pt.ox = pt.x;
      pt.oy = pt.y;
      pt.tx = target.x + rand(-1, 1);
      pt.ty = target.y + rand(-1, 1);
      pt.vx = 0;
      pt.vy = 0;
      pt.life = 1;
      pt.forming = true;
      pt.trail = [];
    }
  }

  function beginTrail(x, y, now) {
    rockets = [];
    particles = [];
    lastX = x;
    lastY = y;
    mouse.x = x;
    mouse.y = y;
    moveStart = now;
    lastMove = now;
    lastLaunch = 0;
    state = STATE.TRAIL;
    // 起点先放一朵小的
    launchRocket(x, y + 40, x + rand(-30, 30), y - rand(80, 140), pick(TYPES), false);
    ensureLoop();
  }

  function onStop(now) {
    var dur = Math.max(0, lastMove - moveStart);
    if (dur < MIN_FORM_MS) {
      state = STATE.DIE;
      phaseStart = now;
      // 剩余火箭尽快炸完
      for (var i = 0; i < rockets.length; i++) rockets[i].vy = Math.max(rockets[i].vy, 0.5);
      return;
    }
    // ≥2s：从底部升空，在屏幕中上部炸开一朵
    var cx = W * 0.5 + rand(-W * 0.08, W * 0.08);
    var cy = H * 0.38 + rand(-20, 20);
    launchRocket(cx, H + 10, cx, cy, pick(TYPES), true);
    state = STATE.BOOM;
    phaseStart = now;
    phaseDur = 2200;
  }

  function maybeLaunchAlongTrail(now) {
    if (now - lastLaunch < 140) return;
    lastLaunch = now;
    var tx = mouse.x + rand(-40, 40);
    var ty = mouse.y - rand(60, 160);
    launchRocket(mouse.x, mouse.y + 10, tx, ty, pick(TYPES), false);
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

    if (state === STATE.IDLE || (state === STATE.DIE && !rockets.length && particles.length < 3)) {
      beginTrail(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.BOOM || state === STATE.FORM || state === STATE.HOLD || state === STATE.FADE) {
      return;
    }

    if (state === STATE.TRAIL) {
      if (dist >= MOVE_EPS) {
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
        maybeLaunchAlongTrail(now);
        // 滑动火花拖尾
        if (particles.length < MAX_PARTICLES * 0.5) {
          var spark = makeParticle(mouse.x, mouse.y, randomColor(), "comet");
          spark.size = rand(1, 2.2);
          spark.maxTrail = 8;
          spark.life = 0.7;
          setVelocity(spark, rand(-1, 1), rand(-2.5, -0.5));
          particles.push(spark);
        }
      }
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.05, (now - (loop._last || now)) / 1000);
    loop._last = now;
    t += dt;

    // 半透明清屏，略留残影更像夜空烟花
    ctx.globalCompositeOperation = "source-over";
    ctx.fillStyle = "rgba(0, 0, 0, 0)"; // 不挡页面：完全透明清
    ctx.clearRect(0, 0, W, H);

    if (flash > 0.01) {
      ctx.fillStyle = "rgba(255, 240, 210, " + (flash * 0.22) + ")";
      ctx.fillRect(0, 0, W, H);
      flash *= 0.88;
    }

    ctx.globalCompositeOperation = "lighter";

    var i;

    if (state === STATE.TRAIL) {
      updateRockets();
      updateParticles(dt, 1.6);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i]);
      if (now - lastMove > IDLE_MS) onStop(now);
      if (!rockets.length && !particles.length) resetAll();
    } else if (state === STATE.DIE) {
      updateRockets();
      updateParticles(dt, 2.2);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i]);
      if (!rockets.length && !particles.length) resetAll();
    } else if (state === STATE.BOOM) {
      var bp = Math.min(1, (now - phaseStart) / phaseDur);
      updateRockets();
      updateParticles(dt, 0.55);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i], 0.9);
      // 等大烟花升空炸开且粒子铺开
      if (bp >= 1 || (bp > 0.45 && !rockets.length && particles.length > 40)) {
        // 稍等炸开
        if (!rockets.length && bp > 0.55) {
          assignFormTargets();
          state = STATE.FORM;
          phaseStart = now;
          phaseDur = 1700;
        }
      }
    } else if (state === STATE.FORM) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      var ease = easeInOut(easeOut(fp));
      for (i = 0; i < particles.length; i++) {
        var p = particles[i];
        p.x = lerp(p.ox, p.tx, ease);
        p.y = lerp(p.oy, p.ty, ease);
        p.life = 1;
        p.trail = [];
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
        var hp2 = particles[i];
        hp2.x = hp2.tx + Math.sin(t * 2 + i * 0.2) * 0.35;
        hp2.y = hp2.ty + Math.cos(t * 1.7 + i * 0.15) * 0.35;
        drawParticle(hp2, 1);
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
        var fp2 = particles[i];
        fp2.x = fp2.tx + Math.sin(t * 2 + i) * 0.5;
        fp2.y = fp2.ty - fade * 14;
        drawParticle(fp2, ga);
      }
      if (fade >= 1) resetAll();
    }

    ctx.globalCompositeOperation = "source-over";

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
