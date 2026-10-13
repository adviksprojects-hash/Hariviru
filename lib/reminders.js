import fs from "fs";
import path from "path";
import { db } from "./prisma.js";
import { sendWhatsAppRebookReminderTemplateApi } from "./whatsapp.js";
import { saveWhatsAppMessage, getAllWhatsAppTemplates } from "./whatsapp-chat-store.js";

const DATA_DIR = path.join(process.cwd(), ".whatsapp_data");
const CRON_STATE_FILE = path.join(DATA_DIR, "cron_state.json");

function ensureCronStateDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getCronState() {
  try {
    ensureCronStateDir();
    if (fs.existsSync(CRON_STATE_FILE)) {
      const data = fs.readFileSync(CRON_STATE_FILE, "utf-8");
      return JSON.parse(data);
    }
  } catch (err) {
    console.error("[getCronState] Error reading cron state:", err);
  }
  return { lastAutoRunDate: null, lastRunAt: null, lastSummary: null };
}

export function saveCronState(state) {
  try {
    ensureCronStateDir();
    fs.writeFileSync(CRON_STATE_FILE, JSON.stringify(state, null, 2), "utf-8");
  } catch (err) {
    console.error("[saveCronState] Error saving cron state:", err);
  }
}

/**
 * Returns today's date parts in Indian Standard Time (Asia/Kolkata, UTC+5:30)
 */
export function getISTDateParts(refDate = new Date()) {
  const formatter = new Intl.DateTimeFormat("en-IN", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "numeric",
    day: "numeric",
  });
  const parts = formatter.formatToParts(refDate);
  const year = parseInt(parts.find((p) => p.type === "year").value, 10);
  const month = parseInt(parts.find((p) => p.type === "month").value, 10) - 1; // 0-indexed
  const day = parseInt(parts.find((p) => p.type === "day").value, 10);
  const startOfDay = new Date(year, month, day);

  const yyyy = String(year);
  const mm = String(month + 1).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  const dateKey = `${yyyy}-${mm}-${dd}`;

  return { year, month, day, startOfDay, dateKey };
}

/**
 * Detects whether a booking is for a Birthday, Anniversary, or other event
 */
export function detectOccasionCategory(notes = "", defaultCategory = "BIRTHDAY") {
  if (!notes) return defaultCategory;

  // 1. Explicit [Event: <Category>] match
  const eventMatch = notes.match(/\[Event:\s*([^\]]+)\]/i);
  if (eventMatch) {
    const ev = eventMatch[1].trim().toUpperCase();
    if (ev.includes("ANNIVERSARY") || ev.includes("WEDDING") || ev.includes("MARRIAGE")) {
      return "ANNIVERSARY";
    }
    if (ev.includes("BIRTHDAY") || ev.includes("BDAY") || ev.includes("BIRTH")) {
      return "BIRTHDAY";
    }
  }

  // 2. Keyword fallback in notes text
  const lower = notes.toLowerCase();
  if (
    lower.includes("anniversary") ||
    lower.includes("wedding") ||
    lower.includes("marriage") ||
    lower.includes("love")
  ) {
    return "ANNIVERSARY";
  }
  if (
    lower.includes("birthday") ||
    lower.includes("bday") ||
    lower.includes("birth")
  ) {
    return "BIRTHDAY";
  }

  return defaultCategory;
}

/**
 * Format a date nicely (e.g. 12 Nov 2027, 25 Oct 2027) matching approved WhatsApp marketing templates
 */
