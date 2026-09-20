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
  const totalBookings = await db.booking.count();
  const pendingInquiries = await db.franchiseInquiry.count({ where: { status: "PENDING" } });

  const totalRevenueAgg = await db.booking.aggregate({
    where: { bookingStatus: { in: ["CONFIRMED", "COMPLETED"] } },
    _sum: { totalAmount: true },
  });

  const totalRevenue = totalRevenueAgg._sum.totalAmount || 0;

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
            <div className="text-xs font-semibold text-gray-500">Total Revenue</div>
            <div className="text-3xl font-black text-emerald-600 mt-1">₹{totalRevenue.toLocaleString()}</div>
            <div className="text-xs text-gray-400 mt-1">Across all branches</div>
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
            <div className="text-xs font-semibold text-gray-500">Total Bookings</div>
            <div className="text-3xl font-black text-amber-600 mt-1">{totalBookings}</div>
            <div className="text-xs text-gray-400 mt-1">Online & Offline combined</div>
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
