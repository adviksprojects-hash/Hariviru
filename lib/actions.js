"use server";

import { db } from "./prisma";
import { checkUser } from "./checkUser";
import { revalidatePath } from "next/cache";
import {
  sendWhatsAppConfirmationApi,
  sendManagerBookingNotification,
  sendWhatsAppMarketingCampaign,
  sendWhatsAppDirectTextMessage,
  buildWhatsAppConfirmationText,
  buildManagerWhatsAppNotificationText,
} from "./whatsapp";
import {
  saveWhatsAppMessage,
  getWhatsAppMessagesForPhone,
  getAllWhatsAppConversations,
  saveWhatsAppTemplate,
  getAllWhatsAppTemplates,
  deleteWhatsAppTemplate,
} from "./whatsapp-chat-store";
import { saveLocalDepositSettings, enrichBranchWithDepositSettings } from "./deposit-settings";

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

// Helper to parse extended booking fields from notes
export async function enrichBooking(b) {
  if (!b) return b;
  let eventCategory = b.eventCategory;
  if (!eventCategory && b.notes) {
    const match = b.notes.match(/\[Event:\s*([^\]]+)\]/);
    if (match) eventCategory = match[1].trim();
  }

  let paidAmount = b.paidAmount;
  let remainingAmount = b.remainingAmount;
  let paymentType = b.paymentType;

  if (b.notes && (paidAmount === undefined || paidAmount === null)) {
    const depMatch = b.notes.match(/\[Payment Mode:\s*Advance Deposit Paid ₹([\d.]+),\s*Balance ₹([\d.]+)/);
    if (depMatch) {
      paidAmount = parseFloat(depMatch[1]) || 0;
      remainingAmount = parseFloat(depMatch[2]) || 0;
      paymentType = "DEPOSIT";
    } else if (b.paymentStatus === "PAID") {
      paidAmount = b.totalAmount;
      remainingAmount = 0;
      paymentType = "FULL";
    }
  }

  return {
    ...b,
    eventCategory: eventCategory || "Birthday",
    paidAmount: paidAmount !== undefined && paidAmount !== null ? paidAmount : (b.paymentStatus === "PAID" ? b.totalAmount : 0),
    remainingAmount: remainingAmount !== undefined && remainingAmount !== null ? remainingAmount : (b.paymentStatus === "PAID" ? 0 : b.totalAmount),
    paymentType: paymentType || (b.paymentStatus === "PARTIAL" ? "DEPOSIT" : "FULL"),
  };
}

export async function createBranch(data) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const { name, city, state, address, phone, email, description, images, amenities, pricePerSlot, mapUrl, instagramHandle, whatsapp, upiId } = data;

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
      upiId: upiId || "9762486649@ybl",
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

  const updateData = {
    ...data,
    pricePerSlot: data.pricePerSlot ? parseFloat(data.pricePerSlot) : undefined,
    depositAmount: data.depositAmount !== undefined ? parseFloat(data.depositAmount) : undefined,
    depositModeEnabled: data.depositModeEnabled !== undefined ? Boolean(data.depositModeEnabled) : undefined,
    upiId: data.upiId || undefined,
  };

  let branch;
  try {
    branch = await db.branch.update({
      where: { id },
      data: updateData,
    });
  } catch (err) {
    if (err.message && (err.message.includes("depositModeEnabled") || err.message.includes("depositAmount"))) {
      delete updateData.depositModeEnabled;
      delete updateData.depositAmount;
      branch = await db.branch.update({
        where: { id },
        data: updateData,
      });
    } else {
      throw err;
    }
  }

  revalidatePath("/admin/branches");
  revalidatePath(`/branches/${branch.slug}`);
  return { success: true, branch };
}

export async function updateBranchDepositSettings(branchId, depositModeEnabled, depositAmount) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== branchId) {
    throw new Error("Unauthorized action for this branch.");
  }

  try {
    saveLocalDepositSettings(branchId, depositModeEnabled, depositAmount);
    let branch;
    try {
      branch = await db.branch.update({
        where: { id: branchId },
        data: {
          depositModeEnabled: Boolean(depositModeEnabled),
          depositAmount: depositAmount !== undefined && depositAmount !== "" ? parseFloat(depositAmount) : 500,
        },
      });
    } catch (err) {
      console.warn("Database schema does not contain deposit columns, saved locally:", err.message);
      branch = await db.branch.findUnique({ where: { id: branchId } });
    }

    const enriched = enrichBranchWithDepositSettings(branch);

    revalidatePath("/manager/settings");
    revalidatePath("/admin/branches");
    revalidatePath("/branches");
    return { success: true, branch: enriched };
  } catch (err) {
    console.error("Error updating branch deposit settings:", err);
    return { success: false, error: err.message || "Failed to update deposit settings." };
  }
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

export async function toggleSlotDisabledDate(slotId, dateStr) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  if (!db || !db.slotDisabledDate) {
    throw new Error("SlotDisabledDate model is not available. Please restart the dev server.");
  }

  const existing = await db.slotDisabledDate.findUnique({
    where: {
      slotId_date: {
        slotId,
        date: dateStr,
      },
    },
  });

  let isDisabled = false;
  if (existing) {
    await db.slotDisabledDate.delete({
      where: { id: existing.id },
    });
    isDisabled = false;
  } else {
    await db.slotDisabledDate.create({
      data: {
        slotId,
        date: dateStr,
      },
    });
    isDisabled = true;
  }

  revalidatePath("/manager/slots");
  revalidatePath("/branches");
  return { success: true, isDisabled };
}

export async function getBranchHalls(branchId) {
  if (!branchId) return { success: false, halls: [] };
  if (!db || !db.hall) return { success: true, halls: [{ id: null, name: "Hall 1", capacity: null }] };

  let halls = await db.hall.findMany({
    where: { branchId, isActive: true },
    orderBy: { createdAt: "asc" },
  });

  if (halls.length === 0) {
    await db.hall.createMany({
      data: [
        { branchId, name: "Hall 1", capacity: null, isActive: true },
        { branchId, name: "Hall 2", capacity: null, isActive: true },
      ],
    });
    halls = await db.hall.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  return { success: true, halls };
}

export async function createHall(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized access.");
  }
  const { branchId, name, capacity } = data;
  if (!name) throw new Error("Hall Name is required.");

  let targetBranchId = branchId;
  if (currentUser.role === "MANAGER") {
    if (!currentUser.managedBranchId) {
      throw new Error("You do not have an assigned branch to create halls for.");
    }
    targetBranchId = currentUser.managedBranchId;
  } else if (!targetBranchId) {
    const firstBranch = await db.branch.findFirst({ where: { isActive: true } });
    if (firstBranch) targetBranchId = firstBranch.id;
  }

  if (!targetBranchId) {
    throw new Error("No branch found to assign this hall to.");
  }

  try {
    const parsedCapacity = capacity !== undefined && capacity !== null && String(capacity).trim() !== "" 
      ? parseInt(capacity, 10) 
      : null;

    const hall = await db.hall.create({
      data: {
        branchId: targetBranchId,
        name: name.trim(),
        capacity: parsedCapacity,
        isActive: true,
      },
    });

    revalidatePath("/manager/settings");
    revalidatePath("/admin/settings");
    revalidatePath("/branches");
    return { success: true, hall };
  } catch (err) {
    console.error("Error creating hall:", err);
    return { success: false, error: err.message || "Failed to create hall." };
  }
}

