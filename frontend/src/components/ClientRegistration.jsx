import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  UserPlus,
  Phone,
  Building2,
  MapPin,
  Hash,
  CheckCircle2,
  MessageCircle,
  Loader2,
  X,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const Field = ({
  icon: Icon,
  label,
  name,
  value,
  onChange,
  placeholder,
  type = "text",
  error,
  disabled,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1">
      <label className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8A9BB0]">
        {label}
      </label>
      <motion.div
        animate={{
          borderColor: error ? "#FECACA" : focused ? "#C8891C" : "#E8E0D0",
          boxShadow:
            focused && !error ? "0 0 0 3px rgba(200,137,28,0.1)" : "none",
          backgroundColor: focused ? "#fff" : "#FAFAF5",
        }}
        className="flex items-center gap-2.5 border rounded-[12px] px-3.5 py-[9px]"
        style={{ opacity: disabled ? 0.65 : 1 }}
      >
        <Icon
          size={13}
          color={error ? "#F87171" : focused ? "#C8891C" : "#B0C4D8"}
          className="shrink-0"
        />
        <input
          type={type}
          name={name}
          value={value}
          onChange={onChange}
          disabled={disabled}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          className="flex-1 border-none outline-none bg-transparent text-[13px] font-semibold text-[#0D1B2A] placeholder:text-[#C8B99A]"
          style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
        />
      </motion.div>
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="text-[10px] text-red-500 font-semibold overflow-hidden"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>
    </div>
  );
};

const EMPTY = {
  name: "",
  phone: "",
  whatsapp: "",
  address: "",
  bankAccount: "",
  ifsc: "",
};

