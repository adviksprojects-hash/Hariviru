"use client";

import { useState } from "react";
import { updateInquiryStatus } from "@/lib/actions";

export default function AdminInquiriesClient({ initialInquiries }) {
  const [inquiries, setInquiries] = useState(initialInquiries);

  const handleStatusChange = async (id, status) => {
    try {
      const res = await updateInquiryStatus(id, status);
      if (res.success) {
        setInquiries(inquiries.map((iq) => (iq.id === id ? { ...iq, status } : iq)));
      }
    } catch (err) {
      alert("Status update failed: " + err.message);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
      {inquiries.length === 0 ? (
        <p className="text-center text-sm text-gray-500 py-12">No franchise inquiries received yet.</p>
      ) : (
        <div className="space-y-4">
          {inquiries.map((iq) => (
            <div
              key={iq.id}
              className="p-5 rounded-2xl border border-gray-200 dark:border-gray-800 flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white text-base">{iq.name}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300 font-bold">
                    📍 {iq.city}
                  </span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 font-bold">
                    💰 {iq.investmentBudget}
                  </span>
                </div>

                <div className="text-xs text-gray-600 dark:text-gray-400 space-x-4">
                  <span>📞 {iq.phone}</span>
                  <span>✉️ {iq.email}</span>
                  <span>📅 {new Date(iq.createdAt).toLocaleDateString()}</span>
                </div>

                {iq.message && (
                  <p className="mt-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl">
                    "{iq.message}"
                  </p>
                )}
              </div>

              <div>
                <select
                  value={iq.status}
                  onChange={(e) => handleStatusChange(iq.id, e.target.value)}
                  className={`text-xs font-bold px-3 py-1.5 rounded-xl border ${
                    iq.status === "PENDING"
                      ? "bg-amber-50 text-amber-800 border-amber-300"
                      : iq.status === "CONTACTED"
                      ? "bg-blue-50 text-blue-800 border-blue-300"
                      : iq.status === "APPROVED"
                      ? "bg-emerald-50 text-emerald-800 border-emerald-300"
                      : "bg-rose-50 text-rose-800 border-rose-300"
                  }`}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="CONTACTED">CONTACTED</option>
                  <option value="APPROVED">APPROVED</option>
                  <option value="REJECTED">REJECTED</option>
                </select>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
