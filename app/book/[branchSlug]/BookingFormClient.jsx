"use client";

import { useState } from "react";
import Link from "next/link";
import { createOnlineBooking } from "@/lib/actions";

export default function BookingFormClient({ branch, initialSlotId }) {
  const todayStr = new Date().toISOString().split("T")[0];

  const [selectedSlotId, setSelectedSlotId] = useState(initialSlotId || branch.slots[0]?.id || "");
  const [bookingDate, setBookingDate] = useState(todayStr);
  const [customerName, setCustomerName] = useState("");
  const [customerEmail, setCustomerEmail] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bookingResult, setBookingResult] = useState(null);

  const selectedSlot = branch.slots.find((s) => s.id === selectedSlotId);
  const totalPrice = selectedSlot ? selectedSlot.price : branch.pricePerSlot;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await createOnlineBooking({
        branchId: branch.id,
        slotId: selectedSlotId,
        bookingDate,
        customerName,
        customerEmail,
        customerPhone,
        notes,
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
          Our team at {branch.name} will contact you on {customerPhone} to verify special decorations.
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

      {/* Step 1: Select Celebration Date */}
      <div>
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
          1. Select Celebration Date
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

      {/* Step 2: Select Time Slot */}
      <div>
        <label className="block text-sm font-bold text-gray-900 dark:text-white mb-2">
          2. Select Available Time Slot
        </label>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {branch.slots.map((slot) => {
            const isSelected = selectedSlotId === slot.id;
            return (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlotId(slot.id)}
                className={`p-4 rounded-2xl border text-left transition-all ${
                  isSelected
                    ? "border-rose-600 bg-rose-50 dark:bg-rose-950/40 ring-2 ring-rose-500"
                    : "border-gray-200 dark:border-gray-800 hover:border-gray-300 dark:hover:border-gray-700 bg-white dark:bg-gray-900"
                }`}
              >
                <div className="font-bold text-sm text-gray-900 dark:text-white">{slot.title}</div>
                <div className="text-xs text-gray-500 mt-1">🕒 {slot.startTime} - {slot.endTime}</div>
                <div className="text-sm font-black text-rose-600 mt-2">₹{slot.price}</div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 3: Contact & Personal Details */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-800 space-y-4">
        <label className="block text-sm font-bold text-gray-900 dark:text-white">
          3. Contact & Celebration Details
        </label>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Full Name *</label>
            <input
              type="text"
              required
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              placeholder="e.g. Rahul Sharma"
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
              placeholder="+91 98765 43210"
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
            placeholder="rahul@example.com"
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">Occasion / Special Decoration Request</label>
          <textarea
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="e.g., Surprise 25th Birthday with red balloon arch and 'Happy Birthday Rahul' name board."
            className="w-full px-4 py-3 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>
      </div>

      {/* Summary & Submit */}
      <div className="pt-6 border-t border-gray-200 dark:border-gray-800 flex items-center justify-between">
        <div>
          <span className="text-xs text-gray-500 block">Total Payable</span>
          <span className="text-3xl font-black text-rose-600">₹{totalPrice}</span>
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
