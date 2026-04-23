import React, { useMemo } from "react";
import { motion } from "framer-motion";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  TrendingUp,
  Droplets,
  IndianRupee,
  Activity,
  Clock,
  BarChart3,
  Award,
} from "lucide-react";

const FAT_RANGES = [
  { label: "Premium ≥5%", min: 5, max: 99, color: "#0D1B2A" },
  { label: "Good 4.5–5%", min: 4.5, max: 5, color: "#C8891C" },
  { label: "Average 4–4.5%", min: 4, max: 4.5, color: "#166B4D" },
  { label: "Below <4%", min: 0, max: 4, color: "#B0C4D8" },
];

const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#E8E0D0] rounded-xl px-3.5 py-2.5 shadow-[0_4px_20px_rgba(9,22,41,0.12)]">
      <div className="text-[9px] font-black text-[#8A9BB0] uppercase tracking-widest mb-1.5">
        {label}
      </div>
      {payload.map((p, i) => (
        <div
          key={i}
          className="font-mono text-[12px] font-bold"
          style={{ color: p.color }}
        >
          {p.name}: {typeof p.value === "number" ? p.value.toFixed(1) : p.value}
          {p.name === "Litres" ? " L" : p.name === "Amount" ? " ₹" : ""}
        </div>
      ))}
    </div>
  );
};

