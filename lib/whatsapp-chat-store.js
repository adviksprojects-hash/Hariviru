import fs from "fs";
import path from "path";

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

export function saveWhatsAppMessage({ phone, sender, senderName, message, status = "SENT", metaId = null, waLink = null }) {
  ensureFilesExist();
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;

    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");

    const newMessage = {
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      phone: normalizedPhone,
      sender: sender || "ADMIN", // "ADMIN" | "CUSTOMER" | "SYSTEM"
      senderName: senderName || (sender === "CUSTOMER" ? "Customer" : "HaruViru Admin"),
      message,
      status,
      metaId,
      waLink,
      timestamp: new Date().toISOString(),
    };

    data.push(newMessage);
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(data, null, 2));
    return newMessage;
  } catch (err) {
    console.error("[WhatsApp Chat Store Error saving message]:", err);
    return null;
  }
}

export function getWhatsAppMessagesForPhone(phone) {
  ensureFilesExist();
  try {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    const normalizedPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
    const tenDigits = normalizedPhone.slice(-10);

    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");

    return data.filter((m) => {
      const mClean = m.phone.replace(/[^0-9]/g, "");
      return mClean.endsWith(tenDigits);
    }).sort((a, b) => new Date(a.timestamp) - new Date(b.timestamp));
  } catch (err) {
    console.error("[WhatsApp Chat Store Error getting messages]:", err);
    return [];
  }
}

export function getAllWhatsAppConversations() {
  ensureFilesExist();
  try {
    const data = JSON.parse(fs.readFileSync(MESSAGES_FILE, "utf-8") || "[]");
    const map = new Map();

    for (const m of data) {
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
  } catch (err) {
    console.error("[WhatsApp Chat Store Error getting conversations]:", err);
    return [];
  }
}

export function saveWhatsAppTemplate({ title, category = "FESTIVAL", message, couponCode = "", callToActionUrl = "" }) {
  ensureFilesExist();
  try {
    const data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");

    const newTpl = {
      id: `tpl-${Date.now()}`,
      title,
      category,
      message,
      couponCode: couponCode ? couponCode.toUpperCase() : "",
      callToActionUrl: callToActionUrl || "https://haruviru.com/branches",
      createdAt: new Date().toISOString(),
    };

    data.unshift(newTpl);
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
    return newTpl;
  } catch (err) {
    console.error("[WhatsApp Chat Store Error saving template]:", err);
    return null;
  }
}

export function getAllWhatsAppTemplates() {
  ensureFilesExist();
  try {
    return JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
  } catch (err) {
    console.error("[WhatsApp Chat Store Error getting templates]:", err);
    return [];
  }
}

export function deleteWhatsAppTemplate(templateId) {
  ensureFilesExist();
  try {
    let data = JSON.parse(fs.readFileSync(TEMPLATES_FILE, "utf-8") || "[]");
    data = data.filter((t) => t.id !== templateId);
    fs.writeFileSync(TEMPLATES_FILE, JSON.stringify(data, null, 2));
    return true;
  } catch (err) {
    console.error("[WhatsApp Chat Store Error deleting template]:", err);
    return false;
  }
}
