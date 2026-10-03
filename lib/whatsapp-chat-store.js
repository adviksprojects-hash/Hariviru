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

  if (!fs.existsSync(TEMPLATES_FILE)) {
    const defaultTemplates = [
      {
        id: "tpl-diwali",
        title: "🪔 Happy Diwali Festive Special Offer!",
        category: "FESTIVAL",
        message: "Celebrate this Diwali at HaruViru Celebration House! Get flat 20% OFF on premium private party slots with custom cake & photo booth setup included.",
        couponCode: "DIWALI20",
        callToActionUrl: "https://haruviru.com/branches",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tpl-holi",
        title: "🎨 Happy Holi Color Celebration Deal!",
        message: "Bring vivid colors to your special moments! Reserve your private celebration hall for Holi parties with exclusive discounts & complimentary balloons.",
        category: "FESTIVAL",
        couponCode: "HOLI2026",
        callToActionUrl: "https://haruviru.com/branches",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tpl-newyear",
        title: "🎆 New Year Party Paradise Offer!",
        category: "FESTIVAL",
        message: "Ring in the New Year with your closest crew in your private celebration theater & hall! Special evening and night slots open now.",
        couponCode: "NEWYEAR26",
        callToActionUrl: "https://haruviru.com/branches",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tpl-birthday",
        title: "🎂 Birthday Special Surprise Package!",
        category: "OFFER",
        message: "Is a birthday coming up? Book HaruViru Celebration House and receive free LED name lights + customized birthday cake setup!",
        couponCode: "BIRTHDAY10",
        callToActionUrl: "https://haruviru.com/branches",
        createdAt: new Date().toISOString(),
      },
      {
        id: "tpl-weekend",
        title: "🌟 Weekend Special Romantic Date Night",
        category: "OFFER",
        message: "Plan a romantic mini-theater movie date or anniversary surprise this weekend! Flat 15% discount for early slot bookings.",
        couponCode: "WEEKEND15",
        callToActionUrl: "https://haruviru.com/branches",
        createdAt: new Date().toISOString(),
      },
    ];
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(defaultTemplates, null, 2));
  }
}

export async function saveWhatsAppMessage({ phone, sender, senderName, message, status = "SENT", metaId = null, waLink = null }) {
  ensureFilesExist();
  const cleanPhone = phone.replace(/[^0-9]/g, "");
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
  const cleanPhone = phone.replace(/[^0-9]/g, "");
  const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const tenDigits = normalizedPhone.slice(-10);

  let dbMessages = [];
  try {
    if (db && db.whatsAppMessage) {
      const records = await db.whatsAppMessage.findMany({
        where: {
          OR: [
            { phone: { endsWith: tenDigits } },
            { phone: normalizedPhone },
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
        timestamp: m.createdAt.toISOString(),
      }));
    }
  } catch (dbErr) {
    console.warn("[WhatsApp Chat Store DB Fetch Warning]:", dbErr.message);
  }

  let fileMessages = [];
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    fileMessages = data.filter((m) => {
      const mClean = m.phone.replace(/[^0-9]/g, "");
      return mClean.endsWith(tenDigits);
    });
  } catch (fileErr) {
    console.error("[WhatsApp Chat Store File Fetch Error]:", fileErr);
  }

  // Merge & deduplicate by id/metaId/timestamp+message
  const map = new Map();
  for (const m of [...fileMessages, ...dbMessages]) {
    const key = m.metaId || `${m.timestamp}-${m.sender}-${m.message.slice(0, 15)}`;
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
        timestamp: m.createdAt.toISOString(),
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

  const map = new Map();

  for (const m of allMessages) {
    const cleanPhone = m.phone.replace(/[^0-9]/g, "");
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

  const map = new Map();
  for (const t of [...fileTpls, ...dbTpls]) {
    if (!map.has(t.id)) map.set(t.id, t);
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
