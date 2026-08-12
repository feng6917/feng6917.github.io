/**
 * 胖橘拖拽吐口水
 * - 按下不触发；滑动满 1s 才在起点出现（不足 1s 不显示）
 * - 不画线；停手后沿隐藏轨迹挣扎拽到停止点
 * - 消失前放大 2 倍，朝屏幕吐口水，水花四溅
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = { IDLE: 0, TRACK: 1, SHOW: 2, DRAG: 3, SPIT: 4, FADE: 5 };

  var CAT_SIZE = 78;
  var IDLE_MS = 320;
  var MIN_SHOW_MS = 1000;
  var MOVE_EPS = 2.2;
  var PATH_MIN_DIST = 4;
  var PATH_MAX = 600;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var start = { x: 0, y: 0 };
  var path = [];
  var pathLen = 0;
  var cumLen = [];
  var cat = { x: 0, y: 0, scale: 0, alpha: 1, angle: 0, stretch: 1, squash: 1 };
  var state = STATE.IDLE;
  var moveStart = 0;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var moveDuration = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var breath = 0;
  var blinkT = 0;
  var nextBlink = 1.5 + Math.random() * 2;
  var lookX = 0;
  var lookY = -0.15;
  var bob = 0;
  var pawPhase = 0;
  var snot = 0.55;
  var mouthOpen = 0;
  var spitBlob = null;
  var splashes = [];
  var sweat = [];
  var dust = [];
  var reducedListener;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }
  function easeOut(p) { return 1 - Math.pow(1 - p, 2); }
  function easeIn(p) { return p * p; }
  function easeInOut(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
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
    path = [];
    pathLen = 0;
    cumLen = [];
    sweat = [];
    dust = [];
    splashes = [];
    spitBlob = null;
    mouthOpen = 0;
    snot = 0.55;
    cat.scale = 0;
    cat.alpha = 0;
    cat.stretch = 1;
    cat.squash = 1;
    cat.angle = 0;
    lookX = 0;
    lookY = -0.15;
  }

  function rebuildCumLen() {
    cumLen = [0];
    pathLen = 0;
    for (var i = 1; i < path.length; i++) {
      var dx = path[i].x - path[i - 1].x;
      var dy = path[i].y - path[i - 1].y;
      pathLen += Math.sqrt(dx * dx + dy * dy);
      cumLen.push(pathLen);
    }
  }

  function pointAt(dist) {
    if (!path.length) return { x: cat.x, y: cat.y, tx: 1, ty: 0 };
    if (path.length === 1 || pathLen <= 0) {
      return { x: path[0].x, y: path[0].y, tx: 1, ty: 0 };
    }
    dist = clamp(dist, 0, pathLen);
    var i = 1;
    while (i < cumLen.length && cumLen[i] < dist) i++;
    var i0 = i - 1;
    var i1 = Math.min(i, path.length - 1);
    var seg = cumLen[i1] - cumLen[i0] || 1;
    var p = (dist - cumLen[i0]) / seg;
    var a = path[i0];
    var b = path[i1];
    var tx = b.x - a.x;
    var ty = b.y - a.y;
    var tl = Math.sqrt(tx * tx + ty * ty) || 1;
    return {
      x: lerp(a.x, b.x, p),
      y: lerp(a.y, b.y, p),
      tx: tx / tl,
      ty: ty / tl,
    };
  }

  function pushPath(x, y) {
    if (!path.length) {
      path.push({ x: x, y: y });
      rebuildCumLen();
      return;
    }
    var last = path[path.length - 1];
    var dx = x - last.x;
    var dy = y - last.y;
    if (dx * dx + dy * dy < PATH_MIN_DIST * PATH_MIN_DIST) return;
    path.push({ x: x, y: y });
    if (path.length > PATH_MAX) path.shift();
    rebuildCumLen();
  }

  function spawnVisible() {
    cat.x = clamp(start.x, CAT_SIZE * 0.45, W - CAT_SIZE * 0.45);
    cat.y = clamp(start.y, CAT_SIZE * 0.45, H - CAT_SIZE * 0.45);
    cat.scale = 0;
    cat.alpha = 1;
    cat.angle = 0;
    cat.stretch = 1;
    cat.squash = 1;
    lookX = 0;
    lookY = -0.2;
    snot = 0.4 + Math.random() * 0.3;
    mouthOpen = 0;
  }

  function beginTrack(x, y, now) {
    start.x = x;
    start.y = y;
    lastX = x;
    lastY = y;
    moveStart = now;
    lastMove = now;
    path = [{ x: x, y: y }];
    rebuildCumLen();
    state = STATE.TRACK;
    cat.alpha = 0;
    cat.scale = 0;
    ensureLoop();
  }

  function enterStop(now) {
    moveDuration = Math.max(0, lastMove - moveStart);
    rebuildCumLen();

    // 不足 1 秒：不显示 / 直接清掉
    if (moveDuration < MIN_SHOW_MS || state === STATE.TRACK) {
      resetAll();
      return;
    }

    state = STATE.DRAG;
    phaseStart = now;
    phaseDur = clamp(moveDuration / 3, 800, 3000);
    pawPhase = 0;
  }

  function burstSplash(cx, cy) {
    var i, ang, sp;
    for (i = 0; i < 42; i++) {
      ang = Math.random() * Math.PI * 2;
      sp = 3 + Math.random() * 14;
      splashes.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 2,
        r: 2 + Math.random() * 7,
        life: 1,
        g: 0.35 + Math.random() * 0.4,
      });
    }
    // 朝镜头扑面的大水花环
    for (i = 0; i < 16; i++) {
      ang = (i / 16) * Math.PI * 2;
      sp = 8 + Math.random() * 10;
      splashes.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 6 + Math.random() * 10,
        life: 1,
        g: 0.2,
      });
    }
  }

  function addSweat() {
    if (Math.random() > 0.45) return;
    sweat.push({
      x: cat.x + 18 + Math.random() * 8,
      y: cat.y - 24,
      vx: 0.6 + Math.random(),
      vy: -0.3 + Math.random() * 0.4,
      life: 1,
    });
  }

  function addDust() {
    dust.push({
      x: cat.x + (Math.random() - 0.5) * 22,
      y: cat.y + 22 + Math.random() * 6,
      vx: (Math.random() - 0.5) * 2,
      vy: -0.5 - Math.random(),
      life: 1,
      r: 1.5 + Math.random() * 2,
    });
  }

  function updateFX(dt) {
    var i, s;
    for (i = sweat.length - 1; i >= 0; i--) {
      s = sweat[i];
      s.x += s.vx;
      s.y += s.vy + 0.4;
      s.life -= dt * 1.6;
      if (s.life <= 0) sweat.splice(i, 1);
    }
    for (i = dust.length - 1; i >= 0; i--) {
      s = dust[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += 4 * dt;
      s.life -= dt * 1.8;
      if (s.life <= 0) dust.splice(i, 1);
    }
    for (i = splashes.length - 1; i >= 0; i--) {
      s = splashes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.g;
      s.vx *= 0.985;
      s.r *= 0.992;
      s.life -= dt * 1.15;
      if (s.life <= 0) splashes.splice(i, 1);
    }
    if (spitBlob) {
      spitBlob.t += dt;
      spitBlob.z = easeOut(clamp(spitBlob.t / spitBlob.dur, 0, 1));
      spitBlob.x = lerp(spitBlob.sx, W * 0.5, spitBlob.z);
      spitBlob.y = lerp(spitBlob.sy, H * 0.42, spitBlob.z);
      spitBlob.r = lerp(6, Math.min(W, H) * 0.22, spitBlob.z);
      if (spitBlob.z >= 1 && !spitBlob.burst) {
        spitBlob.burst = true;
        burstSplash(spitBlob.x, spitBlob.y);
      }
    }
  }

  function onMouseDown() {
    if (state === STATE.TRACK || state === STATE.SHOW || state === STATE.DRAG) {
      resetAll();
    }
  }

  function onMouseMove(e) {
    if (e.buttons !== 0) {
      if (state === STATE.TRACK || state === STATE.SHOW) resetAll();
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

    if (state === STATE.IDLE || (state === STATE.FADE && cat.alpha < 0.15 && !splashes.length)) {
      beginTrack(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.SPIT) {
      lastMove = now;
      return;
    }

    if (state === STATE.DRAG) {
      beginTrack(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.TRACK || state === STATE.SHOW) {
      if (dist >= MOVE_EPS) {
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
        pushPath(mouse.x, mouse.y);
      }
      if (state === STATE.TRACK && now - moveStart >= MIN_SHOW_MS) {
        spawnVisible();
        state = STATE.SHOW;
      }
    }
  }

  function drawCat(mode) {
    if (cat.alpha < 0.02 || cat.scale < 0.04) return;
    var size = CAT_SIZE * cat.scale;
    var blinking = blinkT < 0.12;
    var struggle = mode === "struggle";
    var spit = mode === "spit";

    ctx.save();
    ctx.translate(cat.x, cat.y + bob);
    ctx.rotate(cat.angle + (struggle ? Math.sin(pawPhase) * 0.1 : lookX * 0.06));
    // 吐口水时略俯冲朝镜头
    var lean = spit ? 1 + mouthOpen * 0.15 : 1;
    ctx.scale(cat.stretch * (size / CAT_SIZE) * lean, cat.squash * (size / CAT_SIZE) * lean);
    ctx.globalAlpha = cat.alpha;

    // 影
    ctx.beginPath();
    ctx.ellipse(0, 48, 26, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(50,30,10,0.16)";
    ctx.fill();

    // —— 大肚子 ——
    var belly = ctx.createRadialGradient(-6, 34, 4, 0, 38, 30);
    belly.addColorStop(0, "#ffe8c8");
    belly.addColorStop(0.45, "#f5c486");
    belly.addColorStop(1, "#e39a4a");
    ctx.fillStyle = belly;
    ctx.beginPath();
    ctx.ellipse(0, 36, 28, 24, 0, 0, Math.PI * 2);
    ctx.fill();
    // 肚皮高光
    ctx.fillStyle = "rgba(255,250,240,0.9)";
    ctx.beginPath();
    ctx.ellipse(0, 40, 16, 14, 0, 0, Math.PI * 2);
    ctx.fill();
    // 肚脐
    ctx.strokeStyle = "rgba(200,140,80,0.45)";
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    ctx.arc(0, 44, 2.2, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 小手
    var pawL = struggle ? -16 - Math.sin(pawPhase) * 11 : -14;
    var pawR = struggle ? 16 + Math.cos(pawPhase * 1.25) * 11 : 14;
    var pawY = struggle ? 28 + Math.sin(pawPhase * 1.1) * 5 : 32;
    ctx.fillStyle = "#f3c48a";
    ctx.beginPath();
    ctx.ellipse(pawL, pawY, 8, 6, -0.45, 0, Math.PI * 2);
    ctx.ellipse(pawR, pawY, 8, 6, 0.45, 0, Math.PI * 2);
    ctx.fill();

    // 头
    var headG = ctx.createRadialGradient(-8, -12, 6, 2, 0, 32);
    headG.addColorStop(0, "#ffe9c8");
    headG.addColorStop(0.5, "#f7c88a");
    headG.addColorStop(1, "#e8a85c");
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, -4, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 耳
    ctx.fillStyle = "#f0b56a";
    ctx.beginPath();
    ctx.ellipse(-20, -24, 8, 7, -0.35, 0, Math.PI * 2);
    ctx.ellipse(20, -24, 8, 7, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb7c5";
    ctx.beginPath();
    ctx.ellipse(-20, -24, 4, 3.5, -0.35, 0, Math.PI * 2);
    ctx.ellipse(20, -24, 4, 3.5, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 奶油脸
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(0, 5, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 腮红
    ctx.fillStyle = "rgba(255,64,88,0.78)";
    ctx.beginPath();
    ctx.ellipse(-15, 2, 7.5, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(15, 2, 7.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼
    var eyeY = -6;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-10, eyeY, 9.5, 11, -0.04, 0, Math.PI * 2);
    ctx.ellipse(10, eyeY, 9.5, 11, 0.04, 0, Math.PI * 2);
    ctx.fill();

    if (blinking && !struggle && !spit) {
      ctx.strokeStyle = "#3a2a20";
      ctx.lineWidth = 2.2;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-17, eyeY);
      ctx.quadraticCurveTo(-10, eyeY + 3, -3, eyeY);
      ctx.moveTo(3, eyeY);
      ctx.quadraticCurveTo(10, eyeY + 3, 17, eyeY);
      ctx.stroke();
    } else if (struggle) {
      ctx.strokeStyle = "#3a2a20";
      ctx.lineWidth = 2.4;
      ctx.beginPath();
      ctx.moveTo(-16, eyeY - 4);
      ctx.lineTo(-4, eyeY);
      ctx.lineTo(-16, eyeY + 4);
      ctx.moveTo(16, eyeY - 4);
      ctx.lineTo(4, eyeY);
      ctx.lineTo(16, eyeY + 4);
      ctx.stroke();
    } else if (spit) {
      // 用力眯眼
      ctx.strokeStyle = "#3a2a20";
      ctx.lineWidth = 2.6;
      ctx.beginPath();
      ctx.moveTo(-17, eyeY + 1);
      ctx.quadraticCurveTo(-10, eyeY - 3, -3, eyeY + 1);
      ctx.moveTo(3, eyeY + 1);
      ctx.quadraticCurveTo(10, eyeY - 3, 17, eyeY + 1);
      ctx.stroke();
    } else {
      var px = lookX * 5.5;
      var py = -0.8 + lookY * 4;
      ctx.fillStyle = "#2a1c14";
      ctx.beginPath();
      ctx.arc(-10 + px, eyeY + py, 3, 0, Math.PI * 2);
      ctx.arc(10 + px, eyeY + py, 3, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-9 + px, eyeY + py - 1.3, 1.1, 0, Math.PI * 2);
      ctx.arc(11 + px, eyeY + py - 1.3, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 鼻子
    ctx.fillStyle = "#4a3228";
    ctx.beginPath();
    ctx.ellipse(0, 4, 1.7, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();

    // —— 鼻涕泡 ——
    if (!spit || mouthOpen < 0.4) {
      var sn = snot * (0.85 + Math.sin(breath * 3.2) * 0.15);
      var bx = 3.5;
      var by = 7 + sn * 2;
      var br = 3.2 + sn * 5.5;
      var sg = ctx.createRadialGradient(bx - br * 0.25, by - br * 0.3, br * 0.1, bx, by, br);
      sg.addColorStop(0, "rgba(190,255,210,0.95)");
      sg.addColorStop(0.55, "rgba(120,220,160,0.75)");
      sg.addColorStop(1, "rgba(70,180,120,0.35)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(bx, by, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.75)";
      ctx.beginPath();
      ctx.arc(bx - br * 0.28, by - br * 0.32, br * 0.22, 0, Math.PI * 2);
      ctx.fill();
      // 鼻孔到泡的细丝
      ctx.strokeStyle = "rgba(100,200,140,0.55)";
      ctx.lineWidth = 1.2;
      ctx.beginPath();
      ctx.moveTo(1.2, 5.2);
      ctx.quadraticCurveTo(2.5, 6.5, bx, by - br * 0.85);
      ctx.stroke();
    }

    // 嘴
    ctx.strokeStyle = "#4a3228";
    ctx.lineWidth = 1.2;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (spit) {
      // 大张嘴吐
      ctx.fillStyle = "#5a2030";
      ctx.beginPath();
      ctx.ellipse(0, 12 + mouthOpen * 4, 5 + mouthOpen * 6, 3 + mouthOpen * 7, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8a9a";
      ctx.beginPath();
      ctx.ellipse(0, 14 + mouthOpen * 3, 3 + mouthOpen * 3, 1.5 + mouthOpen * 2, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (struggle) {
      ctx.moveTo(-3.5, 11);
      ctx.quadraticCurveTo(0, 8.5, 3.5, 11);
      ctx.stroke();
    } else {
      ctx.moveTo(0, 5.5);
      ctx.lineTo(0, 7.5);
      ctx.moveTo(0, 7.5);
      ctx.quadraticCurveTo(-3.2, 10, -5, 8.8);
      ctx.moveTo(0, 7.5);
      ctx.quadraticCurveTo(3.2, 10, 5, 8.8);
      ctx.stroke();
    }

    ctx.restore();
  }

  function drawFX() {
    var i, s;
    for (i = 0; i < sweat.length; i++) {
      s = sweat[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * cat.alpha;
      ctx.fillStyle = "#8fd0ea";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 3);
      ctx.quadraticCurveTo(s.x + 3, s.y + 1, s.x, s.y + 4.5);
      ctx.quadraticCurveTo(s.x - 3, s.y + 1, s.x, s.y - 3);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < dust.length; i++) {
      s = dust[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * 0.5;
      ctx.fillStyle = "#c9a06a";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    if (spitBlob && !spitBlob.burst) {
      ctx.save();
      ctx.globalAlpha = 0.55 + spitBlob.z * 0.4;
      var g = ctx.createRadialGradient(
        spitBlob.x - spitBlob.r * 0.2,
        spitBlob.y - spitBlob.r * 0.25,
        spitBlob.r * 0.1,
        spitBlob.x,
        spitBlob.y,
        spitBlob.r
      );
      g.addColorStop(0, "rgba(230,255,245,0.95)");
      g.addColorStop(0.45, "rgba(140,220,190,0.75)");
      g.addColorStop(1, "rgba(80,180,140,0.15)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(spitBlob.x, spitBlob.y, spitBlob.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,255,255,0.65)";
      ctx.beginPath();
      ctx.arc(spitBlob.x - spitBlob.r * 0.25, spitBlob.y - spitBlob.r * 0.3, spitBlob.r * 0.18, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < splashes.length; i++) {
      s = splashes[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * 0.85;
      var dg = ctx.createRadialGradient(s.x - s.r * 0.2, s.y - s.r * 0.2, 0, s.x, s.y, s.r);
      dg.addColorStop(0, "rgba(210,255,235,0.95)");
      dg.addColorStop(0.6, "rgba(120,210,180,0.7)");
      dg.addColorStop(1, "rgba(80,170,140,0.05)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * (0.7 + Math.random() * 0.05), 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  }

  function loop(now) {
    if (!running) return;
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.033, (now - (loop._last || now)) / 1000);
    loop._last = now;
    t += dt;
    breath += dt;

    blinkT += dt;
    if (blinkT > nextBlink) {
      blinkT = 0;
      nextBlink = 1.4 + Math.random() * 2.8;
    }

    // 鼻涕泡随呼吸胀缩
    if (state === STATE.SHOW || state === STATE.TRACK) {
      snot = clamp(snot + Math.sin(breath * 2.4) * dt * 0.35, 0.25, 1);
    }

    ctx.clearRect(0, 0, W, H);
    bob = Math.sin(breath * 2.6) * 1.5;
    updateFX(dt);

    if (state === STATE.TRACK) {
      if (now - lastMove > IDLE_MS) {
        // <1s 停手：不显示
        resetAll();
      }
    } else if (state === STATE.SHOW) {
      if (cat.scale < 1) cat.scale = Math.min(1.1, cat.scale + dt * 4.2);
      else if (cat.scale > 1) cat.scale = Math.max(1, cat.scale - dt * 2);
      cat.alpha = 1;
      lookX = Math.sin(breath * 1.2) * 0.3;
      lookY = -0.18 + Math.sin(breath * 0.9) * 0.08;
      cat.stretch = 1;
      cat.squash = 1 + Math.sin(breath * 2.6) * 0.025;
      cat.angle = 0;
      // 大肚子呼吸更明显
      cat.squash = 1 + Math.sin(breath * 2.2) * 0.04;
      drawCat("idle");
      if (now - lastMove > IDLE_MS) enterStop(now);
    } else if (state === STATE.DRAG) {
      var dp = Math.min(1, (now - phaseStart) / phaseDur);
      var travel = dp < 0.1 ? 0 : easeInOut((dp - 0.1) / 0.9);
      var along = pointAt(Math.max(pathLen, 1) * travel);
      // 路径太短则直线拽向鼠标落点
      if (pathLen < 20) {
        along = {
          x: lerp(cat.x, mouse.x, travel),
          y: lerp(start.y, mouse.y, travel),
          tx: mouse.x - start.x,
          ty: mouse.y - start.y,
        };
        // 修正：从起点插值
        along.x = lerp(start.x, mouse.x, travel);
        along.y = lerp(start.y, mouse.y, travel);
      }
      cat.x = along.x;
      cat.y = along.y;
      cat.angle = Math.atan2(along.ty || 0, along.tx || 1) * 0.35 + Math.sin(now * 0.03) * 0.12;
      cat.stretch = 1.1 + Math.sin(now * 0.04) * 0.08;
      cat.squash = 0.9 - Math.sin(now * 0.05) * 0.04;
      cat.scale = 1;
      cat.alpha = 1;
      pawPhase += dt * 14;
      bob = Math.sin(now * 0.04) * 2.5;
      snot = clamp(snot + dt * 0.8, 0.5, 1.2);
      addSweat();
      if (Math.random() < 0.45) addDust();
      drawCat("struggle");
      drawFX();

      if (dp >= 1) {
        state = STATE.SPIT;
        phaseStart = now;
        phaseDur = 1100;
        mouthOpen = 0;
        spitBlob = null;
        lookX = 0;
        lookY = 0;
        cat.angle = 0;
        cat.stretch = 1;
        cat.squash = 1;
      }
    } else if (state === STATE.SPIT) {
      var sp = Math.min(1, (now - phaseStart) / phaseDur);
      // 0~0.28 放大到 2 倍并张嘴；0.28 吐出飞向镜头；随后炸开水花并淡出
      if (sp < 0.28) {
        var z = easeOut(sp / 0.28);
        cat.scale = lerp(1, 2, z);
        mouthOpen = z;
        snot = Math.max(0, 0.8 - z);
        drawCat("spit");
      } else if (sp < 0.5) {
        cat.scale = 2;
        mouthOpen = 1;
        if (!spitBlob) {
          spitBlob = {
            sx: cat.x,
            sy: cat.y + 22,
            x: cat.x,
            y: cat.y + 22,
            r: 6,
            t: 0,
            dur: 0.22,
            z: 0,
            burst: false,
          };
        }
        var fadeEarly = sp > 0.42 ? (sp - 0.42) / 0.08 : 0;
        cat.alpha = 1 - fadeEarly * 0.35;
        drawCat("spit");
        drawFX();
      } else {
        cat.scale = 2;
        mouthOpen = 0.55;
        var fadeP = (sp - 0.5) / 0.5;
        cat.alpha = Math.max(0, 1 - easeIn(fadeP));
        if (cat.alpha > 0.02) drawCat("spit");
        drawFX();
      }

      if (sp >= 1) {
        cat.alpha = 0;
        drawFX();
        if (!splashes.length && (!spitBlob || spitBlob.burst)) {
          resetAll();
        }
      }
    } else if (state === STATE.FADE) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.alpha = 1 - fp;
      drawCat("idle");
      drawFX();
      if (fp >= 1) resetAll();
    }

    if (state === STATE.IDLE && !splashes.length) {
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
