import Link from "next/link";
import { contactInfo } from "@/data/PackageData/PackageData";

export const metadata = {
  title: "Contact Us | HaruViru Celebration House",
  description: "Get in touch with HaruViru Celebration House team for bookings, inquiries, and customer support.",
};

export default function ContactPage() {
  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen py-16 px-4 relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-4xl relative z-10">
        
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-widest text-rose-600">Get In Touch</span>
          <h1 className="text-4xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-1">
            Contact HaruViru Team
          </h1>
          <p className="mt-3 text-gray-600 dark:text-gray-400 max-w-xl mx-auto">
            Have a question about a booking, custom decor, or special surprise requests? We are here to help.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          
          {/* Customer Support Phone */}
          <a
            href={`tel:${contactInfo.phone}`}
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center hover:border-rose-500 transition-colors shadow-xs group"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <img src="/icons/phone.png" alt="Phone Icon" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Customer Support</h3>
            <p className="text-sm font-bold text-rose-600 mt-1">+91 {contactInfo.phone}</p>
            <p className="text-xs text-gray-400 mt-0.5">Mon - Sun (9 AM - 10 PM)</p>
          </a>

          {/* WhatsApp Direct Chat */}
          <a
            href={`https://wa.me/91${contactInfo.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center hover:border-emerald-500 transition-colors shadow-xs group"
          >
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <img src="/icons/whatsapp.png" alt="WhatsApp Icon" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">WhatsApp Chat</h3>
            <p className="text-sm font-bold text-emerald-600 mt-1">+91 {contactInfo.whatsapp}</p>
            <p className="text-xs text-gray-400 mt-0.5">Instant WhatsApp Assistance</p>
          </a>

          {/* Headquarters Location: Shikrapur Pune */}
          <a
            href={contactInfo.hqMapUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-6 rounded-3xl border border-gray-200 dark:border-gray-800 text-center hover:border-rose-500 transition-colors shadow-xs group"
          >
            <div className="w-14 h-14 rounded-2xl bg-rose-50 dark:bg-rose-950 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <img src="/icons/map.png" alt="Map Pin Icon" className="w-8 h-8 object-contain group-hover:scale-110 transition-transform" />
            </div>
            <h3 className="font-bold text-gray-900 dark:text-white">Headquarters</h3>
            <p className="text-sm font-bold text-rose-600 mt-1">Shikrapur, Pune</p>
            <p className="text-xs text-gray-400 mt-0.5">Click for Google Maps Directions 📍</p>
          </a>

        </div>

      </div>
    </main>
  );
}
