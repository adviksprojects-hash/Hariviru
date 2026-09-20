import Link from "next/link";
import { db } from "@/lib/prisma";
import BranchCard from "@/components/BranchComponents/BranchCard";

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
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen py-12 px-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <span className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold uppercase tracking-widest shadow-2xs">
            Franchise Directory
          </span>
          <h1 className="text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-3">
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
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        )}

      </div>
    </main>
  );
}
