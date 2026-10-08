"use client";

import { useState, useMemo } from "react";
import BranchCard from "./BranchCard";

export default function BranchesSearchClient({ initialBranches, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);
  const [selectedCity, setSelectedCity] = useState("ALL");

  // Dynamically extract unique cities from available branches
  const availableCities = useMemo(() => {
    const citiesSet = new Set();
    initialBranches.forEach((b) => {
      if (b.city && b.city.trim()) {
        citiesSet.add(b.city.trim());
      }
    });
    return ["ALL", ...Array.from(citiesSet)];
  }, [initialBranches]);

  const filteredBranches = useMemo(() => {
    const cleanQuery = query.trim().toLowerCase();
    
    return initialBranches.filter((b) => {
      // 1. City Pill Filter
      if (selectedCity !== "ALL") {
        if (!b.city || b.city.trim().toLowerCase() !== selectedCity.toLowerCase()) {
          return false;
        }
      }

      // 2. Search Bar Query Filter (matches City, Name, Address, State, Amenities)
      if (!cleanQuery) return true;

      const cityName = (b.city || "").toLowerCase();
      const branchName = (b.name || "").toLowerCase();
      const address = (b.address || "").toLowerCase();
      const stateName = (b.state || "").toLowerCase();
      const slug = (b.slug || "").toLowerCase();
      const amenitiesMatch = (b.amenities || []).some((a) =>
        a.toLowerCase().includes(cleanQuery)
      );

      return (
        cityName.includes(cleanQuery) ||
        branchName.includes(cleanQuery) ||
        address.includes(cleanQuery) ||
        stateName.includes(cleanQuery) ||
        slug.includes(cleanQuery) ||
        amenitiesMatch
      );
    });
  }, [initialBranches, query, selectedCity]);

  return (
    <div>
      {/* City Quick Filter Pills */}
      {availableCities.length > 2 && (
        <div className="flex items-center justify-center flex-wrap gap-2 mt-4 mb-4">
          {availableCities.map((city) => {
            const isSelected = selectedCity === city;
            return (
              <button
                key={city}
                onClick={() => {
                  setSelectedCity(city);
                }}
                className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all shadow-2xs ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-105"
                    : "bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-800 hover:border-rose-300"
                }`}
              >
                {city === "ALL" ? "🌍 All Cities" : `📍 ${city}`}
              </button>
            );
          })}
        </div>
      )}

      {/* Search Bar Input */}
      <div className="flex items-center justify-center gap-2 max-w-lg mx-auto mb-8">
        <div className="relative w-full">
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none text-base">
            🔍
          </div>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city (e.g. Pune, Hyderabad, Shikrapur) or branch..."
            className="w-full pl-11 pr-10 py-3.5 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white shadow-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-sm font-medium"
          />
          {(query || selectedCity !== "ALL") && (
            <button
              onClick={() => {
                setQuery("");
                setSelectedCity("ALL");
              }}
              title="Clear search"
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-xs bg-gray-100 dark:bg-gray-800 w-5 h-5 rounded-full flex items-center justify-center transition-colors"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Results Count Header */}
      <div className="flex items-center justify-between mb-6 px-1 text-xs text-gray-500 dark:text-gray-400">
        <span className="font-semibold">
          Showing <strong className="text-gray-900 dark:text-white">{filteredBranches.length}</strong> {filteredBranches.length === 1 ? "Celebration Branch" : "Celebration Branches"}
          {selectedCity !== "ALL" && ` in ${selectedCity}`}
          {query.trim() && ` matching "${query.trim()}"`}
        </span>
        {(query || selectedCity !== "ALL") && (
          <button
            onClick={() => {
              setQuery("");
              setSelectedCity("ALL");
            }}
            className="text-rose-600 hover:underline font-bold"
          >
            Reset Filters
          </button>
        )}
      </div>

      {/* Branch Cards Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-white/90 dark:bg-gray-900/90 rounded-3xl border border-gray-200 dark:border-gray-800 p-8">
          <div className="text-4xl mb-3">📍</div>
          <p className="text-xl font-bold text-gray-800 dark:text-gray-200">
            No branches found matching your search
          </p>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            We couldn't find any celebration house branches for "{query || selectedCity}". Try searching for another city or clear the filters.
          </p>
          <button
            onClick={() => {
              setQuery("");
              setSelectedCity("ALL");
            }}
            className="mt-6 px-6 py-2.5 rounded-full bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-md transition-colors"
          >
            Show All Branches
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredBranches.map((branch) => (
            <BranchCard key={branch.id} branch={branch} />
          ))}
        </div>
      )}
    </div>
  );
}
