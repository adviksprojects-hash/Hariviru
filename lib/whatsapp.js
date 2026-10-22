/**
 * WhatsApp Confirmation Helper for HaruViru Celebration House
 * Configured for Meta WhatsApp Business Cloud API v20.0
 */
import { getAdminNotificationSettings } from "./system-settings";
import { saveWhatsAppMessage } from "./whatsapp-chat-store";

import {
  buildWhatsAppConfirmationText,
  buildManagerWhatsAppNotificationText,
  buildAdminBookingNotificationText,
} from "./whatsapp-text";

export {
  buildWhatsAppConfirmationText,
  buildManagerWhatsAppNotificationText,
  buildAdminBookingNotificationText,
};

export async function sendWhatsAppConfirmationApi(booking, branch) {
  const {
    cleanPhone,
    msg,
    hallName,
    slotTitle,
    totalStr,
    paidStr,
    remainingStr,
    location,
    formattedMgrPhone,
    dateStr: formattedDateStr,
  } = buildWhatsAppConfirmationText(booking, branch);

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  if (!apiToken) {
    console.log("[WhatsApp API] Token missing. Using wa.me link fallback.");
    return { success: false, fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` };
  }

  const templateName = process.env.WHATSAPP_TEMPLATE_NAME || "booking_confirmation";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const dateStr =
    formattedDateStr ||
    new Date(booking.bookingDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  let managerPhone = null;
  if (branch?.managers && Array.isArray(branch.managers) && branch.managers.length > 0) {
    const mgrWithPhone = branch.managers.find(
      (m) => m.phone && m.phone.replace(/[^0-9]/g, "").length >= 10
    );
    if (mgrWithPhone) {
      managerPhone = mgrWithPhone.phone;
    }
  }

  const branchContactPhone =
    formattedMgrPhone ||
    managerPhone ||
    branch?.whatsapp ||
    branch?.phone ||
    process.env.ADMIN_WHATSAPP_PHONE ||
    "+91 9762486649";

  const branchAddress =
    location ||
    `${branch?.address || ""}, ${branch?.city || ""}`.trim() ||
    branch?.name ||
    "HaruViru Branch";

  // Candidate 1: 11 Body Parameters with full Deposit breakdown
  // {{1}} Customer, {{2}} Branch, {{3}} Hall, {{4}} BookingRef, {{5}} Date, {{6}} Slot,
  // {{7}} Total, {{8}} Paid, {{9}} Remaining, {{10}} Location, {{11}} Branch Phone
  const candidate11BodyWithDeposit = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName || "Valued Customer" },
            { type: "text", text: branch?.name || "HaruViru Celebration House" },
            { type: "text", text: hallName || "Hall 1" },
            { type: "text", text: booking.bookingNumber || "HV-2026-BOOK" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: paidStr || String(booking.totalAmount || 0) },
            { type: "text", text: remainingStr || "0" },
            { type: "text", text: branchAddress },
            { type: "text", text: branchContactPhone },
          ],
        },
      ],
    },
  };

  // Candidate 2: 9 Body Parameters (Legacy: Customer, Branch, BookingRef, Date, Slot, Total, Address, Hall, Branch Phone)
  const candidate9BodyWithPhone = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName || "Valued Customer" },
            { type: "text", text: branch?.name || "HaruViru Celebration House" },
            { type: "text", text: booking.bookingNumber || "HV-2026-BOOK" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: branchAddress },
            { type: "text", text: hallName || "Hall 1" },
            { type: "text", text: branchContactPhone },
          ],
        },
      ],
    },
  };

  // Candidate 3: 1 Header parameter + 8 Body parameters
  const candidateHeaderPlus8Body = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "header",
          parameters: [{ type: "text", text: branch?.name || "HaruViru Celebration House" }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName || "Valued Customer" },
            { type: "text", text: branch?.name || "HaruViru Celebration House" },
            { type: "text", text: booking.bookingNumber || "HV-2026-BOOK" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: branchAddress },
            { type: "text", text: hallName || "Hall 1" },
          ],
        },
      ],
    },
  };

  // Candidate 4: 8 Body parameters
  const candidate8Body = {
    messaging_product: "whatsapp",
    to: cleanPhone,
    type: "template",
    template: {
      name: templateName,
      language: { code: templateLang },
      components: [
        {
          type: "body",
          parameters: [
            { type: "text", text: booking.customerName || "Valued Customer" },
            { type: "text", text: branch?.name || "HaruViru Celebration House" },
            { type: "text", text: booking.bookingNumber || "HV-2026-BOOK" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: branchAddress },
            { type: "text", text: hallName || "Hall 1" },
          ],
        },
      ],
    },
  };

  const templateCandidates = [
    candidate11BodyWithDeposit,
    candidate9BodyWithPhone,
    candidateHeaderPlus8Body,
    candidate8Body,
  ];

  const candidateIds = [primaryPhoneId];
  let lastData = null;

  for (const pId of candidateIds) {
    for (let i = 0; i < templateCandidates.length; i++) {
      const payload = templateCandidates[i];
      const apiUrl = `https://graph.facebook.com/v20.0/${pId}/messages`;
      console.log(`[WhatsApp API] Trying candidate ${i + 1} for template '${templateName}' to ${cleanPhone} via Phone ID ${pId}...`);

      try {
        const res = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify(payload),
        });

        const data = await res.json();
        console.log(`[WhatsApp API Response Candidate ${i + 1} for ID ${pId}]:`, JSON.stringify(data, null, 2));
        lastData = data;

        if (res.ok && !data.error) {
          console.log(`✅ [WhatsApp API Success] Message delivered with Candidate ${i + 1} using Phone ID ${pId}!`);
          return { success: true, data, usedPhoneId: pId, candidateIndex: i + 1 };
        }
      } catch (err) {
        console.error(`[WhatsApp API Error Candidate ${i + 1} for ID ${pId}]:`, err);
      }
    }
  }

  return {
    success: false,
    error: lastData?.error?.message || "Failed to send WhatsApp message",
    data: lastData,
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
  };
}


