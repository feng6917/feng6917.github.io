/**
 * 私人纪念日（格式：年-月-日）
 */
const SPECIAL_DAYS = {
  "2026-1-22": {
    title: "小宝出生",
    short: "小宝出生",
    badge: "宝",
    birth: { y: 2026, m: 1, d: 22 },
  },
};

const BABY_BIRTH = SPECIAL_DAYS["2026-1-22"].birth;

function specialDayKey(y, m, d) {
  return `${y}-${m}-${d}`;
}

function getSpecialDay(y, m, d) {
  return SPECIAL_DAYS[specialDayKey(y, m, d)] || null;
}

/** 出生日及之后：返回展示文案；之前返回 null */
function getBabyAgeText(y, m, d) {
  const cur = new Date(y, m - 1, d);
  const birth = new Date(BABY_BIRTH.y, BABY_BIRTH.m - 1, BABY_BIRTH.d);
  cur.setHours(0, 0, 0, 0);
  birth.setHours(0, 0, 0, 0);
  const diff = Math.floor((cur - birth) / 86400000);
  if (diff < 0) return null;
  if (diff === 0) return "小宝出生";
  return `小宝第 ${diff + 1} 天`;
}

function isOnOrAfterBirth(y, m, d) {
  return getBabyAgeText(y, m, d) !== null;
}
