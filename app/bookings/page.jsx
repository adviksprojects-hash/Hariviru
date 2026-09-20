import Link from "next/link";
import { requireAuth } from "@/lib/rbac";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "My Bookings | HaruViru Celebration House",
  description: "View and manage your celebration slot bookings at HaruViru.",
};

export default async function UserBookingsPage() {
  const user = await requireAuth();

  const bookings = await db.booking.findMany({
    where: {
      OR: [
        { userId: user.id },
        { customerEmail: user.email },
      ],
    },
    include: {
      branch: true,
      slot: true,
    },
    orderBy: { bookingDate: "desc" },
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen py-12 px-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        
        <div className="flex items-center justify-between mb-8">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              Customer Portal
            </span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
              My Celebration Bookings
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
              Logged in as <span className="font-semibold">{user.name || user.email}</span>
            </p>
          </div>

          <Link
            href="/branches"
            className="px-6 py-2.5 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-sm shadow-md"
          >
            + New Booking
          </Link>
        </div>

        {bookings.length === 0 ? (
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-12 text-center border border-gray-200 dark:border-gray-800 shadow-sm">
            <div className="text-4xl mb-3">🎉</div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">No Bookings Yet</h2>
            <p className="text-sm text-gray-500 mt-1 max-w-sm mx-auto">
              You haven't reserved any celebration house slots. Explore our branches and book your special event!
            </p>
            <Link
              href="/branches"
              className="inline-block mt-6 px-6 py-3 rounded-full bg-rose-600 text-white font-bold text-sm shadow-md"
            >
              Explore Branches →
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {bookings.map((booking) => (
              <div
                key={booking.id}
                className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl p-6 border border-gray-200/80 dark:border-gray-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4"
              >
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <span className="font-mono text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                      {booking.bookingNumber}
                    </span>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                      booking.bookingStatus === "CONFIRMED"
                        ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                        : booking.bookingStatus === "COMPLETED"
                        ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                        : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                    }`}>
                      {booking.bookingStatus}
                    </span>
                    <span className="text-xs text-gray-400">({booking.bookingType})</span>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {booking.branch.name}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    📍 {booking.branch.address}, {booking.branch.city}
                  </p>

                  <div className="mt-3 flex flex-wrap gap-4 text-xs font-medium text-gray-700 dark:text-gray-300">
                    <div>📅 <span className="font-bold">{new Date(booking.bookingDate).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}</span></div>
                    <div>🕒 <span className="font-bold">{booking.slotTitle || "Custom Slot"}</span></div>
                  </div>

                  {booking.notes && (
                    <div className="mt-3 text-xs bg-amber-50 dark:bg-amber-950/40 p-2.5 rounded-xl border border-amber-200 dark:border-amber-800/50 text-amber-900 dark:text-amber-200">
                      📝 {booking.notes}
                    </div>
                  )}
                </div>

                <div className="text-left md:text-right border-t md:border-t-0 pt-4 md:pt-0 border-gray-100 dark:border-gray-800">
                  <div className="text-xs text-gray-500">Total Amount</div>
                  <div className="text-2xl font-black text-rose-600">₹{booking.totalAmount}</div>
                  <div className="text-xs font-semibold text-gray-500 mt-1">
                    Payment: <span className="text-emerald-600 font-bold">{booking.paymentStatus}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
