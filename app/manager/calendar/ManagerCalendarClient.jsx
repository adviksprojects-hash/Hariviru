"use client";

import { useState, useEffect, useCallback } from "react";
import { getBranchSlotStatusForDate, getBranchCalendarBookingsForMonth, toggleSlotDisabledDate } from "@/lib/actions";
import ManagerOfflineBookingModal from "../bookings/ManagerOfflineBookingModal";

export default function ManagerCalendarClient({ branch, halls = [], packages = [], addOns = [] }) {
  const today = new Date();
  const [currentYear, setCurrentYear] = useState(today.getFullYear());
  const [currentMonth, setCurrentMonth] = useState(today.getMonth() + 1); // 1-12
  const [selectedDateStr, setSelectedDateStr] = useState(today.toISOString().split("T")[0]);
  const [selectedHallId, setSelectedHallId] = useState(halls[0]?.id || null);

  const [monthBookings, setMonthBookings] = useState([]);
  const [loadingMonth, setLoadingMonth] = useState(true);

  const [daySlots, setDaySlots] = useState([]);
  const [loadingDaySlots, setLoadingDaySlots] = useState(true);

  // Offline Modal State
  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [preSelectedSlotId, setPreSelectedSlotId] = useState("");

  const fetchMonthBookings = useCallback(async () => {
    setLoadingMonth(true);
    try {
      const res = await getBranchCalendarBookingsForMonth(branch.id, currentYear, currentMonth);
      if (res.success) {
        setMonthBookings(res.bookings);
      }
    } catch (err) {
      console.error("Failed to load month calendar bookings:", err);
    } finally {
      setLoadingMonth(false);
    }
  }, [branch.id, currentYear, currentMonth]);

  useEffect(() => {
    fetchMonthBookings();
  }, [fetchMonthBookings]);

  const fetchDaySlots = useCallback(async () => {
    setLoadingDaySlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, selectedDateStr, selectedHallId);
      if (res.success) {
        setDaySlots(res.slots);
      }
    } catch (err) {
      console.error("Failed to load day slots:", err);
    } finally {
      setLoadingDaySlots(false);
    }
  }, [branch.id, selectedDateStr, selectedHallId]);

  useEffect(() => {
    fetchDaySlots();
  }, [fetchDaySlots]);

  const handlePrevMonth = () => {
    if (currentMonth === 1) {
      setCurrentMonth(12);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 12) {
      setCurrentMonth(1);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const monthName = new Date(currentYear, currentMonth - 1, 1).toLocaleString("en-US", {
    month: "long",
    year: "numeric",
  });

  // Calculate calendar matrix days
  const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
  const firstDayOfWeek = new Date(currentYear, currentMonth - 1, 1).getDay(); // 0 = Sun

  const calendarCells = [];
  for (let i = 0; i < firstDayOfWeek; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    const dStr = `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    calendarCells.push({ dayNum: d, dateStr: dStr });
  }

  // Count bookings per date string
  const bookingsPerDateMap = new Map();
  monthBookings.forEach((b) => {
    const bDate = new Date(b.bookingDate).toISOString().split("T")[0];
    bookingsPerDateMap.set(bDate, (bookingsPerDateMap.get(bDate) || 0) + 1);
  });

  const handleOpenOfflineModal = (slotId = "") => {
    setPreSelectedSlotId(slotId);
    setShowOfflineModal(true);
  };

  const handleBookingCreated = () => {
    fetchMonthBookings();
    fetchDaySlots();
  };

  const handleToggleDateDisable = async (slotId) => {
    try {
      const res = await toggleSlotDisabledDate(slotId, selectedDateStr);
      if (res.success) {
        fetchDaySlots();
      }
    } catch (err) {
      alert("Failed to toggle slot date availability: " + err.message);
    }
  };

  return (
    <div className="space-y-8">
      {/* Hall Selector Header */}
      {halls.length > 0 && (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-200 dark:border-gray-800 flex flex-wrap items-center justify-between gap-4 shadow-xs">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold uppercase text-gray-500 tracking-wider">Hall View:</span>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedHallId(null)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                  selectedHallId === null
                    ? "bg-rose-600 text-white shadow-xs"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                All Halls Combined
              </button>
              {halls.map((h) => (
                <button
                  key={h.id}
                  onClick={() => setSelectedHallId(h.id)}
                  className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all ${
                    selectedHallId === h.id
                      ? "bg-rose-600 text-white shadow-xs"
                      : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                  }`}
                >
                  🏛️ {h.name}
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={() => handleOpenOfflineModal()}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            + Log Walk-in Booking
          </button>
        </div>
      )}

      {/* Main Grid: Left Calendar, Right Day Slot Details */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Monthly Calendar View (7 Columns) */}
        <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
          {/* Month Header Navigation */}
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={handlePrevMonth}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              ← Prev
            </button>
            <h2 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
              {monthName}
            </h2>
            <button
              onClick={handleNextMonth}
              className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              Next →
            </button>
          </div>

          {/* Days of Week Header */}
          <div className="grid grid-cols-7 gap-2 text-center text-xs font-bold text-gray-400 uppercase mb-2">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          {/* Calendar Grid */}
          {loadingMonth ? (
            <div className="py-20 text-center text-xs text-gray-400 font-semibold animate-pulse">
              Loading calendar bookings...
            </div>
          ) : (
            <div className="grid grid-cols-7 gap-2">
              {calendarCells.map((cell, idx) => {
                if (!cell) {
                  return <div key={`empty-${idx}`} className="h-20 rounded-2xl bg-gray-50/40 dark:bg-gray-800/10"></div>;
                }

                const isSelected = selectedDateStr === cell.dateStr;
                const isTodayStr = today.toISOString().split("T")[0] === cell.dateStr;
                const bookingCount = bookingsPerDateMap.get(cell.dateStr) || 0;

                return (
                  <button
                    key={cell.dateStr}
                    onClick={() => setSelectedDateStr(cell.dateStr)}
                    className={`h-20 p-2 rounded-2xl border text-left flex flex-col justify-between transition-all relative ${
                      isSelected
                        ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500 shadow-md"
                        : isTodayStr
                        ? "border-amber-400 bg-amber-50/50 dark:bg-amber-950/20"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className={`text-xs font-black ${isTodayStr ? "text-amber-600" : "text-gray-900 dark:text-white"}`}>
                        {cell.dayNum}
                      </span>
                      {isTodayStr && (
                        <span className="w-2 h-2 rounded-full bg-amber-500 animate-ping"></span>
                      )}
                    </div>

                    {bookingCount > 0 ? (
                      <span className="px-2 py-0.5 rounded-md bg-rose-600 text-white font-extrabold text-[10px] text-center shadow-xs">
                        {bookingCount} Booked
                      </span>
                    ) : (
                      <span className="text-[10px] text-emerald-600 font-semibold">
                        Available
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Selected Date Slot Detail Panel */}
        <div className="lg:col-span-5 bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
            <div>
              <span className="text-[11px] font-bold text-rose-600 uppercase tracking-wider block">
                Slot Timeline
              </span>
              <h3 className="text-lg font-black text-gray-900 dark:text-white mt-0.5">
                📅 {new Date(selectedDateStr).toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric" })}
              </h3>
            </div>

            <button
              onClick={() => handleOpenOfflineModal()}
              className="px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs hover:bg-rose-700"
            >
              + Walk-in Booking
            </button>
          </div>

          {loadingDaySlots ? (
            <div className="py-12 text-center text-xs text-gray-400 font-semibold animate-pulse">
              Loading slot statuses for selected date...
            </div>
          ) : daySlots.length === 0 ? (
            <div className="py-8 text-center text-xs text-gray-500">
              No active slots found for this branch.
            </div>
          ) : (
            <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
              {daySlots.map((s) => {
                const isBooked = s.isBooked;
                const isTimePassed = s.isTimePassed;
                const isAvailable = !isBooked && !isTimePassed && !s.isDisabledForDate;

                return (
                  <div
                    key={s.id}
                    className={`p-4 rounded-2xl border transition-all ${
                      isBooked
                        ? "border-rose-200 bg-rose-50/50 dark:bg-rose-950/30 dark:border-rose-900"
                        : isTimePassed
                        ? "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40 opacity-70"
                        : "border-emerald-200 bg-emerald-50/30 dark:bg-emerald-950/20 dark:border-emerald-900"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <div className="font-bold text-sm text-gray-900 dark:text-white">
                        {s.title}
                      </div>

                      {s.isDisabledForDate ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                          🚫 DISABLED FOR DATE
                        </span>
                      ) : isBooked ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-rose-600 text-white text-[11px] font-extrabold shadow-xs">
                          🔴 BOOKED
                        </span>
                      ) : isTimePassed ? (
                        <span className="px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 text-[11px] font-bold">
                          ⏰ TIME PASSED
                        </span>
                      ) : (
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-600 text-white text-[11px] font-bold">
                          🟢 AVAILABLE
                        </span>
                      )}
                    </div>

                    <div className="text-xs text-gray-500 flex items-center justify-between">
                      <span>🕒 {s.startTime} - {s.endTime}</span>
                    </div>

                    {/* If Booked, display customer details */}
                    {isBooked && s.booking && (
                      <div className="mt-3 p-2.5 rounded-xl bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-950 text-xs space-y-1">
                        <div className="flex justify-between font-mono font-bold text-gray-900 dark:text-white">
                          <span>Ref: {s.booking.bookingNumber}</span>
                          <span className="text-rose-600">{s.booking.bookingStatus}</span>
                        </div>
                        <div className="font-semibold text-gray-800 dark:text-gray-200">
                          👤 {s.booking.customerName}
                        </div>
                        <div className="text-[11px] text-gray-500">
                          📞 {s.booking.customerPhone}
                        </div>
                        {s.booking.hallName && (
                          <div className="text-[10px] text-purple-600 font-semibold">
                            🏛️ {s.booking.hallName}
                          </div>
                        )}
                      </div>
                    )}

                    {/* Controls: Book Walk-in or Disable/Enable for Date */}
                    <div className="mt-3 flex items-center gap-2">
                      {isAvailable && (
                        <button
                          onClick={() => handleOpenOfflineModal(s.id)}
                          className="flex-1 py-1.5 rounded-xl bg-white dark:bg-gray-800 border border-emerald-300 dark:border-emerald-700 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-50 transition-colors shadow-2xs"
                        >
                          + Walk-in Book
                        </button>
                      )}

                      {!isBooked && (
                        <button
                          onClick={() => handleToggleDateDisable(s.id)}
                          className={`py-1.5 px-3 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                            s.isDisabledForDate
                              ? "bg-emerald-600 hover:bg-emerald-700 text-white"
                              : "bg-amber-100 hover:bg-amber-200 text-amber-900 dark:bg-amber-950 dark:text-amber-200"
                          }`}
                        >
                          {s.isDisabledForDate ? "Enable for Date ✓" : "Disable for Date 🚫"}
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Shared Reusable Manager Offline Booking Modal */}
      {showOfflineModal && (
        <ManagerOfflineBookingModal
          branch={branch}
          halls={halls}
          packages={packages}
          addOns={addOns}
          initialDate={selectedDateStr}
          initialSlotId={preSelectedSlotId}
          initialHallId={selectedHallId}
          onClose={() => setShowOfflineModal(false)}
          onSuccess={handleBookingCreated}
        />
      )}
    </div>
  );
}
