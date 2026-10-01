"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createOnlineBooking, getBranchSlotStatusForDate } from "@/lib/actions";
import { celebrationPackages, packageAddOns } from "@/data/PackageData/PackageData";

export default function BookingFormClient({
  branch,
  halls = [],
  packages = [],
  addOns = [],
  initialSlotId,
  initialDate,
  initialHallId,
}) {
  const todayStr = new Date().toISOString().split("T")[0];

  const activePackages = packages && packages.length > 0 ? packages : celebrationPackages;
  const activeHalls = halls && halls.length > 0 ? halls : [{ id: null, name: "Hall 1" }];
  const activeAddOns = addOns && addOns.length > 0 ? addOns : packageAddOns;

  const [selectedHallId, setSelectedHallId] = useState(
    initialHallId || (activeHalls[0] ? activeHalls[0].id : null)
  );
  const [selectedPackageId, setSelectedPackageId] = useState(
    activePackages[0] ? activePackages[0].id : "pkg-1"
  );
  const [bookingDate, setBookingDate] = useState(initialDate || todayStr);
  const [slotStatuses, setSlotStatuses] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId || "");
  const [selectedAddOns, setSelectedAddOns] = useState({}); // { [addonId]: quantity }
  const [eventCategory, setEventCategory] = useState("");
  const [paymentType, setPaymentType] = useState("FULL"); // FULL or DEPOSIT
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [transactionId, setTransactionId] = useState("");

  const [showPaymentStep, setShowPaymentStep] = useState(false);
  const [copiedUpi, setCopiedUpi] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const branchUpiId = branch.upiId || "9762486649@ybl";
  const selectedHall = activeHalls.find((h) => h.id === selectedHallId) || activeHalls[0];

  // Fetch slot status for the chosen date and hall
  const fetchSlotStatuses = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, bookingDate, selectedHallId);
      if (res.success) {
        setSlotStatuses(res.slots);

        // Auto select first available slot if current selection is invalid or time passed for this date & hall
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
          if (firstAvail) {
            setSelectedSlotId(firstAvail.id);
          } else {
            setSelectedSlotId("");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load slot statuses for date/hall:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch.id, bookingDate, selectedHallId, selectedSlotId]);

  useEffect(() => {
    fetchSlotStatuses();
  }, [bookingDate, selectedHallId]);

  // Selected package details
  const selectedPackage =
    activePackages.find((p) => p.id === selectedPackageId) || activePackages[0];
  const selectedSlot = slotStatuses.find((s) => s.id === selectedSlotId);

  // Calculate total price: Package Offer Price + Selected Add-Ons * Quantity
  const addOnsTotal = Object.entries(selectedAddOns).reduce((sum, [addonId, qty]) => {
    if (!qty || qty <= 0) return sum;
    const addon = activeAddOns.find((a) => a.id === addonId);
    return sum + (addon ? addon.price * qty : 0);
  }, 0);

  const totalPrice = (selectedPackage.offerPrice || 1499) + addOnsTotal;

  // Deposit Payment Calculations
  const isDepositSelected = paymentType === "DEPOSIT" && branch.depositModeEnabled && branch.depositAmount > 0;
  const payableAmount = isDepositSelected ? Math.min(branch.depositAmount, totalPrice) : totalPrice;
  const remainingAmount = isDepositSelected ? Math.max(0, totalPrice - payableAmount) : 0;

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

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setError("Please select an available time slot for your chosen date & hall.");
      return;
    }
    if (!eventCategory || !eventCategory.trim()) {
      setError("Event Category is required (e.g., Birthday, Anniversary).");
      return;
    }
    if (!customerName || !customerPhone) {
      setError("Please fill in your name and WhatsApp phone number.");
      return;
    }
    const cleanPhone = customerPhone.replace(/[^0-9]/g, "");
    if (cleanPhone.length !== 10) {
      setError("WhatsApp Mobile Number must be exactly 10 digits (e.g., 9876543210).");
      return;
    }
    setError(null);
    setShowPaymentStep(true);
    if (typeof window !== "undefined") {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(branchUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmBookingWithPayment = async (e) => {
    e.preventDefault();

    const cleanTxn = transactionId.replace(/[^0-9]/g, "");
    if (cleanTxn.length !== 12) {
      setError("UPI Transaction ID / UTR Ref Number must be exactly 12 digits.");
      return;
    }

    setLoading(true);
    setError(null);

    const selectedAddOnStrings = Object.entries(selectedAddOns)
      .filter(([_, qty]) => qty > 0)
      .map(([addonId, qty]) => {
        const addon = activeAddOns.find((a) => a.id === addonId);
        if (!addon) return null;
        return addon.isQuantityBased
          ? `${addon.name} (Qty: ${qty}, ₹${addon.price * qty})`
          : `${addon.name} (₹${addon.price})`;
      })
      .filter(Boolean);

    try {
      const res = await createOnlineBooking({
        branchId: branch.id,
        hallId: selectedHall?.id || null,
        hallName: selectedHall?.name || "Hall 1",
        slotId: selectedSlotId,
        bookingDate,
        customerName,
        customerEmail,
        customerPhone,
        transactionId,
        notes,
        totalAmount: totalPrice,
        eventCategory,
        packageName: selectedPackage?.name || null,
        selectedAddOns: selectedAddOnStrings,
      });

      if (res.success) {
        setBookingResult(res);
        setShowPaymentStep(false);
      }
    } catch (err) {
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Quick date pills
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

  const upiQrData = `upi://pay?pa=${encodeURIComponent(branchUpiId)}&pn=${encodeURIComponent(
    "HaruViru Celebration House"
  )}&am=${payableAmount}&cu=INR&tn=${encodeURIComponent(`Slot Booking ${selectedSlot?.title || ""}`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(upiQrData)}`;

  if (bookingResult) {
    return (
      <div className="text-center py-8 space-y-6">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto shadow-md">
          ✓
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-900 text-xs font-bold uppercase tracking-wider">
            ⏳ Pending Manager Verification
          </span>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-2">
            Celebration Slot Reserved!
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Your booking reference number is:
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 inline-block font-mono text-2xl font-bold text-amber-900 dark:text-amber-200 shadow-xs">
          {bookingResult.bookingNumber}
        </div>

        {transactionId && (
          <div className="text-xs text-gray-500 font-medium">
            UPI UTR / Transaction ID submitted: <span className="font-bold text-gray-800 dark:text-gray-200 font-mono">{transactionId}</span>
          </div>
        )}

        <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800/80 border border-gray-200 dark:border-gray-700 text-left max-w-md mx-auto text-xs space-y-2">
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Franchise Branch:</span>
            <span className="font-bold text-gray-900 dark:text-white">{branch.name}</span>
          </div>
          {selectedHall && (
            <div className="flex justify-between">
              <span className="text-gray-500 font-semibold">Hall Allocated:</span>
              <span className="font-bold text-rose-600">{selectedHall.name}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Celebration Date:</span>
            <span className="font-bold text-gray-900 dark:text-white">{bookingDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Time Slot:</span>
            <span className="font-bold text-gray-900 dark:text-white">{selectedSlot?.title} ({selectedSlot?.startTime} - {selectedSlot?.endTime})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Total Package Price:</span>
            <span className="font-bold text-gray-900 dark:text-white">₹{totalPrice}</span>
          </div>
          <div className="flex justify-between border-t border-gray-200 dark:border-gray-700 pt-2">
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Paid Now ({isDepositSelected ? "Deposit" : "Full"}):</span>
            <span className="font-black text-emerald-600 text-sm">₹{payableAmount}</span>
          </div>
          {isDepositSelected && remainingAmount > 0 && (
            <div className="flex justify-between bg-amber-50 dark:bg-amber-950/40 p-2 rounded-lg border border-amber-200 dark:border-amber-800">
              <span className="text-amber-900 dark:text-amber-200 font-bold">Remaining Balance Due at Venue:</span>
              <span className="font-black text-amber-900 dark:text-amber-200 text-sm">₹{remainingAmount}</span>
            </div>
          )}
        </div>

        <p className="text-xs text-gray-500 max-w-md mx-auto leading-relaxed">
          The franchise manager at {branch.name} will verify the payment and confirm your slot. You will receive WhatsApp updates on <span className="font-bold text-gray-800 dark:text-gray-200">{customerPhone}</span>.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/bookings"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-rose-600 text-white font-bold text-sm shadow-md hover:bg-rose-700 transition-colors"
          >
            My Bookings Portal →
          </Link>
          <Link
            href="/branches"
            className="w-full sm:w-auto px-8 py-3.5 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Explore More Branches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div>
      {/* Payment Modal Step */}
      {showPaymentStep && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative my-auto">
            <button
              onClick={() => setShowPaymentStep(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 font-bold text-lg"
            >
              ✕
            </button>

            <div className="text-center mb-6">
              <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 text-xs font-bold uppercase tracking-wider">
                Step 2 of 2: Scan & Pay
              </span>
              <h2 className="text-2xl font-black text-gray-900 dark:text-white tracking-tight mt-2">
                UPI QR Code Payment
              </h2>
              <p className="text-xs text-gray-500 mt-1">
                Scan using Google Pay, PhonePe, Paytm, or any UPI app to pay ₹{payableAmount}. {isDepositSelected ? `(Advance Deposit Amount. Remaining ₹${remainingAmount} payable at venue)` : ""}
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
                ⚠️ {error}
              </div>
            )}

            {/* Step 2 Payment Mode Selection (Full vs Advance Deposit) */}
            {branch.depositModeEnabled && branch.depositAmount > 0 && (
              <div className="mb-5 p-4 rounded-2xl bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 space-y-2 text-left">
                <div className="flex items-center justify-between">
                  <label className="block text-xs font-bold uppercase tracking-wider text-amber-900 dark:text-amber-200">
                    ⚡ Select Payment Amount Mode
                  </label>
                  <span className="text-[10px] font-bold text-amber-700 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/60 px-2 py-0.5 rounded-full">
                    Advance Deposit Mode
                  </span>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaymentType("FULL")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === "FULL"
                        ? "border-rose-600 bg-rose-600 text-white font-bold shadow-xs ring-2 ring-rose-500 scale-[1.01]"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">💳 Full Payment</div>
                    <div className="text-base font-black mt-0.5">₹{totalPrice}</div>
                    <div className="text-[10px] opacity-80">Pay 100% now</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentType("DEPOSIT")}
                    className={`p-3 rounded-xl border text-left transition-all ${
                      paymentType === "DEPOSIT"
                        ? "border-amber-600 bg-amber-600 text-white font-bold shadow-xs ring-2 ring-amber-500 scale-[1.01]"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-200 hover:border-gray-300"
                    }`}
                  >
                    <div className="text-[10px] font-bold uppercase">🏦 Pay Deposit</div>
                    <div className="text-base font-black mt-0.5">₹{Math.min(branch.depositAmount, totalPrice)}</div>
                    <div className="text-[10px] opacity-80">Bal ₹{Math.max(0, totalPrice - Math.min(branch.depositAmount, totalPrice))} at venue</div>
                  </button>
                </div>
              </div>
            )}

            {/* QR Code Container & Mobile Payment Options */}
            <div className="bg-gradient-to-b from-rose-50/50 to-amber-50/50 dark:from-gray-800 dark:to-gray-800/80 p-5 sm:p-6 rounded-3xl border border-rose-200/80 dark:border-gray-700 text-center space-y-4 mb-6">
              
              {/* Mobile Direct Pay Button (For phone users) */}
              <div className="space-y-2">
                <a
                  href={upiQrData}
                  className="w-full py-3.5 px-4 rounded-2xl bg-gradient-to-r from-purple-600 via-rose-600 to-amber-600 hover:from-purple-700 hover:to-amber-700 text-white font-black text-sm shadow-lg shadow-purple-500/20 flex items-center justify-center gap-2 transition-all transform active:scale-95"
                >
                  <span className="text-lg">📱</span>
                  <span>Tap to Pay ₹{payableAmount} via UPI App</span>
                </a>
                <span className="text-[11px] text-gray-500 dark:text-gray-400 block text-center font-medium">
                  ⚡ Mobile Users: Tap button above to launch PhonePe, Google Pay, or Paytm directly!
                </span>
              </div>

              {/* Direct UPI App Shortcuts */}
              <div className="grid grid-cols-3 gap-2 text-xs pt-1">
                <a
                  href={upiQrData}
                  className="p-2.5 rounded-xl border border-purple-200 dark:border-purple-800 bg-white dark:bg-gray-900 text-purple-900 dark:text-purple-300 font-bold flex flex-col items-center justify-center gap-1 hover:bg-purple-50 dark:hover:bg-gray-800 transition-colors shadow-xs"
                >
                  <span className="text-base">🟣</span>
                  <span>PhonePe</span>
                </a>
                <a
                  href={upiQrData}
                  className="p-2.5 rounded-xl border border-blue-200 dark:border-blue-800 bg-white dark:bg-gray-900 text-blue-900 dark:text-blue-300 font-bold flex flex-col items-center justify-center gap-1 hover:bg-blue-50 dark:hover:bg-gray-800 transition-colors shadow-xs"
                >
                  <span className="text-base">🔵</span>
                  <span>Google Pay</span>
                </a>
                <a
                  href={upiQrData}
                  className="p-2.5 rounded-xl border border-sky-200 dark:border-sky-800 bg-white dark:bg-gray-900 text-sky-900 dark:text-sky-300 font-bold flex flex-col items-center justify-center gap-1 hover:bg-sky-50 dark:hover:bg-gray-800 transition-colors shadow-xs"
                >
                  <span className="text-base">🟡</span>
                  <span>Paytm</span>
                </a>
              </div>

              <div className="relative flex py-2 items-center">
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
                <span className="flex-shrink mx-3 text-[10px] font-bold uppercase tracking-widest text-gray-400">OR SCAN QR CODE (DESKTOP)</span>
                <div className="flex-grow border-t border-gray-200 dark:border-gray-700"></div>
              </div>

              {/* QR Code Container (Desktop users) */}
              <div className="w-48 h-48 sm:w-56 sm:h-56 bg-white p-3 rounded-2xl mx-auto shadow-md border border-gray-200 flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">
                  {isDepositSelected ? "Advance Deposit Amount (Payable Now)" : "Payable Amount"}
                </span>
                <span className="text-3xl font-black text-rose-600">₹{payableAmount}</span>
                {isDepositSelected && (
                  <span className="text-xs text-amber-700 dark:text-amber-300 block font-bold mt-1">
                    Remaining Balance ₹{remainingAmount} payable at venue
                  </span>
                )}
              </div>

              {/* UPI ID Copy Box */}
              <div className="p-3 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 flex items-center justify-between gap-2 text-xs font-mono">
                <span className="font-bold text-gray-800 dark:text-gray-200 truncate">
                  UPI ID: {branchUpiId}
                </span>
                <button
                  type="button"
                  onClick={handleCopyUpi}
                  className="px-3 py-1 rounded-xl bg-rose-600 text-white font-sans font-bold text-[11px] shrink-0 hover:bg-rose-700 transition-colors"
                >
                  {copiedUpi ? "Copied! ✓" : "Copy UPI"}
                </button>
              </div>
            </div>

            <form onSubmit={handleConfirmBookingWithPayment} className="space-y-4">
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-bold text-gray-800 dark:text-gray-200">
                    Enter UPI Transaction ID / UTR Ref Number *
                  </label>
                  <span className={`text-[11px] font-mono font-bold ${transactionId.length === 12 ? "text-emerald-600" : "text-amber-600"}`}>
                    {transactionId.length}/12 Digits
                  </span>
                </div>
                <input
                  type="text"
                  required
                  maxLength={12}
                  placeholder="e.g. 426890123456 (Exactly 12 Digits)"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value.replace(/[^0-9]/g, "").slice(0, 12))}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-gray-400 block mt-1">
                  Found in your GPay / PhonePe / Paytm receipt (12-digit UPI reference number).
                </span>
              </div>

              <div className="pt-2 flex flex-col sm:flex-row gap-3">
                <button
                  type="button"
                  onClick={() => setShowPaymentStep(false)}
                  className="w-full sm:w-1/3 py-3 rounded-full border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full sm:w-2/3 py-3.5 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-sm shadow-lg shadow-rose-500/20 disabled:opacity-50"
                >
                  {loading ? "Reserving Slot..." : "I Have Paid & Reserve Slot →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Main Booking Form */}
      <form onSubmit={handleProceedToPayment} className="space-y-6">
        {error && (
          <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-sm font-semibold">
            ⚠️ {error}
          </div>
        )}

        {/* Step 1: Select Hall (if branch has multiple halls) */}
        {activeHalls.length > 0 && (
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              1. Select Celebration Hall
            </label>
            <div className="flex flex-wrap gap-3">
              {activeHalls.map((h) => {
                const isSelected = selectedHallId === h.id;
                return (
                  <button
                    key={h.id || h.name}
                    type="button"
                    onClick={() => setSelectedHallId(h.id)}
                    className={`px-5 py-2.5 rounded-2xl border text-xs font-bold transition-all flex items-center gap-2 ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white shadow-md shadow-rose-500/20 scale-105"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
                  >
                    <span>🏛️ {h.name}</span>
                    {h.capacity ? <span className="opacity-80">({h.capacity} guests)</span> : null}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Step 2: Choose Package */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
            2. Select Celebration Package (1 Hour)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {activePackages.map((pkg) => {
              const isSelected = selectedPackageId === pkg.id;
              return (
                <button
                  key={pkg.id}
                  type="button"
                  onClick={() => setSelectedPackageId(pkg.id)}
                  className={`p-4 rounded-2xl border text-left transition-all relative ${
                    isSelected
                      ? "border-rose-600 bg-rose-50/50 dark:bg-rose-950/40 ring-2 ring-rose-500"
                      : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300"
                  }`}
                >
                  <div className="text-xs font-bold text-gray-500">{pkg.badge || "Standard"}</div>
                  <div className="font-black text-sm text-gray-900 dark:text-white mt-0.5">{pkg.name}</div>
                  <div className="mt-2 flex items-baseline gap-1.5">
                    <span className="text-xl font-black text-rose-600">₹{pkg.offerPrice}</span>
                    <span className="text-xs text-gray-400 line-through">₹{pkg.originalPrice}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 3: Select Date & Date-Wise Available Time Slots */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white">
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
            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
              {datePills.map((p) => {
                const isSelected = bookingDate === p.iso;
                return (
                  <button
                    key={p.iso}
                    type="button"
                    onClick={() => setBookingDate(p.iso)}
                    className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                      isSelected
                        ? "bg-rose-600 text-white shadow-md shadow-rose-500/20"
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
              <label className="block text-sm font-bold text-gray-900 dark:text-white">
                4. Select Time Slot ({selectedHall ? selectedHall.name : "Hall 1"})
              </label>
              <span className="text-xs text-rose-600 font-bold bg-rose-50 dark:bg-rose-950 px-2.5 py-0.5 rounded-md">
                {selectedHall ? selectedHall.name : "Hall 1"}
              </span>
            </div>

            {loadingSlots ? (
              <div className="p-4 text-center text-xs text-gray-400 animate-pulse font-semibold">
                Checking slot availability for {selectedHall?.name || "Hall"}...
              </div>
            ) : slotStatuses.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-100 text-gray-500 text-xs text-center">
                No slots configured for this date.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slotStatuses.map((s) => {
                  const isAvailable = !s.isBooked && !s.isDisabledForDate && !s.isTimePassed;
                  const isSelected = selectedSlotId === s.id;

                  return (
                    <button
                      key={s.id}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => isAvailable && setSelectedSlotId(s.id)}
                      className={`p-4 rounded-2xl border text-left flex items-center justify-between transition-all ${
                        isSelected && isAvailable
                          ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500 shadow-md"
                          : isAvailable
                          ? "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:border-gray-300"
                          : "border-gray-200/60 dark:border-gray-800/60 bg-gray-100 dark:bg-gray-800/40 opacity-60 cursor-not-allowed"
                      }`}
                    >
                      <div>
                        <div className="font-bold text-sm text-gray-900 dark:text-white">{s.title}</div>
                        <div className="text-xs text-gray-500">🕒 {s.startTime} - {s.endTime}</div>
                      </div>

                      {isAvailable ? (
                        <span
                          className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                            isSelected ? "bg-rose-600 text-white" : "bg-emerald-100 text-emerald-800"
                          }`}
                        >
                          {isSelected ? "Selected ✓" : "Available"}
                        </span>
                      ) : s.isTimePassed ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-900 dark:bg-amber-950 dark:text-amber-200">
                          ⏰ Time Passed
                        </span>
                      ) : s.isBooked ? (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-rose-100 text-rose-800">
                          🔴 Booked
                        </span>
                      ) : (
                        <span className="text-xs font-bold px-2.5 py-1 rounded-full bg-gray-200 text-gray-600">
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

        {/* Step 5: Optional Add-Ons */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
            5. Optional Celebration Add-Ons
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {activeAddOns.map((addon) => {
              const qty = selectedAddOns[addon.id] || 0;
              const isChecked = qty > 0;
              const itemTotal = addon.price * (qty || 1);

              return (
                <div
                  key={addon.id}
                  onClick={() => toggleAddOn(addon)}
                  className={`p-3.5 rounded-2xl border text-left text-xs transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                    isChecked
                      ? "border-amber-500 bg-amber-50/60 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold shadow-xs"
                      : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 hover:border-gray-300 bg-white dark:bg-gray-900"
                  }`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-bold truncate">{addon.name}</span>
                    <span className="text-rose-600 font-black shrink-0">+₹{itemTotal}</span>
                  </div>

                  {(addon.isQuantityBased || addon.name.toLowerCase().includes("fire") || addon.name.toLowerCase().includes("gun")) && isChecked && (
                    <div
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center justify-between bg-white dark:bg-gray-800 p-1.5 rounded-xl border border-amber-300 dark:border-amber-700 mt-1"
                    >
                      <span className="text-[11px] font-bold text-amber-900 dark:text-amber-200">
                        Quantity:
                      </span>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={(e) => updateAddOnQty(addon.id, -1, e)}
                          className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-black text-xs flex items-center justify-center"
                        >
                          -
                        </button>
                        <span className="font-mono font-black text-sm px-1 min-w-4 text-center">
                          {qty}
                        </span>
                        <button
                          type="button"
                          onClick={(e) => updateAddOnQty(addon.id, 1, e)}
                          className="w-6 h-6 rounded-lg bg-amber-100 dark:bg-amber-900/60 hover:bg-amber-200 text-amber-900 dark:text-amber-200 font-black text-xs flex items-center justify-center"
                        >
                          +
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Step 6: Compulsory Event Category */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <div>
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              6. Event Category *
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {[
                "🎂 Birthday",
                "💍 Anniversary",
                "👶 Baby Shower",
                "👰 Bride to Be",
                "🕯️ Candle Light Dinner",
                "💍 Proposal",
                "🎉 Groom to Be",
                "🎓 Graduation",
                "✨ Other",
              ].map((cat) => {
                const cleanCatName = cat.replace(/^[^\w\s]+/, "").trim();
                const isSelected = eventCategory === cleanCatName || eventCategory === cat;
                return (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => setEventCategory(cleanCatName)}
                    className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-left flex items-center gap-1.5 ${
                      isSelected
                        ? "border-rose-600 bg-rose-600 text-white shadow-sm"
                        : "border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 hover:border-gray-300"
                    }`}
                  >
                    <span>{cat}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block text-sm font-bold text-gray-900 dark:text-white pt-2">
            7. Contact & Personal Details
          </label>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Full Name *
              </label>
              <input
                type="text"
                required
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                placeholder="e.g. Harshada Jadhav"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400">
                  Phone Number (WhatsApp) *
                </label>
                <span className={`text-[11px] font-mono font-bold ${customerPhone.length === 10 ? "text-emerald-600" : "text-amber-600"}`}>
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
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Email Address
            </label>
            <input
              type="email"
              value={customerEmail}
              onChange={(e) => setCustomerEmail(e.target.value)}
              placeholder="customer@example.com"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
              Special Occasion / Cake Name Request
            </label>
            <textarea
              rows={2}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., Birthday surprise for Rahul. Name on cake: 'Happy Birthday Rahul'"
              className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
            />
          </div>
        </div>

        {/* Summary & Submit */}
        <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
          <div>
            <span className="text-xs text-gray-500 block">Total Package Amount</span>
            <span className="text-3xl font-black text-rose-600">₹{totalPrice}</span>
            <span className="text-xs text-gray-400 block font-medium">
              {selectedHall ? `${selectedHall.name} • Special Offer` : "Includes Special Offer Price"}
            </span>
          </div>

          <button
            type="submit"
            disabled={loading || !selectedSlotId}
            className="px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all"
          >
            Confirm & Pay ₹{totalPrice} →
          </button>
        </div>
      </form>
    </div>
  );
}
