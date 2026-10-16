import { db } from "./prisma";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "systemSettings.json");

function ensureDirectoryExists() {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
}

export function saveLocalSettings(key, value) {
  try {
    ensureDirectoryExists();
    let data = {};
    if (fs.existsSync(SETTINGS_FILE)) {
      try {
        const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
        data = JSON.parse(raw);
      } catch (e) {
        data = {};
      }
    }
    data[key] = value;
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data[key];
  } catch (err) {
    return value;
  }
}

export function getLocalSettings(key, defaultValue = null) {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return defaultValue;
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return data[key] !== undefined ? data[key] : defaultValue;
  } catch (err) {
    return defaultValue;
  }
}

let tableEnsured = false;

export async function ensureSystemSettingsTable() {
  if (tableEnsured) return;
  try {
    if (db && db.$executeRawUnsafe) {
      await db.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS "SystemSetting" (
          "id" TEXT PRIMARY KEY,
          "key" TEXT UNIQUE NOT NULL,
          "value" TEXT NOT NULL,
          "createdAt" TIMESTAMP DEFAULT NOW(),
          "updatedAt" TIMESTAMP DEFAULT NOW()
        );
      `);
      tableEnsured = true;
    }
  } catch (err) {
    console.warn("Notice: ensureSystemSettingsTable:", err.message);
  }
}

export async function getSystemSetting(key, defaultValue = "") {
  await ensureSystemSettingsTable();
  try {
    if (db && db.$queryRawUnsafe) {
      const rows = await db.$queryRawUnsafe(
        `SELECT "value" FROM "SystemSetting" WHERE "key" = $1 LIMIT 1`,
        key
      );
      if (rows && rows.length > 0) {
        return rows[0].value;
      }
    }
  } catch (err) {
    console.warn(`Error querying system setting ${key}:`, err.message);
  }

  return getLocalSettings(key, defaultValue);
}

export async function setSystemSetting(key, value) {
  await ensureSystemSettingsTable();
  const strVal = String(value);

  try {
    if (db && db.$executeRawUnsafe) {
      await db.$executeRawUnsafe(
        `INSERT INTO "SystemSetting" ("id", "key", "value", "createdAt", "updatedAt")
         VALUES (gen_random_uuid()::text, $1, $2, NOW(), NOW())
         ON CONFLICT ("key") DO UPDATE SET "value" = $2, "updatedAt" = NOW()`,
        key,
        strVal
      );
    }
  } catch (err) {
    console.error(`Direct SQL setting update failed for ${key}:`, err.message);
  }

  saveLocalSettings(key, strVal);
  return strVal;
}

/**
 * Get Admin WhatsApp Notification Settings
 */
export async function getAdminNotificationSettings() {
  const adminPhoneRaw = await getSystemSetting(
    "ADMIN_WHATSAPP_PHONE",
    process.env.ADMIN_WHATSAPP_PHONE || "9762486649"
  );
  const notifyOnOnlineRaw = await getSystemSetting("ADMIN_NOTIFY_ONLINE", "true");
  const notifyOnWalkInRaw = await getSystemSetting("ADMIN_NOTIFY_WALKIN", "true");
  const notifyOnExtraRaw = await getSystemSetting("ADMIN_NOTIFY_EXTRA", "true");
  const templateNameRaw = await getSystemSetting("ADMIN_WHATSAPP_TEMPLATE_NAME", "admin_booking_alert");

  return {
    adminPhone: String(adminPhoneRaw).trim(),
    notifyOnOnlineConfirm: notifyOnOnlineRaw === "true",
    notifyOnWalkIn: notifyOnWalkInRaw === "true",
    notifyOnExtra: notifyOnExtraRaw === "true",
    templateName: String(templateNameRaw).trim() || "admin_booking_alert",
  };
}

/**
 * Save Admin WhatsApp Notification Settings
 */
export async function saveAdminNotificationSettings({
  adminPhone,
  notifyOnOnlineConfirm = true,
  notifyOnWalkIn = true,
  notifyOnExtra = true,
  templateName = "admin_booking_alert",
}) {
  const cleanPhone = String(adminPhone || "").replace(/[^0-9]/g, "");

  await setSystemSetting("ADMIN_WHATSAPP_PHONE", cleanPhone);
  await setSystemSetting("ADMIN_NOTIFY_ONLINE", String(Boolean(notifyOnOnlineConfirm)));
  await setSystemSetting("ADMIN_NOTIFY_WALKIN", String(Boolean(notifyOnWalkIn)));
  await setSystemSetting("ADMIN_NOTIFY_EXTRA", String(Boolean(notifyOnExtra)));
  await setSystemSetting("ADMIN_WHATSAPP_TEMPLATE_NAME", String(templateName || "admin_booking_alert").trim());

  return {
    adminPhone: cleanPhone,
    notifyOnOnlineConfirm: Boolean(notifyOnOnlineConfirm),
    notifyOnWalkIn: Boolean(notifyOnWalkIn),
    notifyOnExtra: Boolean(notifyOnExtra),
    templateName: String(templateName || "admin_booking_alert").trim(),
  };
}
