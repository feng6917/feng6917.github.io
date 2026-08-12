/**
 * 实体感烟花追随
 * 物理参考：
 * - https://blog.csdn.net/weixin_42610010/article/details/151792740
 *   （deltaTime、空气阻力、重力、黄金角爆炸、HSL、个体衰减、尺寸收缩、噪声扰动）
 * - https://github.com/hh996655/CanvasFireworks （升空→顶点爆炸、多类型绽放、拖尾）
 *
 * 交互：滑动发射；<2s 燃尽不聚字；≥2s 大烟花后余烬聚成「Big 胆」渐隐；按下不触发
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

  // 文章推荐的实体物理（按 60fps 标定，再乘 dt*60）
  var GRAVITY = 0.08;
  var AIR = 0.98;
  var FRICTION = 0.012;
  var NOISE = 0.35;
  var MAX_PARTICLES = 2400;
  var GOLDEN = Math.PI * (3 - Math.sqrt(5));
  var TYPES = ["standard", "heart", "doubleSpiral", "multiLayer", "comet", "golden"];

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
  var frame = 0;
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

  /** 文章：HSL 高饱和、中等亮度，同色系更耐看 */
  function randomHSL(hue) {
    var h = hue != null ? hue : (Math.random() * 360) | 0;
    var s = 70 + ((Math.random() * 31) | 0);
    var l = 40 + ((Math.random() * 21) | 0);
    return { h: h, s: s, l: l, str: "hsl(" + h + ", " + s + "%, " + l + "%)" };
  }

  function colorAlpha(c, a) {
    return "hsla(" + c.h + ", " + c.s + "%, " + c.l + "%, " + a + ")";
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
    // 尺寸近似高斯：mean≈2.4
    var size = Math.max(1, 2.4 + (Math.random() + Math.random() + Math.random() - 1.5) * 1.4);
    return {
      x: x,
      y: y,
      vx: 0,
      vy: 0,
      ax: 0,
      ay: GRAVITY,
      size: size,
      baseSize: size,
      life: 1,
      // 文章：消失速率个体差异，避免同时熄灭
      decay: 0.012 + Math.random() * 0.018,
      color: color,
      type: type || "standard",
      trail: [],
      maxTrail: type === "comet" ? 16 : 9,
      forming: false,
      ox: 0, oy: 0, tx: 0, ty: 0,
    };
  }

  function setVel(p, vx, vy) {
    p.vx = vx;
    p.vy = vy;
  }

  function pushAll(list) {
    for (var i = 0; i < list.length; i++) particles.push(list[i]);
    if (particles.length > MAX_PARTICLES) {
      particles.splice(0, particles.length - MAX_PARTICLES);
    }
  }

  // —— 爆炸形态 ——
  function createStandard(x, y, color) {
    var list = [];
    var n = 90;
    for (var i = 0; i < n; i++) {
      var p = makeParticle(x, y, color, "standard");
      var ang = (Math.PI * 2 * i) / n;
      var force = rand(5, 12) * (0.75 + Math.random() * 0.5);
      setVel(p, Math.cos(ang) * force, Math.sin(ang) * force);
      list.push(p);
    }
    return list;
  }

  /** 文章：黄金角均匀铺开，更自然 */
  function createGolden(x, y, color) {
    var list = [];
    var n = 70;
    for (var i = 0; i < n; i++) {
      var p = makeParticle(x, y, color, "golden");
      var ang = GOLDEN * i;
      var force = 4 + Math.random() * 3;
      setVel(p, Math.cos(ang) * force, Math.sin(ang) * force);
      list.push(p);
    }
    return list;
  }

  function createHeart(x, y, color) {
    var list = [];
    var n = 110;
    for (var i = 0; i < n; i++) {
      var p = makeParticle(x, y, color, "heart");
      var tt = (Math.PI * 2 * i) / n;
      var xo = 16 * Math.pow(Math.sin(tt), 3);
      var yo = -(13 * Math.cos(tt) - 5 * Math.cos(2 * tt) - 2 * Math.cos(3 * tt) - Math.cos(4 * tt));
      var force = rand(4, 11);
      var ang = Math.atan2(yo, xo);
      setVel(p, Math.cos(ang) * force, Math.sin(ang) * force);
      list.push(p);
    }
    return list;
  }

  function createDoubleSpiral(x, y, color) {
    var list = [];
    var n = 96;
    for (var i = 0; i < n; i++) {
      var p = makeParticle(x, y, color, "doubleSpiral");
      var tt = i / n;
      var radius = tt * 28;
      var ang = tt * Math.PI * 8;
      var xo = (i % 2 === 0 ? 1 : -1) * Math.cos(ang) * radius;
      var yo = Math.sin(ang) * radius;
      var force = rand(3, 8);
      var dir = Math.atan2(yo, xo);
      setVel(p, Math.cos(dir) * force, Math.sin(dir) * force);
      list.push(p);
    }
    return list;
  }

  function createMultiLayer(x, y, baseHue) {
    var list = [];
    for (var layer = 0; layer < 4; layer++) {
      var col = randomHSL((baseHue + layer * 35) % 360);
      var n = 36;
      for (var i = 0; i < n; i++) {
        var p = makeParticle(x, y, col, "multiLayer");
        var force = (layer + 1) * rand(2.2, 4.8);
        var ang = (Math.PI * 2 * i) / n + layer * 0.4;
        setVel(p, Math.cos(ang) * force, Math.sin(ang) * force);
        p.size = (layer + 1) * (0.6 + Math.random());
        p.baseSize = p.size;
        list.push(p);
      }
    }
    return list;
  }

  function createComet(x, y, color) {
    var list = [];
    var n = 56;
    for (var i = 0; i < n; i++) {
      var p = makeParticle(x, y, color, "comet");
      var ang = (Math.PI * 2 * i) / n;
      var force = rand(5, 14);
      setVel(p, Math.cos(ang) * (3 + force), Math.sin(ang) * (3 + force));
      p.size = 2 + Math.random() * 3.5;
      p.baseSize = p.size;
      list.push(p);
    }
    return list;
  }

  function explodeByType(type, x, y, color) {
    switch (type) {
      case "heart": return createHeart(x, y, color);
      case "doubleSpiral": return createDoubleSpiral(x, y, color);
      case "multiLayer": return createMultiLayer(x, y, color.h);
      case "comet": return createComet(x, y, color);
      case "golden": return createGolden(x, y, color);
      default: return createStandard(x, y, color);
    }
  }

  /**
   * 升空火箭：最短上升时间 + 目标高度（文章状态机思路）
   */
  function launchRocket(fromX, fromY, toX, toY, type, isBig) {
    var color = randomHSL();
    var ang = Math.atan2(toY - fromY, toX - fromX) + (Math.random() - 0.5) * 0.25;
    var speed = isBig ? rand(13, 17) : rand(8, 12.5);
    rockets.push({
      x: fromX,
      y: fromY,
      vx: Math.cos(ang) * speed,
      vy: Math.sin(ang) * speed,
      color: color,
      type: type || pick(TYPES),
      trail: [],
      maxTrail: isBig ? 22 : 14,
      exploded: false,
      big: !!isBig,
      born: performance.now(),
      minRise: isBig ? 700 : 380,
      targetY: toY,
    });
  }

  function updateRockets(now, dtScale) {
    var spawned = [];
    for (var i = rockets.length - 1; i >= 0; i--) {
      var r = rockets[i];
      r.trail.push({ x: r.x, y: r.y });
      if (r.trail.length > r.maxTrail) r.trail.shift();

      r.vy += GRAVITY * dtScale;
      // 空气阻力
      r.vx *= Math.pow(AIR, dtScale);
      r.vy *= Math.pow(AIR, dtScale);
      r.x += r.vx * dtScale;
      r.y += r.vy * dtScale;

      var risenLongEnough = now - r.born >= r.minRise;
      var nearApex = r.vy > -0.4 && risenLongEnough;
      var pastTarget = r.y <= r.targetY && risenLongEnough;

      if (!r.exploded && (nearApex || pastTarget)) {
        r.exploded = true;
        flash = Math.max(flash, r.big ? 1 : 0.28);
        spawned = spawned.concat(explodeByType(r.type, r.x, r.y, r.color));
        if (r.big) {
          boomCenter.x = r.x;
          boomCenter.y = r.y;
          // 二次碎裂 + 黄金角铺底，更实体
          spawned = spawned.concat(createGolden(r.x, r.y, randomHSL((r.color.h + 40) % 360)));
          spawned = spawned.concat(explodeByType(pick(TYPES), r.x, r.y, randomHSL()));
        }
        rockets.splice(i, 1);
        continue;
      }
      if (r.x < -50 || r.x > W + 50 || r.y > H + 60) rockets.splice(i, 1);
    }
    if (spawned.length) pushAll(spawned);
  }

  /** 文章实体更新：阻力 + 方向摩擦 + 重力 + 噪声 + 尺寸/透明度衰减 */
  function updateParticles(dtScale, decayMul) {
    decayMul = decayMul == null ? 1 : decayMul;
    for (var i = particles.length - 1; i >= 0; i--) {
      var p = particles[i];
      if (p.forming) continue;

      p.life -= p.decay * decayMul * dtScale;
      if (p.life <= 0) {
        particles.splice(i, 1);
        continue;
      }

      p.trail.push({ x: p.x, y: p.y, life: p.life });
      if (p.trail.length > p.maxTrail) p.trail.shift();

      // 重力
      p.vy += p.ay * dtScale;

      // 空气阻力
      p.vx *= Math.pow(AIR, dtScale);
      p.vy *= Math.pow(AIR, dtScale);

      // 方向摩擦（文章：沿速度方向减速）
      var spd = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
      if (spd > 0.001) {
        var f = FRICTION * dtScale;
        p.vx -= (p.vx / spd) * f;
        p.vy -= (p.vy / spd) * f;
      }

      // 湍流噪声
      var nx = Math.sin(frame * 0.01 + p.x * 0.005) * NOISE * 0.15 * dtScale;
      var ny = Math.cos(frame * 0.01 + p.y * 0.005) * NOISE * 0.15 * dtScale;

      p.x += p.vx * dtScale + nx;
      p.y += p.vy * dtScale + ny;

      // 尺寸缓慢收缩
      p.size = Math.max(0.4, p.baseSize * (0.55 + p.life * 0.45));
    }
  }

  function drawTrail(trail, color, size) {
    for (var i = 0; i < trail.length; i++) {
      var tr = trail[i];
      var k = i / Math.max(1, trail.length - 1);
      var op = (tr.life != null ? tr.life : 1) * k * 0.5;
      if (op < 0.02) continue;
      var sz = size * (0.3 + k * 0.7);
      ctx.globalAlpha = op;
      var g = ctx.createRadialGradient(tr.x, tr.y, 0, tr.x, tr.y, sz * 2);
      g.addColorStop(0, color.str);
      g.addColorStop(0.55, colorAlpha(color, 0.45));
      g.addColorStop(1, "transparent");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(tr.x, tr.y, sz * 2, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawRocket(r) {
    drawTrail(r.trail, r.color, 2.8);
    ctx.globalAlpha = 1;
    var g = ctx.createRadialGradient(r.x, r.y, 0, r.x, r.y, 9);
    g.addColorStop(0, "#fff");
    g.addColorStop(0.25, r.color.str);
    g.addColorStop(0.7, colorAlpha(r.color, 0.45));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(r.x, r.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.arc(r.x, r.y, 2.2, 0, Math.PI * 2);
    ctx.fill();
  }

  function drawParticle(p, ga) {
    var op = p.life * (ga == null ? 1 : ga);
    if (op < 0.02) return;
    drawTrail(p.trail, p.color, p.size);

    ctx.globalAlpha = op;
    var glow = p.type === "comet" ? p.size * 3.6 : p.size * 2.8;
    // 亮度随 life 变化（文章：同色系调 lightness 感）
    var lite = clamp(p.color.l + (1 - p.life) * -15, 25, 75);
    var core = "hsl(" + p.color.h + ", " + p.color.s + "%, " + lite + "%)";

    var g = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glow);
    g.addColorStop(0, "#ffffff");
    g.addColorStop(0.22, core);
    g.addColorStop(0.55, colorAlpha(p.color, 0.55));
    g.addColorStop(1, "transparent");
    ctx.fillStyle = g;
    ctx.beginPath();
    ctx.arc(p.x, p.y, glow, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = core;
    ctx.beginPath();
    ctx.arc(p.x, p.y, Math.max(0.6, p.size * 0.55), 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;
  }

  function buildTextTargets() {
    var off = document.createElement("canvas");
    var fontSize = Math.min(220, Math.max(88, W * 0.18));
    off.width = Math.min(1400, Math.floor(W * 0.96));
    off.height = Math.floor(fontSize * 2.1);
    var octx = off.getContext("2d");
    octx.fillStyle = "#fff";
    octx.font = "800 " + fontSize + "px 'Segoe UI', 'PingFang SC', 'Microsoft YaHei', sans-serif";
    octx.textAlign = "center";
    octx.textBaseline = "middle";
    octx.fillText(TEXT, off.width / 2, off.height / 2);
    var data = octx.getImageData(0, 0, off.width, off.height).data;
    var pts = [];
    var step = Math.max(3, Math.floor(fontSize / 18));
    for (var y = 0; y < off.height; y += step) {
      for (var x = 0; x < off.width; x += step) {
        var idx = (y * off.width + x) * 4;
        if (data[idx + 3] > 130 && (Math.random() > 0.22 || data[idx + 3] > 210)) {
          pts.push({
            x: (W - off.width) / 2 + x + rand(-0.6, 0.6),
            y: H * 0.4 - off.height / 2 + y + rand(-0.6, 0.6),
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
    var need = Math.max(formTargets.length, 160);
    particles = particles.filter(function (p) { return p.life > 0.1; });
    while (particles.length < need) {
      var ang = rand(0, Math.PI * 2);
      var rad = rand(40, Math.min(W, H) * 0.34);
      var p = makeParticle(
        boomCenter.x + Math.cos(ang) * rad,
        boomCenter.y + Math.sin(ang) * rad,
        randomHSL(),
        "standard"
      );
      p.life = 1;
      particles.push(p);
    }
    if (particles.length > need * 1.15) particles.length = Math.ceil(need * 1.15);
    for (var i = 0; i < particles.length; i++) {
      var pt = particles[i];
      var tg = formTargets[i % formTargets.length];
      pt.ox = pt.x;
      pt.oy = pt.y;
      pt.tx = tg.x + rand(-1, 1);
      pt.ty = tg.y + rand(-1, 1);
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
    launchRocket(x, y + 30, x + rand(-40, 40), y - rand(90, 160), pick(TYPES), false);
    ensureLoop();
  }

  function onStop(now) {
    var dur = Math.max(0, lastMove - moveStart);
    if (dur < MIN_FORM_MS) {
      state = STATE.DIE;
      phaseStart = now;
      for (var i = 0; i < rockets.length; i++) {
        rockets[i].minRise = 0;
        rockets[i].vy = Math.max(rockets[i].vy, 0.2);
      }
      return;
    }
    var cx = W * 0.5 + rand(-W * 0.1, W * 0.1);
    var cy = H * 0.32 + rand(-15, 25);
    launchRocket(cx, H + 12, cx, cy, pick(TYPES), true);
    state = STATE.BOOM;
    phaseStart = now;
    phaseDur = 2400;
  }

  function maybeLaunch(now) {
    if (now - lastLaunch < 150) return;
    lastLaunch = now;
    launchRocket(
      mouse.x,
      mouse.y + 8,
      mouse.x + rand(-50, 50),
      mouse.y - rand(70, 170),
      pick(TYPES),
      false
    );
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
    if (state === STATE.TRAIL && dist >= MOVE_EPS) {
      lastMove = now;
      lastX = mouse.x;
      lastY = mouse.y;
      maybeLaunch(now);
      if (particles.length < MAX_PARTICLES * 0.45) {
        var spark = makeParticle(mouse.x, mouse.y, randomHSL(), "comet");
        spark.size = rand(1, 2);
        spark.baseSize = spark.size;
        spark.maxTrail = 7;
        spark.life = 0.65;
        spark.decay = 0.03;
        setVel(spark, rand(-1.2, 1.2), rand(-2.8, -0.6));
        particles.push(spark);
      }
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var rawDt = Math.min(0.05, (now - (loop._last || now)) / 1000);
    loop._last = now;
    // 文章：用 deltaTime 做帧率无关；物理按 60fps 标定
    var dtScale = rawDt * 60;
    frame++;

    ctx.globalCompositeOperation = "source-over";
    ctx.clearRect(0, 0, W, H);

    if (flash > 0.01) {
      ctx.fillStyle = "rgba(255, 245, 220, " + (flash * 0.2) + ")";
      ctx.fillRect(0, 0, W, H);
      flash *= Math.pow(0.88, dtScale);
    }

    ctx.globalCompositeOperation = "lighter";
    var i;

    if (state === STATE.TRAIL) {
      updateRockets(now, dtScale);
      updateParticles(dtScale, 1.5);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i]);
      if (now - lastMove > IDLE_MS) onStop(now);
      if (!rockets.length && !particles.length) resetAll();
    } else if (state === STATE.DIE) {
      updateRockets(now, dtScale);
      updateParticles(dtScale, 2.3);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i]);
      if (!rockets.length && !particles.length) resetAll();
    } else if (state === STATE.BOOM) {
      var bp = Math.min(1, (now - phaseStart) / phaseDur);
      updateRockets(now, dtScale);
      updateParticles(dtScale, 0.5);
      for (i = 0; i < rockets.length; i++) drawRocket(rockets[i]);
      for (i = 0; i < particles.length; i++) drawParticle(particles[i], 0.92);
      if (!rockets.length && bp > 0.5 && particles.length > 50) {
        assignFormTargets();
        state = STATE.FORM;
        phaseStart = now;
        phaseDur = 1700;
      } else if (bp >= 1) {
        assignFormTargets();
        state = STATE.FORM;
        phaseStart = now;
        phaseDur = 1700;
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
        var h2 = particles[i];
        h2.x = h2.tx + Math.sin(frame * 0.05 + i * 0.2) * 0.35;
        h2.y = h2.ty + Math.cos(frame * 0.04 + i * 0.15) * 0.35;
        drawParticle(h2, 1);
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
        var f2 = particles[i];
        f2.x = f2.tx + Math.sin(frame * 0.05 + i) * 0.5;
        f2.y = f2.ty - fade * 14;
        drawParticle(f2, ga);
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
