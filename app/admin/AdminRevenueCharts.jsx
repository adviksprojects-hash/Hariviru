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

  const [selectedMonthIndex, setSelectedMonthIndex] = useState(() => {
    const currentM = new Date().getMonth();
    return currentM;
  });

  // --------------------------------------------------------------------------
  // 1. DAY-WISE REVENUE DATA FOR SELECTED MONTH
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
    const yearlyTotalCount = months.reduce((sum, m) => sum + m.count, 0);

    return { months, maxMonthRevenue, yearlyTotalRevenue, yearlyTotalCount };
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
      {/* SECTION 1: MONTHLY REVENUE ANALYSIS & DAY-WISE BAR GRAPH (SIDE BY SIDE) */}
      {/* ---------------------------------------------------------------------- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 border border-gray-200 dark:border-gray-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-4 border-b border-gray-100 dark:border-gray-800">
          <div>
            <span className="px-3 py-1 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300 text-xs font-bold uppercase tracking-wider">
              Day-Wise Breakup Graph (1 to 30)
            </span>
            <h2 className="text-xl font-black text-gray-900 dark:text-white mt-1">
              🗓️ Daily Revenue Breakdown ({selectedMonthLabel})
            </h2>
            <p className="text-xs text-gray-500">
              Clear day-by-day earnings graph with gridlines and tooltips across all 30 days.
            </p>
          </div>

          {/* Month & Year Filters */}
          <div className="flex items-center gap-2 flex-wrap">
            <select
              value={selectedMonthIndex}
              onChange={(e) => setSelectedMonthIndex(Number(e.target.value))}
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

        {/* Side-by-Side Layout: Summary Card (Left) & Day-Wise Bar Chart (Right) */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Left Column: Month Breakdown Cards */}
          <div className="lg:col-span-4 space-y-4 flex flex-col justify-between">
            <div className="p-5 rounded-2xl bg-gradient-to-br from-rose-600 to-amber-600 text-white shadow-md">
              <div className="text-xs font-bold uppercase tracking-wider text-rose-100">
                {selectedMonthLabel} Total Revenue
              </div>
              <div className="text-3xl font-black mt-1">
                ₹{selectedMonthSummary.total.toLocaleString()}
              </div>
              <div className="text-xs text-rose-100 mt-2 font-medium">
                {selectedMonthSummary.count} Total Confirmed Bookings
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
                <div className="text-[11px] font-bold text-gray-400 uppercase">Online Booking</div>
                <div className="text-lg font-black text-rose-600 mt-0.5">
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

            <div className="p-3.5 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-900 dark:text-rose-200 font-medium">
              📊 <span className="font-bold">Gridlines:</span> View daily revenue columns scaled from ₹0 to ₹{dayWiseData.maxDayRevenue.toLocaleString()}.
            </div>
          </div>

          {/* Right Column: Day-Wise Vertical Bar Chart with Gridlines ("Lining") */}
          <div className="lg:col-span-8 bg-gray-50 dark:bg-gray-800/80 p-5 rounded-2xl border border-gray-200 dark:border-gray-700 relative">
            <div className="flex items-center justify-between text-xs font-bold text-gray-600 dark:text-gray-300 mb-4">
              <span>Daily Revenue Columns (Day 1 to Day {dayWiseData.days.length})</span>
              <span className="text-rose-600 font-extrabold">Max Day Peak: ₹{dayWiseData.maxDayRevenue.toLocaleString()}</span>
            </div>

            {/* Grid Chart Box */}
            <div className="relative h-64 w-full bg-white dark:bg-gray-900 rounded-xl p-3 border border-gray-200 dark:border-gray-700">
              
              {/* Horizontal Background Grid Lines ("Lining") */}
              <div className="absolute inset-x-3 inset-y-3 flex flex-col justify-between pointer-events-none z-0">
                {[100, 75, 50, 25, 0].map((pct) => (
                  <div key={pct} className="w-full flex items-center gap-2">
                    <span className="text-[9px] font-mono text-gray-400 w-10 text-right shrink-0">
                      ₹{Math.round((dayWiseData.maxDayRevenue * pct) / 100).toLocaleString()}
                    </span>
                    <div className="w-full border-b border-gray-100 dark:border-gray-800/80 border-dashed"></div>
                  </div>
                ))}
              </div>

              {/* Bars Container */}
              <div className="relative z-10 h-full pl-12 flex items-end justify-between gap-1 overflow-x-auto scrollbar-none">
                {dayWiseData.days.map((d) => {
                  const heightPct = Math.max(
                    (d.total / dayWiseData.maxDayRevenue) * 100,
                    d.total > 0 ? 8 : 2
                  );

                  return (
                    <div
                      key={d.dayNum}
                      className="flex-1 min-w-[12px] h-full flex flex-col justify-end items-center group relative cursor-pointer"
                    >
                      {/* Hover Tooltip */}
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                        <div className="bg-gray-900 text-white text-[10px] font-mono py-1.5 px-2.5 rounded-lg shadow-2xl whitespace-nowrap text-center border border-gray-700">
                          <div className="font-bold text-rose-400">Day {d.dayNum} ({selectedMonthLabel.slice(0, 3)})</div>
                          <div className="text-xs font-black text-emerald-400">Total: ₹{d.total.toLocaleString()}</div>
                          <div className="text-[9px] text-gray-300 mt-0.5">
                            Online: ₹{d.online.toLocaleString()} | Off: ₹{d.offline.toLocaleString()}
                          </div>
                        </div>
                        <div className="w-2 h-2 bg-gray-900 rotate-45 -mt-1"></div>
                      </div>

                      {/* Bar Column Guide Line */}
                      <div className="w-full h-full flex items-end justify-center bg-gray-50/50 dark:bg-gray-800/30 rounded-t-xs hover:bg-rose-50/40 transition-colors">
                        <div
                          style={{ height: `${heightPct}%` }}
                          className={`w-full max-w-[16px] rounded-t-xs transition-all duration-300 ${
                            d.total > 0
                              ? "bg-gradient-to-t from-rose-600 via-amber-500 to-amber-400 group-hover:brightness-110 shadow-xs"
                              : "bg-gray-200 dark:bg-gray-700/60"
                          }`}
                        ></div>
                      </div>

                      {/* Day Number Label below bar */}
                      <span className="text-[8px] sm:text-[9px] font-mono font-bold text-gray-500 dark:text-gray-400 mt-1">
                        {d.dayNum}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="flex items-center justify-between text-[11px] text-gray-500 mt-3 px-1">
              <span>📍 Days 1 to {dayWiseData.days.length}</span>
              <span>💡 Hover over any day column to view exact daily earnings</span>
            </div>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------------- */}
      {/* SECTION 2: YEARLY REVENUE COMPARISON (TALL MONTH-WISE BAR GRAPH)       */}
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

        {/* Tall 12 Month Bar Graph Box with Y-Axis Gridlines */}
        <div className="bg-gray-50 dark:bg-gray-800/80 p-6 rounded-2xl border border-gray-200 dark:border-gray-700">
          
          <div className="relative h-80 w-full bg-white dark:bg-gray-900 rounded-2xl p-4 border border-gray-200 dark:border-gray-700">
            
            {/* Horizontal Gridlines for Height Comparison */}
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

            {/* 12 Month Bars Container */}
            <div className="relative z-10 h-full pl-14 flex items-end justify-between gap-3 sm:gap-5">
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

                    {/* Hover Tooltip */}
                    <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-30 pointer-events-none">
                      <div className="bg-gray-900 text-white text-xs font-mono py-2.5 px-3.5 rounded-xl shadow-2xl whitespace-nowrap text-center border border-gray-700">
                        <div className="font-black text-amber-400">{m.name} {selectedYear}</div>
                        <div className="text-base font-black text-emerald-400 mt-0.5">
                          Total: ₹{m.total.toLocaleString()}
                        </div>
                        <div className="text-[11px] text-gray-300 mt-1 border-t border-gray-800 pt-1">
                          Online: ₹{m.online.toLocaleString()}
                          <br />
                          Offline: ₹{m.offline.toLocaleString()}
                          <br />
                          Bookings Count: {m.count}
                        </div>
                      </div>
                      <div className="w-2.5 h-2.5 bg-gray-900 rotate-45 -mt-1"></div>
                    </div>

                    {/* Bar Column Guide & Height Scaled Bar */}
                    <div className="w-full h-full flex items-end justify-center bg-gray-50/50 dark:bg-gray-800/20 rounded-t-xl hover:bg-rose-50/40 transition-colors p-1">
                      <div
                        style={{ height: `${heightPct}%` }}
                        className={`w-full max-w-[48px] rounded-t-xl transition-all duration-500 ${
                          isSelectedMonth
                            ? "bg-gradient-to-t from-rose-600 via-amber-500 to-amber-400 ring-2 ring-rose-500 shadow-lg scale-105"
                            : m.total > 0
                            ? "bg-gradient-to-t from-emerald-600 via-emerald-500 to-teal-400 hover:from-rose-500 hover:to-amber-500 shadow-sm"
                            : "bg-gray-200 dark:bg-gray-700/60"
                        }`}
                      ></div>
                    </div>

                    {/* Month Label */}
                    <span
                      className={`text-xs font-bold mt-2 transition-colors ${
                        isSelectedMonth
                          ? "text-rose-600 dark:text-rose-400 font-black underline"
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

          <div className="mt-4 flex flex-wrap items-center justify-between text-xs text-gray-500 px-1">
            <span>💡 Click on any month bar above to immediately inspect its daily breakdown in the graph above!</span>
            <div className="flex items-center gap-4 font-semibold">
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-emerald-500 inline-block shadow-xs"></span> Month Earnings
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-3 h-3 rounded-full bg-rose-500 inline-block shadow-xs"></span> Selected Month
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
