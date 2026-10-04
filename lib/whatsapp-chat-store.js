import fs from "fs";
import path from "path";
import { db } from "./prisma";

const DATA_DIR = path.join(process.cwd(), ".whatsapp_data");
const MESSAGES_FILE = path.join(DATA_DIR, "messages.json");
const TEMPLATES_FILE = path.join(DATA_DIR, "templates.json");

function ensureFilesExist() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  if (!fs.existsSync(MESSAGES_FILE)) {
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify([], null, 2));
  }

  const defaultTemplates = [
    {
      id: "tpl-bday-annual",
      title: "🎂 Celebrate Birthday Again at HaruViru!",
      category: "BIRTHDAY",
      message: "Dear {customerName}, your birthday is coming up on {eventDate}! 🎂 Celebrate your special day again in our celebration house at {branchName}. Book your private hall slot now and get flat 20% OFF with code {couponCode}. Reserve here: {bookingLink}",
      couponCode: "BDAY2026",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-bday-surprise",
      title: "🎈 Special Birthday Party Return Package",
      category: "BIRTHDAY",
      message: "Hi {customerName}, planning your birthday party on {eventDate}? 🎈 Re-visit {branchName} for a grand celebration with free LED lights & cake setup! Use coupon {couponCode} for special discount. Book now: {bookingLink}",
      couponCode: "BDAYSURPRISE",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-anniversary-annual",
      title: "💍 Celebrate Anniversary Again at HaruViru!",
      category: "ANNIVERSARY",
      message: "Happy Anniversary, {customerName}! 💍 Re-live your romantic anniversary memories at {branchName} on {eventDate}. Enjoy complimentary candle setup & 15% OFF with coupon {couponCode}. Reserve your slot: {bookingLink}",
      couponCode: "LOVE2026",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-anniversary-date",
      title: "✨ Romantic Anniversary Candlelight Deal",
      category: "ANNIVERSARY",
      message: "Dear {customerName}, your special anniversary is coming on {eventDate}! ✨ Book your private mini-theater & celebration hall at {branchName}. Use coupon {couponCode} for special discount: {bookingLink}",
      couponCode: "ROMANCE20",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
  ];

  if (!fs.existsSync(TEMPLATES_FILE)) {
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2));
  } else {
    try {
      const existing = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
      const hasBday = existing.some((t) => t.category === "BIRTHDAY");
      const hasAnni = existing.some((t) => t.category === "ANNIVERSARY");
      if (!hasBday || !hasAnni) {
        const merged = [...defaultTemplates, ...existing.filter((t) => t.category === "BIRTHDAY" || t.category === "ANNIVERSARY")];
        fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(merged, null, 2));
      }
    } catch (e) {
      fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2));
    }
  }
}

export async function saveWhatsAppMessage({ phone, sender, senderName, message, status = "SENT", metaId = null, waLink = null }) {
  ensureFilesExist();
  if (!phone) return null;
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

  let savedMessage = null;

  // Attempt database save first
  try {
    if (db && db.whatsAppMessage) {
      const dbMsg = await db.whatsAppMessage.create({
        data: {
          phone: normalizedPhone,
          sender: sender || "ADMIN",
          senderName: senderName || (sender === "CUSTOMER" ? "Customer" : "HaruViru Admin"),
          message,
          status,
          metaId,
          waLink,
        },
      });
      savedMessage = {
        id: dbMsg.id,
        phone: dbMsg.phone,
        sender: dbMsg.sender,
        senderName: dbMsg.senderName,
        message: dbMsg.message,
        status: dbMsg.status,
        metaId: dbMsg.metaId,
        waLink: dbMsg.waLink,
        timestamp: dbMsg.createdAt.toISOString(),
      };
    }
  } catch (dbErr) {
    console.warn("[WhatsApp Chat Store DB Save Warning]:", dbErr.message);
  }

  // File system sync fallback
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    const fileMessage = savedMessage || {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      phone: normalizedPhone,
      sender: sender || "ADMIN",
      senderName: senderName || (sender === "CUSTOMER" ? "Customer" : "HaruViru Admin"),
      message,
      status,
      metaId,
      waLink,
      timestamp: new Date().toISOString(),
    };

    data.push(fileMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
    return fileMessage;
  } catch (fileErr) {
    console.error("[WhatsApp Chat Store File Save Error]:", fileErr);
    return savedMessage;
  }
}

