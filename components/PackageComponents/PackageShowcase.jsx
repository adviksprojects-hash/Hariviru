import Link from "next/link";
import { celebrationPackages, packageAddOns } from "@/data/PackageData/PackageData";

export default function PackageShowcase({ selectedBranchSlug }) {
  return (
    <section className="py-16 px-4 bg-gray-50/50 dark:bg-gray-900/40">
      <div className="container mx-auto max-w-6xl">
        
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="px-4 py-1.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold uppercase tracking-widest">
            1hr Celebration Packages
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-3">
            Make Your Special Day Unforgettable
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Applicable across all HaruViru franchise branches. Choose the perfect celebration experience tailored for you.
          </p>
        </div>

        {/* 3 Package Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {celebrationPackages.map((pkg) => (
            <div
              key={pkg.id}
              className={`relative bg-white dark:bg-gray-900 rounded-3xl p-8 border flex flex-col justify-between transition-all duration-300 ${
                pkg.popular
                  ? "border-rose-500 ring-2 ring-rose-500/50 shadow-xl shadow-rose-500/10 scale-102"
                  : "border-gray-200 dark:border-gray-800 shadow-sm hover:shadow-lg"
              }`}
            >
              {pkg.popular && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-xs uppercase tracking-wider shadow-md">
                  ★ Most Popular
                </div>
              )}

              <div>
                <div className="inline-block px-3 py-1 rounded-lg bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300 mb-2">
                  {pkg.badge} ({pkg.duration})
                </div>
                
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">{pkg.name}</h3>
                <p className="text-xs text-rose-600 font-semibold mt-0.5">👥 {pkg.forWho}</p>

                {/* Price Display */}
                <div className="mt-6 flex items-baseline gap-2">
                  <span className="text-4xl font-black text-gray-900 dark:text-white">₹{pkg.offerPrice}</span>
                  <span className="text-base text-gray-400 line-through">₹{pkg.originalPrice}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                    SPECIAL OFFER
                  </span>
                </div>

                {/* Inclusions List */}
                <div className="mt-6 space-y-2.5">
                  <div className="text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">Package Inclusions:</div>
                  {pkg.inclusions.map((item, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 font-medium">
                      <span className="text-rose-500 font-bold">✓</span>
                      <span>{item}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-gray-100 dark:border-gray-800">
                <Link
                  href={selectedBranchSlug ? `/book/${selectedBranchSlug}` : "/branches"}
                  className={`w-full block py-3.5 rounded-2xl text-center font-bold text-sm shadow-md transition-all ${
                    pkg.popular
                      ? "bg-linear-to-r from-rose-600 to-amber-600 text-white hover:opacity-90"
                      : "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90"
                  }`}
                >
                  Book {pkg.badge} →
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Available Add-Ons Banner */}
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-white">✨ Celebration Add-Ons</h4>
            <p className="text-xs text-gray-500 mt-1">Enhance any celebration package with custom add-on services.</p>
          </div>

          <div className="flex flex-wrap gap-4">
            {packageAddOns.map((addon) => (
              <div key={addon.id} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 flex items-center gap-3">
                <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{addon.name}</span>
                <span className="text-xs font-black px-2 py-1 rounded bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300">
                  +₹{addon.price}
                </span>
              </div>
            ))}
          </div>
        </div>

      </div>
    </section>
  );
}
