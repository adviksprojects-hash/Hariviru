import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import WhatsAppMarketingClient from "./WhatsAppMarketingClient";
import { getAllWhatsAppConversations, getAllWhatsAppTemplates } from "@/lib/whatsapp-chat-store";

export const metadata = {
  title: "WhatsApp Center & Live Inbox | Admin Portal",
};

export default async function WhatsAppMarketingPage() {
  await requireRole(["ADMIN"]);

  const branches = await db.branch.findMany({
    select: { id: true, name: true, city: true },
    orderBy: { name: "asc" },
  });

  const bookings = await db.booking.findMany({
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

  // Aggregate initial distinct customer phone list
  const customerMap = new Map();
  for (const b of bookings) {
    if (!b.customerPhone) continue;
    const clean = b.customerPhone.replace(/[^0-9]/g, "");
    if (clean.length < 10) continue;
    const normalized = clean.slice(-10);

    if (!customerMap.has(normalized)) {
      customerMap.set(normalized, {
        name: b.customerName || "Valued Customer",
        phone: b.customerPhone,
        cleanPhone: `91${normalized}`,
        branchName: b.branch?.name || "HaruViru",
        branchId: b.branch?.id || "unknown",
        totalBookings: 1,
        lastBookingDate: b.bookingDate,
      });
    } else {
      const existing = customerMap.get(normalized);
      existing.totalBookings += 1;
    }
  }

  const initialCustomers = Array.from(customerMap.values());
  const initialConversations = getAllWhatsAppConversations();
  const initialTemplates = getAllWhatsAppTemplates();

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4">
      <div className="container mx-auto max-w-7xl">
        <Link href="/admin" className="text-xs font-semibold text-rose-600 hover:underline mb-4 inline-block">
          ← Back to Admin Control
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight flex items-center gap-3">
              <span>📱</span> WhatsApp Marketing & Live Chat Inbox
            </h1>
            <p className="text-sm text-gray-500">
              Manage two-way customer conversations, create custom festival templates, and broadcast marketing offers automatically.
            </p>
          </div>
        </div>

        <WhatsAppMarketingClient
          initialBranches={branches}
          initialCustomers={initialCustomers}
          initialConversations={initialConversations}
          initialTemplates={initialTemplates}
        />
      </div>
    </main>
  );
}
