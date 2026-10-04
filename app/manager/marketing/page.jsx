import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { getAllWhatsAppTemplates } from "@/lib/whatsapp-chat-store";
import ManagerMarketingClient from "./ManagerMarketingClient";

export const metadata = {
  title: "Marketing & Target Reminders | Manager Portal",
};

export default async function ManagerMarketingPage() {
  const user = await requireRole(["ADMIN", "MANAGER"]);

  let branchWhere = {};
  if (user.role === "MANAGER" && user.managedBranchId) {
    branchWhere = { branchId: user.managedBranchId };
  }

  const branches = await db.branch.findMany({
    where: user.role === "MANAGER" && user.managedBranchId ? { id: user.managedBranchId } : { isActive: true },
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  const bookings = await db.booking.findMany({
    where: branchWhere,
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
        select: { id: true, name: true, city: true },
      },
    },
    orderBy: { bookingDate: "desc" },
  });

  // Calculate 1-year recurring anniversary dates & target audience
  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const currentYear = now.getFullYear();

  const customerMap = new Map();

  for (const b of bookings) {
    if (!b.customerPhone) continue;
    const cleanPhone = b.customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 10) continue;
    const tenDigits = cleanPhone.slice(-10);

    const origDate = new Date(b.bookingDate);
    if (isNaN(origDate.getTime())) continue;

    // Detect occasion category: default to BIRTHDAY or ANNIVERSARY
    const notesLower = (b.notes || "").toLowerCase();
    let category = "BIRTHDAY";
    if (notesLower.includes("anniversary") || notesLower.includes("wedding") || notesLower.includes("marriage") || notesLower.includes("love")) {
      category = "ANNIVERSARY";
    } else if (notesLower.includes("birthday") || notesLower.includes("bday") || notesLower.includes("birth")) {
      category = "BIRTHDAY";
    }

    // Calculate candidate anniversary date in current year
    let candidate = new Date(currentYear, origDate.getMonth(), origDate.getDate());

    // If candidate date in current year has already passed, target next year's anniversary
    if (candidate < startOfToday) {
      candidate = new Date(currentYear + 1, origDate.getMonth(), origDate.getDate());
    }

    // Ensure candidate date is at least ~300 days after original booking date (1-year return target)
    const diffFromOrig = (candidate.getTime() - origDate.getTime()) / (1000 * 60 * 60 * 24);
    if (diffFromOrig < 300) {
      candidate = new Date(candidate.getFullYear() + 1, origDate.getMonth(), origDate.getDate());
    }

    const daysUntil = Math.round((candidate.getTime() - startOfToday.getTime()) / (1000 * 60 * 60 * 24));

    // Exclude passed dates (daysUntil < 0) as requested
    if (daysUntil < 0) continue;

    if (!customerMap.has(tenDigits)) {
      customerMap.set(tenDigits, {
        id: b.id,
        name: b.customerName || "Valued Customer",
        phone: b.customerPhone,
        cleanPhone: cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone,
        email: b.customerEmail,
        branchName: b.branch?.name || "HaruViru",
        branchId: b.branch?.id || "unknown",
        notes: b.notes || "",
        category,
        originalBookingDate: b.bookingDate.toISOString(),
        upcomingEventDate: candidate.toISOString(),
        daysUntil,
        isDueIn2Days: daysUntil === 2,
        isDueTodayOrTomorrow: daysUntil >= 0 && daysUntil <= 1,
        isDueThisWeek: daysUntil >= 0 && daysUntil <= 7,
      });
    }
  }

  const targetCustomers = Array.from(customerMap.values())
    .filter((c) => c.daysUntil >= 0) // Strictly active/upcoming target dates only
    .sort((a, b) => a.daysUntil - b.daysUntil);

  const allTemplates = await getAllWhatsAppTemplates();
  const templates = allTemplates.filter(
    (t) => t.category === "BIRTHDAY" || t.category === "ANNIVERSARY"
  );

  return (
    <main className="p-4 sm:p-6 lg:p-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
            <span>📢</span> Branch Celebration Target Reminders
          </h1>
          <p className="text-xs sm:text-sm text-gray-500 mt-1">
            Target previous year branch customers 2 days prior to their 1-year Birthday & Anniversary celebration date.
          </p>
        </div>
      </div>

      <ManagerMarketingClient
        initialCustomers={targetCustomers}
        initialTemplates={templates}
        branches={branches}
      />
    </main>
  );
}
