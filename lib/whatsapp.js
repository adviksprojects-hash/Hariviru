/**
 * WhatsApp Confirmation Helper for HaruViru Celebration House
 * Configured for Meta WhatsApp Business Cloud API v20.0
 */

export function buildWhatsAppConfirmationText(booking, branch) {
  const phone = booking.customerPhone?.replace(/[^0-9]/g, "") || "";
  const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const msg = `🎉 *HARUVIRU CELEBRATION HOUSE - BOOKING CONFIRMED!* 🎉

Hello *${booking.customerName}*,
Your celebration slot booking at *${branch.name}* has been APPROVED & CONFIRMED!

🎟️ *Booking Ref:* ${booking.bookingNumber}
📅 *Date:* ${dateStr}
🕒 *Time Slot:* ${booking.slotTitle || "Celebration Slot"}
💰 *Total Paid:* ₹${booking.totalAmount}
📍 *Location:* ${branch.address}, ${branch.city}

Please arrive 10 minutes prior to your reserved slot time. If you have custom cake or theme requests, reply to this message directly!

Thank you for choosing HaruViru Celebration House! ✨`;

  return {
    cleanPhone,
    msg,
    waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
  };
}

export async function sendWhatsAppConfirmationApi(booking, branch) {
  const { cleanPhone, msg } = buildWhatsAppConfirmationText(booking, branch);

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1370253626163605";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  if (!apiToken) {
    console.log("[WhatsApp API] Token missing. Using wa.me link fallback.");
    return { success: false, fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` };
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "booking_confirmation";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Meta WhatsApp Business Cloud API JSON payload
  const bodyData = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
    },
  };

  if (templateName !== "hello_world") {
    bodyData.template.components = [
      {
        type: "body",
        parameters: [
          { type: "text", text: booking.customerName || "Valued Customer" },
          { type: "text", text: branch.name || "HaruViru Celebration House" },
          { type: "text", text: booking.bookingNumber || "HV-2026-BOOK" },
          { type: "text", text: dateStr },
          { type: "text", text: booking.slotTitle || "Celebration Slot" },
          { type: "text", text: String(booking.totalAmount || 0) },
          { type: "text", text: `${branch.address || ""}, ${branch.city || ""}`.trim() },
        ],
      },
    ];
  }

  const candidateIds = [...new Set([primaryPhoneId, "1370253626163605", "2957722077941505"])];

  let lastData = null;
  for (const pId of candidateIds) {
    const apiUrl = `https://graph.facebook.com/v20.0/${pId}/messages`;
    console.log(`[WhatsApp API] Trying ${apiUrl}...`);

    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(bodyData),
      });

      const data = await res.json();
      console.log(`[WhatsApp API Response for ID ${pId}]:`, JSON.stringify(data, null, 2));
      lastData = data;

      if (res.ok && !data.error) {
        console.log(`✅ [WhatsApp API Success] Message delivered using Phone ID ${pId}!`);
        return { success: true, data, usedPhoneId: pId };
      }
    } catch (err) {
      console.error(`[WhatsApp API Error for ID ${pId}]:`, err);
    }
  }

  return {
    success: false,
    error: lastData?.error?.message || "Failed to send WhatsApp message",
    data: lastData,
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
  };
}

/**
 * WhatsApp Notification for Branch Manager upon new customer online booking
 */
export function buildManagerWhatsAppNotificationText(booking, branch) {
  let managerPhone = null;

  if (branch?.managers && Array.isArray(branch.managers) && branch.managers.length > 0) {
    const mgrWithPhone = branch.managers.find(
      (m) => m.phone && m.phone.replace(/[^0-9]/g, "").length >= 10
    );
    if (mgrWithPhone) {
      managerPhone = mgrWithPhone.phone;
    }
  }

  const rawPhone =
    managerPhone ||
    branch?.whatsapp ||
    branch?.phone ||
    process.env.ADMIN_WHATSAPP_PHONE ||
    "9762486649";

  let cleanPhone = rawPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) {
    cleanPhone = cleanPhone.slice(1);
  }
  if (cleanPhone.length === 10) {
    cleanPhone = `91${cleanPhone}`;
  }

  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const msg = `🔔 *NEW ONLINE CELEBRATION BOOKING RECEIVED!* 🔔

📍 *Branch:* ${branch?.name || "HaruViru"}
🎟️ *Booking Ref:* ${booking.bookingNumber}
👤 *Customer Name:* ${booking.customerName}
📞 *Customer Phone:* ${booking.customerPhone}
📧 *Customer Email:* ${booking.customerEmail || "N/A"}
🏛️ *Hall:* ${booking.hallName || "Hall 1"}
📅 *Date:* ${dateStr}
🕒 *Time Slot:* ${booking.slotTitle || "Celebration Slot"}
💰 *Total Amount:* ₹${booking.totalAmount}
💳 *UTR / Txn ID:* ${booking.transactionId || "Submitted"}

Please log into Manager Dashboard to verify payment & confirm slot! ✨`;

  return {
    cleanPhone,
    msg,
    waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
  };
}

