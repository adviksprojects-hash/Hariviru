/**
 * Pure text and link formatting helpers for HaruViru WhatsApp messages.
 * Safe to import in both Client and Server Components (no database or Node.js built-ins).
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

export function buildAdminBookingNotificationText(booking, branch, bookingTypeLabel = "Booking Confirmed") {
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
  const amount = String(booking.totalAmount || 0);
  const paymentStatus =
    booking.paymentStatus === "PAID"
      ? "PAID (Full)"
      : booking.paymentStatus === "PARTIAL"
      ? "PARTIAL (Deposit Paid)"
      : "PENDING";

  const msg = `🔔 *NEW HARUVIRU BOOKING CONFIRMED!* 🔔

🏢 *Branch:* ${branchName}
🎟️ *Booking Ref:* ${bookingNumber}
📌 *Type:* ${bookingTypeLabel}
👤 *Customer:* ${customerName}
📞 *Phone:* ${customerPhone}
📅 *Date:* ${dateStr}
🕒 *Slot:* ${slotTitle}
🏛️ *Hall:* ${hallName}
💰 *Total Amount:* ₹${amount}
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
    amount,
    paymentStatus,
    msg,
  };
}
