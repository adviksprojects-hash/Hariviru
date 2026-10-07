"use client";

import { useState, useEffect } from "react";
import {
  sendWhatsAppAdminReplyAction,
  sendWhatsAppReminderTemplateAction,
  saveCustomFestivalTemplateAction,
  deleteCustomFestivalTemplateAction,
} from "@/lib/actions";

function formatDateString(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  const options = { day: "numeric", month: "short", year: "numeric" };
  return d.toLocaleDateString("en-IN", options);
}

function replaceTemplateVariables(templateText, customer, coupon = "", ctaUrl = "") {
  if (!templateText) return "";
  const customerName = customer?.name || "Valued Customer";
  const eventDate = customer?.upcomingEventDate ? formatDateString(customer.upcomingEventDate) : "Upcoming Date";
  const branchName = customer?.branchName || "HaruViru Celebration House";
  const couponCode = coupon || "SPECIAL2026";
  const bookingLink = ctaUrl || "https://haruviru.com/branches";

  return templateText
    .replace(/\{customerName\}/g, customerName)
    .replace(/\{eventDate\}/g, eventDate)
    .replace(/\{branchName\}/g, branchName)
    .replace(/\{couponCode\}/g, couponCode)
    .replace(/\{bookingLink\}/g, bookingLink);
}

