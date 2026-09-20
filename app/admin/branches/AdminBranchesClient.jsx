"use client";

import { useState } from "react";
import { createBranch, toggleBranchStatus } from "@/lib/actions";

export default function AdminBranchesClient({ initialBranches }) {
  const [branches, setBranches] = useState(initialBranches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states
  const [name, setName] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("Telangana");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [pricePerSlot, setPricePerSlot] = useState(4999);
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80");

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createBranch({
        name,
        city,
        state,
        address,
        phone,
        email,
        pricePerSlot,
        description,
        images: [imageUrl],
        amenities: ["4K Theater", "Ambient Lighting", "Private Lounge", "Theme Decor"],
      });

      if (res.success) {
        setBranches([res.branch, ...branches]);
        setShowAddModal(false);
        // Reset form
        setName("");
        setCity("");
        setAddress("");
        setPhone("");
      }
    } catch (err) {
      setError(err.message || "Failed to create branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggle = async (branchId, currentStatus) => {
    try {
      const res = await toggleBranchStatus(branchId, !currentStatus);
      if (res.success) {
        setBranches(branches.map((b) => (b.id === branchId ? { ...b, isActive: !currentStatus } : b)));
      }
    } catch (err) {
      alert("Error: " + err.message);
    }
  };

  return (
    <div>
      <div className="flex justify-end mb-6">
        <button
          onClick={() => setShowAddModal(true)}
          className="px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
        >
          + Add New Franchise Branch
        </button>
      </div>

      {/* Add Branch Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-4">
              Add New HaruViru Branch
            </h2>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Branch Name *</label>
                <input
                  type="text"
                  required
                  placeholder="HaruViru Jubilee Hills"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Hyderabad"
                    value={city}
                    onChange={(e) => setCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={(e) => setState(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                <input
                  type="text"
                  required
                  placeholder="Plot 402, Road No 36"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Price per Slot (₹) *</label>
                  <input
                    type="number"
                    required
                    value={pricePerSlot}
                    onChange={(e) => setPricePerSlot(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Banner Image URL</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-xs"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Luxurious celebration house with ambient LED lighting..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  {loading ? "Creating..." : "Save Branch"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => (
          <div key={b.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold px-3 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300">
                  📍 {b.city}, {b.state}
                </span>

                <button
                  onClick={() => handleToggle(b.id, b.isActive)}
                  className={`text-xs font-bold px-3 py-1 rounded-full ${
                    b.isActive ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"
                  }`}
                >
                  {b.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              <h3 className="text-2xl font-bold text-gray-900 dark:text-white">{b.name}</h3>
              <p className="text-xs text-gray-500 mt-1">📍 {b.address}</p>

              <div className="mt-4 flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                <div>💰 Slot Rate: <span className="font-bold text-rose-600">₹{b.pricePerSlot}</span></div>
                <div>📋 Total Bookings: <span className="font-bold">{b._count?.bookings || 0}</span></div>
              </div>

              <div className="mt-2 text-xs text-gray-500">
                Manager: <span className="font-semibold text-gray-800 dark:text-gray-200">{b.managers?.[0]?.name || "Unassigned"}</span>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <a
                href={`/branches/${b.slug}`}
                target="_blank"
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                View Public Page ↗
              </a>
              <span className="text-xs text-gray-400">ID: {b.slug}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
