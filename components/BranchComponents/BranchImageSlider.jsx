"use client";

import { useState, useEffect } from "react";

export default function BranchImageSlider({
  images = [],
  branchName = "HaruViru Branch",
  autoSlideInterval = 3500,
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  useEffect(() => {
    if (!images || images.length <= 1 || isPaused) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
    }, autoSlideInterval);

    return () => clearInterval(timer);
  }, [images, autoSlideInterval, isPaused]);

  if (!images || images.length === 0) {
    return (
      <div className="h-64 rounded-3xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-400 font-semibold">
        No Additional Photos Available
      </div>
    );
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev === 0 ? images.length - 1 : prev - 1));
  };

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev === images.length - 1 ? 0 : prev + 1));
  };

  return (
    <div className="space-y-4">
      {/* SINGLE FRAME AUTO-SLIDER */}
      <div
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        className="relative h-72 sm:h-[420px] w-full rounded-3xl overflow-hidden shadow-xl border border-gray-200/80 dark:border-gray-800 bg-gray-900 group"
      >
        {/* Active Slide Image */}
        <img
          src={images[currentIndex]}
          alt={`${branchName} gallery photo ${currentIndex + 1}`}
          className="w-full h-full object-cover transition-all duration-700 ease-in-out"
        />

        {/* Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-black/30 pointer-events-none"></div>

        {/* Counter & Auto-slide Badge */}
        <div className="absolute top-4 left-4 flex items-center gap-2">
          <div className="bg-black/70 backdrop-blur-md text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-md">
            📸 Gallery Photo {currentIndex + 1} of {images.length}
          </div>
          {images.length > 1 && (
            <div className="bg-rose-600/90 backdrop-blur-md text-white text-[10px] font-bold px-2.5 py-1 rounded-full shadow-md flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse"></span>
              <span>{isPaused ? "Paused" : "Auto-sliding"}</span>
            </div>
          )}
        </div>

        {/* Navigation Arrow Buttons */}
        {images.length > 1 && (
          <>
            <button
              onClick={prevSlide}
              aria-label="Previous Photo"
              className="absolute left-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center font-black shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            >
              ❮
            </button>

            <button
              onClick={nextSlide}
              aria-label="Next Photo"
              className="absolute right-4 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full bg-black/60 hover:bg-rose-600 text-white flex items-center justify-center font-black shadow-lg backdrop-blur-md transition-all hover:scale-110 active:scale-95"
            >
              ❯
            </button>
          </>
        )}

        {/* Slide Indicator Dots */}
        {images.length > 1 && (
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 bg-black/50 backdrop-blur-md px-3 py-1.5 rounded-full">
            {images.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                aria-label={`Go to slide ${idx + 1}`}
                className={`h-2.5 rounded-full transition-all ${
                  currentIndex === idx ? "w-6 bg-rose-500" : "w-2.5 bg-white/60 hover:bg-white"
                }`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Interactive Thumbnails Strip */}
      {images.length > 1 && (
        <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-thin">
          {images.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentIndex(idx)}
              className={`relative h-16 w-24 rounded-2xl overflow-hidden shrink-0 transition-all border-2 ${
                currentIndex === idx
                  ? "border-rose-600 scale-105 shadow-md ring-2 ring-rose-400/40"
                  : "border-transparent opacity-60 hover:opacity-100"
              }`}
            >
              <img src={img} alt={`Thumb ${idx + 1}`} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
