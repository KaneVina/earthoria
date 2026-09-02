const prisma = require("../config/db");
const SETTINGS_ID = "singleton";

async function getOrCreateSettings() {
  let settings = await prisma.siteSetting.findUnique({
    where: { id: SETTINGS_ID },
  });
  if (!settings) {
    settings = await prisma.siteSetting.create({ data: { id: SETTINGS_ID } });
  }
  return settings;
}

function isMaintenanceActive(settings) {
  if (!settings) return false;
  if (settings.maintenanceEnabled) return true;
  if (settings.maintenanceStart && settings.maintenanceEnd) {
    const now = new Date();
    return now >= settings.maintenanceStart && now <= settings.maintenanceEnd;
  }
  return false;
}

module.exports = { getOrCreateSettings, isMaintenanceActive, SETTINGS_ID };
