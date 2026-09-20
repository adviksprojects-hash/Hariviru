import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import PackageShowcase from "@/components/PackageComponents/PackageShowcase";

export async function generateMetadata({ params }) {
  const slug = (await params).slug;
  const branch = await db.branch.findUnique({ where: { slug } });

  if (!branch) return { title: "Branch Not Found | HaruViru" };

  return {
    title: `${branch.name} | HaruViru Celebration House`,
    description: `Book 1hr private celebration packages at ${branch.name}, ${branch.city}. Equipped with 4K theater, theme decor, and lounge.`,
  };
}

export default async function BranchDetailPage({ params }) {
  const slug = (await params).slug;

  const branch = await db.branch.findUnique({
    where: { slug },
    include: {
      slots: {
        where: { isActive: true },
        orderBy: { startTime: "asc" },
      },
    },
  });

  if (!branch || !branch.isActive) {
    notFound();
  }

  const mapUrl = branch.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(branch.address + " " + branch.city)}`;
  const instagram = branch.instagramHandle || "celebration_house_23";
  const whatsapp = branch.whatsapp || branch.phone?.replace(/[^0-9]/g, "") || "9762486649";
  const phone = branch.phone || "+91 97624 86649";
  const mapEmbedUrl = `https://maps.google.com/maps?q=${encodeURIComponent(branch.address + " " + branch.city)}&t=&z=14&ie=UTF8&iwloc=&output=embed`;

  return (
    <main className="flex-1 bg-gradient-to-b from-amber-50/40 via-white to-rose-50/30 dark:from-gray-950 dark:via-gray-900 dark:to-gray-950 min-h-screen py-12 px-4 relative overflow-hidden">
      
      {/* Background Ambient Glows */}
      <div className="absolute -top-40 -right-40 w-96 h-96 bg-rose-400/20 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute top-40 -left-40 w-96 h-96 bg-amber-400/20 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-5xl relative z-10">
        
        {/* Back Link */}
        <Link href="/branches" className="inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600 hover:underline mb-6">
          ← Back to All Branches
        </Link>

        {/* Branch Title & Contact Action Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              📍 {branch.city}, {branch.state}
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
              {branch.name}
            </h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              📍 {branch.address}
            </p>

            {/* Real Icon Contact & Location Badges */}
            <div className="mt-4 flex flex-wrap gap-2.5 text-xs font-bold">
              {/* Google Map Icon Link */}
              <a
                href={mapUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-rose-100 hover:text-rose-800 transition-colors flex items-center gap-2"
              >
                <img src="/icons/map.png" alt="Google Map" className="w-4 h-4 object-contain" />
                <span>Google Maps Location</span>
              </a>

              {/* WhatsApp Chat Icon Link */}
              <a
                href={`https://wa.me/91${whatsapp}?text=Hi%20${encodeURIComponent(branch.name)}%2C%20I%20want%20to%20book%20a%20celebration.`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 hover:bg-emerald-200 transition-colors flex items-center gap-2"
              >
                <img src="/icons/whatsapp.png" alt="WhatsApp" className="w-5 h-5 object-contain" />
                <span>WhatsApp Chat</span>
              </a>

              {/* Phone Call Icon Link */}
              <a
                href={`tel:${phone}`}
                className="px-3.5 py-2 rounded-xl bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 hover:bg-blue-200 transition-colors flex items-center gap-2"
              >
                <img src="/icons/phone.png" alt="Phone" className="w-4 h-4 object-contain" />
                <span>Call {phone}</span>
              </a>

              {/* Instagram Profile Icon Link */}
              <a
                href={`https://instagram.com/${instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3.5 py-2 rounded-xl bg-pink-100 text-pink-800 dark:bg-pink-950 dark:text-pink-300 hover:bg-pink-200 transition-colors flex items-center gap-2"
              >
                <img src="/icons/instagram.png" alt="Instagram" className="w-4 h-4 object-contain" />
                <span>@{instagram}</span>
              </a>
            </div>
          </div>

          <Link
            href={`/book/${branch.slug}`}
            className="self-start md:self-auto px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-500/20 transition-all text-center shrink-0"
          >
            Book Celebration Slot →
          </Link>
        </div>

        {/* Photo Gallery Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12">
          {branch.images.length > 0 ? (
            branch.images.map((img, idx) => (
              <div
                key={idx}
                className={`overflow-hidden rounded-3xl bg-gray-200 h-64 md:h-80 ${idx === 0 ? "md:col-span-2" : ""}`}
              >
                <img
                  src={img}
                  alt={`${branch.name} ${idx + 1}`}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                />
              </div>
            ))
          ) : (
            <div className="col-span-3 h-80 rounded-3xl bg-gray-200 flex items-center justify-center text-gray-400">
              No Photos Available
            </div>
          )}
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-16">
          
          {/* Main Info */}
          <div className="lg:col-span-2 space-y-8">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-xs">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">About This Celebration House</h2>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-line">
                {branch.description}
              </p>

              <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-8 mb-4">Included Amenities & Highlights</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {branch.amenities.map((item, idx) => (
                  <div key={idx} className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 text-sm font-semibold text-gray-800 dark:text-gray-200 flex items-center gap-2">
                    <span className="text-rose-500">✨</span> {item}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Time Slots Sidebar */}
          <div className="space-y-6">
            <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md sticky top-28">
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">Available Time Slots</h3>
              <p className="text-xs text-gray-500 mb-6">Pick a slot to reserve your celebration date.</p>

              <div className="space-y-3">
                {branch.slots.map((slot) => (
                  <div
                    key={slot.id}
                    className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 hover:border-rose-500 transition-colors flex items-center justify-between bg-white dark:bg-gray-900"
                  >
                    <div>
                      <div className="font-bold text-gray-900 dark:text-white text-sm">{slot.title}</div>
                      <div className="text-xs text-gray-500">🕒 {slot.startTime} - {slot.endTime}</div>
                    </div>

                    <Link
                      href={`/book/${branch.slug}?slotId=${slot.id}`}
                      className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-colors"
                    >
                      Book Slot
                    </Link>
                  </div>
                ))}
              </div>
            </div>
          </div>

        </div>

        {/* 1hr Celebration Packages for this Franchise */}
        <PackageShowcase selectedBranchSlug={branch.slug} />

        {/* Embedded Google Map Section Below About & Packages */}
        <section className="mt-16 bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-8 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
            <div>
              <div className="flex items-center gap-2">
                <img src="/icons/map.png" alt="Google Map Icon" className="w-6 h-6 object-contain" />
                <h2 className="text-2xl font-black text-gray-900 dark:text-white">
                  Google Map Location & Directions
                </h2>
              </div>
              <p className="text-sm text-gray-500 mt-1">
                📍 {branch.address}, {branch.city}, {branch.state}
              </p>
            </div>

            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-6 py-3 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md transition-colors text-center shrink-0"
            >
              Open in Google Maps App ↗
            </a>
          </div>

          {/* Embedded Google Maps iFrame */}
          <div className="w-full h-96 rounded-2xl overflow-hidden bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-inner">
            <iframe
              title={`${branch.name} Google Map Location`}
              src={mapEmbedUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            ></iframe>
          </div>
        </section>

      </div>
    </main>
  );
}
