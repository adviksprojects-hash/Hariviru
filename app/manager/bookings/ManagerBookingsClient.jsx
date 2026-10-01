"use client";

import { useState } from "react";
import Link from "next/link";
import { updateBookingStatus, settleBookingBalance } from "@/lib/actions";
import { buildWhatsAppConfirmationText } from "@/lib/whatsapp";
import ManagerOfflineBookingModal from "./ManagerOfflineBookingModal";

export default function ManagerBookingsClient({
  branch,
  initialBookings,
  halls = [],
  packages = [],
  addOns = [],
}) {
  const [bookings, setBookings] = useState(initialBookings);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState("ALL"); // ALL, PENDING, ONLINE, OFFLINE
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  const [showOfflineModal, setShowOfflineModal] = useState(false);

  const getWaLink = (booking) => {
    const { waLink } = buildWhatsAppConfirmationText(booking, branch);
    return waLink;
  };

  const handleApproveAndSendWhatsApp = async (booking) => {
    try {
      const res = await updateBookingStatus(booking.id, "CONFIRMED", "PAID");
      if (res.success) {
        setBookings(bookings.map((b) => (b.id === booking.id ? res.booking : b)));

        if (res.waResult?.success) {
          alert("🎉 Booking APPROVED & Automated WhatsApp Confirmation Message Sent Successfully!");
        } else {
          if (res.waResult?.data?.error) {
            console.warn("Meta API Error:", res.waResult.data.error);
          }
          const waLink = getWaLink(booking);
          window.open(waLink, "_blank");
        }
      }
    } catch (err) {
      alert("Error approving booking: " + err.message);
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

  const handleSettleBalance = async (bookingId) => {
    try {
      const res = await settleBookingBalance(bookingId);
      if (res.success) {
        setBookings(bookings.map((b) => (b.id === bookingId ? res.booking : b)));
        alert("✅ Remaining balance settled! Booking marked as FULLY PAID.");
      }
    } catch (err) {
      alert("Error settling balance: " + err.message);
    }
  };

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

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedBookings = filteredBookings.slice((activePage - 1) * pageSize, activePage * pageSize);

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  const handleFilterChange = (type) => {
    setFilterType(type);
    setCurrentPage(1);
  };

  const handleOfflineBookingCreated = (newBooking) => {
    setBookings([newBooking, ...bookings]);
    setShowOfflineModal(false);
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
            onChange={(e) => handleSearchChange(e.target.value)}
            className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm focus:ring-2 focus:ring-rose-500 focus:outline-hidden"
          />
        </div>

        {/* Filter Pills & Calendar / Add Offline Buttons */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="bg-gray-100 dark:bg-gray-800 p-1 rounded-xl flex items-center gap-1 text-xs font-semibold">
            <button
              onClick={() => handleFilterChange("ALL")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === "ALL"
                  ? "bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-xs"
                  : "text-gray-500"
              }`}
            >
              All ({bookings.length})
            </button>
            <button
              onClick={() => handleFilterChange("PENDING")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === "PENDING"
                  ? "bg-amber-500 text-white font-bold shadow-xs"
                  : "text-amber-600 font-bold"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              onClick={() => handleFilterChange("ONLINE")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === "ONLINE"
                  ? "bg-white dark:bg-gray-900 text-rose-600 font-bold shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Online
            </button>
            <button
              onClick={() => handleFilterChange("OFFLINE")}
              className={`px-3 py-1.5 rounded-lg transition-colors ${
                filterType === "OFFLINE"
                  ? "bg-white dark:bg-gray-900 text-amber-600 font-bold shadow-xs"
                  : "text-gray-500"
              }`}
            >
              Offline
            </button>
          </div>

          <Link
            href="/manager/calendar"
            className="px-4 py-2.5 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-900 dark:text-purple-300 font-bold text-xs border border-purple-200 dark:border-purple-800 hover:bg-purple-200 transition-colors flex items-center gap-1"
          >
            <span>📅 Availability Calendar</span>
          </Link>

          <button
            onClick={() => setShowOfflineModal(true)}
            className="px-5 py-2.5 rounded-xl bg-linear-to-r from-rose-600 to-amber-600 text-white font-bold text-xs shadow-md hover:opacity-90 transition-opacity"
          >
            + Log Offline Walk-in Booking
          </button>
        </div>
      </div>

      {/* Shared Offline Booking Form Modal */}
      {showOfflineModal && (
        <ManagerOfflineBookingModal
          branch={branch}
          halls={halls}
          packages={packages}
          addOns={addOns}
          onClose={() => setShowOfflineModal(false)}
          onSuccess={handleOfflineBookingCreated}
        />
      )}

      {/* Bookings List Table */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        {filteredBookings.length === 0 ? (
          <p className="text-center text-sm text-gray-500 py-12">
            No bookings matching filter.
          </p>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-3">Booking Ref</th>
                    <th className="py-3 px-3">Customer Info</th>
                    <th className="py-3 px-3">Date & Slot</th>
                    <th className="py-3 px-3">Amount & Payment Info</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3 text-right">
                      Manager Verification Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="hover:bg-gray-50 dark:hover:bg-gray-800/40"
                    >
                      <td className="py-4 px-3 font-mono text-xs font-bold text-gray-900 dark:text-white">
                        {b.bookingNumber}
                        <div className="mt-1 flex items-center gap-1">
                          <span
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                              b.bookingType === "ONLINE"
                                ? "bg-rose-100 text-rose-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            {b.bookingType}
                          </span>
                          {b.hallName && (
                            <span className="px-2 py-0.5 rounded-md bg-purple-100 text-purple-800 dark:bg-purple-950 dark:text-purple-300 text-[10px] font-bold">
                              🏛️ {b.hallName}
                            </span>
                          )}
                        </div>
                        {b.notes && (
                          <div className="text-[11px] text-amber-700 dark:text-amber-400 mt-1 line-clamp-1 max-w-xs font-sans">
                            📝 {b.notes}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <div className="font-bold text-gray-900 dark:text-white">
                          {b.customerName}
                        </div>
                        <div className="text-xs text-gray-500">
                          📞 {b.customerPhone}
                        </div>
                        {b.customerEmail && (
                          <div className="text-[11px] text-gray-400">
                            {b.customerEmail}
                          </div>
                        )}
                      </td>

                      <td className="py-4 px-3">
                        <div className="font-semibold text-gray-800 dark:text-gray-200 text-xs">
                          📅{" "}
                          {new Date(b.bookingDate).toLocaleDateString("en-IN", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </div>
                        <div className="text-xs text-gray-500 mt-0.5">
                          🕒 {b.slotTitle || "Custom Slot"}
                        </div>
                      </td>

                      <td className="py-4 px-3">
                        <div className="font-black text-rose-600 text-base">
                          ₹{b.totalAmount}
                        </div>

                        {b.paymentStatus === "PARTIAL" || (b.remainingAmount && b.remainingAmount > 0) ? (
                          <div className="mt-1 space-y-1">
                            <div className="text-[11px] font-bold text-emerald-600">
                              Paid: ₹{b.paidAmount || 0}
                            </div>
                            <div className="text-[11px] font-bold text-amber-600">
                              Balance: ₹{b.remainingAmount || (b.totalAmount - (b.paidAmount || 0))}
                            </div>
                            <button
                              type="button"
                              onClick={() => handleSettleBalance(b.id)}
                              className="px-2.5 py-1 rounded-lg bg-amber-500 hover:bg-amber-600 text-white font-bold text-[10px] shadow-xs transition-colors block"
                            >
                              ✓ Settle Balance (Mark Paid)
                            </button>
                          </div>
                        ) : null}

                        {/* Transaction / UTR ID display */}
                        {(() => {
                          const utr =
                            b.transactionId ||
                            b.notes?.match(/\[UPI UTR:\s*([^\]]+)\]/)?.[1];
                          return utr ? (
                            <div className="mt-1 px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-mono text-emerald-800 dark:text-emerald-300 font-bold inline-block">
                              💳 UTR: {utr}
                            </div>
                          ) : (
                            <div className="text-[10px] text-gray-400 mt-0.5">
                              No UTR logged
                            </div>
                          );
                        })()}

                        <div className="mt-1">
                          <select
                            value={b.paymentStatus}
                            onChange={(e) =>
                              handleStatusChange(
                                b.id,
                                b.bookingStatus,
                                e.target.value
                              )
                            }
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
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-full ${
                            b.bookingStatus === "CONFIRMED"
                              ? "bg-emerald-100 text-emerald-800"
                              : b.bookingStatus === "PENDING"
                              ? "bg-amber-100 text-amber-800 animate-pulse"
                              : b.bookingStatus === "COMPLETED"
                              ? "bg-blue-100 text-blue-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {b.bookingStatus}
                        </span>
                      </td>

                      {/* Quick Approve & Send WhatsApp / Reject Actions */}
                      <td className="py-4 px-3 text-right">
                        {b.bookingStatus === "PENDING" ? (
                          <div className="flex items-center justify-end gap-2 flex-wrap sm:flex-nowrap">
                            <button
                              onClick={() => handleApproveAndSendWhatsApp(b)}
                              title="Approve booking and open pre-filled WhatsApp confirmation message to send to customer"
                              className="px-3.5 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-xs flex items-center gap-1.5 shrink-0"
                            >
                              <span>Approve & WhatsApp 💬</span>
                            </button>
                            <button
                              onClick={() =>
                                handleStatusChange(
                                  b.id,
                                  "CANCELLED",
                                  "REFUNDED"
                                )
                              }
                              className="px-3 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-xs"
                            >
                              Reject ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center justify-end gap-2">
                            <a
                              href={getWaLink(b)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-colors inline-flex items-center gap-1"
                            >
                              <span>💬 Send WhatsApp</span>
                            </a>
                            <select
                              value={b.bookingStatus}
                              onChange={(e) =>
                                handleStatusChange(
                                  b.id,
                                  e.target.value,
                                  b.paymentStatus
                                )
                              }
                              className="text-xs font-bold px-2.5 py-1.5 rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800"
                            >
                              <option value="CONFIRMED">CONFIRMED</option>
                              <option value="COMPLETED">COMPLETED</option>
                              <option value="CANCELLED">
                                CANCELLED (Release Slot)
                              </option>
                              <option value="PENDING">PENDING</option>
                            </select>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
              <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="text-xs text-gray-500 font-medium">
                  Showing{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {(activePage - 1) * pageSize + 1}
                  </span>{" "}
                  to{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {Math.min(activePage * pageSize, filteredBookings.length)}
                  </span>{" "}
                  of{" "}
                  <span className="font-bold text-gray-900 dark:text-white">
                    {filteredBookings.length}
                  </span>{" "}
                  bookings
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={activePage === 1}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    ← Previous
                  </button>

                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(
                    (pageNum) => (
                      <button
                        key={pageNum}
                        onClick={() => setCurrentPage(pageNum)}
                        className={`w-8 h-8 rounded-xl text-xs font-bold transition-all ${
                          pageNum === activePage
                            ? "bg-rose-600 text-white shadow-xs"
                            : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                        }`}
                      >
                        {pageNum}
                      </button>
                    )
                  )}

                  <button
                    onClick={() =>
                      setCurrentPage((p) => Math.min(totalPages, p + 1))
                    }
                    disabled={activePage === totalPages}
                    className="px-3 py-1.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    Next →
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
