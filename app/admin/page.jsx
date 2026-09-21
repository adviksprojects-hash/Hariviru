import Link from "next/link";
import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Admin Portal | HaruViru Celebration House",
};

export default async function AdminDashboardPage() {
  await requireRole(["ADMIN"]);

  const totalBranches = await db.branch.count();
  const activeBranches = await db.branch.count({ where: { isActive: true } });
  const totalManagers = await db.user.count({ where: { role: "MANAGER" } });
  const totalBookingsCount = await db.booking.count();
  const pendingInquiries = await db.franchiseInquiry.count({ where: { status: "PENDING" } });

  // Fetch all branches with bookings for franchise-wise revenue analysis
  const branches = await db.branch.findMany({
    include: {
      bookings: {
        where: { bookingStatus: { in: ["CONFIRMED", "COMPLETED"] } },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  // Calculate franchise-wise breakdown
  const franchiseRevenueList = branches.map((b) => {
    const onlineBookings = b.bookings.filter((bk) => bk.bookingType === "ONLINE");
    const offlineBookings = b.bookings.filter((bk) => bk.bookingType === "OFFLINE");

    const onlineRevenue = onlineBookings.reduce((sum, bk) => sum + bk.totalAmount, 0);
    const offlineRevenue = offlineBookings.reduce((sum, bk) => sum + bk.totalAmount, 0);
    const totalBranchRevenue = onlineRevenue + offlineRevenue;

    return {
      id: b.id,
      name: b.name,
      city: b.city,
      totalBranchRevenue,
      onlineCount: onlineBookings.length,
      onlineRevenue,
      offlineCount: offlineBookings.length,
      offlineRevenue,
      totalCount: b.bookings.length,
    };
  });

  // Fetch all confirmed/completed bookings for monthly revenue analysis
  const allBookings = await db.booking.findMany({
    where: { bookingStatus: { in: ["CONFIRMED", "COMPLETED"] } },
    select: { bookingDate: true, totalAmount: true, bookingType: true },
  });

  const totalRevenue = allBookings.reduce((sum, b) => sum + b.totalAmount, 0);

  // Group bookings by Month (Year-Month key e.g. "2026-09")
  const monthlyRevenueMap = {};
  allBookings.forEach((b) => {
    const d = new Date(b.bookingDate);
    const monthKey = d.toLocaleString("en-US", { month: "short", year: "numeric" });
    if (!monthlyRevenueMap[monthKey]) {
      monthlyRevenueMap[monthKey] = { total: 0, online: 0, offline: 0, count: 0 };
    }
    monthlyRevenueMap[monthKey].total += b.totalAmount;
    monthlyRevenueMap[monthKey].count += 1;
    if (b.bookingType === "ONLINE") monthlyRevenueMap[monthKey].online += b.totalAmount;
    else monthlyRevenueMap[monthKey].offline += b.totalAmount;
  });

  const recentBookings = await db.booking.findMany({
    take: 5,
    orderBy: { createdAt: "desc" },
    include: { branch: true },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              System Admin Portal
            </span>
            <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
              HaruViru Master Control
            </h1>
            <p className="text-sm text-gray-500">Global overview across all franchises, managers, and revenue.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <Link
              href="/admin/branches"
              className="px-5 py-2.5 rounded-full bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs shadow-md"
            >
              🏢 Manage Franchises
            </Link>
            <Link
              href="/admin/managers"
              className="px-5 py-2.5 rounded-full bg-rose-600 text-white font-bold text-xs shadow-md"
            >
              👥 Manage Managers
            </Link>
            <Link
              href="/admin/franchise-inquiries"
              className="px-5 py-2.5 rounded-full bg-amber-600 text-white font-bold text-xs shadow-md"
            >
              📩 Franchise Leads ({pendingInquiries})
            </Link>
          </div>
        </div>

        {/* System Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Total System Revenue</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Across all franchises</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Franchise Branches</div>
            <div className="text-3xl font-black text-gray-900 dark:text-white mt-1">{totalBranches}</div>
            <div className="text-xs text-emerald-600 font-bold mt-1">{activeBranches} Active Now</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Assigned Managers</div>
            <div className="text-3xl font-black text-rose-600 mt-1">{totalManagers}</div>
            <div className="text-xs text-gray-400 mt-1">Franchise owners/managers</div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-xs font-semibold text-gray-500">Total Bookings Logged</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{totalBookingsCount}</div>
            <div className="text-xs text-gray-400 mt-1">Online & Offline combined</div>
          </div>
        </div>

        {/* Franchise-Wise Revenue Breakdown Table */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs mb-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                📊 Franchise-Wise Booking & Revenue Analysis
              </h2>
              <p className="text-xs text-gray-500">Revenue breakdown by each franchise location (Online vs Offline walk-ins).</p>
            </div>
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-emerald-100 text-emerald-800">
              Total: ₹{totalRevenue.toLocaleString()}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
                  <th className="py-3 px-3">Franchise Branch</th>
                  <th className="py-3 px-3">Online Bookings</th>
                  <th className="py-3 px-3">Offline Walk-ins</th>
                  <th className="py-3 px-3">Total Bookings</th>
                  <th className="py-3 px-3 text-right">Total Revenue (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {franchiseRevenueList.map((f) => (
                  <tr key={f.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-4 px-3 font-bold text-gray-900 dark:text-white">
                      {f.name} <span className="text-xs font-normal text-gray-400">({f.city})</span>
                    </td>
                    <td className="py-4 px-3 text-xs">
                      <span className="font-semibold">{f.onlineCount} bookings</span>
                      <div className="text-gray-400">₹{f.onlineRevenue.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-3 text-xs">
                      <span className="font-semibold">{f.offlineCount} walk-ins</span>
                      <div className="text-gray-400">₹{f.offlineRevenue.toLocaleString()}</div>
                    </td>
                    <td className="py-4 px-3 text-xs font-bold text-gray-700 dark:text-gray-300">
                      {f.totalCount} total
                    </td>
                    <td className="py-4 px-3 text-right font-black text-rose-600 text-base">
                      ₹{f.totalBranchRevenue.toLocaleString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Monthly Revenue Analysis Card */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs mb-10">
          <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
            🗓️ Monthly Revenue Analysis
          </h2>
          <p className="text-xs text-gray-500 mb-4">Month-by-month earnings timeline across all franchise branches.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Object.keys(monthlyRevenueMap).length === 0 ? (
              <p className="text-xs text-gray-400 col-span-3 py-4 text-center">No monthly records available yet.</p>
            ) : (
              Object.entries(monthlyRevenueMap).map(([month, data]) => (
                <div key={month} className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs font-bold uppercase tracking-wider text-rose-600">{month}</div>
                  <div className="text-2xl font-black text-gray-900 dark:text-white mt-1">₹{data.total.toLocaleString()}</div>
                  <div className="mt-2 flex items-center justify-between text-[11px] text-gray-500">
                    <span>Online: ₹{data.online.toLocaleString()}</span>
                    <span>Offline: ₹{data.offline.toLocaleString()}</span>
                  </div>
                  <div className="text-[11px] text-gray-400 mt-1">{data.count} Total Bookings</div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Management Quick Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
          <Link href="/admin/branches" className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-rose-500 transition-all shadow-xs group">
            <div className="text-3xl mb-2">🏢</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-rose-600">Franchise Branches</h3>
            <p className="text-xs text-gray-500 mt-1">Add new branches, set pricing, update photos & city locations.</p>
          </Link>

          <Link href="/admin/managers" className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-rose-500 transition-all shadow-xs group">
            <div className="text-3xl mb-2">👔</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-rose-600">Manager Roles</h3>
            <p className="text-xs text-gray-500 mt-1">Promote registered users to Manager and assign them to branches.</p>
          </Link>

          <Link href="/admin/franchise-inquiries" className="p-6 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 hover:border-rose-500 transition-all shadow-xs group">
            <div className="text-3xl mb-2">📬</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white group-hover:text-rose-600">Franchise Leads ({pendingInquiries})</h3>
            <p className="text-xs text-gray-500 mt-1">Review applications from prospective franchise partners.</p>
          </Link>
        </div>

        {/* System Recent Activity */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Latest System Bookings</h2>
          {recentBookings.length === 0 ? (
            <p className="text-sm text-gray-500 py-6 text-center">No bookings logged in the system yet.</p>
          ) : (
            <div className="space-y-3">
              {recentBookings.map((b) => (
                <div key={b.id} className="p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="font-mono text-xs font-bold text-rose-600">{b.bookingNumber}</span>
                    <span className="text-xs text-gray-400 ml-2">({b.branch.name})</span>
                    <div className="font-semibold text-gray-900 dark:text-white text-sm mt-0.5">{b.customerName} — {b.customerPhone}</div>
                  </div>

                  <div className="text-right">
                    <div className="font-black text-rose-600 text-sm">₹{b.totalAmount}</div>
                    <div className="text-xs font-bold text-emerald-600">{b.bookingStatus}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