export async function getWhatsAppMessagesForPhone(phone) {
  ensureFilesExist();
  if (!phone) return [];
  const cleanPhone = String(phone).replace(/[^0-9]/g, "");
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const tenDigits = normalizedPhone.slice(-10);

  let dbMessages = [];
  try {
    if (db && db.whatsAppMessage) {
      const records = await db.whatsAppMessage.findMany({
        where: {
          OR: [
            { phone: { endsWith: tenDigits } },
            { phone: { contains: tenDigits } },
          ],
        },
        orderBy: { createdAt: "asc" },
      });
      dbMessages = records.map((m) => ({
        id: m.id,
        phone: m.phone,
        sender: m.sender,
        senderName: m.senderName,
        message: m.message,
        status: m.status,
        metaId: m.metaId,
        waLink: m.waLink,
        timestamp: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
      }));
    }
  } catch (dbErr) {
    console.warn("[WhatsApp Chat Store DB Fetch Warning]:", dbErr.message);
  }

  let fileMessages = [];
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    fileMessages = data.filter((m) => {
      const mClean = m.phone ? String(m.phone).replace(/[^0-9]/g, "") : "";
      return mClean.endsWith(tenDigits) || mClean.includes(tenDigits);
    });
  } catch (fileErr) {
    console.error("[WhatsApp Chat Store File Fetch Error]:", fileErr);
  }

  // Merge & deduplicate by metaId or sender+message+5s window
  const map = new Map();
  for (const m of [...fileMessages, ...dbMessages]) {
    const timeBucket = Math.floor(new Date(m.timestamp).getTime() / 5000);
    const key = m.metaId || `${m.sender}-${m.message}-${timeBucket}`;
    if (!map.has(key)) {
      map.set(key, m);
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(a.timestamp) - new Date(b.timestamp)
  );
}

export async function getAllWhatsAppConversations() {
  ensureFilesExist();

  let allMessages = [];

  try {
    if (db && db.whatsAppMessage) {
      const records = await db.whatsAppMessage.findMany({
        orderBy: { createdAt: "asc" },
      });
      allMessages = records.map((m) => ({
        id: m.id,
        phone: m.phone,
        sender: m.sender,
        senderName: m.senderName,
        message: m.message,
        status: m.status,
        timestamp: m.createdAt ? m.createdAt.toISOString() : new Date().toISOString(),
      }));
    }
  } catch (e) {
    // ignore DB error
  }

  try {
    const fileData = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    allMessages = [...fileData, ...allMessages];
  } catch (e) {
    // ignore File error
  }

  // Sort all messages ascending by timestamp before grouping
  allMessages.sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));

  const map = new Map();

  for (const m of allMessages) {
    if (!m.phone) continue;
    const cleanPhone = String(m.phone).replace(/[^0-9]/g, "");
    if (!cleanPhone) continue;
    const tenDigits = cleanPhone.slice(-10);

    if (!map.has(tenDigits)) {
      map.set(tenDigits, {
        phone: cleanPhone,
        cleanPhone: cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone,
        lastMessage: m.message,
        lastSender: m.sender,
        lastTimestamp: m.timestamp,
        unreadCount: m.sender === "CUSTOMER" ? 1 : 0,
      });
    } else {
      const conv = map.get(tenDigits);
      conv.lastMessage = m.message;
      conv.lastSender = m.sender;
      conv.lastTimestamp = m.timestamp;
      if (m.sender === "CUSTOMER") conv.unreadCount += 1;
    }
  }

  return Array.from(map.values()).sort(
    (a, b) => new Date(b.lastTimestamp) - new Date(a.lastTimestamp)
  );
}

