import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import ManagerBookingsClient from "./ManagerBookingsClient";

export const metadata = {
  title: "Branch Bookings | Manager Portal",
};

export default async function ManagerBookingsPage() {
  const user = await requireRole(["MANAGER", "ADMIN"]);

  let branchId = user.managedBranchId;

  if (!branchId) {
    const firstBranch = await db.branch.findFirst({ where: { isActive: true } });
    if (!firstBranch) return <div className="p-8">No branch found.</div>;
    branchId = firstBranch.id;
  }

  const branch = await db.branch.findUnique({
    where: { id: branchId },
    include: {
      slots: { where: { isActive: true } },
    },
  });

  const bookings = await db.booking.findMany({
    where: { branchId },
    orderBy: { bookingDate: "desc" },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/manager" className="text-xs font-semibold text-rose-600 hover:underline">
              ← Back to Manager Overview
            </Link>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              {branch.name} — Booking Manager
            </h1>
            <p className="text-sm text-gray-500">Manage online reservations & record new offline walk-in bookings.</p>
          </div>
        </div>

        {/* Client Component handling list, filtering, offline creation modal, and status updates */}
        <ManagerBookingsClient branch={branch} initialBookings={bookings} />

      </div>
    </main>
  );
}
