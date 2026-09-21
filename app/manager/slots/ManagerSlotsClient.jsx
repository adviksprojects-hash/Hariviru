"use client";

import { useState, useEffect, useCallback } from "react";
import {
  createSlot,
  updateSlot,
  deleteSlot,
  toggleSlotStatus,
  toggleSlotDisabledDate,
  getBranchSlotStatusForDate,
} from "@/lib/actions";

export default function ManagerSlotsClient({ branch, initialSlots }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [slots, setSlots] = useState(initialSlots);
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [dateSlotStatuses, setDateSlotStatuses] = useState([]);
  const [loadingDateSlots, setLoadingDateSlots] = useState(false);

  // Add slot state
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

  // Fetch date specific status whenever date or base slots change
  const fetchDateStatuses = useCallback(async () => {
    setLoadingDateSlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, selectedDate);
      if (res.success) {
        setDateSlotStatuses(res.slots);
      }
    } catch (err) {
      console.error("Failed to fetch date slot status:", err);
    } finally {
      setLoadingDateSlots(false);
    }
  }, [branch.id, selectedDate]);

  useEffect(() => {
    fetchDateStatuses();
  }, [fetchDateStatuses]);

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
        price: 0,
      });

      if (res.success) {
        setSlots([...slots, res.slot]);
        setTitle("");
        fetchDateStatuses();
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
        fetchDateStatuses();
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
        fetchDateStatuses();
      }
    } catch (err) {
      alert("Failed to delete slot: " + err.message);
    }
  };

  const handleToggleSlotGlobal = async (slotId, currentStatus) => {
    try {
      const res = await toggleSlotStatus(slotId, !currentStatus);
      if (res.success) {
        setSlots(slots.map((s) => (s.id === slotId ? { ...s, isActive: !currentStatus } : s)));
        fetchDateStatuses();
      }
    } catch (err) {
      alert("Failed to toggle slot: " + err.message);
    }
  };

  const handleToggleDateDisable = async (slotId) => {
    try {
      const res = await toggleSlotDisabledDate(slotId, selectedDate);
      if (res.success) {
        fetchDateStatuses();
      }
    } catch (err) {
      alert("Failed to update date availability: " + err.message);
    }
  };

  // Quick date pill options (Today, Tomorrow, Day+2, Day+3)
  const getDateOffsetPill = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = d.toISOString().split("T")[0];
    const label =
      offsetDays === 0
        ? "Today"
        : offsetDays === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    return { iso, label };
  };

  const datePills = [0, 1, 2, 3, 4, 5, 6].map(getDateOffsetPill);

  // Summary counts for selected date
  const bookedCount = dateSlotStatuses.filter((s) => s.isBooked).length;
  const disabledCount = dateSlotStatuses.filter((s) => s.isDisabledForDate).length;
  const availableCount = dateSlotStatuses.filter((s) => !s.isBooked && !s.isDisabledForDate).length;

  return (
    <div className="space-y-8">
      
      {/* Date Selector & Per-Date Slot Management Panel */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-sm space-y-6">
        <div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-3">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                📅 Date-Wise Slot Availability & Control
              </h2>
              <p className="text-xs text-gray-500 mt-0.5">
                Slots apply by default every day. Select a date below to view bookings or disable specific slots for that date.
              </p>
            </div>

            {/* Date Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-500">Pick Date:</span>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
          </div>

          {/* Quick Date Pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {datePills.map((p) => {
              const isSelected = selectedDate === p.iso;
              return (
                <button
                  key={p.iso}
                  onClick={() => setSelectedDate(p.iso)}
                  className={`px-3.5 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  {p.label} ({p.iso})
                </button>
              );
            })}
          </div>
        </div>

        {/* Date Overview Summary Badge Bar */}
        <div className="grid grid-cols-3 gap-3 p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-200/80 dark:border-gray-700 text-center">
          <div>
            <span className="text-[11px] font-bold text-gray-500 block uppercase">Available</span>
            <span className="text-2xl font-black text-emerald-600">{availableCount} Slots</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block uppercase">Booked</span>
            <span className="text-2xl font-black text-rose-600">{bookedCount} Slots</span>
          </div>
          <div>
            <span className="text-[11px] font-bold text-gray-500 block uppercase">Disabled for Date</span>
            <span className="text-2xl font-black text-amber-600">{disabledCount} Slots</span>
          </div>
        </div>

        {/* Date Slots List */}
        <div>
          <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-3">
            Slot Status for <span className="text-rose-600">{selectedDate}</span>:
          </h3>

          {loadingDateSlots ? (
            <div className="py-8 text-center text-xs text-gray-400 font-semibold animate-pulse">
              Loading date availability...
            </div>
          ) : dateSlotStatuses.length === 0 ? (
            <div className="py-6 text-center text-xs text-gray-400">No active slots found.</div>
          ) : (
            <div className="space-y-3">
              {dateSlotStatuses.map((st) => (
                <div
                  key={st.id}
                  className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    st.isBooked
                      ? "bg-rose-50/70 dark:bg-rose-950/30 border-rose-200 dark:border-rose-900"
                      : st.isDisabledForDate
                      ? "bg-amber-50/70 dark:bg-amber-950/30 border-amber-200 dark:border-amber-900"
                      : "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800"
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900 dark:text-white text-base">{st.title}</span>
                      <span className="text-xs text-gray-500">({st.startTime} - {st.endTime})</span>
                    </div>

                    {st.isBooked && st.booking && (
                      <div className="mt-1 text-xs font-semibold text-rose-700 dark:text-rose-400">
                        🎟️ Booked by: <span className="font-bold">{st.booking.customerName}</span> ({st.booking.customerPhone}) [Ref: {st.booking.bookingNumber}]
                      </div>
                    )}

                    {st.isDisabledForDate && !st.isBooked && (
                      <div className="mt-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                        🚫 Disabled specifically for {selectedDate} by Manager
                      </div>
                    )}

                    {!st.isBooked && !st.isDisabledForDate && (
                      <div className="mt-1 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                        🟢 Open for Booking on {selectedDate}
                      </div>
                    )}
                  </div>

                  {/* Actions for this specific date */}
                  <div className="flex items-center gap-2 shrink-0">
                    {st.isBooked ? (
                      <span className="px-3 py-1 rounded-full bg-rose-200 text-rose-900 text-xs font-bold">
                        Booked
                      </span>
                    ) : (
                      <button
                        onClick={() => handleToggleDateDisable(st.id)}
                        className={`px-4 py-2 rounded-xl text-xs font-bold transition-all shadow-xs ${
                          st.isDisabledForDate
                            ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                            : "bg-amber-500 hover:bg-amber-600 text-white"
                        }`}
                      >
                        {st.isDisabledForDate ? "Enable for Date ✓" : "Disable for Date 🚫"}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Global Configured Slots List (Edit / Delete / Permanent Toggle) */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          All Configured Time Slots ({branch.name})
        </h2>

        {slots.length === 0 ? (
          <p className="text-sm text-gray-500 py-6 text-center">No slots configured for this branch.</p>
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
                  <span
                    className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                      slot.isActive ? "bg-emerald-100 text-emerald-800" : "bg-gray-100 text-gray-600"
                    }`}
                  >
                    {slot.isActive ? "Active (All Days)" : "Disabled Globally"}
                  </span>

                  <button
                    onClick={() => handleEditSlot(slot)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 text-blue-700 hover:bg-blue-100"
                  >
                    ✏️ Edit
                  </button>

                  <button
                    onClick={() => handleToggleSlotGlobal(slot.id, slot.isActive)}
                    className="text-xs font-semibold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-800"
                  >
                    {slot.isActive ? "Disable Globally" : "Enable Globally"}
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
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                  Slot Title *
                </label>
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
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    Start Time *
                  </label>
                  <input
                    type="time"
                    required
                    value={editStartTime}
                    onChange={(e) => setEditStartTime(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                    End Time *
                  </label>
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

      {/* Add New Slot Form */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">+ Add New Celebration Slot</h2>
        <p className="text-xs text-gray-500 mb-6">
          Create a new daily time window for {branch.name} celebrations (e.g. Evening Party 07:00 PM - 10:00 PM).
        </p>

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
