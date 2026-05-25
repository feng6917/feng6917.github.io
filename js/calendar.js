/**
 * 国内版万年历：放假安排 / 起始日 / 休班 / 宜忌
 */

const WEEKDAY_NAMES = ["日", "一", "二", "三", "四", "五", "六"];
const WEEKDAY_HEADERS_MON = ["一", "二", "三", "四", "五", "六", "日"];
const WEEKDAY_HEADERS_SUN = ["日", "一", "二", "三", "四", "五", "六"];

function isSameDay(a, b) {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

function parseYmd(ymd) {
  const [y, m, d] = ymd.split("-").map(Number);
  return { y, m, d };
}

function formatMd(ymd) {
  const { m, d } = parseYmd(ymd);
  return `${m}月${d}日`;
}

/** 按 target 聚合全年放假数据 */
function groupYearHolidays(year) {
  const list = HolidayUtil.getHolidays(year) || [];
  const map = new Map();

  for (const h of list) {
    const target = h.getTarget();
    if (!map.has(target)) {
      map.set(target, {
        name: h.getName(),
        target,
        restDays: [],
        workDays: [],
      });
    }
    const g = map.get(target);
    const day = h.getDay();
    if (h.isWork()) g.workDays.push(day);
    else g.restDays.push(day);
  }

  return [...map.values()]
    .map((g) => {
      g.restDays.sort();
      g.workDays.sort();
      const restRange =
        g.restDays.length > 0
          ? `${formatMd(g.restDays[0])}-${formatMd(g.restDays[g.restDays.length - 1])}`
          : "";
      const workNote =
        g.workDays.length > 0
          ? `，调休上班${g.workDays.map((d) => formatMd(d)).join("、")}`
          : "";
      return {
        ...g,
        label: g.restDays.length
          ? `${g.name}（${restRange}${workNote}）`
          : `${g.name}（调休上班）`,
      };
    })
    .sort((a, b) => a.target.localeCompare(b.target));
}

function getDayInfo(y, m, d) {
  const solar = Solar.fromYmd(y, m, d);
  const lunar = solar.getLunar();
  const jieQi = lunar.getJieQi();
  const lunarFestivals = lunar.getFestivals() || [];
  const solarFestivals = solar.getFestivals() || [];
  const otherFestivals = solar.getOtherFestivals() || [];
  const festivals = [...lunarFestivals, ...solarFestivals, ...otherFestivals];

  let holiday = null;
  try {
    holiday = HolidayUtil.getHoliday(y, m, d);
  } catch (_) {
    holiday = null;
  }

  const special = typeof getSpecialDay === "function" ? getSpecialDay(y, m, d) : null;
  const babyAge =
    typeof getBabyAgeText === "function" ? getBabyAgeText(y, m, d) : null;

  const sub =
    special?.short ||
    jieQi ||
    (holiday ? holiday.getName() : "") ||
    festivals[0] ||
    lunar.getDayInChinese();

  const headerFestival =
    special?.title ||
    babyAge ||
    festivals[0] ||
    otherFestivals[0] ||
    jieQi ||
    "";

  return {
    solar,
    lunar,
    jieQi,
    festivals,
    holiday,
    special,
    babyAge,
    sub,
    lunarText: `农历 ${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhiText: `${lunar.getYearInGanZhi()} [${lunar.getYearShengXiao()}] 年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
    yi: lunar.getDayYi(),
    ji: lunar.getDayJi(),
    headerFestival,
  };
}

class CalendarApp {
  constructor() {
    this.today = new Date();
    this.today.setHours(0, 0, 0, 0);

    this.viewYear = this.today.getFullYear();
    this.viewMonth = this.today.getMonth() + 1;
    this.selected = new Date(this.today);
    this.weekStart = 1;
    /** all | hide | rest | work | target:YYYY-MM-DD */
    this.holidayFilter = "all";

    this.bindElements();
    this.fillYearMonthOptions();
    this.refreshHolidayFilterOptions();
    this.bindEvents();
    this.render();
    if (typeof KawaiiFX !== "undefined") {
      KawaiiFX.showHeaderSpark(null, "悬停日期格有惊喜，点一下会冒星星 ♡");
    }
  }

  bindElements() {
    this.$grid = document.getElementById("daysGrid");
    this.$weekdayRow = document.getElementById("weekdayRow");
    this.$headerWeekday = document.getElementById("headerWeekday");
    this.$headerDay = document.getElementById("headerDay");
    this.$headerYm = document.getElementById("headerYm");
    this.$headerMeta = document.getElementById("headerMeta");
    this.$todayTag = document.getElementById("todayTag");
    this.$headerFestival = document.getElementById("headerFestival");
    this.$yearSelect = document.getElementById("yearSelect");
    this.$monthSelect = document.getElementById("monthSelect");
    this.$holidayFilter = document.getElementById("holidayFilter");
    this.$weekStart = document.getElementById("weekStart");
    this.$holidayHint = document.getElementById("holidayHint");
    this.$lunarLine = document.getElementById("lunarLine");
    this.$ganzhiLine = document.getElementById("ganzhiLine");
    this.$yiText = document.getElementById("yiText");
    this.$jiText = document.getElementById("jiText");
  }

  fillYearMonthOptions() {
    const y0 = this.today.getFullYear();
    for (let y = y0 - 10; y <= y0 + 10; y++) {
      const opt = document.createElement("option");
      opt.value = String(y);
      opt.textContent = `${y}年`;
      this.$yearSelect.appendChild(opt);
    }
    for (let m = 1; m <= 12; m++) {
      const opt = document.createElement("option");
      opt.value = String(m);
      opt.textContent = `${m}月`;
      this.$monthSelect.appendChild(opt);
    }
  }

  refreshHolidayFilterOptions() {
    const prev = this.holidayFilter;
    const groups = groupYearHolidays(this.viewYear);

    this.$holidayFilter.innerHTML = "";

    const add = (value, text) => {
      const opt = document.createElement("option");
      opt.value = value;
      opt.textContent = text;
      this.$holidayFilter.appendChild(opt);
    };

    add("all", "显示全部");
    add("rest", "仅休息日");
    add("work", "仅调休上班");
    add("hide", "不显示");

    if (groups.length) {
      const og = document.createElement("optgroup");
      og.label = `${this.viewYear}年假期`;
      for (const g of groups) {
        const opt = document.createElement("option");
        opt.value = `target:${g.target}`;
        opt.textContent = g.label;
        og.appendChild(opt);
      }
      this.$holidayFilter.appendChild(og);
    }

    const hasPrev = [...this.$holidayFilter.options].some((o) => o.value === prev);
    this.holidayFilter = hasPrev ? prev : "all";
    this.$holidayFilter.value = this.holidayFilter;
    this.updateHolidayHint();
  }

  updateHolidayHint() {
    const mode = this.holidayFilter;
    if (mode === "all" || mode === "hide") {
      this.$holidayHint.hidden = true;
      return;
    }

    if (mode === "rest") {
      this.$holidayHint.hidden = false;
      this.$holidayHint.innerHTML =
        "当前筛选：<strong>仅休息日</strong>（显示「休」标记与放假底色）";
      return;
    }

    if (mode === "work") {
      this.$holidayHint.hidden = false;
      this.$holidayHint.innerHTML =
        "当前筛选：<strong>仅调休上班</strong>（显示「班」标记与灰色底色）";
      return;
    }

    if (mode.startsWith("target:")) {
      const target = mode.slice(7);
      const groups = groupYearHolidays(this.viewYear);
      const g = groups.find((x) => x.target === target);
      this.$holidayHint.hidden = false;
      this.$holidayHint.innerHTML = g
        ? `当前假期：<strong>${g.label}</strong>`
        : `当前假期：<strong>${target}</strong>`;
    }
  }

  /** 当前筛选下该日是否属于放假安排范围 */
  matchHolidayFilter(holiday, isRest, isWork) {
    const mode = this.holidayFilter;
    if (mode === "hide") return false;
    if (mode === "all") return Boolean(holiday);
    if (!holiday) return false;
    if (mode === "rest") return isRest;
    if (mode === "work") return isWork;
    if (mode.startsWith("target:")) {
      return holiday.getTarget() === mode.slice(7);
    }
    return Boolean(holiday);
  }

  bindEvents() {
    document.getElementById("prevMonth").addEventListener("click", () => this.shiftMonth(-1));
    document.getElementById("nextMonth").addEventListener("click", () => this.shiftMonth(1));
    document.getElementById("goToday").addEventListener("click", () => this.goToday());

    this.$yearSelect.addEventListener("change", () => {
      this.viewYear = Number(this.$yearSelect.value);
      this.refreshHolidayFilterOptions();
      this.render();
    });

    this.$monthSelect.addEventListener("change", () => {
      this.viewMonth = Number(this.$monthSelect.value);
      this.render();
    });

    this.$holidayFilter.addEventListener("change", () => {
      this.holidayFilter = this.$holidayFilter.value;
      this.updateHolidayHint();
      this.renderGrid();
    });

    this.$weekStart.addEventListener("change", () => {
      this.weekStart = Number(this.$weekStart.value);
      this.render();
    });
  }

  shiftMonth(delta) {
    let m = this.viewMonth + delta;
    let y = this.viewYear;
    if (m < 1) {
      m = 12;
      y -= 1;
    } else if (m > 12) {
      m = 1;
      y += 1;
    }
    this.viewYear = y;
    this.viewMonth = m;
    if (y !== Number(this.$yearSelect.value)) {
      this.refreshHolidayFilterOptions();
    }
    this.syncSelects();
    this.render();
  }

  goToday() {
    const prevYear = this.viewYear;
    this.viewYear = this.today.getFullYear();
    this.viewMonth = this.today.getMonth() + 1;
    this.selected = new Date(this.today);
    if (prevYear !== this.viewYear) {
      this.refreshHolidayFilterOptions();
    }
    this.syncSelects();
    this.render();
  }

  syncSelects() {
    this.$yearSelect.value = String(this.viewYear);
    this.$monthSelect.value = String(this.viewMonth);
  }

  render() {
    this.syncSelects();
    this.renderWeekdayRow();
    this.renderGrid();
    this.updateHeaderAndFooter(this.selected);
  }

  renderWeekdayRow() {
    const headers = this.weekStart === 1 ? WEEKDAY_HEADERS_MON : WEEKDAY_HEADERS_SUN;
    this.$weekdayRow.innerHTML = "";
    headers.forEach((label, i) => {
      const weekend =
        (this.weekStart === 1 && (i === 5 || i === 6)) ||
        (this.weekStart === 0 && (i === 0 || i === 6));
      const span = document.createElement("span");
      span.textContent = label;
      if (weekend) {
        span.classList.add("weekend");
        if (typeof KawaiiFX !== "undefined") KawaiiFX.decorateWeekday(span, true);
      }
      this.$weekdayRow.appendChild(span);
    });
  }

  getGridStart(y, m) {
    const first = new Date(y, m - 1, 1);
    let pad = first.getDay();
    if (this.weekStart === 1) {
      pad = pad === 0 ? 6 : pad - 1;
    }
    const start = new Date(y, m - 1, 1 - pad);
    start.setHours(0, 0, 0, 0);
    return start;
  }

  renderGrid() {
    const y = this.viewYear;
    const m = this.viewMonth;
    const daysInMonth = new Date(y, m, 0).getDate();
    const start = this.getGridStart(y, m);
    const showMarks = this.holidayFilter !== "hide";

    const first = new Date(y, m - 1, 1);
    let pad = first.getDay();
    if (this.weekStart === 1) pad = pad === 0 ? 6 : pad - 1;
    const totalCells = Math.ceil((pad + daysInMonth) / 7) * 7;

    this.$grid.innerHTML = "";

    for (let i = 0; i < totalCells; i++) {
      const date = new Date(start);
      date.setDate(start.getDate() + i);

      const cy = date.getFullYear();
      const cm = date.getMonth() + 1;
      const cd = date.getDate();
      const info = getDayInfo(cy, cm, cd);
      const otherMonth = cm !== m || cy !== y;

      const cell = document.createElement("button");
      cell.type = "button";
      cell.className = "day-cell";
      cell.setAttribute("role", "gridcell");
      cell.style.gridColumn = String((i % 7) + 1);
      cell.style.gridRow = String(Math.floor(i / 7) + 1);

      if (otherMonth) cell.classList.add("other-month");
      const dow = date.getDay();
      if (dow === 0 || dow === 6) cell.classList.add("weekend");

      const isToday = isSameDay(date, this.today);
      const isSelected = isSameDay(date, this.selected);
      if (isToday) cell.classList.add("is-today");
      if (isSelected) cell.classList.add("is-selected");

      const h = info.holiday;
      const isRest = h && !h.isWork();
      const isWork = h && h.isWork();
      const inFilter = this.matchHolidayFilter(h, isRest, isWork);
      const hasFestival = info.festivals.length > 0;
      const isBirth = Boolean(info.special);

      if (isBirth) cell.classList.add("is-birth");
      if (inFilter && isRest) cell.classList.add("is-rest");
      if (inFilter && isWork) cell.classList.add("is-work");
      if (hasFestival && !isRest && !isWork && !isBirth) cell.classList.add("is-festival");

      if (showMarks) {
        if (isBirth) {
          const badge = document.createElement("span");
          badge.className = "day-badge badge-bao";
          badge.textContent = info.special.badge || "宝";
          badge.title = info.special.title;
          cell.appendChild(badge);
        } else if (isToday) {
          const badge = document.createElement("span");
          badge.className = "day-badge badge-jin";
          badge.textContent = "今";
          cell.appendChild(badge);
        } else if (inFilter && isRest) {
          const badge = document.createElement("span");
          badge.className = "day-badge badge-xiu";
          badge.textContent = "休";
          cell.appendChild(badge);
        } else if (inFilter && isWork) {
          const badge = document.createElement("span");
          badge.className = "day-badge badge-ban";
          badge.textContent = "班";
          cell.appendChild(badge);
        }
      } else if (isToday) {
        const badge = document.createElement("span");
        badge.className = "day-badge badge-jin";
        badge.textContent = "今";
        cell.appendChild(badge);
      }

      const solar = document.createElement("span");
      solar.className = "solar";
      solar.textContent = String(cd);

      const sub = document.createElement("span");
      sub.className = "sub";
      sub.textContent = info.sub;
      sub.title = info.sub;

      cell.append(solar, sub);

      if (typeof KawaiiFX !== "undefined") {
        KawaiiFX.bindCell(cell, {
          isToday,
          isBirth,
          isRest: inFilter && isRest,
          isWork: inFilter && isWork,
          hasFestival,
          isWeekend: dow === 0 || dow === 6,
          otherMonth,
        });
      }

      cell.addEventListener("click", () => {
        this.selected = new Date(date);
        if (otherMonth) {
          this.viewYear = cy;
          this.viewMonth = cm;
          if (cy !== Number(this.$yearSelect.value)) {
            this.refreshHolidayFilterOptions();
          }
          this.syncSelects();
          this.renderGrid();
        } else {
          this.renderGrid();
        }
        this.updateHeaderAndFooter(this.selected);
      });

      this.$grid.appendChild(cell);
    }
  }

  updateHeaderAndFooter(date) {
    const y = date.getFullYear();
    const m = date.getMonth() + 1;
    const d = date.getDate();
    const info = getDayInfo(y, m, d);

    this.$headerWeekday.textContent = "星期" + WEEKDAY_NAMES[date.getDay()];
    this.$headerDay.textContent = String(d);
    this.$headerYm.textContent = `${y}年${m}月`;

    const dayOfYear = SolarUtil.getDaysInYear(y, m, d);
    const weekIndex = SolarWeek.fromYmd(y, m, d, this.weekStart).getIndexInYear();
    let meta = `第${dayOfYear}天，第${weekIndex}周`;
    if (info.babyAge && !info.special) {
      meta += ` · ${info.babyAge}`;
    }
    this.$headerMeta.textContent = meta;

    this.$todayTag.hidden = !isSameDay(date, this.today);

    const festival =
      info.headerFestival ||
      (info.holiday ? info.holiday.getName() : "") ||
      info.jieQi ||
      "";
    this.$headerFestival.textContent = festival;
    this.$headerFestival.classList.toggle("is-birth-highlight", Boolean(info.special));

    this.$lunarLine.textContent = info.special
      ? `${info.lunarText} · ${info.special.title} ♡`
      : info.lunarText;
    this.$ganzhiLine.textContent = info.ganzhiText;
    this.$yiText.textContent = info.yi.length ? info.yi.join(" ") : "—";
    this.$jiText.textContent = info.ji.length ? info.ji.join(" ") : "—";
  }
}

document.addEventListener("DOMContentLoaded", () => {
  if (typeof Solar === "undefined") {
    document.body.innerHTML =
      "<p style='padding:24px;color:red'>未加载 lunar.js，请检查 js/lunar.js 是否存在。</p>";
    return;
  }
  new CalendarApp();
});
