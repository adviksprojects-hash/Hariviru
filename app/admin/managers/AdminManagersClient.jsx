"use client";

import { useState, useMemo } from "react";
import { createHistoricalAdminBooking } from "@/lib/actions";

export default function AdminManagersClient({ initialBookings = [], branches = [] }) {
  const [bookings, setBookings] = useState(initialBookings);
  const [selectedBranchFilter, setSelectedBranchFilter] = useState("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Historical Entry Modal State
  const [showHistoricalModal, setShowHistoricalModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState(null);

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    eventCategory: "Birthday",
    branchId: branches[0]?.id || "",
    bookingDate: new Date().toISOString().split("T")[0],
    totalAmount: "1499",
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleHistoricalSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg(null);

    try {
      const res = await createHistoricalAdminBooking(formData);
      if (res.success) {
        // Prepend and sort bookings date-wise (descending order)
        const updated = [res.booking, ...bookings].sort(
          (a, b) => new Date(b.bookingDate) - new Date(a.bookingDate)
        );
        setBookings(updated);
        setShowHistoricalModal(false);
        setFormData({
          customerName: "",
          customerPhone: "",
          customerEmail: "",
          eventCategory: "Birthday",
          branchId: branches[0]?.id || "",
          bookingDate: new Date().toISOString().split("T")[0],
          totalAmount: "1499",
        });
        alert("🎉 Historical celebration booking entry added successfully! Analytics updated.");
      }
    } catch (err) {
      setErrorMsg(err.message || "Failed to add historical booking entry.");
    } finally {
      setSubmitting(false);
    }
  };

  // Filter bookings by Franchise Branch & Search Query (Customer Name, Mobile Number, Event Category)
  const filteredBookings = useMemo(() => {
    return bookings.filter((b) => {
      // 1. Franchise Filter
      if (selectedBranchFilter !== "ALL" && b.branch?.id !== selectedBranchFilter) {
        return false;
      }

      // 2. Search Filter (Customer Name, Mobile Number, Event Category, Booking Number)
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const nameMatch = b.customerName?.toLowerCase().includes(q);
        const phoneMatch = b.customerPhone?.includes(q);
        const categoryMatch = b.eventCategory?.toLowerCase().includes(q);
        const bookingNumMatch = b.bookingNumber?.toLowerCase().includes(q);
        if (!nameMatch && !phoneMatch && !categoryMatch && !bookingNumMatch) {
          return false;
        }
      }

      return true;
    });
  }, [bookings, selectedBranchFilter, searchQuery]);

  // Pagination calculation
  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / pageSize));
  const activePage = Math.min(currentPage, totalPages);
  const paginatedBookings = useMemo(() => {
    const start = (activePage - 1) * pageSize;
    return filteredBookings.slice(start, start + pageSize);
  }, [filteredBookings, activePage, pageSize]);

  const handleBranchFilterChange = (val) => {
    setSelectedBranchFilter(val);
    setCurrentPage(1);
  };

  const handleSearchChange = (val) => {
    setSearchQuery(val);
    setCurrentPage(1);
  };

  return (
    <div className="space-y-6">
      
      {/* Search & Franchise Branch Filter Controls */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <div>
            <h2 className="text-xl font-black text-gray-900 dark:text-white">
              🎉 Celebration Customers ({filteredBookings.length})
            </h2>
            <p className="text-xs text-gray-500">
              Directory of customers who have booked celebration slots across franchises.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            {/* Search Input for Mobile No / Customer Name / Event Category */}
            <input
              type="text"
              placeholder="🔍 Search name, mobile no, event..."
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white min-w-[220px]"
            />

            {/* Franchise Branch Filter */}
            <select
              value={selectedBranchFilter}
              onChange={(e) => handleBranchFilterChange(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
            >
              <option value="ALL">🏢 All Franchises ({bookings.length} Bookings)</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  📍 {b.name} ({b.city})
                </option>
              ))}
            </select>

            {/* Add Historical Entry Button */}
            <button
              onClick={() => setShowHistoricalModal(true)}
              className="px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all flex items-center gap-1.5"
            >
              <span>+ Add Historical Booking Data</span>
            </button>
          </div>
        </div>

        {/* Customer Bookings Table */}
        {filteredBookings.length === 0 ? (
          <div className="text-center py-12 text-sm text-gray-500">
            No celebration customer bookings match the selected filters.
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-800 text-xs text-gray-500 uppercase">
                    <th className="py-3 px-3">Customer Name</th>
                    <th className="py-3 px-3">Mobile Number</th>
                    <th className="py-3 px-3">Event Category</th>
                    <th className="py-3 px-3">Franchise Branch</th>
                    <th className="py-3 px-3">Date & Slot</th>
                    <th className="py-3 px-3">Amount & Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                  {paginatedBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                      {/* Customer Name */}
                      <td className="py-4 px-3 font-semibold text-gray-900 dark:text-white">
                        <div className="font-bold text-base">{b.customerName}</div>
                        <div className="text-xs text-gray-400 font-mono">#{b.bookingNumber}</div>
                      </td>

                      {/* Mobile Number */}
                      <td className="py-4 px-3">
                        <div className="font-mono text-sm font-bold text-gray-900 dark:text-white">
                          📞 {b.customerPhone}
                        </div>
                        {b.customerEmail && (
                          <div className="text-xs text-gray-400">{b.customerEmail}</div>
                        )}
                      </td>

                      {/* Event Category */}
                      <td className="py-4 px-3">
                        <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-extrabold uppercase tracking-wider">
                          🎈 {b.eventCategory || "Birthday"}
                        </span>
                      </td>

                      {/* Franchise Branch */}
                      <td className="py-4 px-3 font-semibold text-gray-900 dark:text-white">
                        <div>📍 {b.branch?.name || "Franchise Branch"}</div>
                        <div className="text-xs text-gray-400">{b.branch?.city}</div>
                      </td>

                      {/* Date & Slot */}
                      <td className="py-4 px-3 text-xs text-gray-700 dark:text-gray-300">
                        <div className="font-bold">
                          📅 {new Date(b.bookingDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </div>
                        <div className="text-gray-500 mt-0.5">🕒 {b.slotTitle || "Custom Slot"}</div>
                      </td>

                      {/* Amount & Status */}
                      <td className="py-4 px-3">
                        <div className="font-black text-rose-600 text-base">₹{b.totalAmount}</div>
                        <span className={`inline-block mt-1 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                          b.bookingStatus === "CONFIRMED"
                            ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300"
                            : b.bookingStatus === "COMPLETED"
                            ? "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300"
                            : "bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300"
                        }`}>
                          {b.bookingStatus} ({b.bookingType})
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls (10 items per page) */}
            <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <div className="text-xs text-gray-500 font-medium">
                Showing <span className="font-bold text-gray-900 dark:text-white">{(activePage - 1) * pageSize + 1}</span> to{" "}
                <span className="font-bold text-gray-900 dark:text-white">{Math.min(activePage * pageSize, filteredBookings.length)}</span> of{" "}
                <span className="font-bold text-gray-900 dark:text-white">{filteredBookings.length}</span> celebration customers
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={activePage === 1}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  ← Previous
                </button>

                <span className="text-xs font-mono font-bold px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                  Page {activePage} of {totalPages}
                </span>

                <button
                  onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
                  disabled={activePage === totalPages}
                  className="px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  Next →
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {/* HISTORICAL BOOKING ENTRY MODAL FOR ADMIN */}
      {showHistoricalModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 max-w-lg w-full border border-gray-200 dark:border-gray-800 shadow-2xl space-y-5 animate-scaleUp">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100 dark:border-gray-800">
              <div>
                <span className="px-2.5 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                  Admin Master Entry
                </span>
                <h3 className="text-xl font-black text-gray-900 dark:text-white mt-1">
                  📅 Add Historical Booking Data
                </h3>
              </div>
              <button
                onClick={() => setShowHistoricalModal(false)}
                className="text-gray-400 hover:text-gray-600 text-xl font-bold"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
                ⚠️ {errorMsg}
              </div>
            )}

            <form onSubmit={handleHistoricalSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    name="customerName"
                    required
                    placeholder="e.g., Rajesh Kumar"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                  <input
                    type="tel"
                    name="customerPhone"
                    required
                    placeholder="+91 98765 43210"
                    value={formData.customerPhone}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Email Address (Optional)</label>
                <input
                  type="email"
                  name="customerEmail"
                  placeholder="rajesh@example.com (optional)"
                  value={formData.customerEmail}
                  onChange={handleInputChange}
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Event Category *</label>
                  <select
                    name="eventCategory"
                    required
                    value={formData.eventCategory}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-semibold"
                  >
                    <option value="Birthday">Birthday</option>
                    <option value="Anniversary">Anniversary</option>
                    <option value="Engagement">Engagement</option>
                    <option value="Baby Shower">Baby Shower</option>
                    <option value="Corporate Event">Corporate Event</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Franchise Branch *</label>
                  <select
                    name="branchId"
                    required
                    value={formData.branchId}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-semibold"
                  >
                    {branches.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Booking Date *</label>
                  <input
                    type="date"
                    name="bookingDate"
                    required
                    value={formData.bookingDate}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">Total Amount (₹) *</label>
                  <input
                    type="number"
                    name="totalAmount"
                    required
                    min="0"
                    placeholder="1499"
                    value={formData.totalAmount}
                    onChange={handleInputChange}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-sm font-bold"
                  />
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowHistoricalModal(false)}
                  className="px-5 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400 hover:bg-gray-50"
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md transition-all"
                >
                  {submitting ? "Saving Entry..." : "Save Historical Entry →"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
