"use client";

import { useState, useEffect, useCallback } from "react";
import { createOfflineBooking, getBranchSlotStatusForDate } from "@/lib/actions";
import { packageAddOns } from "@/data/PackageData/PackageData";

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
  if (!selectedDate) return false;
  try {
    const todayStr = getISTDateString();
    // 1. Future dates (Tomorrow and onwards) can NEVER have time-passed slots
    if (selectedDate > todayStr) return false;

    // 2. Past dates (Yesterday and earlier) are always time passed
    if (selectedDate < todayStr) return true;

    // 3. For Today: check server flag first, or compute client-side using Indian Standard Time
    if (slot?.isTimePassed) return true;

    const istTimeStr = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Kolkata",
      hour12: false,
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date());

    const [curH, curM] = istTimeStr.split(":").map(Number);
    const cleanH = curH === 24 ? 0 : (curH || 0);
    const currentMinutes = cleanH * 60 + (curM || 0);

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

export default function ManagerOfflineBookingModal({
  branch,
  halls = [],
  packages = [],
  addOns = [],
  initialDate,
  initialSlotId,
  initialHallId,
  initialMode = "STANDARD",
  onClose,
  onSuccess,
}) {
  const todayStr = getISTDateString();

  const activePackages = packages && packages.length > 0 ? packages : [];
  const activeHalls = halls && halls.length > 0 ? halls : [{ id: null, name: "Hall 1" }];
  const activeAddOns = addOns && addOns.length > 0 ? addOns : packageAddOns;

  // Booking Mode: "STANDARD" (uses slot) or "EXTRA" (custom timing beyond slots)
  const [bookingMode, setBookingMode] = useState(initialMode || "STANDARD");
  const [customTiming, setCustomTiming] = useState("11:30 PM - 1:00 AM");

  const [selectedHallId, setSelectedHallId] = useState(
    initialHallId || (activeHalls[0] ? activeHalls[0].id : null)
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    activePackages[0] ? activePackages[0].id : ""
  );
  const [bookingDate, setBookingDate] = useState(initialDate || todayStr);
  const [slotStatuses, setSlotStatuses] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId || "");
  const [selectedAddOns, setSelectedAddOns] = useState({}); // { [addonId]: quantity }
  const [eventCategory, setEventCategory] = useState("Birthday");

  // Customer Details
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");

  // Payment Calculation states
  const [amountPaidInput, setAmountPaidInput] = useState("");
  const [isCustomPaidInput, setIsCustomPaidInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [slotPeriodFilter, setSlotPeriodFilter] = useState("ALL");

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

  // Fetch slot status dynamically for chosen date & hall (for standard walk-in mode)
  const fetchSlotStatuses = useCallback(async () => {
    if (bookingMode === "EXTRA") return;
    setLoadingSlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, bookingDate, selectedHallId);
      if (res.success) {
        setSlotStatuses(res.slots);

        const currentSlotObj = res.slots.find((s) => s.id === selectedSlotId);
        const isCurrentAvailable =
          currentSlotObj &&
          !currentSlotObj.isBooked &&
          !currentSlotObj.isDisabledForDate &&
          !isSlotTimePassed(currentSlotObj, bookingDate);

        if (!isCurrentAvailable) {
          const firstAvail = res.slots.find(
            (s) => !s.isBooked && !s.isDisabledForDate && !isSlotTimePassed(s, bookingDate)
          );
          setSelectedSlotId(firstAvail ? firstAvail.id : "");
        }
      }
    } catch (err) {
      console.error("Failed to load slot statuses:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch.id, bookingDate, selectedHallId, selectedSlotId, bookingMode]);

  useEffect(() => {
    fetchSlotStatuses();
  }, [bookingDate, selectedHallId, bookingMode]);

  const selectedPackage =
    activePackages.find((p) => p.id === selectedPackageId) || activePackages[0];
  const selectedHall = activeHalls.find((h) => h.id === selectedHallId) || activeHalls[0];
  const selectedSlot = slotStatuses.find((s) => s.id === selectedSlotId);

  // Calculate total price: Package price + selected add-ons * quantity
  const addOnsTotal = Object.entries(selectedAddOns).reduce((sum, [addonId, qty]) => {
    if (!qty || qty <= 0) return sum;
    const addon = activeAddOns.find((a) => a.id === addonId);
    return sum + (addon ? addon.price * qty : 0);
  }, 0);

  const basePackagePrice = selectedPackage
    ? selectedPackage.offerPrice || selectedPackage.originalPrice
    : branch.pricePerSlot || 1499;

  const totalPrice = basePackagePrice + addOnsTotal;

  // Auto-sync amount paid if user hasn't explicitly customized it
  const paidAmount = isCustomPaidInput
    ? Math.min(totalPrice, Math.max(0, parseFloat(amountPaidInput) || 0))
    : totalPrice;

  const balanceAmount = Math.max(0, totalPrice - paidAmount);
  const paymentStatusComputed = balanceAmount === 0 ? "PAID" : paidAmount > 0 ? "PARTIAL" : "PENDING";

  const toggleAddOn = (addon) => {
    const currentQty = selectedAddOns[addon.id] || 0;
    if (currentQty > 0) {
      const updated = { ...selectedAddOns };
      delete updated[addon.id];
      setSelectedAddOns(updated);
    } else {
      setSelectedAddOns({ ...selectedAddOns, [addon.id]: 1 });
    }
  };

  const updateAddOnQty = (addonId, delta, e) => {
    e.stopPropagation();
    const currentQty = selectedAddOns[addonId] || 1;
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      const updated = { ...selectedAddOns };
      delete updated[addonId];
      setSelectedAddOns(updated);
    } else {
      setSelectedAddOns({ ...selectedAddOns, [addonId]: newQty });
    }
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();

    if (bookingMode === "STANDARD" && !selectedSlotId) {
      setError("Please select an available time slot for your chosen date & hall.");
      return;
    }
    if (bookingMode === "EXTRA" && (!customTiming || !customTiming.trim())) {
      setError("Please specify the custom timing for this extra booking (e.g. 11:30 PM - 1:00 AM).");
      return;
    }
    if (!eventCategory || !eventCategory.trim()) {
      setError("Event Category is required (e.g., Birthday, Anniversary).");
      return;
    }
    if (!customerName || !customerPhone) {
      setError("Customer name and 10-digit mobile phone number are required.");
      return;
    }

    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      setError("Mobile Phone Number must be exactly 10 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    const selectedAddOnStrings = Object.entries(selectedAddOns)
      .filter(([_, qty]) => qty > 0)
      .map(([addonId, qty]) => {
        const addon = activeAddOns.find((a) => a.id === addonId);
        if (!addon) return null;
        return (addon.isQuantityBased || qty > 1)
          ? `${addon.name} (Qty: ${qty}, ₹${addon.price * qty})`
          : `${addon.name} (₹${addon.price})`;
      })
      .filter(Boolean);

    try {
      const res = await createOfflineBooking({
        branchId: branch.id,
        hallId: selectedHall?.id || null,
        hallName: selectedHall ? selectedHall.name : "Hall 1",
        slotId: bookingMode === "EXTRA" ? null : selectedSlotId,
        slotTitle: bookingMode === "EXTRA" ? `⚡ Extra: ${customTiming.trim()}` : (selectedSlot ? selectedSlot.title : "Walk-in Slot"),
        bookingDate,
        customerName,
        customerPhone: cleanPhone,
        customerEmail,
        totalAmount: totalPrice,
        amountPaid: paidAmount,
        notes,
        paymentStatus: paymentStatusComputed,
        packageName: selectedPackage ? selectedPackage.name : null,
        selectedAddOns: selectedAddOnStrings,
        eventCategory,
        isExtraBooking: bookingMode === "EXTRA",
        customTiming: bookingMode === "EXTRA" ? customTiming.trim() : null,
      });

      if (res.success) {
        if (onSuccess) onSuccess(res.booking);
        if (onClose) onClose();
      } else {
        setError(res.error || "Failed to save offline booking.");
      }
    } catch (err) {
      setError(err.message || "An error occurred while saving booking.");
    } finally {
      setLoading(false);
    }
  };

  // Date Pills
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

  return (
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ✕
        </button>

        <div className="mb-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
              Manager Walk-in & Offline Portal
            </span>
            {bookingMode === "EXTRA" && (
              <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
                ⚡ Extra Booking
              </span>
            )}
          </div>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            {bookingMode === "EXTRA" ? "Record Extra / Off-Schedule Booking" : `Log Offline Booking for ${branch.name}`}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Auto-confirms booking, supports partial deposit, and sends automatic WhatsApp confirmation to customer.
          </p>
        </div>

        {/* Mode Selector Switch: Standard Walk-in vs Extra Booking */}
        <div className="grid grid-cols-2 gap-2 p-1.5 rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
          <button
            type="button"
            onClick={() => setBookingMode("STANDARD")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              bookingMode === "STANDARD"
                ? "bg-white dark:bg-gray-900 text-rose-600 shadow-md scale-100"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <span>🕒 Standard Slot Booking</span>
          </button>
          <button
            type="button"
            onClick={() => setBookingMode("EXTRA")}
            className={`py-2.5 px-3 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              bookingMode === "EXTRA"
                ? "bg-linear-to-r from-amber-500 to-rose-600 text-white shadow-md scale-100"
                : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
            }`}
          >
            <span>⚡ Extra Booking (Beyond Slots)</span>
          </button>
        </div>

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-5">
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleCreateOfflineBooking} className="space-y-6">
          {/* 1. Select Celebration Hall */}
          {activeHalls.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                1. Select Celebration Hall
              </label>
              <div className="flex flex-wrap gap-2.5">
                {activeHalls.map((h) => {
                  const isSelected = selectedHallId === h.id;
                  return (
                    <button
                      key={h.id || h.name}
                      type="button"
                      onClick={() => setSelectedHallId(h.id)}
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-1.5 ${
                        isSelected
                          ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span>🏛️ {h.name}</span>
                      {h.capacity && <span className="text-[10px] opacity-80">({h.capacity} guests)</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Choose Celebration Date */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              2. Select Celebration Date
            </label>
            <div className="flex flex-wrap gap-2 mb-2">
              {datePills.map((pill) => {
                const isSelected = bookingDate === pill.iso;
                return (
                  <button
                    key={pill.iso}
                    type="button"
                    onClick={() => setBookingDate(pill.iso)}
                    className={`px-3 py-1.5 rounded-xl border text-xs font-bold transition-all ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {pill.label}
                  </button>
                );
              })}
            </div>
            <input
              type="date"
              value={bookingDate}
              onChange={(e) => setBookingDate(e.target.value)}
              className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold"
            />
          </div>

          {/* 3. Time Slot Selection OR Custom Extra Booking Timing */}
          {bookingMode === "STANDARD" ? (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  3. Choose Time Slot for {selectedHall?.name || "Selected Hall"}
                </label>

                {/* Period Filter Tabs */}
                <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none">
                  {[
                    { id: "ALL", label: `All (${slotStatuses.length})` },
                    { id: "MORNING", label: "🌅 Morning" },
                    { id: "AFTERNOON", label: "☀️ Afternoon" },
                    { id: "EVENING", label: "🌆 Evening" },
                    { id: "NIGHT", label: "🌙 Night" },
                  ].map((tab) => {
                    const isTabActive = slotPeriodFilter === tab.id;
                    return (
                      <button
                        key={tab.id}
                        type="button"
                        onClick={() => setSlotPeriodFilter(tab.id)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold whitespace-nowrap transition-all cursor-pointer ${
                          isTabActive
                            ? "bg-rose-600 text-white shadow-xs"
                            : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {tab.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {loadingSlots ? (
                <div className="py-6 text-center text-xs text-gray-400 font-medium animate-pulse">
                  Checking real-time slot availability...
                </div>
              ) : slotStatuses.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-50 dark:bg-gray-800 text-xs text-gray-500 text-center">
                  No slots configured for this branch. You can switch to <strong>Extra Booking</strong> above.
                </div>
              ) : (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-[320px] overflow-y-auto pr-1 scrollbar-thin">
                  {slotStatuses
                    .filter((slot) => {
                      if (slotPeriodFilter === "ALL") return true;
                      const h = getSlotHour(slot.startTime);
                      if (slotPeriodFilter === "MORNING") return h >= 6 && h < 12;
                      if (slotPeriodFilter === "AFTERNOON") return h >= 12 && h < 17;
                      if (slotPeriodFilter === "EVENING") return h >= 17 && h < 22;
                      if (slotPeriodFilter === "NIGHT") return h >= 22 || h < 6;
                      return true;
                    })
                    .map((slot) => {
                      const isBooked = slot.isBooked;
                      const isDisabled = slot.isDisabledForDate;
                      const isPassed = isSlotTimePassed(slot, bookingDate);
                      const isAvailable = !isBooked && !isDisabled && !isPassed;
                      const isSelected = selectedSlotId === slot.id;

                      return (
                        <button
                          key={slot.id}
                          type="button"
                          disabled={!isAvailable}
                          onClick={() => setSelectedSlotId(slot.id)}
                          className={`p-3 rounded-2xl border text-left text-xs transition-all relative flex flex-col justify-between ${
                            isSelected
                              ? "border-rose-600 bg-rose-600 text-white shadow-md scale-102"
                              : isAvailable
                              ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-rose-300 text-gray-900 dark:text-white cursor-pointer"
                              : "border-gray-100 dark:border-gray-800/50 bg-gray-100/60 dark:bg-gray-800/30 text-gray-400 cursor-not-allowed opacity-60"
                          }`}
                        >
                          <div className="font-bold">{slot.title}</div>
                          <div className="text-[11px] opacity-80 mt-0.5">
                            🕒 {slot.startTime} - {slot.endTime}
                          </div>
                          <div className="mt-2 text-[10px] font-bold">
                            {isBooked ? (
                              <span className="text-rose-600">🔴 Booked</span>
                            ) : isPassed ? (
                              <span className="text-gray-400">⏱️ Passed</span>
                            ) : (
                              <span className={isSelected ? "text-white" : "text-emerald-600 font-black"}>
                                ₹{slot.price} • Available
                              </span>
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>
              )}
            </div>
          ) : (
            /* Extra Booking Custom Timing Section */
            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-3">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-amber-950 dark:text-amber-200 mb-1">
                  ⚡ 3. Extra Booking Custom Timing (Beyond Standard Schedule) *
                </label>
                <p className="text-[11px] text-amber-800 dark:text-amber-400 mb-2">
                  Enter custom hours, midnight celebration slots, or extended time.
                </p>
                <input
                  type="text"
                  required
                  value={customTiming}
                  onChange={(e) => setCustomTiming(e.target.value)}
                  placeholder="e.g. 11:30 PM - 1:00 AM or Midnight 12:00 AM - 1:30 AM"
                  className="w-full px-4 py-2.5 rounded-xl bg-white dark:bg-gray-900 border border-amber-300 dark:border-amber-700 text-xs font-bold text-gray-900 dark:text-white shadow-xs focus:ring-2 focus:ring-amber-500"
                />
              </div>
              <div className="flex flex-wrap gap-1.5 pt-1">
                {["11:00 PM - 12:30 AM", "11:30 PM - 1:00 AM", "Midnight 12:00 AM - 1:30 AM", "7:00 AM - 8:30 AM", "Extended 2 Hours"].map((preset) => (
                  <button
                    key={preset}
                    type="button"
                    onClick={() => setCustomTiming(preset)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-gray-900 border border-amber-200 dark:border-amber-800 text-[11px] font-semibold text-amber-900 dark:text-amber-200 hover:bg-amber-100"
                  >
                    + {preset}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* 4. Choose Celebration Package */}
          {activePackages.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                4. Select Celebration Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activePackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  const price = pkg.offerPrice || pkg.originalPrice;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3 rounded-2xl border text-left text-xs transition-all flex flex-col justify-between ${
                        isSelected
                          ? "border-rose-600 bg-rose-600 text-white shadow-md scale-102"
                          : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-900 dark:text-white hover:border-rose-300"
                      }`}
                    >
                      <div>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full ${isSelected ? "bg-white/20 text-white" : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"}`}>
                          {pkg.badge || "Standard"}
                        </span>
                        <div className="font-bold mt-1 line-clamp-1">{pkg.name}</div>
                      </div>
                      <div className="font-black text-sm mt-2">₹{price}</div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Add-Ons Selection (Quantity-based where applicable) */}
          {activeAddOns.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                5. Add-Ons & Extras (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-52 overflow-y-auto pr-1">
                {activeAddOns.map((addon) => {
                  const qty = selectedAddOns[addon.id] || 0;
                  const isSelected = qty > 0;
                  const isCountBased = Boolean(
                    addon.isQuantityBased ||
                    addon.name.toLowerCase().includes("fire") ||
                    addon.name.toLowerCase().includes("gun") ||
                    addon.name.toLowerCase().includes("hour") ||
                    addon.name.toLowerCase().includes("extra")
                  );
                  const itemTotal = addon.price * (qty || 1);

                  return (
                    <div
                      key={addon.id}
                      onClick={() => toggleAddOn(addon)}
                      className={`p-2.5 rounded-xl border text-xs transition-all flex items-center justify-between cursor-pointer ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/70 dark:bg-rose-950/40 text-gray-900 dark:text-white font-bold shadow-2xs"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/60 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0 pr-2">
                        {/* Checkbox */}
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => {}} // Handled by card onClick
                          className="w-4 h-4 rounded text-rose-600 accent-rose-600 focus:ring-rose-500 cursor-pointer shrink-0"
                        />
                        <div className="min-w-0">
                          <div className="font-bold truncate">{addon.name}</div>
                          <div className="text-[11px] text-rose-600 font-semibold">+₹{itemTotal}</div>
                        </div>
                      </div>

                      {/* Stepper only for count-based add-ons when checked */}
                      {isSelected && isCountBased ? (
                        <div
                          className="flex items-center gap-1 bg-white dark:bg-gray-800 px-1.5 py-0.5 rounded-lg border border-rose-300 dark:border-rose-800 shadow-2xs shrink-0"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            type="button"
                            onClick={(e) => updateAddOnQty(addon.id, -1, e)}
                            className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-black flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                          >
                            -
                          </button>
                          <span className="w-5 text-center font-bold text-xs font-mono">{qty}</span>
                          <button
                            type="button"
                            onClick={(e) => updateAddOnQty(addon.id, 1, e)}
                            className="w-5 h-5 rounded-md bg-gray-100 dark:bg-gray-700 text-xs font-black flex items-center justify-center hover:bg-rose-600 hover:text-white transition-colors"
                          >
                            +
                          </button>
                        </div>
                      ) : (
                        <div className="shrink-0">
                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                            isSelected
                              ? "bg-rose-600 text-white"
                              : "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                          }`}>
                            {isSelected ? "✓ Added" : "+ Add"}
                          </span>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* 6. Event Category */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
              6. Event Celebration Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {[
                "🎂 Birthday Party",
                "💍 Anniversary",
                "💖 Surprise Proposal",
                "🎬 Private Movie Date",
                "👶 Baby Shower",
                "🎓 Graduation / Farewell",
                "🤝 Reunion Celebration",
                "🎉 Other Milestone",
              ].map((cat) => {
                const isSelected = eventCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEventCategory(cat)}
                    className={`p-2 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1 ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                        : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 7. Customer Contact & Payment Collection (Supports Amount Paid & Partial Deposit) */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              7. Customer & Payment Breakdown
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Customer Full Name *
                </label>
                <input
                  type="text"
                  required
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="e.g. Rahul Patil"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400">
                    Phone Number (WhatsApp) *
                  </label>
                  <span className={`text-[10px] font-mono font-bold ${customerPhone.length === 10 ? "text-emerald-600" : "text-amber-600"}`}>
                    {customerPhone.length}/10 Digits
                  </span>
                </div>
                <input
                  type="tel"
                  required
                  maxLength={10}
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value.replace(/[^0-9]/g, "").slice(0, 10))}
                  placeholder="9876543210 (10 Digits)"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-mono font-bold"
                />
              </div>
            </div>

            {/* Amount Paid Now (Supports Partial Advance vs Full Payment) */}
            <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 space-y-3">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-gray-900 dark:text-white uppercase tracking-wider">
                  Payment Collection & Advance Deposit
                </label>
                <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${
                  paymentStatusComputed === "PAID"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-amber-100 text-amber-800"
                }`}>
                  Status: {paymentStatusComputed}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Amount Paid Now by Customer (₹) *
                  </label>
                  <input
                    type="number"
                    min={0}
                    max={totalPrice}
                    value={isCustomPaidInput ? amountPaidInput : totalPrice}
                    onChange={(e) => {
                      setIsCustomPaidInput(true);
                      setAmountPaidInput(e.target.value);
                    }}
                    placeholder={`e.g. ${totalPrice} (or 500 for token deposit)`}
                    className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-xs font-black text-emerald-600"
                  />
                </div>

                {/* Quick Shortcuts */}
                <div>
                  <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                    Quick Preset
                  </label>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPaidInput(false);
                        setAmountPaidInput(String(totalPrice));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-emerald-600 text-white text-[10px] font-bold shadow-2xs hover:bg-emerald-700"
                    >
                      Full Paid (₹{totalPrice})
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPaidInput(true);
                        setAmountPaidInput(String(Math.min(500, totalPrice)));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-2xs hover:bg-amber-600"
                    >
                      Token ₹500
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setIsCustomPaidInput(true);
                        setAmountPaidInput(String(Math.min(1000, totalPrice)));
                      }}
                      className="px-2.5 py-1 rounded-lg bg-amber-500 text-white text-[10px] font-bold shadow-2xs hover:bg-amber-600"
                    >
                      Token ₹1000
                    </button>
                  </div>
                </div>
              </div>

              {/* Dynamic Live Balance Display */}
              <div className="grid grid-cols-3 gap-2 pt-2 border-t border-gray-200 dark:border-gray-700 text-center">
                <div className="p-2 rounded-xl bg-white dark:bg-gray-900">
                  <div className="text-[10px] text-gray-500 font-semibold">Total Amount</div>
                  <div className="text-sm font-black text-gray-900 dark:text-white">₹{totalPrice}</div>
                </div>
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-800 dark:text-emerald-300">
                  <div className="text-[10px] font-semibold">Paid Amount</div>
                  <div className="text-sm font-black">₹{paidAmount}</div>
                </div>
                <div className={`p-2 rounded-xl ${balanceAmount > 0 ? "bg-amber-50 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300" : "bg-gray-100 dark:bg-gray-800 text-gray-400"}`}>
                  <div className="text-[10px] font-semibold">Balance Due at Venue</div>
                  <div className="text-sm font-black">₹{balanceAmount}</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Customer Email (Optional)
                </label>
                <input
                  type="email"
                  value={customerEmail}
                  onChange={(e) => setCustomerEmail(e.target.value)}
                  placeholder="customer@email.com"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold"
                />
              </div>

              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Special Setup / Cake Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Chocolate cake, birthday sash, smoke entry"
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold"
                />
              </div>
            </div>
          </div>

          {/* Footer & Submit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-500 block">Total Booking Amount</span>
              <div className="flex items-center gap-2">
                <span className="text-2xl font-black text-rose-600">₹{totalPrice}</span>
                {balanceAmount > 0 && (
                  <span className="text-xs font-bold text-amber-600 bg-amber-50 dark:bg-amber-950 px-2 py-0.5 rounded-md">
                    (₹{balanceAmount} Due at Venue)
                  </span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2.5 rounded-xl border border-gray-300 dark:border-gray-700 text-xs font-bold"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading || (bookingMode === "STANDARD" && !selectedSlotId)}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md disabled:opacity-50 transition-all"
              >
                {loading
                  ? "Saving & Sending WhatsApp..."
                  : bookingMode === "EXTRA"
                  ? `Confirm Extra Booking (₹${totalPrice}) →`
                  : `Confirm Offline Booking (₹${totalPrice}) →`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
