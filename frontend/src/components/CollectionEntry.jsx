import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Sun,
  Moon,
  Save,
  Calculator,
  AlertCircle,
  Zap,
  Plus,
  CheckCircle,
  Loader2,
  X,
  Calendar,
  MonitorSmartphone,
  Cpu
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

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

const InputField = ({
  label,
  value,
  onChange,
  readOnly,
  prefix,
  suffix,
  step = "0.1",
  placeholder,
  disabled,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A9BB0]">
        {label}
      </div>
      <motion.div
        animate={{
          borderColor: readOnly
            ? "transparent"
            : focused
              ? "#C8891C"
              : "#E8E0D0",
          boxShadow:
            focused && !readOnly ? "0 0 0 3px rgba(200,137,28,0.1)" : "none",
        }}
        className="flex items-center gap-1.5 rounded-xl px-3 py-2.5 border transition-all h-[42px]"
        style={{
          background: readOnly
            ? "linear-gradient(135deg, #0D1B2A, #1B3350)"
            : "#FAFAF5",
          opacity: disabled && !readOnly ? 0.65 : 1,
        }}
      >
        {prefix && (
          <span
            className="font-mono text-xs font-semibold"
            style={{ color: readOnly ? "rgba(250,250,245,0.45)" : "#8A9BB0" }}
          >
            {prefix}
          </span>
        )}
        <input
          type="number"
          step={step}
          value={value}
          onChange={onChange}
          readOnly={readOnly}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 border-none outline-none bg-transparent w-full"
          style={{
            fontSize: readOnly ? 17 : 13,
            fontWeight: readOnly ? 800 : 600,
            color: readOnly ? "#E3A32E" : "#0D1B2A",
            fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
          }}
        />
        {suffix && (
          <span
            className="text-[10px] font-semibold shrink-0"
            style={{ color: readOnly ? "rgba(250,250,245,0.4)" : "#B0C4D8" }}
          >
            {suffix}
          </span>
        )}
      </motion.div>
    </div>
  );
};

