import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  Mail,
  Lock,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

const LoginField = ({
  id,
  icon: Icon,
  type,
  placeholder,
  value,
  onChange,
  label,
  disabled,
  autoComplete,
  inputRef,
}) => {
  const [focused, setFocused] = useState(false);
  return (
    <div className="flex flex-col gap-1.5 mb-5">
      <label
        htmlFor={id}
        className="text-[10px] font-black uppercase tracking-[0.12em] text-[#8A9BB0] cursor-pointer"
      >
        {label}
      </label>
      <motion.div
        animate={{
          borderColor: focused ? "#C8891C" : "#E8E0D0",
          boxShadow: focused ? "0 0 0 3px rgba(200,137,28,0.12)" : "none",
          backgroundColor: focused ? "#fff" : "#FAFAF5",
        }}
        className="flex items-center gap-2.5 rounded-xl px-3.5 py-3 border transition-colors"
        style={{ opacity: disabled ? 0.65 : 1 }}
      >
        <Icon
          size={16}
          color={focused ? "#C8891C" : "#B0C4D8"}
          className="shrink-0 transition-colors"
        />
        <input
          ref={inputRef}
          id={id}
          type={type}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          className="flex-1 bg-transparent border-none outline-none text-[14px] font-semibold text-[#0D1B2A] placeholder-[#C8B99A] w-full"
          style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
          required
        />
      </motion.div>
    </div>
  );
};

const Login = () => {
  const { axios, setUserToken, toast, navigate } = useAppContext();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const emailRef = useRef(null);

  useEffect(() => {
    setTimeout(() => emailRef.current?.focus(), 100);
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setIsLoading(true);

    try {
      const res = await axios.post("/api/owner/login", {
        email: email.trim(),
        password: password.trim(),
      });

      if (res.data.success) {
        setUserToken(res.data.token);
        localStorage.setItem("userToken", res.data.token);
        toast.success(res.data.message || "Welcome back!");
        navigate("/");
      } else {
        setError(
          res.data.message || "Login failed. Please verify your details.",
        );
      }
    } catch (err) {
      console.error("Login request failed:", err);

      if (err.response) {
        setError(
          err.response.data?.message ||
            "Invalid credentials. Please try again.",
        );
      } else if (err.request) {
        setError(
          "Network error: Could not connect to the server. Please check your internet connection.",
        );
      } else {
        setError("An unexpected error occurred. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen w-full flex items-center justify-center p-4 relative overflow-hidden"
      style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        background: "#F7F4EF",
      }}
    >
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #DDD0BC 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          opacity: 0.3,
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-md bg-white rounded-3xl relative z-10 overflow-hidden flex flex-col border border-[#E8E0D0] shadow-[0_24px_48px_rgba(9,22,41,0.1)]"
      >
        <div
          className="h-1.5 w-full"
          style={{ background: "linear-gradient(90deg, #C8891C, #E3A32E)" }}
        />

        <div className="p-8 sm:p-10">
          {/* Brand */}
          <div className="flex flex-col items-center mb-9 text-center">
            <motion.div
              initial={{ scale: 0.7, rotate: -10 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: "spring",
                stiffness: 260,
                damping: 20,
                delay: 0.1,
              }}
              className="relative w-16 h-16 rounded-[18px] flex items-center justify-center mb-5 shadow-[0_10px_28px_rgba(9,22,41,0.25)]"
              style={{
                background: "linear-gradient(135deg, #0D1B2A, #1B3350)",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[2px] rounded-t-[18px]"
                style={{
                  background: "linear-gradient(90deg, #C8891C, #E3A32E)",
                }}
              />
              <Droplets size={30} color="#E3A32E" strokeWidth={2} />
            </motion.div>
            <h1
              className="text-3xl sm:text-4xl text-[#0D1B2A] leading-none tracking-[-0.02em] mb-2"
              style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
            >
              Tejas Dairy
            </h1>
            <p className="text-[11px] font-black uppercase tracking-[0.16em] text-[#C8891C]">
              Secure Operator Portal
            </p>
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                animate={{ opacity: 1, height: "auto", marginBottom: 20 }}
                exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                className="rounded-xl p-3 flex items-center gap-2.5 overflow-hidden bg-[#FEF2F2] border border-[#FECACA]"
              >
                <AlertCircle size={16} color="#991B1B" className="shrink-0" />
                <p className="text-[11px] font-semibold text-red-800 leading-tight">
                  {error}
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="flex flex-col" noValidate>
            <LoginField
              id="email"
              icon={Mail}
              type="email"
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="operator@tejasdairy.com"
              disabled={isLoading}
              autoComplete="email"
              inputRef={emailRef}
            />
            <LoginField
              id="password"
              icon={Lock}
              type="password"
              label="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              disabled={isLoading}
              autoComplete="current-password"
            />

            <motion.button
              whileTap={{ scale: isLoading ? 1 : 0.98 }}
              disabled={isLoading || !email || !password}
              type="submit"
              className="w-full mt-2 rounded-xl py-3.5 flex items-center justify-center gap-2 transition-all relative overflow-hidden disabled:opacity-70 disabled:cursor-not-allowed"
              style={{
                background: "linear-gradient(135deg, #0D1B2A, #1B3350)",
                color: "#FAFAF5",
                boxShadow: "0 8px 24px rgba(9,22,41,0.28)",
                fontFamily: "'Sora', system-ui, sans-serif",
              }}
            >
              <div
                className="absolute top-0 left-0 right-0 h-[1px] opacity-25"
                style={{
                  background: "linear-gradient(90deg, #C8891C, #E3A32E)",
                }}
              />
              {isLoading ? (
                <>
                  <ShieldCheck
                    size={16}
                    className="animate-pulse"
                    color="#E3A32E"
                  />
                  <span className="text-xs font-black uppercase tracking-[0.1em]">
                    Authenticating...
                  </span>
                </>
              ) : (
                <>
                  <span className="text-xs font-black uppercase tracking-[0.1em]">
                    Access Dashboard
                  </span>
                  <ArrowRight size={16} color="#E3A32E" />
                </>
              )}
            </motion.button>
          </form>

          <div className="mt-7 text-center">
            <p className="text-[10px] text-[#B0C4D8] font-medium">
              Authorized personnel only · All access is logged
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
