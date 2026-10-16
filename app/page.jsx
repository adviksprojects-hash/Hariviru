import Link from "next/link";
import { db } from "@/lib/prisma";
import { getGlobalPackages, getGlobalAddOns } from "@/lib/actions";
import InteractiveHeroConfetti from "@/components/HomeComponents/InteractiveHeroConfetti";
import WhatWeOffer from "@/components/HomeComponents/WhatWeOffer";
import PackageShowcase from "@/components/PackageComponents/PackageShowcase";
import WhyChooseUs from "@/components/HomeComponents/WhyChooseUs";
import BranchCard from "@/components/BranchComponents/BranchCard";

// Enable Incremental Static Regeneration (ISR) - Page renders in ~10ms from cache
export const revalidate = 60;

export const metadata = {
  title: "HaruViru Celebration House | Private Mini Theater & Party Place in Pune & Maharashtra",
  description:
    "Book 1hr private celebration packages in Pune, Shikrapur, Wagholi, Shirur, Baramati, Solapur, Pandharpur & Rajgurunagar. Private 4K Theater, Dolby Sound, Custom Birthday & Anniversary Balloon Decor, Cake & Surprises.",
  keywords: [
    "Celebration House",
    "Celebration House Pune",
    "Celebration House Wagholi",
    "Celebration House Shikrapur",
    "Celebration House Shirur",
    "Celebration House Baramati",
    "Celebration House Solapur",
    "Celebration House Pandharpur",
    "Celebration House Rajgurunagar",
    "Celebration House near me",
    "Private Theater Pune",
    "Private mini theater for birthday",
    "Anniversary celebration place in Pune",
    "Private celebration hall for couples",
    "1 hour private celebration space",
    "HaruViru Celebration House",
  ],
  alternates: {
    canonical: "https://haruviru.com",
  },
  openGraph: {
    title: "HaruViru Celebration House | Private Mini Theaters & Celebration Lounges",
    description:
      "Unforgettable Private Celebration Spaces with 4K Theater, Ambient Lights, Custom Decor & Cake. Branches in Pune, Wagholi, Shikrapur, Solapur, Baramati and more.",
    url: "https://haruviru.com",
    siteName: "HaruViru Celebration House",
    locale: "en_IN",
    type: "website",
    images: [
      {
        url: "/icons/icon-512x512.png",
        width: 512,
        height: 512,
        alt: "HaruViru Celebration House",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "HaruViru Celebration House | Private Mini Theater & Party Place",
    description: "Book 1hr private celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations.",
    images: ["/icons/icon-512x512.png"],
  },
};

export default async function Home() {
  // Parallel fetch to eliminate waterfalls and load in lightning speed
  let branches = [];
  let globalPackages = [];
  let globalAddOns = [];

  try {
    const [fetchedBranches, pkgsRes, addOnsRes] = await Promise.all([
      db.branch.findMany({
        where: { isActive: true },
        take: 6,
        orderBy: { createdAt: "desc" },
      }),
      getGlobalPackages(),
      getGlobalAddOns(),
    ]);

    branches = fetchedBranches || [];
    globalPackages = pkgsRes?.packages || [];
    globalAddOns = addOnsRes?.addOns || [];
  } catch (err) {
    console.error("[Home Page Parallel Fetch Error]:", err);
  }

  // Schema.org Structured Data for Google Search & AI Search Engines
  const websiteSchema = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebSite",
        "@id": "https://haruviru.com/#website",
        "url": "https://haruviru.com",
        "name": "HaruViru Celebration House",
        "description": "India's premier private celebration arena & mini-theater booking network.",
        "potentialAction": {
          "@type": "SearchAction",
          "target": "https://haruviru.com/branches?q={search_term_string}",
          "query-input": "required name=search_term_string",
        },
      },
      {
        "@type": "Organization",
        "@id": "https://haruviru.com/#organization",
        "name": "HaruViru Celebration House",
        "url": "https://haruviru.com",
        "logo": "https://haruviru.com/icons/icon-512x512.png",
        "contactPoint": {
          "@type": "ContactPoint",
          "telephone": "+91-9762486649",
          "contactType": "customer service",
          "areaServed": "IN",
          "availableLanguage": ["English", "Hindi", "Marathi"],
        },
      },
      {
        "@type": "FAQPage",
        "mainEntity": [
          {
            "@type": "Question",
            "name": "What is HaruViru Celebration House?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "HaruViru Celebration House offers private 1-hour air-conditioned celebration spaces equipped with 4K theater screens, Dolby surround sound, custom balloon and floral decor, personalized cakes, fog and cold fire entries for birthdays, anniversaries, and romantic dates.",
            },
          },
          {
            "@type": "Question",
            "name": "Where are HaruViru Celebration House branches located?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "HaruViru has active branches across Maharashtra including Pune (Shikrapur, Wagholi, Shirur, Rajgurunagar), Baramati, Solapur, Pandharpur, Madha, and Shrigonda with 24-hour celebration slots.",
            },
          },
          {
            "@type": "Question",
            "name": "How can I book a celebration slot at HaruViru?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "You can select your preferred branch on haruviru.com, pick an available 1-hour time slot, choose custom decoration packages and add-ons, and confirm online instantly with UPI or QR payment.",
            },
          },
          {
            "@type": "Question",
            "name": "What are the celebration package prices?",
            "acceptedAnswer": {
              "@type": "Answer",
              "text": "Packages start from ₹1,499 per hour including private mini-theater access, ambient lighting, music setup, and basic decorations, with premium packages including photo shoots, cakes, and special entries.",
            },
          },
        ],
      },
    ],
  };

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      {/* Structured Data for SEO & Open AI / Perplexity / Google Search */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />

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
      <PackageShowcase packages={globalPackages} addOns={globalAddOns} />

      {/* 3. Why Choose Us Section */}
      <WhyChooseUs />

      {/* 4. Featured Branches Showcase (Shows Popular Branches with View All CTA) */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950 border-t border-gray-100 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <span className="px-3.5 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
                Franchise Directory
              </span>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
                HaruViru Celebration House Branches
              </h2>
              <p className="mt-2 text-gray-600 dark:text-gray-400">
                Choose from our luxury styled branches equipped with private screening and premium setups.
              </p>
            </div>
            <Link
              href="/branches"
              className="mt-4 md:mt-0 font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1 text-sm bg-rose-50 dark:bg-rose-950/50 px-4 py-2 rounded-full border border-rose-200 dark:border-rose-900/50 transition-colors"
            >
              View All Branches →
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {branches.map((branch) => (
              <BranchCard key={branch.id} branch={branch} />
            ))}
          </div>

          {/* Prominent Bottom View All Branches Button */}
          <div className="mt-12 text-center">
            <Link
              href="/branches"
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-500/20 transform hover:-translate-y-0.5 transition-all"
            >
              <span>Explore All Celebration Branches ({branches.length}+ Locations)</span>
              <span>→</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
