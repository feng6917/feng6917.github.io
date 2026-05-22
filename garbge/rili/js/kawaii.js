/**
 * 二次元趣味交互：悬停小表情、点击飘字粒子
 */
const KawaiiFX = (() => {
  const TIPS = {
    today: [
      "今天的主角就是你 ✨",
      "今·日·宜·开·心 (ﾉ◕ヮ◕)ﾉ",
      "今日 CP：你和好运 ♡",
    ],
    rest: [
      "放假模式：HP 回满中~",
      "宜：睡觉、奶茶、追番",
      "今日成就：成功躺平 (￣▽￣)",
    ],
    work: [
      "调休上班…加油打工人！",
      "今日副本：早起 (；′⌒`)",
      "摸鱼倒计时已启动…",
    ],
    festival: [
      "节日快乐！撒花~ ★",
      "今日掉落：庆祝 BUFF",
      "宜：聚会、礼物、拍照",
    ],
    weekend: [
      "周末 BUFF 已加载 ♪",
      "宜：睡到自然醒~",
      "今日天气：适合发呆",
    ],
    default: [
      "点一下，解锁小惊喜 ✦",
      "这一格藏着星星~",
      "鼠标靠过来试试？",
      "平凡的一天也要发光",
      "宜：对自己好一点 ♡",
    ],
    birth: [
      "2026.1.22 小宝出生 ♡",
      "世界上最珍贵的一天 ✨",
      "宜：抱抱小宝、亲亲额头",
      "今日主角：小宝 👶",
      "撒花庆祝新生命~ (ﾉ◕ヮ◕)ﾉ",
    ],
  };

  const MASCOTS = {
    today: ["(ﾉ◕ヮ◕)ﾉ", "⭐", "🌟"],
    rest: ["😴", "🛏️", "🍵"],
    work: ["💼", "😤", "⚡"],
    festival: ["🎉", "🎊", "🎀"],
    weekend: ["🎮", "🌸", "☁️"],
    birth: ["👶", "🍼", "♡", "🌟", "💕"],
    default: ["✨", "♡", "★", "🌷", "💫", "🔮"],
  };

  const CLICK_PARTICLES = ["♡", "✦", "★", "✧", "🌸", "⭐", "💕", "🎀"];

  const CLICK_LINES = {
    birth: [
      "小宝出生日！撒花庆祝~ 👶",
      "最温柔的一天，永远记得 ♡",
      "欢迎来到世界，小宝！",
    ],
    default: [
      "叮~ 选中成功！撒花~",
      "咔嚓，记录这一天 📸",
      "运势 +1 ✨ 满屏花花！",
      "收到你的信号啦 ♡",
      "这一格被你点亮了~",
    ],
  };

  const CONFETTI_EMOJI = ["🌸", "🎀", "♡", "✦", "★", "💕", "✨", "🌷", "⭐", "🎊"];

  const CONFETTI_PALETTE = {
    today: ["#b37feb", "#7c5cff", "#adc6ff", "#ffd666"],
    rest: ["#ff85c0", "#ffadd2", "#ff5c9a", "#ffc0cb"],
    work: ["#85a5ff", "#adc6ff", "#91d5ff", "#d3adf7"],
    festival: ["#ff85c0", "#ffd666", "#b37feb", "#ff5c9a", "#fff566"],
    weekend: ["#ffadd2", "#d3adf7", "#ffb7d5", "#ff85c0"],
    birth: ["#ffd666", "#ff85c0", "#fff566", "#ffadd2", "#ffe58f"],
    default: ["#ffb7d5", "#d3adf7", "#ff85c0", "#ffd666", "#adc6ff"],
  };

  let confettiLayer = null;

  function pick(arr) {
    return arr[Math.floor(Math.random() * arr.length)];
  }

  function getMood(ctx) {
    if (ctx.isBirth) return "birth";
    if (ctx.isToday) return "today";
    if (ctx.isRest) return "rest";
    if (ctx.isWork) return "work";
    if (ctx.hasFestival) return "festival";
    if (ctx.isWeekend) return "weekend";
    return "default";
  }

  function bindCell(cell, ctx) {
    const mood = getMood(ctx);
    cell.dataset.mood = mood;

    const mascot = document.createElement("span");
    mascot.className = "cell-mascot";
    mascot.textContent = pick(MASCOTS[mood]);
    mascot.setAttribute("aria-hidden", "true");

    const tip = document.createElement("span");
    tip.className = "cell-tip";
    tip.textContent = pick(TIPS[mood]);

    const layer = document.createElement("div");
    layer.className = "cell-fx-layer";
    layer.setAttribute("aria-hidden", "true");
    cell.append(mascot, tip, layer);

    cell.addEventListener("mouseenter", () => {
      if (!ctx.otherMonth) {
        tip.textContent = pick(TIPS[mood]);
        mascot.textContent = pick(MASCOTS[mood]);
      }
    });

    cell.addEventListener("click", (e) => {
      spawnParticles(cell, layer, mood);
      spawnConfettiRain(mood, e.clientX, e.clientY);
      cell.classList.add("is-pop");
      setTimeout(() => cell.classList.remove("is-pop"), 420);
      const lines = CLICK_LINES[mood] || CLICK_LINES.default;
      showHeaderSpark(e, pick(lines));
    });
  }

  function getConfettiLayer() {
    if (!confettiLayer) {
      confettiLayer =
        document.getElementById("confettiLayer") ||
        (() => {
          const el = document.createElement("div");
          el.id = "confettiLayer";
          el.className = "confetti-layer";
          el.setAttribute("aria-hidden", "true");
          document.body.appendChild(el);
          return el;
        })();
    }
    return confettiLayer;
  }

  function spawnConfettiRain(mood, clientX, clientY) {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    const layer = getConfettiLayer();
    const palette = CONFETTI_PALETTE[mood] || CONFETTI_PALETTE.default;
    const baseCount =
      mood === "birth"
        ? 72
        : mood === "festival"
          ? 58
          : mood === "today"
            ? 48
            : mood === "rest"
              ? 40
              : 34;

    const originX =
      typeof clientX === "number" ? (clientX / window.innerWidth) * 100 : 50;

    function addPiece(opts) {
      const piece = document.createElement("span");
      const isEmoji = opts.forceEmoji ?? Math.random() < 0.55;
      piece.className = isEmoji ? "confetti-piece confetti-emoji" : "confetti-piece confetti-shape";

      if (isEmoji) {
        piece.textContent = pick(CONFETTI_EMOJI);
      } else {
        const w = 6 + Math.random() * 8;
        const h = 4 + Math.random() * 6;
        piece.style.width = `${w}px`;
        piece.style.height = `${h}px`;
        piece.style.background = pick(palette);
        piece.style.borderRadius = Math.random() > 0.5 ? "2px" : "50%";
      }

      piece.style.left = `${opts.left}%`;
      piece.style.top = `${opts.top}px`;

      piece.style.setProperty("--dur", `${opts.dur}s`);
      piece.style.setProperty("--delay", `${opts.delay}s`);
      piece.style.setProperty("--sway", `${opts.sway}px`);
      piece.style.setProperty("--rot", `${opts.rot}deg`);
      piece.style.setProperty("--drift", `${opts.drift}px`);

      layer.appendChild(piece);
      piece.addEventListener("animationend", () => piece.remove(), { once: true });
    }

    const spread = 42;
    for (let i = 0; i < baseCount; i++) {
      const left = originX + (Math.random() - 0.5) * spread;
      addPiece({
        left: Math.max(0, Math.min(100, left)),
        top: -20 - Math.random() * 100,
        dur: 2.2 + Math.random() * 2.4,
        delay: Math.random() * 0.5,
        sway: (Math.random() - 0.5) * 180,
        rot: 360 + Math.random() * 720,
        drift: (Math.random() - 0.5) * 80,
      });
    }

    const rainExtra = 18;
    for (let i = 0; i < rainExtra; i++) {
      addPiece({
        left: Math.random() * 100,
        top: -40 - Math.random() * 120,
        dur: 2.8 + Math.random() * 2.2,
        delay: 0.1 + Math.random() * 0.8,
        sway: (Math.random() - 0.5) * 100,
        rot: 180 + Math.random() * 540,
        drift: (Math.random() - 0.5) * 40,
        forceEmoji: Math.random() < 0.7,
      });
    }

    layer.classList.add("is-active");
    clearTimeout(layer._idleTimer);
    layer._idleTimer = setTimeout(() => layer.classList.remove("is-active"), 5000);
  }

  function spawnParticles(cell, layer, mood) {
    layer.innerHTML = "";
    const colors =
      mood === "rest"
        ? ["#ff85c0", "#ffadd2"]
        : mood === "work"
          ? ["#adc6ff", "#85a5ff"]
          : ["#ffb7d5", "#d3adf7", "#ffd666"];

    const count = 5 + Math.floor(Math.random() * 4);
    const rect = cell.getBoundingClientRect();

    for (let i = 0; i < count; i++) {
      const p = document.createElement("span");
      p.className = "fx-particle";
      p.textContent = pick(CLICK_PARTICLES);
      p.style.color = pick(colors);
      p.style.left = `${20 + Math.random() * 60}%`;
      p.style.setProperty("--dx", `${(Math.random() - 0.5) * 48}px`);
      p.style.setProperty("--dy", `${-28 - Math.random() * 36}px`);
      p.style.animationDelay = `${i * 0.04}s`;
      layer.appendChild(p);
    }

    setTimeout(() => {
      layer.innerHTML = "";
    }, 900);
  }

  let sparkTimer = null;

  function showHeaderSpark(e, line) {
    const el = document.getElementById("headerSpark");
    if (!el) return;
    el.textContent = line;
    el.classList.add("is-show");
    clearTimeout(sparkTimer);
    sparkTimer = setTimeout(() => el.classList.remove("is-show"), 2200);

    const box = document.querySelector(".date-box");
    if (box) {
      box.classList.add("date-box-bounce");
      setTimeout(() => box.classList.remove("date-box-bounce"), 500);
    }
  }

  function decorateWeekday(span, isWeekend) {
    if (isWeekend) span.dataset.decor = "♡";
  }

  function bindGlobalCelebration() {
    const btn = document.getElementById("goToday");
    if (!btn) return;
    btn.addEventListener("click", () => {
      setTimeout(() => {
        spawnConfettiRain("today", window.innerWidth / 2, 120);
        showHeaderSpark(null, "欢迎回到今天~ 撒花庆祝！(ﾉ◕ヮ◕)ﾉ");
      }, 80);
    });
  }

  return {
    bindCell,
    decorateWeekday,
    pick,
    getMood,
    showHeaderSpark,
    spawnConfettiRain,
    bindGlobalCelebration,
  };
})();

document.addEventListener("DOMContentLoaded", () => {
  if (typeof KawaiiFX !== "undefined") KawaiiFX.bindGlobalCelebration();
});
