import fs from "fs";
import path from "path";

const SETTINGS_FILE = path.join(process.cwd(), "data", "depositSettings.json");

function ensureDirectoryExists() {
  const dir = path.dirname(SETTINGS_FILE);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
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
    console.error("Error saving local deposit settings:", err);
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

export function enrichBranchWithDepositSettings(branch) {
  if (!branch) return branch;
  const local = getLocalDepositSettings(branch.id);
  const depositModeEnabled = branch.depositModeEnabled !== undefined && branch.depositModeEnabled !== null
    ? branch.depositModeEnabled
    : (local ? local.depositModeEnabled : false);

  const depositAmount = branch.depositAmount !== undefined && branch.depositAmount !== null && branch.depositAmount > 0
    ? branch.depositAmount
    : (local ? local.depositAmount : 500);

  return {
    ...branch,
    depositModeEnabled: Boolean(depositModeEnabled),
    depositAmount: parseFloat(depositAmount) || 500,
  };
}
