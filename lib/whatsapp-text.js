/**
 * Pure text and link formatting helpers for HaruViru WhatsApp messages.
 * Safe to import in both Client and Server Components (no database or Node.js built-ins).
 */

/**
 * Extracts and calculates booking financial breakdown (Total, Paid, Remaining)
 */
export function getBookingFinancials(booking) {
  const total = parseFloat(booking?.totalAmount) || 0;
  let paid =
    booking?.paidAmount !== undefined && booking?.paidAmount !== null
      ? parseFloat(booking.paidAmount)
      : null;
  let remaining =
    booking?.remainingAmount !== undefined && booking?.remainingAmount !== null
      ? parseFloat(booking.remainingAmount)
      : null;

  // Check if balance was settled by manager
  const isExplicitlySettled =
    booking?.notes && booking.notes.includes("[Balance Settled by Manager: Fully Paid]");

  if (isExplicitlySettled) {
    paid = total;
    remaining = 0;
  } else if (paid === null) {
    if (
      booking?.notes &&
      (booking.notes.includes("Advance Deposit") ||
        booking.notes.includes("Deposit Paid") ||
        booking.notes.includes("[Paid:"))
    ) {
      const match =
        booking.notes.match(
          /\[Payment Mode:\s*Advance Deposit Paid ₹([\d.]+),\s*Balance ₹([\d.]+)/
        ) ||
        booking.notes.match(/\[Paid:\s*₹([\d.]+),\s*Balance:\s*₹([\d.]+)\]/) ||
        booking.notes.match(/(?:Advance\s+)?Deposit\s*(?:Paid)?[:\s]*₹?([\d.]+)/i) ||
        booking.notes.match(/Paid[:\s]*₹?([\d.]+)/i);
      if (match) {
        paid = parseFloat(match[1]) || 500;
        if (match[2]) remaining = parseFloat(match[2]);
      } else {
        paid = 500;
      }
    } else if (booking?.paymentStatus === "PARTIAL") {
      paid = 500;
    } else if (booking?.paymentStatus === "PAID") {
      paid = total;
    } else {
      paid = 0;
    }
  }

  if (remaining === null) {
    remaining = Math.max(0, total - (paid || 0));
  }

  remaining = Math.max(0, remaining);

  const isDeposit = remaining > 0 && (paid || 0) > 0;
  const isFullPaid = remaining === 0 && (paid >= total || booking?.paymentStatus === "PAID");

  const totalStr = String(Math.round(total));
  const paidStr = String(Math.round(paid || 0));
  const remainingStr = String(Math.round(remaining));

  return {
    total,
    paid: paid || 0,
    remaining,
    isDeposit,
    isFullPaid,
    totalStr,
    paidStr,
    remainingStr,
  };
}

/**
 * 1. Customer Booking Confirmation Template
 */
export function buildWhatsAppConfirmationText(booking, branch) {
  const phone = booking.customerPhone?.replace(/[^0-9]/g, "") || "";
  const cleanPhone = phone.length === 10 ? `91${phone}` : phone;
  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const { totalStr, paidStr, remainingStr, remaining, isDeposit } = getBookingFinancials(booking);

  let managerPhone = null;
  if (branch?.managers && Array.isArray(branch.managers) && branch.managers.length > 0) {
    const mgrWithPhone = branch.managers.find(
      (m) => m.phone && m.phone.replace(/[^0-9]/g, "").length >= 10
    );
    if (mgrWithPhone) managerPhone = mgrWithPhone.phone;
  }
  const rawMgrPhone = managerPhone || branch?.whatsapp || branch?.phone || "9762486649";
  const cleanMgrDigits = rawMgrPhone.replace(/[^0-9]/g, "");
  const formattedMgrPhone =
    cleanMgrDigits.length === 10
      ? `+91 ${cleanMgrDigits}`
      : cleanMgrDigits.startsWith("91") && cleanMgrDigits.length === 12
      ? `+${cleanMgrDigits.slice(0, 2)} ${cleanMgrDigits.slice(2)}`
      : `+91 ${cleanMgrDigits}`;

  const hallName = booking.hallName || "Hall 1";
  const slotTitle = booking.slotTitle || "Celebration Slot";
  const location =
    `${branch?.address || ""}, ${branch?.city || ""}`.trim() || branch?.name || "HaruViru Branch";

  const paidSuffix = isDeposit ? " (Advance Deposit)" : remaining === 0 ? " (Full Paid)" : "";
  const remainingSuffix = remaining > 0 ? " (Pay at Venue)" : " (Nil)";

  const msg = `🎉 *HARUVIRU CELEBRATION HOUSE - BOOKING CONFIRMED!* 🎉

Hello *${booking.customerName}*,
Your celebration slot booking at *${branch?.name || "HaruViru Celebration House"}* has been APPROVED & CONFIRMED!

🏛️ *Hall / Arena:* ${hallName}
🎟️ *Booking Ref:* ${booking.bookingNumber}
📅 *Date:* ${dateStr}
🕒 *Time Slot:* ${slotTitle}
💰 *Total Amount:* ₹${totalStr}
💵 *Paid Amount:* ₹${paidStr}${paidSuffix}
⏳ *Remaining Balance:* ₹${remainingStr}${remainingSuffix}
📍 *Location:* ${location}
📞 *Branch Manager Direct Call:* ${formattedMgrPhone}

Please arrive 10 minutes prior to your reserved slot time! ✨`;

  return {
    cleanPhone,
    msg,
    waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
    hallName,
    slotTitle,
    totalStr,
    paidStr,
    remainingStr,
    location,
    formattedMgrPhone,
    dateStr,
  };
}

/**
 * 2. Manager Booking Alert Template
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

  const { totalStr, paidStr, remainingStr, remaining, isDeposit } = getBookingFinancials(booking);
  const branchName = branch?.name || "HaruViru Branch";
  const hallName = booking.hallName || "Hall 1";
  const slotTitle = booking.slotTitle || "Celebration Slot";
  const txnId =
    booking.transactionId && String(booking.transactionId).trim().length > 0
      ? booking.transactionId
      : "0";

  const paidSuffix = isDeposit ? " (Advance Deposit)" : remaining === 0 ? " (Full Paid)" : "";
  const remainingSuffix = remaining > 0 ? " (Collect at Venue)" : " (Nil)";

  const msg = `🔔 *NEW ONLINE CELEBRATION BOOKING RECEIVED!* 🔔

📍 *Branch:* ${branchName}
🎟️ *Booking Ref:* ${booking.bookingNumber}
👤 *Customer Name:* ${booking.customerName}
📞 *Customer Phone:* ${booking.customerPhone}
🏛️ *Hall:* ${hallName}
📅 *Date:* ${dateStr}
🕒 *Time Slot:* ${slotTitle}
💰 *Total Amount:* ₹${totalStr}
💵 *Paid / Deposit:* ₹${paidStr}${paidSuffix}
⏳ *Remaining Balance:* ₹${remainingStr}${remainingSuffix}
💳 *Txn ID:* ${txnId}

Please log into Manager Dashboard to verify & prepare the arena! ✨`;

  return {
    cleanPhone,
    msg,
    waLink: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`,
    branchName,
    hallName,
    slotTitle,
    totalStr,
    paidStr,
    remainingStr,
    txnId,
    dateStr,
  };
}

/**
 * 3. Admin Booking Alert Template
 */
export function buildAdminBookingNotificationText(
  booking,
  branch,
  bookingTypeLabel = "Booking Confirmed"
) {
  const dateStr = new Date(booking.bookingDate).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });

  const branchName = branch?.name || "HaruViru Celebration House";
  const bookingNumber = booking.bookingNumber || "HV-BOOKING";
  const customerName = booking.customerName || "Customer";
  const customerPhone = booking.customerPhone || "N/A";
  const slotTitle = booking.slotTitle || "Celebration Slot";
  const hallName = booking.hallName || "Hall 1";

  const { totalStr, paidStr, remainingStr, remaining } = getBookingFinancials(booking);

  const paymentStatus =
    remaining === 0
      ? "PAID (Full)"
      : remaining > 0 && parseFloat(paidStr) > 0
      ? "PARTIAL (Deposit Paid)"
      : "PENDING";

  const paidSuffix = remaining > 0 ? " (Advance Deposit)" : " (Full Paid)";
  const remainingSuffix = remaining > 0 ? " (Due at Venue)" : " (Nil)";

  const msg = `🔔 *NEW HARUVIRU BOOKING CONFIRMED!* 🔔

🏢 *Branch:* ${branchName}
🎟️ *Booking Ref:* ${bookingNumber}
📌 *Type:* ${bookingTypeLabel}
👤 *Customer:* ${customerName}
📞 *Phone:* ${customerPhone}
📅 *Date:* ${dateStr}
🕒 *Slot:* ${slotTitle}
🏛️ *Hall:* ${hallName}
💰 *Total Amount:* ₹${totalStr}
💵 *Paid Amount:* ₹${paidStr}${paidSuffix}
⏳ *Remaining Balance:* ₹${remainingStr}${remainingSuffix}
💳 *Payment:* ${paymentStatus}

Please check the Admin & Manager Dashboard for complete booking details! ✨`;

  return {
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
    amount: totalStr,
    paymentStatus,
    msg,
  };
}