export async function updateHall(id, data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized access.");
  }

  try {
    let existing = null;
    if (id) {
      try {
        existing = await db.hall.findUnique({ where: { id } });
      } catch (e) {
        existing = null;
      }
    }

    if (currentUser.role === "MANAGER" && existing && existing.branchId !== currentUser.managedBranchId) {
      throw new Error("Unauthorized action for this branch.");
    }

    const parsedCapacity = data.capacity !== undefined && data.capacity !== null && String(data.capacity).trim() !== ""
      ? parseInt(data.capacity, 10)
      : null;

    let hall;
    if (existing) {
      hall = await db.hall.update({
        where: { id },
        data: {
          name: data.name || undefined,
          capacity: data.capacity !== undefined ? parsedCapacity : undefined,
          isActive: data.isActive !== undefined ? data.isActive : undefined,
        },
      });
    } else {
      const targetBranchId = currentUser.role === "MANAGER" ? currentUser.managedBranchId : data.branchId;
      if (!targetBranchId) throw new Error("Branch ID is required.");
      hall = await db.hall.create({
        data: {
          branchId: targetBranchId,
          name: data.name || "Hall",
          capacity: parsedCapacity,
          isActive: true,
        },
      });
    }

    revalidatePath("/manager/settings");
    revalidatePath("/admin/settings");
    revalidatePath("/branches");
    return { success: true, hall };
  } catch (err) {
    console.error("Error updating hall:", err);
    return { success: false, error: err.message || "Failed to update hall." };
  }
}

export async function deleteHall(id) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized access.");
  }

  try {
    if (id) {
      await db.hall.delete({ where: { id } });
    }

    revalidatePath("/manager/settings");
    revalidatePath("/admin/settings");
    revalidatePath("/branches");
    return { success: true };
  } catch (err) {
    console.error("Error deleting hall:", err);
    return { success: false, error: err.message || "Failed to delete hall." };
  }
}

// -------------------------------------------------------------
// -------------------------------------------------------------
// PACKAGE ACTIONS
// -------------------------------------------------------------

const defaultGlobalPackages = [
  {
    id: "pkg-1",
    badge: "1st Package",
    name: "Standard Family & Friends Celebration",
    forWho: "Family & Groups",
    originalPrice: 2000,
    offerPrice: 1499,
    features: [
      "For Family (1 Hr)",
      "AC Hall",
      "Bubble Entry",
      "YouTube Access with Dolby Audio",
      "Special Moment Screening",
      "Flower Decor",
      "Balloon Flooring",
      "Blindfold & Sash",
      "Crown & Tiara",
      "Celebration Cake",
    ],
    isGlobal: true,
    isActive: true,
  },
  {
    id: "pkg-2",
    badge: "2nd Package",
    name: "Delight Party & Treats",
    forWho: "Friends & Birthday Celebrations",
    originalPrice: 3000,
    offerPrice: 2499,
    features: [
      "AC Hall",
      "Bubble Entry",
      "Smoke Entry",
      "YouTube Access with Dolby Audio",
      "Special Moment Screening",
      "Flower Decor",
      "Balloon Flooring",
      "Blindfold & Sash",
      "Crown & Tiara",
      "Celebration Cake",
      "2 Burgers",
      "2 Water Bottles",
    ],
    isGlobal: true,
    isActive: true,
  },
  {
    id: "pkg-3",
    badge: "3rd Package",
    name: "VIP Grand Couple Experience",
    forWho: "For 2 People / Surprise Couples",
    originalPrice: 5000,
    offerPrice: 3999,
    features: [
      "For 2 People (1 Hr)",
      "AC Hall",
      "Bubble Entry",
      "Smoke Entry",
      "YouTube Access with Dolby Audio",
      "Special Moment Screening",
      "Cold Fire Entry with Rose Petals",
      "Flower Decor",
      "Balloon Flooring",
      "Blindfold & Sash",
      "Crown & Tiara",
      "Celebration Cake",
      "2 Burgers",
      "2 Welcome Drinks",
      "2 Water Bottles",
    ],
    isGlobal: true,
    isActive: true,
  },
];

const defaultGlobalAddOns = [
  { id: "addon-1", name: "Phone Photography & Video Shoot", price: 200, isGlobal: true, isActive: true },
  { id: "addon-2", name: "Cold Fire Gun", price: 400, isGlobal: true, isActive: true },
  { id: "addon-3", name: "Extra Time (Per Hour)", price: 1000, isGlobal: true, isActive: true },
];

