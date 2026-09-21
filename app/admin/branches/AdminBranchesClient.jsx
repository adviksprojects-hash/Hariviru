"use client";

import { useState } from "react";
import { createBranch, updateBranch, deleteBranch, toggleBranchStatus, assignManagerByEmail } from "@/lib/actions";

const SYSTEM_SAMPLE_IMAGES = [
  "https://images.unsplash.com/photo-1519167758481-83f550bb49b3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1530103862676-de8c9debad1d?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1464366400600-7168b8af9bc3?auto=format&fit=crop&w=1200&q=80",
  "https://images.unsplash.com/photo-1513151233558-d860c5398176?auto=format&fit=crop&w=1200&q=80",
];

const PRESET_AMENITIES = [
  "4K Theater",
  "Ambient Lighting",
  "Private Lounge",
  "Theme Decor",
  "Cake & Snacks",
  "HD Sound System",
  "Full AC",
  "100% Private Arena",
];

export default function AdminBranchesClient({ initialBranches }) {
  const [branches, setBranches] = useState(initialBranches);
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingBranch, setEditingBranch] = useState(null);
  const [assigningBranchId, setAssigningBranchId] = useState(null);
  const [managerEmailInput, setManagerEmailInput] = useState("");
  const [customAmenityInput, setCustomAmenityInput] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states for Create & Edit
  const [formData, setFormData] = useState({
    name: "",
    city: "",
    state: "Maharashtra",
    address: "",
    phone: "",
    email: "",
    pricePerSlot: 1499,
    mapUrl: "",
    instagramHandle: "celebration_house_23",
    whatsapp: "9762486649",
    upiId: "9762486649@ybl",
    description: "",
    bannerImage: SYSTEM_SAMPLE_IMAGES[0],
    galleryImages: [SYSTEM_SAMPLE_IMAGES[1], SYSTEM_SAMPLE_IMAGES[2]],
    amenities: ["4K Theater", "Ambient Lighting", "Private Lounge", "Theme Decor", "Cake & Snacks"],
  });

  const resetForm = () => {
    setFormData({
      name: "",
      city: "",
      state: "Maharashtra",
      address: "",
      phone: "",
      email: "",
      pricePerSlot: 1499,
      mapUrl: "",
      instagramHandle: "celebration_house_23",
      whatsapp: "9762486649",
      upiId: "9762486649@ybl",
      description: "",
      bannerImage: SYSTEM_SAMPLE_IMAGES[0],
      galleryImages: [SYSTEM_SAMPLE_IMAGES[1], SYSTEM_SAMPLE_IMAGES[2]],
      amenities: ["4K Theater", "Ambient Lighting", "Private Lounge", "Theme Decor", "Cake & Snacks"],
    });
    setCustomAmenityInput("");
    setError(null);
  };

  const handleBannerFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({ ...prev, bannerImage: reader.result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleGalleryFilesUpload = (e) => {
    const files = Array.from(e.target.files || []);
    files.forEach((file) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData((prev) => ({
          ...prev,
          galleryImages: [...prev.galleryImages, reader.result],
        }));
      };
      reader.readAsDataURL(file);
    });
  };

  const toggleAmenity = (item) => {
    setFormData((prev) => {
      const exists = prev.amenities.includes(item);
      if (exists) {
        return { ...prev, amenities: prev.amenities.filter((a) => a !== item) };
      } else {
        return { ...prev, amenities: [...prev.amenities, item] };
      }
    });
  };

  const handleAddCustomAmenity = (e) => {
    e.preventDefault();
    if (!customAmenityInput.trim()) return;
    const item = customAmenityInput.trim();
    if (!formData.amenities.includes(item)) {
      setFormData((prev) => ({ ...prev, amenities: [...prev.amenities, item] }));
    }
    setCustomAmenityInput("");
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const allImages = [formData.bannerImage, ...formData.galleryImages].filter(Boolean);
      const res = await createBranch({
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        pricePerSlot: formData.pricePerSlot,
        mapUrl: formData.mapUrl || `https://maps.google.com/?q=${encodeURIComponent(formData.address + " " + formData.city)}`,
        instagramHandle: formData.instagramHandle || "celebration_house_23",
        whatsapp: formData.whatsapp || formData.phone.replace(/[^0-9]/g, ""),
        upiId: formData.upiId || "9762486649@ybl",
        description: formData.description,
        images: allImages,
        amenities: formData.amenities,
      });

      if (res.success) {
        setBranches([res.branch, ...branches]);
        setShowAddModal(false);
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to create franchise branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEdit = (branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name || "",
      city: branch.city || "",
      state: branch.state || "Maharashtra",
      address: branch.address || "",
      phone: branch.phone || "",
      email: branch.email || "",
      pricePerSlot: branch.pricePerSlot || 1499,
      mapUrl: branch.mapUrl || "",
      instagramHandle: branch.instagramHandle || "celebration_house_23",
      whatsapp: branch.whatsapp || "",
      upiId: branch.upiId || "9762486649@ybl",
      description: branch.description || "",
      bannerImage: branch.images?.[0] || SYSTEM_SAMPLE_IMAGES[0],
      galleryImages: branch.images?.slice(1) || [SYSTEM_SAMPLE_IMAGES[1]],
      amenities: branch.amenities || ["4K Theater", "Ambient Lighting", "Private Lounge", "Theme Decor"],
    });
    setCustomAmenityInput("");
    setError(null);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editingBranch) return;
    setLoading(true);
    setError(null);

    try {
      const allImages = [formData.bannerImage, ...formData.galleryImages].filter(Boolean);
      const res = await updateBranch(editingBranch.id, {
        name: formData.name,
        city: formData.city,
        state: formData.state,
        address: formData.address,
        phone: formData.phone,
        email: formData.email,
        pricePerSlot: formData.pricePerSlot,
        mapUrl: formData.mapUrl,
        instagramHandle: formData.instagramHandle,
        whatsapp: formData.whatsapp,
        upiId: formData.upiId,
        description: formData.description,
        images: allImages,
        amenities: formData.amenities,
      });

      if (res.success) {
        setBranches(branches.map((b) => (b.id === editingBranch.id ? res.branch : b)));
        setEditingBranch(null);
        resetForm();
      }
    } catch (err) {
      setError(err.message || "Failed to update franchise branch.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (branchId, branchName) => {
    if (!confirm(`Are you sure you want to delete the franchise branch "${branchName}"? This will remove all associated slots and bookings.`)) return;
    try {
      const res = await deleteBranch(branchId);
      if (res.success) {
        setBranches(branches.filter((b) => b.id !== branchId));
      }
    } catch (err) {
      alert("Error deleting branch: " + err.message);
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

  const handleAssignManagerByEmail = async (e) => {
    e.preventDefault();
    if (!assigningBranchId || !managerEmailInput) return;
    setLoading(true);

    try {
      const res = await assignManagerByEmail(managerEmailInput, assigningBranchId);
      if (res.success) {
        alert(`Successfully assigned manager role to ${managerEmailInput}!`);
        setAssigningBranchId(null);
        setManagerEmailInput("");
        setBranches(branches.map(b => b.id === assigningBranchId ? {
          ...b,
          managers: [{ name: res.user.name, email: res.user.email }]
        } : b));
      }
    } catch (err) {
      alert("Failed to assign manager: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white">Franchise Branches</h2>
          <p className="text-xs text-gray-500">Add, edit, delete, configure customer amenities, set images, and assign managers by email.</p>
        </div>

        <button
          onClick={() => {
            resetForm();
            setShowAddModal(true);
          }}
          className="px-6 py-3 rounded-full bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-sm shadow-md hover:opacity-90 transition-opacity"
        >
          + Add New Franchise Branch
        </button>
      </div>

      {/* Add / Edit Franchise Modal */}
      {(showAddModal || editingBranch) && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowAddModal(false);
                setEditingBranch(null);
              }}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>

            <h2 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
              {editingBranch ? `Edit Franchise: ${editingBranch.name}` : "Add New HaruViru Franchise Branch"}
            </h2>
            <p className="text-xs text-gray-500 mb-6">Configure branch details, banner/gallery slider images, and customer amenities.</p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={editingBranch ? handleUpdate : handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Franchise Branch Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="HaruViru Shikrapur Pune"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">City *</label>
                  <input
                    type="text"
                    required
                    placeholder="Pune"
                    value={formData.city}
                    onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Address *</label>
                  <input
                    type="text"
                    required
                    placeholder="Main Highway, Shikrapur"
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">State</label>
                  <input
                    type="text"
                    value={formData.state}
                    onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                    className="w-full px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 97624 86649"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">WhatsApp Number</label>
                  <input
                    type="tel"
                    placeholder="9762486649"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Instagram Handle</label>
                  <input
                    type="text"
                    placeholder="celebration_house_shikrapur"
                    value={formData.instagramHandle}
                    onChange={(e) => setFormData({ ...formData, instagramHandle: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">UPI ID for QR Code *</label>
                  <input
                    type="text"
                    required
                    placeholder="9762486649@ybl"
                    value={formData.upiId}
                    onChange={(e) => setFormData({ ...formData, upiId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-xs font-mono font-bold text-rose-600"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Google Maps URL</label>
                <input
                  type="url"
                  placeholder="https://maps.google.com/?q=..."
                  value={formData.mapUrl}
                  onChange={(e) => setFormData({ ...formData, mapUrl: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-xs"
                />
              </div>

              {/* Included Amenities & Highlights Admin Configurator */}
              <div className="p-4 rounded-2xl bg-rose-50/60 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900">
                <label className="block text-xs font-bold text-rose-900 dark:text-rose-300 mb-2">
                  ✨ Included Amenities & Highlights (Shown to Customer)
                </label>

                <div className="flex flex-wrap gap-2 mb-3">
                  {PRESET_AMENITIES.map((item, idx) => {
                    const selected = formData.amenities.includes(item);
                    return (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => toggleAmenity(item)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-colors ${
                          selected
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                        }`}
                      >
                        {selected ? "✓ " : "+ "}{item}
                      </button>
                    );
                  })}
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="Add custom amenity (e.g. Fog Machine, Smoke Entrance)..."
                    value={customAmenityInput}
                    onChange={(e) => setCustomAmenityInput(e.target.value)}
                    className="flex-1 px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border text-xs"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomAmenity}
                    className="px-4 py-1.5 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold text-xs shrink-0"
                  >
                    + Add
                  </button>
                </div>
              </div>

              {/* Banner Image Selection (File Upload + Presets) */}
              <div className="p-4 rounded-2xl bg-amber-50/50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900">
                <label className="block text-xs font-bold text-amber-900 dark:text-amber-300 mb-2">
                  🖼️ Banner Image (Upload from System or Pick Preset)
                </label>

                <div className="flex flex-col sm:flex-row items-center gap-3 mb-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleBannerFileUpload}
                    className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-rose-600 file:text-white hover:file:bg-rose-700"
                  />
                  <span className="text-xs text-gray-400">or enter image URL:</span>
                </div>

                <input
                  type="text"
                  placeholder="Image URL..."
                  value={formData.bannerImage}
                  onChange={(e) => setFormData({ ...formData, bannerImage: e.target.value })}
                  className="w-full px-3 py-1.5 rounded-xl bg-white dark:bg-gray-800 border text-xs mb-3"
                />

                <div className="text-[11px] font-semibold text-gray-500 mb-1.5">System Presets:</div>
                <div className="grid grid-cols-4 gap-2">
                  {SYSTEM_SAMPLE_IMAGES.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setFormData({ ...formData, bannerImage: img })}
                      className={`h-14 rounded-xl overflow-hidden border-2 ${
                        formData.bannerImage === img ? "border-rose-600 scale-95" : "border-transparent opacity-70"
                      }`}
                    >
                      <img src={img} alt={`Preset ${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Additional Gallery Images Selection (File Upload Multiple) */}
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-2">
                  📸 Additional Gallery Photos for Frame Slider (Add Multiple from System)
                </label>

                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleGalleryFilesUpload}
                  className="text-xs text-gray-500 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-gray-900 file:text-white hover:file:bg-black mb-3"
                />

                <div className="flex flex-wrap gap-2">
                  {formData.galleryImages.map((img, idx) => (
                    <div key={idx} className="relative w-16 h-16 rounded-xl overflow-hidden border border-gray-300">
                      <img src={img} alt={`Gallery ${idx + 1}`} className="w-full h-full object-cover" />
                      <button
                        type="button"
                        onClick={() =>
                          setFormData({
                            ...formData,
                            galleryImages: formData.galleryImages.filter((_, i) => i !== idx),
                          })
                        }
                        className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-600 text-white rounded-full text-[10px] font-bold flex items-center justify-center"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Franchise Description</label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Luxurious celebration house with ambient LED lighting, private 4K screening..."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddModal(false);
                    setEditingBranch(null);
                  }}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
                >
                  {loading ? "Saving..." : editingBranch ? "Update Franchise" : "Save New Franchise"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Manager by Email Modal */}
      {assigningBranchId && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button
              onClick={() => setAssigningBranchId(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
            <h3 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              Assign Manager by Email
            </h3>
            <p className="text-xs text-gray-500 mb-6">
              Enter manager's email address to assign them to {branches.find(b => b.id === assigningBranchId)?.name}.
            </p>

            <form onSubmit={handleAssignManagerByEmail} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Manager Email Address *</label>
                <input
                  type="email"
                  required
                  placeholder="manager@haruviru.com"
                  value={managerEmailInput}
                  onChange={(e) => setManagerEmailInput(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setAssigningBranchId(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  {loading ? "Assigning..." : "Send Role Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Branches Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {branches.map((b) => (
          <div key={b.id} className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between">
            <div>
              <div className="relative h-44 rounded-2xl overflow-hidden mb-4 bg-gray-100">
                <img
                  src={b.images?.[0] || SYSTEM_SAMPLE_IMAGES[0]}
                  alt={b.name}
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-md text-white px-3 py-1 rounded-full text-xs font-bold">
                  📍 {b.city}, {b.state}
                </div>

                <button
                  onClick={() => handleToggle(b.id, b.isActive)}
                  className={`absolute top-3 right-3 text-xs font-bold px-3 py-1 rounded-full ${
                    b.isActive ? "bg-emerald-500 text-white" : "bg-rose-500 text-white"
                  }`}
                >
                  {b.isActive ? "Active" : "Disabled"}
                </button>
              </div>

              <h3 className="text-2xl font-black text-gray-900 dark:text-white">{b.name}</h3>
              <p className="text-xs text-gray-500 mt-1">📍 {b.address}</p>

              {/* Configured Amenities Pills */}
              <div className="mt-3 flex flex-wrap gap-1.5">
                {b.amenities?.map((item, idx) => (
                  <span key={idx} className="px-2 py-0.5 rounded-md bg-rose-50 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-[11px] font-bold">
                    ✨ {item}
                  </span>
                ))}
              </div>

              <div className="mt-4 p-3 rounded-2xl bg-gray-50 dark:bg-gray-800 flex items-center justify-between text-xs">
                <div>
                  <span className="text-gray-400 font-semibold block text-[10px]">ASSIGNED MANAGER:</span>
                  <span className="font-bold text-gray-800 dark:text-gray-200">
                    {b.managers?.[0]?.name || b.managers?.[0]?.email || "Unassigned"}
                  </span>
                </div>
                <button
                  onClick={() => {
                    setAssigningBranchId(b.id);
                    setManagerEmailInput(b.managers?.[0]?.email || "");
                  }}
                  className="px-3 py-1.5 rounded-xl bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 font-bold text-[11px]"
                >
                  ✉️ Assign Manager by Email
                </button>
              </div>

              <div className="mt-3 flex flex-wrap gap-2 text-xs text-gray-600 dark:text-gray-400">
                <div>📞 {b.phone}</div>
                <div>💬 WA: {b.whatsapp || b.phone}</div>
                <div>📸 @{b.instagramHandle || "celebration_house_23"}</div>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenEdit(b)}
                  className="px-3.5 py-1.5 rounded-xl bg-blue-50 text-blue-700 border border-blue-200 text-xs font-bold hover:bg-blue-100"
                >
                  ✏️ Edit Franchise
                </button>

                <button
                  onClick={() => handleDelete(b.id, b.name)}
                  className="px-3.5 py-1.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 text-xs font-bold hover:bg-rose-100"
                >
                  🗑️ Delete
                </button>
              </div>

              <a
                href={`/branches/${b.slug}`}
                target="_blank"
                className="text-xs font-bold text-rose-600 hover:underline"
              >
                View Page ↗
              </a>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
