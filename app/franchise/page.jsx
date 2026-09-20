import FranchiseFormClient from "./FranchiseFormClient";

export const metadata = {
  title: "Own a Franchise | HaruViru Celebration House",
  description: "Join India's fastest growing private celebration house brand. High returns, complete setup support, and brand recognition.",
};

export default function FranchisePage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen py-16 px-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-5xl relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 text-xs font-bold uppercase tracking-wider">
            Franchise Opportunity
          </span>
          <h1 className="text-4xl sm:text-6xl font-black text-gray-900 dark:text-white tracking-tight mt-3">
            Build a High-Profit Celebration House Business
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-300">
            Private celebration arenas are booming. Partner with HaruViru to launch a profitable franchise in your city.
          </p>
        </div>

        {/* Benefits Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-3xl mb-3">📈</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">High ROI & Fast Payback</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Low operational overheads with 3 to 4 slot bookings per day generating sustainable monthly cash flows.
            </p>
          </div>

          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-3xl mb-3">🛠️</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Turnkey Setup Assistance</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              From room acoustics and 4K theater installation to custom lighting and decor themes, we guide every detail.
            </p>
          </div>

          <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="text-3xl mb-3">📱</div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">Tech & Marketing Engine</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
              Get listed on the HaruViru web platform with automatic online slot bookings, manager app, and digital marketing support.
            </p>
          </div>
        </div>

        {/* Application Form Container */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-3xl border border-gray-200 dark:border-gray-800 p-8 sm:p-12 shadow-xl max-w-3xl mx-auto">
          <h2 className="text-2xl font-black text-gray-900 dark:text-white text-center">
            Franchise Application Form
          </h2>
          <p className="text-xs text-gray-500 text-center mt-1 mb-8">
            Submit your details below and our franchise expansion team will reach out within 24 hours.
          </p>

          <FranchiseFormClient />
        </div>

      </div>
    </main>
  );
}
