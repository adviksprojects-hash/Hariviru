import Link from "next/link";

export default function BranchCard({ branch }) {
  const mapUrl = branch.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(branch.address + " " + branch.city)}`;
  const instagram = branch.instagramHandle || "celebration_house_23";
  const whatsapp = branch.whatsapp || branch.phone?.replace(/[^0-9]/g, "") || "9762486649";
  const phone = branch.phone || "+91 97624 86649";

  return (
    <div className="group rounded-3xl bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between">
      
      {/* Top Image Banner */}
      <div>
        <div className="relative h-60 w-full overflow-hidden bg-gray-200">
          <img
            src={branch.images?.[0] || "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=800&q=80"}
            alt={branch.name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
            📍 {branch.city}, {branch.state}
          </div>

          {/* Contact & Map Real Icon Bar on Top Right (No white background) */}
          <div className="absolute top-3 right-3 flex items-center gap-2.5">
            {/* 1. Google Map Icon */}
            <a
              href={mapUrl}
              target="_blank"
              rel="noopener noreferrer"
              title="Google Maps Location"
              className="w-8 h-8 flex items-center justify-center hover:scale-115 transition-transform drop-shadow-md"
            >
              <img src="/icons/map.png" alt="Google Map" className="w-6 h-6 object-contain" />
            </a>

            {/* 2. Instagram Icon */}
            <a
              href={`https://instagram.com/${instagram}`}
              target="_blank"
              rel="noopener noreferrer"
              title={`Instagram @${instagram}`}
              className="w-8 h-8 flex items-center justify-center hover:scale-115 transition-transform drop-shadow-md"
            >
              <img src="/icons/instagram.png" alt="Instagram" className="w-6 h-6 object-contain" />
            </a>

            {/* 3. Phone Call Icon */}
            <a
              href={`tel:${phone}`}
              title={`Call ${phone}`}
              className="w-8 h-8 flex items-center justify-center hover:scale-115 transition-transform drop-shadow-md"
            >
              <img src="/icons/phone.png" alt="Phone" className="w-6 h-6 object-contain" />
            </a>

            {/* 4. WhatsApp Icon */}
            <a
              href={`https://wa.me/91${whatsapp}?text=Hi%20HaruViru%20${encodeURIComponent(branch.name)}%2C%20I%20want%20to%20book%20a%20celebration%20package.`}
              target="_blank"
              rel="noopener noreferrer"
              title="WhatsApp Chat"
              className="w-8 h-8 flex items-center justify-center hover:scale-115 transition-transform drop-shadow-md"
            >
              <img src="/icons/whatsapp.png" alt="WhatsApp" className="w-6 h-6 object-contain" />
            </a>
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6">
          <h3 className="text-2xl font-black text-gray-900 dark:text-white group-hover:text-rose-600 transition-colors">
            {branch.name}
          </h3>

          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
            📍 {branch.address}
          </p>

          <p className="mt-3 text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
            {branch.description}
          </p>

          {/* Quick Package Price Pills */}
          <div className="mt-4 p-3 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-900/50">
            <div className="text-[11px] font-bold text-amber-900 dark:text-amber-300 uppercase tracking-wider mb-1.5">
              1hr Celebration Package Offers:
            </div>
            <div className="grid grid-cols-3 gap-1.5 text-center text-xs">
              <div className="p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800">
                <span className="block text-[10px] text-gray-400 font-semibold">1st Pkg</span>
                <span className="font-black text-rose-600">₹1,499</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800">
                <span className="block text-[10px] text-gray-400 font-semibold">2nd Pkg</span>
                <span className="font-black text-rose-600">₹2,499</span>
              </div>
              <div className="p-1.5 rounded-xl bg-white dark:bg-gray-800 border border-amber-200 dark:border-amber-800">
                <span className="block text-[10px] text-gray-400 font-semibold">3rd Pkg</span>
                <span className="font-black text-rose-600">₹3,999</span>
              </div>
            </div>
          </div>

          {/* Amenities Pills */}
          <div className="mt-4 flex flex-wrap gap-1.5">
            {branch.amenities.slice(0, 4).map((item, idx) => (
              <span key={idx} className="px-2.5 py-1 rounded-md bg-gray-100 dark:bg-gray-800 text-xs font-medium text-gray-700 dark:text-gray-300">
                ✓ {item}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Footer Bar with View & Book Action Only */}
      <div className="p-6 pt-0 border-t border-gray-100 dark:border-gray-800 mt-4">
        <Link
          href={`/branches/${branch.slug}`}
          className="w-full block text-center px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-md transition-all"
        >
          View Details & Book Slot →
        </Link>
      </div>

    </div>
  );
}
