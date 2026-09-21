import Link from "next/link";
import { notFound } from "next/navigation";
import { db } from "@/lib/prisma";
import PackageShowcase from "@/components/PackageComponents/PackageShowcase";
import BranchImageSlider from "@/components/BranchComponents/BranchImageSlider";
import BranchAvailableSlotsClient from "@/components/BranchComponents/BranchAvailableSlotsClient";

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

        {/* Two-Column Side-by-Side Photo Frames Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-12 items-start">
          {/* Column 1: Main Banner Image Frame */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                🖼️ Main Franchise Banner
              </h3>
            </div>
            <div className="relative h-72 sm:h-[420px] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 dark:border-gray-800 bg-gray-900 group">
              <img
                src={branch.images?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80"}
                alt={`${branch.name} Main Banner`}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-black/20 pointer-events-none"></div>
              <div className="absolute bottom-6 left-6 text-white">
                <span className="px-3 py-1 rounded-full bg-rose-600 text-white text-[11px] font-bold uppercase tracking-wider shadow-md">
                  Primary Location View
                </span>
                <h2 className="text-2xl sm:text-3xl font-black mt-2 drop-shadow-md">{branch.name}</h2>
              </div>
            </div>
          </div>

          {/* Column 2: Additional Gallery Images Auto-Slider Frame */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-black text-gray-900 dark:text-white">
                📸 Additional Setup Photos (Auto-Sliding)
              </h3>
            </div>

            {branch.images && branch.images.length > 1 ? (
              <BranchImageSlider
                images={branch.images.slice(1)}
                branchName={branch.name}
                autoSlideInterval={3500}
              />
            ) : (
              <div className="h-72 sm:h-[420px] rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-semibold border border-gray-200 dark:border-gray-700">
                No Additional Photos Added
              </div>
            )}
          </div>
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

          {/* Time Slots Sidebar with Date Selector */}
          <div className="space-y-6 sticky top-28">
            <BranchAvailableSlotsClient branchId={branch.id} branchSlug={branch.slug} />
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
