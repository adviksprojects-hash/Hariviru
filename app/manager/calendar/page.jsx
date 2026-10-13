import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { getBranchPackages, getBranchAddOns } from "@/lib/actions";
import ManagerCalendarClient from "./ManagerCalendarClient";

export const metadata = {
  title: "Branch Availability Calendar | Manager Portal",
};

export default async function ManagerCalendarPage() {
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
      slots: { where: { isActive: true }, orderBy: { startTime: "asc" } },
    },
  });

  let halls = [];
  if (db && db.hall) {
    halls = await db.hall.findMany({
      where: { branchId, isActive: true },
      orderBy: { createdAt: "asc" },
    });
  }

  const { packages = [] } = await getBranchPackages(branchId);
  const { addOns = [] } = await getBranchAddOns(branchId);

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <Link href="/manager" className="text-xs font-semibold text-rose-600 hover:underline">
              ← Back to Manager Overview
            </Link>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              📅 {branch.name} — Availability Calendar
            </h1>
            <p className="text-sm text-gray-500">
              Inspect date-wise booked and available celebration slots for each hall.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              href="/manager/bookings"
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs hover:border-rose-500"
            >
              📋 All Bookings
            </Link>
            <Link
              href="/manager/slots"
              className="px-4 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-xs hover:border-rose-500"
            >
              ⏰ Slots Setup
            </Link>
          </div>
        </div>

        <ManagerCalendarClient
          branch={branch}
          halls={halls}
          packages={packages}
          addOns={addOns}
        />
      </div>
    </main>
  );
}