export async function sendManagerBookingNotification(booking, branch) {
  const {
    cleanPhone,
    msg,
    branchName,
    hallName,
    slotTitle,
    totalStr,
    paidStr,
    remainingStr,
    txnId,
    dateStr: formattedDateStr,
  } = buildManagerWhatsAppNotificationText(booking, branch);

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  if (!apiToken) {
    console.log("[WhatsApp Manager API] Token missing. Fallback waLink created:", cleanPhone);
    return { success: false, fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}` };
  }

  const managerTemplateName = process.env.WHATSAPP_MANAGER_TEMPLATE_NAME || "manager_booking_alert";
  const templateLang = process.env.WHATSAPP_TEMPLATE_LANG || "en";

  const dateStr =
    formattedDateStr ||
    new Date(booking.bookingDate).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  // Candidate payload 1: 11 Body Parameters with full Deposit breakdown
  // {{1}} Branch, {{2}} BookingRef, {{3}} Customer, {{4}} Phone, {{5}} Hall, {{6}} Date,
  // {{7}} Slot, {{8}} Total, {{9}} Paid/Deposit, {{10}} Remaining, {{11}} Txn ID
  const templatePayload11Body = {
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
            { type: "text", text: branchName || branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: paidStr || String(booking.totalAmount || 0) },
            { type: "text", text: remainingStr || "0" },
            { type: "text", text: txnId || booking.transactionId || "Submitted" },
          ],
        },
      ],
    },
  };

  // Candidate payload 2: 9 Body Parameters (Legacy: Branch, BookingRef, Customer, Phone, Hall, Date, Slot, Total, TxnId)
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
            { type: "text", text: branchName || branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
            { type: "text", text: txnId || booking.transactionId || "Submitted" },
          ],
        },
      ],
    },
  };

  // Candidate payload 3: 1 Header parameter + 8 Body parameters (Legacy)
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
          parameters: [{ type: "text", text: branchName || branch?.name || "HaruViru Branch" }],
        },
        {
          type: "body",
          parameters: [
            { type: "text", text: branchName || branch?.name || "HaruViru Branch" },
            { type: "text", text: booking.bookingNumber || "HV-BOOK" },
            { type: "text", text: booking.customerName || "Customer" },
            { type: "text", text: booking.customerPhone || "N/A" },
            { type: "text", text: hallName || "Hall 1" },
            { type: "text", text: dateStr },
            { type: "text", text: slotTitle || "Celebration Slot" },
            { type: "text", text: totalStr || String(booking.totalAmount || 0) },
          ],
        },
      ],
    },
  };

  const templateCandidates = [
    templatePayload11Body,
    templatePayload9Body,
    templatePayloadHeaderBody,
  ];
  const candidateIds = [primaryPhoneId];
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

/**
 * WhatsApp Marketing & Festival Offer Broadcast Helper
 */
export async function sendWhatsAppMarketingCampaign(toPhone, campaignTitle, offerMessage, couponCode, callToActionUrl) {
  let cleanPhone = toPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  const msgText = `🎉 *HARUVIRU CELEBRATION HOUSE - FESTIVE OFFER!* 🎉\n\n📢 *${campaignTitle}*\n\n${offerMessage}\n\n${couponCode ? `🎟️ *Special Coupon Code:* ${couponCode}\n\n` : ""}👉 *Book Your Arena Now:* ${callToActionUrl || "https://haruvirucelebrationhouse.in/branches"}\n\n✨ Celebrate Special Moments in Your Private Paradise! ✨`;

  if (!apiToken) {
    return {
      success: false,
      cleanPhone,
      fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`,
      error: "WhatsApp API Token missing in environment",
    };
  }

  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    text: { body: msgText },
  };

  const candidateIds = [primaryPhoneId];

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
      if (res.ok && !data.error) {
        return { success: true, cleanPhone, data };
      }
    } catch (err) {
      console.error(`[WhatsApp Marketing Broadcast Error for ID ${pId}]:`, err);
    }
  }

  return {
    success: false,
    cleanPhone,
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`,
    error: "Failed to deliver Meta API message",
  };
}

/**
 * Direct WhatsApp Text Message Helper for Admin Chat Inbox Reply
 */
export async function sendWhatsAppDirectTextMessage(toPhone, textMessage) {
  let cleanPhone = toPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, '').trim();

  if (!apiToken) {
    return {
      success: false,
      cleanPhone,
      fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`,
      error: "WhatsApp API Token missing in environment",
    };
  }

  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    text: { body: textMessage },
  };

  const candidateIds = [primaryPhoneId];

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
      if (res.ok && !data.error) {
        return { success: true, cleanPhone, data };
      }
    } catch (err) {
      console.error(`[WhatsApp Direct Reply Error for ID ${pId}]:`, err);
    }
  }

  return {
    success: false,
    cleanPhone,
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(textMessage)}`,
    error: "Failed to deliver Meta API direct message",
  };
}

/**
 * WhatsApp 1-Year Birthday & Anniversary Re-Booking Template Helper
 * Invokes 'anniversary_rebook_reminder' or 'birthday_rebook_reminder' marketing templates on Meta Cloud API
 * Configured with 3 body parameters: {{1}} customerName, {{2}} eventDate, {{3}} branchName and "Visit website" button
 */
export async function sendWhatsAppRebookReminderTemplateApi({
  toPhone,
  customerName,
  eventDate,
  branchName,
  couponCode,
  category,
}) {
  let cleanPhone = toPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
  if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

  const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
  const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, "").trim();

  const isAnniversary = category === "ANNIVERSARY";
  const templateName = isAnniversary ? "anniversary_rebook_reminder" : "birthday_rebook_reminder";
  const configuredLang = (process.env.WHATSAPP_TEMPLATE_LANG || "en").trim();
  const langCandidates = Array.from(new Set([configuredLang, "en", "en_US"]));

  const safeCustomerName = customerName || (isAnniversary ? "Valued Couple" : "Valued Customer");
  const safeEventDate = eventDate || "Upcoming Date";
  const safeBranchName = branchName || "HaruViru Pune";

  // Exact marketing message text matching approved Facebook Business Suite templates
  const msgText = isAnniversary
    ? `💍 *CELEBRATE YOUR ANNIVERSARY AGAIN AT HARUVIRU!* 💍\n\nDear *${safeCustomerName}*,\nHappy Anniversary Month! Your anniversary celebration date is on *${safeEventDate}*! ✨\n\nRe-live your romantic memories at *${safeBranchName}* with a complimentary candlelight & cake setup.\nThank You !!!\n\n👉 Visit website: https://haruviru.com/branches`
    : `🎂 *CELEBRATE YOUR BIRTHDAY AGAIN AT HARUVIRU!* 🎂\n\nDear *${safeCustomerName}*,\nYour birthday is coming up on *${safeEventDate}*! 🎈\n\nRe-visit *${safeBranchName}* to celebrate your special day again in your private celebration house & mini-theater.\nThank You !!!\n\n👉 Visit website: https://haruviru.com/branches`;

  if (!apiToken) {
    return {
      success: false,
      cleanPhone,
      fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`,
      error: "WhatsApp API Token missing in environment",
    };
  }

  // Construct template payload candidates
  const buildPayloadsForLang = (lang) => {
    // Candidate 1: Standard 3 Body parameters ({{1}}=customerName, {{2}}=eventDate, {{3}}=branchName)
    const candidate3Body = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: safeCustomerName },
              { type: "text", text: safeEventDate },
              { type: "text", text: safeBranchName },
            ],
          },
        ],
      },
    };

    // Candidate 2: 3 Body parameters + 1 Dynamic URL Button parameter (Visit website)
    const candidate3BodyWithButton = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: safeCustomerName },
              { type: "text", text: safeEventDate },
              { type: "text", text: safeBranchName },
            ],
          },
          {
            type: "button",
            sub_type: "url",
            index: "0",
            parameters: [{ type: "text", text: "branches" }],
          },
        ],
      },
    };

    // Candidate 3: 4 Body parameters (with coupon code fallback)
    const candidate4Body = {
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: safeCustomerName },
              { type: "text", text: safeEventDate },
              { type: "text", text: safeBranchName },
              { type: "text", text: couponCode || (isAnniversary ? "LOVE2026" : "BDAY2026") },
            ],
          },
        ],
      },
    };

    return [candidate3Body, candidate3BodyWithButton, candidate4Body];
  };

  const textPayload = {
    messaging_product: "whatsapp",
    recipient_type: "individual",
    to: cleanPhone,
    text: { body: msgText },
  };

  const candidateIds = [primaryPhoneId];
  let lastData = null;

  for (const pId of candidateIds) {
    const apiUrl = `https://graph.facebook.com/v20.0/${pId}/messages`;

    // Try candidates across languages
    for (const lang of langCandidates) {
      const candidates = buildPayloadsForLang(lang);
      for (let i = 0; i < candidates.length; i++) {
        const payload = candidates[i];
        try {
          console.log(
            `[WhatsApp API] Dispatching template '${templateName}' (lang: ${lang}, candidate: ${i + 1}) to ${cleanPhone}...`
          );
          const res = await fetch(apiUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          lastData = data;

          if (res.ok && !data.error) {
            console.log(
              `✅ [WhatsApp API Success] Marketing template '${templateName}' delivered to ${cleanPhone} (lang: ${lang}, candidate: ${i + 1})!`
            );
            return { success: true, cleanPhone, data, usedTemplate: templateName, langUsed: lang };
          }

          console.warn(
            `[WhatsApp API Notice] Template '${templateName}' lang ${lang} candidate ${i + 1} response:`,
            data?.error?.message || data
          );
        } catch (err) {
          console.error(`[WhatsApp API Error for ID ${pId}]:`, err);
        }
      }
    }

    // Direct text message fallback
    try {
      const resText = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiToken}`,
        },
        body: JSON.stringify(textPayload),
      });

      const dataText = await resText.json();
      if (resText.ok && !dataText.error) {
        console.log(`✅ [WhatsApp API Fallback Success] Direct text message delivered to ${cleanPhone}`);
        return { success: true, cleanPhone, data: dataText, directText: true };
      }
    } catch (e) {}
  }

  return {
    success: false,
    cleanPhone,
    fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msgText)}`,
    error: lastData?.error?.message || "Failed to deliver Meta API template message",
  };
}


/**
 * Automatic WhatsApp Notification Dispatcher to the Admin WhatsApp Number
 * Supports Meta Cloud API template 'admin_booking_alert' and auto-falls back to direct WhatsApp text.
 */
export async function sendAdminBookingNotificationWhatsAppApi(booking, branch, bookingTypeLabel = "Booking Confirmed") {
  try {
    const settings = await getAdminNotificationSettings();

    // Check toggles based on booking type
    const lowerType = String(bookingTypeLabel).toLowerCase();
    if (lowerType.includes("walk-in") || lowerType.includes("walkin")) {
      if (!settings.notifyOnWalkIn) {
        console.log("[Admin WhatsApp Alert] Walk-in notifications disabled in settings. Skipping.");
        return { skipped: true };
      }
    } else if (lowerType.includes("extra")) {
      if (!settings.notifyOnExtra) {
        console.log("[Admin WhatsApp Alert] Extra booking notifications disabled in settings. Skipping.");
        return { skipped: true };
      }
    } else {
      if (!settings.notifyOnOnlineConfirm) {
        console.log("[Admin WhatsApp Alert] Online confirmation notifications disabled in settings. Skipping.");
        return { skipped: true };
      }
    }

    let adminRaw = settings.adminPhone || process.env.ADMIN_WHATSAPP_PHONE || "9762486649";
    let cleanPhone = adminRaw.replace(/[^0-9]/g, "");
    if (cleanPhone.length === 11 && cleanPhone.startsWith("0")) cleanPhone = cleanPhone.slice(1);
    if (cleanPhone.length === 10) cleanPhone = `91${cleanPhone}`;

    if (!cleanPhone || cleanPhone.length < 10) {
      console.warn("[Admin WhatsApp Alert] No valid Admin WhatsApp phone number configured. Skipping alert.");
      return { success: false, error: "Invalid admin phone number" };
    }

    const {
      branchName,
      bookingNumber,
      customerName,
      customerPhone,
      dateStr,
      slotTitle,
      hallName,
      totalStr,
      paidStr,
      remainingStr,
      amount,
      paymentStatus,
      msg,
    } = buildAdminBookingNotificationText(booking, branch, bookingTypeLabel);

    const primaryPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID || "1405052276017557";
    const apiToken = process.env.WHATSAPP_API_TOKEN?.replace(/^["']|["']$/g, "").trim();

    if (!apiToken) {
      console.log("[Admin WhatsApp Alert] API token missing. Logging fallback waLink.");
      const fallbackWaLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
      await saveWhatsAppMessage({
        phone: cleanPhone,
        sender: "SYSTEM",
        senderName: `Admin Booking Alert -> ${bookingNumber}`,
        message: msg,
        status: "FAILED",
        waLink: fallbackWaLink,
      });
      return { success: false, fallbackWaLink };
    }

    const templateName = settings.templateName || "admin_booking_alert";
    const configuredLang = (process.env.WHATSAPP_TEMPLATE_LANG || "en").trim();
    const langCandidates = Array.from(new Set([configuredLang, "en", "en_US"]));

    // Candidate 1: 12 Body parameters with full Deposit breakdown
    // {{1}}=branchName, {{2}}=bookingNumber, {{3}}=bookingType, {{4}}=customerName, {{5}}=customerPhone,
    // {{6}}=dateStr, {{7}}=slotTitle, {{8}}=hallName, {{9}}=totalAmount, {{10}}=paidAmount, {{11}}=remainingBalance, {{12}}=paymentStatus
    const candidate12Body = (lang) => ({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: branchName },
              { type: "text", text: bookingNumber },
              { type: "text", text: bookingTypeLabel },
              { type: "text", text: customerName },
              { type: "text", text: customerPhone },
              { type: "text", text: dateStr },
              { type: "text", text: slotTitle },
              { type: "text", text: hallName },
              { type: "text", text: totalStr || amount },
              { type: "text", text: paidStr || amount },
              { type: "text", text: remainingStr || "0" },
              { type: "text", text: paymentStatus },
            ],
          },
        ],
      },
    });

    // Candidate 2: Standard 10 Body parameters (Legacy)
    const candidate10Body = (lang) => ({
      messaging_product: "whatsapp",
      to: cleanPhone,
      type: "template",
      template: {
        name: templateName,
        language: { code: lang },
        components: [
          {
            type: "body",
            parameters: [
              { type: "text", text: branchName },
              { type: "text", text: bookingNumber },
              { type: "text", text: bookingTypeLabel },
              { type: "text", text: customerName },
              { type: "text", text: customerPhone },
              { type: "text", text: dateStr },
              { type: "text", text: slotTitle },
              { type: "text", text: hallName },
              { type: "text", text: totalStr || amount },
              { type: "text", text: paymentStatus },
            ],
          },
        ],
      },
    });

    const buildCandidatesForLang = (lang) => [
      candidate12Body(lang),
      candidate10Body(lang),
    ];

    let delivered = false;
    let apiResponse = null;

    // 1. Try Meta Cloud API template
    for (const lang of langCandidates) {
      const candidates = buildCandidatesForLang(lang);
      for (const payload of candidates) {
        try {
          const res = await fetch(`https://graph.facebook.com/v20.0/${primaryPhoneId}/messages`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${apiToken}`,
            },
            body: JSON.stringify(payload),
          });

          const data = await res.json();
          apiResponse = data;
          if (res.ok && !data.error) {
            console.log(`✅ [Admin WhatsApp Alert] Template '${templateName}' delivered to admin ${cleanPhone}`);
            delivered = true;
            break;
          } else {
            console.warn(`[Admin WhatsApp Alert Notice] Template attempt response:`, data?.error?.message || data);
          }
        } catch (err) {
          console.error("[Admin WhatsApp Alert Error]:", err);
        }
      }
      if (delivered) break;
    }

    // 2. Fallback to direct text message if template is not yet approved in Meta Cloud API
    if (!delivered) {
      try {
        console.log(`[Admin WhatsApp Alert] Attempting direct text message fallback to ${cleanPhone}...`);
        const textRes = await fetch(`https://graph.facebook.com/v20.0/${primaryPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiToken}`,
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: cleanPhone,
            text: { body: msg },
          }),
        });

        const textData = await textRes.json();
        if (textRes.ok && !textData.error) {
          console.log(`✅ [Admin WhatsApp Alert] Direct text message delivered to admin ${cleanPhone}`);
          delivered = true;
          apiResponse = textData;
        }
      } catch (err) {
        console.error("[Admin WhatsApp Alert Direct Text Error]:", err);
      }
    }

    // Save alert in WhatsApp chat store
    await saveWhatsAppMessage({
      phone: cleanPhone,
      sender: "SYSTEM",
      senderName: `Admin Booking Alert -> ${bookingNumber}`,
      message: msg,
      status: delivered ? "SENT" : "FAILED",
      waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
    });

    return {
      success: delivered,
      cleanPhone,
      data: apiResponse,
      fallbackWaLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
    };
  } catch (err) {
    console.error("[sendAdminBookingNotificationWhatsAppApi Fatal Error]:", err);
    return { success: false, error: err.message };
  }
}


