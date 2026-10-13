import { requireRole } from "@/lib/rbac";
import { db } from "@/lib/prisma";
import { enrichBooking } from "@/lib/actions";
import AdminManagersClient from "./AdminManagersClient";

export const metadata = {
  title: "Manage Users & Celebration Customers | Admin Portal",
};

export default async function AdminManagersPage() {
  await requireRole(["ADMIN"]);

  const rawBookings = await db.booking.findMany({
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
    orderBy: { bookingDate: "desc" },
  });

  const bookings = await Promise.all(rawBookings.map((b) => enrichBooking(b)));

  const branches = await db.branch.findMany({
    where: { isActive: true },
    select: { id: true, name: true, city: true },
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="mb-8">
          <span className="px-3 py-1 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-bold uppercase tracking-wider">
            Customer Management
          </span>
          <h1 className="text-3xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            👥 Celebration Customers & Bookings Directory
          </h1>
          <p className="text-sm text-gray-500">
            View all customers who have booked celebration slots filtered by franchise branch, mobile number, name, and event category.
          </p>
        </div>

        <AdminManagersClient initialBookings={bookings} branches={branches} />
      </div>
    </main>
  );
}
