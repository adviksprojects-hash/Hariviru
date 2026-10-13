"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import { getRecentCustomerWhatsAppNotifications } from "@/lib/actions";

// Web Audio API synthesizer for the classic notification chime
function playNotificationChime() {
  try {
    const AudioContext = window.AudioContext || window.webkitAudioContext;
    if (!AudioContext) return;
    const ctx = new AudioContext();
    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    
    // Note 1 (E5 - 659.25 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.2, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.18);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.18);

    // Note 2 (A5 - 880.00 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.0, now + 0.1);
    gain2.gain.setValueAtTime(0.25, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.4);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.4);
  } catch (err) {
    console.warn("Could not play notification sound:", err);
  }
}

export default function WhatsAppRealtimeNotifier() {
  const [toasts, setToasts] = useState([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const seenMsgIdsRef = useRef(new Set());
  const initialLoadTimeRef = useRef(Date.now());
  const pollingIntervalRef = useRef(null);

  // Request browser notification permissions if desired
  useEffect(() => {
    if (typeof window !== "undefined" && "Notification" in window) {
      if (Notification.permission === "default") {
        Notification.requestPermission().catch(() => {});
      }
    }
  }, []);

  const addNotificationToast = useCallback((msg) => {
    const toastId = msg.id || `${msg.phone}-${Date.now()}`;
    const newToast = {
      id: toastId,
      customerName: msg.customerName || `Customer (${msg.phone})`,
      phone: msg.phone,
      message: msg.message,
      createdAt: msg.createdAt,
    };

    setToasts((prev) => [newToast, ...prev.slice(0, 4)]);

    // Play chime
    if (soundEnabled) {
      playNotificationChime();
    }

    // Native browser push notification if permitted and document is hidden
    if (
      typeof window !== "undefined" &&
      "Notification" in window &&
      Notification.permission === "granted" &&
      document.visibilityState !== "visible"
    ) {
      try {
        new Notification(`💬 New WhatsApp Message: ${msg.customerName || msg.phone}`, {
          body: msg.message || "Sent you a message",
          icon: "/favicon.ico",
        });
      } catch (err) {
        console.warn("Browser notification error:", err);
      }
    }

    // Auto dismiss after 12 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== toastId));
    }, 12000);
  }, [soundEnabled]);

  const pollMessages = useCallback(async () => {
    try {
      // Look for messages from 1 minute before page load on initial, or past timestamp
      const sinceTime = new Date(initialLoadTimeRef.current - 60 * 1000).toISOString();
      const res = await getRecentCustomerWhatsAppNotifications(sinceTime);
      
      if (res?.success && Array.isArray(res.messages) && res.messages.length > 0) {
        res.messages.forEach((msg) => {
          if (!seenMsgIdsRef.current.has(msg.id)) {
            seenMsgIdsRef.current.add(msg.id);
            // Only alert for messages received after the component mounted
            const msgTime = new Date(msg.createdAt).getTime();
            if (msgTime >= initialLoadTimeRef.current - 5000) {
              addNotificationToast(msg);
            }
          }
        });
      }
    } catch (err) {
      console.warn("WhatsApp realtime poll error:", err);
    }
  }, [addNotificationToast]);

  useEffect(() => {
    // Initial fetch to mark existing messages as seen
    pollMessages();

    // Poll every 7 seconds
    pollingIntervalRef.current = setInterval(pollMessages, 7000);

    return () => {
      if (pollingIntervalRef.current) {
        clearInterval(pollingIntervalRef.current);
      }
    };
  }, [pollMessages]);

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto bg-white dark:bg-gray-900 border-2 border-emerald-500 rounded-2xl shadow-2xl p-4 animate-in slide-in-from-top-4 duration-300 transition-all flex flex-col gap-2"
        >
          {/* Header */}
          <div className="flex items-center justify-between gap-2 border-b border-gray-100 dark:border-gray-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="flex h-3 w-3 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
              </span>
              <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 uppercase tracking-wider flex items-center gap-1">
                💬 New WhatsApp Message
              </span>
            </div>
            <button
              type="button"
              onClick={() => removeToast(toast.id)}
              className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 text-xs font-bold p-1 rounded-md"
            >
              ✕
            </button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between text-xs font-bold text-gray-900 dark:text-white">
              <span>{toast.customerName}</span>
              <span className="text-[11px] font-mono text-gray-400">
                {toast.phone}
              </span>
            </div>
            <p className="text-xs text-gray-600 dark:text-gray-300 line-clamp-2 bg-gray-50 dark:bg-gray-800/80 p-2 rounded-xl font-medium border border-gray-100 dark:border-gray-700">
              "{toast.message}"
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-between gap-2 pt-1">
            <span className="text-[10px] text-gray-400">
              Just now
            </span>
            <div className="flex items-center gap-2">
              <a
                href={`https://wa.me/${toast.phone.replace(/\D/g, "")}`}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => removeToast(toast.id)}
                className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs inline-flex items-center gap-1"
              >
                <span>Reply on WhatsApp ↗</span>
              </a>
              <Link
                href="/admin/whatsapp-marketing"
                onClick={() => removeToast(toast.id)}
                className="px-2.5 py-1.5 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-200 text-xs font-bold transition-all"
              >
                Open Inbox
              </Link>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
