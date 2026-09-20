import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import BookingFormClient from "./BookingFormClient";

export async function generateMetadata({ params }) {
  const slug = (await params).branchSlug;
  const branch = await db.branch.findUnique({ where: { slug } });
  return {
    title: branch ? `Book ${branch.name} | HaruViru` : "Book Celebration",
  };
}

export default async function BookingPage({ params, searchParams }) {
  const branchSlug = (await params).branchSlug;
  const initialSlotId = (await searchParams)?.slotId || null;

  const branch = await db.branch.findUnique({
    where: { slug: branchSlug },
    include: {
      slots: {
        where: { isActive: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!branch || !branch.isActive) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="container mx-auto max-w-3xl">
        
        <Link href={`/branches/${branch.slug}`} className="inline-flex items-center gap-1 text-sm font-semibold text-rose-600 hover:underline mb-6">
          ← Back to {branch.name}
        </Link>

        <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 p-6 sm:p-10 shadow-xl">
          <div className="border-b border-gray-200 dark:border-gray-800 pb-6 mb-8">
            <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">Instant Online Booking</span>
            <h1 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
              Reserve {branch.name}
            </h1>
            <p className="text-sm text-gray-500 mt-1">📍 {branch.address}, {branch.city}</p>
          </div>

          {/* Client Booking Form */}
          <BookingFormClient branch={branch} initialSlotId={initialSlotId} />
        </div>

      </div>
    </main>
  );
}
