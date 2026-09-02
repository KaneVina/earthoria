const XP_CONFIG = {
  xpPerReadingMinute: 10,
  gameCompletionXp: 40,
  gameScoreXpRate: 0.5,
  gameScoreXpCap: 200,
};

const LEVEL_CONFIG = [
  {
    level: 1,
    name: "Hạt Mầm Tri Thức",
    minXP: 0,
    description: "Hạt giống mới gieo, đang chờ điều kỳ diệu bắt đầu.",
  },
  {
    level: 2,
    name: "Mầm Non Tri Thức",
    minXP: 150,
    description: "Một mầm xanh bé xíu đã nhú lên khỏi mặt đất.",
  },
  {
    level: 3,
    name: "Cây Con Tri Thức",
    minXP: 450,
    description: "Vài chiếc lá đầu tiên xoè ra đón nắng.",
  },
  {
    level: 4,
    name: "Cây Tri Thức Phát Triển",
    minXP: 1000,
    description: "Thân cây cao dần, tán lá rậm rạp hơn mỗi ngày.",
  },
  {
    level: 5,
    name: "Cây Tri Thức Trưởng Thành",
    minXP: 2000,
    description: "Cây đã vững chãi, rễ bám sâu vào tri thức.",
  },
  {
    level: 6,
    name: "Cây Tri Thức Nở Hoa",
    minXP: 3600,
    description: "Những bông hoa đầu tiên bung nở rực rỡ.",
  },
  {
    level: 7,
    name: "Cây Tri Thức Ra Quả",
    minXP: 5800,
    description: "Công sức đọc sách đơm thành quả ngọt.",
  },
  {
    level: 8,
    name: "Cây Cổ Thụ Tri Thức",
    minXP: 8800,
    description: "Một cây cổ thụ vững chãi, toả bóng mát tri thức.",
  },
  {
    level: 9,
    name: "Khu Rừng Tri Thức",
    minXP: 13000,
    description:
      "Không chỉ một cây nữa — cả một khu rừng đang chờ được gieo trồng.",
  },
];
const MAX_LEVEL = LEVEL_CONFIG[LEVEL_CONFIG.length - 1].level;

const HEALTH_BANDS = [
  { key: "healthy", min: 90, max: 100, label: "Khoẻ mạnh" },
  { key: "growing", min: 70, max: 89, label: "Đang phát triển" },
  { key: "wilting", min: 40, max: 69, label: "Hơi héo" },
  { key: "needs_care", min: 20, max: 39, label: "Cần chăm sóc" },
  { key: "critical", min: 1, max: 19, label: "Sắp héo" },
  { key: "dead", min: 0, max: 0, label: "Đã chết" },
];

const HEALTH_DECAY_BY_MISSED_STREAK = [5, 8, 12, 15];
const HEALTH_RECOVERY_PER_ACTIVE_DAY = 18;
const HEALTH_RECOVERY_STREAK_BONUS = 10;

const DAILY_MINIMUM_READING_MINUTES = 10;
const DAILY_MINIMUM_GAMES_COMPLETED = 1;

const STREAK_MILESTONES = [3, 7, 14, 30, 60, 100];

const FOREST_CONFIG = {
  initialTrees: 2,
  treesRequiredFormula: "1 + forestLevel",
};

function resolveLevelByXp(xp) {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  let matched = LEVEL_CONFIG[0];
  for (const lvl of LEVEL_CONFIG) {
    if (safeXp >= lvl.minXP) matched = lvl;
  }
  return matched;
}

function getNextLevel(level) {
  const idx = LEVEL_CONFIG.findIndex((l) => l.level === level.level);
  if (idx === -1 || idx === LEVEL_CONFIG.length - 1) return null;
  return LEVEL_CONFIG[idx + 1];
}

function buildLevelProgress(xp) {
  const safeXp = Number.isFinite(xp) && xp > 0 ? xp : 0;
  const level = resolveLevelByXp(safeXp);
  const nextLevel = getNextLevel(level);
  const xpToNext = nextLevel ? Math.max(nextLevel.minXP - safeXp, 0) : 0;
  const rangeXp = nextLevel ? nextLevel.minXP - level.minXP : 0;
  const xpIntoLevel = safeXp - level.minXP;
  const progressPercent = !nextLevel
    ? 100
    : rangeXp <= 0
      ? 100
      : Math.max(0, Math.min(100, Math.round((xpIntoLevel / rangeXp) * 100)));

  return {
    xp: safeXp,
    level,
    nextLevel,
    xpToNext,
    progressPercent,
    isMaxLevel: !nextLevel,
  };
}

function resolveHealthBand(health) {
  const safeHealth = Number.isFinite(health)
    ? Math.max(0, Math.min(100, health))
    : 100;
  return (
    HEALTH_BANDS.find((b) => safeHealth >= b.min && safeHealth <= b.max) ||
    HEALTH_BANDS[0]
  );
}

module.exports = {
  XP_CONFIG,
  LEVEL_CONFIG,
  MAX_LEVEL,
  HEALTH_BANDS,
  HEALTH_DECAY_BY_MISSED_STREAK,
  HEALTH_RECOVERY_PER_ACTIVE_DAY,
  HEALTH_RECOVERY_STREAK_BONUS,
  DAILY_MINIMUM_READING_MINUTES,
  DAILY_MINIMUM_GAMES_COMPLETED,
  STREAK_MILESTONES,
  FOREST_CONFIG,
  resolveLevelByXp,
  getNextLevel,
  buildLevelProgress,
  resolveHealthBand,
};
