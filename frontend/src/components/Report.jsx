import React, { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Droplets,
  IndianRupee,
  Users,
  FileText
} from "lucide-react";

const getISTMonthString = () => {
  const date = new Date();
  const istString = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
};

const KPICard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
}) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.3, delay }}
    className="bg-white rounded-2xl border border-[#E8E0D0] shadow-sm p-3.5 flex items-center gap-3"
  >
    <div
      className="w-9 h-9 rounded-[11px] flex items-center justify-center shrink-0"
      style={{ background: `${accent}15`, border: `1px solid ${accent}25` }}
    >
      <Icon size={15} color={accent} />
    </div>
    <div className="flex-1 min-w-0">
      <div className="font-mono font-black text-lg leading-none text-[#0D1B2A] truncate">
        {value}
      </div>
      <div className="text-[10px] text-[#8A9BB0] font-medium mt-0.5">
        {label}
      </div>
      {sub && (
        <div className="text-[10px] font-bold mt-0.5" style={{ color: accent }}>
          {sub}
        </div>
      )}
    </div>
  </motion.div>
);

const Report = ({ clients, entries }) => {
  const [selectedMonth, setSelectedMonth] = useState(getISTMonthString());

  const monthlyEntries = useMemo(() => {
    return entries.filter(e => e.date && e.date.startsWith(selectedMonth));
  }, [entries, selectedMonth]);

  const totalVolume = monthlyEntries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const totalRevenue = monthlyEntries.reduce((s, e) => s + (e.amount || 0), 0);

  const clientSummary = useMemo(() => {
    const summary = {};
    monthlyEntries.forEach(e => {
      const clientId = e.clientId || e.farmerId;
      if (!summary[clientId]) {
        summary[clientId] = {
          clientId,
          ltrs: 0,
          amount: 0,
          entriesCount: 0
        };
      }
      summary[clientId].ltrs += (e.ltrs || 0);
      summary[clientId].amount += (e.amount || 0);
      summary[clientId].entriesCount += 1;
    });

    return Object.values(summary).sort((a, b) => b.ltrs - a.ltrs).map(item => {
      const client = clients.find(c => (c.id || c._id) === item.clientId);
      return {
        ...item,
        name: client?.name || "Unknown",
        serialId: client?.serialId || "—"
      };
    });
  }, [monthlyEntries, clients]);

  const uniqueClientsCount = clientSummary.length;

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* Month Selector */}
      <div className="flex items-center gap-3 mb-2 shrink-0">
        <label className="text-[12px] font-black uppercase tracking-[0.12em] text-[#8A9BB0] flex items-center gap-2">
          <Calendar size={14} /> Select Month:
        </label>
        <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-1.5 border border-[#E8E0D0] bg-[#FAFAF5] focus-within:border-[#C8891C] transition-all">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="border-none outline-none bg-transparent font-mono text-[12px] font-bold text-[#0D1B2A] cursor-pointer"
          />
        </div>
      </div>

      {/* KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 shrink-0">
        <KPICard
          icon={Droplets}
          label="Monthly Milk"
          value={`${totalVolume.toFixed(1)} L`}
          sub="Total volume this month"
          accent="#166B4D"
          delay={0}
        />
        <KPICard
          icon={IndianRupee}
          label="Monthly Revenue"
          value={`₹${totalRevenue.toFixed(0)}`}
          sub="Total amount this month"
          accent="#C8891C"
          delay={0.05}
        />
        <KPICard
          icon={Users}
          label="Active Clients"
          value={uniqueClientsCount}
          sub="Clients delivered this month"
          accent="#4A5B70"
          delay={0.1}
        />
      </div>

      {/* Client-wise Summary Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="bg-white rounded-3xl border border-[#E8E0D0] shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#F5F0E8] bg-[#F7F4EF] shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#0D1B2A]">
            <FileText size={14} color="#E3A32E" />
          </div>
          <div>
            <div
              className="font-black text-sm text-[#0D1B2A]"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Client-Wise Summary
            </div>
            <div className="text-[10px] text-[#8A9BB0]">Aggregated totals for {selectedMonth}</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead className="sticky top-0 z-10 bg-[#FAFAF5]">
              <tr className="border-b border-[#E8E0D0]">
                {["Client", "Entries", "Total Litres", "Total Amount"].map((h) => (
                  <th
                    key={h}
                    className="px-4 py-2.5 text-[9px] font-black text-[#8A9BB0] uppercase tracking-widest text-left"
                  >
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {clientSummary.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-14 text-[12px] font-medium text-[#8A9BB0]"
                  >
                    No entries recorded for {selectedMonth}.
                  </td>
                </tr>
              ) : (
                clientSummary.map((item, index) => (
                  <tr key={item.clientId || index} className="hover:bg-[#FDFBF8] border-b border-[#F5F0E8] transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white font-black text-xs shrink-0 uppercase"
                          style={{
                            background: "linear-gradient(135deg, #0D1B2A, #2D4A6A)",
                          }}
                        >
                          {item.name?.[0] || "?"}
                        </div>
                        <div>
                          <div className="text-[11px] font-bold text-[#0D1B2A]">
                            {item.name}
                          </div>
                          <div className="text-[9px] font-black text-[#8A9BB0] uppercase tracking-wide">
                            {item.serialId}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-bold text-[#4A5B70]">
                        {item.entriesCount}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-mono font-bold text-[#166B4D]">
                        {item.ltrs.toFixed(1)}L
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="text-[11px] font-mono font-bold text-[#0D1B2A]">
                        ₹{item.amount.toFixed(0)}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Report;
