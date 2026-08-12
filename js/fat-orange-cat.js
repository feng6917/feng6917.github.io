/**
 * 贱萌胖橘
 * - 满 1s 出现在滑动起点；不足 1s 不显示；不画线；按下不触发
 * - 出现 → 左看右看 → 拉扯挣扎 → 停手后沿轨迹慢慢回归 → 放大吐鼻涕泡，满屏慢溅
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = {
    IDLE: 0,
    TRACK: 1,
    APPEAR: 2,
    GLANCE: 3,
    TUG: 4,
    RETURN: 5,
    SPIT: 6,
  };

  var CAT_SIZE = 86;
  var IDLE_MS = 340;
  var MIN_SHOW_MS = 1000;
  var MOVE_EPS = 2.2;
  var PATH_MIN_DIST = 4;
  var PATH_MAX = 700;

  var canvas, ctx, raf = 0, running = false;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0 };
  var start = { x: 0, y: 0 };
  var path = [];
  var pathLen = 0;
  var cumLen = [];
  var cat = { x: 0, y: 0, scale: 0, alpha: 1, angle: 0, stretch: 1, squash: 1 };
  var home = { x: 0, y: 0 };
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
  var nextBlink = 1.6 + Math.random() * 2;
  var lookX = 0;
  var lookY = -0.12;
  var bob = 0;
  var pawPhase = 0;
  var snot = 0.7;
  var snotPhase = 0;
  var snotDir = 1;
  var mouthOpen = 0;
  var spitBlob = null;
  var splashes = [];
  var sweat = [];
  var pinL = { x: 0, y: 0 };
  var pinR = { x: 0, y: 0 };
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
    splashes = [];
    spitBlob = null;
    mouthOpen = 0;
    snot = 0.7;
    snotPhase = 0;
    snotDir = 1;
    cat.scale = 0;
    cat.alpha = 0;
    cat.stretch = 1;
    cat.squash = 1;
    cat.angle = 0;
    lookX = 0;
    lookY = -0.12;
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

  function beginTrack(x, y, now) {
    start.x = x;
    start.y = y;
    home.x = x;
    home.y = y;
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

  function spawnAppear() {
    home.x = clamp(start.x, CAT_SIZE * 0.5, W - CAT_SIZE * 0.5);
    home.y = clamp(start.y, CAT_SIZE * 0.5, H - CAT_SIZE * 0.5);
    cat.x = home.x;
    cat.y = home.y;
    // 爪子钉点：钉在出现位置两侧，之后身子被拽走爪子仍钉在这
    pinL.x = home.x - 22;
    pinL.y = home.y + 38;
    pinR.x = home.x + 22;
    pinR.y = home.y + 38;
    cat.scale = 0;
    cat.alpha = 1;
    cat.angle = 0;
    cat.stretch = 1;
    cat.squash = 1;
    lookX = 0;
    lookY = -0.15;
    snot = 0.45;
    snotPhase = 0;
    snotDir = 1;
    mouthOpen = 0;
  }

  /** 鼻涕泡吸溜吸溜：鼓胀慢、瘪下去稍快，忽大忽小 */
  function updateSnot(dt) {
    snotPhase += dt;
    // 主波 + 次波，制造「吸溜」不规则感
    var wave = Math.sin(snotPhase * 2.1) * 0.55 + Math.sin(snotPhase * 4.7) * 0.2;
    var target = 0.55 + wave * 0.55;
    // 鼓时慢跟，瘪时快跟
    var rate = target > snot ? 2.2 : 4.5;
    snot += (target - snot) * Math.min(1, dt * rate);
    snot = clamp(snot, 0.2, 1.35);
  }

  function enterReturn(now) {
    moveDuration = Math.max(0, lastMove - moveStart);
    rebuildCumLen();
    // 保证终点是鼠标停止处
    pushPath(mouse.x, mouse.y);
    state = STATE.RETURN;
    phaseStart = now;
    // 回归更慢：约 时长/2.2，夹在 1.6s ~ 4.8s
    phaseDur = clamp(moveDuration / 2.2, 1600, 4800);
    pawPhase = 0;
  }

  function burstSplash(cx, cy) {
    var i, ang, sp, dist;
    // 大量飞溅，铺满屏幕
    for (i = 0; i < 96; i++) {
      ang = Math.random() * Math.PI * 2;
      sp = 2 + Math.random() * 18;
      dist = 0.3 + Math.random();
      splashes.push({
        x: cx,
        y: cy,
        vx: Math.cos(ang) * sp * dist,
        vy: Math.sin(ang) * sp * dist - 1.5,
        r: 3 + Math.random() * 14,
        life: 1,
        decay: 0.22 + Math.random() * 0.28,
        g: 0.12 + Math.random() * 0.22,
      });
    }
    // 外圈大滴，直接甩向四边
    for (i = 0; i < 36; i++) {
      ang = (i / 36) * Math.PI * 2 + Math.random() * 0.2;
      sp = 10 + Math.random() * 16;
      splashes.push({
        x: cx + Math.cos(ang) * 20,
        y: cy + Math.sin(ang) * 20,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp,
        r: 8 + Math.random() * 18,
        life: 1,
        decay: 0.18 + Math.random() * 0.2,
        g: 0.08,
      });
    }
    // 慢飘小沫
    for (i = 0; i < 48; i++) {
      ang = Math.random() * Math.PI * 2;
      sp = 0.5 + Math.random() * 4;
      splashes.push({
        x: cx + (Math.random() - 0.5) * 80,
        y: cy + (Math.random() - 0.5) * 80,
        vx: Math.cos(ang) * sp,
        vy: Math.sin(ang) * sp - 0.5,
        r: 1.5 + Math.random() * 5,
        life: 1,
        decay: 0.12 + Math.random() * 0.15,
        g: 0.05,
      });
    }
  }

  function addSweat() {
    if (Math.random() > 0.4) return;
    sweat.push({
      x: cat.x + 20 + Math.random() * 10,
      y: cat.y - 28,
      vx: 0.5 + Math.random(),
      vy: -0.2 + Math.random() * 0.4,
      life: 1,
    });
  }

  function updateFX(dt) {
    var i, s;
    for (i = sweat.length - 1; i >= 0; i--) {
      s = sweat[i];
      s.x += s.vx;
      s.y += s.vy + 0.35;
      s.life -= dt * 1.3;
      if (s.life <= 0) sweat.splice(i, 1);
    }
    for (i = splashes.length - 1; i >= 0; i--) {
      s = splashes[i];
      s.x += s.vx;
      s.y += s.vy;
      s.vy += s.g;
      s.vx *= 0.99;
      s.r *= 0.997;
      s.life -= dt * s.decay;
      if (s.life <= 0 || s.r < 0.4) splashes.splice(i, 1);
    }
    if (spitBlob) {
      spitBlob.t += dt;
      spitBlob.z = easeOut(clamp(spitBlob.t / spitBlob.dur, 0, 1));
      spitBlob.x = lerp(spitBlob.sx, W * 0.5, spitBlob.z);
      spitBlob.y = lerp(spitBlob.sy, H * 0.4, spitBlob.z);
      spitBlob.r = lerp(8, Math.min(W, H) * 0.28, spitBlob.z);
      if (spitBlob.z >= 1 && !spitBlob.burst) {
        spitBlob.burst = true;
        burstSplash(spitBlob.x, spitBlob.y);
      }
    }
  }

  function onMouseDown() {
    if (state === STATE.TRACK || state === STATE.APPEAR || state === STATE.GLANCE || state === STATE.TUG) {
      resetAll();
    } else if (state === STATE.RETURN) {
      resetAll();
    }
  }

  function onMouseMove(e) {
    if (e.buttons !== 0) {
      if (state === STATE.TRACK || state === STATE.APPEAR || state === STATE.GLANCE || state === STATE.TUG) {
        resetAll();
      }
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

    if (state === STATE.IDLE || (state === STATE.SPIT && cat.alpha < 0.05 && !splashes.length && (!spitBlob || spitBlob.burst))) {
      beginTrack(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.SPIT) {
      lastMove = now;
      return;
    }

    if (state === STATE.RETURN) {
      beginTrack(mouse.x, mouse.y, now);
      return;
    }

    if (state === STATE.TRACK || state === STATE.APPEAR || state === STATE.GLANCE || state === STATE.TUG) {
      if (dist >= MOVE_EPS) {
        lastMove = now;
        lastX = mouse.x;
        lastY = mouse.y;
        pushPath(mouse.x, mouse.y);
      }
      if (state === STATE.TRACK && now - moveStart >= MIN_SHOW_MS) {
        spawnAppear();
        state = STATE.APPEAR;
        phaseStart = now;
        phaseDur = 380;
      }
    }
  }

  /**
   * 参考图胖橘：坐姿巨肚、白肚脐、三角耳、>< 贱脸、吸溜鼻涕泡
   * tug/struggle 时前爪在世界坐标钉死拉长
   */
  function drawCat(mode) {
    if (cat.alpha < 0.02 || cat.scale < 0.04) return;
    var size = CAT_SIZE * cat.scale;
    var blinking = blinkT < 0.12;
    var pinned = mode === "struggle" || mode === "tug";
    var spit = mode === "spit";
    var bellyPulse = 1 + Math.sin(breath * 2.2) * 0.035;

    // 先画钉在原地的拉长爪子（世界坐标）
    if (pinned) {
      drawPinnedArms(size);
    }

    ctx.save();
    ctx.translate(cat.x, cat.y + bob);
    ctx.rotate(cat.angle + (pinned ? Math.sin(pawPhase) * 0.08 : lookX * 0.07));
    var lean = spit ? 1 + mouthOpen * 0.1 : 1;
    ctx.scale(
      cat.stretch * (size / CAT_SIZE) * lean,
      cat.squash * (size / CAT_SIZE) * lean * bellyPulse
    );
    ctx.globalAlpha = cat.alpha;

    // 影
    ctx.beginPath();
    ctx.ellipse(0, 50, 28, 7, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(40, 25, 10, 0.16)";
    ctx.fill();

    // 尾巴（虎斑橘）
    var tw = Math.sin(breath * 3.2) * 8;
    ctx.strokeStyle = "#e88830";
    ctx.lineWidth = 10;
    ctx.lineCap = "round";
    ctx.beginPath();
    ctx.moveTo(20, 22);
    ctx.bezierCurveTo(38, 10 + tw, 46, 36 + tw * 0.4, 34, 46);
    ctx.stroke();
    ctx.strokeStyle = "#f5b45a";
    ctx.lineWidth = 5.5;
    ctx.beginPath();
    ctx.moveTo(20, 22);
    ctx.bezierCurveTo(38, 10 + tw, 46, 36 + tw * 0.4, 34, 46);
    ctx.stroke();
    // 尾斑
    ctx.strokeStyle = "rgba(200,90,20,0.45)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(28, 28);
    ctx.lineTo(32, 36);
    ctx.stroke();

    // 后腿外撇（坐姿）
    ctx.fillStyle = "#ef9a38";
    ctx.beginPath();
    ctx.ellipse(-24, 42, 14, 11, -0.35, 0, Math.PI * 2);
    ctx.ellipse(24, 42, 14, 11, 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "rgba(255, 200, 170, 0.75)";
    ctx.beginPath();
    ctx.ellipse(-26, 46, 6, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(26, 46, 6, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 巨圆身子
    var body = ctx.createRadialGradient(-6, 26, 4, 2, 32, 34);
    body.addColorStop(0, "#ffd4a0");
    body.addColorStop(0.45, "#f5a94a");
    body.addColorStop(1, "#e07018");
    ctx.fillStyle = body;
    ctx.beginPath();
    ctx.ellipse(0, 30, 30, 26, 0, 0, Math.PI * 2);
    ctx.fill();

    // 身侧虎斑
    ctx.strokeStyle = "rgba(205, 95, 25, 0.42)";
    ctx.lineWidth = 2.3;
    ctx.lineCap = "round";
    [[-16, 14, -10, 34], [12, 12, 16, 32], [-4, 10, 0, 36]].forEach(function (l) {
      ctx.beginPath();
      ctx.moveTo(l[0], l[1]);
      ctx.quadraticCurveTo((l[0] + l[2]) / 2 + 2, (l[1] + l[3]) / 2, l[2], l[3]);
      ctx.stroke();
    });

    // 大白肚 + 肚脐（参考图核心）
    ctx.fillStyle = "#fff9f2";
    ctx.beginPath();
    ctx.ellipse(0, 34, 17, 15, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(210, 150, 100, 0.55)";
    ctx.lineWidth = 1.4;
    ctx.beginPath();
    ctx.arc(0, 38, 2.6, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // 闲置时小爪搭在肚上；拉扯时肩部只留短茬（长爪在世界坐标画）
    if (!pinned) {
      ctx.fillStyle = "#f0b056";
      ctx.beginPath();
      ctx.ellipse(-10, 28, 8, 6.5, -0.4, 0, Math.PI * 2);
      ctx.ellipse(10, 28, 8, 6.5, 0.4, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 205, 185, 0.9)";
      ctx.beginPath();
      ctx.ellipse(-10, 29, 4, 3, 0, 0, Math.PI * 2);
      ctx.ellipse(10, 29, 4, 3, 0, 0, Math.PI * 2);
      ctx.fill();
    } else {
      // 肩部连接点
      ctx.fillStyle = "#f0b056";
      ctx.beginPath();
      ctx.ellipse(-14, 22, 6, 5, 0, 0, Math.PI * 2);
      ctx.ellipse(14, 22, 6, 5, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // 头
    var head = ctx.createRadialGradient(-8, -16, 4, 0, -4, 28);
    head.addColorStop(0, "#ffe2b5");
    head.addColorStop(0.5, "#f6b45a");
    head.addColorStop(1, "#e88828");
    ctx.fillStyle = head;
    ctx.beginPath();
    ctx.ellipse(0, -8, 26, 24, 0, 0, Math.PI * 2);
    ctx.fill();

    // 尖耳 + 粉内
    ctx.fillStyle = "#f0a848";
    ctx.beginPath();
    ctx.moveTo(-16, -22);
    ctx.lineTo(-24, -40);
    ctx.lineTo(-5, -28);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(16, -22);
    ctx.lineTo(24, -40);
    ctx.lineTo(5, -28);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = "#ffb0c0";
    ctx.beginPath();
    ctx.moveTo(-15, -24);
    ctx.lineTo(-20, -34);
    ctx.lineTo(-8, -27);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(15, -24);
    ctx.lineTo(20, -34);
    ctx.lineTo(8, -27);
    ctx.closePath();
    ctx.fill();

    // 额头纹
    ctx.strokeStyle = "rgba(200, 95, 25, 0.5)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-7, -24);
    ctx.lineTo(-3, -12);
    ctx.lineTo(0, -20);
    ctx.lineTo(3, -12);
    ctx.lineTo(7, -24);
    ctx.stroke();

    // 腮红
    ctx.fillStyle = "rgba(255, 120, 140, 0.5)";
    ctx.beginPath();
    ctx.ellipse(-13, 0, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.ellipse(13, 0, 5.5, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // 白嘴筒
    ctx.fillStyle = "#fffaf4";
    ctx.beginPath();
    ctx.ellipse(0, 2, 11, 8, 0, 0, Math.PI * 2);
    ctx.fill();

    // 眼睛
    var eyeY = -10;
    if (pinned || spit) {
      // >< 用力脸（参考图）
      ctx.strokeStyle = "#3d2918";
      ctx.lineWidth = 2.6;
      ctx.lineCap = "round";
      ctx.lineJoin = "round";
      ctx.beginPath();
      ctx.moveTo(-15, eyeY - 4);
      ctx.lineTo(-5, eyeY);
      ctx.lineTo(-15, eyeY + 4);
      ctx.moveTo(15, eyeY - 4);
      ctx.lineTo(5, eyeY);
      ctx.lineTo(15, eyeY + 4);
      ctx.stroke();
    } else if (blinking) {
      ctx.strokeStyle = "#3d2918";
      ctx.lineWidth = 2.1;
      ctx.beginPath();
      ctx.moveTo(-15, eyeY);
      ctx.quadraticCurveTo(-9, eyeY + 3, -3, eyeY);
      ctx.moveTo(3, eyeY);
      ctx.quadraticCurveTo(9, eyeY + 3, 15, eyeY);
      ctx.stroke();
    } else {
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.ellipse(-9, eyeY, 8, 9, 0.06, 0, Math.PI * 2);
      ctx.ellipse(9, eyeY, 8, 9, -0.06, 0, Math.PI * 2);
      ctx.fill();
      var px = lookX * 4.8;
      var py = lookY * 3.2;
      ctx.fillStyle = "#2c1810";
      ctx.beginPath();
      ctx.ellipse(-9 + px, eyeY + py, 3, 4, 0, 0, Math.PI * 2);
      ctx.ellipse(9 + px, eyeY + py, 3, 4, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#7ec8ff";
      ctx.beginPath();
      ctx.ellipse(-9 + px, eyeY + py + 0.6, 1.3, 1.8, 0, 0, Math.PI * 2);
      ctx.ellipse(9 + px, eyeY + py + 0.6, 1.3, 1.8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-8 + px, eyeY + py - 1.5, 1.1, 0, Math.PI * 2);
      ctx.arc(10 + px, eyeY + py - 1.5, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // 粉鼻
    ctx.fillStyle = "#ff8fab";
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(-2.6, 3.2);
    ctx.lineTo(2.6, 3.2);
    ctx.closePath();
    ctx.fill();

    // —— 吸溜鼻涕泡（忽大忽小）——
    if (!spit || mouthOpen < 0.3) {
      var br = 5 + snot * 11;
      var bx = 3.5;
      var by = 6 + snot * 4;
      // 轻微扁椭圆，更像泡
      var squash = 0.92 + Math.sin(snotPhase * 3.5) * 0.06;
      ctx.save();
      ctx.translate(bx, by);
      ctx.scale(1, squash);
      var sg = ctx.createRadialGradient(-br * 0.28, -br * 0.32, 0, 0, 0, br);
      sg.addColorStop(0, "rgba(220, 255, 230, 0.95)");
      sg.addColorStop(0.45, "rgba(140, 235, 180, 0.82)");
      sg.addColorStop(1, "rgba(70, 185, 130, 0.22)");
      ctx.fillStyle = sg;
      ctx.beginPath();
      ctx.arc(0, 0, br, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "rgba(90, 175, 130, 0.4)";
      ctx.lineWidth = 1.2;
      ctx.stroke();
      ctx.fillStyle = "rgba(255,255,255,0.85)";
      ctx.beginPath();
      ctx.arc(-br * 0.32, -br * 0.35, br * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // 鼻丝
      ctx.strokeStyle = "rgba(110, 200, 150, 0.55)";
      ctx.lineWidth = 1.4;
      ctx.beginPath();
      ctx.moveTo(1.2, 3.5);
      ctx.quadraticCurveTo(2.5, 5, bx, by - br * squash * 0.9);
      ctx.stroke();
    }

    // 嘴
    ctx.strokeStyle = "#3d2918";
    ctx.lineWidth = 1.35;
    ctx.lineCap = "round";
    ctx.beginPath();
    if (spit) {
      ctx.fillStyle = "#5a2030";
      ctx.beginPath();
      ctx.ellipse(0, 10 + mouthOpen * 5, 6 + mouthOpen * 7, 3.5 + mouthOpen * 8, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#ff8a9a";
      ctx.beginPath();
      ctx.ellipse(0, 12 + mouthOpen * 4, 3.5 + mouthOpen * 3, 2 + mouthOpen * 2.5, 0, 0, Math.PI * 2);
      ctx.fill();
    } else if (pinned) {
      ctx.moveTo(-4, 9);
      ctx.quadraticCurveTo(0, 6.5, 4, 9);
      ctx.stroke();
    } else {
      ctx.moveTo(-5, 7);
      ctx.quadraticCurveTo(-2.5, 10.5, 0, 7.5);
      ctx.quadraticCurveTo(2.5, 10.5, 5, 7);
      ctx.stroke();
    }

    ctx.restore();
  }

  /** 爪子钉在 pinL/pinR，从肩部橡皮筋式拉长 */
  function drawPinnedArms(size) {
    var scale = size / CAT_SIZE;
    // 肩部世界坐标（大致）
    var shL = {
      x: cat.x - 14 * scale * cat.stretch + Math.sin(cat.angle) * 8,
      y: cat.y + bob + 18 * scale * cat.squash,
    };
    var shR = {
      x: cat.x + 14 * scale * cat.stretch + Math.sin(cat.angle) * 8,
      y: cat.y + bob + 18 * scale * cat.squash,
    };

    ctx.save();
    ctx.globalAlpha = cat.alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    function arm(sh, pin, side) {
      var mx = (sh.x + pin.x) / 2 + side * 6;
      var my = (sh.y + pin.y) / 2 + 8 + Math.sin(pawPhase + side) * 3;
      // 爪臂
      ctx.strokeStyle = "#e89838";
      ctx.lineWidth = 11 * scale;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.quadraticCurveTo(mx, my, pin.x, pin.y);
      ctx.stroke();
      ctx.strokeStyle = "#f5b85a";
      ctx.lineWidth = 7 * scale;
      ctx.beginPath();
      ctx.moveTo(sh.x, sh.y);
      ctx.quadraticCurveTo(mx, my, pin.x, pin.y);
      ctx.stroke();
      // 钉死的肉垫
      ctx.fillStyle = "#f0b056";
      ctx.beginPath();
      ctx.ellipse(pin.x, pin.y, 10 * scale, 7.5 * scale, side * 0.2, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255, 200, 180, 0.9)";
      ctx.beginPath();
      ctx.ellipse(pin.x, pin.y + 1, 5 * scale, 3.5 * scale, 0, 0, Math.PI * 2);
      ctx.fill();
      // 钉痕小线
      ctx.strokeStyle = "rgba(160, 100, 50, 0.35)";
      ctx.lineWidth = 1.2;
      for (var k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(pin.x - 8 * scale + k * 5, pin.y + 6 * scale);
        ctx.lineTo(pin.x - 4 * scale + k * 5, pin.y + 11 * scale);
        ctx.stroke();
      }
    }

    arm(shL, pinL, -1);
    arm(shR, pinR, 1);
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
    if (spitBlob && !spitBlob.burst) {
      ctx.save();
      ctx.globalAlpha = 0.5 + spitBlob.z * 0.45;
      var g = ctx.createRadialGradient(
        spitBlob.x - spitBlob.r * 0.22,
        spitBlob.y - spitBlob.r * 0.28,
        spitBlob.r * 0.08,
        spitBlob.x,
        spitBlob.y,
        spitBlob.r
      );
      g.addColorStop(0, "rgba(235,255,245,0.95)");
      g.addColorStop(0.4, "rgba(140,225,185,0.8)");
      g.addColorStop(1, "rgba(70,170,130,0.1)");
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(spitBlob.x, spitBlob.y, spitBlob.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
    for (i = 0; i < splashes.length; i++) {
      s = splashes[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * 0.88;
      var dg = ctx.createRadialGradient(s.x - s.r * 0.2, s.y - s.r * 0.2, 0, s.x, s.y, s.r);
      dg.addColorStop(0, "rgba(220,255,240,0.95)");
      dg.addColorStop(0.55, "rgba(120,215,175,0.75)");
      dg.addColorStop(1, "rgba(70,160,130,0.05)");
      ctx.fillStyle = dg;
      ctx.beginPath();
      ctx.ellipse(s.x, s.y, s.r, s.r * 0.78, s.vx * 0.05, 0, Math.PI * 2);
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
      nextBlink = 1.5 + Math.random() * 2.6;
    }

    ctx.clearRect(0, 0, W, H);
    bob = Math.sin(breath * 2.5) * 1.8;
    updateFX(dt);
    if (state !== STATE.IDLE && state !== STATE.TRACK && state !== STATE.SPIT) {
      updateSnot(dt);
    }

    if (state === STATE.TRACK) {
      if (now - lastMove > IDLE_MS) resetAll();
    } else if (state === STATE.APPEAR) {
      var ap = Math.min(1, (now - phaseStart) / phaseDur);
      cat.scale = easeOut(ap) * 1.12;
      if (ap >= 1) {
        cat.scale = 1;
        state = STATE.GLANCE;
        phaseStart = now;
        phaseDur = 1400;
        lookX = 0;
      }
      drawCat("idle");
    } else if (state === STATE.GLANCE) {
      var gp = (now - phaseStart) / phaseDur;
      cat.scale = 1;
      cat.alpha = 1;
      if (gp < 0.38) {
        lookX = lerp(0, -1, easeOut(gp / 0.38));
        lookY = -0.08;
        cat.angle = lookX * 0.08;
      } else if (gp < 0.78) {
        lookX = lerp(-1, 1, easeInOut((gp - 0.38) / 0.4));
        lookY = -0.08;
        cat.angle = lookX * 0.08;
      } else {
        lookX = lerp(1, 0, easeIn((gp - 0.78) / 0.22));
        cat.angle = lookX * 0.08;
      }
      drawCat("idle");
      if (gp >= 1) {
        state = STATE.TUG;
        lookX = 0;
        pawPhase = 0;
      }
      if (now - lastMove > IDLE_MS) enterReturn(now);
    } else if (state === STATE.TUG) {
      // 身子被拽走，爪子钉在 pinL/pinR
      var dx = mouse.x - home.x;
      var dy = mouse.y - home.y;
      var dist = Math.sqrt(dx * dx + dy * dy) || 1;
      var pull = Math.min(70, 18 + dist * 0.22);
      cat.x = home.x + (dx / dist) * pull;
      cat.y = home.y + (dy / dist) * pull;
      cat.angle = Math.atan2(dy, dx) * 0.28 + Math.sin(now * 0.02) * 0.08;
      cat.stretch = 1.1 + Math.min(0.25, dist * 0.0018) + Math.sin(now * 0.035) * 0.05;
      cat.squash = 0.9 - Math.sin(now * 0.04) * 0.04;
      cat.scale = 1;
      cat.alpha = 1;
      pawPhase += dt * 10;
      bob = Math.sin(now * 0.035) * 2;
      lookX = (dx / dist) * 0.35;
      addSweat();
      drawCat("tug");
      drawFX();

      if (now - lastMove > IDLE_MS) enterReturn(now);
    } else if (state === STATE.RETURN) {
      var rp = Math.min(1, (now - phaseStart) / phaseDur);
      var travel = easeInOut(easeInOut(rp));
      var along;
      if (pathLen < 24) {
        along = {
          x: lerp(home.x, mouse.x, travel),
          y: lerp(home.y, mouse.y, travel),
          tx: mouse.x - home.x,
          ty: mouse.y - home.y,
        };
      } else {
        along = pointAt(pathLen * travel);
      }
      cat.x = along.x;
      cat.y = along.y;
      // 回归时爪子仍钉原处，臂越拉越长
      cat.angle = Math.atan2(along.ty || 0, along.tx || 1) * 0.3 + Math.sin(now * 0.025) * 0.08;
      cat.stretch = 1.14 + Math.sin(now * 0.03) * 0.06;
      cat.squash = 0.86 - Math.sin(now * 0.04) * 0.03;
      cat.scale = 1;
      cat.alpha = 1;
      pawPhase += dt * 11;
      bob = Math.sin(now * 0.03) * 2.2;
      addSweat();
      drawCat("struggle");
      drawFX();

      if (rp >= 1) {
        state = STATE.SPIT;
        phaseStart = now;
        phaseDur = 2600;
        mouthOpen = 0;
        spitBlob = null;
        cat.angle = 0;
        cat.stretch = 1;
        cat.squash = 1;
        lookX = 0;
      }
    } else if (state === STATE.SPIT) {
      var sp = Math.min(1, (now - phaseStart) / phaseDur);
      // 0~0.22 放大；0.22~0.42 吐出慢飞；之后炸开慢散 + 淡出
      if (sp < 0.22) {
        var z = easeOut(sp / 0.22);
        cat.scale = lerp(1, 2, z);
        mouthOpen = z;
        snot = Math.max(0, 1 - z * 1.2);
        drawCat("spit");
      } else if (sp < 0.42) {
        cat.scale = 2;
        mouthOpen = 1;
        if (!spitBlob) {
          spitBlob = {
            sx: cat.x,
            sy: cat.y + 26,
            x: cat.x,
            y: cat.y + 26,
            r: 8,
            t: 0,
            dur: 0.55,
            z: 0,
            burst: false,
          };
        }
        cat.alpha = 1;
        drawCat("spit");
        drawFX();
      } else {
        cat.scale = 2;
        mouthOpen = 0.5;
        var fadeP = (sp - 0.42) / 0.58;
        cat.alpha = Math.max(0, 1 - easeIn(fadeP * 1.1));
        if (cat.alpha > 0.03) drawCat("spit");
        drawFX();
      }

      if (sp >= 1) {
        cat.alpha = 0;
        drawFX();
        if (!splashes.length && (!spitBlob || spitBlob.burst)) resetAll();
      }
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
