"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBranchSlotStatusForDate } from "@/lib/actions";

export default function BranchAvailableSlotsClient({ branchId, branchSlug }) {
  const todayStr = new Date().toISOString().split("T")[0];
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchSlotsForDate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBranchSlotStatusForDate(branchId, selectedDate);
      if (res.success) {
        setSlots(res.slots);
      }
    } catch (err) {
      console.error("Error loading slots for date:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate]);

  useEffect(() => {
    fetchSlotsForDate();
  }, [fetchSlotsForDate]);

  // Generate 7 quick date pills
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

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md">
      <div className="flex flex-col gap-2 mb-4">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
          <span>Available Time Slots</span>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            Date-Wise
          </span>
        </h3>
        <p className="text-xs text-gray-500">
          Select your celebration date below to view unbooked slots:
        </p>
      </div>

      {/* Date Options Pills at Top */}
      <div className="mb-6 space-y-2">
        <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none">
          {datePills.map((p) => {
            const isSelected = selectedDate === p.iso;
            return (
              <button
                key={p.iso}
                type="button"
                onClick={() => setSelectedDate(p.iso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-105"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>

        {/* Custom Date Picker */}
        <div className="flex items-center justify-between pt-1 text-xs">
          <span className="text-gray-500 font-semibold">Pick Specific Date:</span>
          <input
            type="date"
            min={todayStr}
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-2.5 py-1 rounded-lg border border-gray-300 dark:border-gray-700 text-xs font-bold bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
          />
        </div>
      </div>

      {/* Slots List for Selected Date */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 font-semibold animate-pulse">
          Checking slot availability for {selectedDate}...
        </div>
      ) : slots.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          No celebration slots configured for this date.
        </div>
      ) : (
        <div className="space-y-3">
          {slots.map((s) => {
            const isAvailable = !s.isBooked && !s.isDisabledForDate;
            return (
              <div
                key={s.id}
                className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${
                  isAvailable
                    ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-rose-500 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-800 opacity-75"
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-sm">{s.title}</div>
                  <div className="text-xs text-gray-500">🕒 {s.startTime} - {s.endTime}</div>
                </div>

                {isAvailable ? (
                  <Link
                    href={`/book/${branchSlug}?slotId=${s.id}&date=${selectedDate}`}
                    className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs shadow-md transition-all hover:scale-105"
                  >
                    Book Slot →
                  </Link>
                ) : s.isBooked ? (
                  <span className="px-3 py-1.5 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-xs font-bold">
                    🔴 Booked
                  </span>
                ) : (
                  <span className="px-3 py-1.5 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-xs font-bold">
                    🚫 Unavailable
                  </span>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
