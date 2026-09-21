"use server";

import { db } from "./prisma";
import { checkUser } from "./checkUser";
import { revalidatePath } from "next/cache";

// Utility helper for random booking numbers e.g. HV-2026-8A9X
function generateBookingNumber() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let random = "";
  for (let i = 0; i < 4; i++) {
    random += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  const year = new Date().getFullYear();
  return `HV-${year}-${random}`;
}

// -------------------------------------------------------------
// 1. ADMIN ACTIONS: BRANCH MANAGEMENT
// -------------------------------------------------------------

export async function createBranch(data) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const { name, city, state, address, phone, email, description, images, amenities, pricePerSlot, mapUrl, instagramHandle, whatsapp } = data;

  if (!name || !city || !address || !phone) {
    throw new Error("Missing required branch fields");
  }

  // Generate unique slug
  let slug = name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)+/g, "");
  const existing = await db.branch.findUnique({ where: { slug } });
  if (existing) {
    slug = `${slug}-${Math.floor(Math.random() * 1000)}`;
  }

  const branch = await db.branch.create({
    data: {
      name,
      slug,
      city,
      state: state || "State",
      address,
      phone,
      email: email || "info@haruviru.com",
      description: description || "",
      images: Array.isArray(images) ? images : (images ? [images] : []),
      amenities: Array.isArray(amenities) ? amenities : [],
      pricePerSlot: parseFloat(pricePerSlot) || 1499,
      mapUrl: mapUrl || null,
      instagramHandle: instagramHandle || "celebration_house_23",
      whatsapp: whatsapp || phone.replace(/[^0-9]/g, ""),
      isActive: true,
    },
  });

  // Create default time slots for the new branch
  await db.slot.createMany({
    data: [
      { branchId: branch.id, title: "Morning Slot", startTime: "09:00", endTime: "13:00", price: parseFloat(pricePerSlot) || 1499 },
      { branchId: branch.id, title: "Afternoon Slot", startTime: "14:00", endTime: "18:00", price: parseFloat(pricePerSlot) || 1499 },
      { branchId: branch.id, title: "Evening Slot", startTime: "19:00", endTime: "23:00", price: (parseFloat(pricePerSlot) || 1499) * 1.2 },
    ]
  });

  revalidatePath("/admin/branches");
  revalidatePath("/branches");
  return { success: true, branch };
}

export async function updateBranch(id, data) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const branch = await db.branch.update({
    where: { id },
    data: {
      ...data,
      pricePerSlot: data.pricePerSlot ? parseFloat(data.pricePerSlot) : undefined,
    },
  });

  revalidatePath("/admin/branches");
  revalidatePath(`/branches/${branch.slug}`);
  return { success: true, branch };
}

export async function deleteBranch(id) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  // Clear assigned manager reference first
  await db.user.updateMany({
    where: { managedBranchId: id },
    data: { managedBranchId: null },
  });

  // Delete associated bookings & slots
  await db.booking.deleteMany({ where: { branchId: id } });
  await db.slot.deleteMany({ where: { branchId: id } });

  await db.branch.delete({ where: { id } });

  revalidatePath("/admin/branches");
  revalidatePath("/branches");
  return { success: true };
}

export async function toggleBranchStatus(id, isActive) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  await db.branch.update({
    where: { id },
    data: { isActive },
  });

  revalidatePath("/admin/branches");
  revalidatePath("/branches");
  return { success: true };
}

// -------------------------------------------------------------
// 2. ADMIN ACTIONS: MANAGER & USER ROLE MANAGEMENT
// -------------------------------------------------------------

export async function assignManagerToBranch(userId, branchId) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      role: "MANAGER",
      managedBranchId: branchId || null,
    },
  });

  revalidatePath("/admin/managers");
  return { success: true, user: updatedUser };
}

export async function assignManagerByEmail(email, branchId) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  if (!email || !branchId) {
    throw new Error("Manager email address and franchise selection are required.");
  }

  const cleanEmail = email.trim().toLowerCase();
  let user = await db.user.findUnique({ where: { email: cleanEmail } });

  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        role: "MANAGER",
        managedBranchId: branchId,
      },
    });
  } else {
    // Register manager by email for current/future login
    const dummyClerkId = `pending_mgr_${Date.now()}`;
    const namePart = cleanEmail.split("@")[0].replace(/[^a-zA-Z0-9]/g, " ");
    user = await db.user.create({
      data: {
        clerkUserId: dummyClerkId,
        email: cleanEmail,
        name: namePart.charAt(0).toUpperCase() + namePart.slice(1),
        role: "MANAGER",
        managedBranchId: branchId,
      },
    });
  }

  revalidatePath("/admin/managers");
  revalidatePath("/admin/branches");
  return { success: true, user };
}

export async function updateUserRole(userId, role) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const updatedUser = await db.user.update({
    where: { id: userId },
    data: {
      role,
      managedBranchId: role === "MANAGER" ? undefined : null,
    },
  });

  revalidatePath("/admin/managers");
  return { success: true, user: updatedUser };
}

// -------------------------------------------------------------
// 3. SLOT MANAGEMENT (ADMIN & MANAGER)
// -------------------------------------------------------------

export async function createSlot(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== data.branchId) {
    throw new Error("Unauthorized action for this branch.");
  }

  const slot = await db.slot.create({
    data: {
      branchId: data.branchId,
      title: data.title,
      startTime: data.startTime,
      endTime: data.endTime,
      price: parseFloat(data.price) || 0,
      isActive: true,
    }
  });

  revalidatePath("/manager/slots");
  return { success: true, slot };
}

