import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users,
  Phone,
  MapPin,
  Hash,
  Upload,
  Download,
  Search,
  X,
  BadgeCheck,
  ChevronDown,
  Loader2,
  Droplets,
  Trash2,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const ClientDirectory = ({ clients = [], setClients, entries = [] }) => {
  const { axios, toast } = useAppContext();
  const [search, setSearch] = useState("");
  const [expandedId, setExpandedId] = useState(null);
  const [csvError, setCsvError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [sortBy, setSortBy] = useState("name");
  const fileRef = useRef(null);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this client? All associated entries will be permanently removed.")) return;
    try {
      const res = await axios.delete(`/api/owner/clients/${id}`);
      if (res.data.success) {
        setClients(prev => prev.filter(c => (c.id || c._id) !== id));
        toast.success("Client deleted successfully.");
        setExpandedId(null);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to delete client.");
    }
  };

  const stats = (clientId) => {
    const ce = entries.filter((e) => (e.clientId || e.farmerId) === clientId);
    return {
      revenue: ce.reduce((s, e) => s + (e.amount || 0), 0),
      volume: ce.reduce((s, e) => s + (e.ltrs || 0), 0),
      pending: ce
        .filter((e) => !e.paid)
        .reduce((s, e) => s + (e.amount || 0), 0),
      sessions: ce.length,
    };
  };

  const filtered = clients
    .filter(
      (c) =>
        c.name?.toLowerCase().includes(search.toLowerCase()) ||
        c.phone?.includes(search) ||
        c.serialId?.toLowerCase().includes(search.toLowerCase()),
    )
    .sort((a, b) => {
      if (sortBy === "revenue")
        return stats(b.id).revenue - stats(a.id).revenue;
      if (sortBy === "volume") return stats(b.id).volume - stats(a.id).volume;
      return a.name?.localeCompare(b.name || "") || 0;
    });

  const handleCSVImport = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsImporting(true);
    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const lines = evt.target.result.split("\n").filter((l) => l.trim());
        if (lines.length < 2) {
          setCsvError("CSV is empty.");
          setIsImporting(false);
          return;
        }
        const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());
        const nameIdx = headers.indexOf("name");
        const phoneIdx = headers.indexOf("phone");
        if (nameIdx === -1 || phoneIdx === -1) {
          setCsvError("CSV must have 'name' and 'phone' columns.");
          setIsImporting(false);
          return;
        }
        const cols = {
          whatsapp: headers.indexOf("whatsapp"),
          address: headers.indexOf("address"),
          bankAccount: headers.indexOf("bankaccount"),
          ifsc: headers.indexOf("ifsc"),
        };
        const parsed = lines
          .slice(1)
          .map((line) => {
            const c = line.split(",").map((x) => x.trim());
            return {
              name: c[nameIdx] || "",
              phone: c[phoneIdx] || "",
              whatsapp: cols.whatsapp >= 0 ? c[cols.whatsapp] || "" : "",
              address:
                cols.address >= 0
                  ? c[cols.address] || "Not provided"
                  : "Not provided",
              bankAccount:
                cols.bankAccount >= 0 ? c[cols.bankAccount] || "" : "",
              ifsc: cols.ifsc >= 0 ? c[cols.ifsc] || "" : "",
            };
          })
          .filter((c) => c.name && c.phone);
        if (!parsed.length) {
          setCsvError("No valid rows found.");
          setIsImporting(false);
          return;
        }
        const toastId = toast.loading(`Importing ${parsed.length} clients...`);
        let count = 0;
        const added = [];
        for (const c of parsed) {
          try {
            const res = await axios.post("/api/owner/add-clients", c);
            if (res.data.success && res.data.data) {
              added.push({
                ...res.data.data,
                id: res.data.data._id || res.data.data.id,
              });
              count++;
            }
          } catch {
            /* skip duplicates */
          }
        }
        count > 0
          ? (setClients((prev) => [...added, ...prev]),
            toast.success(`Imported ${count} clients!`, { id: toastId }))
          : toast.error("No clients imported.", { id: toastId });
        setCsvError("");
        e.target.value = "";
      } catch {
        setCsvError("Failed to parse CSV.");
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
  };

  const exportCSV = () => {
    const rows = [
      "ID,Name,Phone,WhatsApp,Address,Volume (L),Revenue (₹)",
    ];
    clients.forEach((c) => {
      const s = stats(c.id);
      rows.push(
        `${c.serialId || ""},${c.name || ""},${c.phone || ""},${c.whatsapp || ""},${c.address || ""},${s.volume.toFixed(1)},${s.revenue.toFixed(0)}`,
      );
    });
    const link = document.createElement("a");
    link.href =
      "data:text/csv;charset=utf-8," + encodeURIComponent(rows.join("\n"));
    link.download = `TejasDairy_Clients_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8E0D0] shadow-[0_4px_20px_rgba(9,22,41,0.07)] flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 sm:px-4 py-3 border-b border-[#F5F0E8] bg-[#F7F4EF] shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[8px] flex items-center justify-center bg-[#0D1B2A]">
            <Users size={13} color="#FAFAF5" />
          </div>
          <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#0D1B2A]">
            Client Directory{" "}
            <span className="text-[#8A9BB0] font-medium normal-case">
              ({clients.length})
            </span>
          </span>
        </div>
        <div className="flex items-center gap-1.5 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="text-[10px] font-bold text-[#0D1B2A] border border-[#E8E0D0] rounded-[9px] px-2.5 py-1.5 bg-white outline-none cursor-pointer"
            style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
          >
            <option value="name">Name</option>
            <option value="revenue">Revenue</option>
            <option value="volume">Volume</option>
          </select>
          <div className="flex items-center gap-1.5 bg-white border border-[#E8E0D0] rounded-[9px] px-2.5 py-1.5">
            <Search size={11} color="#B0C4D8" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search…"
              className="text-[11px] font-semibold text-[#0D1B2A] border-none outline-none bg-transparent w-20 sm:w-28 placeholder:text-[#C8B99A]"
              style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
            />
            {search && (
              <button onClick={() => setSearch("")}>
                <X size={9} color="#B0C4D8" />
              </button>
            )}
          </div>
          <input
            ref={fileRef}
            type="file"
            accept=".csv"
            onChange={handleCSVImport}
            className="hidden"
          />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isImporting}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border border-[#B0C4D8]/40 bg-[#F0F4F8] text-[#2D4A6A] text-[10px] font-black cursor-pointer hover:bg-[#E2EBF4] transition-colors disabled:opacity-50"
          >
            {isImporting ? (
              <Loader2 size={11} className="animate-spin" />
            ) : (
              <Upload size={11} />
            )}{" "}
            CSV
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-[9px] border border-[#B5DDCA] bg-[#F0F7F3] text-[#166B4D] text-[10px] font-black cursor-pointer hover:bg-[#D4EDE5] transition-colors"
          >
            <Download size={11} /> Export
          </button>
        </div>
      </div>

      {csvError && (
        <div className="px-4 py-2 bg-red-50 border-b border-red-100 text-[11px] font-semibold text-red-600 flex items-center justify-between shrink-0">
          {csvError}
          <button onClick={() => setCsvError("")}>
            <X size={11} />
          </button>
        </div>
      )}

      {/* Responsive Table */}
      <div className="flex-1 overflow-auto">
        <table className="w-full border-collapse" style={{ minWidth: 500 }}>
          <thead className="sticky top-0 z-10">
            <tr className="bg-[#F7F4EF] border-b border-[#E8E0D0]">
              {["Client", "Contact", "Location", "Activity", ""].map((h) => (
                <th
                  key={h}
                  className="px-3 sm:px-4 py-2.5 text-[9px] font-black text-[#8A9BB0] uppercase tracking-widest text-left"
                >
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="text-center py-14">
                  <div className="flex flex-col items-center gap-2 text-[#C8B99A]">
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{
                        duration: 1.2,
                        repeat: Infinity,
                        ease: "linear",
                      }}
                    >
                      <Droplets size={24} />
                    </motion.div>
                    <span className="text-[12px] font-semibold">
                      Loading...
                    </span>
                  </div>
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="text-center py-14 text-[12px] font-medium text-[#8A9BB0]"
                >
                  {search
                    ? `No clients match "${search}"`
                    : "No clients registered yet."}
                </td>
              </tr>
            ) : (
              filtered.map((c) => {
                const cId = c.id || c._id;
                const s = stats(cId);
                return (
                  <React.Fragment key={cId}>
                    <tr className="hover:bg-[#FDFBF8] border-b border-[#F5F0E8] transition-colors">
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-2.5">
                          <div
                            className="w-8 h-8 rounded-[9px] flex items-center justify-center text-white font-black text-sm shrink-0 uppercase"
                            style={{
                              background:
                                "linear-gradient(135deg, #0D1B2A, #2D4A6A)",
                            }}
                          >
                            {c.name?.[0] || "?"}
                          </div>
                          <div>
                            <div className="flex items-center gap-1">
                              <span className="text-[12px] font-bold text-[#0D1B2A]">
                                {c.name}
                              </span>
                              {c.active && (
                                <BadgeCheck size={11} color="#43A67F" />
                              )}
                            </div>
                            <div className="text-[9px] font-black text-[#8A9BB0] uppercase tracking-wide">
                              {c.serialId}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4A5B70]">
                          <Phone size={11} color="#B0C4D8" /> {c.phone}
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="flex items-center gap-1.5 text-[11px] font-bold text-[#4A5B70] max-w-[130px]">
                          <MapPin size={11} color="#B0C4D8" />
                          <span className="truncate">{c.address || "—"}</span>
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <div className="text-[10px] font-bold text-[#166B4D]">
                          ₹{s.revenue.toFixed(0)}
                        </div>
                        <div className="text-[9px] text-[#8A9BB0]">
                          {s.volume.toFixed(1)}L · {s.sessions} entries
                        </div>
                      </td>
                      <td className="px-3 sm:px-4 py-3">
                        <button
                          onClick={() =>
                            setExpandedId(expandedId === cId ? null : cId)
                          }
                          className="w-7 h-7 rounded-[7px] border border-[#E8E0D0] bg-[#F7F4EF] flex items-center justify-center cursor-pointer hover:bg-[#EDE8DF] transition-colors"
                        >
                          <motion.div
                            animate={{ rotate: expandedId === cId ? 180 : 0 }}
                            transition={{ duration: 0.2 }}
                          >
                            <ChevronDown size={12} color="#8A9BB0" />
                          </motion.div>
                        </button>
                      </td>
                    </tr>
                    <AnimatePresence>
                      {expandedId === cId && (
                        <motion.tr
                          key={`exp-${cId}`}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                        >
                          <td colSpan={5} className="px-4 pb-3 pt-1">
                            <div className="bg-[#0D1B2A] rounded-[14px] p-4 text-white relative">
                              <button
                                onClick={() => handleDelete(cId)}
                                className="absolute top-4 right-4 flex items-center gap-1.5 px-2.5 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg text-[10px] font-black uppercase tracking-widest transition-colors"
                              >
                                <Trash2 size={12} />
                                Delete
                              </button>
                              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pr-24">
                                {[
                                  {
                                    label: "Account No.",
                                    value: c.bankAccount || "Not provided",
                                  },
                                  {
                                    label: "IFSC Code",
                                    value: c.ifsc || "Not provided",
                                  },
                                  {
                                    label: "WhatsApp",
                                    value:
                                      c.whatsapp || c.phone || "Not provided",
                                  },
                                  {
                                    label: "Address",
                                    value: c.address || "Not provided",
                                  },
                                ].map((item) => (
                                  <div key={item.label}>
                                    <div className="text-[9px] font-black uppercase tracking-wide text-white/35 mb-1">
                                      {item.label}
                                    </div>
                                    <div className="font-mono text-[11px] text-[#E3A32E]">
                                      {item.value}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </motion.tr>
                      )}
                    </AnimatePresence>
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ClientDirectory;