export async function sendManagerBookingNotification(booking, branch) {
  const { cleanPhone, msg } = buildManagerWhatsAppNotificationText(booking, branch);

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1370253626163605";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  if (!apiToken) {
    console.log("[WhatsApp Manager API] Token missing. Fallback waLink created:", cleanPhone);
    return { success: false, fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` };
  }

  const managerTemplateName = process.env.WHATSAPP_MANAGER_TEMPLATE_NAME || "manager_booking_alert";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  // Candidate payload 1: 9 Body Parameters with Hall Name as parameter 5
  const templatePayload9Body = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: managerTemplateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: booking.hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: booking.slotTitle || "Celebration Slot" },
            { type: "text", text: String(booking.totalAmount || 0) },
            { type: "text", text: booking.transactionId || "Submitted" },
          ],
        },
      ],
    },
  };

  // Candidate payload 2: 1 Header parameter + 8 Body parameters (9 params total)
  const templatePayloadHeaderBody = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: managerTemplateName,
      language: { code: templateLang },
      components: [
        {
          type: "header",
          parameters: [{ type: "text", text: branch?.name || "HaruViru Branch" }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: booking.hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: booking.slotTitle || "Celebration Slot" },
            { type: "text", text: String(booking.totalAmount || 0) },
          ],
        },
      ],
    },
  };

  // Candidate payload 3: 9 Body parameters (Customer name first, Hall Name as param 5)
  const templatePayload9Alt = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: managerTemplateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: booking.hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: booking.slotTitle || "Celebration Slot" },
            { type: "text", text: String(booking.totalAmount || 0) },
            { type: "text", text: booking.transactionId || "Submitted" },
          ],
        },
      ],
    },
  };

  const templateCandidates = [templatePayload9Body, templatePayloadHeaderBody, templatePayload9Alt];
  const candidateIds = [...new Set([primaryPhoneId, "1370253626163605"])];
  let lastData = null;

  for (const pId of candidateIds) {
    for (let i = 0; i < templateCandidates.length; i++) {
      const payload = templateCandidates[i];
      const apiUrl = `https://graph.facebook.com/v20.0/${pId}/messages`;
      try {
        console.log(`[WhatsApp Manager Template API] Trying candidate ${i + 1} for template '${managerTemplateName}' to ${cleanPhone} via Phone ID ${pId}...`);
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log(`[WhatsApp Manager Template Response Candidate ${i + 1} for ID ${pId}]:`, JSON.stringify(data, null, 2));
        lastData = data;

        if (res.ok && !data.error) {
          console.log(`✅ [WhatsApp Manager Notification Sent!] Delivered template '${managerTemplateName}' candidate ${i + 1} to ${cleanPhone}!`);
          return { success: true, data, usedTemplate: managerTemplateName, candidateIndex: i + 1 };
        }
      } catch (err) {
        console.error(`[WhatsApp Manager Template API Error Candidate ${i + 1} for ID ${pId}]:`, err);
      }
    }
  }

  // Fallback to text message if templates fail
  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    text: { body: msg },
  };

  for (const pId of candidateIds) {
    const apiUrl = `https://graph.facebook.com/v20.0/${pId}/messages`;
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(textPayload),
      });

      const data = await res.json();
      lastData = data;

      if (res.ok && !data.error) {
        console.log(`✅ [WhatsApp Manager Text Notification Sent] Delivered text alert to ${cleanPhone}`);
        return { success: true, data };
      }
    } catch (err) {
      console.error(`[WhatsApp Manager Text API Error for ID ${pId}]:`, err);
    }
  }

  return {
    success: false,
    error: lastData?.error?.message || "Failed to send WhatsApp manager alert",
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
  };
}