export async function saveWhatsAppTemplate({ title, category = "FESTIVAL", message, couponCode = "", callToActionUrl = "" }) {
  ensureFilesExist();
  let savedTpl = null;

  try {
    if (db && db.whatsAppTemplate) {
      const dbTpl = await db.whatsAppTemplate.create({
        data: {
          title,
          category,
          message,
          couponCode: couponCode ? couponCode.toUpperCase() : "",
          callToActionUrl: callToActionUrl || "https://haruviru.com/branches",
        },
      });
      savedTpl = {
        id: dbTpl.id,
        title: dbTpl.title,
        category: dbTpl.category,
        message: dbTpl.message,
        couponCode: dbTpl.couponCode,
        callToActionUrl: dbTpl.callToActionUrl,
        createdAt: dbTpl.createdAt.toISOString(),
      };
    }
  } catch (e) {
    console.warn("DB template save warning:", e.message);
  }

  try {
    const data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
    const fileTpl = savedTpl || {
      id: `tpl-${Date.now()}`,
      title,
      category,
      message,
      couponCode: couponCode ? couponCode.toUpperCase() : "",
      callToActionUrl: callToActionUrl || "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    };

    data.unshift(fileTpl);
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
    return fileTpl;
  } catch (e) {
    return savedTpl;
  }
}

export async function getAllWhatsAppTemplates() {
  ensureFilesExist();
  let dbTpls = [];

  try {
    if (db && db.whatsAppTemplate) {
      const records = await db.whatsAppTemplate.findMany({
        orderBy: { createdAt: "desc" },
      });
      dbTpls = records.map((t) => ({
        id: t.id,
        title: t.title,
        category: t.category,
        message: t.message,
        couponCode: t.couponCode,
        callToActionUrl: t.callToActionUrl,
        createdAt: t.createdAt.toISOString(),
      }));
    }
  } catch (e) {
    // ignore
  }

  let fileTpls = [];
  try {
    fileTpls = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
  } catch (e) {
    // ignore
  }

  const defaultFallback = [
    {
      id: "tpl-bday-annual",
      title: "🎂 Celebrate Birthday Again at HaruViru!",
      category: "BIRTHDAY",
      message: "Dear {customerName}, your birthday is coming up on {eventDate}! 🎂 Celebrate your special day again in our celebration house at {branchName}. Book your private hall slot now and get flat 20% OFF with code {couponCode}. Reserve here: {bookingLink}",
      couponCode: "BDAY2026",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-bday-surprise",
      title: "🎈 Special Birthday Party Return Package",
      category: "BIRTHDAY",
      message: "Hi {customerName}, planning your birthday party on {eventDate}? 🎈 Re-visit {branchName} for a grand celebration with free LED lights & cake setup! Use coupon {couponCode} for special discount. Book now: {bookingLink}",
      couponCode: "BDAYSURPRISE",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-anniversary-annual",
      title: "💍 Celebrate Anniversary Again at HaruViru!",
      category: "ANNIVERSARY",
      message: "Happy Anniversary, {customerName}! 💍 Re-live your romantic anniversary memories at {branchName} on {eventDate}. Enjoy complimentary candle setup & 15% OFF with coupon {couponCode}. Reserve your slot: {bookingLink}",
      couponCode: "LOVE2026",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
    {
      id: "tpl-anniversary-date",
      title: "✨ Romantic Anniversary Candlelight Deal",
      category: "ANNIVERSARY",
      message: "Dear {customerName}, your special anniversary is coming on {eventDate}! ✨ Book your private mini-theater & celebration hall at {branchName}. Use coupon {couponCode} for special discount: {bookingLink}",
      couponCode: "ROMANCE20",
      callToActionUrl: "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    },
  ];

  const map = new Map();
  for (const t of [...defaultFallback, ...fileTpls, ...dbTpls]) {
    if (t && (t.category === "BIRTHDAY" || t.category === "ANNIVERSARY")) {
      if (!map.has(t.id)) map.set(t.id, t);
    }
  }

  return Array.from(map.values());
}

export async function deleteWhatsAppTemplate(templateId) {
  ensureFilesExist();
  try {
    if (db && db.whatsAppTemplate) {
      await db.whatsAppTemplate.delete({ where: { id: templateId } }).catch(() => {});
    }
  } catch (e) {}

  try {
    let data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
    data = data.filter((t) => t.id !== templateId);
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    return false;
  }
}
