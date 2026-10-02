"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function ManagerSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);

  const navItems = [
    {
      name: "Dashboard",
      href: "/manager",
      icon: "📊",
      exact: true,
    },
    {
      name: "Manage Bookings",
      href: "/manager/bookings",
      icon: "📋",
      exact: true,
    },
    {
      name: "Walk-in Booking",
      href: "/manager/bookings?openModal=true",
      icon: "🚶",
    },
    {
      name: "Availability Calendar",
      href: "/manager/calendar",
      icon: "📅",
    },
    {
      name: "Manage Slots",
      href: "/manager/slots",
      icon: "⏰",
    },
    {
      name: "Settings",
      subtitle: "Halls & Packages",
      href: "/manager/settings",
      icon: "⚙️",
    },
  ];

  const isLinkActive = (item) => {
    if (item.exact) {
      return pathname === item.href;
    }
    return pathname.startsWith(item.href.split("?")[0]);
  };

  return (
    <>
      {/* Mobile Top Navigation Bar */}
      <div className="lg:hidden bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3 flex items-center justify-between sticky top-0 z-40 shadow-xs">
        <div className="flex items-center gap-3">
          <div className="h-9 w-auto rounded-xl bg-white p-0.5 shadow-xs border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
            <img
              src="/logo.jpg"
              alt="HaruViru Logo"
              className="h-8 w-auto object-contain"
            />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900 dark:text-white leading-none">
              Haru<span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 to-amber-600">Viru</span>
            </h2>
            <span className="text-[10px] text-rose-600 dark:text-rose-400 font-bold uppercase tracking-wider">Manager Portal</span>
          </div>
        </div>

        <button
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
          aria-label="Toggle Navigation Menu"
        >
          {isOpen ? "✕" : "☰"}
        </button>
      </div>

      {/* Mobile Drawer Overlay */}
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-xs z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Sidebar Container (Fixed desktop / Slide-out mobile) */}
      <aside
        className={`fixed lg:sticky top-0 left-0 z-50 lg:z-30 h-screen w-72 bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 flex flex-col justify-between transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className="p-6">
          {/* Header Branding with Official Logo */}
          <div className="flex items-center justify-between mb-8 pb-6 border-b border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-3">
              <div className="h-11 w-auto rounded-xl bg-white p-1 shadow-xs border border-gray-200 dark:border-gray-700 flex items-center justify-center shrink-0">
                <img
                  src="/logo.jpg"
                  alt="HaruViru Logo"
                  className="h-9 w-auto object-contain"
                />
              </div>
              <div>
                <h2 className="text-base font-black text-gray-900 dark:text-white tracking-tight leading-none">
                  Haru<span className="text-transparent bg-clip-text bg-linear-to-r from-rose-600 to-amber-600">Viru</span>
                </h2>
                <span className="inline-block px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-950 text-rose-700 dark:text-rose-300 text-[10px] font-bold uppercase tracking-wider mt-1">
                  Manager Portal
                </span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="lg:hidden text-gray-400 hover:text-gray-600 text-lg"
            >
              ✕
            </button>
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            <div className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-wider px-3 mb-2">
              Main Menu
            </div>
            {navItems.map((item) => {
              const active = isLinkActive(item);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  onClick={() => setIsOpen(false)}
                  className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl font-bold text-sm transition-all ${
                    active
                      ? "bg-linear-to-r from-rose-600 to-amber-600 text-white shadow-md shadow-rose-500/20"
                      : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/60"
                  }`}
                >
                  <span className="text-lg">{item.icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="truncate">{item.name}</div>
                    {item.subtitle && (
                      <div
                        className={`text-[10px] font-medium truncate ${
                          active ? "text-rose-100" : "text-gray-400 dark:text-gray-500"
                        }`}
                      >
                        {item.subtitle}
                      </div>
                    )}
                  </div>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer / Quick Links */}
        <div className="p-6 border-t border-gray-100 dark:border-gray-800 bg-gray-50/50 dark:bg-gray-900/50">
          <div className="mb-4 p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/80 dark:border-amber-800/40 flex items-center gap-3">
            <span className="text-xl">💡</span>
            <div className="text-xs">
              <span className="font-bold text-amber-900 dark:text-amber-300 block">Manager Active</span>
              <span className="text-amber-700 dark:text-amber-400 text-[11px]">Branch Operations</span>
            </div>
          </div>

          <Link
            href="/"
            className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-xs font-bold text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <span>🌐 View Customer Website</span>
          </Link>
        </div>
      </aside>
    </>
  );
}
