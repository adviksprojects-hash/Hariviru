import Link from "next/link";
import Image from "next/image";
import { db } from "@/lib/prisma";

export const metadata = {
  title: "HaruViru Celebration House | Premium Private Celebration Arenas",
  description: "Book luxurious private celebration houses for birthdays, anniversaries, proposal surprises, movie dates, and family gatherings across India.",
  openGraph: {
    title: "HaruViru Celebration House",
    description: "Unforgettable Private Celebration Spaces with 4K Theater, Ambient Lights, and Custom Decor.",
    url: "https://haruviru.com",
    siteName: "HaruViru",
  },
};

export default async function Home() {
  // Fetch active branches for home showcase
  const branches = await db.branch.findMany({
    where: { isActive: true },
    take: 6,
  });

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950">
      
      {/* Hero Section */}
      <section className="relative overflow-hidden py-20 lg:py-28 px-4">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute top-60 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="container mx-auto max-w-6xl text-center relative z-10">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950/80 dark:text-rose-300 text-xs sm:text-sm font-semibold mb-6 shadow-xs">
            ✨ India's Most Loved Private Celebration Destination
          </div>

          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black text-gray-900 dark:text-white tracking-tight leading-tight max-w-4xl mx-auto">
            Celebrate Memories in <br />
            <span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 via-amber-600 to-rose-500">
              Your Private Paradise
            </span>
          </h1>

          <p className="mt-6 text-lg sm:text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto font-normal">
            Private 4K Screening, Fairy Lights, Custom Decor Themes, Karaoke, & Gourmet Treats. Perfect for Birthdays, Anniversaries & Surprise Dates.
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/branches"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-lg shadow-xl shadow-rose-500/20 transform hover:-translate-y-0.5 transition-all text-center"
            >
              Explore All Branches & Book
            </Link>
            <Link
              href="/franchise"
              className="w-full sm:w-auto px-8 py-4 rounded-full bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 font-semibold text-lg shadow-sm hover:bg-gray-50 transition-colors text-center"
            >
              Own a Franchise 🚀
            </Link>
          </div>

          {/* Quick Stats Banner */}
          <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-lg max-w-4xl mx-auto">
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
              <div className="text-xs sm:text-sm text-gray-500 dark:text-gray-400 font-medium">Prime City Branches</div>
            </div>
          </div>

        </div>
      </section>

      {/* Featured Branches Showcase */}
      <section className="py-16 px-4 bg-white dark:bg-gray-950 border-y border-gray-100 dark:border-gray-800">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-12">
            <div>
              <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
                Our Popular Celebration Houses
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
              <div
                key={branch.id}
                className="group rounded-3xl bg-gray-50 dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col"
              >
                <div className="relative h-56 w-full overflow-hidden bg-gray-200">
                  <img
                    src={branch.images?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"}
                    alt={branch.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                  <div className="absolute top-3 left-3 bg-black/60 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-semibold">
                    📍 {branch.city}
                  </div>
                </div>

                <div className="p-6 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {branch.name}
                    </h3>
                    <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                      {branch.description}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-1.5">
                      {branch.amenities.slice(0, 3).map((amenity, idx) => (
                        <span key={idx} className="px-2.5 py-1 rounded-md bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-medium text-gray-700 dark:text-gray-300">
                          ✓ {amenity}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
                    <div>
                      <span className="text-xs text-gray-500 block">Starting from</span>
                      <span className="text-xl font-black text-rose-600">₹{branch.pricePerSlot}</span>
                      <span className="text-xs text-gray-500"> / slot</span>
                    </div>

                    <Link
                      href={`/branches/${branch.slug}`}
                      className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-semibold text-sm hover:opacity-90 transition-opacity"
                    >
                      Book Slot
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose HaruViru Section */}
      <section className="py-20 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto mb-16">
            <h2 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight">
              Why Celebrate at HaruViru?
            </h2>
            <p className="mt-3 text-gray-600 dark:text-gray-400">
              We provide a complete end-to-end private event experience designed to make your special moments unforgettable.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-rose-100 text-rose-600 dark:bg-rose-950 dark:text-rose-400 flex items-center justify-center text-3xl mx-auto mb-6">
                🎬
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">4K Private Theater</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Giant 4K screen with immersive Dolby audio for your personal movies, photo slideshows, or OTT streaming.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400 flex items-center justify-center text-3xl mx-auto mb-6">
                🎈
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">Custom Theme Decor</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Balloons, fairy light canopies, LED neon signs, and personalized name boards included for every celebration.
              </p>
            </div>

            <div className="p-8 rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm text-center">
              <div className="w-16 h-16 rounded-2xl bg-indigo-100 text-indigo-600 dark:bg-indigo-950 dark:text-indigo-400 flex items-center justify-center text-3xl mx-auto mb-6">
                🔒
              </div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white">100% Private & Safe</h3>
              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                Complete privacy for you and your loved ones with sanitized rooms, dedicated hosts, and secure booking.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Franchise CTA Banner */}
      <section className="py-16 px-4 bg-linear-to-r from-rose-600 to-amber-600 text-white">
        <div className="container mx-auto max-w-5xl text-center">
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight">
            Partner with HaruViru Celebration House
          </h2>
          <p className="mt-4 text-lg text-rose-100 max-w-2xl mx-auto">
            Become a franchise owner of India's fastest-growing private celebration brand. High ROI and full operational support.
          </p>
          <div className="mt-8">
            <Link
              href="/franchise"
              className="inline-block px-8 py-4 rounded-full bg-white text-rose-600 hover:bg-rose-50 font-bold text-lg shadow-xl transition-all"
            >
              Apply for Franchise Opportunity →
            </Link>
          </div>
        </div>
      </section>

    </main>
  );
}