export async function getGlobalPackages() {
  try {
    if (!db || !db.package) {
      return { success: true, packages: defaultGlobalPackages };
    }

    let packages = await db.package.findMany({
      where: { isGlobal: true, branchId: null, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (packages.length === 0) {
      const seedData = defaultGlobalPackages.map(({ id, forWho, ...rest }) => rest);
      await db.package.createMany({ data: seedData });
      packages = await db.package.findMany({
        where: { isGlobal: true, branchId: null, isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    let packagesWithPopular = packages;
    try {
      const bookings = await db.booking.findMany({
        where: { bookingStatus: { in: ["CONFIRMED", "COMPLETED", "PENDING"] } },
        select: { notes: true, totalAmount: true },
      });

      const counts = {};
      bookings.forEach((b) => {
        packages.forEach((pkg) => {
          if (b.notes && b.notes.toLowerCase().includes(pkg.name.toLowerCase())) {
            counts[pkg.id] = (counts[pkg.id] || 0) + 1;
          }
        });
      });

      let maxBookings = -1;
      let popularId = packages[1]?.id || packages[0]?.id;
      packages.forEach((pkg, idx) => {
        const c = counts[pkg.id] || 0;
        if (c > maxBookings) {
          maxBookings = c;
          popularId = pkg.id;
        }
      });

      packagesWithPopular = packages.map((pkg, idx) => ({
        ...pkg,
        popular: maxBookings > 0 ? pkg.id === popularId : idx === 1,
      }));
    } catch (countErr) {
      packagesWithPopular = packages.map((pkg, idx) => ({ ...pkg, popular: idx === 1 }));
    }

    return { success: true, packages: packagesWithPopular };
  } catch (err) {
    console.error("Error fetching packages from DB:", err);
    return { success: true, packages: defaultGlobalPackages };
  }
}

export async function getBranchPackages(branchId) {
  if (!branchId) return getGlobalPackages();
  try {
    if (!db || !db.package) return getGlobalPackages();

    const globalRes = await getGlobalPackages();
    const globalPackages = globalRes.success ? globalRes.packages : defaultGlobalPackages;

    const branchPackages = await db.package.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (branchPackages.length === 0) {
      return { success: true, packages: globalPackages };
    }

    // Replace matching global packages with edited branch packages, keeping unedited global packages as-is
    const usedBranchIds = new Set();
    const mergedPackages = globalPackages.map((gPkg) => {
      const match = branchPackages.find(
        (bPkg) =>
          !usedBranchIds.has(bPkg.id) &&
          (bPkg.name.toLowerCase() === gPkg.name.toLowerCase() ||
           (bPkg.badge && gPkg.badge && bPkg.badge.toLowerCase() === gPkg.badge.toLowerCase()))
      );
      if (match) {
        usedBranchIds.add(match.id);
        return match;
      }
      return gPkg;
    });

    // Append any extra custom branch packages created by manager
    branchPackages.forEach((bPkg) => {
      if (!usedBranchIds.has(bPkg.id)) {
        mergedPackages.push(bPkg);
      }
    });

    // Calculate popular package among the merged list
    let packagesWithPopular = mergedPackages;
    try {
      const bookings = await db.booking.findMany({
        where: { branchId, bookingStatus: { in: ["CONFIRMED", "COMPLETED", "PENDING"] } },
        select: { notes: true },
      });

      const counts = {};
      bookings.forEach((b) => {
        mergedPackages.forEach((pkg) => {
          if (b.notes && b.notes.toLowerCase().includes(pkg.name.toLowerCase())) {
            counts[pkg.id] = (counts[pkg.id] || 0) + 1;
          }
        });
      });

      let maxBookings = -1;
      let popularId = mergedPackages[0]?.id;
      mergedPackages.forEach((pkg) => {
        const c = counts[pkg.id] || 0;
        if (c > maxBookings) {
          maxBookings = c;
          popularId = pkg.id;
        }
      });

      packagesWithPopular = mergedPackages.map((pkg, idx) => ({
        ...pkg,
        popular: maxBookings > 0 ? pkg.id === popularId : idx === 1,
      }));
    } catch (e) {
      packagesWithPopular = mergedPackages.map((pkg, idx) => ({ ...pkg, popular: idx === 1 }));
    }

    return { success: true, packages: packagesWithPopular, isCustom: true };
  } catch (err) {
    console.error("Error fetching branch packages:", err);
    return getGlobalPackages();
  }
}

export async function getAllPackagesForAdmin() {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const { packages: globalPkgs } = await getGlobalPackages();

  try {
    if (!db || !db.package) {
      return { success: true, packages: globalPkgs };
    }

    const packages = await db.package.findMany({
      where: { isGlobal: true, branchId: null },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, packages: packages.length > 0 ? packages : globalPkgs };
  } catch (err) {
    console.error("Error getting all packages for admin:", err);
    return { success: true, packages: globalPkgs };
  }
}

export async function getAllPackagesForManager(branchId) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const { packages: globalPkgs } = await getGlobalPackages();

  try {
    if (!db || !db.package) {
      return { success: true, globalPackages: globalPkgs, branchPackages: [] };
    }

    const globalPackages = await db.package.findMany({
      where: { isGlobal: true, branchId: null },
      orderBy: { createdAt: "asc" },
    });

    const branchPackages = branchId
      ? await db.package.findMany({
          where: { branchId },
          orderBy: { createdAt: "asc" },
        })
      : [];

    return {
      success: true,
      globalPackages: globalPackages.length > 0 ? globalPackages : globalPkgs,
      branchPackages,
    };
  } catch (err) {
    console.error("Error getting all packages for manager:", err);
    return { success: true, globalPackages: globalPkgs, branchPackages: [] };
  }
}

export async function createPackage(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const { branchId, name, badge, originalPrice, offerPrice, features, isGlobal } = data;

  if (!name || originalPrice === undefined || offerPrice === undefined) {
    throw new Error("Package name, original price, and offer price are required.");
  }

  const featuresArray = Array.isArray(features)
    ? features
    : typeof features === "string"
    ? features.split("\n").map((f) => f.trim()).filter(Boolean)
    : [];

  try {
    const newPkg = await db.package.create({
      data: {
        branchId: branchId || null,
        name,
        badge: badge || "Standard",
        originalPrice: parseFloat(originalPrice),
        offerPrice: parseFloat(offerPrice),
        features: featuresArray,
        isGlobal: isGlobal !== undefined ? isGlobal : !branchId,
        isActive: true,
      },
    });

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true, package: newPkg };
  } catch (err) {
    console.error("Error in createPackage:", err);
    return { success: false, error: err.message || "Failed to create package." };
  }
}

export async function updatePackage(id, data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  try {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.badge !== undefined) updateData.badge = data.badge;
    if (data.originalPrice !== undefined) updateData.originalPrice = parseFloat(data.originalPrice);
    if (data.offerPrice !== undefined) updateData.offerPrice = parseFloat(data.offerPrice);
    if (data.features !== undefined) {
      updateData.features = Array.isArray(data.features)
        ? data.features
        : typeof data.features === "string"
        ? data.features.split("\n").map((f) => f.trim()).filter(Boolean)
        : [];
    }
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const isFallbackId = typeof id === "string" && id.startsWith("pkg-");
    let existing = null;
    if (!isFallbackId && id) {
      try {
        existing = await db.package.findUnique({ where: { id } });
      } catch (e) {
        existing = null;
      }
    }

    if (!existing && data.name) {
      try {
        existing = await db.package.findFirst({ where: { name: data.name } });
      } catch (e) {
        existing = null;
      }
    }

    let pkg;
    if (currentUser.role === "MANAGER" || (data.branchId && !data.isGlobal)) {
      const managerBranchId = data.branchId || currentUser.managedBranchId;

      let branchPkg = null;
      if (existing && !existing.isGlobal && existing.branchId === managerBranchId) {
        branchPkg = existing;
      } else if (managerBranchId && data.name) {
        branchPkg = await db.package.findFirst({
          where: { branchId: managerBranchId, name: data.name },
        });
      }

      if (branchPkg) {
        pkg = await db.package.update({
          where: { id: branchPkg.id },
          data: {
            ...updateData,
            branchId: managerBranchId,
            isGlobal: false,
          },
        });
      } else {
        const basePkg = existing || defaultGlobalPackages.find((p) => p.id === id) || {};
        pkg = await db.package.create({
          data: {
            branchId: managerBranchId,
            name: updateData.name || basePkg.name || "Standard Package",
            badge: updateData.badge || basePkg.badge || "Standard",
            originalPrice: updateData.originalPrice !== undefined ? updateData.originalPrice : (basePkg.originalPrice || 0),
            offerPrice: updateData.offerPrice !== undefined ? updateData.offerPrice : (basePkg.offerPrice || 0),
            features: updateData.features || basePkg.features || [],
            isGlobal: false,
            isActive: updateData.isActive !== undefined ? updateData.isActive : true,
          },
        });
      }
    } else {
      if (existing) {
        pkg = await db.package.update({
          where: { id: existing.id },
          data: updateData,
        });
      } else {
        const defaultPkg = defaultGlobalPackages.find((p) => p.id === id) || {};
        pkg = await db.package.create({
          data: {
            name: updateData.name || data.name || defaultPkg.name || "Standard Package",
            badge: updateData.badge || data.badge || defaultPkg.badge || "Standard",
            originalPrice: updateData.originalPrice !== undefined ? updateData.originalPrice : (defaultPkg.originalPrice || 0),
            offerPrice: updateData.offerPrice !== undefined ? updateData.offerPrice : (defaultPkg.offerPrice || 0),
            features: updateData.features || defaultPkg.features || [],
            isGlobal: data.isGlobal !== undefined ? data.isGlobal : true,
            branchId: data.branchId || null,
            isActive: updateData.isActive !== undefined ? updateData.isActive : true,
          },
        });
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true, package: pkg };
  } catch (err) {
    console.error("Error in updatePackage:", err);
    return { success: false, error: err.message || "Failed to update package." };
  }
}

export async function deletePackage(id) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  try {
    const isFallbackId = typeof id === "string" && id.startsWith("pkg-");
    if (!isFallbackId && id) {
      try {
        await db.package.delete({ where: { id } });
      } catch (err) {
        console.warn("Delete package error ignored:", err);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true };
  } catch (err) {
    console.error("Error in deletePackage:", err);
    return { success: false, error: err.message || "Failed to delete package." };
  }
}

// -------------------------------------------------------------
// ADD-ON ACTIONS
// -------------------------------------------------------------

export async function getGlobalAddOns() {
  try {
    if (!db || !db.addOn) {
      return { success: true, addOns: defaultGlobalAddOns };
    }

    let addOns = await db.addOn.findMany({
      where: { isGlobal: true, branchId: null, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (addOns.length === 0) {
      const seedData = defaultGlobalAddOns.map(({ id, ...rest }) => rest);
      await db.addOn.createMany({ data: seedData });
      addOns = await db.addOn.findMany({
        where: { isGlobal: true, branchId: null, isActive: true },
        orderBy: { createdAt: "asc" },
      });
    }

    return { success: true, addOns };
  } catch (err) {
    console.error("Error fetching addOns from DB:", err);
    return { success: true, addOns: defaultGlobalAddOns };
  }
}

export async function getBranchAddOns(branchId) {
  try {
    const globalRes = await getGlobalAddOns();
    const globalAddOns = globalRes.success ? globalRes.addOns : defaultGlobalAddOns;

    if (!branchId || !db || !db.addOn) {
      return { success: true, addOns: globalAddOns };
    }

    const branchAddOns = await db.addOn.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    if (branchAddOns.length === 0) {
      return { success: true, addOns: globalAddOns };
    }

    // Replace matching global add-ons with edited branch add-ons, keeping unedited global add-ons as-is
    const usedBranchIds = new Set();
    const mergedAddOns = globalAddOns.map((gAddon) => {
      const match = branchAddOns.find(
        (bAddon) =>
          !usedBranchIds.has(bAddon.id) &&
          bAddon.name.toLowerCase() === gAddon.name.toLowerCase()
      );
      if (match) {
        usedBranchIds.add(match.id);
        return match;
      }
      return gAddon;
    });

    // Append any extra custom branch add-ons created by manager
    branchAddOns.forEach((bAddon) => {
      if (!usedBranchIds.has(bAddon.id)) {
        mergedAddOns.push(bAddon);
      }
    });

    return { success: true, addOns: mergedAddOns, isCustom: branchAddOns.length > 0 };
  } catch (err) {
    console.error("Error fetching branch addOns:", err);
    return getGlobalAddOns();
  }
}

export async function getAllAddOnsForAdmin() {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const { addOns: globalAddons } = await getGlobalAddOns();

  try {
    if (!db || !db.addOn) return { success: true, addOns: globalAddons };

    const addOns = await db.addOn.findMany({
      where: { isGlobal: true, branchId: null },
      orderBy: { createdAt: "asc" },
    });

    return { success: true, addOns: addOns.length > 0 ? addOns : globalAddons };
  } catch (err) {
    console.error("Error getting all addOns for admin:", err);
    return { success: true, addOns: globalAddons };
  }
}

export async function getAllAddOnsForManager(branchId) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const { addOns: globalAddons } = await getGlobalAddOns();

  try {
    if (!db || !db.addOn) return { success: true, globalAddOns: globalAddons, branchAddOns: [] };

    const globalAddOns = await db.addOn.findMany({
      where: { isGlobal: true, branchId: null, isActive: true },
      orderBy: { createdAt: "asc" },
    });

    const branchAddOns = branchId
      ? await db.addOn.findMany({
          where: { branchId },
          orderBy: { createdAt: "asc" },
        })
      : [];

    return {
      success: true,
      globalAddOns: globalAddOns.length > 0 ? globalAddOns : globalAddons,
      branchAddOns,
    };
  } catch (err) {
    console.error("Error getting all addOns for manager:", err);
    return { success: true, globalAddOns: globalAddons, branchAddOns: [] };
  }
}

export async function createAddOn(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const { branchId, name, price, isGlobal, isQuantityBased } = data;

  if (!name || price === undefined) {
    throw new Error("Add-On name and price are required.");
  }

  try {
    let newAddOn;
    try {
      newAddOn = await db.addOn.create({
        data: {
          branchId: branchId || null,
          name,
          price: parseFloat(price),
          isQuantityBased: Boolean(isQuantityBased),
          isGlobal: isGlobal !== undefined ? isGlobal : !branchId,
          isActive: true,
        },
      });
    } catch (err) {
      // Fallback if isQuantityBased column is not in DB yet
      newAddOn = await db.addOn.create({
        data: {
          branchId: branchId || null,
          name,
          price: parseFloat(price),
          isGlobal: isGlobal !== undefined ? isGlobal : !branchId,
          isActive: true,
        },
      });
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true, addOn: newAddOn };
  } catch (err) {
    console.error("Error in createAddOn:", err);
    return { success: false, error: err.message || "Failed to create add-on." };
  }
}

export async function updateAddOn(id, data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  try {
    const updateData = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.price !== undefined) updateData.price = parseFloat(data.price);
    if (data.isQuantityBased !== undefined) updateData.isQuantityBased = Boolean(data.isQuantityBased);
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const isFallbackId = typeof id === "string" && id.startsWith("addon-");
    let existing = null;
    if (!isFallbackId && id) {
      try {
        existing = await db.addOn.findUnique({ where: { id } });
      } catch (e) {
        existing = null;
      }
    }

    if (!existing && data.name) {
      try {
        existing = await db.addOn.findFirst({ where: { name: data.name } });
      } catch (e) {
        existing = null;
      }
    }

    let addOn;
    const managerBranchId = data.branchId || currentUser.managedBranchId;

    if (currentUser.role === "MANAGER" || (data.branchId && !data.isGlobal)) {
      let branchAddOn = null;
      if (existing && !existing.isGlobal && existing.branchId === managerBranchId) {
        branchAddOn = existing;
      } else if (managerBranchId && data.name) {
        branchAddOn = await db.addOn.findFirst({
          where: { branchId: managerBranchId, name: data.name },
        });
      }

      if (branchAddOn) {
        try {
          addOn = await db.addOn.update({
            where: { id: branchAddOn.id },
            data: {
              ...updateData,
              branchId: managerBranchId,
              isGlobal: false,
            },
          });
        } catch (err) {
          delete updateData.isQuantityBased;
          addOn = await db.addOn.update({
            where: { id: branchAddOn.id },
            data: {
              ...updateData,
              branchId: managerBranchId,
              isGlobal: false,
            },
          });
        }
      } else {
        const baseAddOn = existing || defaultGlobalAddOns.find((a) => a.id === id) || {};
        try {
          addOn = await db.addOn.create({
            data: {
              branchId: managerBranchId,
              name: updateData.name || data.name || baseAddOn.name || "Add-On",
              price: updateData.price !== undefined ? updateData.price : (baseAddOn.price || 0),
              isQuantityBased: updateData.isQuantityBased !== undefined ? updateData.isQuantityBased : (baseAddOn.isQuantityBased || false),
              isGlobal: false,
              isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            },
          });
        } catch (err) {
          addOn = await db.addOn.create({
            data: {
              branchId: managerBranchId,
              name: updateData.name || data.name || baseAddOn.name || "Add-On",
              price: updateData.price !== undefined ? updateData.price : (baseAddOn.price || 0),
              isGlobal: false,
              isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            },
          });
        }
      }
    } else {
      if (existing) {
        try {
          addOn = await db.addOn.update({
            where: { id: existing.id },
            data: updateData,
          });
        } catch (err) {
          delete updateData.isQuantityBased;
          addOn = await db.addOn.update({
            where: { id: existing.id },
            data: updateData,
          });
        }
      } else {
        const defaultAddOn = defaultGlobalAddOns.find((a) => a.id === id) || {};
        try {
          addOn = await db.addOn.create({
            data: {
              name: updateData.name || data.name || defaultAddOn.name || "Add-On",
              price: updateData.price !== undefined ? updateData.price : (defaultAddOn.price || 0),
              isQuantityBased: updateData.isQuantityBased !== undefined ? updateData.isQuantityBased : (defaultAddOn.isQuantityBased || false),
              isGlobal: data.isGlobal !== undefined ? data.isGlobal : true,
              branchId: data.branchId || null,
              isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            },
          });
        } catch (err) {
          addOn = await db.addOn.create({
            data: {
              name: updateData.name || data.name || defaultAddOn.name || "Add-On",
              price: updateData.price !== undefined ? updateData.price : (defaultAddOn.price || 0),
              isGlobal: data.isGlobal !== undefined ? data.isGlobal : true,
              branchId: data.branchId || null,
              isActive: updateData.isActive !== undefined ? updateData.isActive : true,
            },
          });
        }
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true, addOn };
  } catch (err) {
    console.error("Error in updateAddOn:", err);
    return { success: false, error: err.message || "Failed to update add-on." };
  }
}

export async function deleteAddOn(id) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  try {
    const isFallbackId = typeof id === "string" && id.startsWith("addon-");
    if (!isFallbackId && id) {
      try {
        await db.addOn.delete({ where: { id } });
      } catch (err) {
        console.warn("Delete addOn error ignored:", err);
      }
    }

    revalidatePath("/");
    revalidatePath("/admin/settings");
    revalidatePath("/manager/settings");
    revalidatePath("/branches");
    return { success: true };
  } catch (err) {
    console.error("Error in deleteAddOn:", err);
    return { success: false, error: err.message || "Failed to delete add-on." };
  }
}

// Helper functions to prevent UTC offset shift errors for date comparisons
function getLocalDateString(dateInput) {
  if (!dateInput) return "";
  if (typeof dateInput === "string") {
    const match = dateInput.trim().match(/^(\d{4}-\d{2}-\d{2})/);
    if (match) return match[1];
  }
  const d = new Date(dateInput);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function parseLocalDateMidnight(dateStr) {
  const cleanStr = getLocalDateString(dateStr);
  const parts = cleanStr.split("-").map(Number);
  if (parts.length === 3 && !isNaN(parts[0]) && !isNaN(parts[1]) && !isNaN(parts[2])) {
    return new Date(parts[0], parts[1] - 1, parts[2], 0, 0, 0, 0);
  }
  const d = new Date(dateStr);
  d.setHours(0, 0, 0, 0);
  return d;
}

export async function getBranchSlotStatusForDate(branchId, dateStr, hallId = null) {
  if (!branchId || !dateStr) return { success: false, slots: [] };

  const targetDate = parseLocalDateMidnight(dateStr);
  const nextDate = new Date(targetDate);
  nextDate.setDate(nextDate.getDate() + 1);

  const slots = await db.slot.findMany({
    where: { branchId, isActive: true },
    orderBy: { startTime: "asc" },
  });

  const slotIds = slots.map((s) => s.id);

  let disabledEntries = [];
  if (db && db.slotDisabledDate) {
    disabledEntries = await db.slotDisabledDate.findMany({
      where: {
        slotId: { in: slotIds },
        date: dateStr,
      },
    });
  }
  const disabledSlotIds = new Set(disabledEntries.map((d) => d.slotId));

  const bookingWhere = {
    branchId,
    bookingDate: {
      gte: targetDate,
      lt: nextDate,
    },
    bookingStatus: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
  };

  if (hallId) {
    bookingWhere.OR = [{ hallId: hallId }, { hallId: null }];
  }

  const rawBookings = await db.booking.findMany({
    where: bookingWhere,
    select: {
      id: true,
      bookingNumber: true,
      branchId: true,
      hallId: true,
      hallName: true,
      slotId: true,
      slotTitle: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      bookingDate: true,
      totalAmount: true,
      paymentStatus: true,
      bookingStatus: true,
      bookingType: true,
      transactionId: true,
      notes: true,
    },
  });

  const bookings = await Promise.all(rawBookings.map((b) => enrichBooking(b)));

  const bookedSlotMap = new Map();
  bookings.forEach((b) => {
    if (b.slotId) {
      bookedSlotMap.set(b.slotId, b);
    }
  });

  // Calculate if date is today in local time and determine passed time slots
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const reqDateStr = getLocalDateString(dateStr);
  const isToday = reqDateStr === todayStr;
  const currentMinutes = now.getHours() * 60 + now.getMinutes();

  const parseTimeToMinutes = (timeStr) => {
    if (!timeStr) return 0;
    const str = timeStr.trim().toUpperCase();
    const isPm = str.includes("PM");
    const isAm = str.includes("AM");
    const cleanStr = str.replace(/(AM|PM)/g, "").trim();
    const parts = cleanStr.split(":");
    let hours = parseInt(parts[0], 10) || 0;
    const minutes = parseInt(parts[1], 10) || 0;
    if (isPm && hours < 12) hours += 12;
    if (isAm && hours === 12) hours = 0;
    return hours * 60 + minutes;
  };

  const resultSlots = slots.map((s) => {
    const isBooked = bookedSlotMap.has(s.id);
    const booking = isBooked ? bookedSlotMap.get(s.id) : null;
    const isDisabledForDate = disabledSlotIds.has(s.id);

    let isTimePassed = false;
    if (reqDateStr < todayStr) {
      isTimePassed = true;
    } else if (isToday) {
      const slotStartMins = parseTimeToMinutes(s.startTime);
      isTimePassed = currentMinutes >= slotStartMins;
    }

    return {
      id: s.id,
      title: s.title,
      startTime: s.startTime,
      endTime: s.endTime,
      price: s.price,
      isActive: s.isActive,
      isDisabledForDate,
      isBooked,
      isTimePassed,
      booking: booking
        ? {
            id: booking.id,
            bookingNumber: booking.bookingNumber,
            customerName: booking.customerName,
            customerPhone: booking.customerPhone,
            bookingStatus: booking.bookingStatus,
            hallId: booking.hallId,
            hallName: booking.hallName,
          }
        : null,
    };
  });

  return { success: true, slots: resultSlots };
}

export async function getBranchCalendarBookingsForMonth(branchId, year, month) {
  if (!branchId) return { success: false, bookings: [], slotsCount: 0 };

  try {
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59, 999);

    const rawBookings = await db.booking.findMany({
      where: {
        branchId,
        bookingDate: {
          gte: startDate,
          lte: endDate,
        },
        bookingStatus: { in: ["CONFIRMED", "PENDING", "COMPLETED"] },
      },
      select: {
        id: true,
        bookingNumber: true,
        userId: true,
        branchId: true,
        hallId: true,
        hallName: true,
        slotId: true,
        slotTitle: true,
        customerName: true,
        customerEmail: true,
        customerPhone: true,
        bookingDate: true,
        totalAmount: true,
        paymentStatus: true,
        bookingStatus: true,
        bookingType: true,
        transactionId: true,
        notes: true,
        createdAt: true,
        updatedAt: true,
      },
      orderBy: { bookingDate: "asc" },
    });

    const bookings = await Promise.all(rawBookings.map((b) => enrichBooking(b)));

    const slotsCount = await db.slot.count({
      where: { branchId, isActive: true },
    });

    return { success: true, bookings, slotsCount };
  } catch (err) {
    console.error("Error fetching month calendar bookings:", err);
    return { success: false, bookings: [], slotsCount: 0 };
  }
}

// -------------------------------------------------------------
// 4. BOOKING ACTIONS (ONLINE & OFFLINE)
// -------------------------------------------------------------

export async function createOnlineBooking(data) {
  const currentUser = await checkUser();

  const { branchId, slotId, hallId, hallName, bookingDate, customerName, customerEmail, customerPhone, transactionId, notes, totalAmount, eventCategory, packageName, selectedAddOns, paymentType } = data;

  if (!branchId || !bookingDate || !customerName || !customerPhone) {
    throw new Error("Please provide all required booking details.");
  }

  if (!eventCategory || !eventCategory.trim()) {
    throw new Error("Event Category is required (e.g. Birthday, Anniversary).");
  }

  // Enforce 10-digit phone number restriction
  const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
  if (cleanPhone.length !== 10) {
    throw new Error("Mobile phone number must be exactly 10 digits.");
  }

  // Enforce 12-digit UPI UTR restriction if provided
  if (transactionId) {
    const cleanTxn = transactionId.replace(/[^0-9]/g, "");
    if (cleanTxn.length !== 12) {
      throw new Error("UPI Transaction ID / UTR Ref number must be exactly 12 digits.");
    }
  }

  const branch = await db.branch.findUnique({
    where: { id: branchId },
    include: { managers: true },
  });
  if (!branch) throw new Error("Branch not found");

  let slot = null;
  if (slotId) {
    slot = await db.slot.findUnique({ where: { id: slotId } });
  }

  const targetDate = parseLocalDateMidnight(bookingDate);

  // Check if slot time has passed for today
  const now = new Date();
  const todayStr = getLocalDateString(now);
  const reqDateStr = getLocalDateString(targetDate);

  if (reqDateStr === todayStr && slot) {
    const parseTimeToMinutes = (timeStr) => {
      if (!timeStr) return 0;
      const str = timeStr.trim().toUpperCase();
      const isPm = str.includes("PM");
      const isAm = str.includes("AM");
      const cleanStr = str.replace(/(AM|PM)/g, "").trim();
      const parts = cleanStr.split(":");
      let hours = parseInt(parts[0], 10) || 0;
      const minutes = parseInt(parts[1], 10) || 0;
      if (isPm && hours < 12) hours += 12;
      if (isAm && hours === 12) hours = 0;
      return hours * 60 + minutes;
    };

    const currentMins = now.getHours() * 60 + now.getMinutes();
    const slotStartMins = parseTimeToMinutes(slot.startTime);

    if (currentMins >= slotStartMins) {
      throw new Error("Selected time slot has already passed for today. Please choose an upcoming slot or another date.");
    }
  }

  if (slotId) {
    const existingWhere = {
      branchId,
      slotId,
      bookingDate: targetDate,
      bookingStatus: { in: ["CONFIRMED", "PENDING"] },
    };
    if (hallId) {
      existingWhere.OR = [{ hallId: hallId }, { hallId: null }];
    }
    const existing = await db.booking.findFirst({
      where: existingWhere,
      select: { id: true },
    });

    if (existing) {
      throw new Error("Selected time slot is already booked for this hall on this date. Please choose another date, hall, or slot.");
    }
  }

  const amount = parseFloat(totalAmount) || (slot ? slot.price : branch.pricePerSlot);
  const bookingNumber = generateBookingNumber();

  // Deposit logic calculation
  const isDeposit = paymentType === "DEPOSIT" && branch.depositModeEnabled && branch.depositAmount > 0;
  const depAmountSetting = branch.depositAmount || 500;
  const paid = isDeposit ? Math.min(depAmountSetting, amount) : amount;
  const remaining = isDeposit ? Math.max(0, amount - paid) : 0;
  const initialPaymentStatus = isDeposit ? "PARTIAL" : "PENDING";

  const notesParts = [];
  notesParts.push(`[Event: ${eventCategory.trim()}]`);
  if (packageName) notesParts.push(`[Package: ${packageName}]`);
  if (selectedAddOns && selectedAddOns.length > 0) {
    const addOnList = Array.isArray(selectedAddOns) ? selectedAddOns.join(", ") : selectedAddOns;
    notesParts.push(`[Add-Ons: ${addOnList}]`);
  }
  if (isDeposit) {
    notesParts.push(`[Payment Mode: Advance Deposit Paid ₹${paid}, Balance ₹${remaining} Due at Venue]`);
  }
  if (transactionId) notesParts.push(`[UPI UTR: ${transactionId}]`);
  if (notes) notesParts.push(notes);

  const combinedNotes = notesParts.join(" | ");

  const bookingData = {
    bookingNumber,
    userId: currentUser?.id || null,
    branchId,
    hallId: hallId || null,
    hallName: hallName || null,
    slotId: slotId || null,
    slotTitle: slot ? slot.title : "Custom Slot",
    customerName,
    customerEmail: customerEmail || (currentUser?.email || ""),
    customerPhone: cleanPhone,
    bookingDate: targetDate,
    totalAmount: amount,
    paymentStatus: initialPaymentStatus,
    bookingStatus: "PENDING",
    bookingType: "ONLINE",
    transactionId: transactionId || null,
    notes: combinedNotes,
  };

  let rawBooking;
  try {
    rawBooking = await db.booking.create({ data: bookingData });
  } catch (err) {
    delete bookingData.transactionId;
    try {
      rawBooking = await db.booking.create({ data: bookingData });
    } catch (innerErr) {
      delete bookingData.hallId;
      delete bookingData.hallName;
      rawBooking = await db.booking.create({ data: bookingData });
    }
  }

  const booking = enrichBooking(rawBooking);

  // Await automatic WhatsApp notification trigger to Branch Manager
  try {
    const managerNotifyResult = await sendManagerBookingNotification(booking, branch);
    const { cleanPhone, msg } = buildManagerWhatsAppNotificationText(booking, branch);
    await saveWhatsAppMessage({
      phone: cleanPhone,
      sender: "SYSTEM",
      senderName: `HaruViru Alert -> ${branch?.name || "Manager"}`,
      message: msg,
      status: managerNotifyResult.success ? "SENT" : "FAILED",
    });
    console.log("[createOnlineBooking] Manager WhatsApp notification sent result:", managerNotifyResult);
  } catch (e) {
    console.error("[createOnlineBooking] Manager notification trigger error:", e);
  }

  revalidatePath("/bookings");
  revalidatePath("/manager/bookings");
  revalidatePath("/manager/slots");
  revalidatePath("/branches");
  return { success: true, bookingNumber: booking.bookingNumber, bookingId: booking.id };
}

export async function createOfflineBooking(data) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action. Manager or Admin required.");
  }

  const {
    branchId,
    hallId,
    hallName,
    slotId,
    slotTitle,
    bookingDate,
    customerName,
    customerEmail,
    customerPhone,
    totalAmount,
    notes,
    paymentStatus,
    packageName,
    selectedAddOns,
    eventCategory,
    paymentType,
  } = data;

  if (currentUser.role === "MANAGER" && currentUser.managedBranchId !== branchId) {
    throw new Error("You can only create offline bookings for your assigned branch.");
  }

  if (!eventCategory || !eventCategory.trim()) {
    throw new Error("Event Category is required (e.g. Birthday, Anniversary).");
  }

  const branchObj = await db.branch.findUnique({ where: { id: branchId } });
  const isDeposit = paymentType === "DEPOSIT";
  const amount = parseFloat(totalAmount) || 0;
  const depSetting = branchObj?.depositAmount || 500;
  const paid = isDeposit ? Math.min(depSetting, amount) : amount;
  const remaining = isDeposit ? Math.max(0, amount - paid) : 0;
  const finalPaymentStatus = isDeposit ? "PARTIAL" : (paymentStatus || "PAID");

  const targetDate = parseLocalDateMidnight(bookingDate);

  const bookingNumber = generateBookingNumber();

  const formattedNotesParts = [];
  formattedNotesParts.push(`[Event: ${eventCategory.trim()}]`);
  if (packageName) formattedNotesParts.push(`[Package: ${packageName}]`);
  if (selectedAddOns && selectedAddOns.length > 0) {
    const addOnList = Array.isArray(selectedAddOns) ? selectedAddOns.join(", ") : selectedAddOns;
    formattedNotesParts.push(`[Add-Ons: ${addOnList}]`);
  }
  if (isDeposit) {
    formattedNotesParts.push(`[Payment Mode: Advance Deposit Paid ₹${paid}, Balance ₹${remaining} Due at Venue]`);
  }
  if (notes) formattedNotesParts.push(notes);

  const finalNotes = formattedNotesParts.join(" | ");

  const bookingData = {
    bookingNumber,
    branchId,
    hallId: hallId || null,
    hallName: hallName || null,
    slotId: slotId || null,
    slotTitle: slotTitle || "Offline Slot",
    customerName,
    customerEmail: customerEmail || "offline@haruvirucelebrationhouse.in",
    customerPhone,
    bookingDate: targetDate,
    totalAmount: amount,
    paymentStatus: finalPaymentStatus,
    bookingStatus: "CONFIRMED",
    bookingType: "OFFLINE",
    notes: finalNotes,
  };

  let rawBooking;
  try {
    rawBooking = await db.booking.create({ data: bookingData });
  } catch (err) {
    delete bookingData.hallId;
    delete bookingData.hallName;
    rawBooking = await db.booking.create({ data: bookingData });
  }

  const booking = enrichBooking(rawBooking);

  // Await automatic WhatsApp confirmation message trigger to Customer for walk-in / offline booking
  let waResult = null;
  try {
    if (branchObj) {
      waResult = await sendWhatsAppConfirmationApi(booking, branchObj);
      console.log("[createOfflineBooking] WhatsApp confirmation result:", waResult);
    }
  } catch (e) {
    console.error("[createOfflineBooking] WhatsApp confirmation trigger error:", e);
  }

  revalidatePath("/manager/bookings");
  revalidatePath("/admin");
  return { success: true, booking, waResult };
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
    include: { branch: true },
  });

  let waResult = null;
  if (bookingStatus === "CONFIRMED" && booking.branch) {
    try {
      waResult = await sendWhatsAppConfirmationApi(booking, booking.branch);
      const { cleanPhone, msg } = buildWhatsAppConfirmationText(booking, booking.branch);
      await saveWhatsAppMessage({
        phone: cleanPhone,
        sender: "ADMIN",
        senderName: "HaruViru Booking Approval",
        message: msg,
        status: waResult.success ? "SENT" : "FAILED",
      });
      console.log("WhatsApp API response:", JSON.stringify(waResult, null, 2));
    } catch (err) {
      console.error("WhatsApp API notification error:", err);
      waResult = { success: false, error: err.message };
    }
  }

  revalidatePath("/manager/bookings");
  revalidatePath("/admin");
  revalidatePath("/bookings");
  return { success: true, booking, waResult };
}

export async function settleBookingBalance(bookingId) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized action.");
  }

  const existing = await db.booking.findUnique({
    where: { id: bookingId },
    select: { id: true, totalAmount: true, notes: true, paymentStatus: true },
  });
  if (!existing) throw new Error("Booking not found.");

  const rawBooking = await db.booking.update({
    where: { id: bookingId },
    data: {
      paymentStatus: "PAID",
    },
  });

  const booking = await enrichBooking(rawBooking);

  revalidatePath("/manager/bookings");
  revalidatePath("/admin");
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

  if (!name || !phone || !city || !investmentBudget) {
    throw new Error("Please complete all required inquiry fields.");
  }

  const inquiry = await db.franchiseInquiry.create({
    data: {
      name,
      email: email || "N/A",
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

export async function createHistoricalAdminBooking(data) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized action. Admin access required.");
  }

  const { customerName, customerPhone, customerEmail, eventCategory, branchId, bookingDate, totalAmount } = data;

  if (!customerName || !customerPhone || !branchId || !bookingDate || !totalAmount) {
    throw new Error("Missing required historical booking fields.");
  }

  const bookingNumber = generateBookingNumber();
  const notesParts = [];

  if (eventCategory && eventCategory.trim()) {
    notesParts.push(`[Event: ${eventCategory.trim()}]`);
  }
  notesParts.push(`[Historical Past Data Entry Logged by Admin]`);

  const booking = await db.booking.create({
    data: {
      bookingNumber,
      branchId,
      customerName,
      customerPhone,
      customerEmail: customerEmail || `${customerPhone}@customer.haruviru.com`,
      bookingDate: new Date(bookingDate),
      totalAmount: parseFloat(totalAmount) || 0,
      paymentStatus: "PAID",
      bookingStatus: "COMPLETED",
      bookingType: "OFFLINE",
      slotTitle: "Past Data Entry",
      notes: notesParts.join(" "),
    },
    select: {
      id: true,
      bookingNumber: true,
      customerName: true,
      customerPhone: true,
      customerEmail: true,
      bookingDate: true,
      totalAmount: true,
      bookingStatus: true,
      paymentStatus: true,
      bookingType: true,
      slotTitle: true,
      hallName: true,
      notes: true,
      createdAt: true,
      branch: {
        select: {
          id: true,
          name: true,
          city: true,
        },
      },
    },
  });

  const enriched = await enrichBooking(booking);

  revalidatePath("/admin/managers");
  revalidatePath("/admin");
  revalidatePath("/manager");

  return { success: true, booking: enriched };
}

export async function getWhatsAppMarketingAudience(branchId = "all") {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  const branches = await db.branch.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  const whereClause = branchId && branchId !== "all" ? { branchId } : {};

  const bookings = await db.booking.findMany({
    where: whereClause,
    select: {
      customerName: true,
      customerPhone: true,
      bookingDate: true,
      branch: {
        select: { id: true, name: true, city: true },
      },
    },
    orderBy: { bookingDate: "desc" },
  });

  // Map distinct customers by clean 10-digit phone
  const customerMap = new Map();

  for (const b of bookings) {
    if (!b.customerPhone) continue;
    const cleanPhone = b.customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) continue;
    const normalizedPhone = cleanPhone.slice(-10);

    if (!customerMap.has(normalizedPhone)) {
      customerMap.set(normalizedPhone, {
        name: b.customerName || "Valued Customer",
        phone: b.customerPhone,
        cleanPhone: `91${normalizedPhone}`,
        branchName: b.branch?.name || "HaruViru",
        totalBookings: 1,
        lastBookingDate: b.bookingDate,
      });
    } else {
      const existing = customerMap.get(normalizedPhone);
      existing.totalBookings += 1;
    }
  }

  const customers = Array.from(customerMap.values());

  return {
    success: true,
    branches,
    totalCount: customers.length,
    customers,
  };
}

export async function sendWhatsAppMarketingBroadcast(data) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  const { branchId, campaignTitle, offerMessage, couponCode, callToActionUrl, manualPhones } = data;

  if (!campaignTitle || !offerMessage) {
    throw new Error("Campaign title and offer message are required.");
  }

  let phoneList = [];

  if (manualPhones && manualPhones.trim().length > 0) {
    phoneList = manualPhones
      .split(/[\n,;]+/)
      .map((p) => p.trim().replace(/[^0-9]/g, ""))
      .filter((p) => p.length >= 10);
  } else {
    const whereClause = branchId && branchId !== "all" ? { branchId } : {};
    const bookings = await db.booking.findMany({
      where: whereClause,
      select: { customerPhone: true },
    });

    const uniqueSet = new Set();
    for (const b of bookings) {
      if (!b.customerPhone) continue;
      const clean = b.customerPhone.replace(/[^0-9]/g, "");
      if (clean.length >= 10) {
        uniqueSet.add(clean.slice(-10));
      }
    }
    phoneList = Array.from(uniqueSet);
  }

  if (phoneList.length === 0) {
    throw new Error("No valid target customer phone numbers found for this campaign.");
  }

  const results = [];
  let successCount = 0;
  let failCount = 0;

  for (const phone of phoneList) {
    const res = await sendWhatsAppMarketingCampaign(
      phone,
      campaignTitle,
      offerMessage,
      couponCode,
      callToActionUrl
    );

    const msgBody = `🎉 *HARUVIRU CELEBRATION HOUSE - FESTIVE OFFER!* 🎉\n\n📢 *${campaignTitle}*\n\n${offerMessage}\n\n${couponCode ? `🎟️ *Special Coupon Code:* ${couponCode}\n\n` : ""}👉 *Book Your Arena Now:* ${callToActionUrl || "https://haruviru.com/branches"}`;

    await saveWhatsAppMessage({
      phone,
      sender: "ADMIN",
      senderName: "HaruViru Admin (Broadcast)",
      message: msgBody,
      status: res.success ? "SENT" : "FAILED",
      metaId: res.data?.messages?.[0]?.id || null,
      waLink: res.fallbackWaLink || null,
    });

    if (res.success) {
      successCount++;
    } else {
      failCount++;
    }

    results.push(res);
  }

  return {
    success: true,
    totalTargeted: phoneList.length,
    successCount,
    failCount,
    results,
  };
}

export async function getWhatsAppChatInboxData(selectedPhone = null) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  const conversations = await getAllWhatsAppConversations();
  let currentMessages = [];

  if (selectedPhone) {
    currentMessages = await getWhatsAppMessagesForPhone(selectedPhone);
  } else if (conversations.length > 0) {
    currentMessages = await getWhatsAppMessagesForPhone(conversations[0].phone);
  }

  const templates = await getAllWhatsAppTemplates();

  return {
    success: true,
    conversations,
    currentMessages,
    templates,
  };
}

