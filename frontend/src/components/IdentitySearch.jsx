import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  UserCircle2,
  Phone,
  Hash,
  X,
  Fingerprint,
  BadgeCheck,
  Droplets,
  Users,
  TrendingUp,
  IndianRupee,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const SearchingIndicator = ({ query }) => {
  const steps = [
    "Searching clients...",
    "Scanning records...",
    "Finding matches...",
    "Fetching data...",
  ];
  const [idx, setIdx] = useState(0);
  useEffect(() => {
    setIdx(0);
    const iv = setInterval(() => setIdx((i) => (i + 1) % steps.length), 900);
    return () => clearInterval(iv);
  }, [query]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-2 px-3.5 py-2 rounded-xl mt-2"
      style={{ background: "#FDF3E0", border: "1px solid #F5D99E" }}
    >
      <div className="flex gap-0.5 shrink-0">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#C8891C" }}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.1, 0.8] }}
            transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.2 }}
          />
        ))}
      </div>
      <AnimatePresence mode="wait">
        <motion.span
          key={idx}
          initial={{ opacity: 0, y: 3 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -3 }}
          transition={{ duration: 0.25 }}
          className="text-[11px] font-bold text-[#A86D15]"
        >
          {steps[idx]}
        </motion.span>
      </AnimatePresence>
    </motion.div>
  );
};

