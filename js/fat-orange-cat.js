/**
 * 胖橘拖绳
 * - 鼠标按下不触发；滑动满 2s 才在「起点」出现胖橘
 * - 胖橘坐在起点呆萌晃脑张望，绳子一端拴猫、一端跟鼠标（猫不位移）
 * - 停下：2s≤t<3s 挣扎后绷断；t≥3s 挣扎 t/3 再拖回渐隐
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = { IDLE: 0, TRACK: 1, SHOW: 2, STRUGGLE: 3, SNAP: 4, REEL: 5, FADE: 6 };

  var CAT_R = 38;
  var ROPE_SEGMENTS = 16;
  var ROPE_REST = 8;
  var IDLE_MS = 340;
  var MIN_SHOW_MS = 2000;
  var SNAP_LIMIT = 3000;
  var MOVE_EPS = 2.5;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var start = { x: 0, y: 0 };
  var cat = { x: 0, y: 0, scale: 0, alpha: 1, vx: 0, vy: 0 };
  var rope = [];
  var state = STATE.IDLE;
  var moveStart = 0;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var moveDuration = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var blinkT = 0;
  var nextBlink = 1.8 + Math.random() * 2.5;
  var look = 0;
  var lookTarget = 0;
  var lookTimer = 0;
  var breath = 0;
  var earTwitch = 0;
  var expression = "idle";
  var stretch = 1;
  var dig = 0;
  var wiggle = 0;
  var sweat = [];
  var bits = [];
  var snapRopes = null;
  var reducedListener;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

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

  function stopLoopSoon() {
    // loop 内 HIDDEN/IDLE 且无粒子时自行停
  }

  function initRope(ax, ay, bx, by) {
    rope = [];
    for (var i = 0; i < ROPE_SEGMENTS; i++) {
      var p = i / (ROPE_SEGMENTS - 1);
      var x = ax + (bx - ax) * p;
      var y = ay + (by - ay) * p;
      rope.push({ x: x, y: y, ox: x, oy: y });
    }
  }

  function spawnAtStart() {
    cat.x = clamp(start.x, CAT_R + 8, W - CAT_R - 8);
    cat.y = clamp(start.y, CAT_R + 8, H - CAT_R - 8);
    cat.scale = 0;
    cat.alpha = 1;
    cat.vx = 0;
    cat.vy = 0;
    stretch = 1;
    dig = 0;
    wiggle = 0;
    expression = "idle";
    look = 0;
    lookTarget = Math.random() > 0.5 ? 0.55 : -0.55;
    lookTimer = 0.6 + Math.random();
    initRope(cat.x, cat.y + 10, mouse.x, mouse.y);
  }

  function resetSession() {
    state = STATE.IDLE;
    rope = [];
    sweat = [];
    bits = [];
    snapRopes = null;
    cat.alpha = 0;
    cat.scale = 0;
    expression = "idle";
  }

  function updateRope(pinA, pinB, settle) {
    if (rope.length < 2) return;
    var rest = settle
      ? Math.max(3, ROPE_REST * (0.35 + (1 - Math.min(1, settle)) * 0.65))
      : ROPE_REST;
    var gravity = settle ? 0.1 : 0.28;
    var iterations = settle ? 6 : 4;
    var i, n, a, b, dx, dy, dist, diff, nx, ny, p, vx, vy, wave;

    for (n = 0; n < iterations; n++) {
      for (i = 1; i < rope.length - 1; i++) {
        p = rope[i];
        vx = (p.x - p.ox) * 0.94;
        vy = (p.y - p.oy) * 0.94;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx;
        p.y += vy + gravity;
      }
      rope[0].x = pinA.x;
      rope[0].y = pinA.y;
      rope[rope.length - 1].x = pinB.x;
      rope[rope.length - 1].y = pinB.y;

      for (i = 0; i < rope.length - 1; i++) {
        a = rope[i];
        b = rope[i + 1];
        dx = b.x - a.x;
        dy = b.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        wave = Math.sin(t * 2.4 + i * 0.7) * (settle ? 0.25 : 1.1);
        diff = (dist - (rest + wave)) / dist;
        nx = dx * 0.5 * diff;
        ny = dy * 0.5 * diff;
        if (i !== 0) { a.x += nx; a.y += ny; }
        if (i + 1 !== rope.length - 1) { b.x -= nx; b.y -= ny; }
      }
    }
  }

  function ropeAnchorOnCat() {
    // 项圈铃铛略偏下
    return { x: cat.x + look * 4, y: cat.y + 18 * cat.scale };
  }

  function addSweat() {
    if (Math.random() > 0.4) return;
    sweat.push({
      x: cat.x + 14 + Math.random() * 8,
      y: cat.y - 16,
      vx: 0.5 + Math.random() * 0.5,
      vy: -0.3 + Math.random() * 0.3,
      life: 1,
    });
  }

  function updateSweat(dt) {
    for (var i = sweat.length - 1; i >= 0; i--) {
      var s = sweat[i];
      s.x += s.vx;
      s.y += s.vy + 0.35;
      s.life -= dt * 1.5;
      if (s.life <= 0) sweat.splice(i, 1);
    }
  }

  function clonePt(p) {
    return {
      x: p.x, y: p.y, ox: p.x, oy: p.y,
      vx: (Math.random() - 0.5) * 2.2,
      vy: Math.random() * 1.4,
    };
  }

  function breakRope() {
    var mid = Math.floor(rope.length / 2);
    snapRopes = [
      rope.slice(0, mid + 1).map(clonePt),
      rope.slice(mid).map(clonePt),
    ];
    bits = [];
    var p = rope[mid] || { x: cat.x, y: cat.y };
    for (var i = 0; i < 12; i++) {
      bits.push({
        x: p.x, y: p.y,
        vx: (Math.random() - 0.5) * 7,
        vy: (Math.random() - 0.85) * 5.5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.45,
        life: 1,
        len: 5 + Math.random() * 9,
      });
    }
    rope = [];
  }

  function updateSnapBits(dt) {
    var i, j, seg, p;
    if (snapRopes) {
      for (i = 0; i < snapRopes.length; i++) {
        seg = snapRopes[i];
        for (j = 0; j < seg.length; j++) {
          p = seg[j];
          p.vy += 0.26;
          p.vx *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
        }
      }
    }
    for (i = bits.length - 1; i >= 0; i--) {
      p = bits[i];
      p.vy += 0.3;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= dt * 1.15;
      if (p.life <= 0) bits.splice(i, 1);
    }
  }

  function updateIdleLook(dt) {
    lookTimer -= dt;
    if (lookTimer <= 0) {
      var r = Math.random();
      if (r < 0.35) lookTarget = 0;
      else if (r < 0.7) lookTarget = (Math.random() > 0.5 ? 1 : -1) * (0.45 + Math.random() * 0.35);
      else lookTarget = (Math.random() > 0.5 ? 1 : -1) * (0.15 + Math.random() * 0.2);
      lookTimer = 0.7 + Math.random() * 1.6;
    }
    look += (lookTarget - look) * Math.min(1, dt * 3.2);
    breath += dt;
    if (Math.random() < dt * 0.35) earTwitch = 1;
    earTwitch = Math.max(0, earTwitch - dt * 4);
  }

  function enterStruggle(now) {
    moveDuration = Math.max(0, lastMove - moveStart);
    // <2s 不触发后续功能，安静消失
    if (moveDuration < MIN_SHOW_MS) {
      state = STATE.FADE;
      phaseStart = now;
      phaseDur = 380;
      expression = "idle";
      return;
    }
    state = STATE.STRUGGLE;
    phaseStart = now;
    expression = "struggle";
    dig = 1;
    sweat = [];
    if (moveDuration < SNAP_LIMIT) {
      phaseDur = 480 + Math.random() * 160;
    } else {
      phaseDur = moveDuration / 3;
    }
  }

  function beginTrack(x, y, now) {
    start.x = x;
    start.y = y;
    lastX = x;
    lastY = y;
    moveStart = now;
    lastMove = now;
    state = STATE.TRACK;
    ensureLoop();
  }

  function onMouseDown() {
    // 按下：整段效果取消
    if (state !== STATE.IDLE) {
      if (state === STATE.SHOW || state === STATE.TRACK) {
        resetSession();
      } else if (state === STATE.STRUGGLE || state === STATE.REEL) {
        resetSession();
      }
      // SNAP/FADE 让演出播完
    }
  }

  function onMouseMove(e) {
    // 按住左/右/中键：不触发、不延续
    if (e.buttons !== 0) {
      if (state === STATE.TRACK || state === STATE.SHOW) resetSession();
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

    if (state === STATE.SNAP) {
      lastMove = now;
      return;
    }

    if (state === STATE.IDLE || (state === STATE.FADE && cat.alpha < 0.18)) {
      beginTrack(mouse.x, mouse.y, now);
      lastX = mouse.x;
      lastY = mouse.y;
      return;
    }

    if (state === STATE.STRUGGLE || state === STATE.REEL) {
      // 演出中继续动：视为新一段滑动
      beginTrack(mouse.x, mouse.y, now);
      lastX = mouse.x;
      lastY = mouse.y;
      return;
    }

    if (state === STATE.TRACK || state === STATE.SHOW) {
      if (dist >= MOVE_EPS) {
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
      }
      if (state === STATE.TRACK && now - moveStart >= MIN_SHOW_MS) {
        spawnAtStart();
        state = STATE.SHOW;
      }
    }
  }

  function onMouseUp() {
    // 抬起本身不开始；由 mousemove 负责
  }

  function drawRopePath(points, alpha) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "rgba(110,80,45,0.28)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(points[0].x + 1, points[0].y + 1.5);
    for (var i = 1; i < points.length; i++) ctx.lineTo(points[i].x + 1, points[i].y + 1.5);
    ctx.stroke();
    ctx.strokeStyle = "#c9a06a";
    ctx.lineWidth = 2.15;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (i = 1; i < points.length; i++) ctx.lineTo(points[i].x, points[i].y);
    ctx.stroke();
    // 细高光
    ctx.strokeStyle = "rgba(255,240,210,0.35)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.moveTo(points[0].x - 0.6, points[0].y - 0.6);
    for (i = 1; i < points.length; i++) ctx.lineTo(points[i].x - 0.6, points[i].y - 0.6);
    ctx.stroke();
    ctx.restore();
  }

  function drawBits() {
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.strokeStyle = "#c9a06a";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-b.len / 2, 0);
      ctx.lineTo(b.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function drawSweat() {
    for (var i = 0; i < sweat.length; i++) {
      var s = sweat[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * cat.alpha;
      ctx.fillStyle = "#8ed0e8";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 3.5);
      ctx.quadraticCurveTo(s.x + 3.2, s.y + 1, s.x, s.y + 5);
      ctx.quadraticCurveTo(s.x - 3.2, s.y + 1, s.x, s.y - 3.5);
      ctx.fill();
      ctx.restore();
    }
  }

  /** 坐着的胖橘：大头圆肚、毛茸层次、呆萌左右看 */
  function drawCat() {
    if (cat.scale < 0.05 || cat.alpha <= 0.01) return;
    var s = CAT_R * cat.scale;
    var blinking = blinkT < 0.14;
    var headX = look * 5;
    var breathe = 1 + Math.sin(breath * 2.6) * 0.03;

    ctx.save();
    ctx.translate(cat.x, cat.y);
    ctx.rotate(wiggle * 0.35);
    ctx.scale((s / CAT_R) * stretch, (s / CAT_R) / Math.max(0.85, stretch * 0.9) * breathe);
    ctx.globalAlpha = cat.alpha;

    // 阴影
    ctx.beginPath();
    ctx.ellipse(0, 36, 22, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40,25,10,0.16)";
    ctx.fill();

    // —— 后腿 / 坐垫 ——
    ctx.fillStyle = "#e8893a";
    ctx.beginPath();
    ctx.ellipse(-16, 24, 12, 10, -0.25, 0, Math.PI * 2);
    ctx.ellipse(16, 24, 12, 10, 0.25, 0, Math.PI * 2);
    ctx.fill();

    // —— 身子（超圆） ——
    var bodyGrad = ctx.createRadialGradient(-6, 6, 4, 0, 14, 28);
    bodyGrad.addColorStop(0, "#ffd19a");
    bodyGrad.addColorStop(0.45, "#f5a45d");
    bodyGrad.addColorStop(1, "#e07a2f");
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(0, 14, 26, 22, 0, 0, Math.PI * 2);
    ctx.fill();

    // 肚皮白
    ctx.fillStyle = "rgba(255,245,230,0.92)";
    ctx.beginPath();
    ctx.ellipse(0, 18, 14, 13, 0, 0, Math.PI * 2);
    ctx.fill();

    // 虎斑
    ctx.strokeStyle = "rgba(210,110,40,0.55)";
    ctx.lineWidth = 2.2;
    ctx.lineCap = "round";
    [[-10, 2, -6, 16], [8, 0, 11, 14], [-2, -2, 1, 10]].forEach(function (l) {
      ctx.beginPath();
      ctx.moveTo(l[0], l[1]);
      ctx.quadraticCurveTo((l[0] + l[2]) / 2 + 3, (l[1] + l[3]) / 2, l[2], l[3]);
      ctx.stroke();
    });

    // 前爪（并拢坐着 / 挣扎扒地）
    if (dig > 0.25) {
      ctx.fillStyle = "#f0a050";
      ctx.beginPath();
      ctx.ellipse(-18, 30 + dig, 8, 5.5, -0.15, 0, Math.PI * 2);
      ctx.ellipse(18, 30 + dig, 8, 5.5, 0.15, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,180,0.8)";
      ctx.beginPath();
      ctx.ellipse(-18, 31 + dig, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.ellipse(18, 31 + dig, 4, 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(160,100,50,0.35)";
      ctx.lineWidth = 1.1;
      for (var k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(-24 + k * 4, 34);
        ctx.lineTo(-16 + k * 4, 38);
        ctx.moveTo(16 + k * 4, 34);
        ctx.lineTo(24 + k * 4, 38);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = "#f0a050";
      ctx.beginPath();
      ctx.ellipse(-8, 30, 7.5, 5.5, 0.1, 0, Math.PI * 2);
      ctx.ellipse(8, 30, 7.5, 5.5, -0.1, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,200,180,0.85)";
      ctx.beginPath();
      ctx.ellipse(-8, 31, 3.8, 2.4, 0, 0, Math.PI * 2);
      ctx.ellipse(8, 31, 3.8, 2.4, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // —— 尾巴 ——
    var tailWave = Math.sin(breath * 3.5) * 10 + look * 4;
    ctx.strokeStyle = "#e8893a";
    ctx.lineWidth = 7;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.bezierCurveTo(34, 12, 38 + tailWave * 0.3, 28, 30 + tailWave * 0.15, 36 + Math.sin(breath * 4) * 2);
    ctx.stroke();
    ctx.strokeStyle = "#f5a45d";
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(20, 20);
    ctx.bezierCurveTo(34, 12, 38 + tailWave * 0.3, 28, 30 + tailWave * 0.15, 36 + Math.sin(breath * 4) * 2);
    ctx.stroke();

    // —— 头（随 look 左右转） ——
    ctx.save();
    ctx.translate(headX, -6);
    ctx.rotate(look * 0.18);

    // 耳
    var earL = -0.05 - earTwitch * 0.25;
    var earR = 0.05 + earTwitch * 0.12;
    ctx.fillStyle = "#f5a45d";
    ctx.beginPath();
    ctx.moveTo(-16, -8);
    ctx.lineTo(-24 + earL * 10, -28);
    ctx.lineTo(-4, -14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -8);
    ctx.lineTo(24 + earR * 10, -28);
    ctx.lineTo(4, -14);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffb6c8";
    ctx.beginPath();
    ctx.moveTo(-15, -10);
    ctx.lineTo(-20, -22);
    ctx.lineTo(-8, -14);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -10);
    ctx.lineTo(20, -22);
    ctx.lineTo(8, -14);
    ctx.closePath();
    ctx.fill();

    // 脸
    var faceGrad = ctx.createRadialGradient(-4, -4, 3, 0, 0, 22);
    faceGrad.addColorStop(0, "#ffe0b0");
    faceGrad.addColorStop(0.55, "#f7b06a");
    faceGrad.addColorStop(1, "#e8893a");
    ctx.fillStyle = faceGrad;
    ctx.beginPath();
    ctx.ellipse(0, 0, 22, 19, 0, 0, Math.PI * 2);
    ctx.fill();

    // 额头斑纹 M
    ctx.strokeStyle = "rgba(210,110,40,0.5)";
    ctx.lineWidth = 1.8;
    ctx.beginPath();
    ctx.moveTo(-6, -12);
    ctx.lineTo(-3, -4);
    ctx.lineTo(0, -10);
    ctx.lineTo(3, -4);
    ctx.lineTo(6, -12);
    ctx.stroke();

    // 腮红
    ctx.fillStyle = "rgba(255,130,150,0.42)";
    ctx.beginPath();
    ctx.ellipse(-12, 5, 5.5, 3.2, 0, 0, Math.PI * 2);
    ctx.ellipse(12, 5, 5.5, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    var eyeOff = look * 2.2;
    ctx.fillStyle = "#2b1c14";
    if (blinking) {
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = "#2b1c14";
      ctx.beginPath();
      ctx.moveTo(-10 + eyeOff, 0);
      ctx.quadraticCurveTo(-7 + eyeOff, 2, -4 + eyeOff, 0);
      ctx.moveTo(4 + eyeOff, 0);
      ctx.quadraticCurveTo(7 + eyeOff, 2, 10 + eyeOff, 0);
      ctx.stroke();
    } else if (expression === "struggle") {
      ctx.lineWidth = 2;
      ctx.strokeStyle = "#2b1c14";
      ctx.beginPath();
      ctx.moveTo(-11, -3);
      ctx.lineTo(-5, -0.5);
      ctx.lineTo(-11, 2);
      ctx.moveTo(11, -3);
      ctx.lineTo(5, -0.5);
      ctx.lineTo(11, 2);
      ctx.stroke();
    } else if (expression === "dizzy") {
      ctx.font = "bold 11px ui-rounded, 'Hiragino Sans GB', sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("×", -7, 3);
      ctx.fillText("×", 7, 3);
    } else {
      // 水汪汪大眼
      ctx.beginPath();
      ctx.ellipse(-7.5 + eyeOff, -0.5, 4.2, 5.2, 0, 0, Math.PI * 2);
      ctx.ellipse(7.5 + eyeOff, -0.5, 4.2, 5.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-6 + eyeOff, -2.4, 1.7, 0, Math.PI * 2);
      ctx.arc(9 + eyeOff, -2.4, 1.7, 0, Math.PI * 2);
      ctx.fill();
      ctx.beginPath();
      ctx.arc(-8.5 + eyeOff, 1.2, 0.7, 0, Math.PI * 2);
      ctx.arc(6.5 + eyeOff, 1.2, 0.7, 0, Math.PI * 2);
      ctx.fill();
    }

    // 鼻子
    ctx.fillStyle = "#ff8fab";
    ctx.beginPath();
    ctx.moveTo(0, 3);
    ctx.lineTo(-2.6, 5.6);
    ctx.lineTo(2.6, 5.6);
    ctx.closePath();
    ctx.fill();

    // 嘴
    ctx.strokeStyle = "#2b1c14";
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (expression === "struggle") {
      ctx.moveTo(-3.5, 9);
      ctx.quadraticCurveTo(0, 7.2, 3.5, 9);
    } else {
      ctx.moveTo(0, 5.6);
      ctx.quadraticCurveTo(-4, 10, -6.5, 8.2);
      ctx.moveTo(0, 5.6);
      ctx.quadraticCurveTo(4, 10, 6.5, 8.2);
    }
    ctx.stroke();

    // 胡须
    ctx.strokeStyle = "rgba(80,50,30,0.35)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(-12, 6); ctx.lineTo(-26, 4);
    ctx.moveTo(-12, 8); ctx.lineTo(-26, 9);
    ctx.moveTo(12, 6); ctx.lineTo(26, 4);
    ctx.moveTo(12, 8); ctx.lineTo(26, 9);
    ctx.stroke();

    ctx.restore(); // head

    // 项圈 + 铃铛（绳子锚点）
    ctx.fillStyle = "#ff6b7a";
    ctx.beginPath();
    ctx.ellipse(0, 20, 11, 3.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd666";
    ctx.beginPath();
    ctx.arc(0, 24, 3.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(150,100,20,0.55)";
    ctx.lineWidth = 0.9;
    ctx.beginPath();
    ctx.arc(0, 24, 1.4, 0.15, Math.PI * 1.05);
    ctx.stroke();
    ctx.fillStyle = "rgba(255,255,255,0.5)";
    ctx.beginPath();
    ctx.arc(-0.8, 23, 0.8, 0, Math.PI * 2);
    ctx.fill();

    // 呆萌小星星
    if (expression === "idle" && !blinking) {
      var tw = 0.65 + Math.sin(breath * 5) * 0.35;
      ctx.fillStyle = "rgba(255,255,255,0.9)";
      ctx.beginPath();
      ctx.arc(18 + headX, -22, 1.5 * tw, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore();
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.033, (now - (loop._last || now)) / 1000);
    loop._last = now;
    t += dt;

    blinkT += dt;
    if (blinkT > nextBlink) {
      blinkT = 0;
      nextBlink = 1.6 + Math.random() * 3.2;
    }

    ctx.clearRect(0, 0, W, H);

    if (state === STATE.TRACK) {
      // 尚未满 2s：无绘制，仅等待
      if (now - lastMove > IDLE_MS) {
        resetSession();
      }
    } else if (state === STATE.SHOW) {
      if (cat.scale < 1) cat.scale = Math.min(1.1, cat.scale + dt * 4.2);
      else if (cat.scale > 1) cat.scale = Math.max(1, cat.scale - dt * 1.6);

      updateIdleLook(dt);
      expression = "idle";
      dig = 0;
      stretch = 1;
      wiggle = Math.sin(breath * 1.8) * 0.03;
      updateRope(ropeAnchorOnCat(), mouse, false);

      if (now - lastMove > IDLE_MS) {
        enterStruggle(now);
      }
    } else if (state === STATE.STRUGGLE) {
      var p = Math.min(1, (now - phaseStart) / phaseDur);
      dig = 1;
      stretch = 1.06 + Math.sin(now * 0.045) * 0.05;
      wiggle = Math.sin(now * 0.055) * 0.1;
      look = Math.sin(now * 0.02) * 0.2;
      // 坐着挣扎：轻微后仰，不位移出屏
      cat.x = clamp(cat.x + Math.sin(now * 0.05) * 0.25, CAT_R, W - CAT_R);
      cat.y = clamp(cat.y + Math.cos(now * 0.04) * 0.15, CAT_R, H - CAT_R);
      updateRope(ropeAnchorOnCat(), mouse, false);
      addSweat();
      updateSweat(dt);

      if (p >= 1) {
        if (moveDuration < SNAP_LIMIT) {
          breakRope();
          state = STATE.SNAP;
          phaseStart = now;
          phaseDur = 920;
          expression = "dizzy";
          dig = 0;
          cat.vx = (Math.random() - 0.5) * 2.5;
          cat.vy = -2.2 - Math.random();
        } else {
          state = STATE.REEL;
          phaseStart = now;
          phaseDur = 850 + Math.min(1000, moveDuration * 0.07);
          expression = "idle";
          dig = 0;
        }
      }
    } else if (state === STATE.SNAP) {
      var sp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.vy += 16 * dt;
      cat.x += cat.vx;
      cat.y += cat.vy;
      wiggle += 0.1;
      cat.alpha = 1 - sp;
      cat.scale = Math.max(0.2, 1 - sp * 0.4);
      updateSnapBits(dt);
      updateSweat(dt);
      if (snapRopes) {
        snapRopes.forEach(function (seg) { drawRopePath(seg, (1 - sp) * 0.85); });
      }
      drawBits();
      if (sp >= 1) resetSession();
    } else if (state === STATE.REEL) {
      var rp = Math.min(1, (now - phaseStart) / phaseDur);
      var ease = 1 - Math.pow(1 - rp, 3);
      cat.x += (mouse.x - cat.x) * (0.07 + ease * 0.14);
      cat.y += (mouse.y - cat.y) * (0.07 + ease * 0.14);
      stretch = 1.12 - ease * 0.12;
      wiggle = Math.sin(now * 0.06) * 0.08 * (1 - ease);
      look += ((mouse.x > cat.x ? 0.4 : -0.4) - look) * 0.1;
      // 收绳：缩短 rest，不删点
      var pin = ropeAnchorOnCat();
      if (rope.length > 2) {
        var targetRest = ROPE_REST * (1 - ease * 0.75);
        for (var ri = 0; ri < 3; ri++) {
          updateRope(pin, mouse, 1);
          // 临时压短：把中段往两端拉
          for (var i = 1; i < rope.length - 1; i++) {
            var tp = i / (rope.length - 1);
            rope[i].x += (pin.x + (mouse.x - pin.x) * tp - rope[i].x) * (0.05 + ease * 0.12);
            rope[i].y += (pin.y + (mouse.y - pin.y) * tp - rope[i].y) * (0.05 + ease * 0.12);
          }
        }
        void targetRest;
      }
      updateRope(pin, mouse, 1);
      if (rp >= 1) {
        state = STATE.FADE;
        phaseStart = now;
        phaseDur = 680;
        expression = "idle";
      }
    } else if (state === STATE.FADE) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.alpha = 1 - fp;
      cat.scale = Math.max(0, (cat.scale || 1) * (1 - fp * 0.5));
      if (moveDuration >= MIN_SHOW_MS) cat.y -= dt * 10;
      wiggle = Math.sin(now * 0.08) * 0.05 * (1 - fp);
      if (rope.length) {
        updateRope(ropeAnchorOnCat(), mouse, 1);
        drawRopePath(rope, (1 - fp) * 0.45);
      }
      if (fp >= 1) resetSession();
    }

    if (state !== STATE.IDLE && state !== STATE.TRACK && state !== STATE.SNAP) {
      if (rope.length) drawRopePath(rope, cat.alpha);
    }
    if (state !== STATE.IDLE && state !== STATE.TRACK) {
      drawCat();
      drawSweat();
    }

    if (state === STATE.IDLE && !bits.length && !sweat.length) {
      running = false;
      ctx.clearRect(0, 0, W, H);
      return;
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
    window.removeEventListener("mouseup", onMouseUp);
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
    window.addEventListener("mouseup", onMouseUp, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    reducedListener = function (e) { if (e.matches) destroy(); };
    prefersReduced.addEventListener("change", reducedListener);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
