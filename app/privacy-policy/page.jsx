import Link from "next/link";

export const metadata = {
  title: "Privacy Policy | HaruViru Celebration House",
  description: "Privacy Policy and WhatsApp Messaging Terms for HaruViru Celebration House.",
};

export default function PrivacyPolicyPage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen pt-6 pb-16 px-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Legal & Transparency</span>
          <h1 className="text-3xl sm:text-4xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
            Last Updated: October 2026 • HaruViru Celebration House
          </p>
        </div>

        <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl p-6 sm:p-10 border border-gray-200 dark:border-gray-800 shadow-sm space-y-8 text-gray-700 dark:text-gray-300 text-sm leading-relaxed">
          
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">1. Introduction</h2>
            <p>
              Welcome to <strong>HaruViru Celebration House</strong> ("we," "our," or "us"). We are committed to protecting your personal information and your right to privacy. This Privacy Policy outlines how we collect, use, store, and disclose your personal details when you visit our website (<strong>haruvirucelebrationhouse.in</strong>), book our private celebration halls, or interact with our automated WhatsApp notification service.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">2. Information We Collect</h2>
            <p className="mb-2">When you book a private celebration hall or contact our branches, we may collect the following information:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li><strong>Contact Information:</strong> Name, phone number, and email address.</li>
              <li><strong>Booking Details:</strong> Selected branch location, celebration date, time slot, hall selection, celebration package, and special theme/cake requests.</li>
              <li><strong>Payment & Transaction Information:</strong> UPI transaction reference number (UTR), payment status, and deposit amounts. We do not store sensitive credit card or banking PINs.</li>
              <li><strong>Event Information:</strong> Type of celebration (e.g. Birthday, Anniversary, Proposal) and anniversary/birth dates for reminder services.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">3. How We Use Your Information</h2>
            <p className="mb-2">We use the collected information for purposes including:</p>
            <ul className="list-disc pl-5 space-y-1">
              <li>Processing and confirming your private hall bookings.</li>
              <li>Sending automatic booking confirmations, venue directions, and manager alerts via the Meta WhatsApp Business Cloud API.</li>
              <li>Providing customer support and coordinating custom celebrations.</li>
              <li>Sending anniversary or birthday re-booking privileges and exclusive festival discounts (you may opt-out at any time).</li>
              <li>Maintaining safety, security, and internal audit records across franchise branches.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">4. WhatsApp Business Cloud API Communications</h2>
            <p>
              By providing your phone number during the booking or inquiry process, you consent to receive transactional and operational messages (such as booking approval, manager alerts, and celebration reminders) via WhatsApp.
            </p>
            <p className="mt-2">
              We comply with Meta’s WhatsApp Business Messaging Policies. You can opt out of marketing messages at any time by replying <strong>"STOP"</strong> or contacting our support team.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">5. Data Sharing & Third-Party Services</h2>
            <p>
              We do not sell, rent, or trade your personal data to third parties. We only share necessary information with trusted service providers to run our operations:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li><strong>Meta Platforms, Inc. (WhatsApp Cloud API):</strong> For delivering booking confirmations and alerts.</li>
              <li><strong>Authentication & Database Providers:</strong> Secure cloud infrastructure (Clerk, Neon PostgreSQL) with end-to-end encryption.</li>
              <li><strong>Authorized Branch Managers:</strong> For facilitating your event on the day of your celebration.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">6. Data Security & Retention</h2>
            <p>
              We implement industry-standard encryption and technical safeguards to protect your personal information against unauthorized access, loss, or misuse. Data is retained only as long as necessary to fulfill the booking requirements and comply with applicable legal regulations.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">7. Your Rights & Choices</h2>
            <p>
              You have the right to access, update, or request the deletion of your personal data stored with us. To make such a request, please reach out via our contact channels below.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-2">8. Contact Us</h2>
            <p>If you have any questions or concerns regarding this Privacy Policy, please contact us at:</p>
            <div className="mt-3 p-4 bg-gray-50 dark:bg-gray-800/60 rounded-2xl border border-gray-200 dark:border-gray-700 space-y-1 text-xs">
              <p><strong>HaruViru Celebration House</strong></p>
              <p>📍 Headquarters: Shikrapur, Pune, Maharashtra 412208, India</p>
              <p>📞 Phone / WhatsApp: +91 9762486649</p>
              <p>🌐 Website: <a href="https://haruvirucelebrationhouse.in" className="text-rose-500 hover:underline">https://haruvirucelebrationhouse.in</a></p>
            </div>
          </section>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex justify-between items-center text-xs">
            <Link href="/" className="text-rose-500 hover:underline font-semibold">
              ← Return to Home
            </Link>
            <Link href="/terms" className="text-rose-500 hover:underline font-semibold">
              Terms & Conditions →
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}
