import Link from "next/link";

export const metadata = {
  title: "About Us | HaruViru Celebration House",
  description: "Learn about HaruViru Celebration House - India's leading private event space provider.",
};

export default function AboutUsPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Our Story</span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            Redefining How India Celebrates
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            HaruViru Celebration House was born with a single mission: to create intimate, ultra-private, and luxurious celebration arenas for life's most precious milestones.
          </p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-3xl p-8 sm:p-12 border border-gray-200 dark:border-gray-800 shadow-sm space-y-8">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">What We Do</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
              Whether it’s a surprise birthday for your best friend, a romantic anniversary movie date, a baby shower, or a corporate milestone, public venues often lack complete privacy and customization. HaruViru provides fully dedicated private houses equipped with giant 4K screening, high-fidelity audio, custom themed balloon decor, and dedicated hosts.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-gray-100 dark:border-gray-800">
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">✨ Premium Hospitality</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Every booking comes with sanitized spaces, temperature control, and full assistance for cake cutting and surprises.
              </p>
            </div>
            <div>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">🚀 Nationwide Presence</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Rapidly expanding across major metropolitan centers including Hyderabad, Bengaluru, and tier-1 cities.
              </p>
            </div>
          </div>

          <div className="pt-8 border-t border-gray-100 dark:border-gray-800 text-center">
            <Link
              href="/branches"
              className="inline-block px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-base shadow-md"
            >
              Find a Celebration House Near You →
            </Link>
          </div>
        </div>

      </div>
    </main>
  );
}
