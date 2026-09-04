const prisma = require("../config/db");
const { formatResponse } = require("../utils/helpers");
const {
  vnDateStr,
  shiftVnDateStr,
  vnDateStrToUtcStart,
  isWithinAllowedWindow,
  isDailyLimitReached,
} = require("../utils/childPolicy");
const {
  LEVEL_CONFIG,
  STREAK_MILESTONES,
  FOREST_CONFIG,
  DAILY_MINIMUM_READING_MINUTES,
  DAILY_MINIMUM_GAMES_COMPLETED,
  buildLevelProgress,
  resolveHealthBand,
} = require("../config/gardenConfig");
const {
  computeDayXp,
  isActiveDay,
  treeTotalXp,
  nextStreak,
  commitPastDay,
  previewToday,
} = require("../utils/gardenEngine");

const EMPTY_TREE_FIELDS = {
  readingXp: 0,
  gameXp: 0,
  readingMinutes: 0,
  health: 100,
  status: "ALIVE",
};

async function loadDailyActivityMap(childId, fromDateStr, toDateStrInclusive) {
  const rangeStart = vnDateStrToUtcStart(fromDateStr);
  const rangeEnd = vnDateStrToUtcStart(shiftVnDateStr(toDateStrInclusive, 1));

  const [logs, gameResults] = await Promise.all([
    prisma.childActivityLog.findMany({
      where: { childId, occurredOn: { gte: rangeStart, lt: rangeEnd } },
      select: { minutes: true, occurredOn: true },
    }),
    prisma.gameResult.findMany({
      where: { childId, completedAt: { gte: rangeStart, lt: rangeEnd } },
      select: { score: true, completedAt: true },
    }),
  ]);

  const map = new Map();
  const bucket = (dateStr) => {
    if (!map.has(dateStr))
      map.set(dateStr, { readingMinutes: 0, gameScores: [] });
    return map.get(dateStr);
  };
  for (const log of logs)
    bucket(vnDateStr(log.occurredOn)).readingMinutes += log.minutes;
  for (const gr of gameResults)
    bucket(vnDateStr(gr.completedAt)).gameScores.push(gr.score);
  return map;
}

function dayActivityOf(map, dateStr) {
  return map.get(dateStr) || { readingMinutes: 0, gameScores: [] };
}

function findActiveTree(trees) {
  const growing = trees.filter((t) => t.status !== "MATURE");
  if (growing.length === 0) return null;
  return growing.reduce((a, b) => (b.slot > a.slot ? b : a));
}

function buildTreeView(tree) {
  const totalXp = treeTotalXp(tree);
  const progress = buildLevelProgress(totalXp);
  return {
    id: tree.id,
    slot: tree.slot,
    status: tree.status,
    health: tree.health,
    healthBand: resolveHealthBand(tree.health),
    readingXp: tree.readingXp,
    gameXp: tree.gameXp,
    knowledgeXp: totalXp,
    readingMinutes: tree.readingMinutes,
    level: progress.level,
    nextLevel: progress.nextLevel,
    xpToNextLevel: progress.xpToNext,
    progressPercent: progress.progressPercent,
    isMaxLevel: progress.isMaxLevel,
    plantedAt: tree.plantedAt,
    maturedAt: tree.maturedAt ?? null,
    diedAt: tree.diedAt ?? null,
  };
}