export default function ManagerMarketingClient({
  initialCustomers,
  initialTemplates,
  branches,
}) {
  const [activeTab, setActiveTab] = useState("target"); // "target" | "templates"
  const [targetFilter, setTargetFilter] = useState("due2days"); // "due2days" | "all" | "birthday" | "anniversary" | "week"
  const [searchTerm, setSearchTerm] = useState("");
  const [customers, setCustomers] = useState(initialCustomers || []);
  const [templates, setTemplates] = useState(initialTemplates || []);

  // Messaging Modal & Radio Template Selection State
  const [selectedCustomer, setSelectedCustomer] = useState(null);
  const [messageModalOpen, setMessageModalOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState("");
  const [customMessage, setCustomMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [sendSuccessAlert, setSendSuccessAlert] = useState(null);

  // Template Creator State
  const [showTplForm, setShowTplForm] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("BIRTHDAY");
  const [newMessage, setNewMessage] = useState("");
  const [newCoupon, setNewCoupon] = useState("PARTY2026");
  const [newCtaUrl, setNewCtaUrl] = useState("https://haruviru.com/branches");
  const [isSavingTpl, setIsSavingTpl] = useState(false);

  // Filter target customers
  const filteredCustomers = customers.filter((c) => {
    // Search filter
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      const matchName = c.name.toLowerCase().includes(q);
      const matchPhone = c.phone.includes(q);
      const matchNotes = c.notes.toLowerCase().includes(q);
      if (!matchName && !matchPhone && !matchNotes) return false;
    }

    // Category / Due Date Filter
    if (targetFilter === "due2days") return c.isDueIn2Days;
    if (targetFilter === "week") return c.isDueThisWeek;
    if (targetFilter === "birthday") return c.category === "BIRTHDAY";
    if (targetFilter === "anniversary") return c.category === "ANNIVERSARY";
    if (targetFilter === "reunion") return c.category === "REUNION";
    return true; // "all"
  });

  const countDueIn2Days = customers.filter((c) => c.isDueIn2Days).length;

  // Open Messaging Modal for a target customer
  const handleOpenMessageModal = (cust) => {
    setSelectedCustomer(cust);

    // Filter templates for matching category or default to first
    const matchingTpl =
      templates.find((t) => t.category === cust.category) ||
      templates.find((t) => t.category === "GENERAL") ||
      templates[0];

    const defaultTplId = matchingTpl ? matchingTpl.id : "";
    setSelectedTemplateId(defaultTplId);

    if (matchingTpl) {
      const replaced = replaceTemplateVariables(
        matchingTpl.message,
        cust,
        matchingTpl.couponCode,
        matchingTpl.callToActionUrl
      );
      setCustomMessage(replaced);
    } else {
      setCustomMessage(
        `Hi ${cust.name}, your celebration date is coming up on ${formatDateString(
          cust.upcomingEventDate
        )}! Book your private hall at ${cust.branchName}: https://haruviru.com/branches`
      );
    }

    setMessageModalOpen(true);
    setSendSuccessAlert(null);
  };

  // Handle Radio Button Template Selection
  const handleTemplateRadioChange = (tplId) => {
    setSelectedTemplateId(tplId);
    const tpl = templates.find((t) => t.id === tplId);
    if (tpl && selectedCustomer) {
      const replaced = replaceTemplateVariables(
        tpl.message,
        selectedCustomer,
        tpl.couponCode,
        tpl.callToActionUrl
      );
      setCustomMessage(replaced);
    }
  };

  // Insert variable tag into template creation textarea
  const handleInsertVariable = (varTag) => {
    setNewMessage((prev) => prev + ` ${varTag} `);
  };

  // Send Direct WhatsApp Message via Meta Cloud API Template / Local Store
  const handleSendWhatsAppMessage = async (e) => {
    e.preventDefault();
    if (!selectedCustomer || !customMessage.trim()) return;

    setIsSending(true);
    setSendSuccessAlert(null);

    try {
      const activeTpl = templates.find((t) => t.id === selectedTemplateId);
      const res = await sendWhatsAppReminderTemplateAction({
        toPhone: selectedCustomer.cleanPhone,
        customerName: selectedCustomer.name,
        eventDate: formatDateString(selectedCustomer.upcomingEventDate),
        branchName: selectedCustomer.branchName,
        couponCode: activeTpl?.couponCode || "SPECIAL2026",
        category: selectedCustomer.category,
        messageText: customMessage.trim(),
      });

      if (res.success) {
        setSendSuccessAlert(
          `✅ Template message successfully sent to ${selectedCustomer.name} (+${selectedCustomer.cleanPhone}) via Meta WhatsApp API!`
        );
        setTimeout(() => {
          setMessageModalOpen(false);
          setSendSuccessAlert(null);
        }, 2000);
      }
    } catch (err) {
      alert("Error sending WhatsApp notification: " + err.message);
    } finally {
      setIsSending(false);
    }
  };

  // Save new custom template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTitle.trim() || !newMessage.trim()) return;

    setIsSavingTpl(true);
    try {
      const res = await saveCustomFestivalTemplateAction({
        title: newTitle,
        category: newCategory,
        message: newMessage,
        couponCode: newCoupon,
        callToActionUrl: newCtaUrl,
      });

      if (res.success) {
        setTemplates(res.templates || []);
        setShowTplForm(false);
        setNewTitle("");
        setNewMessage("");
      }
    } catch (err) {
      alert("Error saving template: " + err.message);
    } finally {
      setIsSavingTpl(false);
    }
  };

  // Delete a saved template
  const handleDeleteTemplate = async (id) => {
    if (!confirm("Are you sure you want to delete this template?")) return;
    try {
      const res = await deleteCustomFestivalTemplateAction(id);
      if (res.success) {
        setTemplates(res.templates || []);
      }
    } catch (err) {
      alert("Error deleting template: " + err.message);
    }
  };

  return (
    <div className="space-y-6">
      {/* Navigation Header Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2.5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("target")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "target"
                ? "bg-linear-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span>🎯 Target Customers</span>
            {countDueIn2Days > 0 && (
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-gray-950 font-black text-[10px] animate-pulse">
                {countDueIn2Days} Due in 2 Days
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "templates"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span>📝 Message Templates ({templates.length})</span>
          </button>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: TARGET CUSTOMERS & 2-DAY REMINDERS */}
      {/* ========================================================================= */}
      {activeTab === "target" && (
        <div className="space-y-6">
          {/* Quick Category / Due Filter Pills */}
          <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={() => setTargetFilter("due2days")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                  targetFilter === "due2days"
                    ? "bg-amber-500 text-white shadow-md shadow-amber-500/30"
                    : "bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 hover:bg-amber-100"
                }`}
              >
                <span>🔥 Due in 2 Days</span>
                <span className="px-1.5 py-0.5 rounded-full bg-black/20 text-[10px]">
                  {customers.filter((c) => c.isDueIn2Days).length}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setTargetFilter("week")}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  targetFilter === "week"
                    ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200"
                }`}
              >
                📅 Due This Week ({customers.filter((c) => c.isDueThisWeek).length})
              </button>
            </div>

            <input
              type="text"
              placeholder="Search target customer name, phone, notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white w-full sm:w-64 focus:ring-2 focus:ring-rose-500"
            />
          </div>

          {/* Target Customers Cards List */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredCustomers.length === 0 ? (
              <div className="col-span-full p-12 text-center bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800">
                <div className="text-4xl mb-3">🎯</div>
                <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">
                  No Target Customers Found
                </h3>
                <p className="text-xs text-gray-500">
                  No past celebration customers match the selected filter category or search criteria.
                </p>
              </div>
            ) : (
              filteredCustomers.map((cust) => (
                <div
                  key={cust.id}
                  className={`bg-white dark:bg-gray-900 rounded-3xl p-6 border shadow-sm transition-all flex flex-col justify-between space-y-4 relative overflow-hidden ${
                    cust.isDueIn2Days
                      ? "border-amber-400 dark:border-amber-600 ring-2 ring-amber-400/30"
                      : "border-gray-200 dark:border-gray-800 hover:border-rose-300"
                  }`}
                >
                  {cust.isDueIn2Days && (
                    <div className="absolute top-0 right-0 bg-amber-500 text-white font-black text-[10px] px-3 py-1 rounded-bl-2xl uppercase tracking-wider shadow-sm flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-white animate-ping" />
                      <span>🔥 Due in 2 Days!</span>
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider">
                        {cust.category === "BIRTHDAY"
                          ? "🎂 Birthday"
                          : cust.category === "ANNIVERSARY"
                          ? "💍 Anniversary"
                          : cust.category === "REUNION"
                          ? "🎉 Reunion"
                          : "✨ Celebration"}
                      </span>
                      <span className="text-[11px] text-gray-400 font-semibold">
                        Branch: {cust.branchName}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-gray-900 dark:text-white mb-1">
                      {cust.name}
                    </h3>
                    <p className="text-xs font-mono font-semibold text-rose-600 dark:text-rose-400 mb-3">
                      +{cust.cleanPhone}
                    </p>

                    <div className="p-3 rounded-2xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-700/60 space-y-1.5 text-xs text-gray-600 dark:text-gray-300">
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Original Event:</span>
                        <span className="font-bold">{formatDateString(cust.originalBookingDate)}</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-400 font-semibold">Upcoming Date:</span>
                        <span className="font-black text-amber-600 dark:text-amber-400">
                          {formatDateString(cust.upcomingEventDate)}
                        </span>
                      </div>
                      <div className="flex items-center justify-between pt-1 border-t border-gray-200/60 dark:border-gray-700/60">
                        <span className="text-gray-400 font-semibold">Days Remaining:</span>
                        <span
                          className={`font-extrabold ${
                            cust.isDueIn2Days
                              ? "text-amber-600"
                              : cust.isDueThisWeek
                              ? "text-rose-600"
                              : "text-emerald-600"
                          }`}
                        >
                          {cust.daysUntil === 0
                            ? "🎉 Today!"
                            : cust.daysUntil === 1
                            ? "🎂 Tomorrow!"
                            : cust.daysUntil === 2
                            ? "🔥 Exactly 2 Days!"
                            : `In ${cust.daysUntil} Days`}
                        </span>
                      </div>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleOpenMessageModal(cust)}
                    className="w-full py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all flex items-center justify-center gap-2"
                  >
                    <span>💬 Send WhatsApp Offer</span>
                    <span>➔</span>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: TEMPLATE MANAGER & VARIABLE CREATOR */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Event Category Message Templates
              </h2>
              <p className="text-xs text-gray-500">
                Create reusable message templates with dynamic variables like {"{customerName}"}, {"{eventDate}"}, and {"{branchName}"}.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTplForm(!showTplForm)}
              className="px-5 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-purple-600/30 transition-all flex items-center gap-2"
            >
              <span>{showTplForm ? "✕ Close Form" : "➕ Create Category Template"}</span>
            </button>
          </div>

          {/* Create New Template Form Modal/Accordion */}
          {showTplForm && (
            <form
              onSubmit={handleSaveTemplate}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-purple-200 dark:border-purple-800 shadow-lg space-y-4"
            >
              <h3 className="text-sm font-bold text-purple-600 uppercase tracking-wider">
                Create New Template with Variables
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="e.g. 🎂 Birthday Return Wish & 20% OFF Deal"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Event Category
                  </label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs font-bold text-gray-900 dark:text-white"
                  >
                    <option value="BIRTHDAY">🎂 Birthday Celebration Re-Booking</option>
                    <option value="ANNIVERSARY">💍 Anniversary Celebration Re-Booking</option>
                  </select>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                    Message Body (Click variable pills to insert)
                  </label>
                  <div className="flex flex-wrap gap-1">
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("{customerName}")}
                      className="px-2 py-0.5 rounded-lg bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-mono font-bold hover:bg-purple-200"
                    >
                      + {"{customerName}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("{eventDate}")}
                      className="px-2 py-0.5 rounded-lg bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-[10px] font-mono font-bold hover:bg-amber-200"
                    >
                      + {"{eventDate}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("{branchName}")}
                      className="px-2 py-0.5 rounded-lg bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-mono font-bold hover:bg-rose-200"
                    >
                      + {"{branchName}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("{couponCode}")}
                      className="px-2 py-0.5 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-[10px] font-mono font-bold hover:bg-emerald-200"
                    >
                      + {"{couponCode}"}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleInsertVariable("{bookingLink}")}
                      className="px-2 py-0.5 rounded-lg bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 text-[10px] font-mono font-bold hover:bg-blue-200"
                    >
                      + {"{bookingLink}"}
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  required
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Dear {customerName}, celebrate your upcoming {eventDate} at {branchName}! Use coupon {couponCode}... Reserve: {bookingLink}"
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white leading-relaxed"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newCoupon}
                    onChange={(e) => setNewCoupon(e.target.value)}
                    placeholder="e.g. PARTY2026"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs font-mono font-bold text-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Call To Action URL
                  </label>
                  <input
                    type="url"
                    value={newCtaUrl}
                    onChange={(e) => setNewCtaUrl(e.target.value)}
                    placeholder="https://haruviru.com/branches"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingTpl}
                className="px-6 py-3 rounded-2xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider transition-all disabled:opacity-50"
              >
                {isSavingTpl ? "Saving Template..." : "💾 Save Custom Template"}
              </button>
            </form>
          )}

          {/* Templates Grid Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {templates.map((tpl) => (
              <div
                key={tpl.id}
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-purple-300 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold uppercase tracking-wider">
                      {tpl.category}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleDeleteTemplate(tpl.id)}
                      className="text-gray-400 hover:text-rose-600 text-xs"
                      title="Delete Template"
                    >
                      🗑️
                    </button>
                  </div>

                  <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-2">
                    {tpl.title}
                  </h3>

                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60 font-sans whitespace-pre-wrap">
                    {tpl.message}
                  </p>

                  {tpl.couponCode && (
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-mono font-bold border border-emerald-200">
                      🎟️ Coupon: {tpl.couponCode}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* RADIO TEMPLATE SELECTION MODAL FOR DIRECT MESSAGING */}
      {/* ========================================================================= */}
      {messageModalOpen && selectedCustomer && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-900 rounded-3xl max-w-2xl w-full p-6 sm:p-8 space-y-6 border border-gray-200 dark:border-gray-800 shadow-2xl relative my-8">
            <div className="flex items-start justify-between border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300">
                  Target: {selectedCustomer.category} Event
                </span>
                <h3 className="text-lg font-black text-gray-900 dark:text-white mt-1">
                  Send WhatsApp Reminder to {selectedCustomer.name}
                </h3>
                <p className="text-xs text-gray-500 font-mono">
                  +{selectedCustomer.cleanPhone} • Celebration Date: {formatDateString(selectedCustomer.upcomingEventDate)}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setMessageModalOpen(false)}
                className="text-gray-400 hover:text-gray-600 text-lg"
              >
                ✕
              </button>
            </div>

            {sendSuccessAlert && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-bold">
                {sendSuccessAlert}
              </div>
            )}

            {/* Radio Button Template Selector */}
            <div className="space-y-3">
              <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                Select Message Template (Radio Buttons)
              </label>

              <div className="space-y-2.5 max-h-56 overflow-y-auto pr-1 whatsapp-scrollbar">
                {templates.map((tpl) => {
                  const isSelected = selectedTemplateId === tpl.id;
                  return (
                    <label
                      key={tpl.id}
                      className={`flex items-start gap-3 p-3.5 rounded-2xl border cursor-pointer transition-all ${
                        isSelected
                          ? "bg-purple-50/80 dark:bg-purple-950/50 border-purple-500 ring-2 ring-purple-500/20"
                          : "bg-gray-50/50 dark:bg-gray-800/40 border-gray-200 dark:border-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <input
                        type="radio"
                        name="templateRadio"
                        checked={isSelected}
                        onChange={() => handleTemplateRadioChange(tpl.id)}
                        className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500 border-gray-300"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-gray-900 dark:text-white">
                            {tpl.title}
                          </span>
                          <span className="text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                            {tpl.category}
                          </span>
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {tpl.message}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {/* Replaced Message Preview & Editor */}
            <form onSubmit={handleSendWhatsAppMessage} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                  Final WhatsApp Message Preview (Variables Replaced)
                </label>
                <textarea
                  rows={4}
                  required
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white leading-relaxed focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex flex-col sm:flex-row items-center gap-3 pt-2">
                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full sm:flex-1 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSending ? (
                    <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>🚀 Send Direct WhatsApp Message</span>
                    </>
                  )}
                </button>

                <a
                  href={`https://wa.me/${selectedCustomer.cleanPhone}?text=${encodeURIComponent(
                    customMessage
                  )}`}
                  target="_blank"
                  rel="noreferrer"
                  className="w-full sm:w-auto px-5 py-3.5 rounded-2xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 font-bold text-xs hover:bg-emerald-200 transition-all text-center"
                >
                  💬 Open WhatsApp Web ↗
                </a>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
