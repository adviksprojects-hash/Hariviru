"use client";

import { useState } from "react";
import { createSlot, toggleSlotStatus } from "@/lib/actions";

export default function ManagerSlotsClient({ branch, initialSlots }) {
  const [slots, setSlots] = useState(initialSlots);

  const [title, setTitle] = useState("");
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("13:00");
  const [price, setPrice] = useState(branch.pricePerSlot || 5000);

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
        price,
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
                className="p-4 rounded-2xl border border-gray-200 dark:border-gray-800 flex items-center justify-between"
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white">{slot.title}</div>
                  <div className="text-xs text-gray-500 mt-0.5">🕒 {slot.startTime} - {slot.endTime}</div>
                  <div className="text-sm font-black text-rose-600 mt-1">₹{slot.price} per slot</div>
                </div>

                <div className="flex items-center gap-3">
                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                    slot.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                  }`}>
                    {slot.isActive ? "Active" : "Disabled"}
                  </span>

                  <button
                    onClick={() => handleToggleSlot(slot.id, slot.isActive)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {slot.isActive ? "Disable Slot" : "Enable Slot"}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add New Slot Form */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">+ Add New Celebration Slot</h2>
        <p className="text-xs text-gray-500 mb-6">Create a new time window (e.g. Midnight Special 11:30 PM - 2:30 AM).</p>

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

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
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

            <div>
              <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Price (₹) *</label>
              <input
                type="number"
                required
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm font-bold"
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