export function formatDisplayDate(dateObj) {
  if (!dateObj) return "";
  const d = new Date(dateObj);
  if (isNaN(d.getTime())) return "";
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

/**
 * Check if a reminder message was already dispatched to a phone for this category and target year
 */
export async function isReminderAlreadySent(cleanPhone, category, targetYear) {
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const reminderTag = `[Auto-Reminder: ${category}-${targetYear}]`;

  // 1. Check database whatsAppMessage records
  try {
    if (db && db.whatsAppMessage) {
      const existingDbMsg = await db.whatsAppMessage.findFirst({
        where: {
          phone: normalizedPhone,
          message: { contains: reminderTag },
        },
      });
      if (existingDbMsg) return true;
    }
  } catch (e) {
    // Database query failed, fallback to file store
  }

  // 2. Check local messages.json file store
  try {
    const messagesFile = path.join(DATA_DIR, "messages.json");
    if (fs.existsSync(messagesFile)) {
      const messages = JSON.parse(fs.readFileSync(messagesFile, "utf-8") || "[]");
      const matched = messages.some(
        (m) =>
          (m.phone === normalizedPhone || m.phone === cleanPhone) &&
          m.message &&
          m.message.includes(reminderTag)
      );
      if (matched) return true;
    }
  } catch (e) {}

  return false;
}

/**
 * Main automated reminder processor
 * Finds all Birthday & Anniversary clients (from both regular bookings & admin historical data)
 * whose 1-year celebration date is in exactly 2 days, and sends the reminder automatically.
 *
 * @param {Object} options
 * @param {string} [options.branchId] - Optional branch filter (default "all")
 * @param {boolean} [options.forceRun] - Skip already-run-today check
 * @param {boolean} [options.dryRun] - Simulate only without actually sending WhatsApp messages
 * @param {Date} [options.simulatedDate] - Simulate a specific target date (for testing)
 */
export async function processDailyCelebrationReminders(options = {}) {
  const { branchId = "all", forceRun = false, dryRun = false, simulatedDate = null } = options;

  const todayIST = getISTDateParts(simulatedDate ? new Date(simulatedDate) : new Date());
  const cronState = getCronState();

  // If not forceRun, verify if today's batch has already completed
  if (!forceRun && cronState.lastAutoRunDate === todayIST.dateKey) {
    return {
      success: true,
      alreadyRunToday: true,
      dateKey: todayIST.dateKey,
      message: `Daily 9:00 AM auto-reminders for ${todayIST.dateKey} were already processed at ${cronState.lastRunAt}.`,
      lastSummary: cronState.lastSummary,
    };
  }

  // Fetch all completed, confirmed, or historical bookings
  const whereClause = {
    bookingStatus: { not: "CANCELLED" },
  };
  if (branchId && branchId !== "all") {
    whereClause.branchId = branchId;
  }

  const bookings = await db.booking.findMany({
    where: whereClause,
    select: {
      id: true,
      bookingNumber: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      bookingDate: true,
      notes: true,
      slotTitle: true,
      branch: {
        select: {
          id: true,
          name: true,
          city: true,
          address: true,
          phone: true,
          whatsapp: true,
        },
      },
    },
    orderBy: { bookingDate: "desc" },
  });

  // Load message templates
  let templates = [];
  try {
    templates = await getAllWhatsAppTemplates();
  } catch (e) {
    templates = [];
  }

  const customerMap = new Map();

  for (const b of bookings) {
    if (!b.customerPhone) continue;
    const cleanDigits = b.customerPhone.replace(/[^0-9]/g, "");
    if (cleanDigits.length < 10) continue;
    const tenDigits = cleanDigits.slice(-10);

    const origDate = new Date(b.bookingDate);
    if (isNaN(origDate.getTime())) continue;

    // Detect occasion category: BIRTHDAY or ANNIVERSARY
    const category = detectOccasionCategory(b.notes, "BIRTHDAY");
    const isHistorical = (b.notes || "").includes("[Historical Past Data Entry Logged by Admin]");

    // Extract original month & day in IST
    const origParts = getISTDateParts(origDate);

    // Compute candidate celebration date in current year
    let candidate = new Date(todayIST.year, origParts.month, origParts.day);

    // If candidate date in current year has already passed, evaluate next year
    if (candidate < todayIST.startOfDay) {
      candidate = new Date(todayIST.year + 1, origParts.month, origParts.day);
    }

    // Ensure candidate date is at least ~300 days after original booking date (1-year return target)
    const diffFromOrig = (candidate.getTime() - origDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffFromOrig < 300) {
      candidate = new Date(candidate.getFullYear() + 1, origParts.month, origParts.day);
    }

    const diffMs = candidate.getTime() - todayIST.startOfDay.getTime();
    const daysUntil = Math.round(diffMs / (1000 * 60 * 60 * 24));

    // Target rule: EXACTLY 2 DAYS BEFORE (daysUntil === 2)
    const isDueIn2Days = daysUntil === 2;

    const uniqueKey = `${tenDigits}_${category}`;
    if (!customerMap.has(uniqueKey)) {
      customerMap.set(uniqueKey, {
        bookingId: b.id,
        bookingNumber: b.bookingNumber,
        customerName: b.customerName || "Valued Customer",
        rawPhone: b.customerPhone,
        cleanPhone: cleanDigits.length === 10 ? `91${cleanDigits}` : cleanDigits,
        tenDigits,
        email: b.customerEmail,
        branchId: b.branch?.id || "unknown",
        branchName: b.branch?.name || "HaruViru Celebration House",
        notes: b.notes || "",
        category,
        isHistorical,
        originalBookingDate: b.bookingDate,
        upcomingEventDate: candidate,
        targetYear: candidate.getFullYear(),
        daysUntil,
        isDueIn2Days,
      });
    }
  }

  // Filter strictly for customers whose celebration is due in 2 days
  const eligibleCustomers = Array.from(customerMap.values()).filter((c) => c.isDueIn2Days);

  const results = {
    runDate: todayIST.dateKey,
    processedAt: new Date().toISOString(),
    totalBookingsScanned: bookings.length,
    eligibleCount: eligibleCustomers.length,
    sentCount: 0,
    skippedCount: 0,
    failedCount: 0,
    details: [],
  };

  for (const cust of eligibleCustomers) {
    const targetYear = cust.targetYear;
    const formattedEventDate = formatDisplayDate(cust.upcomingEventDate);

    // 1. Check idempotency (skip if already sent for this target year)
    const alreadySent = await isReminderAlreadySent(cust.cleanPhone, cust.category, targetYear);
    if (alreadySent && !forceRun) {
      results.skippedCount += 1;
      results.details.push({
        phone: cust.cleanPhone,
        customerName: cust.customerName,
        category: cust.category,
        isHistorical: cust.isHistorical,
        status: "SKIPPED",
        reason: `Already sent celebration reminder for ${cust.category} ${targetYear}`,
      });
      continue;
    }

    // 2. Select matching template or format default high-conversion text
    const matchingTemplate = templates.find((t) => t.category === cust.category);
    const couponCode =
      matchingTemplate?.couponCode ||
      (cust.category === "ANNIVERSARY" ? "LOVE2026" : "BDAY2026");
    const bookingLink = matchingTemplate?.callToActionUrl || "https://haruviru.com/branches";

    const reminderTag = `[Auto-Reminder: ${cust.category}-${targetYear}]`;

    let messageText = "";
    if (matchingTemplate?.message) {
      messageText = matchingTemplate.message
        .replace(/\{customerName\}/g, cust.customerName)
        .replace(/\{eventDate\}/g, formattedEventDate)
        .replace(/\{branchName\}/g, cust.branchName)
        .replace(/\{couponCode\}/g, couponCode)
        .replace(/\{bookingLink\}/g, bookingLink);
      messageText += `\n\n${reminderTag}`;
    } else if (cust.category === "ANNIVERSARY") {
      messageText = `💍 CELEBRATE YOUR ANNIVERSARY AGAIN AT HARUVIRU! 💍\n\nDear ${cust.customerName},\nHappy Anniversary Month! Your anniversary celebration date is on ${formattedEventDate}! ✨\n\nRe-live your romantic memories at ${cust.branchName} with a complimentary candlelight & cake setup.\nThank You !!!\n\n👉 Visit website: ${bookingLink}\n\n${reminderTag}`;
    } else {
      messageText = `🎂 CELEBRATE YOUR BIRTHDAY AGAIN AT HARUVIRU! 🎂\n\nDear ${cust.customerName},\nYour birthday is coming up on ${formattedEventDate}! 🎈\n\nRe-visit ${cust.branchName} to celebrate your special day again in your private celebration house & mini-theater.\nThank You !!!\n\n👉 Visit website: ${bookingLink}\n\n${reminderTag}`;
    }

    if (dryRun) {
      results.sentCount += 1;
      results.details.push({
        phone: cust.cleanPhone,
        customerName: cust.customerName,
        category: cust.category,
        isHistorical: cust.isHistorical,
        status: "SIMULATED",
        preview: messageText,
      });
      continue;
    }

    // 3. Dispatch message via WhatsApp Meta Cloud API
    try {
      const sendRes = await sendWhatsAppRebookReminderTemplateApi({
        toPhone: cust.cleanPhone,
        customerName: cust.customerName,
        eventDate: formattedEventDate,
        branchName: cust.branchName,
        couponCode,
        category: cust.category,
      });

      // 4. Save to message store for chat history and unread tracking
      await saveWhatsAppMessage({
        phone: cust.cleanPhone,
        sender: "SYSTEM",
        senderName: `Auto Celebration Reminder (9 AM)${cust.isHistorical ? " [Historical]" : ""}`,
        message: messageText,
        status: sendRes.success ? "SENT" : "FAILED",
        metaId: sendRes.data?.messages?.[0]?.id || null,
        waLink: sendRes.fallbackWaLink || null,
      });

      if (sendRes.success) {
        results.sentCount += 1;
        results.details.push({
          phone: cust.cleanPhone,
          customerName: cust.customerName,
          category: cust.category,
          isHistorical: cust.isHistorical,
          status: "SENT",
        });
      } else {
        // Fallback waLink created
        results.sentCount += 1;
        results.details.push({
          phone: cust.cleanPhone,
          customerName: cust.customerName,
          category: cust.category,
          isHistorical: cust.isHistorical,
          status: "SENT_FALLBACK_LINK",
          waLink: sendRes.fallbackWaLink,
        });
      }
    } catch (sendErr) {
      console.error(`[processDailyCelebrationReminders] Error dispatching to ${cust.cleanPhone}:`, sendErr);
      results.failedCount += 1;
      results.details.push({
        phone: cust.cleanPhone,
        customerName: cust.customerName,
        category: cust.category,
        isHistorical: cust.isHistorical,
        status: "FAILED",
        error: sendErr.message,
      });
    }
  }

  // Update cron state file
  if (!dryRun) {
    saveCronState({
      lastAutoRunDate: todayIST.dateKey,
      lastRunAt: results.processedAt,
      lastSummary: {
        dateKey: todayIST.dateKey,
        totalBookingsScanned: results.totalBookingsScanned,
        eligibleCount: results.eligibleCount,
        sentCount: results.sentCount,
        skippedCount: results.skippedCount,
        failedCount: results.failedCount,
      },
    });
  }

  return {
    success: true,
    ...results,
  };
}