const IdentitySearch = ({
  clients = [],
  selectedClient,
  setSelectedClient,
  entries = [],
}) => {
  const { axios } = useAppContext();
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [focused, setFocused] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [noResults, setNoResults] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setTimeout(() => inputRef.current?.focus(), 80);
  }, []);

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions([]);
      setIsSearching(false);
      setNoResults(false);
      return;
    }
    setIsSearching(true);
    setNoResults(false);
    const timer = setTimeout(async () => {
      try {
        const res = await axios.get(
          `/api/owner/search-clients?q=${encodeURIComponent(query.trim())}`,
        );
        if (res.data.success) {
          const mapped = res.data.data.map((c) => ({
            ...c,
            id: c._id || c.id,
          }));
          setSuggestions(mapped);
          setNoResults(mapped.length === 0);
        }
      } catch {
        setSuggestions([]);
      } finally {
        setIsSearching(false);
      }
    }, 320);
    return () => clearTimeout(timer);
  }, [query, axios]);

  const selectClient = (c) => {
    setSelectedClient(c);
    setQuery("");
    setSuggestions([]);
    setFocused(false);
    setNoResults(false);
  };
  const clearSelection = () => {
    setSelectedClient(null);
    setQuery("");
    setSuggestions([]);
    setNoResults(false);
    setTimeout(() => inputRef.current?.focus(), 60);
  };

  // Derived stats for hero
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const todayLitres = todayEntries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const todayRevenue = todayEntries.reduce((s, e) => s + (e.amount || 0), 0);
  const pendingAmt = entries
    .filter((e) => !e.paid)
    .reduce((s, e) => s + (e.amount || 0), 0);

  return (
    <div>
      {/* Hero Block */}
      <AnimatePresence mode="wait">
        {!selectedClient && (
          <motion.div
            key="hero"
            initial={{ opacity: 0, y: -12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12, height: 0, marginBottom: 0 }}
            transition={{ duration: 0.3, ease: "easeOut" }}
            className="mb-4"
          >
            <div className="flex items-center gap-3 mb-4">
              <motion.div
                initial={{ scale: 0.8, rotate: -10 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{
                  type: "spring",
                  stiffness: 280,
                  damping: 20,
                  delay: 0.05,
                }}
                className="relative w-12 h-12 rounded-[14px] overflow-hidden shrink-0 shadow-[0_8px_24px_rgba(9,22,41,0.25)]"
              >
                <img
                  src="/logo.jpeg"
                  alt="Tejas Dairy"
                  className="w-full h-full object-cover"
                />
              </motion.div>
              <div>
                <h1
                  className="text-2xl sm:text-3xl text-[#0D1B2A] leading-none tracking-[-0.02em]"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Tejas Dairy
                </h1>
                <p
                  className="text-xs text-[#8A9BB0] mt-0.5 italic"
                  style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
                >
                  Daily Operations Centre
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-3">
              {[
                {
                  label: "Today's Milk",
                  value: `${todayLitres.toFixed(1)}L`,
                  color: "#166B4D",
                  bg: "#F0F7F3",
                  border: "#B5DDCA",
                  icon: Droplets,
                },
                {
                  label: "Revenue",
                  value: `₹${todayRevenue.toFixed(0)}`,
                  color: "#C8891C",
                  bg: "#FDF8EC",
                  border: "#F5D99E",
                  icon: IndianRupee,
                },
                {
                  label: "Pending",
                  value: `₹${pendingAmt.toFixed(0)}`,
                  color: "#991B1B",
                  bg: "#FEF2F2",
                  border: "#FECACA",
                  icon: TrendingUp,
                },
              ].map((s, i) => (
                <motion.div
                  key={s.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 + i * 0.05 }}
                  className="rounded-xl p-2.5 text-center"
                  style={{ background: s.bg, border: `1px solid ${s.border}` }}
                >
                  <s.icon size={11} color={s.color} className="mx-auto mb-1" />
                  <div
                    className="font-mono font-black text-sm leading-none"
                    style={{ color: s.color }}
                  >
                    {s.value}
                  </div>
                  <div
                    className="text-[9px] font-bold uppercase tracking-wider mt-1 opacity-60"
                    style={{ color: s.color }}
                  >
                    {s.label}
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-[11px] text-[#8A9BB0] text-center font-medium">
              Search by <span className="text-[#0D1B2A] font-bold">Name</span>,{" "}
              <span className="text-[#0D1B2A] font-bold">Phone</span>, or{" "}
              <span className="text-[#0D1B2A] font-bold">Client ID</span>
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Card */}
      <div className="bg-white rounded-3xl border border-[#E8E0D0] shadow-[0_4px_20px_rgba(9,22,41,0.07)] p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="w-7 h-7 rounded-[8px] flex items-center justify-center"
              style={{ background: "#FDF3E0", border: "1px solid #F5D99E" }}
            >
              <Fingerprint size={13} color="#C8891C" />
            </div>
            <span className="text-[11px] font-black uppercase tracking-[0.1em] text-[#0D1B2A]">
              Client Identity
            </span>
          </div>
          {selectedClient && (
            <motion.button
              whileTap={{ scale: 0.95 }}
              onClick={clearSelection}
              className="text-[10px] font-bold uppercase tracking-wide text-[#8A9BB0] bg-[#F5F0E8] border border-[#E8E0D0] px-2.5 py-1 rounded-lg cursor-pointer hover:text-red-700 hover:bg-red-50 hover:border-red-200 transition-all"
            >
              ← Change
            </motion.button>
          )}
        </div>

        {/* Search Input */}
        <div className="relative">
          <motion.div
            animate={{
              borderColor: focused ? "#C8891C" : "#E8E0D0",
              boxShadow: focused ? "0 0 0 3px rgba(200,137,28,0.12)" : "none",
              backgroundColor: focused ? "#fff" : "#FAFAF5",
            }}
            className="flex items-center gap-2.5 rounded-xl px-3.5 py-2.5 border transition-colors"
          >
            <Search
              size={14}
              color={focused ? "#C8891C" : "#B0C4D8"}
              className="shrink-0 transition-colors"
            />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setTimeout(() => setFocused(false), 180)}
              placeholder="Search by ID, name or phone…"
              className="flex-1 bg-transparent border-none outline-none text-[13px] font-semibold text-[#0D1B2A] placeholder:text-[#C8B99A]"
              style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
            />
            {query && (
              <motion.button
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                onClick={() => {
                  setQuery("");
                  setSuggestions([]);
                  setNoResults(false);
                  inputRef.current?.focus();
                }}
                className="p-0.5 bg-[#F5F0E8] border-none rounded-[6px] cursor-pointer flex hover:bg-[#EDE8DF] transition-colors"
              >
                <X size={11} color="#8A9BB0" />
              </motion.button>
            )}
          </motion.div>

          <AnimatePresence>
            {isSearching && query.trim() && (
              <SearchingIndicator query={query} />
            )}
          </AnimatePresence>

          <AnimatePresence>
            {noResults && !isSearching && query.trim() && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="mt-2 px-3.5 py-2.5 rounded-xl text-[11px] font-semibold text-[#8A9BB0]"
                style={{ background: "#F5F0E8", border: "1px solid #E8E0D0" }}
              >
                No clients found for "{query}"
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence>
            {suggestions.length > 0 && !isSearching && (
              <motion.div
                initial={{ opacity: 0, y: -6, scale: 0.97 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -6, scale: 0.97 }}
                transition={{ duration: 0.15 }}
                className="absolute top-[calc(100%+8px)] left-0 right-0 z-50 bg-white border border-[#E8E0D0] rounded-[16px] shadow-[0_8px_32px_rgba(9,22,41,0.14)] overflow-hidden"
              >
                {suggestions.map((c, i) => (
                  <motion.button
                    key={c.id}
                    initial={{ opacity: 0, x: -8 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => selectClient(c)}
                    className="w-full flex items-center gap-3 px-4 py-3 border-none bg-transparent cursor-pointer text-left transition-colors hover:bg-[#F7F4EF]"
                    style={{
                      borderBottom:
                        i < suggestions.length - 1
                          ? "1px solid #F5F0E8"
                          : "none",
                    }}
                  >
                    <div
                      className="w-9 h-9 rounded-[10px] flex items-center justify-center text-white font-black text-sm shrink-0 uppercase"
                      style={{
                        background: "linear-gradient(135deg, #0D1B2A, #2D4A6A)",
                      }}
                    >
                      {c.name?.[0] || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] font-bold text-[#0D1B2A] truncate">
                        {c.name}
                      </div>
                      <div className="text-[10px] text-[#8A9BB0] font-mono mt-0.5">
                        {c.serialId} · {c.phone}
                      </div>
                    </div>
                    <span className="text-[9px] font-black uppercase tracking-wide text-[#C8891C] bg-[#FDF3E0] border border-[#F5D99E] px-2 py-1 rounded-[6px] shrink-0">
                      Select
                    </span>
                  </motion.button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Selected Client Card */}
        <AnimatePresence mode="wait">
          {selectedClient ? (
            <motion.div
              key={selectedClient.id}
              initial={{ opacity: 0, y: 10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 6, scale: 0.97 }}
              transition={{ duration: 0.22, ease: "easeOut" }}
              className="mt-3 rounded-[16px] overflow-hidden"
              style={{
                background: "linear-gradient(135deg, #0D1B2A 0%, #1B3350 100%)",
                border: "1px solid rgba(255,255,255,0.08)",
                boxShadow: "0 8px 24px rgba(9,22,41,0.18)",
              }}
            >
              <div
                className="h-[2px]"
                style={{
                  background: "linear-gradient(90deg, #C8891C, #E3A32E)",
                }}
              />
              <div className="p-3.5">
                <div className="flex items-center gap-2.5 mb-3">
                  <div
                    className="w-10 h-10 rounded-[12px] flex items-center justify-center text-white font-black text-base shrink-0 uppercase"
                    style={{
                      background: "linear-gradient(135deg, #C8891C, #E3A32E)",
                      boxShadow: "0 4px 12px rgba(200,137,28,0.35)",
                    }}
                  >
                    {selectedClient.name?.[0] || "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span
                        className="text-base text-white truncate leading-tight"
                        style={{
                          fontFamily: "'DM Serif Display', Georgia, serif",
                        }}
                      >
                        {selectedClient.name}
                      </span>
                      <BadgeCheck size={14} color="#43A67F" />
                    </div>
                    <div className="font-mono text-[10px] text-white/40 tracking-[0.1em] mt-0.5">
                      {selectedClient.serialId}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-1.5">
                  <div className="flex items-center gap-1.5 bg-white/[0.07] rounded-[9px] px-2.5 py-2 border border-white/[0.05]">
                    <Phone size={10} color="rgba(227,163,46,0.7)" />
                    <span className="text-[11px] text-white/65 font-medium truncate">
                      {selectedClient.phone}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white/[0.07] rounded-[9px] px-2.5 py-2 border border-white/[0.05]">
                    <Hash size={10} color="rgba(227,163,46,0.7)" />
                    <span className="text-[11px] font-mono text-white/65 truncate">
                      {selectedClient.bankAccount
                        ? `A/C …${selectedClient.bankAccount.slice(-4)}`
                        : "No Bank A/C"}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 p-4 bg-[#FAFAF5] rounded-xl flex items-center justify-center gap-2"
              style={{ border: "1.5px dashed #E8E0D0" }}
            >
              <UserCircle2 size={16} color="#C8B99A" />
              <span className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#C8B99A]">
                No client selected
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {!selectedClient && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 mt-3"
        >
          <Users size={11} color="#C8B99A" />
          <span className="text-[11px] text-[#C8B99A] font-medium">
            {clients.length} registered clients
          </span>
        </motion.div>
      )}
    </div>
  );
};

export default IdentitySearch;
