"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { getBranchSlotStatusForDate, getBranchHalls } from "@/lib/actions";

function getISTDateString(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kolkata",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).format(date);
  } catch {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
  }
}

function isSlotTimePassed(slot, selectedDate) {
  if (slot?.isTimePassed) return true;
  if (!selectedDate) return false;
  try {
    const todayStr = getISTDateString();
    if (selectedDate !== todayStr) return false;

    const istTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    const [curH, curM] = istTimeStr.split(":").map(Number);
    const currentMinutes = curH * 60 + curM;

    const rawTime = (slot?.startTime || "").trim();
    if (!rawTime) return false;
    let timePart = rawTime.split("-")[0].trim().toUpperCase();
    const isPm = timePart.includes("PM");
    const isAm = timePart.includes("AM");
    timePart = timePart.replace(/(AM|PM)/g, "").trim();
    const [hStr, mStr] = timePart.split(":");
    let h = parseInt(hStr, 10);
    const m = parseInt(mStr || "0", 10);
    if (isNaN(h)) return false;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    const slotMinutes = h * 60 + m;

    return slotMinutes <= currentMinutes;
  } catch {
    return false;
  }
}

export default function BranchAvailableSlotsClient({ branchId, branchSlug }) {
  const todayStr = getISTDateString();
  const [selectedDate, setSelectedDate] = useState(todayStr);
  const [halls, setHalls] = useState([]);
  const [selectedHallId, setSelectedHallId] = useState(null);
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch branch halls on mount
  useEffect(() => {
    async function loadHalls() {
      try {
        const res = await getBranchHalls(branchId);
        if (res.success && res.halls && res.halls.length > 0) {
          setHalls(res.halls);
          setSelectedHallId(res.halls[0].id);
        }
      } catch (err) {
        console.error("Error loading halls:", err);
      }
    }
    if (branchId) loadHalls();
  }, [branchId]);

  const fetchSlotsForDate = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getBranchSlotStatusForDate(branchId, selectedDate, selectedHallId);
      if (res.success) {
        setSlots(res.slots);
      }
    } catch (err) {
      console.error("Error loading slots for date:", err);
    } finally {
      setLoading(false);
    }
  }, [branchId, selectedDate, selectedHallId]);

  useEffect(() => {
    fetchSlotsForDate();
  }, [fetchSlotsForDate]);

  // Generate 7 quick date pills
  const getDateOffsetPill = (offsetDays) => {
    const d = new Date();
    d.setDate(d.getDate() + offsetDays);
    const iso = getISTDateString(d);
    const label =
      offsetDays === 0
        ? "Today"
        : offsetDays === 1
        ? "Tomorrow"
        : d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Kolkata" });
    return { iso, label };
  };

  const datePills = [0, 1, 2, 3, 4, 5, 6].map(getDateOffsetPill);

  const [periodFilter, setPeriodFilter] = useState("ALL");

  const getSlotHour = (timeStr) => {
    if (!timeStr) return 0;
    const str = timeStr.trim().toUpperCase();
    const isPm = str.includes("PM");
    const isAm = str.includes("AM");
    const clean = str.replace(/(AM|PM)/g, "").trim();
    let h = parseInt(clean.split(":")[0], 10) || 0;
    if (isPm && h < 12) h += 12;
    if (isAm && h === 12) h = 0;
    return h;
  };

  const filteredSlots = slots.filter((s) => {
    if (periodFilter === "ALL") return true;
    const h = getSlotHour(s.startTime);
    if (periodFilter === "MORNING") return h >= 6 && h < 12;
    if (periodFilter === "AFTERNOON") return h >= 12 && h < 17;
    if (periodFilter === "EVENING") return h >= 17 && h < 22;
    if (periodFilter === "NIGHT") return h >= 22 || h < 6;
    return true;
  });

  return (
    <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md p-6 rounded-3xl border border-gray-200/80 dark:border-gray-800 shadow-md space-y-4">
      <div className="flex flex-col gap-1">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white flex items-center justify-between">
          <span>Available Time Slots (24 Hours)</span>
          <span className="text-xs font-bold text-rose-600 bg-rose-50 dark:bg-rose-950 px-2.5 py-1 rounded-full border border-rose-200 dark:border-rose-900">
            1-Hr Slots • 24/7
          </span>
        </h3>
        <p className="text-xs text-gray-500">
          Choose hall, date, and preferred time period to book your 1-hour private celebration slot:
        </p>
      </div>

      {/* Hall Selector Pills (if multiple halls exist) */}
      {halls.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Select Hall:</span>
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {halls.map((h) => {
              const isSelected = selectedHallId === h.id;
              return (
                <button
                  key={h.id}
                  type="button"
                  onClick={() => setSelectedHallId(h.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    isSelected
                      ? "bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-105"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  🏛️ {h.name}{h.capacity ? ` (${h.capacity} guests)` : ""}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Date Options Pills at Top */}
      <div className="space-y-2 pt-1">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Select Date:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {datePills.map((p) => {
            const isSelected = selectedDate === p.iso;
            return (
              <button
                key={p.iso}
                type="button"
                onClick={() => setSelectedDate(p.iso)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  isSelected
                    ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 shadow-md scale-105"
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

      {/* Time of Day Filter Tabs (Morning, Afternoon, Evening, Night) */}
      <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-gray-800">
        <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">Time Period:</span>
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {[
            { id: "ALL", label: `All 24 Slots (${slots.length})` },
            { id: "MORNING", label: "🌅 Morning (6 AM - 12 PM)" },
            { id: "AFTERNOON", label: "☀️ Afternoon (12 PM - 5 PM)" },
            { id: "EVENING", label: "🌆 Evening (5 PM - 10 PM)" },
            { id: "NIGHT", label: "🌙 Night (10 PM - 6 AM)" },
          ].map((tab) => {
            const isSelected = periodFilter === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setPeriodFilter(tab.id)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer ${
                  isSelected
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Slots Grid for Selected Date & Hall */}
      {loading ? (
        <div className="py-8 text-center text-xs text-gray-400 font-semibold animate-pulse">
          Checking 24 slot availability...
        </div>
      ) : filteredSlots.length === 0 ? (
        <div className="py-6 text-center text-xs text-gray-400">
          No celebration slots found for this time period.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5 pt-2 max-h-[560px] overflow-y-auto pr-1 scrollbar-thin">
          {filteredSlots.map((s) => {
            const isPassed = s.isTimePassed || isSlotTimePassed(s, selectedDate);
            const isAvailable = !s.isBooked && !s.isDisabledForDate && !isPassed;
            const targetHallObj = halls.find((h) => h.id === selectedHallId);
            const hallName = targetHallObj ? targetHallObj.name : "Hall 1";

            return (
              <div
                key={s.id}
                className={`p-3.5 rounded-2xl border transition-all flex flex-col justify-between gap-2.5 ${
                  isAvailable
                    ? "bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-800 hover:border-rose-500 shadow-xs"
                    : "bg-gray-50 dark:bg-gray-800/50 border-gray-200/60 dark:border-gray-800 opacity-75"
                }`}
              >
                <div>
                  <div className="font-bold text-gray-900 dark:text-white text-xs sm:text-sm line-clamp-1">
                    {s.title}
                  </div>
                  <div className="text-[11px] text-gray-500 mt-0.5 flex items-center justify-between">
                    <span>🕒 {s.startTime} - {s.endTime}</span>
                    <span className="text-rose-600 font-semibold">({hallName})</span>
                  </div>
                </div>

                <div className="flex items-center justify-end pt-1 border-t border-gray-100 dark:border-gray-800">
                  {isAvailable ? (
                    <Link
                      href={`/book/${branchSlug}?slotId=${s.id}&date=${selectedDate}${selectedHallId ? `&hallId=${selectedHallId}` : ""}`}
                      className="w-full text-center px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs transition-all hover:scale-102"
                    >
                      Book Slot →
                    </Link>
                  ) : isPassed ? (
                    <span className="w-full text-center px-2 py-1 rounded-xl bg-amber-100 dark:bg-amber-950 text-amber-900 dark:text-amber-200 text-[11px] font-bold">
                      ⏰ Time Passed
                    </span>
                  ) : s.isBooked ? (
                    <span className="w-full text-center px-2 py-1 rounded-xl bg-rose-100 dark:bg-rose-950 text-rose-800 dark:text-rose-300 text-[11px] font-bold">
                      🔴 Booked
                    </span>
                  ) : (
                    <span className="w-full text-center px-2 py-1 rounded-xl bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 text-[11px] font-bold">
                      🚫 Unavailable
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