export async function sendWhatsAppAdminReplyAction(toPhone, messageText) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized access. Admin or Manager privileges required.");
  }

  if (!toPhone || !messageText.trim()) {
    throw new Error("Phone number and message content are required.");
  }

  const res = await sendWhatsAppDirectTextMessage(toPhone, messageText);

  // Record sent message in chat history
  const savedMsg = await saveWhatsAppMessage({
    phone: toPhone,
    sender: "ADMIN",
    senderName: currentUser.role === "MANAGER" ? "Branch Manager" : "HaruViru Admin",
    message: messageText,
    status: res.success ? "SENT" : "FAILED",
    metaId: res.data?.messages?.[0]?.id || null,
    waLink: res.fallbackWaLink || null,
  });

  const updatedMessages = await getWhatsAppMessagesForPhone(toPhone);
  const conversations = await getAllWhatsAppConversations();

  return {
    success: true,
    result: res,
    savedMessage: savedMsg,
    messages: updatedMessages,
    conversations,
  };
}

export async function sendWhatsAppReminderTemplateAction({ toPhone, customerName, eventDate, branchName, couponCode, category, messageText }) {
  const currentUser = await checkUser();
  if (!currentUser || (currentUser.role !== "ADMIN" && currentUser.role !== "MANAGER")) {
    throw new Error("Unauthorized access. Admin or Manager privileges required.");
  }

  if (!toPhone) {
    throw new Error("Phone number is required.");
  }

  const res = await sendWhatsAppRebookReminderTemplateApi({
    toPhone,
    customerName,
    eventDate,
    branchName,
    couponCode,
    category,
  });

  const textToSave = messageText || (category === "ANNIVERSARY"
    ? `💍 CELEBRATE YOUR ANNIVERSARY AGAIN AT HARUVIRU! Dear ${customerName}, happy anniversary month on ${eventDate}! Use coupon ${couponCode || "LOVE2026"} at ${branchName}.`
    : `🎂 CELEBRATE YOUR BIRTHDAY AGAIN AT HARUVIRU! Dear ${customerName}, your birthday is coming up on ${eventDate}! Use coupon ${couponCode || "BDAY2026"} at ${branchName}.`);

  const savedMsg = await saveWhatsAppMessage({
    phone: toPhone,
    sender: "ADMIN",
    senderName: `${currentUser.role === "MANAGER" ? "Manager" : "HaruViru Admin"} (Reminder)`,
    message: textToSave,
    status: res.success ? "SENT" : "FAILED",
    metaId: res.data?.messages?.[0]?.id || null,
    waLink: res.fallbackWaLink || null,
  });

  return {
    success: true,
    result: res,
    savedMessage: savedMsg,
  };
}

