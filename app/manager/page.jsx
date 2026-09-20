import Link from "next/link";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Manager Portal | HaruViru Celebration House",
};

export default async function ManagerDashboardPage() {
  const user = await requireRole(["MANAGER", "ADMIN"]);

  // If user is ADMIN or MANAGER, find assigned branch
  let branchId = user.managedBranchId;

  // If ADMIN is visiting /manager without a specific branch assigned, pick the first active branch
  if (!branchId) {
    const firstBranch = await db.branch.findFirst({ where: { isActive: true } });
    if (!firstBranch) {
      return (
        <main className="min-h-screen p-12 text-center">
          <h1 className="text-2xl font-bold">No Active Franchise Branches Found</h1>
          <p className="mt-2 text-gray-500">Please add a branch from the Admin Portal first.</p>
          <Link href="/admin/branches" className="mt-4 inline-block px-6 py-2 bg-rose-600 text-white rounded-xl">Go to Admin Branches</Link>
        </main>
      );
    }
    branchId = firstBranch.id;
  }

  const branch = await db.branch.findUnique({
    where: { id: branchId },
    include: {
      slots: true,
      bookings: {
        orderBy: { bookingDate: "desc" },
        take: 10,
      },
    },
  });

  if (!branch) {
    return (
      <main className="min-h-screen p-12 text-center">
        <h1 className="text-2xl font-bold">No Franchise Branch Assigned</h1>
        <p className="mt-2 text-gray-500">Your manager profile is not currently assigned to a franchise branch.</p>
      </main>
    );
  }

  // Calculate branch stats
  const totalBookings = await db.booking.count({ where: { branchId: branch.id } });
  const onlineBookingsCount = await db.booking.count({ where: { branchId: branch.id, bookingType: "ONLINE" } });
  const offlineBookingsCount = await db.booking.count({ where: { branchId: branch.id, bookingType: "OFFLINE" } });

  const revenueAggregate = await db.booking.aggregate({
    where: { branchId: branch.id, bookingStatus: { in: ["CONFIRMED", "COMPLETED"] } },
    _sum: { totalAmount: true },
  });

  const totalRevenue = revenueAggregate._sum.totalAmount || 0;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header Banner */}
        <div className="bg-linear-to-r from-rose-600 to-amber-600 rounded-3xl p-8 text-white shadow-xl mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <span className="px-3 py-1 rounded-full bg-white/20 backdrop-blur-md text-xs font-bold uppercase tracking-wider">
              Franchise Manager Dashboard
            </span>
            <h1 className="text-3xl sm:text-4xl font-black mt-2">
              {branch.name}
            </h1>
            <p className="text-sm text-rose-100 mt-1">📍 {branch.address}, {branch.city}</p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              href="/manager/bookings"
              className="px-6 py-3 rounded-full bg-white text-rose-600 hover:bg-rose-50 font-bold text-sm shadow-md transition-all"
            >
              📋 Manage Bookings & Offline Walk-ins
            </Link>
            <Link
              href="/manager/slots"
              className="px-6 py-3 rounded-full bg-black/30 hover:bg-black/40 text-white font-bold text-sm backdrop-blur-md border border-white/20 transition-all"
            >
              ⏰ Manage Slots
            </Link>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Total Bookings</div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalBookings}</div>
            <div className="text-xs text-gray-400 mt-1">Online & Offline combined</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Online Bookings</div>
            <div className="text-3xl font-black text-rose-600 mt-1">{onlineBookingsCount}</div>
            <div className="text-xs text-gray-400 mt-1">Booked via Website</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Offline Walk-ins</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{offlineBookingsCount}</div>
            <div className="text-xs text-gray-400 mt-1">Logged by Manager</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Total Revenue Generated</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Confirmed revenue</div>
          </div>
        </div>

        {/* Recent Bookings Table Preview */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xs">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Branch Bookings</h2>
              <p className="text-xs text-gray-500">Latest 10 celebration reservations for {branch.name}</p>
            </div>
            <Link
              href="/manager/bookings"
              className="text-xs font-bold text-rose-600 hover:underline"
            >
              View All Bookings →
            </Link>
          </div>

          {branch.bookings.length === 0 ? (
            <p className="text-sm text-gray-500 text-center py-8">No bookings logged for this branch yet.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-3">Booking #</th>
                    <th className="py-3 px-3">Customer</th>
                    <th className="py-3 px-3">Date</th>
                    <th className="py-3 px-3">Slot</th>
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {branch.bookings.map((booking) => (
                    <tr key={booking.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                      <td className="py-3.5 px-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {booking.bookingNumber}
                      </td>
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-gray-900 dark:text-white">{booking.customerName}</div>
                        <div className="text-xs text-gray-500">{booking.customerPhone}</div>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-gray-700 dark:text-gray-300">
                        {new Date(booking.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </td>
                      <td className="py-3.5 px-3 text-xs text-gray-600 dark:text-gray-400">
                        {booking.slotTitle || "Custom Slot"}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          booking.bookingType === "ONLINE"
                            ? "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                            : "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300"
                        }`}>
                          {booking.bookingType}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 font-bold text-gray-900 dark:text-white">
                        ₹{booking.totalAmount}
                      </td>
                      <td className="py-3.5 px-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          booking.bookingStatus === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800"
                            : booking.bookingStatus === "COMPLETED"
                            ? "bg-blue-100 text-blue-800"
                            : "bg-rose-100 text-rose-800"
                        }`}>
                          {booking.bookingStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
