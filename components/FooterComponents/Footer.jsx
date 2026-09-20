import Link from "next/link";
import { contactInfo } from "@/data/PackageData/PackageData";

export default function Footer() {
  return (
    <footer className="bg-gray-950 text-gray-300 border-t border-gray-800 pt-16 pb-12">
      <div className="container mx-auto px-4 md:px-8 max-w-6xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand Info & Bigger Cropped Logo */}
          <div className="md:col-span-1 space-y-4">
            <Link href="/" className="inline-flex items-center gap-3 group">
              <div className="h-16 w-16 overflow-hidden rounded-2xl bg-white p-0.5 shadow-md flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="HaruViru Logo"
                  className="h-24 w-24 max-w-none object-contain scale-135 group-hover:scale-145 transition-transform duration-300"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl font-black tracking-tight leading-none text-white">
                  Haru<span className="text-transparent bg-clip-text bg-linear-to-r from-rose-500 to-amber-500">Viru</span>
                </span>
                <span className="text-xs font-bold tracking-widest uppercase text-rose-400 mt-0.5">
                  Celebration House
                </span>
              </div>
            </Link>

            <p className="text-xs text-gray-400 leading-relaxed">
              Make your special day unforgettable. Ultra-private 1hr celebration packages with AC Hall, 4K Theater, Dolby Audio, custom cake & decorations across all franchises.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Quick Navigation</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li>
                <Link href="/" className="hover:text-rose-400 transition-colors">Home</Link>
              </li>
              <li>
                <Link href="/branches" className="hover:text-rose-400 transition-colors">Celebration Branches</Link>
              </li>
              <li>
                <Link href="/bookings" className="hover:text-rose-400 transition-colors">My Bookings</Link>
              </li>
              <li>
                <Link href="/franchise" className="hover:text-rose-400 transition-colors">Own a Franchise</Link>
              </li>
              <li>
                <Link href="/about-us" className="hover:text-rose-400 transition-colors">About Us</Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-rose-400 transition-colors">Contact Support</Link>
              </li>
            </ul>
          </div>

          {/* Celebration Packages Quick Info */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Celebration Packages</h4>
            <ul className="space-y-2.5 text-xs font-medium">
              <li className="flex items-center justify-between text-gray-400">
                <span>1st Package (Family 1hr)</span>
                <span className="font-bold text-amber-400">₹1,499</span>
              </li>
              <li className="flex items-center justify-between text-gray-400">
                <span>2nd Package (Delight Party)</span>
                <span className="font-bold text-amber-400">₹2,499</span>
              </li>
              <li className="flex items-center justify-between text-gray-400">
                <span>3rd Package (VIP Grand Couple)</span>
                <span className="font-bold text-amber-400">₹3,999</span>
              </li>
            </ul>
          </div>

          {/* Contact & Social Links */}
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Contact & Socials</h4>
            <div className="space-y-3 text-xs">
              <div>
                <span className="text-gray-400 block">Phone / WhatsApp:</span>
                <a href={`https://wa.me/91${contactInfo.phone}`} target="_blank" rel="noopener noreferrer" className="font-bold text-rose-400 hover:underline">
                  📞 +91 {contactInfo.phone}
                </a>
              </div>

              <div>
                <span className="text-gray-400 block">Instagram Pages:</span>
                <div className="flex flex-col gap-1 mt-1 font-medium">
                  <a href={`https://instagram.com/${contactInfo.businessInstagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                    📸 @{contactInfo.businessInstagram}
                  </a>
                  <a href={`https://instagram.com/${contactInfo.ownerInstagram}`} target="_blank" rel="noopener noreferrer" className="hover:text-amber-400">
                    👑 Owner: @{contactInfo.ownerInstagram}
                  </a>
                </div>
              </div>
            </div>
          </div>

        </div>

        {/* Bottom Copyright */}
        <div className="pt-8 border-t border-gray-900 flex flex-col sm:flex-row items-center justify-between text-xs text-gray-500 gap-4">
          <p>© {new Date().getFullYear()} HaruViru Celebration House. All rights reserved.</p>
          <p className="flex items-center gap-1">
            <span>Crafted with ❤️ for All Franchise Branches</span>
          </p>
        </div>
      </div>
    </footer>
  );
}
