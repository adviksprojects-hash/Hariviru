"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { createOnlineBooking, getBranchSlotStatusForDate } from "@/lib/actions";
import { celebrationPackages, packageAddOns } from "@/data/PackageData/PackageData";

export default function BookingFormClient({ branch, initialSlotId, initialDate }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedPackageId, setSelectedPackageId] = useState("pkg-1");
  const [bookingDate, setBookingDate] = useState(initialDate || todayStr);
  const [slotStatuses, setSlotStatuses] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(true);

  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId || "");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
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

  // Fetch slot status for the chosen date
  const fetchSlotStatuses = useCallback(async () => {
    setLoadingSlots(true);
    try {
      const res = await getBranchSlotStatusForDate(branch.id, bookingDate);
      if (res.success) {
        setSlotStatuses(res.slots);

        // Auto select first available slot if current selection is invalid for this date
        const currentSlotObj = res.slots.find((s) => s.id === selectedSlotId);
        const isCurrentAvailable = currentSlotObj && !currentSlotObj.isBooked && !currentSlotObj.isDisabledForDate;

        if (!isCurrentAvailable) {
          const firstAvail = res.slots.find((s) => !s.isBooked && !s.isDisabledForDate);
          if (firstAvail) {
            setSelectedSlotId(firstAvail.id);
          } else {
            setSelectedSlotId("");
          }
        }
      }
    } catch (err) {
      console.error("Failed to load slot statuses for date:", err);
    } finally {
      setLoadingSlots(false);
    }
  }, [branch.id, bookingDate, selectedSlotId]);

  useEffect(() => {
    fetchSlotStatuses();
  }, [bookingDate]);

  // Selected package details
  const selectedPackage = celebrationPackages.find((p) => p.id === selectedPackageId) || celebrationPackages[0];
  const selectedSlot = slotStatuses.find((s) => s.id === selectedSlotId);

  // Calculate total price: Package Offer Price + Selected Add-Ons
  const addOnsTotal = selectedAddOns.reduce((sum, addonId) => {
    const addon = packageAddOns.find((a) => a.id === addonId);
    return sum + (addon ? addon.price : 0);
  }, 0);

  const totalPrice = selectedPackage.offerPrice + addOnsTotal;

  const toggleAddOn = (addonId) => {
    if (selectedAddOns.includes(addonId)) {
      setSelectedAddOns(selectedAddOns.filter((id) => id !== addonId));
    } else {
      setSelectedAddOns([...selectedAddOns, addonId]);
    }
  };

  const handleProceedToPayment = (e) => {
    e.preventDefault();
    if (!selectedSlotId) {
      setError("Please select an available time slot for your chosen date.");
      return;
    }
    if (!customerName || !customerPhone) {
      setError("Please fill in your name and WhatsApp phone number.");
      return;
    }
    setError(null);
    setShowPaymentStep(true);
  };

  const handleCopyUpi = () => {
    navigator.clipboard.writeText(branchUpiId);
    setCopiedUpi(true);
    setTimeout(() => setCopiedUpi(false), 2500);
  };

  const handleConfirmBookingWithPayment = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const addOnNames = selectedAddOns
      .map((id) => packageAddOns.find((a) => a.id === id)?.name)
      .filter(Boolean)
      .join(", ");

    const combinedNotes = `[Package: ${selectedPackage.badge} (${selectedPackage.name})] ${
      addOnNames ? `[Add-Ons: ${addOnNames}] ` : ""
    }${notes ? `[Notes: ${notes}]` : ""}`;

    try {
      const res = await createOnlineBooking({
        branchId: branch.id,
        slotId: selectedSlotId,
        bookingDate,
        customerName,
        customerEmail,
        customerPhone,
        transactionId,
        notes: combinedNotes,
        totalAmount: totalPrice,
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
  )}&am=${totalPrice}&cu=INR&tn=${encodeURIComponent(`Slot Booking ${selectedSlot?.title || ""}`)}`;
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
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Celebration Date:</span>
            <span className="font-bold text-gray-900 dark:text-white">{bookingDate}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Time Slot:</span>
            <span className="font-bold text-gray-900 dark:text-white">{selectedSlot?.title} ({selectedSlot?.startTime} - {selectedSlot?.endTime})</span>
          </div>
          <div className="flex justify-between">
            <span className="text-gray-500 font-semibold">Total Amount:</span>
            <span className="font-black text-rose-600 text-sm">₹{totalPrice}</span>
          </div>
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
                Scan using Google Pay, PhonePe, Paytm, or any UPI app to pay ₹{totalPrice}.
              </p>
            </div>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
                ⚠️ {error}
              </div>
            )}

            {/* QR Code Container */}
            <div className="bg-gradient-to-b from-rose-50/50 to-amber-50/50 dark:from-gray-800 dark:to-gray-800/80 p-6 rounded-3xl border border-rose-200/80 dark:border-gray-700 text-center space-y-4 mb-6">
              <div className="w-56 h-56 bg-white p-3 rounded-2xl mx-auto shadow-md border border-gray-200 flex items-center justify-center">
                <img
                  src={qrCodeUrl}
                  alt="UPI Payment QR Code"
                  className="w-full h-full object-contain rounded-lg"
                />
              </div>

              <div className="text-center">
                <span className="text-[11px] font-bold text-gray-500 uppercase block">Payable Amount</span>
                <span className="text-3xl font-black text-rose-600">₹{totalPrice}</span>
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
                <label className="block text-xs font-bold text-gray-800 dark:text-gray-200 mb-1">
                  Enter UPI Transaction ID / UTR Ref Number *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 426890123456 or UTR Number"
                  value={transactionId}
                  onChange={(e) => setTransactionId(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-mono focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
                />
                <span className="text-[11px] text-gray-400 block mt-1">
                  Found in your GPay / PhonePe / Paytm payment receipt after completing payment.
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

        {/* Step 1: Choose Package */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-3">
            1. Select Celebration Package (1 Hour)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {celebrationPackages.map((pkg) => {
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
                  <div className="text-xs font-bold text-gray-500">{pkg.badge}</div>
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

        {/* Step 2: Select Date & Date-Wise Available Time Slots */}
        <div className="space-y-4 pt-2">
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-bold text-gray-900 dark:text-white">
                2. Select Celebration Date
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
            <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
              3. Select Available Time Slot for {bookingDate}
            </label>

            {loadingSlots ? (
              <div className="p-4 text-center text-xs text-gray-400 animate-pulse font-semibold">
                Checking slot availability...
              </div>
            ) : slotStatuses.length === 0 ? (
              <div className="p-4 rounded-xl bg-gray-100 text-gray-500 text-xs text-center">
                No slots configured for this date.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {slotStatuses.map((s) => {
                  const isAvailable = !s.isBooked && !s.isDisabledForDate;
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

        {/* Step 3: Optional Add-Ons */}
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
            4. Optional Celebration Add-Ons
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {packageAddOns.map((addon) => {
              const isChecked = selectedAddOns.includes(addon.id);
              return (
                <button
                  key={addon.id}
                  type="button"
                  onClick={() => toggleAddOn(addon.id)}
                  className={`p-3 rounded-xl border text-left text-xs font-semibold flex items-center justify-between transition-colors ${
                    isChecked
                      ? "border-amber-500 bg-amber-50 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-bold"
                      : "border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300"
                  }`}
                >
                  <span>{addon.name}</span>
                  <span className="text-rose-600 font-bold">+₹{addon.price}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Step 4: Contact & Personal Details */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
          <label className="block text-sm font-bold text-gray-900 dark:text-white">
            5. Contact & Personal Details
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
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Phone Number (WhatsApp) *
              </label>
              <input
                type="tel"
                required
                value={customerPhone}
                onChange={(e) => setCustomerPhone(e.target.value)}
                placeholder="+91 97624 86649"
                className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
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
            <span className="text-xs text-gray-400 block font-medium">Includes Special Offer Price</span>
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
