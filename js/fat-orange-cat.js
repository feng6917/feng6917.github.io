/**
 * 胖橘轨迹拖拽
 * - 按下不触发；滑动即在起点出现胖橘，轨迹按真实路径绘制
 * - <2s 停手：左瞄一眼、右瞄一眼后消失
 * - ≥2s 停手：胖橘挣扎着沿轨迹被拉到鼠标停止处，再消失
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = { IDLE: 0, SHOW: 1, GLANCE: 2, DRAG: 3, FADE: 4 };

  var CAT_SIZE = 72;
  var IDLE_MS = 320;
  var DRAG_MIN_MS = 2000;
  var MOVE_EPS = 2.2;
  var PATH_MIN_DIST = 4;
  var PATH_MAX = 600;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var path = [];
  var pathLen = 0;
  var cumLen = [];
  var cat = {
    x: 0, y: 0, scale: 0, alpha: 1,
    angle: 0, stretch: 1, squash: 1,
  };
  var state = STATE.IDLE;
  var moveStart = 0;
  var lastMove = 0;
  var lastX = 0, lastY = 0;
  var moveDuration = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var dragProgress = 0;
  var t = 0;
  var breath = 0;
  var blinkT = 0;
  var nextBlink = 1.5 + Math.random() * 2;
  var lookX = 0;
  var lookY = -0.15;
  var bob = 0;
  var pawPhase = 0;
  var sweat = [];
  var dust = [];
  var reducedListener;

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function lerp(a, b, p) { return a + (b - a) * p; }

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
    if (path.length === 0) return { x: cat.x, y: cat.y, tx: 1, ty: 0 };
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
    if (path.length > PATH_MAX) {
      path.shift();
    }
    rebuildCumLen();
  }

  function spawnAt(x, y) {
    cat.x = clamp(x, CAT_SIZE * 0.4, W - CAT_SIZE * 0.4);
    cat.y = clamp(y, CAT_SIZE * 0.4, H - CAT_SIZE * 0.4);
    cat.scale = 0;
    cat.alpha = 1;
    cat.angle = 0;
    cat.stretch = 1;
    cat.squash = 1;
    lookX = 0;
    lookY = -0.2;
    path = [{ x: x, y: y }];
    rebuildCumLen();
  }

  function addSweat() {
    if (Math.random() > 0.45) return;
    sweat.push({
      x: cat.x + 16 + Math.random() * 10,
      y: cat.y - 22,
      vx: 0.6 + Math.random(),
      vy: -0.4 + Math.random() * 0.5,
      life: 1,
    });
  }

  function addDust() {
    dust.push({
      x: cat.x + (Math.random() - 0.5) * 20,
      y: cat.y + 18 + Math.random() * 6,
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
  }

  function enterStop(now) {
    moveDuration = Math.max(0, lastMove - moveStart);
    rebuildCumLen();

    if (moveDuration < DRAG_MIN_MS || path.length < 3 || pathLen < 28) {
      state = STATE.GLANCE;
      phaseStart = now;
      phaseDur = 1100;
      lookX = 0;
      lookY = -0.15;
      return;
    }

    state = STATE.DRAG;
    phaseStart = now;
    // 拖拽时长：滑动时长 / 3，夹在 0.9s ~ 3.2s
    phaseDur = clamp(moveDuration / 3, 900, 3200);
    dragProgress = 0;
    pawPhase = 0;
  }

  function beginShow(x, y, now) {
    spawnAt(x, y);
    state = STATE.SHOW;
    moveStart = now;
    lastMove = now;
    lastX = x;
    lastY = y;
    ensureLoop();
  }

  function onMouseDown() {
    if (state === STATE.SHOW || state === STATE.GLANCE) {
      resetAll();
    } else if (state === STATE.DRAG) {
      resetAll();
    }
  }

  function onMouseMove(e) {
    if (e.buttons !== 0) {
      if (state === STATE.SHOW) resetAll();
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

    if (state === STATE.IDLE || (state === STATE.FADE && cat.alpha < 0.2)) {
      beginShow(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.GLANCE || state === STATE.DRAG) {
      // 演出中再动：开新一段
      beginShow(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.SHOW) {
      if (dist >= MOVE_EPS) {
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
        pushPath(mouse.x, mouse.y);
      }
    }
  }

  function drawPath(untilDist, alpha) {
    if (path.length < 2) return;
    var maxD = untilDist == null ? pathLen : untilDist;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    // 阴影
    ctx.strokeStyle = "rgba(120,85,45,0.22)";
    ctx.lineWidth = 3.4;
    ctx.beginPath();
    var started = false;
    var i, d0, d1, a, b, cut, p;
    for (i = 0; i < path.length - 1; i++) {
      d0 = cumLen[i];
      d1 = cumLen[i + 1];
      if (d0 > maxD) break;
      a = path[i];
      b = path[i + 1];
      if (d1 <= maxD) {
        if (!started) { ctx.moveTo(a.x + 1, a.y + 1.5); started = true; }
        ctx.lineTo(b.x + 1, b.y + 1.5);
      } else {
        cut = (maxD - d0) / (d1 - d0 || 1);
        if (!started) { ctx.moveTo(a.x + 1, a.y + 1.5); started = true; }
        ctx.lineTo(lerp(a.x, b.x, cut) + 1, lerp(a.y, b.y, cut) + 1.5);
      }
    }
    if (started) ctx.stroke();

    // 主线：略有起伏的手绘感
    ctx.strokeStyle = "#d2a56a";
    ctx.lineWidth = 2.3;
    ctx.beginPath();
    started = false;
    for (i = 0; i < path.length - 1; i++) {
      d0 = cumLen[i];
      d1 = cumLen[i + 1];
      if (d0 > maxD) break;
      a = path[i];
      b = path[i + 1];
      var wobble = Math.sin(i * 0.9 + t * 2) * 0.6;
      var nx = -(b.y - a.y);
      var ny = b.x - a.x;
      var nl = Math.sqrt(nx * nx + ny * ny) || 1;
      nx = (nx / nl) * wobble;
      ny = (ny / nl) * wobble;
      if (d1 <= maxD) {
        if (!started) { ctx.moveTo(a.x, a.y); started = true; }
        ctx.lineTo(b.x + nx, b.y + ny);
      } else {
        cut = (maxD - d0) / (d1 - d0 || 1);
        p = { x: lerp(a.x, b.x, cut), y: lerp(a.y, b.y, cut) };
        if (!started) { ctx.moveTo(a.x, a.y); started = true; }
        ctx.lineTo(p.x + nx * cut, p.y + ny * cut);
      }
    }
    if (started) ctx.stroke();

    // 高光细线
    ctx.strokeStyle = "rgba(255,245,220,0.4)";
    ctx.lineWidth = 0.85;
    ctx.beginPath();
    started = false;
    for (i = 0; i < path.length - 1; i++) {
      d0 = cumLen[i];
      if (d0 > maxD) break;
      a = path[i];
      b = path[Math.min(i + 1, path.length - 1)];
      if (!started) { ctx.moveTo(a.x - 0.5, a.y - 0.5); started = true; }
      if (cumLen[Math.min(i + 1, cumLen.length - 1)] <= maxD) {
        ctx.lineTo(b.x - 0.5, b.y - 0.5);
      }
    }
    if (started) ctx.stroke();
    ctx.restore();
  }

  /** 按参考图手绘：大头、奶油嘴、大红腮红、滴溜眼珠；带呼吸/瞄看/挣扎 */
  function drawCatChibi(mode) {
    if (cat.alpha < 0.02 || cat.scale < 0.05) return;
    var size = CAT_SIZE * cat.scale;
    var blinking = blinkT < 0.12;
    var struggle = mode === "struggle";

    ctx.save();
    ctx.translate(cat.x, cat.y + bob);
    ctx.rotate(cat.angle + (struggle ? Math.sin(pawPhase) * 0.1 : lookX * 0.07));
    ctx.scale(cat.stretch * (size / CAT_SIZE), cat.squash * (size / CAT_SIZE));
    ctx.globalAlpha = cat.alpha;

    ctx.beginPath();
    ctx.ellipse(0, 38, 20, 6, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(50,30,10,0.15)";
    ctx.fill();

    drawCatFallback(struggle, blinking);
    ctx.restore();
  }

  function drawCatFallback(struggle, blinking) {
    // 身（小）
    var bodyG = ctx.createRadialGradient(-3, 28, 2, 0, 30, 18);
    bodyG.addColorStop(0, "#ffe6c2");
    bodyG.addColorStop(1, "#efb56a");
    ctx.fillStyle = bodyG;
    ctx.beginPath();
    ctx.ellipse(0, 30, 15, 12, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#fff8ee";
    ctx.beginPath();
    ctx.ellipse(0, 32, 8, 7, 0, 0, Math.PI * 2);
    ctx.fill();

    // 小手
    var pawL = struggle ? -12 - Math.sin(pawPhase) * 10 : -10;
    var pawR = struggle ? 12 + Math.cos(pawPhase * 1.25) * 10 : 10;
    var pawY = struggle ? 22 + Math.sin(pawPhase * 1.1) * 5 : 26;
    ctx.fillStyle = "#f3c48a";
    ctx.beginPath();
    ctx.ellipse(pawL, pawY, 7, 5.5, -0.5, 0, Math.PI * 2);
    ctx.ellipse(pawR, pawY, 7, 5.5, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // 头（超大圆）
    var headG = ctx.createRadialGradient(-8, -10, 6, 2, 2, 32);
    headG.addColorStop(0, "#ffe9c8");
    headG.addColorStop(0.5, "#f7c88a");
    headG.addColorStop(1, "#e8a85c");
    ctx.fillStyle = headG;
    ctx.beginPath();
    ctx.ellipse(0, -2, 28, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 圆耳
    ctx.fillStyle = "#f0b56a";
    ctx.beginPath();
    ctx.ellipse(-20, -22, 8, 7, -0.35, 0, Math.PI * 2);
    ctx.ellipse(20, -22, 8, 7, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffb7c5";
    ctx.beginPath();
    ctx.ellipse(-20, -22, 4, 3.5, -0.35, 0, Math.PI * 2);
    ctx.ellipse(20, -22, 4, 3.5, 0.35, 0, Math.PI * 2);
    ctx.fill();

    // 奶油脸
    ctx.fillStyle = "#fffaf3";
    ctx.beginPath();
    ctx.ellipse(0, 6, 13, 10, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大红腮红
    ctx.fillStyle = "rgba(255,64,88,0.78)";
    ctx.beginPath();
    ctx.ellipse(-15, 3, 7.5, 6.5, 0, 0, Math.PI * 2);
    ctx.ellipse(15, 3, 7.5, 6.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // 大眼白
    var eyeY = -5;
    ctx.fillStyle = "#fff";
    ctx.beginPath();
    ctx.ellipse(-10, eyeY, 9.5, 11, -0.04, 0, Math.PI * 2);
    ctx.ellipse(10, eyeY, 9.5, 11, 0.04, 0, Math.PI * 2);
    ctx.fill();

    if (blinking && !struggle) {
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
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(-16, eyeY - 4);
      ctx.lineTo(-4, eyeY);
      ctx.lineTo(-16, eyeY + 4);
      ctx.moveTo(16, eyeY - 4);
      ctx.lineTo(4, eyeY);
      ctx.lineTo(16, eyeY + 4);
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

    // 小鼻小嘴
    ctx.fillStyle = "#4a3228";
    ctx.beginPath();
    ctx.ellipse(0, 5, 1.7, 1.3, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "#4a3228";
    ctx.lineWidth = 1.15;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (struggle) {
      ctx.moveTo(-3.5, 11);
      ctx.quadraticCurveTo(0, 8.5, 3.5, 11);
    } else {
      ctx.moveTo(0, 6.3);
      ctx.lineTo(0, 8.2);
      ctx.moveTo(0, 8.2);
      ctx.quadraticCurveTo(-3.2, 10.5, -5, 9.2);
      ctx.moveTo(0, 8.2);
      ctx.quadraticCurveTo(3.2, 10.5, 5, 9.2);
    }
    ctx.stroke();
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
      ctx.globalAlpha = Math.max(0, s.life) * 0.55;
      ctx.fillStyle = "#c9a06a";
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
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

    ctx.clearRect(0, 0, W, H);
    bob = Math.sin(breath * 2.8) * 1.6;
    updateFX(dt);

    if (state === STATE.SHOW) {
      if (cat.scale < 1) cat.scale = Math.min(1.12, cat.scale + dt * 4.5);
      else if (cat.scale > 1) cat.scale = Math.max(1, cat.scale - dt * 2);
      cat.alpha = 1;
      // 跟随中微微把玩视线，不抢戏
      lookX = Math.sin(breath * 1.3) * 0.25;
      lookY = -0.2 + Math.sin(breath * 0.9) * 0.08;
      cat.stretch = 1;
      cat.squash = 1 + Math.sin(breath * 2.8) * 0.02;
      cat.angle = 0;

      drawPath(null, 0.95);
      drawCatChibi("idle");

      if (now - lastMove > IDLE_MS) enterStop(now);
    } else if (state === STATE.GLANCE) {
      var gp = (now - phaseStart) / phaseDur;
      // 0~0.35 左瞄，0.35~0.7 右瞄，0.7~1 回正并淡出
      if (gp < 0.32) {
        var g1 = gp / 0.32;
        lookX = lerp(0, -1, easeOut(g1));
        lookY = -0.1;
        cat.angle = lookX * 0.06;
      } else if (gp < 0.68) {
        var g2 = (gp - 0.32) / 0.36;
        lookX = lerp(-1, 1, easeInOut(g2));
        lookY = -0.1;
        cat.angle = lookX * 0.06;
      } else {
        var g3 = (gp - 0.68) / 0.32;
        lookX = lerp(1, 0, easeIn(g3));
        cat.alpha = 1 - g3;
        cat.scale = 1 - g3 * 0.25;
      }
      cat.squash = 1 + Math.sin(breath * 5) * 0.015;
      drawPath(null, cat.alpha * 0.7);
      drawCatChibi("idle");
      if (gp >= 1) resetAll();
    } else if (state === STATE.DRAG) {
      var dp = Math.min(1, (now - phaseStart) / phaseDur);
      // 先蓄力后仰再被拽走
      var travel = dp < 0.12 ? 0 : easeInOut((dp - 0.12) / 0.88);
      dragProgress = travel;
      var along = pointAt(pathLen * travel);
      cat.x = along.x;
      cat.y = along.y;
      cat.angle = Math.atan2(along.ty, along.tx) * 0.35 + Math.sin(now * 0.03) * 0.12;
      cat.stretch = 1.12 + Math.sin(now * 0.04) * 0.08;
      cat.squash = 0.88 - Math.sin(now * 0.05) * 0.04;
      pawPhase += dt * 14;
      bob = Math.sin(now * 0.04) * 2.5;
      addSweat();
      if (Math.random() < 0.5) addDust();

      // 已走过的轨迹变淡，前方还在
      drawPath(pathLen, 0.35 + (1 - travel) * 0.5);
      // 强调「还没被拖过的绳」
      drawPathRemaining(pathLen * travel, 0.95);
      drawCatChibi("struggle");
      drawFX();

      if (dp >= 1) {
        state = STATE.FADE;
        phaseStart = now;
        phaseDur = 550;
      }
    } else if (state === STATE.FADE) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.alpha = 1 - fp;
      cat.scale = 1 - fp * 0.35;
      cat.y -= dt * 8;
      cat.squash = 1 + fp * 0.1;
      drawPath(null, (1 - fp) * 0.4);
      drawCatChibi("idle");
      drawFX();
      if (fp >= 1) resetAll();
    }

    if (state === STATE.IDLE) {
      running = false;
      ctx.clearRect(0, 0, W, H);
    }
  }

  function drawPathRemaining(fromDist, alpha) {
    if (path.length < 2 || fromDist >= pathLen) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = "#e0b57a";
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    var started = false;
    for (var i = 0; i < path.length - 1; i++) {
      var d0 = cumLen[i];
      var d1 = cumLen[i + 1];
      if (d1 < fromDist) continue;
      var a = path[i];
      var b = path[i + 1];
      var x0 = a.x, y0 = a.y, x1 = b.x, y1 = b.y;
      if (d0 < fromDist) {
        var c = (fromDist - d0) / (d1 - d0 || 1);
        x0 = lerp(a.x, b.x, c);
        y0 = lerp(a.y, b.y, c);
      }
      if (!started) { ctx.moveTo(x0, y0); started = true; }
      else ctx.lineTo(x0, y0);
      ctx.lineTo(x1, y1);
    }
    if (started) ctx.stroke();
    ctx.restore();
  }

  function easeOut(p) { return 1 - Math.pow(1 - p, 2); }
  function easeIn(p) { return p * p; }
  function easeInOut(p) {
    return p < 0.5 ? 2 * p * p : 1 - Math.pow(-2 * p + 2, 2) / 2;
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
