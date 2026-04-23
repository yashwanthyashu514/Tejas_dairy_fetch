import React, { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Users, IndianRupee, MapPin, Hash, Phone } from "lucide-react";

const ClientRevenueDashboard = ({ farmers, entries }) => {
  const [activeTab, setActiveTab] = useState("CLIENTS"); // 'CLIENTS' or 'REVENUE'

  // Calculate Revenue
  const { currentMonthRev, currentYearRev, allTimeRev } = useMemo(() => {
    const now = new Date();
    const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const currentYear = `${now.getFullYear()}`;

    let mRev = 0;
    let yRev = 0;
    let totalRev = 0;

    entries.forEach((e) => {
      totalRev += e.amount;
      if (e.date.startsWith(currentMonth)) mRev += e.amount;
      if (e.date.startsWith(currentYear)) yRev += e.amount;
    });

    return {
      currentMonthRev: mRev,
      currentYearRev: yRev,
      allTimeRev: totalRev,
    };
  }, [entries]);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col h-full overflow-hidden relative">
      {/* Tab Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-100 bg-slate-50 flex-shrink-0">
        <div className="flex bg-slate-200/50 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("CLIENTS")}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "CLIENTS"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Directory
          </button>
          <button
            onClick={() => setActiveTab("REVENUE")}
            className={`px-4 py-1.5 rounded-md text-[10px] font-black uppercase tracking-widest transition-all ${
              activeTab === "REVENUE"
                ? "bg-white text-emerald-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            Revenue
          </button>
        </div>

        {/* Count Badge */}
        {activeTab === "CLIENTS" && (
          <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mr-2">
            {farmers.length} Total
          </span>
        )}
      </div>

      {/* Content Area */}
      <div className="flex-1 overflow-hidden relative">
        <AnimatePresence mode="wait">
          {activeTab === "CLIENTS" ? (
            <motion.div
              key="clients"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 flex flex-col"
            >
              <div className="overflow-auto flex-1">
                <table className="w-full text-left whitespace-nowrap">
                  <thead className="bg-white sticky top-0 z-10 shadow-sm">
                    <tr>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Client
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Contact
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Location
                      </th>
                      <th className="px-4 py-3 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-100">
                        Bank Info
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {farmers.length === 0 ? (
                      <tr>
                        <td
                          colSpan="4"
                          className="p-8 text-center text-xs font-bold text-slate-400"
                        >
                          No clients registered yet.
                        </td>
                      </tr>
                    ) : (
                      farmers.map((f) => (
                        <tr
                          key={f.id}
                          className="border-b border-slate-50 hover:bg-blue-50/30 transition-colors group"
                        >
                          <td className="px-4 py-3">
                            <div className="font-bold text-xs text-slate-800 group-hover:text-primary transition-colors">
                              {f.name}
                            </div>
                            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                              {f.serialId}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                              <Phone className="w-3 h-3 text-slate-400" />{" "}
                              {f.phone}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-[10px] font-bold text-slate-600">
                            <div className="flex items-center gap-1.5">
                              <MapPin className="w-3 h-3 text-slate-400" />
                              <span className="truncate max-w-[120px]">
                                {f.address || "N/A"}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-600">
                              <Hash className="w-3 h-3 text-slate-400" />
                              {f.bankAccount
                                ? `A/C ending ${f.bankAccount.slice(-4)}`
                                : "N/A"}
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="revenue"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              transition={{ duration: 0.2 }}
              className="absolute inset-0 p-5 flex flex-col justify-center"
            >
              <div className="grid grid-cols-3 gap-4 h-full">
                {/* This Month */}
                <div className="bg-gradient-to-br from-blue-50 to-white border border-blue-100 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
                  <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 text-blue-500/5 rotate-12" />
                  <p className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-2 relative z-10">
                    This Month
                  </p>
                  <p className="text-2xl lg:text-3xl font-black text-blue-900 tracking-tight relative z-10">
                    ₹{(currentMonthRev / 1000).toFixed(1)}k
                  </p>
                </div>

                {/* This Year */}
                <div className="bg-gradient-to-br from-emerald-50 to-white border border-emerald-100 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden">
                  <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 text-emerald-500/5 rotate-12" />
                  <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest mb-2 relative z-10">
                    This Year
                  </p>
                  <p className="text-2xl lg:text-3xl font-black text-emerald-900 tracking-tight relative z-10">
                    ₹{(currentYearRev / 1000).toFixed(1)}k
                  </p>
                </div>

                {/* All Time */}
                <div className="bg-gradient-to-br from-slate-900 to-slate-800 rounded-2xl p-5 flex flex-col justify-center relative overflow-hidden shadow-lg shadow-slate-900/20">
                  <IndianRupee className="absolute -right-4 -bottom-4 w-24 h-24 text-white/5 rotate-12" />
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 relative z-10">
                    All Time Volume
                  </p>
                  <p className="text-2xl lg:text-3xl font-black text-white tracking-tight relative z-10">
                    ₹{(allTimeRev / 1000).toFixed(1)}k
                  </p>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default ClientRevenueDashboard;
