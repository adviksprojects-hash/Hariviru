"use client";

import { useState, useMemo } from "react";

export default function ManagerRevenueCharts({ rawBookings = [] }) {
  // Convert dates to Date objects
  const bookings = useMemo(() => {
    return rawBookings.map((b) => ({
      ...b,
      dateObj: new Date(b.bookingDate),
    }));
  }, [rawBookings]);

  // Extract available years
  const currentYearNum = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => set.add(b.dateObj.getFullYear()));
    if (set.size === 0) set.add(currentYearNum);
    return Array.from(set).sort((a, b) => b - a);
  }, [bookings, currentYearNum]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYearNum);

  // Available months for selected year
  const availableMonthsInYear = useMemo(() => {
    const list = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(selectedYear, m, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
      list.push({ monthIndex: m, monthKey: `${selectedYear}-${String(m + 1).padStart(2, "0")}`, label });
    }
    return list;
  }, [selectedYear]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [activePoint, setActivePoint] = useState(null);

  // --------------------------------------------------------------------------
  // 1. DAY-WISE REVENUE DATA FOR SELECTED MONTH (BLUE LINING GRAPH - HOVER/CLICK EFFECT)
  // --------------------------------------------------------------------------
  const dayWiseData = useMemo(() => {
    const daysCount = new Date(selectedYear, selectedMonthIndex + 1, 0).getDate();
    const days = [];

    for (let d = 1; d <= daysCount; d++) {
      days.push({
        dayNum: d,
        total: 0,
        online: 0,
        offline: 0,
        count: 0,
      });
    }

    bookings.forEach((b) => {
      if (
        b.dateObj.getFullYear() === Number(selectedYear) &&
        b.dateObj.getMonth() === Number(selectedMonthIndex)
      ) {
        const dayIdx = b.dateObj.getDate() - 1;
        if (days[dayIdx]) {
          days[dayIdx].total += b.totalAmount;
          days[dayIdx].count += 1;
          if (b.bookingType === "ONLINE") days[dayIdx].online += b.totalAmount;
          else days[dayIdx].offline += b.totalAmount;
        }
      }
    });

    const maxDayRevenue = Math.max(...days.map((d) => d.total), 5000);

    return { days, maxDayRevenue };
  }, [bookings, selectedYear, selectedMonthIndex]);

  // Selected Month Summary stats
  const selectedMonthSummary = useMemo(() => {
    const total = dayWiseData.days.reduce((s, d) => s + d.total, 0);
    const online = dayWiseData.days.reduce((s, d) => s + d.online, 0);
    const offline = dayWiseData.days.reduce((s, d) => s + d.offline, 0);
    const count = dayWiseData.days.reduce((s, d) => s + d.count, 0);
    return { total, online, offline, count };
  }, [dayWiseData]);

  const selectedMonthLabel = new Date(selectedYear, selectedMonthIndex, 1).toLocaleString(
    "en-US",
    { month: "long", year: "numeric" }
  );

  // --------------------------------------------------------------------------
  // 2. MONTH-WISE REVENUE DATA FOR SELECTED YEAR (YEARLY BAR GRAPH)
  // --------------------------------------------------------------------------
  const yearlyMonthData = useMemo(() => {
    const months = [
      "Jan", "Feb", "Mar", "Apr", "May", "Jun",
      "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
    ].map((name, idx) => ({
      name,
      monthIndex: idx,
      total: 0,
      online: 0,
      offline: 0,
      count: 0,
    }));

    bookings.forEach((b) => {
      if (b.dateObj.getFullYear() === Number(selectedYear)) {
        const mIdx = b.dateObj.getMonth();
        if (months[mIdx]) {
          months[mIdx].total += b.totalAmount;
          months[mIdx].count += 1;
          if (b.bookingType === "ONLINE") months[mIdx].online += b.totalAmount;
          else months[mIdx].offline += b.totalAmount;
        }
      }
    });

    const maxMonthRevenue = Math.max(...months.map((m) => m.total), 10000);
    const yearlyTotalRevenue = months.reduce((sum, m) => sum + m.total, 0);

    return { months, maxMonthRevenue, yearlyTotalRevenue };
  }, [bookings, selectedYear]);

  // SVG Line Chart coordinates calculation for Blue Lining Graph (Angled points, hover/click active point)
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 30;
  const paddingY = 30;

  const points = useMemo(() => {
    const days = dayWiseData.days;
    if (days.length === 0) return [];
    const stepX = (svgWidth - paddingX * 2) / (days.length - 1);
    const usableH = svgHeight - paddingY * 2;

    return days.map((d, idx) => {
      const x = paddingX + idx * stepX;
      const y = svgHeight - paddingY - (d.total / dayWiseData.maxDayRevenue) * usableH;
      return { x, y, dayNum: d.dayNum, total: d.total, online: d.online, offline: d.offline, count: d.count };
    });
  }, [dayWiseData, svgWidth, svgHeight, paddingX, paddingY]);

  const linePath = useMemo(() => {
    if (points.length === 0) return "";
    return points.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
  }, [points]);

  const areaPath = useMemo(() => {
    if (points.length === 0) return "";
    const firstX = points[0].x;
    const lastX = points[points.length - 1].x;
    const bottomY = svgHeight - paddingY;
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [linePath, points, svgHeight, paddingY]);

  return (
    <div className="space-y-10 my-10">
      
      {/* ---------------------------------------------------------------------- */}
      {/* MONTHLY REVENUE BLUE LINING GRAPH (WITH HOVER/CLICK ANGLE REVENUE TOOLTIP) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              Monthly Blue Lining Graph
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              📈 Daily Revenue Trend ({selectedMonthLabel})
            </h2>
            <p className="text-xs text-gray-500">
              Hover or click any angle along the blue line to inspect that day's revenue breakdown.
            </p>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMonthIndex}
              onChange={(e) => {
                setSelectedMonthIndex(Number(e.target.value));
                setActivePoint(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
            >
              {availableMonthsInYear.map((m) => (
                <option key={m.monthIndex} value={m.monthIndex}>
                  {m.label}
                </option>
              ))}
            </select>

            <select
              value={selectedYear}
              onChange={(e) => {
                setSelectedYear(Number(e.target.value));
                setActivePoint(null);
              }}
              className="px-3.5 py-2 rounded-xl bg-gray-50 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 text-xs font-bold text-gray-900 dark:text-white"
            >
              {availableYears.map((yr) => (
                <option key={yr} value={yr}>
                  Year {yr}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Active Point Floating Inspector Banner */}
        {activePoint && (
          <div className="mb-4 p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-900 dark:text-blue-200 flex flex-wrap items-center justify-between gap-4 animate-fadeIn">
            <div className="flex items-center gap-3">
              <span className="text-2xl">📍</span>
              <div>
                <h3 className="font-extrabold text-sm">
                  Day {activePoint.dayNum} ({selectedMonthLabel}) — Revenue: ₹{activePoint.total.toLocaleString()}
                </h3>
                <p className="text-xs text-blue-700 dark:text-blue-300 mt-0.5">
                  Online: <span className="font-bold">₹{activePoint.online.toLocaleString()}</span> | Offline Walk-in: <span className="font-bold">₹{activePoint.offline.toLocaleString()}</span> ({activePoint.count} booking{activePoint.count !== 1 ? "s" : ""})
                </p>
              </div>
            </div>
            <button
              onClick={() => setActivePoint(null)}
              className="text-xs font-bold px-3 py-1 rounded-lg bg-blue-200 dark:bg-blue-800 hover:bg-blue-300"
            >
              Close ✕
            </button>
          </div>
        )}

        {/* Blue Line Chart Component */}
        <div className="bg-gray-50 dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-4">
            <span>Daily Revenue Blue Lining Path (Days 1 to {dayWiseData.days.length})</span>
            <span className="text-blue-600 font-black">Month Total: ₹{selectedMonthSummary.total.toLocaleString()}</span>
          </div>

          <div className="relative w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 overflow-hidden">
            <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
              <defs>
                <linearGradient id="managerBlueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2563eb" stopOpacity="0.25" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.01" />
                </linearGradient>
              </defs>

              {/* Blue Area Gradient */}
              {areaPath && <path d={areaPath} fill="url(#managerBlueGrad)" />}

              {/* Pure Blue Angled Line */}
              {linePath && (
                <path
                  d={linePath}
                  fill="none"
                  stroke="#2563eb"
                  strokeWidth="3.5"
                  strokeLinecap="square"
                  strokeLinejoin="miter"
                />
              )}

              {/* Angle Hover & Click Target Vertices */}
              {points.map((pt) => {
                const isActive = activePoint?.dayNum === pt.dayNum;
                return (
                  <g
                    key={pt.dayNum}
                    className="cursor-pointer group"
                    onMouseEnter={() => setActivePoint(pt)}
                    onClick={() => setActivePoint(pt)}
                  >
                    {/* Transparent hover hit area */}
                    <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />

                    {/* Active/Hover Angle Glow Dot */}
                    {(isActive || pt.total > 0) && (
                      <circle
                        cx={pt.x}
                        cy={pt.y}
                        r={isActive ? "6" : "3.5"}
                        className={`transition-all duration-200 ${
                          isActive
                            ? "fill-blue-600 stroke-white stroke-2 ring-4 ring-blue-400/50"
                            : "fill-blue-500 hover:fill-rose-500 opacity-80"
                        }`}
                      />
                    )}
                  </g>
                );
              })}
            </svg>
          </div>

          <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3 px-1">
            <span>📍 Days 1 to {dayWiseData.days.length}</span>
            <span className="text-blue-600 font-bold">💡 Hover or click any angle on the blue line to view daily revenue</span>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* YEARLY REVENUE BAR GRAPH                                               */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Yearly Bar Format Graph
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              📊 Year {selectedYear} Monthly Revenue Bar Chart
            </h2>
            <p className="text-xs text-gray-500">
              Month-by-month bar chart comparison across the entire year.
            </p>
          </div>

          <div className="text-right">
            <span className="text-xs text-gray-400 block">Total Annual Revenue</span>
            <span className="text-2xl font-black text-emerald-600">
              ₹{yearlyMonthData.yearlyTotalRevenue.toLocaleString()}
            </span>
          </div>
        </div>

        {/* 12 Month Bar Graph */}
        <div className="bg-gray-50 dark:bg-gray-800/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="relative h-64 w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            
            {/* Gridlines */}
            <div className="absolute inset-x-4 inset-y-4 flex flex-col justify-between pointer-events-none z-0">
              {[100, 75, 50, 25, 0].map((pct) => (
                <div key={pct} className="w-full flex items-center gap-2">
                  <span className="text-[10px] font-mono text-gray-400 w-12 text-right shrink-0 font-bold">
                    ₹{Math.round((yearlyMonthData.maxMonthRevenue * pct) / 100).toLocaleString()}
                  </span>
                  <div className="w-full border-b border-gray-100 dark:border-gray-800 border-dashed"></div>
                </div>
              ))}
            </div>

            {/* Bars */}
            <div className="relative z-10 h-full pl-14 flex items-end justify-between gap-3 sm:gap-4">
              {yearlyMonthData.months.map((m) => {
                const heightPct = Math.max(
                  (m.total / yearlyMonthData.maxMonthRevenue) * 100,
                  m.total > 0 ? 8 : 2
                );
                const isSelectedMonth = m.monthIndex === selectedMonthIndex;

                return (
                  <div
                    key={m.name}
                    onClick={() => setSelectedMonthIndex(m.monthIndex)}
                    className="flex-1 h-full flex flex-col justify-end items-center group relative cursor-pointer"
                  >
                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs font-mono py-2 px-3 rounded-xl shadow-xl whitespace-nowrap text-center border border-gray-700">
                        <div className="font-bold text-amber-400">{m.name} {selectedYear}</div>
                        <div className="text-sm font-black text-emerald-400">₹{m.total.toLocaleString()}</div>
                      </div>
                      <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>

                    <div className="w-full h-full flex items-end justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-t-xl hover:bg-rose-50/40 transition-colors p-1">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[36px] rounded-t-xl transition-all duration-300 ${
                          isSelectedMonth
                            ? "bg-gradient-to-t from-rose-600 via-amber-500 to-amber-400 shadow-md ring-2 ring-rose-500"
                            : m.total > 0
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-rose-500 hover:to-amber-500 shadow-xs"
                            : "bg-gray-200 dark:bg-gray-700/60"
                        }`}
                      />
                    </div>

                    <span className={`text-xs font-bold mt-2 ${isSelectedMonth ? "text-rose-600 dark:text-rose-400 font-black underline" : "text-gray-700 dark:text-gray-300"}`}>
                      {m.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
