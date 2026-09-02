const CACHE_TTL_MS = 60 * 1000; // khớp với REFRESH_MS ở client/src/pages/StatusPage.jsx

let cache = { data: null, expiresAt: 0 };

// Mã trạng thái monitor của UptimeRobot -> key mà FE hiểu (STATUS_META)
const UPTIMEROBOT_STATUS_MAP = {
  0: "paused",
  1: "not_checked_yet",
  2: "up",
  8: "seems_down",
  9: "down",
};

function averageResponseMs(responseTimes) {
  if (!Array.isArray(responseTimes) || responseTimes.length === 0) return null;
  const sum = responseTimes.reduce((acc, r) => acc + Number(r.value || 0), 0);
  return Math.round(sum / responseTimes.length);
}

async function fetchMonitorFromUptimeRobot() {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  const monitorId = process.env.UPTIMEROBOT_MONITOR_ID;

  if (!apiKey || !monitorId) {
    throw new Error("Thiếu UPTIMEROBOT_API_KEY hoặc UPTIMEROBOT_MONITOR_ID");
  }

  const response = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      api_key: apiKey,
      monitors: monitorId,
      custom_uptime_ratios: "30",
      response_times: "1",
      response_times_limit: "10",
    }),
  });

  const data = await response.json();
  if (data.stat !== "ok" || !data.monitors?.length) {
    throw new Error(data.error?.message || "UptimeRobot trả về dữ liệu không hợp lệ");
  }

  return data.monitors[0];
}

// GET /api/v1/status — public
const getPublicStatus = async (req, res) => {
  const now = Date.now();
  if (cache.data && cache.expiresAt > now) {
    return res.json(cache.data);
  }

  try {
    const monitor = await fetchMonitorFromUptimeRobot();

    const payload = {
      status: UPTIMEROBOT_STATUS_MAP[monitor.status] || "unknown",
      uptimeRatio30d:
        monitor.custom_uptime_ratio !== undefined
          ? Number(monitor.custom_uptime_ratio)
          : null,
      avgResponseMs: averageResponseMs(monitor.response_times),
      checkedAt: new Date().toISOString(),
    };

    cache = { data: payload, expiresAt: now + CACHE_TTL_MS };
    return res.json(payload);
  } catch (error) {
    console.error("[status] Không lấy được dữ liệu UptimeRobot:", error.message);
    // Không cache lỗi, để lần gọi kế tiếp được thử lại ngay
    return res.json({
      status: "unknown",
      uptimeRatio30d: null,
      avgResponseMs: null,
      checkedAt: new Date().toISOString(),
    });
  }
};

module.exports = { getPublicStatus };