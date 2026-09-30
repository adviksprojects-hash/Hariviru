"use client";

import { useState, useEffect, useCallback } from "react";
import { createOfflineBooking, getBranchSlotStatusForDate } from "@/lib/actions";

export default function ManagerOfflineBookingModal({
  branch,
  halls = [],
  packages = [],
  addOns = [],
  initialDate,
  initialSlotId,
  initialHallId,
  onClose,
  onSuccess,
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const activePackages = packages && packages.length > 0 ? packages : [];
  const activeHalls = halls && halls.length > 0 ? halls : [{ id: null, name: "Hall 1" }];
  const activeAddOns = addOns && addOns.length > 0 ? addOns : [];

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
  const [selectedAddOns, setSelectedAddOns] = useState([]);

  // Customer & Payment Fields
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentStatus, setPaymentStatus] = useState("PAID");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Fetch slot status dynamically for chosen date & hall
  const fetchSlotStatuses = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, bookingDate, selectedHallId);
      if (res.success) {
        setSlotStatuses(res.slots);

        // Verify if currently selected slot is available on this date & hall
        const currentSlotObj = res.slots.find((s) => s.id === selectedSlotId);
        const isCurrentAvailable =
          currentSlotObj &&
          !currentSlotObj.isBooked &&
          !currentSlotObj.isDisabledForDate &&
          !currentSlotObj.isTimePassed;

        if (!isCurrentAvailable) {
          const firstAvail = res.slots.find(
            (s) => !s.isBooked && !s.isDisabledForDate && !s.isTimePassed
          );
          setSelectedSlotId(firstAvail ? firstAvail.id : "");
        }
      }
    } catch (err) {
      console.error("Failed to load slot statuses:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch.id, bookingDate, selectedHallId, selectedSlotId]);

  useEffect(() => {
    fetchSlotStatuses();
  }, [bookingDate, selectedHallId]);

  const selectedPackage =
    activePackages.find((p) => p.id === selectedPackageId) || activePackages[0];
  const selectedHall = activeHalls.find((h) => h.id === selectedHallId) || activeHalls[0];
  const selectedSlot = slotStatuses.find((s) => s.id === selectedSlotId);

  // Calculate total price: Package price + selected add-ons
  const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
    const addon = activeAddOns.find((a) => a.id === addonId);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const basePackagePrice = selectedPackage
    ? selectedPackage.offerPrice || selectedPackage.originalPrice
    : branch.pricePerSlot || 1499;

  const totalPrice = basePackagePrice + addOnsTotal;

  const toggleAddOn = (addonId) => {
    if (selectedAddOns.includes(addonId)) {
      setSelectedAddOns(selectedAddOns.filter((id) => id !== addonId));
    } else {
      setSelectedAddOns([...selectedAddOns, addonId]);
    }
  };

  const handleCreateOfflineBooking = async (e) => {
    e.preventDefault();

    if (!selectedSlotId) {
      setError("Please select an available time slot for your chosen date & hall.");
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

    const selectedAddOnNames = selectedAddOns
      .map((id) => activeAddOns.find((a) => a.id === id)?.name)
      .filter(Boolean);

    try {
      const res = await createOfflineBooking({
        branchId: branch.id,
        hallId: selectedHall?.id || null,
        hallName: selectedHall ? selectedHall.name : "Hall 1",
        slotId: selectedSlotId,
        slotTitle: selectedSlot ? selectedSlot.title : "Walk-in Slot",
        bookingDate,
        customerName,
        customerPhone: cleanPhone,
        customerEmail,
        totalAmount: totalPrice,
        notes,
        paymentStatus,
        packageName: selectedPackage ? selectedPackage.name : null,
        selectedAddOns: selectedAddOnNames,
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
    <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-2xl w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative my-8 max-h-[90vh] overflow-y-auto">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-xl"
        >
          ✕
        </button>

        <div className="mb-6">
          <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
            Manager Portal Walk-in Form
          </span>
          <h2 className="text-2xl font-black text-gray-900 dark:text-white mt-1">
            Log Offline Reservation for {branch.name}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Same real-time slot lock as customer booking. Booked slots cannot be duplicated.
          </p>
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
                      className={`px-4 py-2 rounded-xl border text-xs font-bold transition-all flex items-center gap-2 ${
                        isSelected
                          ? "border-rose-600 bg-rose-600 text-white shadow-xs"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span>🏛️ {h.name}</span>
                      <span className="opacity-80">({h.capacity || 15} guests)</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 2. Select Celebration Package */}
          {activePackages.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                2. Select Celebration Package
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {activePackages.map((pkg) => {
                  const isSelected = selectedPackageId === pkg.id;
                  return (
                    <button
                      key={pkg.id}
                      type="button"
                      onClick={() => setSelectedPackageId(pkg.id)}
                      className={`p-3.5 rounded-2xl border text-left transition-all ${
                        isSelected
                          ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-rose-500"
                          : "border-gray-200 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-800/50"
                      }`}
                    >
                      <div className="text-[10px] font-bold text-gray-400 uppercase">{pkg.badge || "Package"}</div>
                      <div className="font-bold text-xs text-gray-900 dark:text-white mt-0.5">{pkg.name}</div>
                      <div className="mt-1.5 flex items-baseline gap-1">
                        <span className="text-base font-black text-rose-600">₹{pkg.offerPrice || pkg.originalPrice}</span>
                        {pkg.originalPrice && pkg.offerPrice && (
                          <span className="text-[10px] text-gray-400 line-through">₹{pkg.originalPrice}</span>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 3. Select Date & Real-time Available Time Slots */}
          <div className="space-y-3">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  3. Select Celebration Date
                </label>
                <input
                  type="date"
                  min={todayStr}
                  value={bookingDate}
                  onChange={(e) => setBookingDate(e.target.value)}
                  required
                  className="px-3 py-1.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
                />
              </div>

              {/* Quick Date Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                {datePills.map((p) => {
                  const isSelected = bookingDate === p.iso;
                  return (
                    <button
                      key={p.iso}
                      type="button"
                      onClick={() => setBookingDate(p.iso)}
                      className={`px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                        isSelected
                          ? "bg-rose-600 text-white shadow-xs"
                          : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                      }`}
                    >
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
                  4. Select Time Slot ({selectedHall ? selectedHall.name : "Hall 1"})
                </label>
                <span className="text-[11px] text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-2 py-0.5 rounded-md">
                  {selectedHall ? selectedHall.name : "Hall 1"}
                </span>
              </div>

              {loadingSlots ? (
                <div className="p-4 text-center text-xs text-gray-400 animate-pulse font-semibold">
                  Checking slot availability for date/hall...
                </div>
              ) : slotStatuses.length === 0 ? (
                <div className="p-4 rounded-xl bg-gray-100 text-gray-500 text-xs text-center">
                  No slots configured for this branch.
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-48 overflow-y-auto p-1">
                  {slotStatuses.map((s) => {
                    const isAvailable = !s.isBooked && !s.isDisabledForDate && !s.isTimePassed;
                    const isSelected = selectedSlotId === s.id;

                    return (
                      <button
                        key={s.id}
                        type="button"
                        disabled={!isAvailable}
                        onClick={() => isAvailable && setSelectedSlotId(s.id)}
                        className={`p-3 rounded-xl border text-left flex items-center justify-between transition-all ${
                          isSelected && isAvailable
                            ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500 shadow-xs"
                            : isAvailable
                            ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300"
                            : "border-gray-200/60 dark:border-gray-800/60 bg-gray-100 dark:bg-gray-800/40 opacity-60 cursor-not-allowed"
                        }`}
                      >
                        <div>
                          <div className="font-bold text-xs text-gray-900 dark:text-white">{s.title}</div>
                          <div className="text-[11px] text-gray-500">🕒 {s.startTime} - {s.endTime}</div>
                        </div>

                        {isAvailable ? (
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              isSelected ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                            }`}
                          >
                            {isSelected ? "Selected ✓" : "Available"}
                          </span>
                        ) : s.isTimePassed ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                            ⏰ Time Passed
                          </span>
                        ) : s.isBooked ? (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800">
                            🔴 Booked
                          </span>
                        ) : (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-gray-200 text-gray-600">
                            🚫 Unavailable
                          </span>
                        )}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* 4. Optional Celebration Add-ons */}
          {activeAddOns.length > 0 && (
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300 mb-2">
                5. Optional Celebration Add-Ons
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                {activeAddOns.map((addon) => {
                  const isChecked = selectedAddOns.includes(addon.id);
                  return (
                    <button
                      key={addon.id}
                      type="button"
                      onClick={() => toggleAddOn(addon.id)}
                      className={`p-2.5 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                        isChecked
                          ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold"
                          : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                      }`}
                    >
                      <span className="truncate">{addon.name}</span>
                      <span className="text-rose-600 font-bold text-[11px] shrink-0 ml-1">+₹{addon.price}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5. Customer Contact & Payment Status Details */}
          <div className="pt-3 border-t border-gray-200 dark:border-gray-800 space-y-3">
            <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 dark:text-gray-300">
              6. Customer & Offline Payment Information
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

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                  Payment Collection Status
                </label>
                <select
                  value={paymentStatus}
                  onChange={(e) => setPaymentStatus(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-bold text-emerald-600"
                >
                  <option value="PAID">PAID (Full Cash / UPI Collected)</option>
                  <option value="PENDING">PENDING (Pay at Venue)</option>
                  <option value="PARTIAL">PARTIAL ADVANCE</option>
                </select>
              </div>

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
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Special Setup / Cake Notes
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Walk-in cash payment. Requires Happy Birthday banner."
                className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs"
              />
            </div>
          </div>

          {/* Footer & Submit */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
            <div>
              <span className="text-[11px] text-gray-500 block">Total Calculated Amount</span>
              <span className="text-2xl font-black text-rose-600">₹{totalPrice}</span>
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
                disabled={loading || !selectedSlotId}
                className="px-6 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-xs shadow-md disabled:opacity-50"
              >
                {loading ? "Saving..." : `Save Offline Booking (₹${totalPrice}) →`}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