const ClientRegistration = ({ clients, onAddClient }) => {
  const { axios, toast } = useAppContext();
  const [form, setForm] = useState(EMPTY);
  const [samePhone, setSamePhone] = useState(false);
  const [success, setSuccess] = useState(null);
  const [errors, setErrors] = useState({});
  const [isLoading, setIsLoading] = useState(false);

  const onChange = useCallback(
    (e) => {
      const { name, value } = e.target;
      setForm((f) => {
        const u = { ...f, [name]: value };
        if (name === "phone" && samePhone) u.whatsapp = value;
        return u;
      });
      setErrors((er) => ({ ...er, [name]: "" }));
    },
    [samePhone],
  );

  const toggleSame = () => {
    setSamePhone((v) => {
      if (!v) setForm((f) => ({ ...f, whatsapp: f.phone }));
      return !v;
    });
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = "Full name is required.";
    if (!/^\d{10}$/.test(form.phone))
      e.phone = "Enter a valid 10-digit number.";
    if (form.whatsapp && !/^\d{10}$/.test(form.whatsapp))
      e.whatsapp = "Enter a valid 10-digit WhatsApp number.";
    if (!form.address.trim()) e.address = "Village/address is required.";
    if (form.ifsc && !/^[A-Z]{4}0[A-Z0-9]{6}$/.test(form.ifsc.toUpperCase()))
      e.ifsc = "Invalid IFSC (e.g. SBIN0012345).";
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const ve = validate();
    if (Object.keys(ve).length > 0) {
      setErrors(ve);
      return;
    }
    setIsLoading(true);
    setSuccess(null);
    try {
      const payload = { ...form, ifsc: form.ifsc.toUpperCase() };
      const res = await axios.post("/api/owner/add-clients", payload);
      if (res.data.success) {
        const newClient = {
          ...res.data.data,
          id: res.data.data._id || res.data.data.id,
        };
        onAddClient(newClient);
        setSuccess(newClient.name);
        toast.success(`${newClient.name} registered!`);
        setSamePhone(false);
        setForm(EMPTY);
        setTimeout(() => setSuccess(null), 4000);
      }
    } catch (err) {
      const msg = err.response?.data?.message || "Registration failed.";
      toast.error(msg);
      if (err.response?.data?.errors) setErrors(err.response.data.errors);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-3xl border border-[#E8E0D0] shadow-[0_4px_20px_rgba(9,22,41,0.07)] p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div
          className="w-9 h-9 rounded-[11px] flex items-center justify-center"
          style={{
            background: "#0D1B2A",
            boxShadow: "0 4px 12px rgba(9,22,41,0.2)",
          }}
        >
          <UserPlus size={16} color="#FAFAF5" />
        </div>
        <div>
          <div className="text-[13px] font-black uppercase tracking-[0.07em] text-[#0D1B2A]">
            Register New Client
          </div>
          <div className="text-[10px] text-[#8A9BB0] mt-0.5">
            {clients.length} clients currently active
          </div>
        </div>
      </div>

      {/* Success Banner */}
      <AnimatePresence>
        {success && (
          <motion.div
            initial={{ opacity: 0, height: 0, marginBottom: 0 }}
            animate={{ opacity: 1, height: "auto", marginBottom: 16 }}
            exit={{ opacity: 0, height: 0, marginBottom: 0 }}
            className="overflow-hidden"
          >
            <div className="flex items-center justify-between gap-2 bg-[#F0F7F3] border border-[#B5DDCA] rounded-[11px] px-3.5 py-2.5">
              <div className="flex items-center gap-2">
                <CheckCircle2 size={14} color="#166B4D" />
                <span className="text-[12px] font-black text-[#166B4D]">
                  {success} registered!
                </span>
              </div>
              <button onClick={() => setSuccess(null)}>
                <X size={12} color="#166B4D" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Form */}
      <div className="flex flex-col gap-4">
        <Field
          icon={UserPlus}
          label="Full Name *"
          name="name"
          value={form.name}
          onChange={onChange}
          placeholder="e.g. Rajappa Naik"
          error={errors.name}
          disabled={isLoading}
        />

        <div className="grid grid-cols-2 gap-3">
          <Field
            icon={Phone}
            label="Phone *"
            name="phone"
            value={form.phone}
            onChange={onChange}
            placeholder="10-digit"
            type="tel"
            error={errors.phone}
            disabled={isLoading}
          />
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="text-[9px] font-black uppercase tracking-[0.13em] text-[#8A9BB0]">
                WhatsApp
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={samePhone}
                  onChange={toggleSame}
                  disabled={isLoading}
                  className="w-3 h-3 cursor-pointer accent-[#C8891C]"
                />
                <span className="text-[9px] font-black text-[#8A9BB0] uppercase tracking-wide">
                  Same
                </span>
              </label>
            </div>
            <motion.div
              animate={{
                borderColor: errors.whatsapp ? "#FECACA" : "#E8E0D0",
                opacity: samePhone || isLoading ? 0.6 : 1,
              }}
              className="flex items-center gap-2.5 border rounded-[12px] px-3.5 py-[9px]"
              style={{ background: samePhone ? "#F5F0E8" : "#FAFAF5" }}
            >
              <MessageCircle
                size={13}
                color={errors.whatsapp ? "#F87171" : "#B0C4D8"}
              />
              <input
                type="tel"
                name="whatsapp"
                value={form.whatsapp}
                onChange={onChange}
                disabled={samePhone || isLoading}
                placeholder="WhatsApp number"
                className="flex-1 border-none outline-none bg-transparent text-[13px] font-semibold text-[#0D1B2A] placeholder:text-[#C8B99A]"
                style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
              />
            </motion.div>
            {errors.whatsapp && (
              <p className="text-[10px] text-red-500 font-semibold">
                {errors.whatsapp}
              </p>
            )}
          </div>
        </div>

        <Field
          icon={MapPin}
          label="Address / Village *"
          name="address"
          value={form.address}
          onChange={onChange}
          placeholder="Village, Taluk, District"
          error={errors.address}
          disabled={isLoading}
        />

        <div className="pt-3 border-t border-[#F5F0E8]">
          <div className="flex items-center gap-1.5 text-[9px] font-black uppercase tracking-[0.12em] text-[#C8B99A] mb-3">
            <Building2 size={10} /> Bank Details{" "}
            <span className="font-normal opacity-60">(Optional)</span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <Field
              icon={Hash}
              label="Account No."
              name="bankAccount"
              value={form.bankAccount}
              onChange={onChange}
              placeholder="A/C Number"
              disabled={isLoading}
            />
            <Field
              icon={Building2}
              label="IFSC Code"
              name="ifsc"
              value={form.ifsc}
              onChange={onChange}
              placeholder="e.g. SBIN0012345"
              error={errors.ifsc}
              disabled={isLoading}
            />
          </div>
        </div>
      </div>

      {/* Submit */}
      <motion.button
        onClick={handleSubmit}
        disabled={isLoading}
        whileTap={{ scale: isLoading ? 1 : 0.98 }}
        className="mt-5 w-full py-3.5 rounded-[13px] border-none cursor-pointer flex items-center justify-center gap-2 text-[13px] font-black tracking-wide text-white transition-all duration-200 disabled:opacity-70 disabled:cursor-not-allowed"
        style={{
          fontFamily: "'Sora', system-ui, sans-serif",
          background: "linear-gradient(135deg, #0D1B2A, #1B3350)",
          boxShadow: isLoading ? "none" : "0 6px 20px rgba(9,22,41,0.25)",
        }}
      >
        {isLoading ? (
          <>
            <Loader2 size={14} className="animate-spin" /> Registering...
          </>
        ) : (
          <>
            <UserPlus size={14} /> Register Client
          </>
        )}
      </motion.button>
    </div>
  );
};

export default ClientRegistration;