const CollectionEntry = ({ selectedClient, onSave }) => {
  const { apiRequest, toast } = useAppContext();

  // States
  const [entryDate, setEntryDate] = useState(() => getISTDateString());
  const [shift, setShift] = useState(() => {
    // Check IST hour for default shift
    const istHour = new Date(
      new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }),
    ).getHours();
    return istHour >= 12 ? "PM" : "AM";
  });
  const [quantity, setQuantity] = useState("");
  const [fat, setFat] = useState("");
  const [snf, setSnf] = useState("");
  const [rate, setRate] = useState("");
  const [saved, setSaved] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [pinnedRates, setPinnedRates] = useState([]);
  const [error, setError] = useState("");
  
  // Analyzer Integration States
  const [inputMode, setInputMode] = useState("manual"); // "manual" | "auto"
  const [serialConnected, setSerialConnected] = useState(false);
  const [machineStatus, setMachineStatus] = useState("Waiting for Essae MA-815 connection...");
  const portRef = useRef(null);
  const readerRef = useRef(null);
  const abortControllerRef = useRef(null);
  const lastFetchedRef = useRef("");

  // Safely close the port when the component unmounts
  useEffect(() => {
    return () => {
      const shutdown = async () => {
        if (readerRef.current) {
          try { await readerRef.current.cancel(); } catch (e) {}
        }
        if (portRef.current) {
          try { await portRef.current.close(); } catch (e) {}
        }
      };
      shutdown();
    };
  }, []);

  const amount = (parseFloat(quantity) || 0) * (parseFloat(rate) || 0);
  const isValid =
    selectedClient &&
    entryDate &&
    quantity &&
    rate &&
    fat &&
    snf &&
    parseFloat(quantity) > 0 &&
    parseFloat(fat) > 0 &&
    parseFloat(snf) > 0 &&
    parseFloat(rate) > 0;

  // Format the selected date beautifully for the header
  const displayDate = entryDate
    ? new Date(entryDate + "T00:00:00").toLocaleDateString("en-IN", {
        weekday: "short",
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "Select Date";

  const pinRate = useCallback(() => {
    const r = parseFloat(rate);
    if (r && !pinnedRates.includes(r))
      setPinnedRates((p) => [r, ...p].slice(0, 5));
  }, [rate, pinnedRates]);

  const resetForm = useCallback(() => {
    setQuantity("");
    setFat("");
    setSnf("");
    setRate("");
    setError("");
    lastFetchedRef.current = ""; // Clear fetch history for identical successive tests
    setEntryDate(getISTDateString()); // Reset to today's IST date
  }, []);

  const handleConnectAnalyzer = async () => {
    try {
      if (!("serial" in navigator)) {
        toast.error("Web Serial API not supported. Use Chrome or Edge.");
        return;
      }

      const port = await navigator.serial.requestPort();
      await port.open({ 
        baudRate: 9600, 
        dataBits: 8, 
        stopBits: 1, 
        parity: "none" 
      });
      portRef.current = port;

      setSerialConnected(true);
      setMachineStatus("MA-815ABS connected. Waiting for sample...");
      toast.success("Essae MA-815ABS connected!");

      const textDecoder = new TextDecoderStream();
      abortControllerRef.current = new AbortController();
      port.readable.pipeTo(textDecoder.writable, { 
        signal: abortControllerRef.current.signal 
      }).catch(() => {}); // AbortError naturally occurs on explicit disconnect
      
      const reader = textDecoder.readable.getReader();
      readerRef.current = reader;

      let buffer = "";
      try {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;

          buffer += value;

          if (buffer.includes("\n") || buffer.includes("\r")) {
            const lines = buffer.split(/\r?\n/);
            buffer = lines.pop(); // keep incomplete last chunk

            for (const line of lines) {
              const dataLine = line.trim();
              if (!dataLine) continue;

              setMachineStatus(`Raw: ${dataLine}`);

              // Attempt explicit label parsing first (e.g., FAT: 3.60)
              const fatMatch = dataLine.match(/FAT[:\s]+(\d+\.\d+)/i);
              const snfMatch = dataLine.match(/SNF[:\s]+(\d+\.\d+)/i);

              if (fatMatch || snfMatch) {
                if (fatMatch) setFat(fatMatch[1]);
                if (snfMatch) setSnf(snfMatch[1]);
                
                const newKey = `${fatMatch?.[1]}-${snfMatch?.[1]}`;
                if (newKey !== lastFetchedRef.current) {
                  lastFetchedRef.current = newKey;
                  toast.success("Fat & SNF fetched automatically!");
                }
              } else {
                // Positional CSV fallback
                const decimals = dataLine.match(/\d+\.\d+/g);
                if (decimals && decimals.length >= 2) {
                  setFat(decimals[0]);   // Fat %
                  setSnf(decimals[1]);   // SNF %
                  
                  const newKey = `${decimals[0]}-${decimals[1]}`;
                  if (newKey !== lastFetchedRef.current) {
                    lastFetchedRef.current = newKey;
                    toast.success("Fat & SNF fetched automatically!");
                  }
                }
              }
            }
          }
        }
      } catch (err) {
        setSerialConnected(false);
        setMachineStatus("Connection lost. Reconnect the device.");
      } finally {
        reader.releaseLock();
      }
    } catch (e) {
      setMachineStatus("Port selection cancelled or failed.");
    }
  };

  const handleDisconnectAnalyzer = async () => {
    try {
      abortControllerRef.current?.abort();
      if (readerRef.current) {
        await readerRef.current.cancel().catch(() => {});
      }
      if (portRef.current) {
        await portRef.current.close().catch(() => {});
      }
    } catch(err) {}
    setSerialConnected(false);
    setMachineStatus("Waiting for Essae MA-815 connection...");
    portRef.current = null;
    readerRef.current = null;
  };

  const handleSave = async () => {
    if (!isValid) return;
    setError("");
    setIsLoading(true);
    const parsedRate = parseFloat(rate);

    const payload = {
      farmerId: selectedClient.id || selectedClient._id,
      date: entryDate,
      shift,
      kgs: parseFloat(quantity),
      ltrs: parseFloat(quantity),
      fat: parseFloat(fat),
      snf: parseFloat(snf),
      rate: parsedRate,
      amount: parseFloat(amount.toFixed(2)),
      paid: false,
    };

    try {
      const res = await apiRequest("POST", "/api/owner/entries", payload);
      if (res.success) {
        const savedEntry = {
          ...res.data,
          id: res.data._id || res.data.id,
          clientId: res.data.clientId || payload.farmerId,
        };
        onSave(savedEntry);
        toast.success("Entry saved!");
        setSaved(true);
        setPinnedRates((p) =>
          [parsedRate, ...p.filter((r) => r !== parsedRate)].slice(0, 5),
        );
        setTimeout(() => {
          setSaved(false);
          resetForm();
        }, 1800);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save entry.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8E0D0] shadow-[0_4px_20px_rgba(9,22,41,0.07)] p-4 sm:p-5 flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div
            className="w-8 h-8 rounded-[9px] flex items-center justify-center"
            style={{ background: "#F0F7F3", border: "1px solid #B5DDCA" }}
          >
            <Droplets size={14} color="#166B4D" />
          </div>
          <div>
            <div className="text-[11px] font-black uppercase tracking-[0.1em] text-[#0D1B2A]">
              Collection Entry
            </div>
            <div className="text-[10px] text-[#8A9BB0] mt-0.5 font-semibold">
              {displayDate}
            </div>
          </div>
        </div>
        {(quantity ||
          fat ||
          snf ||
          rate ||
          entryDate !== getISTDateString()) && (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            onClick={resetForm}
            className="p-1.5 rounded-[7px] bg-[#FEF2F2] border border-[#FECACA] cursor-pointer hover:bg-red-100 transition-colors"
          >
            <X size={11} color="#991B1B" />
          </motion.button>
        )}
      </div>

      <AnimatePresence>
        {!selectedClient && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div
              className="flex items-center gap-2 rounded-[10px] px-3.5 py-2.5"
              style={{ background: "#FDF3E0", border: "1px solid #F5D99E" }}
            >
              <AlertCircle size={13} color="#C8891C" />
              <span className="text-[11px] font-semibold text-[#A86D15]">
                Select a client to log collection
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden mb-4"
          >
            <div className="flex items-center justify-between gap-2 rounded-[10px] px-3.5 py-2.5 bg-[#FEF2F2] border border-[#FECACA]">
              <div className="flex items-center gap-2">
                <AlertCircle size={13} color="#991B1B" />
                <span className="text-[11px] font-semibold text-red-800">
                  {error}
                </span>
              </div>
              <button onClick={() => setError("")}>
                <X size={10} color="#991B1B" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Date & Shift Row */}
      <div className="grid grid-cols-2 gap-2.5 mb-4">
        {/* Customizable Date Picker */}
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A9BB0]">
            Date
          </div>
          <div className="flex items-center gap-1.5 rounded-xl px-2.5 py-2 border border-[#E8E0D0] bg-[#FAFAF5] focus-within:border-[#C8891C] focus-within:ring-2 focus-within:ring-[#C8891C]/10 transition-all h-[42px] overflow-hidden">
            <Calendar size={13} color="#B0C4D8" className="shrink-0" />
            <input
              type="date"
              value={entryDate}
              onChange={(e) => setEntryDate(e.target.value)}
              disabled={isLoading}
              className="flex-1 border-none outline-none bg-transparent w-full text-[12px] font-semibold text-[#0D1B2A] cursor-pointer appearance-none"
              style={{
                fontFamily: "'IBM Plex Mono', 'Courier New', monospace",
              }}
            />
          </div>
        </div>

        {/* Shift Toggle */}
        <div className="flex flex-col gap-1">
          <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A9BB0]">
            Shift
          </div>
          <div className="flex gap-1.5 h-[42px]">
            {["AM", "PM"].map((s) => (
              <motion.button
                key={s}
                onClick={() => setShift(s)}
                disabled={isLoading}
                whileTap={{ scale: 0.96 }}
                className="flex-1 flex items-center justify-center gap-1.5 rounded-xl text-[12px] font-black transition-all duration-200 cursor-pointer border-none"
                style={{
                  fontFamily: "'Sora', system-ui, sans-serif",
                  background:
                    shift === s
                      ? s === "AM"
                        ? "#FDF3E0"
                        : "#0D1B2A"
                      : "#FAFAF5",
                  color:
                    shift === s
                      ? s === "AM"
                        ? "#A86D15"
                        : "#FAFAF5"
                      : "#B0C4D8",
                  border:
                    shift === s
                      ? `1px solid ${s === "AM" ? "#F5D99E" : "transparent"}`
                      : "1px solid #E8E0D0",
                }}
              >
                {s === "AM" ? <Sun size={12} /> : <Moon size={12} />} {s}
              </motion.button>
            ))}
          </div>
        </div>
      </div>



      {/* Inputs Grid */}
      <div className="grid grid-cols-3 gap-2.5 mb-4">
        <InputField
          label="Quantity"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          disabled={isLoading}
          suffix="L"
          placeholder="0.0"
        />
        <InputField
          label="Fat %"
          value={fat}
          onChange={(e) => setFat(e.target.value)}
          disabled={isLoading}
          suffix="%"
          placeholder="0.0"
        />
        <InputField
          label="SNF %"
          value={snf}
          onChange={(e) => setSnf(e.target.value)}
          disabled={isLoading}
          suffix="%"
          placeholder="0.0"
        />
      </div>

      {/* Rate & Amount Block */}
      <div
        className="bg-[#F7F4EF] rounded-[14px] p-3.5 mb-4"
        style={{ border: "1px solid #E8E0D0" }}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.1em] text-[#0D1B2A]">
            <Calculator size={12} color="#C8891C" /> Rate
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            <AnimatePresence>
              {pinnedRates.map((r) => (
                <motion.button
                  key={r}
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  onClick={() => setRate(r.toString())}
                  disabled={isLoading}
                  className="flex items-center gap-1 px-2 py-1 rounded-[7px] cursor-pointer bg-white border border-[#E8E0D0] text-[10px] font-black text-[#0D1B2A] font-mono hover:border-[#F5D99E] hover:bg-[#FDF3E0] transition-all shrink-0"
                >
                  <Zap size={8} color="#C8891C" />₹{r}
                </motion.button>
              ))}
            </AnimatePresence>
            <button
              onClick={pinRate}
              disabled={
                !rate || pinnedRates.includes(parseFloat(rate)) || isLoading
              }
              title="Pin rate"
              className="w-6 h-6 rounded-[7px] border border-[#E8E0D0] bg-white cursor-pointer flex items-center justify-center hover:bg-[#FDF3E0] hover:border-[#F5D99E] transition-all disabled:opacity-30"
            >
              <Plus size={11} color="#C8891C" />
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          <InputField
            label="Rate (₹/L)"
            value={rate}
            onChange={(e) => setRate(e.target.value)}
            disabled={isLoading}
            step="0.5"
            prefix="₹"
            placeholder="0.00"
          />
          <div className="flex flex-col gap-1">
            <div className="text-[9px] font-black uppercase tracking-[0.12em] text-[#8A9BB0]">
              Amount
            </div>
            <div
              className="rounded-xl px-3 py-2.5 flex items-center h-[42px]"
              style={{
                background: "linear-gradient(135deg, #0D1B2A, #1B3350)",
              }}
            >
              <motion.span
                key={amount}
                initial={{ opacity: 0.6, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                className="font-mono font-black text-[17px] leading-none"
                style={{ color: "#E3A32E" }}
              >
                ₹{amount.toFixed(2)}
              </motion.span>
            </div>
          </div>
        </div>
      </div>

      {/* Save Button */}
      <motion.button
        onClick={handleSave}
        disabled={!isValid || isLoading}
        whileTap={{ scale: isValid && !isLoading ? 0.97 : 1 }}
        className="mt-auto w-full py-3.5 rounded-[13px] border-none flex items-center justify-center gap-2 font-black text-[13px] tracking-wide transition-all duration-200"
        style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          background: !isValid ? "#F5F0E8" : saved ? "#166B4D" : "#0D1B2A",
          color: !isValid ? "#B0C4D8" : "#FAFAF5",
          cursor: isValid && !isLoading ? "pointer" : "not-allowed",
          boxShadow:
            isValid && !saved && !isLoading
              ? "0 6px 20px rgba(9,22,41,0.25)"
              : "none",
        }}
      >
        <AnimatePresence mode="wait">
          {isLoading ? (
            <motion.div
              key="loading"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Loader2 size={14} className="animate-spin" /> Saving...
            </motion.div>
          ) : saved ? (
            <motion.div
              key="saved"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <CheckCircle size={14} /> Saved!
            </motion.div>
          ) : (
            <motion.div
              key="idle"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="flex items-center gap-2"
            >
              <Save size={14} /> Save Entry
            </motion.div>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
};

export default CollectionEntry;
