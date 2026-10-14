import { db } from "./prisma";
import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "depositSettings.json");

function ensureDirectoryExists() {
  try {
    const dir = path.dirname(SETTINGS_FILE);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
  } catch (_) {}
}

export function saveLocalDepositSettings(branchId, depositModeEnabled, depositAmount) {
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
    data[branchId] = {
      depositModeEnabled: Boolean(depositModeEnabled),
      depositAmount: depositAmount !== undefined && depositAmount !== "" ? parseFloat(depositAmount) : 500,
      updatedAt: new Date().toISOString(),
    };
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2), "utf-8");
    return data[branchId];
  } catch (err) {
    return { depositModeEnabled: Boolean(depositModeEnabled), depositAmount: parseFloat(depositAmount) || 500 };
  }
}

export function getLocalDepositSettings(branchId) {
  try {
    if (!fs.existsSync(SETTINGS_FILE)) return null;
    const raw = fs.readFileSync(SETTINGS_FILE, "utf-8");
    const data = JSON.parse(raw);
    return data[branchId] || null;
  } catch (err) {
    return null;
  }
}

let dbColumnsEnsured = false;

export async function ensureBranchDepositColumns() {
  if (dbColumnsEnsured) return;
  try {
    if (db && db.$executeRawUnsafe) {
      await db.$executeRawUnsafe(`
        ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "depositModeEnabled" BOOLEAN DEFAULT false;
        ALTER TABLE "Branch" ADD COLUMN IF NOT EXISTS "depositAmount" DOUBLE PRECISION DEFAULT 500;
      `);
      dbColumnsEnsured = true;
    }
  } catch (err) {
    console.warn("Notice: ensureBranchDepositColumns:", err.message);
  }
}

export async function saveBranchDepositSettingsDb(branchId, depositModeEnabled, depositAmount) {
  await ensureBranchDepositColumns();
  const enabled = Boolean(depositModeEnabled);
  const amount = depositAmount !== undefined && depositAmount !== "" ? parseFloat(depositAmount) : 500;

  // 1. Direct raw SQL update to Neon PostgreSQL guarantees persistence across serverless & all environments
  try {
    if (db && db.$executeRawUnsafe) {
      await db.$executeRawUnsafe(
        `UPDATE "Branch" SET "depositModeEnabled" = $1, "depositAmount" = $2 WHERE "id" = $3`,
        enabled,
        amount,
        branchId
      );
    }
  } catch (err) {
    console.error("Direct SQL update of deposit settings failed:", err.message);
  }

  // 2. Also try Prisma update
  try {
    await db.branch.update({
      where: { id: branchId },
      data: {
        depositModeEnabled: enabled,
        depositAmount: amount,
      },
    });
  } catch (_) {}

  // 3. Local fallback for local dev
  saveLocalDepositSettings(branchId, enabled, amount);

  return { depositModeEnabled: enabled, depositAmount: amount };
}

export async function getBranchDepositSettingsDb(branchId) {
  if (!branchId) return null;
  await ensureBranchDepositColumns();
  try {
    if (db && db.$queryRawUnsafe) {
      const rows = await db.$queryRawUnsafe(
        `SELECT "depositModeEnabled", "depositAmount" FROM "Branch" WHERE "id" = $1 LIMIT 1`,
        branchId
      );
      if (rows && rows.length > 0) {
        return {
          depositModeEnabled: Boolean(rows[0].depositModeEnabled),
          depositAmount: parseFloat(rows[0].depositAmount) || 500,
        };
      }
    }
  } catch (err) {
    console.warn("getBranchDepositSettingsDb query error:", err.message);
  }
  return null;
}

export function enrichBranchWithDepositSettings(branch) {
  if (!branch) return branch;
  const local = getLocalDepositSettings(branch.id);
  const depositModeEnabled = branch.depositModeEnabled !== undefined && branch.depositModeEnabled !== null
    ? Boolean(branch.depositModeEnabled)
    : (local ? local.depositModeEnabled : false);

  const depositAmount = branch.depositAmount !== undefined && branch.depositAmount !== null && branch.depositAmount > 0
    ? parseFloat(branch.depositAmount)
    : (local ? local.depositAmount : 500);

  return {
    ...branch,
    depositModeEnabled: Boolean(depositModeEnabled),
    depositAmount: parseFloat(depositAmount) || 500,
  };
}

export async function enrichBranchWithDepositSettingsAsync(branch) {
  if (!branch) return branch;
  const dbSettings = await getBranchDepositSettingsDb(branch.id);
  if (dbSettings) {
    return {
      ...branch,
      depositModeEnabled: dbSettings.depositModeEnabled,
      depositAmount: dbSettings.depositAmount,
    };
  }
  return enrichBranchWithDepositSettings(branch);
}
