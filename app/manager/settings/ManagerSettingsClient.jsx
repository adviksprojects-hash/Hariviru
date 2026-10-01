"use client";

import { useState } from "react";
import {
  createHall,
  updateHall,
  deleteHall,
  createPackage,
  updatePackage,
  deletePackage,
  createAddOn,
  updateAddOn,
  deleteAddOn,
  updateBranchDepositSettings,
} from "@/lib/actions";

export default function ManagerSettingsClient({
  branch,
  initialHalls,
  globalPackages,
  initialBranchPackages,
  globalAddOns,
  initialBranchAddOns,
}) {
  const [halls, setHalls] = useState(initialHalls);
  const [branchPackages, setBranchPackages] = useState(initialBranchPackages);
  const [allGlobalPackages, setAllGlobalPackages] = useState(globalPackages);
  const [branchAddOns, setBranchAddOns] = useState(initialBranchAddOns);
  const [allGlobalAddOns, setAllGlobalAddOns] = useState(globalAddOns);

  // Deposit settings state
  const [depositModeEnabled, setDepositModeEnabled] = useState(branch?.depositModeEnabled || false);
  const [depositAmount, setDepositAmount] = useState(branch?.depositAmount || 500);

  const [activeTab, setActiveTab] = useState("halls");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Hall Modal state
  const [showHallModal, setShowHallModal] = useState(false);
  const [editingHall, setEditingHall] = useState(null);
  const [hallForm, setHallForm] = useState({ name: "", capacity: "" });

  // Package Modal state
  const [showPkgModal, setShowPkgModal] = useState(false);
  const [editingPkg, setEditingPkg] = useState(null);
  const [pkgForm, setPkgForm] = useState({
    badge: "Branch Special",
    name: "",
    originalPrice: "",
    offerPrice: "",
    features: "",
  });

  // Add-On Modal state
  const [showAddOnModal, setShowAddOnModal] = useState(false);
  const [editingAddOn, setEditingAddOn] = useState(null);
  const [addOnForm, setAddOnForm] = useState({
    name: "",
    price: "",
    isQuantityBased: false,
  });

  // --- HALL HANDLERS ---
  const handleOpenAddHall = () => {
    setEditingHall(null);
    setHallForm({ name: `Hall ${halls.length + 1}`, capacity: "" });
    setError("");
    setSuccess("");
    setShowHallModal(true);
  };

  const handleOpenEditHall = (hall) => {
    setEditingHall(hall);
    setHallForm({ name: hall.name, capacity: hall.capacity || "" });
    setError("");
    setSuccess("");
    setShowHallModal(true);
  };

  const handleHallSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");

    try {
      if (editingHall) {
        const res = await updateHall(editingHall.id, {
          branchId: branch.id,
          name: hallForm.name,
          capacity: hallForm.capacity,
        });
        if (res.success) {
          setHalls((prev) =>
            prev.map((h) => (h.id === editingHall.id ? res.hall : h))
          );
          setSuccess("Hall details updated!");
          setShowHallModal(false);
        } else {
          setError(res.error || "Failed to update hall.");
        }
      } else {
        const res = await createHall({
          branchId: branch.id,
          name: hallForm.name,
          capacity: hallForm.capacity,
        });
        if (res.success) {
          setHalls((prev) => [...prev, res.hall]);
          setSuccess("New hall added to branch!");
          setShowHallModal(false);
        } else {
          setError(res.error || "Failed to create hall.");
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save hall.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteHall = async (id) => {
    if (!confirm("Are you sure you want to delete this hall?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await deleteHall(id);
      if (res.success) {
        setHalls((prev) => prev.filter((h) => h.id !== id));
        setSuccess("Hall removed successfully.");
      } else {
        setError(res.error || "Failed to delete hall.");
      }
    } catch (err) {
      setError(err.message || "Failed to delete hall.");
    } finally {
      setLoading(false);
    }
  };

  // --- PACKAGE HANDLERS ---
  const handleOpenAddPkg = () => {
    setEditingPkg(null);
    setPkgForm({
      badge: "Branch Special",
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
    setPkgForm({
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
          name: pkgForm.name,
          badge: pkgForm.badge,
          originalPrice: pkgForm.originalPrice,
          offerPrice: pkgForm.offerPrice,
          features: pkgForm.features,
        });
        if (res.success) {
          if (editingPkg.isGlobal) {
            setAllGlobalPackages((prev) =>
              prev.map((p) => (p.id === editingPkg.id ? res.package : p))
            );
          } else {
            setBranchPackages((prev) =>
              prev.map((p) => (p.id === editingPkg.id ? res.package : p))
            );
          }
          setSuccess("Package updated!");
          setShowPkgModal(false);
        }
      } else {
        const res = await createPackage({
          isGlobal: false,
          branchId: branch.id,
          name: pkgForm.name,
          badge: pkgForm.badge,
          originalPrice: pkgForm.originalPrice,
          offerPrice: pkgForm.offerPrice,
          features: pkgForm.features,
        });
        if (res.success) {
          setBranchPackages((prev) => [...prev, res.package]);
          setSuccess("Custom branch package added!");
          setShowPkgModal(false);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save branch package.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePkg = async (id, isGlobal) => {
    if (!confirm("Are you sure you want to delete this package?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await deletePackage(id);
      if (res.success) {
        if (isGlobal) {
          setAllGlobalPackages((prev) => prev.filter((p) => p.id !== id));
        } else {
          setBranchPackages((prev) => prev.filter((p) => p.id !== id));
        }
        setSuccess("Package removed successfully.");
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
    setAddOnForm({ name: "", price: "", isQuantityBased: false });
    setError("");
    setSuccess("");
    setShowAddOnModal(true);
  };

  const handleOpenEditAddOn = (addon) => {
    setEditingAddOn(addon);
    setAddOnForm({
      name: addon.name,
      price: addon.price,
      isQuantityBased: addon.isQuantityBased || false,
    });
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
          name: addOnForm.name,
          price: addOnForm.price,
          isQuantityBased: addOnForm.isQuantityBased,
        });
        if (res.success) {
          if (editingAddOn.isGlobal) {
            setAllGlobalAddOns((prev) =>
              prev.map((a) => (a.id === editingAddOn.id ? res.addOn : a))
            );
          } else {
            setBranchAddOns((prev) =>
              prev.map((a) => (a.id === editingAddOn.id ? res.addOn : a))
            );
          }
          setSuccess("Celebration Add-On updated!");
          setShowAddOnModal(false);
        }
      } else {
        const res = await createAddOn({
          isGlobal: false,
          branchId: branch.id,
          name: addOnForm.name,
          price: addOnForm.price,
          isQuantityBased: addOnForm.isQuantityBased,
        });
        if (res.success) {
          setBranchAddOns((prev) => [...prev, res.addOn]);
          setSuccess("Custom branch add-on added!");
          setShowAddOnModal(false);
        }
      }
    } catch (err) {
      setError(err.message || "Failed to save add-on.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAddOn = async (id, isGlobal) => {
    if (!confirm("Delete this celebration add-on?")) return;
    setLoading(true);
    setError("");
    try {
      const res = await deleteAddOn(id);
      if (res.success) {
        if (isGlobal) {
          setAllGlobalAddOns((prev) => prev.filter((a) => a.id !== id));
        } else {
          setBranchAddOns((prev) => prev.filter((a) => a.id !== id));
        }
        setSuccess("Add-On removed successfully.");
      }
    } catch (err) {
      setError(err.message || "Failed to delete add-on.");
    } finally {
      setLoading(false);
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const res = await updateBranchDepositSettings(branch.id, depositModeEnabled, depositAmount);
      if (res.success) {
        setSuccess("Deposit Payment Mode configuration saved successfully!");
      } else {
        setError(res.error || "Failed to update deposit settings.");
      }
    } catch (err) {
      setError(err.message || "Error updating deposit settings.");
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
      <div className="flex border-b border-gray-200 dark:border-gray-800 gap-4 overflow-x-auto">
        <button
          onClick={() => setActiveTab("halls")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "halls"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          🏰 Franchise Halls ({halls.length})
        </button>
        <button
          onClick={() => setActiveTab("packages")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "packages"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          🎁 Packages ({allGlobalPackages.length + branchPackages.length})
        </button>
        <button
          onClick={() => setActiveTab("addons")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "addons"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          ✨ Celebration Add-Ons ({allGlobalAddOns.length + branchAddOns.length})
        </button>
        <button
          onClick={() => setActiveTab("payment")}
          className={`pb-3 text-sm font-bold border-b-2 whitespace-nowrap transition-colors ${
            activeTab === "payment"
              ? "border-rose-600 text-rose-600"
              : "border-transparent text-gray-500 hover:text-gray-900 dark:hover:text-white"
          }`}
        >
          💳 Payment & Deposit Mode
        </button>
      </div>

      {/* TAB 1: HALLS MANAGEMENT */}
      {activeTab === "halls" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                🏛️ Celebration Halls for {branch.name}
              </h2>
              <p className="text-xs text-gray-500">
                Each hall operates independently. Customers can choose between Hall 1, Hall 2, etc. when booking time slots.
              </p>
            </div>
            <button
              onClick={handleOpenAddHall}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              ➕ Add New Hall
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {halls.map((h) => (
              <div
                key={h.id}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                      Active Hall
                    </span>
                    {h.capacity ? (
                      <span className="text-xs text-gray-400 font-semibold">
                        👥 Capacity: {h.capacity} guests
                      </span>
                    ) : null}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
                    {h.name}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    Independent slot reservations available for this hall.
                  </p>
                </div>

                <div className="pt-4 mt-6 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                  <button
                    onClick={() => handleOpenEditHall(h)}
                    className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200 font-bold text-xs"
                  >
                    ✏️ Edit Hall
                  </button>
                  <button
                    onClick={() => handleDeleteHall(h.id)}
                    disabled={loading || halls.length <= 1}
                    title={halls.length <= 1 ? "At least 1 hall required" : "Delete hall"}
                    className={`py-2 px-3 rounded-xl font-bold text-xs transition-colors ${
                      halls.length <= 1
                        ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                        : "bg-rose-100 hover:bg-rose-200 text-rose-800"
                    }`}
                  >
                    🗑️
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: PACKAGES MANAGEMENT */}
      {activeTab === "packages" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                🎁 Packages for {branch.name}
              </h2>
              <p className="text-xs text-gray-500">
                Manage all global packages and branch custom packages below. Editable & deletable anytime.
              </p>
            </div>
            <button
              onClick={handleOpenAddPkg}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              ➕ Add Custom Package
            </button>
          </div>

          {/* Branch Custom Packages */}
          {branchPackages.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                🌟 Custom Branch Packages (For {branch.name})
              </span>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {branchPackages.map((pkg) => (
                  <div
                    key={pkg.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-rose-500/40 shadow-xs flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold">
                          {pkg.badge || "Branch Special"}
                        </span>
                        <span className="text-[11px] bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                          Branch Custom
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                        {pkg.name}
                      </h3>
                      <div className="flex items-baseline gap-2 mb-4">
                        <span className="text-2xl font-black text-rose-600">₹{pkg.offerPrice}</span>
                        <span className="text-sm text-gray-400 line-through">₹{pkg.originalPrice}</span>
                      </div>
                      <div className="space-y-1.5 mb-6">
                        <p className="text-xs font-bold text-gray-500 uppercase">Features:</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
                          {pkg.features.map((f, i) => (
                            <li key={i}>{f}</li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                      <button
                        onClick={() => handleOpenEditPkg(pkg)}
                        className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        onClick={() => handleDeletePkg(pkg.id, false)}
                        className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Global Packages (Available to view/edit/delete) */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              📌 Default Global Packages (Editable & Deletable)
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {allGlobalPackages.map((pkg) => (
                <div
                  key={pkg.id}
                  className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <span className="px-3 py-1 rounded-full bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200 text-xs font-bold">
                        {pkg.badge}
                      </span>
                      <span className="text-xs text-gray-400 font-semibold">Global Default</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2">
                      {pkg.name}
                    </h3>
                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="text-xl font-bold text-gray-900 dark:text-white">₹{pkg.offerPrice}</span>
                      <span className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</span>
                    </div>
                    <ul className="text-xs text-gray-500 space-y-1 list-disc list-inside mb-6">
                      {pkg.features.map((f, i) => (
                        <li key={i}>{f}</li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-4 border-t border-gray-100 dark:border-gray-800 flex gap-2">
                    <button
                      onClick={() => handleOpenEditPkg(pkg)}
                      className="flex-1 py-2 rounded-xl bg-gray-100 hover:bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 font-bold text-xs"
                    >
                      ✏️ Edit
                    </button>
                    <button
                      onClick={() => handleDeletePkg(pkg.id, true)}
                      className="py-2 px-3 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: CELEBRATION ADD-ONS MANAGEMENT */}
      {activeTab === "addons" && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                ✨ Celebration Add-Ons for {branch.name}
              </h2>
              <p className="text-xs text-gray-500">
                Optional add-on services shown to customers during booking. Editable & deletable anytime.
              </p>
            </div>
            <button
              onClick={handleOpenAddAddOn}
              className="px-5 py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              ➕ Add Branch Add-On
            </button>
          </div>

          {/* Branch Custom Add-Ons */}
          {branchAddOns.length > 0 && (
            <div className="space-y-3">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">
                🌟 Custom Branch Add-Ons
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {branchAddOns.map((addon) => (
                  <div
                    key={addon.id}
                    className="bg-white dark:bg-gray-900 rounded-3xl p-6 border-2 border-rose-500/40 shadow-xs flex items-center justify-between"
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
                        onClick={() => handleDeleteAddOn(addon.id, false)}
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

          {/* Global Add-Ons */}
          <div className="space-y-3 pt-2">
            <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">
              📌 Default Global Celebration Add-Ons (Editable & Deletable)
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {allGlobalAddOns.map((addon) => (
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
                      onClick={() => handleDeleteAddOn(addon.id, true)}
                      className="p-2.5 rounded-xl bg-rose-100 hover:bg-rose-200 text-rose-800 font-bold text-xs"
                    >
                      🗑️
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 4: PAYMENT & DEPOSIT MODE */}
      {activeTab === "payment" && (
        <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xs max-w-xl">
          <div className="mb-6">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              Branch Payment Settings
            </span>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mt-1">
              Advance Deposit Payment Mode
            </h3>
            <p className="text-xs text-gray-500 mt-1">
              Enable customers to pay an advance deposit (e.g. ₹500) to reserve slots, with the remaining balance due at venue.
            </p>
          </div>

          <form onSubmit={handleDepositSubmit} className="space-y-5">
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700">
              <input
                type="checkbox"
                id="depositModeChk"
                checked={depositModeEnabled}
                onChange={(e) => setDepositModeEnabled(e.target.checked)}
                className="w-5 h-5 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer"
              />
              <label htmlFor="depositModeChk" className="text-xs font-bold text-gray-900 dark:text-white cursor-pointer select-none">
                Allow Customers to Pay Advance Deposit (instead of 100% full payment only)
              </label>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 mb-1">
                Advance Deposit Amount (₹) *
              </label>
              <input
                type="number"
                min={50}
                required
                value={depositAmount}
                onChange={(e) => setDepositAmount(e.target.value)}
                placeholder="500"
                className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white"
              />
              <span className="text-[11px] text-gray-400 block mt-1">
                For deposit bookings, the QR Code will be generated for this exact amount (e.g. ₹500). Remaining balance is collected at venue.
              </span>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="px-6 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md transition-all"
            >
              {loading ? "Saving Configuration..." : "Save Deposit Settings"}
            </button>
          </form>
        </div>
      )}

      {/* HALL MODAL */}
      {showHallModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingHall ? "Edit Hall" : "Add New Branch Hall"}
            </h3>

            <form onSubmit={handleHallSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Hall Name *
                </label>
                <input
                  type="text"
                  required
                  value={hallForm.name}
                  onChange={(e) => setHallForm({ ...hallForm, name: e.target.value })}
                  placeholder="e.g. Hall 1, Hall 2, VIP Hall"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Capacity (Guest Limit)
                </label>
                <input
                  type="number"
                  value={hallForm.capacity}
                  onChange={(e) => setHallForm({ ...hallForm, capacity: e.target.value })}
                  placeholder="15"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowHallModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-gray-700 dark:text-gray-300 font-bold text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md"
                >
                  {loading ? "Saving..." : editingHall ? "Save Hall" : "Create Hall"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* PACKAGE MODAL */}
      {showPkgModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-4">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white">
              {editingPkg ? "Edit Package" : "Add Custom Branch Package"}
            </h3>

            <form onSubmit={handlePkgSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Package Name *
                </label>
                <input
                  type="text"
                  required
                  value={pkgForm.name}
                  onChange={(e) => setPkgForm({ ...pkgForm, name: e.target.value })}
                  placeholder="e.g. VIP Branch Celebration"
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
                    value={pkgForm.badge}
                    onChange={(e) => setPkgForm({ ...pkgForm, badge: e.target.value })}
                    placeholder="e.g. Branch Special"
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
                    value={pkgForm.originalPrice}
                    onChange={(e) => setPkgForm({ ...pkgForm, originalPrice: e.target.value })}
                    placeholder="2500"
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
                  value={pkgForm.offerPrice}
                  onChange={(e) => setPkgForm({ ...pkgForm, offerPrice: e.target.value })}
                  placeholder="1999"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 mb-1">
                  Features & Inclusions (One feature per line)
                </label>
                <textarea
                  rows={5}
                  value={pkgForm.features}
                  onChange={(e) => setPkgForm({ ...pkgForm, features: e.target.value })}
                  placeholder={`AC Hall\nSpecial Entry\nCelebration Cake`}
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
                  value={addOnForm.name}
                  onChange={(e) => setAddOnForm({ ...addOnForm, name: e.target.value })}
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
                  value={addOnForm.price}
                  onChange={(e) => setAddOnForm({ ...addOnForm, price: e.target.value })}
                  placeholder="200"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-sm font-medium text-gray-900 dark:text-white"
                />
              </div>

              <div className="flex items-center gap-2 pt-1 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-200 dark:border-gray-800">
                <input
                  type="checkbox"
                  id="mgrIsQtyBased"
                  checked={addOnForm.isQuantityBased}
                  onChange={(e) => setAddOnForm({ ...addOnForm, isQuantityBased: e.target.checked })}
                  className="w-4 h-4 text-rose-600 rounded border-gray-300 focus:ring-rose-500 cursor-pointer"
                />
                <label htmlFor="mgrIsQtyBased" className="text-xs font-semibold text-gray-800 dark:text-gray-200 cursor-pointer select-none">
                  🔢 Based on Quantity (User can select count with + / -)
                </label>
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
