import Link from "next/link";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "Explore Branches | HaruViru Celebration House",
  description: "Find HaruViru private celebration house branches near you in Hyderabad, Bengaluru, and major cities.",
};

export default async function BranchesPage({ searchParams }) {
  const query = (await searchParams)?.q || "";

  const branches = await db.branch.findMany({
    where: {
      isActive: true,
      OR: query ? [
        { name: { contains: query, mode: "insensitive" } },
        { city: { contains: query, mode: "insensitive" } },
        { address: { contains: query, mode: "insensitive" } },
      ] : undefined,
    },
    include: {
      slots: { where: { isActive: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight">
            HaruViru Celebration House Branches
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Select your preferred location to view available time slots and book your private event.
          </p>

          {/* Search Bar */}
          <form method="GET" className="mt-6 flex items-center justify-center gap-2 max-w-md mx-auto">
            <input
              type="text"
              name="q"
              defaultValue={query}
              placeholder="Search by city or branch name..."
              className="w-full px-5 py-3 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white shadow-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500"
            />
            <button
              type="submit"
              className="px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-semibold text-sm hover:opacity-90 shadow-md"
            >
              Search
            </button>
          </form>
        </div>

        {/* Branch Cards Grid */}
        {branches.length === 0 ? (
          <div className="text-center py-16 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
            <p className="text-xl font-bold text-gray-700 dark:text-gray-300">No branches found matching "{query}"</p>
            <p className="mt-2 text-gray-500">Try searching for Hyderabad, Bengaluru, or Jubilee Hills.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map((branch) => (
              <div
                key={branch.id}
                className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div className="relative h-56 w-full bg-gray-200">
                    <img
                      src={branch.images?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"}
                      alt={branch.name}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
                      📍 {branch.city}, {branch.state}
                    </div>
                  </div>

                  <div className="p-6">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                      {branch.name}
                    </h2>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      📍 {branch.address}
                    </p>

                    <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                      {branch.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {branch.amenities.map((amenity, idx) => (
                        <span
                          key={idx}
                          className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300"
                        >
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-800 mt-4 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-500 block">Slot Price</span>
                    <span className="text-2xl font-black text-rose-600">₹{branch.pricePerSlot}</span>
                  </div>

                  <Link
                    href={`/branches/${branch.slug}`}
                    className="px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md transition-all"
                  >
                    View & Book →
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
