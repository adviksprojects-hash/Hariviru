import Link from "next/link";

export const metadata = {
  title: "Contact Us | HaruViru Celebration House",
  description: "Get in touch with HaruViru Celebration House team for bookings, inquiries, and customer support.",
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 py-16 px-4">
      <div className="container mx-auto max-w-4xl">
        
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight">
            Contact HaruViru Team
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Have a question about a booking, custom decor, or special surprise requests? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="text-3xl mb-2">📞</div>
            <h3 className="font-bold text-gray-900 dark:text-white">Customer Support</h3>
            <p className="text-xs text-gray-500 mt-1">+91 98765 43210</p>
            <p className="text-xs text-gray-400">Mon - Sun (9 AM - 10 PM)</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="text-3xl mb-2">✉️</div>
            <h3 className="font-bold text-gray-900 dark:text-white">Email Us</h3>
            <p className="text-xs text-gray-500 mt-1">support@haruviru.com</p>
            <p className="text-xs text-gray-400">Response within 2 hours</p>
          </div>

          <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center">
            <div className="text-3xl mb-2">🏢</div>
            <h3 className="font-bold text-gray-900 dark:text-white">Headquarters</h3>
            <p className="text-xs text-gray-500 mt-1">Jubilee Hills, Road 36</p>
            <p className="text-xs text-gray-400">Hyderabad, Telangana</p>
          </div>
        </div>

      </div>
    </main>
  );
}