async function commitMissingPastDays(child, garden, activeTree, todayVn) {
  const yesterdayVn = shiftVnDateStr(todayVn, -1);
  const rangeStart = garden.lastTickDate
    ? shiftVnDateStr(garden.lastTickDate, 1)
    : vnDateStr(activeTree.plantedAt);

  let {
    currentStreak,
    longestStreak,
    missedStreak,
    lastActiveDate,
    forestLevel,
  } = garden;
  if (rangeStart > yesterdayVn) {
    return {
      currentStreak,
      longestStreak,
      missedStreak,
      lastActiveDate,
      forestLevel,
      lastTickDate: garden.lastTickDate,
      changed: false,
    };
  }

  const dailyMap = await loadDailyActivityMap(
    child.id,
    rangeStart,
    yesterdayVn,
  );

  const timeline = [
    {
      id: activeTree.id,
      slot: activeTree.slot,
      isNew: false,
      plantedAt: activeTree.plantedAt,
      maturedAt: null,
      diedAt: activeTree.diedAt ?? null,
      tree: {
        readingXp: activeTree.readingXp,
        gameXp: activeTree.gameXp,
        readingMinutes: activeTree.readingMinutes,
        health: activeTree.health,
        status: activeTree.status,
      },
    },
  ];

  let cursor = rangeStart;
  while (cursor <= yesterdayVn) {
    const growing = timeline[timeline.length - 1];
    const raw = dayActivityOf(dailyMap, cursor);
    const active = isActiveDay({
      readingMinutes: raw.readingMinutes,
      gamesCompleted: raw.gameScores.length,
    });
    const dayXp = computeDayXp(raw);
    const streakResult = nextStreak({
      currentStreak,
      longestStreak,
      isActive: active,
    });

    const stepResult = commitPastDay({
      tree: growing.tree,
      isActive: active,
      dayActivity: {
        readingMinutes: raw.readingMinutes,
        readingXp: dayXp.readingXp,
        gameXp: dayXp.gameXp,
      },
      missedStreak,
      isMilestone: streakResult.isMilestone,
    });

    growing.tree = stepResult.tree;
    missedStreak = stepResult.missedStreak;
    currentStreak = streakResult.currentStreak;
    longestStreak = streakResult.longestStreak;
    if (active) lastActiveDate = cursor;
    if (stepResult.justDied && !growing.diedAt)
      growing.diedAt = vnDateStrToUtcStart(cursor);

    if (stepResult.justMatured) {
      growing.maturedAt = vnDateStrToUtcStart(cursor);
      forestLevel += 1;
      const createdSoFar = timeline.filter((t) => t.isNew).length;
      timeline.push({
        id: null,
        slot: garden.trees.length + createdSoFar,
        isNew: true,
        plantedAt: vnDateStrToUtcStart(cursor),
        maturedAt: null,
        diedAt: null,
        tree: { ...EMPTY_TREE_FIELDS },
      });
    }

    cursor = shiftVnDateStr(cursor, 1);
  }

  const ops = [];
  ops.push(
    prisma.childTree.update({
      where: { id: timeline[0].id },
      data: {
        ...timeline[0].tree,
        ...(timeline[0].maturedAt ? { maturedAt: timeline[0].maturedAt } : {}),
        ...(timeline[0].diedAt ? { diedAt: timeline[0].diedAt } : {}),
      },
    }),
  );
  for (let i = 1; i < timeline.length; i++) {
    const entry = timeline[i];
    ops.push(
      prisma.childTree.create({
        data: {
          gardenId: garden.id,
          slot: entry.slot,
          plantedAt: entry.plantedAt,
          ...entry.tree,
          ...(entry.maturedAt ? { maturedAt: entry.maturedAt } : {}),
          ...(entry.diedAt ? { diedAt: entry.diedAt } : {}),
        },
      }),
    );
  }
  ops.push(
    prisma.childGarden.update({
      where: { id: garden.id },
      data: {
        forestLevel,
        currentStreak,
        longestStreak,
        missedStreak,
        lastActiveDate,
        lastTickDate: yesterdayVn,
      },
    }),
  );
  await prisma.$transaction(ops);

  return {
    currentStreak,
    longestStreak,
    missedStreak,
    lastActiveDate,
    forestLevel,
    lastTickDate: yesterdayVn,
    changed: true,
  };
}

