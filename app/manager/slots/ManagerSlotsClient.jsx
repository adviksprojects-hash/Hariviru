"use client";

import { useState } from "react";
import { createSlot, updateSlot, deleteSlot, toggleSlotStatus } from "@/lib/actions";

export default function ManagerSlotsClient({ branch, initialSlots }) {
  const [slots, setSlots] = useState(initialSlots);

  // Add slot state (No price field mentioned)
  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");

  // Edit slot modal state
  const [editingSlot, setEditingSlot] = useState(null);
  const [editTitle, setEditTitle] = useState("");
  const [editStartTime, setEditStartTime] = useState("09:00");
  const [editEndTime, setEditEndTime] = useState("13:00");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleCreateSlot = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createSlot({
        branchId: branch.id,
        title,
        startTime,
        endTime,
        price: 0, // Default zero - pricing determined by selected package
      });

      if (res.success) {
        setSlots([...slots, res.slot]);
        setTitle("");
      }
    } catch (err) {
      setError(err.message || "Failed to create slot.");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSlot = (slot) => {
    setEditingSlot(slot);
    setEditTitle(slot.title);
    setEditStartTime(slot.startTime);
    setEditEndTime(slot.endTime);
  };

  const handleSaveEdit = async (e) => {
    e.preventDefault();
    if (!editingSlot) return;
    setLoading(true);

    try {
      const res = await updateSlot(editingSlot.id, {
        title: editTitle,
        startTime: editStartTime,
        endTime: editEndTime,
      });

      if (res.success) {
        setSlots(slots.map((s) => (s.id === editingSlot.id ? res.slot : s)));
        setEditingSlot(null);
      }
    } catch (err) {
      alert("Failed to update slot: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSlot = async (slotId) => {
    if (!confirm("Are you sure you want to delete this celebration slot?")) return;
    try {
      const res = await deleteSlot(slotId);
      if (res.success) {
        setSlots(slots.filter((s) => s.id !== slotId));
      }
    } catch (err) {
      alert("Failed to delete slot: " + err.message);
    }
  };

  const handleToggleSlot = async (slotId, currentStatus) => {
    try {
      const res = await toggleSlotStatus(slotId, !currentStatus);
      if (res.success) {
        setSlots(slots.map((s) => (s.id === slotId ? { ...s, isActive: !currentStatus } : s)));
      }
    } catch (err) {
      alert("Failed to toggle slot: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Current Slots List */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Configured Time Slots</h2>

        {slots.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No active slots configured for this branch.</p>
        ) : (
          <div className="space-y-3">
            {slots.map((slot) => (
              <div
                key={slot.id}
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-base">{slot.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">🕒 {slot.startTime} - {slot.endTime}</div>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    slot.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {slot.isActive ? "Active" : "Disabled"}
                  </span>

                  <button
                    onClick={() => handleEditSlot(slot)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleToggleSlot(slot.id, slot.isActive)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {slot.isActive ? "Disable" : "Enable"}
                  </button>

                  <button
                    onClick={() => handleDeleteSlot(slot.id)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Slot Modal */}
      {editingSlot && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-md w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button
              onClick={() => setEditingSlot(null)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold"
            >
              ✕
            </button>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-4">Edit Slot Details</h3>

            <form onSubmit={handleSaveEdit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Slot Title *</label>
                <input
                  type="text"
                  required
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
                  <input
                    type="time"
                    required
                    value={editEndTime}
                    onChange={(e) => setEditEndTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setEditingSlot(null)}
                  className="px-4 py-2 rounded-xl border text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  {loading ? "Saving..." : "Update Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Slot Form (Without Price Field) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">+ Add New Celebration Slot</h2>
        <p className="text-xs text-gray-500 mb-6">Create a new time window for {branch.name} celebrations (e.g. Evening Party 07:00 PM - 10:00 PM).</p>

        {error && (
          <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleCreateSlot} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Slot Title *</label>
            <input
              type="text"
              required
              placeholder="e.g. Midnight Surprise Special"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Start Time *</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">End Time *</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="px-6 py-3 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-md"
          >
            {loading ? "Adding Slot..." : "Create Slot →"}
          </button>
        </form>
      </div>
    </div>
  );
}
