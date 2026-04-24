import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  FileSpreadsheet,
  FileText,
  TrendingUp,
  X,
  Maximize2,
  Droplets,
  IndianRupee,
  CheckCircle2,
  Clock,
} from "lucide-react";

const StatementOverview = ({ selectedClient, entries }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const clientEntries = entries.filter(
    (e) => (e.clientId || e.farmerId) === selectedClient?.id,
  );
  const lifetimeVolume = clientEntries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const lifetimeAmount = clientEntries.reduce((s, e) => s + (e.amount || 0), 0);

  const filteredEntries = clientEntries
    .filter((e) => (!from || e.date >= from) && (!to || e.date <= to))
    .sort((a, b) => b.date.localeCompare(a.date));

  const downloadCSV = () => {
    const rows = ["Date,Shift,Liters,Fat%,SNF%,Rate,Amount"];
    filteredEntries.forEach((r) =>
      rows.push(
        `${r.date},${r.shift},${r.ltrs},${r.fat},${r.snf},${r.rate},${r.amount}`,
      ),
    );
    const link = document.createElement("a");
    link.href =
      "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    link.download = `Statement_${selectedClient.name}_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const downloadPDF = async () => {
    try {
      const jsPDF = (await import("jspdf")).default;
      const autoTable = (await import("jspdf-autotable")).default;
      const doc = new jsPDF();
      doc.setFillColor(13, 27, 42);
      doc.rect(0, 0, 210, 16, "F");
      doc.setFont("courier", "bold");
      doc.setFontSize(13);
      doc.setTextColor(227, 163, 46);
      doc.text("TEJAS DAIRY — Account Statement", 105, 10, { align: "center" });
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(9);
      doc.setFont("courier", "bold");
      doc.text(`Client: ${selectedClient.name}`, 14, 24);
      doc.text(`ID: ${selectedClient.serialId}`, 14, 30);
      if (from || to)
        doc.text(`Period: ${from || "All"} → ${to || "Present"}`, 14, 36);
      autoTable(doc, {
        startY: from || to ? 40 : 36,
        head: [
          ["Date", "Shift", "Ltrs", "Fat%", "SNF%", "Rate", "Amount"],
        ],
        body: filteredEntries.map((e) => [
          e.date,
          e.shift,
          e.ltrs.toFixed(1),
          e.fat.toFixed(1),
          e.snf.toFixed(1),
          `₹${e.rate}`,
          `₹${e.amount.toFixed(2)}`,
        ]),
        theme: "striped",
        headStyles: {
          fillColor: [13, 27, 42],
          textColor: [227, 163, 46],
          fontStyle: "bold",
        },
        styles: { font: "courier", fontSize: 7.5, halign: "center" },
      });
      const fy = doc.lastAutoTable.finalY + 6;
      doc.setFillColor(13, 27, 42);
      doc.rect(14, fy, 180, 14, "F");
      doc.setTextColor(227, 163, 46);
      doc.setFont("courier", "bold");
      doc.setFontSize(9);
      doc.text(
        `Total: ${filteredEntries.reduce((s, e) => s + e.ltrs, 0).toFixed(1)} L  |  ₹${filteredEntries.reduce((s, e) => s + e.amount, 0).toFixed(2)}`,
        105,
        fy + 9,
        { align: "center" },
      );
      doc.save(`Statement_${selectedClient.name}.pdf`);
    } catch (e) {
      console.error("PDF error:", e);
    }
  };

  return (
    <>
      {/* Compact Widget */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        whileHover={{ scale: 1.01, y: -1 }}
        whileTap={{ scale: 0.99 }}
        className="relative rounded-[20px] overflow-hidden cursor-pointer h-full flex flex-col justify-between p-4"
        style={{
          background:
            "linear-gradient(135deg, #0D1B2A 0%, #1B3350 60%, #0A2018 100%)",
          border: "1px solid rgba(255,255,255,0.07)",
          boxShadow: "0 8px 28px rgba(9,22,41,0.25)",
        }}
      >
        <div
          className="absolute top-0 left-0 right-0 h-[2px]"
          style={{
            background: "linear-gradient(90deg, #C8891C, #E3A32E, transparent)",
          }}
        />
        <div className="absolute bottom-[-20px] right-[-15px] opacity-[0.05] pointer-events-none">
          <TrendingUp size={100} color="#fff" />
        </div>

        <div className="flex justify-between items-start relative z-10">
          <div>
            <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.14em] text-white/40 mb-1">
              <TrendingUp size={10} /> Lifetime Summary
            </div>
            <div
              className="text-sm font-black text-white leading-tight"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              {selectedClient.name}
            </div>
            <div className="text-[9px] text-white/35 font-mono mt-0.5">
              {selectedClient.serialId}
            </div>
          </div>
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center"
            style={{
              background: "rgba(255,255,255,0.09)",
              border: "1px solid rgba(255,255,255,0.1)",
            }}
          >
            <Maximize2 size={13} color="rgba(250,250,245,0.55)" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 relative z-10 mt-3">
          {[
            {
              icon: Droplets,
              color: "#7EC4A7",
              label: "Total Milk",
              value: `${lifetimeVolume.toFixed(1)} L`,
            },
            {
              icon: IndianRupee,
              color: "#E3A32E",
              label: "Revenue",
              value: `₹${(lifetimeAmount / 1000).toFixed(1)}k`,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-[11px] px-3 py-2.5"
              style={{
                background: "rgba(0,0,0,0.22)",
                border: "1px solid rgba(255,255,255,0.06)",
              }}
            >
              <div className="flex items-center gap-1.5 mb-1">
                <item.icon size={10} color={item.color} />
                <span className="text-[9px] font-black uppercase tracking-[0.1em] text-white/35">
                  {item.label}
                </span>
              </div>
              <div className="font-mono font-black text-base leading-none text-white">
                {item.value}
              </div>
            </div>
          ))}
        </div>

      </motion.div>

      {/* Full Ledger Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4"
            style={{
              background: "rgba(9,22,41,0.6)",
              backdropFilter: "blur(6px)",
            }}
            onClick={(e) => e.target === e.currentTarget && setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.93, y: 40 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.93, y: 40 }}
              transition={{ type: "spring", stiffness: 340, damping: 30 }}
              className="bg-white w-full sm:max-w-4xl flex flex-col border border-[#E8E0D0] shadow-[0_32px_80px_rgba(9,22,41,0.35)]"
              style={{
                borderRadius: "24px 24px 0 0",
                height: "90vh",
                ...(window.innerWidth >= 640
                  ? { borderRadius: "24px", height: "88vh" }
                  : {}),
              }}
            >
              {/* Header */}
              <div className="flex flex-wrap items-center justify-between gap-3 px-4 sm:px-5 py-3 sm:py-4 border-b border-[#F5F0E8] bg-[#F7F4EF] shrink-0 rounded-t-[24px]">
                <div>
                  <div
                    className="font-black text-lg sm:text-xl text-[#0D1B2A]"
                    style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                  >
                    Account Ledger
                  </div>
                  <div className="text-[11px] text-[#8A9BB0] mt-0.5">
                    {selectedClient.name} · All-time
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <div className="flex items-center bg-white border border-[#E8E0D0] rounded-[11px] px-2 sm:px-3 py-1.5 gap-1 sm:gap-2">
                    <input
                      type="date"
                      value={from}
                      onChange={(e) => setFrom(e.target.value)}
                      className="text-[11px] font-semibold font-mono border-none outline-none text-[#0D1B2A] bg-transparent w-28 sm:w-auto"
                    />
                    <span className="text-[9px] font-black text-[#C8B99A] uppercase tracking-wide">
                      to
                    </span>
                    <input
                      type="date"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      className="text-[11px] font-semibold font-mono border-none outline-none text-[#0D1B2A] bg-transparent w-28 sm:w-auto"
                    />
                  </div>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={downloadCSV}
                    disabled={filteredEntries.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] border border-[#B5DDCA] bg-[#F0F7F3] text-[#166B4D] text-[10px] font-black cursor-pointer hover:bg-[#D4EDE5] transition-colors disabled:opacity-40"
                  >
                    <FileSpreadsheet size={12} /> CSV
                  </motion.button>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    onClick={downloadPDF}
                    disabled={filteredEntries.length === 0}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-[9px] border-none bg-[#0D1B2A] text-white text-[10px] font-black cursor-pointer hover:bg-[#1B3350] transition-colors disabled:opacity-40"
                  >
                    <FileText size={12} /> PDF
                  </motion.button>
                  <button
                    onClick={() => setIsOpen(false)}
                    className="w-9 h-9 rounded-[9px] border border-[#E8E0D0] bg-white cursor-pointer flex items-center justify-center hover:bg-[#F5F0E8] transition-colors"
                  >
                    <X size={14} color="#8A9BB0" />
                  </button>
                </div>
              </div>

              {/* Summary Strip */}
              <div className="grid grid-cols-2 divide-x divide-[#F5F0E8] shrink-0 border-b border-[#F5F0E8]">
                {[
                  {
                    label: "Total Volume",
                    value: `${lifetimeVolume.toFixed(1)} L`,
                    color: "#166B4D",
                    icon: Droplets,
                  },
                  {
                    label: "Total Revenue",
                    value: `₹${lifetimeAmount.toFixed(0)}`,
                    color: "#C8891C",
                    icon: IndianRupee,
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="bg-white px-3 sm:px-4 py-2.5 sm:py-3 flex items-center gap-2"
                  >
                    <stat.icon size={13} color={stat.color} />
                    <div>
                      <div className="text-[9px] font-black uppercase tracking-[0.1em] text-[#8A9BB0] mb-0.5">
                        {stat.label}
                      </div>
                      <div
                        className="font-mono font-black text-xs sm:text-sm leading-none"
                        style={{ color: stat.color }}
                      >
                        {stat.value}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Table */}
              <div className="flex-1 overflow-y-auto">
                <table className="w-full border-collapse">
                  <thead className="sticky top-0 bg-[#F7F4EF] z-10">
                    <tr>
                      {[
                        "Date",
                        "Shift",
                        "Volume",
                        "Fat%",
                        "SNF%",
                        "Rate",
                        "Amount",
                      ].map((h) => (
                        <th
                          key={h}
                          className="px-3 sm:px-4 py-2.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#8A9BB0] text-left border-b border-[#E8E0D0]"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filteredEntries.length === 0 ? (
                      <tr>
                        <td
                          colSpan={7}
                          className="text-center py-16 text-[13px] text-[#8A9BB0] font-medium"
                        >
                          No records found.
                        </td>
                      </tr>
                    ) : (
                      filteredEntries.map((e) => (
                        <tr
                          key={e.id}
                          className="hover:bg-[#FDFBF8] border-b border-[#F5F0E8] transition-colors"
                        >
                          <td className="px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] font-semibold text-[#4A5B70]">
                            {e.date}
                          </td>
                          <td className="px-3 sm:px-4 py-2">
                            <span
                              className="font-black text-[12px]"
                              style={{
                                color: e.shift === "AM" ? "#A86D15" : "#2D4A6A",
                              }}
                            >
                              {e.shift}
                            </span>
                          </td>
                          <td className="px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] text-[#4A5B70]">
                            {e.ltrs.toFixed(1)}L
                          </td>
                          <td className="px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] text-[#4A5B70]">
                            {e.fat.toFixed(1)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] text-[#4A5B70]">
                            {e.snf.toFixed(1)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 font-mono text-[11px] sm:text-[12px] text-[#4A5B70]">
                            ₹{e.rate.toFixed(1)}
                          </td>
                          <td className="px-3 sm:px-4 py-2 font-mono font-black text-[12px] sm:text-[13px] text-[#0D1B2A]">
                            ₹{e.amount.toFixed(0)}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Footer */}
              {filteredEntries.length > 0 && (
                <div className="flex items-center justify-between px-4 sm:px-5 py-3 border-t border-[#E8E0D0] bg-[#F7F4EF] shrink-0 rounded-b-[24px]">
                  <span className="text-[10px] font-bold text-[#8A9BB0]">
                    {filteredEntries.length} entries
                  </span>
                  <div className="flex items-center gap-4">
                    <span className="text-[11px] font-bold text-[#4A5B70]">
                      {filteredEntries
                        .reduce((s, e) => s + e.ltrs, 0)
                        .toFixed(1)}{" "}
                      L
                    </span>
                    <span className="text-[13px] font-black text-[#0D1B2A] font-mono">
                      ₹
                      {filteredEntries
                        .reduce((s, e) => s + e.amount, 0)
                        .toFixed(0)}
                    </span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default StatementOverview;
