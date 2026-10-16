import { db } from "@/lib/prisma";
import { getGlobalPackages } from "@/lib/actions";
import BranchesSearchClient from "@/components/BranchComponents/BranchesSearchClient";

// Enable ISR: caches page for 60s so users get instant load speeds
export const revalidate = 60;

export const metadata = {
  title: "All Celebration House Branches in Pune & Maharashtra | HaruViru",
  description:
    "Find HaruViru private celebration house branches near you in Pune, Shikrapur, Wagholi, Shirur, Baramati, Solapur, Pandharpur, Rajgurunagar & Madha. Book 1hr private mini-theater rooms with 4K screens & custom decor.",
  keywords: [
    "Celebration House Pune",
    "Celebration House branches",
    "Celebration House near me",
    "Celebration House Shikrapur",
    "Celebration House Wagholi",
    "Celebration House Shirur",
    "Celebration House Baramati",
    "Celebration House Solapur",
    "Celebration House Pandharpur",
    "Celebration House Rajgurunagar",
    "Private Theater Pune",
    "Private celebration rooms Pune",
    "HaruViru branches",
  ],
  alternates: {
    canonical: "https://haruviru.com/branches",
  },
  openGraph: {
    title: "All HaruViru Celebration House Branches in Maharashtra",
    description:
      "Explore and book private celebration houses in Pune, Wagholi, Shikrapur, Solapur, Baramati and more with instant slot confirmation.",
    url: "https://haruviru.com/branches",
    siteName: "HaruViru Celebration House",
    locale: "en_IN",
    type: "website",
    images: [{ url: "/icons/icon-512x512.png", width: 512, height: 512, alt: "HaruViru Branches" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Explore HaruViru Celebration House Branches",
    description: "Find private 1hr celebration mini-theaters near you across Maharashtra.",
    images: ["/icons/icon-512x512.png"],
  },
};

export default async function BranchesPage({ searchParams }) {
  const query = (await searchParams)?.q || "";

  // Parallel fetch to eliminate waterfalls
  let globalPackages = [];
  let rawBranches = [];

  try {
    const [pkgRes, branchesRes] = await Promise.all([
      getGlobalPackages(),
      db.branch.findMany({
        where: { isActive: true },
        include: {
          packages: { where: { isActive: true }, orderBy: { createdAt: "asc" } },
          slots: { where: { isActive: true } },
        },
        orderBy: { createdAt: "desc" },
      }),
    ]);

    globalPackages = pkgRes?.packages || [];
    rawBranches = branchesRes || [];
  } catch (err) {
    console.error("[Branches Page Parallel Fetch Error]:", err);
  }

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

  // Schema.org ItemList & Breadcrumbs for Google Local Search
  const branchListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "name": "HaruViru Celebration House Branches",
    "description": "List of private 1hr celebration houses & mini-theater branches.",
    "numberOfItems": branches.length,
    "itemListElement": branches.map((b, idx) => ({
      "@type": "ListItem",
      "position": idx + 1,
      "item": {
        "@type": "LocalBusiness",
        "name": b.name,
        "url": `https://haruviru.com/branches/${b.slug}`,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": b.address,
          "addressLocality": b.city,
          "addressRegion": b.state || "Maharashtra",
          "addressCountry": "IN",
        },
        "telephone": b.phone || "+91 97624 86649",
        "priceRange": "₹1499 - ₹4999",
      },
    })),
  };

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen pt-4 pb-12 px-4 relative overflow-hidden">
      {/* Structured Data for SEO & AI search engines */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(branchListSchema) }}
      />

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
