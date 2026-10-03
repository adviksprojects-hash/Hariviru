"use client";

import { useState, useEffect, useRef } from "react";
import {
  sendWhatsAppMarketingBroadcast,
  sendWhatsAppAdminReplyAction,
  simulateCustomerReplyAction,
  saveCustomFestivalTemplateAction,
  deleteCustomFestivalTemplateAction,
  getWhatsAppChatInboxData,
} from "@/lib/actions";

function formatTimeString(isoString) {
  if (!isoString) return "";
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return "";
  let hours = d.getHours();
  const minutes = String(d.getMinutes()).padStart(2, "0");
  const ampm = hours >= 12 ? "PM" : "AM";
  hours = hours % 12;
  hours = hours ? hours : 12;
  const strHours = String(hours).padStart(2, "0");
  return `${strHours}:${minutes} ${ampm}`;
}

export default function WhatsAppMarketingClient({
  initialBranches,
  initialCustomers,
  initialConversations,
  initialTemplates,
}) {
  const [activeTab, setActiveTab] = useState("inbox"); // "inbox" | "broadcast" | "templates"

  // Conversations & Chat Inbox State
  const [conversations, setConversations] = useState(initialConversations || []);
  const [selectedCustomer, setSelectedCustomer] = useState(
    initialCustomers && initialCustomers.length > 0 ? initialCustomers[0] : null
  );
  const [messages, setMessages] = useState([]);
  const [replyText, setReplyText] = useState("");
  const [isReplying, setIsReplying] = useState(false);
  const [inboxSearch, setInboxSearch] = useState("");
  const [simulateModalOpen, setSimulateModalOpen] = useState(false);
  const [simCustomerText, setSimCustomerText] = useState("Hello! I want to know about your Diwali booking offers.");
  const chatBottomRef = useRef(null);

  // Template Manager State
  const [templates, setTemplates] = useState(initialTemplates || []);
  const [showTplForm, setShowTplForm] = useState(false);
  const [newTplTitle, setNewTplTitle] = useState("");
  const [newTplCategory, setNewTplCategory] = useState("FESTIVAL");
  const [newTplMessage, setNewTplMessage] = useState("");
  const [newTplCoupon, setNewTplCoupon] = useState("");
  const [newTplCtaUrl, setNewTplCtaUrl] = useState("https://haruviru.com/branches");
  const [isSavingTpl, setIsSavingTpl] = useState(false);

  // Broadcast State
  const [selectedBranch, setSelectedBranch] = useState("all");
  const [useManualPhones, setUseManualPhones] = useState(false);
  const [manualPhonesText, setManualPhonesText] = useState("");

  const [campaignTitle, setCampaignTitle] = useState("🪔 Happy Diwali Festive Special Offer!");
  const [offerMessage, setOfferMessage] = useState(
    "Get flat 20% OFF on all private celebration hall bookings! Book your birthday, anniversary, or surprise party slot this festive season and make unforgettable memories with your loved ones."
  );
  const [couponCode, setCouponCode] = useState("DIWALI20");
  const [callToActionUrl, setCallToActionUrl] = useState("https://haruviru.com/branches");

  const [isSending, setIsSending] = useState(false);
  const [broadcastResult, setBroadcastResult] = useState(null);
  const [error, setError] = useState(null);
  const [audienceSearch, setAudienceSearch] = useState("");

  // Load chat messages when selected customer changes
  useEffect(() => {
    if (selectedCustomer) {
      fetchChatData(selectedCustomer.cleanPhone);
    }
  }, [selectedCustomer]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchChatData = async (phone) => {
    try {
      const res = await getWhatsAppChatInboxData(phone);
      if (res.success) {
        setConversations(res.conversations || []);
        setMessages(res.currentMessages || []);
        if (res.templates) setTemplates(res.templates);
      }
    } catch (err) {
      console.error("Error fetching chat data:", err);
    }
  };

  // Admin replies directly to customer
  const handleSendAdminReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !selectedCustomer) return;

    setIsReplying(true);
    try {
      const res = await sendWhatsAppAdminReplyAction(
        selectedCustomer.cleanPhone,
        replyText
      );
      if (res.success) {
        setMessages(res.messages || []);
        setConversations(res.conversations || []);
        setReplyText("");
      }
    } catch (err) {
      alert("Error sending reply: " + err.message);
    } finally {
      setIsReplying(false);
    }
  };

  // Simulate customer incoming reply for testing webhook/inbox
  const handleSimulateReply = async (e) => {
    e.preventDefault();
    if (!simCustomerText.trim() || !selectedCustomer) return;

    try {
      const res = await simulateCustomerReplyAction(
        selectedCustomer.cleanPhone,
        selectedCustomer.name,
        simCustomerText
      );
      if (res.success) {
        setMessages(res.messages || []);
        setConversations(res.conversations || []);
        setSimulateModalOpen(false);
        setSimCustomerText("");
      }
    } catch (err) {
      alert("Error simulating customer reply: " + err.message);
    }
  };

  // Save new custom festival template
  const handleSaveTemplate = async (e) => {
    e.preventDefault();
    if (!newTplTitle.trim() || !newTplMessage.trim()) return;

    setIsSavingTpl(true);
    try {
      const res = await saveCustomFestivalTemplateAction({
        title: newTplTitle,
        category: newTplCategory,
        message: newTplMessage,
        couponCode: newTplCoupon,
        callToActionUrl: newTplCtaUrl,
      });

      if (res.success) {
        setTemplates(res.templates || []);
        setShowTplForm(false);
        setNewTplTitle("");
        setNewTplMessage("");
        setNewTplCoupon("");
      }
    } catch (err) {
      alert("Error saving template: " + err.message);
    } finally {
      setIsSavingTpl(false);
    }
  };

  // Delete a saved custom template
  const handleDeleteTemplate = async (templateId) => {
    if (!confirm("Are you sure you want to delete this festival template?")) return;
    try {
      const res = await deleteCustomFestivalTemplateAction(templateId);
      if (res.success) {
        setTemplates(res.templates || []);
      }
    } catch (err) {
      alert("Error deleting template: " + err.message);
    }
  };

  // Load a saved template into the broadcast composer
  const loadTemplateToBroadcast = (tpl) => {
    setCampaignTitle(tpl.title);
    setOfferMessage(tpl.message);
    setCouponCode(tpl.couponCode || "");
    setCallToActionUrl(tpl.callToActionUrl || "https://haruviru.com/branches");
    setActiveTab("broadcast");
  };

  // Filter customer contacts for target broadcast audience
  const filteredAudience = initialCustomers.filter((c) => {
    if (selectedBranch !== "all" && c.branchId !== selectedBranch) return false;
    if (audienceSearch) {
      const q = audienceSearch.toLowerCase();
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.includes(q) ||
        c.branchName.toLowerCase().includes(q)
      );
    }
    return true;
  });

  // Execute broadcast
  const handleBroadcast = async (e) => {
    e.preventDefault();
    if (!campaignTitle.trim() || !offerMessage.trim()) {
      setError("Please fill in campaign title and offer message.");
      return;
    }

    setIsSending(true);
    setError(null);
    setBroadcastResult(null);

    try {
      const res = await sendWhatsAppMarketingBroadcast({
        branchId: selectedBranch,
        campaignTitle,
        offerMessage,
        couponCode,
        callToActionUrl,
        manualPhones: useManualPhones ? manualPhonesText : null,
      });

      if (res.success) {
        setBroadcastResult(res);
        // Refresh conversations to include broadcast logs
        fetchChatData(selectedCustomer?.cleanPhone);
      } else {
        setError(res.error || "Failed to send WhatsApp broadcast.");
      }
    } catch (err) {
      setError(err.message || "An unexpected error occurred while sending broadcast.");
    } finally {
      setIsSending(false);
    }
  };

  // Live WhatsApp message card preview
  const previewText = `🎉 *HARUVIRU CELEBRATION HOUSE - FESTIVE OFFER!* 🎉

📢 *${campaignTitle || "Campaign Title"}*

${offerMessage || "Your offer details will appear here..."}

${couponCode ? `🎟️ *Special Coupon Code:* ${couponCode}\n\n` : ""}👉 *Book Your Arena Now:* ${callToActionUrl || "https://haruviru.com/branches"}

✨ Celebrate Special Moments in Your Private Paradise! ✨`;

  return (
    <div className="space-y-6">
      {/* Top Header Navigation Tabs */}
      <div className="flex flex-wrap items-center justify-between gap-4 bg-white dark:bg-gray-900 p-2.5 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setActiveTab("inbox")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "inbox"
                ? "bg-emerald-600 text-white shadow-md shadow-emerald-600/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-base">💬</span>
            <span>Live WhatsApp Inbox</span>
            {conversations.length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-white/20 text-[10px]">
                {conversations.length}
              </span>
            )}
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("broadcast")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "broadcast"
                ? "bg-purple-600 text-white shadow-md shadow-purple-600/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-base">🚀</span>
            <span>Broadcast Campaign</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("templates")}
            className={`flex items-center gap-2 px-5 py-3 rounded-2xl text-xs font-bold transition-all ${
              activeTab === "templates"
                ? "bg-rose-600 text-white shadow-md shadow-rose-600/30"
                : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
          >
            <span className="text-base">🪔</span>
            <span>Festival Templates ({templates.length})</span>
          </button>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-[11px] font-bold text-emerald-700 dark:text-emerald-300">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
          <span>Meta Cloud API Webhook: Active</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: LIVE WHATSAPP INBOX & TWO-WAY MESSENGER */}
      {/* ========================================================================= */}
      {activeTab === "inbox" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-white dark:bg-gray-900 rounded-3xl border border-gray-200 dark:border-gray-800 shadow-xl overflow-hidden min-h-[680px]">
          {/* Left Column: Customer Conversations List (5 cols) */}
          <div className="lg:col-span-4 border-r border-gray-100 dark:border-gray-800 flex flex-col h-full bg-gray-50/50 dark:bg-gray-950/50">
            <div className="p-4 border-b border-gray-100 dark:border-gray-800 space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-black text-gray-900 dark:text-white uppercase tracking-wider">
                  Customer Chats
                </h3>
                <button
                  type="button"
                  onClick={() => setSimulateModalOpen(true)}
                  className="px-2.5 py-1 rounded-xl bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-[10px] font-bold hover:bg-purple-200 transition-colors"
                >
                  ⚡ Simulate Reply
                </button>
              </div>

              <input
                type="text"
                placeholder="Search phone or customer name..."
                value={inboxSearch}
                onChange={(e) => setInboxSearch(e.target.value)}
                className="w-full px-3.5 py-2 rounded-xl bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            {/* Customer Contact Cards */}
            <div className="flex-1 overflow-y-auto divide-y divide-gray-100 dark:divide-gray-800 max-h-[560px]">
              {initialCustomers
                .filter((c) => {
                  if (!inboxSearch) return true;
                  const q = inboxSearch.toLowerCase();
                  return (
                    c.name.toLowerCase().includes(q) ||
                    c.phone.includes(q) ||
                    c.branchName.toLowerCase().includes(q)
                  );
                })
                .map((c, idx) => {
                  const isSelected = selectedCustomer?.cleanPhone === c.cleanPhone;
                  const conv = conversations.find(
                    (item) => item.phone.slice(-10) === c.cleanPhone.slice(-10)
                  );

                  return (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedCustomer(c)}
                      className={`w-full text-left p-4 transition-all flex items-start justify-between gap-3 ${
                        isSelected
                          ? "bg-emerald-50 dark:bg-emerald-950/40 border-l-4 border-emerald-600"
                          : "hover:bg-gray-100/70 dark:hover:bg-gray-800/60"
                      }`}
                    >
                      <div className="flex items-start gap-3 min-w-0">
                        <div className="w-10 h-10 rounded-full bg-linear-to-tr from-emerald-500 to-teal-600 text-white font-bold text-sm flex items-center justify-center shrink-0 shadow-xs">
                          {c.name.charAt(0).toUpperCase()}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between">
                            <h4 className="text-xs font-bold text-gray-900 dark:text-white truncate">
                              {c.name}
                            </h4>
                          </div>
                          <p className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold truncate">
                            +{c.cleanPhone}
                          </p>
                          <p className="text-[11px] text-gray-500 dark:text-gray-400 truncate mt-0.5">
                            {conv?.lastMessage || `Branch: ${c.branchName}`}
                          </p>
                        </div>
                      </div>

                      {conv?.lastTimestamp && (
                        <span className="text-[9px] text-gray-400 shrink-0" suppressHydrationWarning>
                          {formatTimeString(conv.lastTimestamp)}
                        </span>
                      )}
                    </button>
                  );
                })}
            </div>
          </div>

          {/* Right Column: Full Interactive WhatsApp Messenger Window (8 cols) */}
          <div className="lg:col-span-8 flex flex-col h-full bg-[#efeae2] dark:bg-[#0b141a]">
            {selectedCustomer ? (
              <>
                {/* Chat Top Bar */}
                <div className="p-4 bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-emerald-600 text-white font-bold text-sm flex items-center justify-center">
                      {selectedCustomer.name.charAt(0)}
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                        {selectedCustomer.name}
                      </h3>
                      <p className="text-[11px] text-emerald-600 font-mono font-semibold">
                        +{selectedCustomer.cleanPhone} • {selectedCustomer.branchName}
                      </p>
                    </div>
                  </div>

                  <a
                    href={`https://wa.me/${selectedCustomer.cleanPhone}`}
                    target="_blank"
                    rel="noreferrer"
                    className="px-3 py-1.5 rounded-xl bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-bold hover:bg-emerald-600 hover:text-white transition-all flex items-center gap-1.5"
                  >
                    <span>💬 Open WA Web ↗</span>
                  </a>
                </div>

                {/* Messages Container */}
                <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4 max-h-[480px]">
                  {messages.length === 0 ? (
                    <div className="p-6 text-center text-xs text-gray-500 bg-white/80 dark:bg-gray-900/80 rounded-2xl border border-gray-200 dark:border-gray-800 max-w-md mx-auto my-8">
                      💬 No previous messages recorded for <strong>+{selectedCustomer.cleanPhone}</strong>.
                      Type a message below to start chatting directly via Meta WhatsApp API or launch WhatsApp Web!
                    </div>
                  ) : (
                    messages.map((m) => {
                      const isAdmin = m.sender === "ADMIN";
                      return (
                        <div
                          key={m.id}
                          className={`flex flex-col ${isAdmin ? "items-end" : "items-start"}`}
                        >
                          <div
                            className={`max-w-[80%] rounded-2xl p-3.5 text-xs shadow-xs relative ${
                              isAdmin
                                ? "bg-[#d9fdd3] dark:bg-[#005c4b] text-gray-900 dark:text-white rounded-tr-none"
                                : "bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-tl-none border border-gray-200 dark:border-gray-700"
                            }`}
                          >
                            <span className="text-[10px] font-bold block mb-1 opacity-70">
                              {m.senderName || (isAdmin ? "Admin" : selectedCustomer.name)}
                            </span>
                            <div className="whitespace-pre-wrap leading-relaxed">
                              {m.message}
                            </div>
                            <div className="mt-1 flex items-center justify-end gap-1.5 text-[9px] opacity-60">
                              <span suppressHydrationWarning>
                                {formatTimeString(m.timestamp)}
                              </span>
                              {isAdmin && <span>✓✓</span>}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                  <div ref={chatBottomRef} />
                </div>

                {/* Direct Reply Bar */}
                <form
                  onSubmit={handleSendAdminReply}
                  className="p-3 sm:p-4 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 flex items-center gap-3"
                >
                  <input
                    type="text"
                    required
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    placeholder={`Reply to ${selectedCustomer.name} on WhatsApp...`}
                    className="flex-1 px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white focus:ring-2 focus:ring-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={isReplying}
                    className="px-6 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-emerald-600/30 transition-all disabled:opacity-50 flex items-center gap-2"
                  >
                    {isReplying ? (
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <>
                        <span>Send</span>
                        <span>➔</span>
                      </>
                    )}
                  </button>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-8 text-center text-gray-400">
                Select a customer contact from the left list to view WhatsApp conversation.
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: BROADCAST CAMPAIGN & AUDIENCE COMPOSER */}
      {/* ========================================================================= */}
      {activeTab === "broadcast" && (
        <div className="space-y-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Campaign Form (Left 7 cols) */}
            <div className="lg:col-span-7 bg-white dark:bg-gray-900 rounded-3xl p-6 sm:p-8 border border-gray-200 dark:border-gray-800 shadow-xs space-y-6">
              <div className="border-b border-gray-100 dark:border-gray-800 pb-4">
                <h2 className="text-xl font-black text-gray-900 dark:text-white">
                  Compose WhatsApp Broadcast
                </h2>
                <p className="text-xs text-gray-500">
                  Send festival offers and announcement campaigns to all or filtered customers.
                </p>
              </div>

              <form onSubmit={handleBroadcast} className="space-y-5">
                {/* Target Audience Branch */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-2">
                    Target Branch Audience
                  </label>
                  <select
                    value={selectedBranch}
                    onChange={(e) => setSelectedBranch(e.target.value)}
                    disabled={useManualPhones}
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  >
                    <option value="all">🌐 All Franchise Customers ({initialCustomers.length} contacts)</option>
                    {initialBranches.map((b) => (
                      <option key={b.id} value={b.id}>
                        🏢 {b.name} ({b.city})
                      </option>
                    ))}
                  </select>
                </div>

                {/* Campaign Title */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Campaign Title / Festival Header
                  </label>
                  <input
                    type="text"
                    required
                    value={campaignTitle}
                    onChange={(e) => setCampaignTitle(e.target.value)}
                    placeholder="e.g. 🪔 Happy Diwali Special Offer!"
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                  />
                </div>

                {/* Offer Message */}
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                    Offer Description & Greetings
                  </label>
                  <textarea
                    rows={4}
                    required
                    value={offerMessage}
                    onChange={(e) => setOfferMessage(e.target.value)}
                    placeholder="Enter festive offer details..."
                    className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500 leading-relaxed"
                  />
                </div>

                {/* Coupon Code & CTA URL */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Coupon Code (Optional)
                    </label>
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="e.g. FESTIVE20"
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm font-mono font-bold text-purple-600 dark:text-purple-400 focus:ring-2 focus:ring-purple-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1.5">
                      Booking CTA Link
                    </label>
                    <input
                      type="url"
                      value={callToActionUrl}
                      onChange={(e) => setCallToActionUrl(e.target.value)}
                      placeholder="https://haruviru.com/branches"
                      className="w-full px-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs font-semibold text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500"
                    />
                  </div>
                </div>

                {error && (
                  <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
                    ⚠️ {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isSending}
                  className="w-full py-4 rounded-2xl bg-linear-to-r from-purple-600 via-rose-600 to-pink-600 text-white font-black text-sm uppercase tracking-wider shadow-lg shadow-purple-500/25 hover:opacity-95 active:scale-[0.99] transition-all disabled:opacity-50 flex items-center justify-center gap-3"
                >
                  {isSending ? (
                    <>
                      <span className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Broadcasting Campaign...</span>
                    </>
                  ) : (
                    <>
                      <span>🚀 Launch Broadcast Campaign</span>
                      <span className="bg-white/20 px-2.5 py-0.5 rounded-full text-xs">
                        Target: {filteredAudience.length} Customers
                      </span>
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Live WhatsApp Card Preview (Right 5 cols) */}
            <div className="lg:col-span-5 space-y-6">
              <div className="bg-emerald-900/90 dark:bg-emerald-950 p-6 rounded-3xl border border-emerald-700/50 shadow-xl text-white relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-emerald-700/60 pb-3 mb-4">
                  <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full bg-emerald-400 animate-pulse" />
                    <span className="text-xs font-bold tracking-wider uppercase text-emerald-200">
                      WhatsApp Message Preview
                    </span>
                  </div>
                  <span className="text-[10px] bg-emerald-800 px-2 py-0.5 rounded-full text-emerald-300">
                    Meta Cloud API
                  </span>
                </div>

                <div className="bg-[#0b141a] p-4 rounded-2xl text-emerald-50 text-xs font-sans whitespace-pre-wrap leading-relaxed shadow-inner border border-emerald-900/80 max-h-[420px] overflow-y-auto">
                  {previewText}
                </div>
              </div>
            </div>
          </div>

          {/* Broadcast Results Summary */}
          {broadcastResult && (
            <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-emerald-200 dark:border-emerald-800 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-black text-emerald-700 dark:text-emerald-400 flex items-center gap-2">
                  <span>✅</span> Broadcast Delivery Summary
                </h3>
                <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold">
                  Total Targeted: {broadcastResult.totalTargeted}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200">
                  <span className="text-2xl font-black text-emerald-600 block">
                    {broadcastResult.successCount}
                  </span>
                  <span className="text-xs font-bold text-gray-600">Delivered via API</span>
                </div>

                <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
                  <span className="text-2xl font-black text-amber-600 block">
                    {broadcastResult.failCount}
                  </span>
                  <span className="text-xs font-bold text-gray-600">Fallback WA Links</span>
                </div>

                <div className="p-4 rounded-2xl bg-purple-50 border border-purple-200 col-span-2 sm:col-span-1">
                  <span className="text-2xl font-black text-purple-600 block">
                    {Math.round(
                      (broadcastResult.successCount / (broadcastResult.totalTargeted || 1)) * 100
                    )}
                    %
                  </span>
                  <span className="text-xs font-bold text-gray-600">API Delivery Rate</span>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 3: CUSTOM FESTIVAL TEMPLATES MANAGER */}
      {/* ========================================================================= */}
      {activeTab === "templates" && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-gray-900 p-6 rounded-3xl border border-gray-200 dark:border-gray-800">
            <div>
              <h2 className="text-xl font-black text-gray-900 dark:text-white">
                Festival & Offer Templates Directory
              </h2>
              <p className="text-xs text-gray-500">
                Create and store reusable festival offer templates for Diwali, Holi, New Year, Birthdays, & custom offers.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setShowTplForm(!showTplForm)}
              className="px-5 py-3 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs uppercase tracking-wider shadow-md shadow-rose-600/30 transition-all flex items-center gap-2"
            >
              <span>{showTplForm ? "✕ Close Form" : "➕ Create New Festival Template"}</span>
            </button>
          </div>

          {/* Create New Template Form Modal/Accordion */}
          {showTplForm && (
            <form
              onSubmit={handleSaveTemplate}
              className="bg-white dark:bg-gray-900 p-6 sm:p-8 rounded-3xl border border-rose-200 dark:border-rose-800 shadow-lg space-y-4"
            >
              <h3 className="text-sm font-bold text-rose-600 uppercase tracking-wider">
                Create New Custom Festival Template
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Template Title
                  </label>
                  <input
                    type="text"
                    required
                    value={newTplTitle}
                    onChange={(e) => setNewTplTitle(e.target.value)}
                    placeholder="e.g. 🏮 Independence Day Special Discount"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Category
                  </label>
                  <select
                    value={newTplCategory}
                    onChange={(e) => setNewTplCategory(e.target.value)}
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                  >
                    <option value="FESTIVAL">🪔 Festival Wishes & Offer</option>
                    <option value="OFFER">🎟️ Promotional Discount</option>
                    <option value="GREETING">✨ Greetings & Wishes</option>
                    <option value="CUSTOM">⚙️ Custom Campaign</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                  Message Body Text
                </label>
                <textarea
                  rows={3}
                  required
                  value={newTplMessage}
                  onChange={(e) => setNewTplMessage(e.target.value)}
                  placeholder="Enter template message text..."
                  className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Coupon Code (Optional)
                  </label>
                  <input
                    type="text"
                    value={newTplCoupon}
                    onChange={(e) => setNewTplCoupon(e.target.value)}
                    placeholder="e.g. FREEDOM15"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs font-mono font-bold text-purple-600"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-gray-700 dark:text-gray-300 uppercase tracking-wider mb-1">
                    Call To Action Link
                  </label>
                  <input
                    type="url"
                    value={newTplCtaUrl}
                    onChange={(e) => setNewTplCtaUrl(e.target.value)}
                    placeholder="https://haruviru.com/branches"
                    className="w-full px-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 text-xs text-gray-900 dark:text-white"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isSavingTpl}
                className="px-6 py-3 rounded-2xl bg-rose-600 text-white font-bold text-xs uppercase tracking-wider hover:bg-rose-700 transition-all disabled:opacity-50"
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
                className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs flex flex-col justify-between space-y-4 hover:border-rose-300 dark:hover:border-rose-800 transition-all"
              >
                <div>
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider">
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

                  <p className="text-xs text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800/60 p-3 rounded-2xl border border-gray-100 dark:border-gray-700/60">
                    {tpl.message}
                  </p>

                  {tpl.couponCode && (
                    <div className="mt-3 inline-block px-3 py-1 rounded-xl bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-300 text-xs font-mono font-bold border border-purple-200">
                      🎟️ Coupon: {tpl.couponCode}
                    </div>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => loadTemplateToBroadcast(tpl)}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs uppercase tracking-wider shadow-xs transition-all flex items-center justify-center gap-2"
                >
                  <span>🚀 Broadcast This Template</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Simulation Modal for Testing Customer incoming reply */}
      {simulateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <form
            onSubmit={handleSimulateReply}
            className="bg-white dark:bg-gray-900 p-6 rounded-3xl max-w-md w-full space-y-4 border border-gray-200 dark:border-gray-800 shadow-2xl"
          >
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-800 pb-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                Simulate Customer WhatsApp Reply
              </h3>
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Target Customer
              </label>
              <div className="text-xs font-bold text-gray-900 dark:text-white">
                {selectedCustomer?.name} (+{selectedCustomer?.cleanPhone})
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                Customer Message
              </label>
              <textarea
                rows={3}
                required
                value={simCustomerText}
                onChange={(e) => setSimCustomerText(e.target.value)}
                placeholder="Type simulated customer reply..."
                className="w-full px-3.5 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-xs text-gray-900 dark:text-white"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setSimulateModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-xs font-bold text-gray-700 dark:text-gray-300"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-purple-600 text-white text-xs font-bold"
              >
                Receive Simulated Reply
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