export async function simulateCustomerReplyAction(phone, customerName, messageText) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  const saved = await saveWhatsAppMessage({
    phone,
    sender: "CUSTOMER",
    senderName: customerName || "Valued Customer",
    message: messageText,
    status: "RECEIVED",
  });

  const updatedMessages = await getWhatsAppMessagesForPhone(phone);
  const conversations = await getAllWhatsAppConversations();

  return {
    success: true,
    savedMessage: saved,
    messages: updatedMessages,
    conversations,
  };
}

export async function saveCustomFestivalTemplateAction(templateData) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  const { title, category, message, couponCode, callToActionUrl } = templateData;

  if (!title || !message) {
    throw new Error("Template title and message text are required.");
  }

  const tpl = await saveWhatsAppTemplate({
    title,
    category: category || "FESTIVAL",
    message,
    couponCode,
    callToActionUrl,
  });

  const templates = await getAllWhatsAppTemplates();

  return {
    success: true,
    template: tpl,
    templates,
  };
}

export async function deleteCustomFestivalTemplateAction(templateId) {
  const currentUser = await checkUser();
  if (!currentUser || currentUser.role !== "ADMIN") {
    throw new Error("Unauthorized access. Admin privileges required.");
  }

  await deleteWhatsAppTemplate(templateId);
  const templates = await getAllWhatsAppTemplates();

  return {
    success: true,
    templates,
  };
}



