import Link from "next/link";
import { db } from "@/lib/prisma";
import InteractiveHeroConfetti from "@/components/HomeComponents/InteractiveHeroConfetti";
import WhatWeOffer from "@/components/HomeComponents/WhatWeOffer";
import PackageShowcase from "@/components/PackageComponents/PackageShowcase";
import WhyChooseUs from "@/components/HomeComponents/WhyChooseUs";
import BranchCard from "@/components/BranchComponents/BranchCard";

export const metadata = {
  title: "HaruViru Celebration House | Premium 1hr Private Celebration Arenas",
  description: "Book 1hr private celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations across all HaruViru franchise branches.",
  openGraph: {
    title: "HaruViru Celebration House",
    description: "Unforgettable Private Celebration Spaces with 4K Theater, Ambient Lights, and Custom Decor.",
    url: "https://haruviru.com",
    siteName: "HaruViru",
  },
};

export default async function Home() {
  const branches = await db.branch.findMany({
    where: { isActive: true },
    take: 6,
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      
      {/* Interactive Hero Section with Party Popper Confetti Squares & Coiling Streamers Canvas */}
      <InteractiveHeroConfetti>
        <section className="relative overflow-hidden pt-6 pb-12 lg:pt-8 lg:pb-16 px-4">
          <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
          <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

          <div className="container mx-auto max-w-6xl text-center relative z-10">
            
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs sm:text-sm font-bold mb-4 shadow-xs">
              ✨ India's Most Loved Private Celebration Destination
            </div>

            <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
              Celebrate Special Moments in <br />
              <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 via-amber-600 to-rose-500">
                Your Private Paradise
              </span>
            </h1>

            <p className="mt-4 text-base sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal">
              Private AC Hall, 4K Screening, Bubble & Smoke Entries, Dolby Audio, Custom Decor & Cake. Packages starting from ₹1,499.
            </p>

            <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/branches"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-lg shadow-xl shadow-rose-500/20 transform hover:-translate-y-0.5 transition-all text-center"
              >
                Explore Branches & Book
              </Link>
              <Link
                href="/franchise"
                className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold text-lg shadow-sm hover:bg-gray-50 transition-colors text-center"
              >
                Own a Franchise 🚀
              </Link>
            </div>

            {/* Quick Stats Banner */}
            <div className="mt-12 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-lg max-w-4xl mx-auto">
              <div>
                <div className="text-3xl font-black text-rose-600">50,000+</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Happy Celebrations</div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-600">4.9 ★</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Customer Rating</div>
              </div>
              <div>
                <div className="text-3xl font-black text-rose-600">100%</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Private & Safe</div>
              </div>
              <div>
                <div className="text-3xl font-black text-amber-600">Multiple</div>
                <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Franchise Locations</div>
              </div>
            </div>

          </div>
        </section>
      </InteractiveHeroConfetti>

      {/* 1. What We Offer Section */}
      <WhatWeOffer />

      {/* 2. Celebration Packages Showcase Section */}
      <PackageShowcase />

      {/* 3. Why Choose Us Section */}
      <WhyChooseUs />

      {/* 4. Featured Branches Showcase using shared BranchCard */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Our Popular Celebration House Franchises
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose from our luxury styled branches equipped with private screening and premium setups.
              </p>
            </div>
            <Link
              href="/branches"
              className="mt-4 md:mt-0 font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1"
            >
              View All Branches →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}
