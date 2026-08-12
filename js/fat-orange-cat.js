/**
 * 胖橘拖绳：鼠标滑动出现萌系胖橘 + 不规则细绳；停下后按滑动时长绷断 / 拖回。
 * 规则：滑动 < 3s → 挣扎后绳子绷断；≥ 3s → 挣扎 duration/3 再把胖橘拖回并渐隐。
 */
(function () {
  "use strict";

  var prefersReduced = window.matchMedia("(prefers-reduced-motion: reduce)");
  if (prefersReduced.matches) return;
  if (window.matchMedia("(pointer: coarse)").matches && !window.matchMedia("(pointer: fine)").matches) {
    return;
  }

  var STATE = {
    HIDDEN: 0,
    FOLLOW: 1,
    STRUGGLE: 2,
    SNAP: 3,
    REEL: 4,
    FADE: 5,
  };

  var COLORS = {
    body: "#f5a45d",
    bodyDeep: "#e8893a",
    stripe: "#d97830",
    earIn: "#ffb7c5",
    eye: "#3d2b1f",
    nose: "#ff8fab",
    blush: "rgba(255,140,160,0.45)",
    rope: "#c4a574",
    ropeShadow: "rgba(120,90,50,0.35)",
    paw: "#ef9a4a",
  };

  var CAT_R = 22;
  var ROPE_SEGMENTS = 18;
  var IDLE_MS = 160;
  var SHORT_LIMIT = 3000;
  var APPEAR_DIST = 70;

  var canvas, ctx, raf = 0;
  var W = 0, H = 0;
  var mouse = { x: 0, y: 0, moved: false };
  var cat = { x: 0, y: 0, vx: 0, vy: 0, angle: 0, scale: 0, alpha: 1 };
  var rope = [];
  var state = STATE.HIDDEN;
  var moveStart = 0;
  var lastMove = 0;
  var moveDuration = 0;
  var phaseStart = 0;
  var phaseDur = 0;
  var t = 0;
  var blinkT = 0;
  var nextBlink = 2 + Math.random() * 3;
  var sweat = [];
  var bits = [];
  var snapRopes = null;
  var expression = "happy";
  var stretch = 1;
  var dig = 0;
  var wiggle = 0;

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

  function initRope(ax, ay, bx, by) {
    rope = [];
    for (var i = 0; i < ROPE_SEGMENTS; i++) {
      var p = i / (ROPE_SEGMENTS - 1);
      rope.push({
        x: ax + (bx - ax) * p,
        y: ay + (by - ay) * p,
        ox: ax + (bx - ax) * p,
        oy: ay + (by - ay) * p,
      });
    }
  }

  function spawnCatNearMouse() {
    var a = Math.random() * Math.PI * 2;
    cat.x = mouse.x + Math.cos(a) * APPEAR_DIST;
    cat.y = mouse.y + Math.sin(a) * APPEAR_DIST;
    cat.vx = 0;
    cat.vy = 0;
    cat.scale = 0;
    cat.alpha = 1;
    cat.angle = 0;
    stretch = 1;
    dig = 0;
    expression = "happy";
    initRope(cat.x, cat.y, mouse.x, mouse.y);
  }

  function updateRope(pinA, pinB, settle) {
    if (!rope.length) return;
    rope[0].x = pinA.x;
    rope[0].y = pinA.y;
    rope[rope.length - 1].x = pinB.x;
    rope[rope.length - 1].y = pinB.y;

    var i, n, dx, dy, dist, diff, nx, ny, segLen;
    var rest = 10;
    var iterations = settle ? 8 : 4;

    for (n = 0; n < iterations; n++) {
      for (i = 1; i < rope.length; i++) {
        var p = rope[i];
        var vx = (p.x - p.ox) * 0.96;
        var vy = (p.y - p.oy) * 0.96;
        p.ox = p.x;
        p.oy = p.y;
        p.x += vx;
        p.y += vy + (settle ? 0.12 : 0.35);
      }
      rope[0].x = pinA.x;
      rope[0].y = pinA.y;
      rope[rope.length - 1].x = pinB.x;
      rope[rope.length - 1].y = pinB.y;

      for (i = 0; i < rope.length - 1; i++) {
        var a = rope[i];
        var b = rope[i + 1];
        dx = b.x - a.x;
        dy = b.y - a.y;
        dist = Math.sqrt(dx * dx + dy * dy) || 0.001;
        segLen = rest + Math.sin(t * 3 + i * 0.55) * (settle ? 0.4 : 1.6);
        diff = (dist - segLen) / dist;
        nx = dx * 0.5 * diff;
        ny = dy * 0.5 * diff;
        if (i !== 0) {
          a.x += nx;
          a.y += ny;
        }
        if (i + 1 !== rope.length - 1) {
          b.x -= nx;
          b.y -= ny;
        }
      }
    }
  }

  function softFollow() {
    var dx = mouse.x - cat.x;
    var dy = mouse.y - cat.y;
    var dist = Math.sqrt(dx * dx + dy * dy) || 1;
    var ideal = 88 + Math.sin(t * 2.2) * 6;
    var pull = Math.max(0, dist - ideal) * 0.045;
    cat.vx += (dx / dist) * pull;
    cat.vy += (dy / dist) * pull;
    cat.vx *= 0.86;
    cat.vy *= 0.86;
    cat.x += cat.vx;
    cat.y += cat.vy;
    cat.angle = cat.vx * 0.04;
    stretch = 1 + Math.min(0.18, Math.abs(cat.vx) * 0.012);
    wiggle = Math.sin(t * 8) * Math.min(1, Math.abs(cat.vx) + Math.abs(cat.vy)) * 0.08;
  }

  function addSweat() {
    if (Math.random() > 0.35) return;
    sweat.push({
      x: cat.x + 8 + Math.random() * 10,
      y: cat.y - 10,
      vx: 0.4 + Math.random() * 0.6,
      vy: -0.2 + Math.random() * 0.4,
      life: 1,
    });
  }

  function updateSweat(dt) {
    for (var i = sweat.length - 1; i >= 0; i--) {
      var s = sweat[i];
      s.x += s.vx;
      s.y += s.vy + 0.4;
      s.life -= dt * 1.6;
      if (s.life <= 0) sweat.splice(i, 1);
    }
  }

  function breakRope() {
    var mid = Math.floor(rope.length / 2);
    snapRopes = [
      rope.slice(0, mid + 1).map(clonePt),
      rope.slice(mid).map(clonePt),
    ];
    bits = [];
    for (var i = 0; i < 10; i++) {
      var p = rope[mid] || { x: cat.x, y: cat.y };
      bits.push({
        x: p.x,
        y: p.y,
        vx: (Math.random() - 0.5) * 6,
        vy: (Math.random() - 0.8) * 5,
        rot: Math.random() * Math.PI,
        vr: (Math.random() - 0.5) * 0.4,
        life: 1,
        len: 4 + Math.random() * 8,
      });
    }
    rope = [];
  }

  function clonePt(p) {
    return { x: p.x, y: p.y, ox: p.x, oy: p.y, vx: (Math.random() - 0.5) * 2, vy: Math.random() * 1.5 };
  }

  function updateSnapBits(dt) {
    var i, j, seg, p;
    if (snapRopes) {
      for (i = 0; i < snapRopes.length; i++) {
        seg = snapRopes[i];
        for (j = 0; j < seg.length; j++) {
          p = seg[j];
          p.vy += 0.25;
          p.vx *= 0.98;
          p.x += p.vx;
          p.y += p.vy;
        }
      }
    }
    for (i = bits.length - 1; i >= 0; i--) {
      p = bits[i];
      p.vy += 0.28;
      p.x += p.vx;
      p.y += p.vy;
      p.rot += p.vr;
      p.life -= dt * 1.1;
      if (p.life <= 0) bits.splice(i, 1);
    }
  }

  function enterStruggle() {
    moveDuration = Math.max(0, lastMove - moveStart);
    state = STATE.STRUGGLE;
    phaseStart = performance.now();
    expression = "struggle";
    dig = 1;
    sweat = [];
    if (moveDuration < SHORT_LIMIT) {
      phaseDur = 420 + Math.random() * 180;
    } else {
      phaseDur = moveDuration / 3;
    }
  }

  function startFollow(now) {
    spawnCatNearMouse();
    state = STATE.FOLLOW;
    moveStart = now;
    cat.scale = 0;
    cat.alpha = 1;
    snapRopes = null;
    bits = [];
    sweat = [];
    expression = "happy";
    dig = 0;
    stretch = 1;
  }

  function onMouseMove(e) {
    mouse.x = e.clientX;
    mouse.y = e.clientY;
    mouse.moved = true;
    var now = performance.now();

    // 绷断 / 渐隐演出中不打断，结束后再召唤
    if (state === STATE.SNAP) {
      lastMove = now;
      return;
    }

    if (state === STATE.HIDDEN || (state === STATE.FADE && cat.alpha < 0.2)) {
      startFollow(now);
    } else if (state === STATE.STRUGGLE || state === STATE.REEL) {
      state = STATE.FOLLOW;
      moveStart = now;
      expression = "happy";
      dig = 0;
      stretch = 1;
      if (!rope.length) initRope(cat.x, cat.y, mouse.x, mouse.y);
    }

    lastMove = now;
  }

  function drawRopePath(points, alpha) {
    if (!points || points.length < 2) return;
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.strokeStyle = COLORS.ropeShadow;
    ctx.lineWidth = 2.8;
    ctx.beginPath();
    ctx.moveTo(points[0].x + 1, points[0].y + 1.5);
    for (var i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x + 1, points[i].y + 1.5);
    }
    ctx.stroke();
    ctx.strokeStyle = COLORS.rope;
    ctx.lineWidth = 2.2;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCat() {
    var s = cat.scale * CAT_R;
    if (s < 0.5 || cat.alpha <= 0) return;

    ctx.save();
    ctx.translate(cat.x, cat.y);
    ctx.rotate(cat.angle + wiggle);
    ctx.scale(s / CAT_R * stretch, s / CAT_R / Math.max(0.82, stretch * 0.92));
    ctx.globalAlpha = cat.alpha;

    // soft shadow
    ctx.beginPath();
    ctx.ellipse(0, 18, 16, 5, 0, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,0,0,0.12)";
    ctx.fill();

    // dig paws
    if (dig > 0.2) {
      ctx.fillStyle = COLORS.paw;
      ctx.beginPath();
      ctx.ellipse(-14, 14 + dig * 2, 5, 3.2, -0.2, 0, Math.PI * 2);
      ctx.ellipse(14, 14 + dig * 2, 5, 3.2, 0.2, 0, Math.PI * 2);
      ctx.fill();
      // scratch lines
      ctx.strokeStyle = "rgba(180,120,60,0.35)";
      ctx.lineWidth = 1;
      for (var k = -1; k <= 1; k++) {
        ctx.beginPath();
        ctx.moveTo(-18 + k * 3, 18);
        ctx.lineTo(-12 + k * 3, 22);
        ctx.moveTo(12 + k * 3, 18);
        ctx.lineTo(18 + k * 3, 22);
        ctx.stroke();
      }
    }

    // ears
    ctx.fillStyle = COLORS.body;
    ctx.beginPath();
    ctx.moveTo(-14, -10);
    ctx.lineTo(-20, -24);
    ctx.lineTo(-4, -16);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(14, -10);
    ctx.lineTo(20, -24);
    ctx.lineTo(4, -16);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.earIn;
    ctx.beginPath();
    ctx.moveTo(-13, -12);
    ctx.lineTo(-17, -20);
    ctx.lineTo(-7, -15);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(13, -12);
    ctx.lineTo(17, -20);
    ctx.lineTo(7, -15);
    ctx.closePath();
    ctx.fill();

    // body
    var grd = ctx.createRadialGradient(-4, -4, 4, 0, 2, 22);
    grd.addColorStop(0, "#ffc078");
    grd.addColorStop(0.55, COLORS.body);
    grd.addColorStop(1, COLORS.bodyDeep);
    ctx.fillStyle = grd;
    ctx.beginPath();
    ctx.ellipse(0, 2, 20, 17, 0, 0, Math.PI * 2);
    ctx.fill();

    // stripes
    ctx.strokeStyle = COLORS.stripe;
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.globalAlpha = cat.alpha * 0.55;
    [[-6, -6, -2, 4], [2, -8, 5, 3], [-1, 4, 2, 10]].forEach(function (l) {
      ctx.beginPath();
      ctx.moveTo(l[0], l[1]);
      ctx.quadraticCurveTo((l[0] + l[2]) / 2 + 2, (l[1] + l[3]) / 2, l[2], l[3]);
      ctx.stroke();
    });
    ctx.globalAlpha = cat.alpha;

    // cheeks
    ctx.fillStyle = COLORS.blush;
    ctx.beginPath();
    ctx.ellipse(-11, 4, 4.5, 2.8, 0, 0, Math.PI * 2);
    ctx.ellipse(11, 4, 4.5, 2.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // eyes
    var blinking = blinkT < 0.12;
    ctx.fillStyle = COLORS.eye;
    if (blinking) {
      ctx.lineWidth = 1.6;
      ctx.strokeStyle = COLORS.eye;
      ctx.beginPath();
      ctx.moveTo(-8, -1);
      ctx.lineTo(-4, -1);
      ctx.moveTo(4, -1);
      ctx.lineTo(8, -1);
      ctx.stroke();
    } else if (expression === "struggle") {
      // > < determined
      ctx.lineWidth = 1.8;
      ctx.strokeStyle = COLORS.eye;
      ctx.beginPath();
      ctx.moveTo(-9, -3);
      ctx.lineTo(-5, -1);
      ctx.lineTo(-9, 1);
      ctx.moveTo(9, -3);
      ctx.lineTo(5, -1);
      ctx.lineTo(9, 1);
      ctx.stroke();
    } else if (expression === "dizzy") {
      ctx.font = "10px sans-serif";
      ctx.textAlign = "center";
      ctx.fillText("✕", -6, 2);
      ctx.fillText("✕", 6, 2);
    } else {
      ctx.beginPath();
      ctx.ellipse(-6, -1, 2.6, 3.2, 0, 0, Math.PI * 2);
      ctx.ellipse(6, -1, 2.6, 3.2, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.beginPath();
      ctx.arc(-5.2, -2.2, 1.1, 0, Math.PI * 2);
      ctx.arc(6.8, -2.2, 1.1, 0, Math.PI * 2);
      ctx.fill();
    }

    // nose + mouth
    ctx.fillStyle = COLORS.nose;
    ctx.beginPath();
    ctx.moveTo(0, 2);
    ctx.lineTo(-2.2, 4.2);
    ctx.lineTo(2.2, 4.2);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = COLORS.eye;
    ctx.lineWidth = 1.2;
    ctx.beginPath();
    if (expression === "struggle") {
      ctx.moveTo(-3, 7);
      ctx.quadraticCurveTo(0, 5.5, 3, 7);
    } else {
      ctx.moveTo(0, 4.2);
      ctx.quadraticCurveTo(-3.5, 7.5, -5, 6);
      ctx.moveTo(0, 4.2);
      ctx.quadraticCurveTo(3.5, 7.5, 5, 6);
    }
    ctx.stroke();

    // 肉垫小手（跟随晃动时轻轻摆）
    if (dig < 0.2) {
      var pawSwing = Math.sin(t * 10) * 2;
      ctx.fillStyle = COLORS.paw;
      ctx.beginPath();
      ctx.ellipse(-12, 15, 4.2, 3, -0.3, 0, Math.PI * 2);
      ctx.ellipse(11, 15 + pawSwing * 0.15, 4.2, 3, 0.3, 0, Math.PI * 2);
      ctx.fill();
    }

    // 爱心小高光
    if (expression === "happy" && !blinking) {
      ctx.fillStyle = "rgba(255,255,255,0.95)";
      var sp = 0.7 + Math.sin(t * 6) * 0.3;
      ctx.beginPath();
      ctx.arc(14, -12, 1.2 * sp, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "rgba(255,150,180,0.85)";
      ctx.beginPath();
      ctx.arc(-16, -8, 1.4 * sp, 0, Math.PI * 2);
      ctx.fill();
    }

    // 铃铛项圈
    ctx.fillStyle = "#ff6b6b";
    ctx.beginPath();
    ctx.ellipse(0, 14, 7, 2.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = "#ffd666";
    ctx.beginPath();
    ctx.arc(0, 17, 2.4, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = "rgba(160,100,20,0.5)";
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.arc(0, 17, 1.1, 0.2, Math.PI);
    ctx.stroke();

    // 尾巴轻轻摇
    ctx.strokeStyle = COLORS.bodyDeep;
    ctx.lineWidth = 3.2;
    ctx.lineCap = "round";
    var tail = Math.sin(t * 5) * 6 + wiggle * 40;
    ctx.beginPath();
    ctx.moveTo(-16, 8);
    ctx.quadraticCurveTo(-28, 0 + tail * 0.3, -24 + tail * 0.15, -8 + tail * 0.2);
    ctx.stroke();

    ctx.restore();
  }

  function drawSweat() {
    for (var i = 0; i < sweat.length; i++) {
      var s = sweat[i];
      ctx.save();
      ctx.globalAlpha = Math.max(0, s.life) * cat.alpha;
      ctx.fillStyle = "#7ec8e3";
      ctx.beginPath();
      ctx.moveTo(s.x, s.y - 3);
      ctx.quadraticCurveTo(s.x + 3, s.y + 1, s.x, s.y + 4);
      ctx.quadraticCurveTo(s.x - 3, s.y + 1, s.x, s.y - 3);
      ctx.fill();
      ctx.restore();
    }
  }

  function drawBits() {
    for (var i = 0; i < bits.length; i++) {
      var b = bits[i];
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.globalAlpha = Math.max(0, b.life);
      ctx.strokeStyle = COLORS.rope;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(-b.len / 2, 0);
      ctx.lineTo(b.len / 2, 0);
      ctx.stroke();
      ctx.restore();
    }
  }

  function loop(now) {
    raf = requestAnimationFrame(loop);
    var dt = Math.min(0.033, (now - (loop._last || now)) / 1000);
    loop._last = now;
    t += dt;

    blinkT += dt;
    if (blinkT > nextBlink) {
      blinkT = 0;
      nextBlink = 2 + Math.random() * 3.5;
    }

    ctx.clearRect(0, 0, W, H);

    if (state === STATE.FOLLOW) {
      if (cat.scale < 1) {
        cat.scale = Math.min(1.08, cat.scale + dt * 5.2);
      } else if (cat.scale > 1) {
        cat.scale = Math.max(1, cat.scale - dt * 1.8);
      }
      softFollow();
      updateRope({ x: cat.x + 6, y: cat.y + 8 }, mouse, false);
      expression = "happy";
      dig = Math.max(0, dig - dt * 3);

      if (mouse.moved && now - lastMove > IDLE_MS) {
        enterStruggle();
      }
    } else if (state === STATE.STRUGGLE) {
      var p = Math.min(1, (now - phaseStart) / phaseDur);
      dig = 1;
      stretch = 1.08 + Math.sin(now * 0.04) * 0.06;
      wiggle = Math.sin(now * 0.05) * 0.12;
      cat.angle = -0.15 + Math.sin(now * 0.03) * 0.08;
      // lean away from mouse
      var dx = cat.x - mouse.x;
      var dy = cat.y - mouse.y;
      var d = Math.sqrt(dx * dx + dy * dy) || 1;
      cat.x += (dx / d) * 0.35;
      cat.y += (dy / d) * 0.35;
      updateRope({ x: cat.x + 6, y: cat.y + 8 }, mouse, false);
      addSweat();
      updateSweat(dt);

      if (p >= 1) {
        if (moveDuration < SHORT_LIMIT) {
          breakRope();
          state = STATE.SNAP;
          phaseStart = now;
          phaseDur = 900;
          expression = "dizzy";
          dig = 0;
          cat.vx = (Math.random() - 0.5) * 3;
          cat.vy = -2.5 - Math.random();
        } else {
          state = STATE.REEL;
          phaseStart = now;
          phaseDur = 900 + Math.min(900, moveDuration * 0.08);
          expression = "happy";
          dig = 0;
        }
      }
    } else if (state === STATE.SNAP) {
      var sp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.vy += 18 * dt;
      cat.x += cat.vx;
      cat.y += cat.vy;
      cat.angle += 0.12;
      cat.alpha = 1 - sp;
      cat.scale = 1 - sp * 0.35;
      updateSnapBits(dt);
      updateSweat(dt);
      if (snapRopes) {
        snapRopes.forEach(function (seg) {
          drawRopePath(seg, (1 - sp) * 0.85);
        });
      }
      drawBits();
      if (sp >= 1) {
        state = STATE.HIDDEN;
        cat.alpha = 0;
        snapRopes = null;
        bits = [];
        sweat = [];
      }
    } else if (state === STATE.REEL) {
      var rp = Math.min(1, (now - phaseStart) / phaseDur);
      var ease = 1 - Math.pow(1 - rp, 3);
      cat.x += (mouse.x - cat.x) * (0.08 + ease * 0.12);
      cat.y += (mouse.y - cat.y) * (0.08 + ease * 0.12);
      stretch = 1.15 - ease * 0.15;
      wiggle = Math.sin(now * 0.06) * 0.1 * (1 - ease);
      cat.angle = (mouse.x - cat.x) * 0.01;
      updateRope({ x: cat.x + 6, y: cat.y + 8 }, mouse, true);
      // shorten rope feel
      if (rope.length > 4 && rp > 0.35 && Math.random() > 0.6) {
        rope.splice(Math.floor(rope.length / 2), 1);
      }
      if (rp >= 1) {
        state = STATE.FADE;
        phaseStart = now;
        phaseDur = 700;
        expression = "happy";
      }
    } else if (state === STATE.FADE) {
      var fp = Math.min(1, (now - phaseStart) / phaseDur);
      cat.alpha = 1 - fp;
      cat.scale = 1 - fp * 0.4;
      cat.y -= dt * 12;
      wiggle = Math.sin(now * 0.08) * 0.06 * (1 - fp);
      if (rope.length) {
        updateRope({ x: cat.x + 6, y: cat.y + 8 }, mouse, true);
        drawRopePath(rope, (1 - fp) * 0.5);
      }
      if (fp >= 1) {
        state = STATE.HIDDEN;
        rope = [];
        cat.alpha = 0;
      }
    }

    if (state !== STATE.HIDDEN && state !== STATE.SNAP) {
      if (rope.length) drawRopePath(rope, cat.alpha);
    }
    if (state !== STATE.HIDDEN) {
      drawCat();
      drawSweat();
    }
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
    raf = requestAnimationFrame(loop);

    prefersReduced.addEventListener("change", function (e) {
      if (e.matches) destroy();
    });
  }

  function destroy() {
    cancelAnimationFrame(raf);
    window.removeEventListener("resize", resize);
    window.removeEventListener("mousemove", onMouseMove);
    if (canvas && canvas.parentNode) canvas.parentNode.removeChild(canvas);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
