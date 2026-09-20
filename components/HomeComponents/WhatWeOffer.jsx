"use client";

import Link from "next/link";

export default function WhatWeOffer() {
  const offers = [
    {
      id: "birthday",
      title: "Stunning Birthday Setups with Premium Decor",
      description: "Custom balloon arches, personalized name boards, ambient fairy lights, and delicious celebration cakes for an unforgettable birthday bash.",
      badge: "🎉 Birthday Bash",
      gradient: "from-rose-500/10 via-amber-500/10 to-rose-500/5",
      borderHover: "hover:border-rose-500 hover:shadow-rose-500/25",
      emojis: [
        { char: "🎂", pos: "top-2 left-8", translate: "group-hover:-translate-y-14 group-hover:-translate-x-4 group-hover:rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🎈", pos: "top-4 right-10", translate: "group-hover:-translate-y-16 group-hover:translate-x-5 group-hover:-rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🎉", pos: "-top-2 left-1/2 -translate-x-1/2", translate: "group-hover:-translate-y-20 group-hover:opacity-100 group-hover:scale-150" },
        { char: "🎁", pos: "top-10 right-20", translate: "group-hover:-translate-y-12 group-hover:translate-x-8 group-hover:rotate-45 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🥳", pos: "top-8 left-20", translate: "group-hover:-translate-y-16 group-hover:-translate-x-8 group-hover:-rotate-12 group-hover:opacity-100 group-hover:scale-125" },
      ],
      icon: "🎂",
    },
    {
      id: "anniversary",
      title: "Romantic Anniversary Experiences with a Twist",
      description: "Fairy light canopy, rose petal pathways, candlelit ambiance, smoke entry, and private moments tailored for love celebrations.",
      badge: "💖 Couple Romance",
      gradient: "from-pink-500/10 via-rose-500/10 to-purple-500/5",
      borderHover: "hover:border-pink-500 hover:shadow-pink-500/25",
      emojis: [
        { char: "💖", pos: "top-2 left-8", translate: "group-hover:-translate-y-14 group-hover:-translate-x-4 group-hover:-rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🌹", pos: "top-4 right-10", translate: "group-hover:-translate-y-16 group-hover:translate-x-5 group-hover:rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🥂", pos: "-top-2 left-1/2 -translate-x-1/2", translate: "group-hover:-translate-y-20 group-hover:opacity-100 group-hover:scale-150" },
        { char: "✨", pos: "top-10 right-20", translate: "group-hover:-translate-y-12 group-hover:translate-x-8 group-hover:rotate-45 group-hover:opacity-100 group-hover:scale-125" },
        { char: "💍", pos: "top-8 left-20", translate: "group-hover:-translate-y-16 group-hover:-translate-x-8 group-hover:rotate-12 group-hover:opacity-100 group-hover:scale-125" },
      ],
      icon: "🌹",
    },
    {
      id: "movie",
      title: "Private Movie Nights for Couples – Pure Bliss!",
      description: "Giant 4K theater screen, Dolby Surround Sound, cozy sofa lounge, popcorn & burger treats for an exclusive private cinema date.",
      badge: "🎬 Cinema Lounge",
      gradient: "from-amber-500/10 via-orange-500/10 to-rose-500/5",
      borderHover: "hover:border-amber-500 hover:shadow-amber-500/25",
      emojis: [
        { char: "🍿", pos: "top-2 left-8", translate: "group-hover:-translate-y-14 group-hover:-translate-x-4 group-hover:rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🎬", pos: "top-4 right-10", translate: "group-hover:-translate-y-16 group-hover:translate-x-5 group-hover:-rotate-12 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🎥", pos: "-top-2 left-1/2 -translate-x-1/2", translate: "group-hover:-translate-y-20 group-hover:opacity-100 group-hover:scale-150" },
        { char: "⭐", pos: "top-10 right-20", translate: "group-hover:-translate-y-12 group-hover:translate-x-8 group-hover:rotate-45 group-hover:opacity-100 group-hover:scale-125" },
        { char: "🥤", pos: "top-8 left-20", translate: "group-hover:-translate-y-16 group-hover:-translate-x-8 group-hover:rotate-12 group-hover:opacity-100 group-hover:scale-125" },
      ],
      icon: "🍿",
    },
  ];

  return (
    <section className="py-16 px-4 bg-white dark:bg-gray-950 border-b border-gray-100 dark:border-gray-800 overflow-visible">
      <div className="container mx-auto max-w-6xl">
        
        {/* Section Header */}
        <div className="text-center max-w-3xl mx-auto mb-14">
          <span className="px-4 py-1.5 rounded-full bg-linear-to-r from-rose-500 to-amber-500 text-white text-xs font-bold uppercase tracking-widest shadow-md">
            What We Offer
          </span>
          <h2 className="text-3xl sm:text-5xl font-black text-gray-900 dark:text-white tracking-tight mt-3">
            Tailored Experiences for Every Special Moment
          </h2>
          <p className="mt-3 text-gray-600 dark:text-gray-400">
            Hover over any experience card below to see the magic pop out!
          </p>
        </div>

        {/* 3 Interactive Offer Cards with Visible Floating Emojis */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-6">
          {offers.map((item) => (
            <div
              key={item.id}
              className={`group relative rounded-3xl p-8 bg-gradient-to-b ${item.gradient} bg-white dark:bg-gray-900 border border-gray-200/80 dark:border-gray-800 shadow-sm hover:shadow-2xl transition-all duration-300 flex flex-col justify-between ${item.borderHover}`}
            >
              {/* Floating Emojis bursting up on hover */}
              <div className="absolute inset-x-0 top-0 pointer-events-none z-30">
                {item.emojis.map((e, idx) => (
                  <span
                    key={idx}
                    className={`absolute ${e.pos} text-3xl opacity-0 transition-all duration-500 ease-out transform ${e.translate}`}
                  >
                    {e.char}
                  </span>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-4">
                  <span className="px-3 py-1 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-800 dark:text-gray-200 shadow-2xs">
                    {item.badge}
                  </span>
                  <span className="text-4xl group-hover:scale-125 transition-transform duration-300">
                    {item.icon}
                  </span>
                </div>

                <h3 className="text-2xl font-black text-gray-900 dark:text-white leading-snug">
                  {item.title}
                </h3>

                <p className="mt-4 text-sm text-gray-600 dark:text-gray-300 leading-relaxed">
                  {item.description}
                </p>
              </div>

              <div className="mt-8 pt-4 border-t border-gray-200/60 dark:border-gray-800">
                <Link
                  href="/branches"
                  className="inline-flex items-center gap-2 text-sm font-bold text-rose-600 hover:text-rose-700 group-hover:translate-x-1.5 transition-all"
                >
                  Book This Experience <span>→</span>
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