const getKidGarden = async (req, res) => {
  try {
    const { token } = req.params;
    const child = await prisma.childProfile.findFirst({
      where: { kidLinkToken: token, isActive: true },
      select: {
        id: true,
        name: true,
        isLocked: true,
        dailyLimitMinutes: true,
        allowWindowEnabled: true,
        allowStart: true,
        allowEnd: true,
      },
    });
    if (!child)
      return formatResponse(res, 404, "Link không hợp lệ hoặc đã bị thu hồi");

    // Đồng bộ với ebookReaderController/arController: khu vườn tri thức cũng
    // là một màn hình bé "dùng thiết bị" nên phải tôn trọng khoá/giờ giấc do
    // ba mẹ đặt ở /family, giống hệt lúc đọc sách hay xem AR. Trả nguyên
    // dạng res.json({code, ...}) (không qua formatResponse) để khớp đúng
    // shape mà client đang đọc (err.response.data.code) ở 2 controller kia.
    if (child.isLocked) {
      return res.status(403).json({
        success: false,
        code: "CHILD_LOCKED",
        message: "Thiết bị của bé đang bị phụ huynh khoá.",
      });
    }
    if (!isWithinAllowedWindow(child)) {
      return res.status(403).json({
        success: false,
        code: "OUTSIDE_ALLOWED_WINDOW",
        message: "Ngoài khung giờ ba mẹ cho phép sử dụng.",
      });
    }
    if (await isDailyLimitReached(prisma, child)) {
      return res.status(403).json({
        success: false,
        code: "DAILY_LIMIT_REACHED",
        message: "Bé đã dùng hết thời gian hôm nay rồi, hẹn bé ngày mai nhé!",
      });
    }

    let garden = await prisma.childGarden.findUnique({
      where: { childId: child.id },
      include: { trees: { orderBy: { slot: "asc" } } },
    });

    if (!garden) {
      garden = await prisma.childGarden.create({
        data: {
          childId: child.id,
          trees: { create: [{ slot: 0, ...EMPTY_TREE_FIELDS }] },
        },
        include: { trees: { orderBy: { slot: "asc" } } },
      });
    }

    let activeTree = findActiveTree(garden.trees);
    if (!activeTree) {
      activeTree = await prisma.childTree.create({
        data: {
          gardenId: garden.id,
          slot: garden.trees.length,
          ...EMPTY_TREE_FIELDS,
        },
      });
    }

    const todayVn = vnDateStr();
    const committed = await commitMissingPastDays(
      child,
      garden,
      activeTree,
      todayVn,
    );

    if (committed.changed) {
      garden = await prisma.childGarden.findUnique({
        where: { childId: child.id },
        include: { trees: { orderBy: { slot: "asc" } } },
      });
      activeTree = findActiveTree(garden.trees);
    } else {
      garden = { ...garden, ...committed };
    }

    const todayMap = await loadDailyActivityMap(child.id, todayVn, todayVn);
    const todayRaw = dayActivityOf(todayMap, todayVn);
    const todayActive = isActiveDay({
      readingMinutes: todayRaw.readingMinutes,
      gamesCompleted: todayRaw.gameScores.length,
    });
    const todayXp = computeDayXp(todayRaw);
    const todayStreakPreview = nextStreak({
      currentStreak: garden.currentStreak,
      longestStreak: garden.longestStreak,
      isActive: todayActive,
    });
    const previewTree = previewToday({
      tree: {
        readingXp: activeTree.readingXp,
        gameXp: activeTree.gameXp,
        readingMinutes: activeTree.readingMinutes,
        health: activeTree.health,
        status: activeTree.status,
      },
      isActive: todayActive,
      dayActivity: {
        readingMinutes: todayRaw.readingMinutes,
        readingXp: todayXp.readingXp,
        gameXp: todayXp.gameXp,
      },
      missedStreak: garden.missedStreak,
      isMilestone: todayStreakPreview.isMilestone,
    });

    const activeTreeView = buildTreeView({ ...activeTree, ...previewTree });
    const otherTrees = garden.trees
      .filter((t) => t.id !== activeTree.id)
      .map(buildTreeView);
    const trees = [...otherTrees, activeTreeView].sort(
      (a, b) => a.slot - b.slot,
    );

    return formatResponse(res, 200, "OK", {
      childName: child.name,
      garden: {
        forestLevel: garden.forestLevel,
        forestUnlocked: garden.forestLevel > 0,
        currentStreak: todayStreakPreview.currentStreak,
        longestStreak: todayStreakPreview.longestStreak,
        lastActiveDate: garden.lastActiveDate,
        todayActive,
        todayReadingMinutes: todayRaw.readingMinutes,
        todayGamesCompleted: todayRaw.gameScores.length,
        todayXp,
        treesCount: trees.length,
      },
      activeTree: activeTreeView,
      trees,
      levels: LEVEL_CONFIG,
      streakMilestones: STREAK_MILESTONES,
      dailyGoal: {
        minReadingMinutes: DAILY_MINIMUM_READING_MINUTES,
        minGamesCompleted: DAILY_MINIMUM_GAMES_COMPLETED,
      },
      forestConfig: FOREST_CONFIG,
    });
  } catch (error) {
    console.error(error);
    return formatResponse(res, 500, "Lỗi server");
  }
};

module.exports = { getKidGarden };
