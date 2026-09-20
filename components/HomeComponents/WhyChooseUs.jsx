import Link from "next/link";

export default function WhyChooseUs() {
  const reasons = [
    {
      id: "spaces",
      title: "Elegant & Modern Celebration Spaces",
      description: "Aesthetically designed private AC halls with luxury seating, ambient LED neon lighting, and pristine hygiene.",
      icon: "✨",
      color: "from-rose-500 to-pink-600",
    },
    {
      id: "food",
      title: "Gourmet Food & Custom Themes",
      description: "Complimentary celebration cakes, burgers, welcome drinks, and customized balloon & flower decor tailored to your occasion.",
      icon: "🍔",
      color: "from-amber-500 to-orange-600",
    },
    {
      id: "movie",
      title: "Exclusive Movie Experience",
      description: "Personal 4K projector theater with Dolby Surround Audio, YouTube OTT access, and special moment slideshow screening.",
      icon: "🎬",
      color: "from-purple-500 to-indigo-600",
    },
    {
      id: "location",
      title: "Prime Location",
      description: "Conveniently located in top prime areas with easy accessibility, parking, and dedicated on-site franchise managers.",
      icon: "📍",
      color: "from-blue-500 to-cyan-600",
    },
    {
      id: "booking",
      title: "Seamless Booking",
      description: "Instant online slot booking, transparent package pricing starting at ₹1,499, and zero hidden charges.",
      icon: "⚡",
      color: "from-emerald-500 to-teal-600",
    },
  ];

  return (
    <section className="py-20 px-4 bg-gradient-to-b from-gray-900 to-gray-950 text-white relative overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="absolute top-0 right-1/4 w-96 h-96 bg-rose-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-0 left-1/4 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="container mx-auto max-w-6xl relative z-10">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="px-4 py-1.5 rounded-full bg-white/10 backdrop-blur-md text-amber-400 text-xs font-bold uppercase tracking-widest border border-white/10">
            The HaruViru Advantage
          </span>
          <h2 className="text-3xl sm:text-5xl font-black tracking-tight mt-3">
            Why Choose Us?
          </h2>
          <p className="mt-3 text-gray-400 text-base sm:text-lg">
            We combine privacy, luxury, and technology to deliver India’s premier private celebration experience.
          </p>
        </div>

        {/* 5 Points Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reasons.map((item, index) => (
            <div
              key={item.id}
              className={`p-8 rounded-3xl bg-gray-900/80 border border-gray-800 hover:border-gray-700 shadow-xl transition-all duration-300 hover:-translate-y-1.5 group flex flex-col justify-between ${
                index === 0 ? "lg:col-span-2" : ""
              }`}
            >
              <div>
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-tr ${item.color} text-white flex items-center justify-center text-2xl shadow-lg mb-6 group-hover:scale-110 transition-transform duration-300`}>
                  {item.icon}
                </div>

                <h3 className="text-2xl font-bold text-white group-hover:text-rose-400 transition-colors">
                  {item.title}
                </h3>

                <p className="mt-3 text-sm text-gray-400 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-6 pt-4 border-t border-gray-800/80 flex items-center justify-between text-xs font-bold text-gray-500">
                <span>0{index + 1}</span>
                <span className="text-rose-500 opacity-0 group-hover:opacity-100 transition-opacity">HaruViru Guarantee ✓</span>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA Banner */}
        <div className="mt-16 text-center">
          <Link
            href="/branches"
            className="inline-block px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-xl shadow-rose-500/20 transform hover:-translate-y-0.5 transition-all"
          >
            Find Your Celebration House Now →
          </Link>
        </div>

      </div>
    </section>
  );
}