const KPICard = ({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  delay = 0,
  trend,
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
    {trend !== undefined && trend !== null && (
      <div
        className={`text-[10px] font-black px-1.5 py-0.5 rounded-[5px] ${trend >= 0 ? "text-[#166B4D] bg-[#F0F7F3]" : "text-red-600 bg-red-50"}`}
      >
        {trend >= 0 ? "↑" : "↓"}
        {Math.abs(trend).toFixed(0)}%
      </div>
    )}
  </motion.div>
);

const BusinessAnalytics = ({ clients, entries }) => {
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1);
  const prevMonthStr = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, "0")}`;

  const lineData = useMemo(() => {
    const grouped = {};
    entries.forEach((e) => {
      if (!grouped[e.date])
        grouped[e.date] = { date: e.date, Litres: 0, Amount: 0 };
      grouped[e.date].Litres += e.ltrs || 0;
      grouped[e.date].Amount += e.amount || 0;
    });
    return Object.values(grouped)
      .sort((a, b) => a.date.localeCompare(b.date))
      .slice(-14)
      .map((d) => ({
        ...d,
        date: new Date(d.date + "T00:00:00").toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "short",
        }),
        Litres: parseFloat(d.Litres.toFixed(1)),
        Amount: parseFloat(d.Amount.toFixed(0)),
      }));
  }, [entries]);

  const pieData = useMemo(
    () =>
      FAT_RANGES.map((r) => ({
        name: r.label,
        color: r.color,
        value: entries.filter((e) => e.fat >= r.min && e.fat < r.max).length,
      })).filter((d) => d.value > 0),
    [entries],
  );

  const topClients = useMemo(() => {
    const map = {};
    entries.forEach((e) => {
      const id = e.clientId || e.farmerId;
      if (!map[id]) map[id] = { id, volume: 0, revenue: 0 };
      map[id].volume += e.ltrs || 0;
      map[id].revenue += e.amount || 0;
    });
    return Object.values(map)
      .sort((a, b) => b.volume - a.volume)
      .slice(0, 5)
      .map((c) => {
        const client = clients.find((f) => f.id === c.id || f._id === c.id);
        return { ...c, name: client?.name || "Unknown" };
      });
  }, [entries, clients]);

  const totalLtrs = entries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const totalAmount = entries.reduce((s, e) => s + (e.amount || 0), 0);
  const avgFat = entries.length
    ? entries.reduce((s, e) => s + (e.fat || 0), 0) / entries.length
    : 0;
  const pendingCount = entries.filter((e) => !e.paid).length;
  const pendingAmount = entries
    .filter((e) => !e.paid)
    .reduce((s, e) => s + (e.amount || 0), 0);

  const thisMonthLtrs = entries
    .filter((e) => e.date?.startsWith(currentMonth))
    .reduce((s, e) => s + (e.ltrs || 0), 0);
  const prevMonthLtrs = entries
    .filter((e) => e.date?.startsWith(prevMonthStr))
    .reduce((s, e) => s + (e.ltrs || 0), 0);
  const volumeTrend =
    prevMonthLtrs > 0
      ? ((thisMonthLtrs - prevMonthLtrs) / prevMonthLtrs) * 100
      : null;

  return (
    <div className="flex flex-col gap-3">
      {/* KPI Row */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-2.5">
        <KPICard
          icon={Droplets}
          label="Total Milk Collected"
          value={`${totalLtrs.toFixed(0)}L`}
          sub={`${thisMonthLtrs.toFixed(0)}L this month`}
          accent="#166B4D"
          delay={0}
          trend={volumeTrend}
        />
        <KPICard
          icon={IndianRupee}
          label="Total Revenue"
          value={`₹${(totalAmount / 1000).toFixed(1)}k`}
          sub="All-time earnings"
          accent="#C8891C"
          delay={0.05}
        />
        <KPICard
          icon={Activity}
          label="Avg Fat Quality"
          value={`${avgFat.toFixed(2)}%`}
          sub={
            avgFat >= 4.5
              ? "Good quality"
              : avgFat >= 4
                ? "Average"
                : "Below standard"
          }
          accent="#0D1B2A"
          delay={0.1}
        />
        <KPICard
          icon={Clock}
          label="Pending Payment"
          value={pendingCount}
          sub={`₹${pendingAmount.toFixed(0)} outstanding`}
          accent="#991B1B"
          delay={0.15}
        />
      </div>

      {/* Charts Row */}
      <div className="flex flex-col xl:flex-row gap-3">
        {/* Line Chart */}
        <motion.div
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="flex-1 bg-white rounded-3xl border border-[#E8E0D0] shadow-sm p-4 flex flex-col min-h-[240px]"
        >
          <div className="flex items-center gap-2.5 mb-4">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: "#FDF3E0", border: "1px solid #F5D99E" }}
            >
              <TrendingUp size={13} color="#C8891C" />
            </div>
            <div>
              <div
                className="font-black text-sm text-[#0D1B2A]"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Collection Trend
              </div>
              <div className="text-[10px] text-[#8A9BB0]">Last 14 days</div>
            </div>
          </div>
          <div className="flex-1 min-h-[160px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={lineData}
                margin={{ top: 4, right: 4, left: -24, bottom: 0 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#F5F0E8" />
                <XAxis
                  dataKey="date"
                  tick={{
                    fontSize: 9,
                    fill: "#B0C4D8",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  tick={{
                    fontSize: 9,
                    fill: "#B0C4D8",
                    fontFamily: "'IBM Plex Mono', monospace",
                  }}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip content={<ChartTooltip />} />
                <Line
                  type="monotone"
                  dataKey="Litres"
                  stroke="#C8891C"
                  strokeWidth={2.5}
                  dot={{
                    r: 3.5,
                    fill: "#C8891C",
                    strokeWidth: 2,
                    stroke: "#fff",
                  }}
                  activeDot={{
                    r: 5,
                    stroke: "#C8891C",
                    strokeWidth: 2,
                    fill: "#fff",
                  }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <div className="flex flex-col gap-3 xl:w-[480px] shrink-0">
          {/* Pie Chart */}
          <motion.div
            initial={{ opacity: 0, x: 12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.25 }}
            className="flex-1 bg-white rounded-3xl border border-[#E8E0D0] shadow-sm p-4 flex flex-col min-h-[180px]"
          >
            <div className="flex items-center gap-2.5 mb-3">
              <div className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-[#0D1B2A]">
                <BarChart3 size={13} color="#E3A32E" />
              </div>
              <div>
                <div
                  className="font-black text-sm text-[#0D1B2A]"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Fat Distribution
                </div>
                <div className="text-[10px] text-[#8A9BB0]">Quality bands</div>
              </div>
            </div>
            <div className="flex-1 min-h-[130px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="44%"
                    innerRadius="38%"
                    outerRadius="68%"
                    paddingAngle={3}
                    dataKey="value"
                  >
                    {pieData.map((d, i) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(v) => (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 700,
                          color: "#4A5B70",
                        }}
                      >
                        {v}
                      </span>
                    )}
                  />
                  <Tooltip formatter={(v, n) => [`${v} entries`, n]} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </motion.div>

          {/* Top Clients */}
          {topClients.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white rounded-3xl border border-[#E8E0D0] shadow-sm p-4"
            >
              <div className="flex items-center gap-2 mb-3">
                <Award size={13} color="#C8891C" />
                <span className="font-black text-[11px] text-[#0D1B2A] uppercase tracking-wide">
                  Top Contributors
                </span>
              </div>
              <div className="flex flex-col gap-1.5">
                {topClients.map((c, i) => {
                  const pct = (c.volume / (topClients[0].volume || 1)) * 100;
                  return (
                    <div key={c.id} className="flex items-center gap-2">
                      <div className="text-[9px] font-black text-[#8A9BB0] w-4 shrink-0">
                        #{i + 1}
                      </div>
                      <div className="text-[11px] font-bold text-[#0D1B2A] w-24 shrink-0 truncate">
                        {c.name}
                      </div>
                      <div className="flex-1 bg-[#F7F4EF] rounded-full h-1.5 overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${pct}%` }}
                          transition={{ delay: 0.4 + i * 0.06, duration: 0.5 }}
                          className="h-full rounded-full"
                          style={{
                            background: i === 0 ? "#C8891C" : "#0D1B2A",
                          }}
                        />
                      </div>
                      <div className="text-[10px] font-mono font-black text-[#0D1B2A] w-14 text-right shrink-0">
                        {c.volume.toFixed(0)}L
                      </div>
                    </div>
                  );
                })}
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default BusinessAnalytics;
