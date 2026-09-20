"use client";

import { useState } from "react";
import Link from "next/link";
import { createOnlineBooking } from "@/lib/actions";
import { celebrationPackages, packageAddOns } from "@/data/PackageData/PackageData";

export default function BookingFormClient({ branch, initialSlotId }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedPackageId, setSelectedPackageId] = useState("pkg-1");
  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId || branch.slots[0]?.id || "");
  const [selectedAddOns, setSelectedAddOns] = useState([]);
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  // Selected package details
  const selectedPackage = celebrationPackages.find((p) => p.id === selectedPackageId) || celebrationPackages[0];
  const selectedSlot = branch.slots.find((s) => s.id === selectedSlotId);

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

  const handleSubmit = async (e) => {
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
        notes: combinedNotes,
        totalAmount: totalPrice,
      });

      if (res.success) {
        setBookingResult(res);
      }
    } catch (err) {
      setError(err.message || "Failed to create booking. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (bookingResult) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400 flex items-center justify-center text-3xl mx-auto mb-4">
          ✓
        </div>
        <h2 className="text-2xl font-black text-gray-900 dark:text-white">Celebration Reserved!</h2>
        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
          Your booking confirmation reference number is:
        </p>
        <div className="mt-4 p-4 rounded-2xl bg-amber-50 dark:bg-amber-950/60 border border-amber-200 dark:border-amber-800 inline-block font-mono text-xl font-bold text-amber-900 dark:text-amber-200">
          {bookingResult.bookingNumber}
        </div>

        <p className="text-xs text-gray-500 mt-4 max-w-sm mx-auto">
          Our team at {branch.name} will contact you on {customerPhone} to verify special decorations for {selectedPackage.badge}.
        </p>

        <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/bookings"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-rose-600 text-white font-bold text-sm shadow-md hover:bg-rose-700 transition-colors"
          >
            Go to My Bookings
          </Link>
          <Link
            href="/branches"
            className="w-full sm:w-auto px-6 py-3 rounded-full bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-semibold text-sm hover:bg-gray-200 transition-colors"
          >
            Explore More Branches
          </Link>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Step 2: Select Date & Time Slot */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
            2. Select Celebration Date
          </label>
          <input
            type="date"
            min={todayStr}
            value={bookingDate}
            onChange={(e) => setBookingDate(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
            3. Select Time Slot
          </label>
          <select
            value={selectedSlotId}
            onChange={(e) => setSelectedSlotId(e.target.value)}
            required
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white font-medium focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          >
            {branch.slots.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.startTime} - {s.endTime})
              </option>
            ))}
          </select>
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
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
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
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Phone Number (WhatsApp) *</label>
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
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Email Address</label>
          <input
            type="email"
            value={customerEmail}
            onChange={(e) => setCustomerEmail(e.target.value)}
            placeholder="customer@example.com"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Special Occasion / Cake Name Request</label>
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
          disabled={loading}
          className="px-8 py-4 rounded-full bg-linear-to-r from-rose-600 to-amber-600 hover:from-rose-700 hover:to-amber-700 text-white font-bold text-base shadow-lg shadow-rose-500/20 disabled:opacity-50 transition-all"
        >
          {loading ? "Confirming..." : "Confirm & Reserve Slot →"}
        </button>
      </div>
    </form>
  );
}
