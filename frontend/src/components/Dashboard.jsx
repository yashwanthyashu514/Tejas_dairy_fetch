import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  Droplets,
  IndianRupee,
  Users,
  Clock,
  ListPlus
} from "lucide-react";

// Helper: Get Current Date in Indian Standard Time (IST) in YYYY-MM-DD format
const getISTDateString = () => {
  const date = new Date();
  const istString = date.toLocaleString("en-US", { timeZone: "Asia/Kolkata" });
  const istDate = new Date(istString);
  const year = istDate.getFullYear();
  const month = String(istDate.getMonth() + 1).padStart(2, "0");
  const day = String(istDate.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
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

const Dashboard = ({ clients, entries }) => {
  const todayStr = getISTDateString();

  const todayEntries = useMemo(() => {
    return entries.filter(e => e.date === todayStr);
  }, [entries, todayStr]);

  const todayCount = todayEntries.length;
  const todayVolume = todayEntries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const todayRevenue = todayEntries.reduce((s, e) => s + (e.amount || 0), 0);

  const todayClientsSet = new Set();
  todayEntries.forEach(e => {
    todayClientsSet.add(e.clientId || e.farmerId);
  });
  const todayClientsCount = todayClientsSet.size;

  const recentEntries = useMemo(() => {
    // Assuming the entries are appended, reverse gives the latest first
    return [...todayEntries].reverse().slice(0, 10);
  }, [todayEntries]);

  return (
    <div className="flex flex-col gap-3 h-full">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5 shrink-0">
        <KPICard
          icon={ListPlus}
          label="Today's Entries"
          value={todayCount}
          sub={`${todayCount} entries today`}
          accent="#0D1B2A"
          delay={0}
        />
        <KPICard
          icon={Droplets}
          label="Today's Milk"
          value={`${todayVolume.toFixed(1)} L`}
          sub="Total volume today"
          accent="#166B4D"
          delay={0.05}
        />
        <KPICard
          icon={IndianRupee}
          label="Today's Revenue"
          value={`₹${todayRevenue.toFixed(0)}`}
          sub="Total amount today"
          accent="#C8891C"
          delay={0.1}
        />
        <KPICard
          icon={Users}
          label="Today's Clients"
          value={todayClientsCount}
          sub="Unique clients today"
          accent="#4A5B70"
          delay={0.15}
        />
      </div>

      {/* Recent Entries Table */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-white rounded-3xl border border-[#E8E0D0] shadow-sm flex flex-col min-h-0 flex-1 overflow-hidden"
      >
        <div className="flex items-center gap-2.5 px-4 py-3.5 border-b border-[#F5F0E8] bg-[#F7F4EF] shrink-0">
          <div className="w-8 h-8 rounded-[8px] flex items-center justify-center bg-[#0D1B2A]">
            <Clock size={14} color="#E3A32E" />
          </div>
          <div>
            <div
              className="font-black text-sm text-[#0D1B2A]"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Recent Entries Today
            </div>
            <div className="text-[10px] text-[#8A9BB0]">Latest milk collections for today</div>
          </div>
        </div>
        
        <div className="flex-1 overflow-auto">
          <table className="w-full border-collapse min-w-[500px]">
            <thead className="sticky top-0 z-10 bg-[#FAFAF5]">
              <tr className="border-b border-[#E8E0D0]">
                {["Client", "Shift", "Litres", "Fat %", "Amount"].map((h) => (
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
              {recentEntries.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="text-center py-14 text-[12px] font-medium text-[#8A9BB0]"
                  >
                    No entries recorded today.
                  </td>
                </tr>
              ) : (
                recentEntries.map((e, index) => {
                  const client = clients.find(c => (c.id || c._id) === (e.clientId || e.farmerId));
                  return (
                    <tr key={e._id || index} className="hover:bg-[#FDFBF8] border-b border-[#F5F0E8] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-7 h-7 rounded-[7px] flex items-center justify-center text-white font-black text-xs shrink-0 uppercase"
                            style={{
                              background: "linear-gradient(135deg, #0D1B2A, #2D4A6A)",
                            }}
                          >
                            {client?.name?.[0] || "?"}
                          </div>
                          <div>
                            <div className="text-[11px] font-bold text-[#0D1B2A]">
                              {client?.name || "Unknown"}
                            </div>
                            <div className="text-[9px] font-black text-[#8A9BB0] uppercase tracking-wide">
                              {client?.serialId || "—"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[10px] font-bold text-[#4A5B70] uppercase">
                          {e.shift === "AM" ? "Morning ☀️" : e.shift === "PM" ? "Evening 🌙" : e.shift || "—"}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] font-mono font-bold text-[#166B4D]">
                          {(e.ltrs || 0).toFixed(1)}L
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] font-mono font-bold text-[#C8891C]">
                          {(e.fat || 0).toFixed(1)}%
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-[11px] font-mono font-bold text-[#0D1B2A]">
                          ₹{(e.amount || 0).toFixed(0)}
                        </div>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </motion.div>
    </div>
  );
};

export default Dashboard;
