"use client";

import { useState, useMemo } from "react";

export default function AdminRevenueCharts({ rawBookings = [] }) {
  // Convert dates to Date objects
  const bookings = useMemo(() => {
    return rawBookings.map((b) => ({
      ...b,
      dateObj: new Date(b.bookingDate),
    }));
  }, [rawBookings]);

  // Extract available years from bookings (or default to current year)
  const currentYearNum = new Date().getFullYear();
  const availableYears = useMemo(() => {
    const set = new Set();
    bookings.forEach((b) => set.add(b.dateObj.getFullYear()));
    if (set.size === 0) set.add(currentYearNum);
    return Array.from(set).sort((a, b) => b - a);
  }, [bookings, currentYearNum]);

  const [selectedYear, setSelectedYear] = useState(availableYears[0] || currentYearNum);

  // Extract available months for the selected year
  const availableMonthsInYear = useMemo(() => {
    const list = [];
    for (let m = 0; m < 12; m++) {
      const d = new Date(selectedYear, m, 1);
      const label = d.toLocaleString("en-US", { month: "short", year: "numeric" });
      const monthKey = `${selectedYear}-${String(m + 1).padStart(2, "0")}`;
      list.push({ monthIndex: m, monthKey, label });
    }
    return list;
  }, [selectedYear]);

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => new Date().getMonth());
  const [activeDayPoint, setActiveDayPoint] = useState(null);

  // --------------------------------------------------------------------------
  // 1. DAY-WISE REVENUE DATA FOR SELECTED MONTH (BLUE LINING GRAPH)
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

  // SVG Line Chart coordinates for Admin Blue Lining Graph
  const svgWidth = 800;
  const svgHeight = 220;
  const paddingX = 30;
  const paddingY = 30;

  const dayPoints = useMemo(() => {
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
    if (dayPoints.length === 0) return "";
    return dayPoints.reduce((acc, pt, i) => `${acc} ${i === 0 ? "M" : "L"} ${pt.x},${pt.y}`, "");
  }, [dayPoints]);

  const areaPath = useMemo(() => {
    if (dayPoints.length === 0) return "";
    const firstX = dayPoints[0].x;
    const lastX = dayPoints[dayPoints.length - 1].x;
    const bottomY = svgHeight - paddingY;
    return `${linePath} L ${lastX},${bottomY} L ${firstX},${bottomY} Z`;
  }, [linePath, dayPoints, svgHeight, paddingY]);

  // --------------------------------------------------------------------------
  // 2. MONTH-WISE REVENUE DATA FOR SELECTED YEAR (YEARLY GRAPH)
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

  return (
    <div className="space-y-10 mb-10">
      
      {/* ---------------------------------------------------------------------- */}
      {/* SECTION 1: MONTHLY BLUE LINING GRAPH                                   */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300 text-xs font-bold uppercase tracking-wider">
              System Blue Lining Graph
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              📈 Daily Revenue Trend ({selectedMonthLabel})
            </h2>
            <p className="text-xs text-gray-500">
              Blue lining graph tracking daily earnings performance across all franchise locations.
            </p>
          </div>

          {/* Month & Year Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMonthIndex}
              onChange={(e) => {
                setSelectedMonthIndex(Number(e.target.value));
                setActiveDayPoint(null);
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
                setActiveDayPoint(null);
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

        {/* Side-by-Side Layout: Summary Card (Left) & Blue Lining Chart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* Left Column: Month Breakdown Cards */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-blue-100">
                {selectedMonthLabel} Total Revenue
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{selectedMonthSummary.total.toLocaleString()}
              </div>
              <div className="text-xs text-blue-100 mt-2 font-medium">
                {selectedMonthSummary.count} Total Confirmed System Bookings
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Online Booking</div>
                <div className="text-lg font-black text-blue-600 mt-0.5">
                  ₹{selectedMonthSummary.online.toLocaleString()}
                </div>
              </div>

              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Offline Walk-ins</div>
                <div className="text-lg font-black text-amber-600 mt-0.5">
                  ₹{selectedMonthSummary.offline.toLocaleString()}
                </div>
              </div>
            </div>

            {activeDayPoint && (
              <div className="p-4 rounded-2xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs text-blue-900 dark:text-blue-200">
                <span className="font-bold">📍 Day {activeDayPoint.dayNum} Details:</span>
                <div className="text-base font-black text-blue-600 mt-0.5">₹{activeDayPoint.total.toLocaleString()}</div>
                <div className="text-[11px] text-blue-700 dark:text-blue-300 mt-1">
                  Online: ₹{activeDayPoint.online.toLocaleString()} | Offline: ₹{activeDayPoint.offline.toLocaleString()}
                </div>
              </div>
            )}
          </div>

          {/* Right Column: Blue Lining Chart */}
          <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-4">
              <span>Daily Revenue Blue Lining Path (Days 1 to {dayWiseData.days.length})</span>
              <span className="text-blue-600 font-black">Month Total: ₹{selectedMonthSummary.total.toLocaleString()}</span>
            </div>

            {/* Blue Lining Chart Box */}
            <div className="relative w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700 overflow-hidden">
              <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-auto overflow-visible">
                <defs>
                  <linearGradient id="adminBlueGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2563eb" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
                  </linearGradient>
                </defs>

                {/* Area Fill */}
                {areaPath && <path d={areaPath} fill="url(#adminBlueGrad)" />}

                {/* Blue Line */}
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

                {/* Interactive Points */}
                {dayPoints.map((pt) => {
                  const isActive = activeDayPoint?.dayNum === pt.dayNum;
                  return (
                    <g
                      key={pt.dayNum}
                      className="cursor-pointer group"
                      onMouseEnter={() => setActiveDayPoint(pt)}
                      onClick={() => setActiveDayPoint(pt)}
                    >
                      <circle cx={pt.x} cy={pt.y} r="14" fill="transparent" />
                      {(isActive || pt.total > 0) && (
                        <circle
                          cx={pt.x}
                          cy={pt.y}
                          r={isActive ? "6" : "3.5"}
                          className={`transition-all duration-200 ${
                            isActive
                              ? "fill-blue-600 stroke-white stroke-2 ring-4 ring-blue-400/50"
                              : "fill-blue-500 opacity-80"
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
              <span className="text-blue-600 font-bold">🟦 Blue Angled Trend Line (Hover or click points to view earnings)</span>
            </div>
          </div>

        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SECTION 2: YEARLY REVENUE COMPARISON BAR GRAPH                          */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
              Yearly Height-Comparison Graph
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              📊 Year {selectedYear} Monthly Revenue Comparison Chart
            </h2>
            <p className="text-xs text-gray-500">
              Proportional height comparison across all 12 months with value badges and gridlines.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <div className="text-right">
              <span className="text-xs text-gray-400 block">Total Annual Revenue</span>
              <span className="text-2xl font-black text-emerald-600">
                ₹{yearlyMonthData.yearlyTotalRevenue.toLocaleString()}
              </span>
            </div>

            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
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

        {/* 12 Month Bar Graph Box */}
        <div className="bg-gray-50 dark:bg-gray-800/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          <div className="relative h-64 w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            <div className="relative z-10 h-full pl-6 flex items-end justify-between gap-3 sm:gap-5">
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
                    {/* Value Badge on Top */}
                    {m.total > 0 && (
                      <span className="text-[10px] sm:text-xs font-black text-emerald-600 dark:text-emerald-400 mb-2 font-mono bg-emerald-50 dark:bg-emerald-950/60 px-1.5 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800 shadow-2xs">
                        ₹{m.total >= 1000 ? `${(m.total / 1000).toFixed(1)}k` : m.total}
                      </span>
                    )}

                    <div className="w-full h-full flex items-end justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-t-xl hover:bg-rose-50/40 transition-colors p-1">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-300 ${
                          isSelectedMonth
                            ? "bg-gradient-to-t from-purple-600 via-rose-500 to-amber-500 shadow-md ring-2 ring-purple-500"
                            : m.total > 0
                            ? "bg-gradient-to-t from-emerald-600 to-teal-400 hover:from-purple-500 hover:to-rose-500 shadow-xs"
                            : "bg-gray-200 dark:bg-gray-700/60"
                        }`}
                      />
                    </div>

                    <span
                      className={`text-xs font-bold mt-2 ${
                        isSelectedMonth
                          ? "text-purple-600 dark:text-purple-400 font-black underline"
                          : "text-gray-700 dark:text-gray-300"
                      }`}
                    >
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
