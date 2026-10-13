import { db } from "@/lib/prisma";
import { getGlobalPackages } from "@/lib/actions";
import BranchesSearchClient from "@/components/BranchComponents/BranchesSearchClient";

export const metadata = {
  title: "Explore Branches | HaruViru Celebration House",
  description: "Find HaruViru private celebration house branches near you in Pune, Hyderabad, Bengaluru, and major cities.",
};

export default async function BranchesPage({ searchParams }) {
  const query = (await searchParams)?.q || "";

  const { packages: globalPackages } = await getGlobalPackages();

  const rawBranches = await db.branch.findMany({
    where: { isActive: true },
    include: {
      packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
      slots: { where: { isActive: true } }
    },
    orderBy: { createdAt: "desc" }
  });

  // Merge each branch's custom package overrides with default global packages
  const branches = rawBranches.map((branch) => {
    const branchPackages = branch.packages || [];
    const usedBranchIds = new Set();
    const mergedPackages = (globalPackages || []).map((gPkg) => {
      const match = branchPackages.find(
        (bPkg) =>
          !usedBranchIds.has(bPkg.id) &&
          (bPkg.name.toLowerCase() === gPkg.name.toLowerCase() ||
           (bPkg.badge && gPkg.badge && bPkg.badge.toLowerCase() === gPkg.badge.toLowerCase()))
      );
      if (match) {
        usedBranchIds.add(match.id);
        return match;
      }
      return gPkg;
    });

    branchPackages.forEach((bPkg) => {
      if (!usedBranchIds.has(bPkg.id)) {
        mergedPackages.push(bPkg);
      }
    });

    return {
      ...branch,
      packages: mergedPackages,
    };
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen pt-4 pb-12 px-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Page Header */}
        <div className="text-center max-w-2xl mx-auto mb-6">
          <span className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold uppercase tracking-widest shadow-2xs">
            Franchise Directory
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
            HaruViru Celebration House Branches
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Select your preferred location to view available time slots and book your private event.
          </p>
        </div>

        {/* Real-time Searchable Branch List */}
        <BranchesSearchClient initialBranches={branches} initialQuery={query} />

      </div>
    </main>
  );
}
