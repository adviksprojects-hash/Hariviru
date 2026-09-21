"use client";

import { useState } from "react";
import { createOfflineBooking, updateBookingStatus } from "@/lib/actions";

export default function ManagerBookingsClient({ branch, initialBookings }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, PENDING, ONLINE, OFFLINE

  const [showOfflineModal, setShowOfflineModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // Form states for offline booking creation
  const [offlineDate, setOfflineDate] = useState(new Date().toISOString().split("T")[0]);
  const [offlineSlotId, setOfflineSlotId] = useState(branch.slots[0]?.id || "");
  const [offlineCustomerName, setOfflineCustomerName] = useState("");
  const [offlineCustomerPhone, setOfflineCustomerPhone] = useState("");
  const [offlineCustomerEmail, setOfflineCustomerEmail] = useState("");
  const [offlineAmount, setOfflineAmount] = useState("");
  const [offlineNotes, setOfflineNotes] = useState("");
  const [offlinePaymentStatus, setOfflinePaymentStatus] = useState("PAID");

  const filteredBookings = bookings.filter((b) => {
    const matchesSearch =
      b.bookingNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      b.customerPhone.includes(searchQuery) ||
      (b.transactionId && b.transactionId.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;

    if (filterType === "PENDING") return b.bookingStatus === "PENDING";
    if (filterType === "ONLINE") return b.bookingType === "ONLINE";
    if (filterType === "OFFLINE") return b.bookingType === "OFFLINE";
    return true;
  });

  const handleCreateOffline = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const selectedSlotObj = branch.slots.find((s) => s.id === offlineSlotId);

    try {
      const res = await createOfflineBooking({
        branchId: branch.id,
        slotId: offlineSlotId || null,
        slotTitle: selectedSlotObj ? selectedSlotObj.title : "Walk-in Slot",
        bookingDate: offlineDate,
        customerName: offlineCustomerName,
        customerPhone: offlineCustomerPhone,
        customerEmail: offlineCustomerEmail,
        totalAmount: offlineAmount,
        notes: offlineNotes,
        paymentStatus: offlinePaymentStatus,
      });

      if (res.success) {
        setBookings([res.booking, ...bookings]);
        setShowOfflineModal(false);
        setOfflineCustomerName("");
        setOfflineCustomerPhone("");
        setOfflineNotes("");
      }
    } catch (err) {
      setError(err.message || "Failed to create offline booking.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (bookingId, newBookingStatus, newPaymentStatus) => {
    try {
      const res = await updateBookingStatus(bookingId, newBookingStatus, newPaymentStatus);
      if (res.success) {
        setBookings(bookings.map((b) => (b.id === bookingId ? res.booking : b)));
      }
    } catch (err) {
      alert("Error updating booking status: " + err.message);
    }
  };

  const pendingCount = bookings.filter((b) => b.bookingStatus === "PENDING").length;

  return (
    <div>
      {/* Top Action & Search Bar */}
      <div className="bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs mb-8 flex flex-col md:flex-row md:items-center justify-between gap-4">
        
        {/* Search Input */}
        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search customer, phone, HV-2026 #, or UTR/Txn ID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills & Add Offline Button */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => setFilterType("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === "ALL" ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs" : "text-gray-500"}`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => setFilterType("PENDING")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === "PENDING" ? "bg-amber-500 text-white font-bold shadow-xs" : "text-amber-600 font-bold"}`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => setFilterType("ONLINE")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === "ONLINE" ? "bg-white dark:bg-gray-900 text-rose-600 font-bold shadow-xs" : "text-gray-500"}`}
            >
              Online
            </button>
            <button
              onClick={() => setFilterType("OFFLINE")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${filterType === "OFFLINE" ? "bg-white dark:bg-gray-900 text-amber-600 font-bold shadow-xs" : "text-gray-500"}`}
            >
              Offline
            </button>
          </div>

          <button
            onClick={() => setShowOfflineModal(true)}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            + Log Offline Walk-in Booking
          </button>
        </div>

      </div>

      {/* Offline Booking Form Modal */}
      {showOfflineModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full shadow-2xl border border-gray-200 dark:border-gray-800 relative">
            <button
              onClick={() => setShowOfflineModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 text-lg font-bold"
            >
              ✕
            </button>

            <h2 className="text-xl font-black text-gray-900 dark:text-white mb-1">
              Log Offline Walk-in Booking
            </h2>
            <p className="text-xs text-gray-500 mb-6">Record a direct phone or walk-in reservation for {branch.name}.</p>

            {error && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold mb-4">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleCreateOffline} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Celebration Date *</label>
                <input
                  type="date"
                  required
                  value={offlineDate}
                  onChange={(e) => setOfflineDate(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Select Time Slot *</label>
                <select
                  value={offlineSlotId}
                  onChange={(e) => setOfflineSlotId(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm"
                >
                  {branch.slots.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.title} ({s.startTime} - {s.endTime})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    required
                    placeholder="Rahul"
                    value={offlineCustomerName}
                    onChange={(e) => setOfflineCustomerName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    required
                    placeholder="+91 98765 43210"
                    value={offlineCustomerPhone}
                    onChange={(e) => setOfflineCustomerPhone(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="Enter amount (e.g. 1499)"
                    value={offlineAmount}
                    onChange={(e) => setOfflineAmount(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Payment Status</label>
                  <select
                    value={offlinePaymentStatus}
                    onChange={(e) => setOfflinePaymentStatus(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                  >
                    <option value="PAID">PAID (Cash/UPI)</option>
                    <option value="PENDING">PENDING</option>
                    <option value="PARTIAL">PARTIAL ADVANCE</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Notes / Custom Setup</label>
                <textarea
                  rows={2}
                  value={offlineNotes}
                  onChange={(e) => setOfflineNotes(e.target.value)}
                  placeholder="Walk-in cash payment. Wants Happy Birthday banner."
                  className="w-full px-3 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 text-sm"
                />
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowOfflineModal(false)}
                  className="px-4 py-2 rounded-xl border border-gray-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs"
                >
                  {loading ? "Saving..." : "Save Offline Booking"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Bookings List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        {filteredBookings.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">No bookings matching filter.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
                  <th className="py-3 px-3">Booking Ref</th>
                  <th className="py-3 px-3">Customer Info</th>
                  <th className="py-3 px-3">Date & Slot</th>
                  <th className="py-3 px-3">Amount & Payment Info</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-3 text-right">Manager Verification Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                {filteredBookings.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                    <td className="py-4 px-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                      {b.bookingNumber}
                      <div className="mt-1">
                        <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                          b.bookingType === "ONLINE" ? "bg-rose-100 text-rose-800" : "bg-amber-100 text-amber-800"
                        }`}>
                          {b.bookingType}
                        </span>
                      </div>
                      {b.notes && (
                        <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 line-clamp-1 max-w-xs font-sans">
                          📝 {b.notes}
                        </div>
                      )}
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-bold text-gray-900 dark:text-white">{b.customerName}</div>
                      <div className="text-xs text-gray-500">📞 {b.customerPhone}</div>
                      {b.customerEmail && <div className="text-[11px] text-gray-400">{b.customerEmail}</div>}
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                        📅 {new Date(b.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5">🕒 {b.slotTitle || "Custom Slot"}</div>
                    </td>

                    <td className="py-4 px-3">
                      <div className="font-black text-rose-600 text-base">₹{b.totalAmount}</div>
                      
                      {/* Transaction / UTR ID display */}
                      {(() => {
                        const utr = b.transactionId || b.notes?.match(/\[UPI UTR:\s*([^\]]+)\]/)?.[1];
                        return utr ? (
                          <div className="mt-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-bold inline-block">
                            💳 UTR: {utr}
                          </div>
                        ) : (
                          <div className="text-[10px] text-gray-400 mt-0.5">No UTR logged</div>
                        );
                      })()}

                      <div className="mt-1">
                        <select
                          value={b.paymentStatus}
                          onChange={(e) => handleStatusChange(b.id, b.bookingStatus, e.target.value)}
                          className="text-xs font-bold px-2 py-1 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        >
                          <option value="PAID">PAID</option>
                          <option value="PENDING">PENDING</option>
                          <option value="PARTIAL">PARTIAL</option>
                          <option value="REFUNDED">REFUNDED</option>
                        </select>
                      </div>
                    </td>

                    <td className="py-4 px-3">
                      <span className={`text-xs font-bold px-3 py-1 rounded-full ${
                        b.bookingStatus === "CONFIRMED"
                          ? "bg-emerald-100 text-emerald-800"
                          : b.bookingStatus === "PENDING"
                          ? "bg-amber-100 text-amber-800 animate-pulse"
                          : b.bookingStatus === "COMPLETED"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-rose-100 text-rose-800"
                      }`}>
                        {b.bookingStatus}
                      </span>
                    </td>

                    {/* Quick Approve / Reject Actions */}
                    <td className="py-4 px-3 text-right">
                      {b.bookingStatus === "PENDING" ? (
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => handleStatusChange(b.id, "CONFIRMED", "PAID")}
                            className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs"
                          >
                            Approve ✓
                          </button>
                          <button
                            onClick={() => handleStatusChange(b.id, "CANCELLED", "REFUNDED")}
                            className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                          >
                            Reject ✕
                          </button>
                        </div>
                      ) : (
                        <select
                          value={b.bookingStatus}
                          onChange={(e) => handleStatusChange(b.id, e.target.value, b.paymentStatus)}
                          className="text-xs font-bold px-3 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                        >
                          <option value="CONFIRMED">CONFIRMED</option>
                          <option value="COMPLETED">COMPLETED</option>
                          <option value="CANCELLED">CANCELLED (Release Slot)</option>
                          <option value="PENDING">PENDING</option>
                        </select>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
