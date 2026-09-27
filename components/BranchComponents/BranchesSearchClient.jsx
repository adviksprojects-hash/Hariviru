"use client";

import { useState } from "react";
import BranchCard from "./BranchCard";

export default function BranchesSearchClient({ initialBranches, initialQuery = "" }) {
  const [query, setQuery] = useState(initialQuery);

  const filteredBranches = initialBranches.filter((b) => {
    if (!query.trim()) return true;
    const q = query.toLowerCase();
    return (
      b.name.toLowerCase().includes(q) ||
      b.city.toLowerCase().includes(q) ||
      b.address.toLowerCase().includes(q) ||
      (b.state && b.state.toLowerCase().includes(q)) ||
      (b.amenities && b.amenities.some((a) => a.toLowerCase().includes(q)))
    );
  });

  return (
    <div>
      {/* Search Bar Input */}
      <div className="mt-6 flex items-center justify-center gap-2 max-w-md mx-auto mb-10">
        <div className="relative w-full">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by city, branch name, or address..."
            className="w-full px-5 py-3.5 pr-10 rounded-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-800 text-gray-900 dark:text-white shadow-xs focus:outline-hidden focus:ring-2 focus:ring-rose-500 text-sm"
          />
          {query && (
            <button
              onClick={() => setQuery("")}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 font-bold text-sm"
            >
              ✕
            </button>
          )}
        </div>
      </div>

      {/* Branch Cards Grid */}
      {filteredBranches.length === 0 ? (
        <div className="text-center py-16 bg-white/90 dark:bg-gray-900/90 rounded-3xl border border-gray-200 dark:border-gray-800">
          <p className="text-xl font-bold text-gray-700 dark:text-gray-300">No branches found matching "{query}"</p>
          <p className="mt-2 text-sm text-gray-500">Try searching for Shikrapur, Pune, Hyderabad, or Bengaluru.</p>
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