export async function updateSlot(slotId, data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const slot = await db.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found.");

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== slot.branchId) {
    throw new Error("Unauthorized action for this branch.");
  }

  const updatedSlot = await db.slot.update({
    where: { id: slotId },
    data: {
      title: data.title || slot.title,
      startTime: data.startTime || slot.startTime,
      endTime: data.endTime || slot.endTime,
      price: data.price !== undefined ? parseFloat(data.price) : slot.price,
    },
  });

  revalidatePath("/manager/slots");
  return { success: true, slot: updatedSlot };
}

export async function deleteSlot(slotId) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const slot = await db.slot.findUnique({ where: { id: slotId } });
  if (!slot) throw new Error("Slot not found.");

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== slot.branchId) {
    throw new Error("Unauthorized action for this branch.");
  }

  await db.slot.delete({ where: { id: slotId } });

  revalidatePath("/manager/slots");
  return { success: true };
}

export async function toggleSlotStatus(slotId, isActive) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  await db.slot.update({
    where: { id: slotId },
    data: { isActive },
  });

  revalidatePath("/manager/slots");
  return { success: true };
}

// -------------------------------------------------------------
// 4. BOOKING ACTIONS (ONLINE & OFFLINE)
// -------------------------------------------------------------

export async function createOnlineBooking(data) {
  const currentUser = await checkUser();

  const { branchId, slotId, bookingDate, customerName, customerEmail, customerPhone, notes, totalAmount } = data;

  if (!branchId || !bookingDate || !customerName || !customerPhone) {
    throw new Error("Please provide all required booking details.");
  }

  const branch = await db.branch.findUnique({ where: { id: branchId } });
  if (!branch) throw new Error("Branch not found");

  let slot = null;
  if (slotId) {
    slot = await db.slot.findUnique({ where: { id: slotId } });
  }

  const targetDate = new Date(bookingDate);
  targetDate.setHours(0, 0, 0, 0);

  if (slotId) {
    const existing = await db.booking.findFirst({
      where: {
        branchId,
        slotId,
        bookingDate: targetDate,
        bookingStatus: { in: ["CONFIRMED", "PENDING"] },
      }
    });

    if (existing) {
      throw new Error("Selected time slot is already booked for this date. Please choose another date or slot.");
    }
  }

  const amount = parseFloat(totalAmount) || (slot ? slot.price : branch.pricePerSlot);
  const bookingNumber = generateBookingNumber();

  const booking = await db.booking.create({
    data: {
      bookingNumber,
      userId: currentUser?.id || null,
      branchId,
      slotId: slotId || null,
      slotTitle: slot ? slot.title : "Custom Slot",
      customerName,
      customerEmail: customerEmail || (currentUser?.email || ""),
      customerPhone,
      bookingDate: targetDate,
      totalAmount: amount,
      paymentStatus: "PENDING",
      bookingStatus: "CONFIRMED",
      bookingType: "ONLINE",
      notes: notes || "",
    }
  });

  revalidatePath("/bookings");
  revalidatePath(`/manager/bookings`);
  return { success: true, bookingNumber: booking.bookingNumber, bookingId: booking.id };
}

export async function createOfflineBooking(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action. Manager or Admin required.");
  }

  const { branchId, slotId, slotTitle, bookingDate, customerName, customerEmail, customerPhone, totalAmount, notes, paymentStatus } = data;

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== branchId) {
    throw new Error("You can only create offline bookings for your assigned branch.");
  }

  const targetDate = new Date(bookingDate);
  targetDate.setHours(0, 0, 0, 0);

  const bookingNumber = generateBookingNumber();

  const booking = await db.booking.create({
    data: {
      bookingNumber,
      branchId,
      slotId: slotId || null,
      slotTitle: slotTitle || "Offline Slot",
      customerName,
      customerEmail: customerEmail || "offline@haruviru.com",
      customerPhone,
      bookingDate: targetDate,
      totalAmount: parseFloat(totalAmount) || 0,
      paymentStatus: paymentStatus || "PAID",
      bookingStatus: "CONFIRMED",
      bookingType: "OFFLINE",
      notes: notes || "Logged by Manager",
    }
  });

  revalidatePath("/manager/bookings");
  revalidatePath("/admin");
  return { success: true, booking };
}

export async function updateBookingStatus(bookingId, bookingStatus, paymentStatus) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const updateData = {};
  if (bookingStatus) updateData.bookingStatus = bookingStatus;
  if (paymentStatus) updateData.paymentStatus = paymentStatus;

  const booking = await db.booking.update({
    where: { id: bookingId },
    data: updateData,
  });

  revalidatePath("/manager/bookings");
  revalidatePath("/admin");
  revalidatePath("/bookings");
  return { success: true, booking };
}

// -------------------------------------------------------------
// 5. FRANCHISE INQUIRY ACTIONS
// -------------------------------------------------------------

export async function submitFranchiseInquiry(formData) {
  const name = formData.get("name");
  const email = formData.get("email");
  const phone = formData.get("phone");
  const city = formData.get("city");
  const investmentBudget = formData.get("investmentBudget");
  const message = formData.get("message");

  if (!name || !email || !phone || !city || !investmentBudget) {
    throw new Error("Please complete all required inquiry fields.");
  }

  const inquiry = await db.franchiseInquiry.create({
    data: {
      name,
      email,
      phone,
      city,
      investmentBudget,
      message: message || "",
      status: "PENDING",
    }
  });

  revalidatePath("/admin/franchise-inquiries");
  return { success: true, inquiryId: inquiry.id };
}

export async function updateInquiryStatus(inquiryId, status) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const inquiry = await db.franchiseInquiry.update({
    where: { id: inquiryId },
    data: { status },
  });

  revalidatePath("/admin/franchise-inquiries");
  return { success: true, inquiry };
}
