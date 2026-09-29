"use client";

import { useState } from "react";
import {
  createPackage,
  updatePackage,
  deletePackage,
  createAddOn,
  updateAddOn,
  deleteAddOn,
} from "@/lib/actions";

export default function AdminSettingsClient({ initialPackages, initialAddOns }) {
  const [packages, setPackages] = useState(initialPackages);
  const [addOns, setAddOns] = useState(initialAddOns);
  const [activeTab, setActiveTab] = useState("packages");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Package Modal State
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgFormData, setPkgFormData] = useState({
    badge: "Standard",
    name: "",
    originalPrice: "",
    offerPrice: "",
    features: "",
  });

  // Add-On Modal State
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [addOnFormData, setAddOnFormData] = useState({
    name: "",
    price: "",
  });

  // --- PACKAGE HANDLERS ---
  const handleOpenAddPkg = () => {
    setEditingPkg(null);
    setPkgFormData({
      badge: "Standard",
      name: "",
      originalPrice: "",
      offerPrice: "",
      features: "",
    });
    setError("");
    setSuccess("");
    setShowPkgModal(true);
  };

  const handleOpenEditPkg = (pkg) => {
    setEditingPkg(pkg);
    setPkgFormData({
      badge: pkg.badge || "Standard",
      name: pkg.name || "",
      originalPrice: pkg.originalPrice || "",
      offerPrice: pkg.offerPrice || "",
      features: Array.isArray(pkg.features) ? pkg.features.join("\n") : "",
    });
    setError("");
    setSuccess("");
    setShowPkgModal(true);
  };

  const handlePkgSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingPkg) {
        const res = await updatePackage(editingPkg.id, {
          name: pkgFormData.name,
          badge: pkgFormData.badge,
          originalPrice: pkgFormData.originalPrice,
          offerPrice: pkgFormData.offerPrice,
          features: pkgFormData.features,
        });
        if (res.success) {
          setPackages((prev) =>
            prev.map((p) => (p.id === editingPkg.id ? res.package : p))
          );
          setSuccess("Global package updated successfully!");
          setShowPkgModal(false);
        }
      } else {
        const res = await createPackage({
          isGlobal: true,
          branchId: null,
          name: pkgFormData.name,
          badge: pkgFormData.badge,
          originalPrice: pkgFormData.originalPrice,
          offerPrice: pkgFormData.offerPrice,
          features: pkgFormData.features,
        });
        if (res.success) {
          setPackages((prev) => [...prev, res.package]);
          setSuccess("Global package created successfully!");
          setShowPkgModal(false);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save package.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePkg = async (id) => {
    if (!confirm("Are you sure you want to delete this global package?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await deletePackage(id);
      if (res.success) {
        setPackages((prev) => prev.filter((p) => p.id !== id));
        setSuccess("Package deleted successfully.");
      }
    } catch (err) {
      setError(err.message || "Failed to delete package.");
    } finally {
      setLoading(false);
    }
  };

  // --- ADD-ON HANDLERS ---
  const handleOpenAddAddOn = () => {
    setEditingAddOn(null);
    setAddOnFormData({ name: "", price: "" });
    setError("");
    setSuccess("");
    setShowAddOnModal(true);
  };

  const handleOpenEditAddOn = (addon) => {
    setEditingAddOn(addon);
    setAddOnFormData({ name: addon.name, price: addon.price });
    setError("");
    setSuccess("");
    setShowAddOnModal(true);
  };

  const handleAddOnSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingAddOn) {
        const res = await updateAddOn(editingAddOn.id, {
          name: addOnFormData.name,
          price: addOnFormData.price,
        });
        if (res.success) {
          setAddOns((prev) =>
            prev.map((a) => (a.id === editingAddOn.id ? res.addOn : a))
          );
          setSuccess("Celebration Add-On updated!");
          setShowAddOnModal(false);
        }
      } else {
        const res = await createAddOn({
          isGlobal: true,
          branchId: null,
          name: addOnFormData.name,
          price: addOnFormData.price,
        });
        if (res.success) {
          setAddOns((prev) => [...prev, res.addOn]);
          setSuccess("New Celebration Add-On added!");
          setShowAddOnModal(false);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save add-on.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddOn = async (id) => {
    if (!confirm("Are you sure you want to delete this celebration add-on?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await deleteAddOn(id);
      if (res.success) {
        setAddOns((prev) => prev.filter((a) => a.id !== id));
        setSuccess("Celebration Add-On deleted successfully.");
      }
    } catch (err) {
      setError(err.message || "Failed to delete add-on.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && (
        <div className="p-4 bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl text-sm font-semibold">
          ⚠️ {error}
        </div>
      )}
      {success && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-2xl text-sm font-semibold">
          ✅ {success}
        </div>
      )}

      {/* Tabs */}
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4">
        <button
          onClick={() => setActiveTab("packages")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "packages"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          🎁 Global Packages ({packages.length})
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={`pb-3 text-sm font-bold border-b-2 transition-colors ${
            activeTab === "addons"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          ✨ Celebration Add-Ons ({addOns.length})
        </button>
      </div>

      {/* TAB 1: GLOBAL PACKAGES */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                🎁 Global Celebration Packages
              </h2>
              <p className="text-xs text-gray-500">
                Displayed on homepage and across all default franchise branches. Editable & deletable anytime.
              </p>
            </div>
            <button
              onClick={handleOpenAddPkg}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Add Global Package
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {packages.map((pkg) => (
              <div
                key={pkg.id}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold">
                      {pkg.badge || "Standard"}
                    </span>
                    <span className="text-xs text-gray-400 font-semibold">Global Admin</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                    {pkg.name}
                  </h3>
                  <div className="flex items-baseline gap-2 mb-4">
                    <span className="text-2xl font-black text-rose-600">₹{pkg.offerPrice}</span>
                    <span className="text-sm text-gray-400 line-through">₹{pkg.originalPrice}</span>
                  </div>

                  <div className="space-y-1.5 mb-6">
                    <p className="text-xs font-bold text-gray-500 uppercase">Features & Inclusions:</p>
                    {pkg.features && pkg.features.length > 0 ? (
                      <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                        {pkg.features.map((feat, idx) => (
                          <li key={idx}>{feat}</li>
                        ))}
                      </ul>
                    ) : (
                      <p className="text-xs text-gray-400 italic">No features specified.</p>
                    )}
                  </div>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <button
                    onClick={() => handleOpenEditPkg(pkg)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs transition-colors"
                  >
                    ✏️ Edit
                  </button>
                  <button
                    onClick={() => handleDeletePkg(pkg.id)}
                    disabled={loading}
                    className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs transition-colors"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: CELEBRATION ADD-ONS */}
      {activeTab === "addons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                ✨ Global Celebration Add-Ons
              </h2>
              <p className="text-xs text-gray-500">
                Optional services available for customers to choose when booking a slot.
              </p>
            </div>
            <button
              onClick={handleOpenAddAddOn}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>➕</span> Add Celebration Add-On
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {addOns.map((addon) => (
              <div
                key={addon.id}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex items-center justify-between"
              >
                <div>
                  <h3 className="text-base font-bold text-gray-900 dark:text-white">
                    {addon.name}
                  </h3>
                  <div className="text-xl font-black text-rose-600 mt-1">
                    +₹{addon.price}
                  </div>
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={() => handleOpenEditAddOn(addon)}
                    className="p-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs"
                  >
                    ✏️
                  </button>
                  <button
                    onClick={() => handleDeleteAddOn(addon.id)}
                    disabled={loading}
                    className="p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* PACKAGE MODAL */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPkg ? "Edit Global Package" : "Create Global Package"}
            </h3>

            <form onSubmit={handlePkgSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={pkgFormData.name}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, name: e.target.value })}
                  placeholder="e.g. Standard Family & Friends Celebration"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Badge Tagline
                  </label>
                  <input
                    type="text"
                    value={pkgFormData.badge}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, badge: e.target.value })}
                    placeholder="e.g. 1st Package"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                    Original Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    value={pkgFormData.originalPrice}
                    onChange={(e) => setPkgFormData({ ...pkgFormData, originalPrice: e.target.value })}
                    placeholder="2000"
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Offer Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={pkgFormData.offerPrice}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, offerPrice: e.target.value })}
                  placeholder="1499"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Features & Inclusions (One feature per line)
                </label>
                <textarea
                  rows={5}
                  value={pkgFormData.features}
                  onChange={(e) => setPkgFormData({ ...pkgFormData, features: e.target.value })}
                  placeholder={`AC Hall\nBubble Entry\nCelebration Cake`}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowPkgModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                >
                  {loading ? "Saving..." : editingPkg ? "Update Package" : "Create Package"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ADD-ON MODAL */}
      {showAddOnModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingAddOn ? "Edit Celebration Add-On" : "Add Celebration Add-On"}
            </h3>

            <form onSubmit={handleAddOnSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Add-On Name *
                </label>
                <input
                  type="text"
                  required
                  value={addOnFormData.name}
                  onChange={(e) => setAddOnFormData({ ...addOnFormData, name: e.target.value })}
                  placeholder="e.g. Phone Photography & Video Shoot"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Add-On Price (₹) *
                </label>
                <input
                  type="number"
                  required
                  value={addOnFormData.price}
                  onChange={(e) => setAddOnFormData({ ...addOnFormData, price: e.target.value })}
                  placeholder="200"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowAddOnModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                >
                  {loading ? "Saving..." : editingAddOn ? "Save Add-On" : "Create Add-On"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
