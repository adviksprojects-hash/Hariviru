import Link from "next/link";

export const metadata = {
  title: "Terms & Conditions | HaruViru Celebration House",
  description: "Terms and conditions for booking private halls at HaruViru Celebration House.",
};

export default function TermsPage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen pt-6 pb-16 px-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Legal Agreement</span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            Terms & Conditions
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last Updated: October 2026 • HaruViru Celebration House
          </p>
        </div>

        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-sm space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Booking & Reservation Policy</h2>
            <p>
              All reservations for HaruViru Celebration House private halls and screening theaters must be made through our official website or authorized branch managers. A booking is confirmed once the advance deposit or full payment is verified and a unique Booking Reference Number is generated.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Timing & Punctuality</h2>
            <p>
              Each private celebration booking is allotted a dedicated 1-hour or multi-hour time slot. Guests are requested to arrive 10 minutes prior to the scheduled slot time to ensure maximum enjoyment. Slot extensions depend strictly on subsequent availability.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. Cancellation & Rescheduling</h2>
            <p>
              Cancellations or slot rescheduling requests must be submitted at least 24 hours prior to the scheduled event time by contacting the branch manager. Advance booking tokens are non-refundable for last-minute no-shows.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. Code of Conduct & Safety</h2>
            <p>
              Guests must treat venue property, 4K theater equipment, sound setups, and decor with care. Any intentional damage to property or illegal substances on premises are strictly prohibited.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Contact Information</h2>
            <p>
              For queries or clarifications regarding these Terms, please contact <strong>HaruViru Celebration House</strong> at <strong>+91 9762486649</strong>, visit <a href="https://haruvirucelebrationhouse.in" className="text-rose-500 hover:underline">https://haruvirucelebrationhouse.in</a>, or email our support desk.
            </p>
          </section>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs">
            <Link href="/" className="text-rose-500 hover:underline font-semibold">
              ← Return to Home
            </Link>
            <Link href="/privacy-policy" className="text-rose-500 hover:underline font-semibold">
              Privacy Policy →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
