const {
  XP_CONFIG,
  resolveLevelByXp,
  MAX_LEVEL,
  HEALTH_DECAY_BY_MISSED_STREAK,
  HEALTH_RECOVERY_PER_ACTIVE_DAY,
  HEALTH_RECOVERY_STREAK_BONUS,
  DAILY_MINIMUM_READING_MINUTES,
  DAILY_MINIMUM_GAMES_COMPLETED,
  STREAK_MILESTONES,
} = require("../config/gardenConfig");

function computeReadingXp(minutes) {
  const safeMinutes = Number.isFinite(minutes) && minutes > 0 ? minutes : 0;
  return Math.round(safeMinutes * XP_CONFIG.xpPerReadingMinute);
}

function computeGameXp(gameScores) {
  if (!Array.isArray(gameScores) || gameScores.length === 0) return 0;
  return gameScores.reduce((sum, score) => {
    const safeScore = Number.isFinite(score) && score > 0 ? score : 0;
    const cappedScore = Math.min(safeScore, XP_CONFIG.gameScoreXpCap);
    return (
      sum +
      XP_CONFIG.gameCompletionXp +
      Math.round(cappedScore * XP_CONFIG.gameScoreXpRate)
    );
  }, 0);
}

function computeDayXp(dayActivity) {
  const readingXp = computeReadingXp(dayActivity.readingMinutes);
  const gameXp = computeGameXp(dayActivity.gameScores);
  return { readingXp, gameXp, totalXp: readingXp + gameXp };
}

function isActiveDay({ readingMinutes = 0, gamesCompleted = 0 }) {
  return (
    readingMinutes >= DAILY_MINIMUM_READING_MINUTES ||
    gamesCompleted >= DAILY_MINIMUM_GAMES_COMPLETED
  );
}

function decayForMissedStreak(missedStreak) {
  const idx =
    Math.min(Math.max(missedStreak, 1), HEALTH_DECAY_BY_MISSED_STREAK.length) -
    1;
  return HEALTH_DECAY_BY_MISSED_STREAK[idx];
}

function treeTotalXp(tree) {
  return (tree.readingXp || 0) + (tree.gameXp || 0);
}

function nextStreak({ currentStreak, longestStreak, isActive }) {
  const streak = isActive ? currentStreak + 1 : 0;
  return {
    currentStreak: streak,
    longestStreak: Math.max(longestStreak, streak),
    isMilestone: isActive && STREAK_MILESTONES.includes(streak),
  };
}

function applyDayStep({
  tree,
  isActive,
  dayActivity,
  missedStreak,
  isMilestone,
}) {
  let { readingXp, gameXp, readingMinutes, health, status } = tree;
  let nextMissedStreak = missedStreak;

  if (isActive) {
    readingXp += dayActivity.readingXp || 0;
    gameXp += dayActivity.gameXp || 0;
    readingMinutes += dayActivity.readingMinutes || 0;
    const bonus = isMilestone ? HEALTH_RECOVERY_STREAK_BONUS : 0;
    health = Math.min(100, health + HEALTH_RECOVERY_PER_ACTIVE_DAY + bonus);
    nextMissedStreak = 0;
    if (status === "DEAD" && health > 0) status = "ALIVE";
  } else {
    nextMissedStreak += 1;
    const wasDead = status === "DEAD";
    health = Math.max(0, health - decayForMissedStreak(nextMissedStreak));
    if (health <= 0 && !wasDead) status = "DEAD";
  }

  const totalXp = readingXp + gameXp;
  const justMatured =
    status !== "MATURE" && resolveLevelByXp(totalXp).level >= MAX_LEVEL;
  if (justMatured) {
    status = "MATURE";
    health = 100;
  }

  return {
    tree: { readingXp, gameXp, readingMinutes, health, status },
    missedStreak: nextMissedStreak,
    justMatured,
    justDied: status === "DEAD" && tree.status !== "DEAD",
  };
}

function commitPastDay(args) {
  return applyDayStep(args);
}

function previewToday(args) {
  return applyDayStep(args).tree;
}

module.exports = {
  computeReadingXp,
  computeGameXp,
  computeDayXp,
  isActiveDay,
  treeTotalXp,
  nextStreak,
  commitPastDay,
  previewToday,
};
