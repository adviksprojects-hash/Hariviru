import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  const branch = await db.branch.findUnique({ where: { slug } });

  if (!branch) return { title: "Branch Not Found | HaruViru" };

  return {
    title: `${branch.name} | HaruViru Celebration House`,
    description: `Book private celebration slots at ${branch.name}, ${branch.city}. Equipped with 4K theater, theme decor, and lounge.`,
  };
}

export default async function BranchDetailPage({ params }) {
  const slug = (await params).slug;

  const branch = await db.branch.findUnique({
    where: { slug },
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
      <div className="container mx-auto max-w-5xl">
        
        {/* Back Link */}
        <Link href="/branches" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline mb-6">
          ← Back to All Branches
        </Link>

        {/* Branch Title Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
              {branch.name}
            </h1>
            <p className="mt-2 text-base text-gray-600 dark:text-gray-400 flex items-center gap-2">
              <span>📍 {branch.address}, {branch.city}, {branch.state}</span>
              <span>•</span>
              <span>📞 {branch.phone}</span>
            </p>
          </div>

          <Link
            href={`/book/${branch.slug}`}
            className="self-start md:self-auto px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-500/20 transition-all text-center"
          >
            Book Celebration Slot Now
          </Link>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {branch.images.length > 0 ? (
            branch.images.map((img, idx) => (
              <div
                key={idx}
                className={`overflow-hidden rounded-3xl bg-gray-200 h-64 md:h-80 ${idx === 0 ? "md:col-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt={`${branch.name} ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 h-80 rounded-3xl bg-gray-200 flex items-center justify-center text-gray-400">
              No Photos Available
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Celebration House</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {branch.description}
              </p>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Included Amenities & Highlights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {branch.amenities.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="text-rose-500">✨</span> {item}
                  </div>
                ))}
              </div>
            </div>

            {/* Customer Reviews Preview */}
            <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6">Guest Reviews</h2>
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">Rahul & Sneha</span>
                    <span className="text-amber-500 text-sm">★★★★★</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    "Booked the evening slot for a surprise birthday movie date. The 4K theater setup and ambient balloon decor exceeded all expectations!"
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-bold text-gray-900 dark:text-white">Priya M.</span>
                    <span className="text-amber-500 text-sm">★★★★★</span>
                  </div>
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    "Super clean room, helpful branch host, and seamless booking. Highly recommended for private celebrations in town."
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Time Slots Sidebar */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md sticky top-28">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Available Time Slots</h3>
              <p className="text-xs text-gray-500 mb-6">Pick a slot to reserve your celebration date.</p>

              <div className="space-y-3">
                {branch.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-rose-500 transition-colors flex items-center justify-between"
                  >
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{slot.title}</div>
                      <div className="text-xs text-gray-500">🕒 {slot.startTime} - {slot.endTime}</div>
                      <div className="text-sm font-black text-rose-600 mt-1">₹{slot.price}</div>
                    </div>

                    <Link
                      href={`/book/${branch.slug}?slotId=${slot.id}`}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                    >
                      Book Slot
                    </Link>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 text-center">
                <Link
                  href={`/book/${branch.slug}`}
                  className="w-full block py-3 rounded-2xl bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-sm shadow-md"
                >
                  Select Date & Book
                </Link>
              </div>
            </div>
          </div>

        </div>

      </div>
    </main>
  );
}
