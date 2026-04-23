import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Droplets,
  LayoutDashboard,
  BarChart3,
  ChevronRight,
  Users,
  LogOut,
  Loader2,
  Wifi,
  WifiOff,
} from "lucide-react";
import OperatorDashboard from "./pages/OperatorDashboard";
import ManagementPage from "./pages/ManagementPage";
import Login from "./pages/Login"; // 1. Re-imported the Login component
import { useAppContext } from "./context/AppContext";

const PAGES = [
  {
    id: 0,
    label: "Operations",
    sublabel: "Daily Collections",
    icon: LayoutDashboard,
  },
  {
    id: 1,
    label: "Management",
    sublabel: "Clients & Analytics",
    icon: BarChart3,
  },
];

const pageVariants = {
  initial: (dir) => ({
    opacity: 0,
    x: dir > 0 ? 48 : -48,
    filter: "blur(2px)",
  }),
  animate: { opacity: 1, x: 0, filter: "blur(0px)" },
  exit: (dir) => ({ opacity: 0, x: dir > 0 ? -48 : 48, filter: "blur(2px)" }),
};

const App = () => {
  // 2. Changed isValidatingToken to 'loading' to match your AppContext
  const { userToken, logout, axios, toast, loading } = useAppContext();

  const [activePage, setActivePage] = useState(0);
  const [direction, setDirection] = useState(1);
  const [clients, setClients] = useState([]);
  const [entries, setEntries] = useState([]);
  const [isFetching, setIsFetching] = useState(false);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [lastSync, setLastSync] = useState(null);

  // Online/offline detection
  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  // Central data fetch
  const fetchDashboardData = useCallback(async () => {
    if (!userToken) return;
    setIsFetching(true);
    try {
      // 3. Added auth headers so the server doesn't reject the request
      const authConfig = {
        headers: { Authorization: `Bearer ${userToken}` },
      };

      const [clientsRes, entriesRes] = await Promise.all([
        axios.get("/api/owner/clients", authConfig),
        axios.get("/api/owner/entries", authConfig),
      ]);

      if (clientsRes.data.success) {
        setClients(
          clientsRes.data.data.map((c) => ({ ...c, id: c._id || c.id })),
        );
      }
      if (entriesRes.data.success) {
        setEntries(
          entriesRes.data.data.map((e) => ({
            ...e,
            id: e._id || e.id,
            clientId: e.clientId || e.farmerId,
          })),
        );
      }
      setLastSync(new Date());
    } catch (err) {
      if (isOnline && err.response?.status !== 401) {
        toast.error("Failed to sync data.");
      }
    } finally {
      setIsFetching(false);
    }
  }, [userToken, axios, toast, isOnline]);

  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  // Background auto-sync every 5 minutes
  useEffect(() => {
    if (!userToken) return;
    const id = setInterval(fetchDashboardData, 5 * 60 * 1000);
    return () => clearInterval(id);
  }, [userToken, fetchDashboardData]);

  const handleNavigate = (pageId) => {
    if (pageId === activePage) return;
    setDirection(pageId > activePage ? 1 : -1);
    setActivePage(pageId);
  };

  // Derived stats for header
  const todayStr = new Date().toISOString().split("T")[0];
  const todayEntries = entries.filter((e) => e.date === todayStr);
  const todayLitres = todayEntries.reduce((s, e) => s + (e.ltrs || 0), 0);
  const todayDateLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "short",
    day: "2-digit",
    month: "long",
  });

  // 4. Use the 'loading' state from context here
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F4EF]">
        <div className="flex flex-col items-center gap-3">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
          >
            <Droplets size={36} color="#C8891C" />
          </motion.div>
          <div className="text-[13px] font-bold uppercase tracking-widest text-[#0D1B2A]">
            Verifying Session...
          </div>
        </div>
      </div>
    );
  }

  // 5. Render the Login component directly instead of returning null
  if (!userToken) return <Login />;

  return (
    <div
      className="min-h-screen flex flex-col bg-[#F7F4EF]"
      style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      {/* ══ STICKY HEADER ══ */}
      <header className="sticky top-0 z-50 bg-[#0D1B2A] border-b border-white/5 shadow-[0_4px_24px_rgba(0,0,0,0.3)]">
        <div className="px-3 sm:px-5 h-14 sm:h-16 flex items-center gap-2 sm:gap-4">
          {/* Brand */}
          <div className="flex items-center gap-2.5 shrink-0">
            <motion.div
              whileHover={{ scale: 1.05 }}
              className="w-8 h-8 rounded-[10px] overflow-hidden shrink-0"
            >
              <img
                src="/logo.jpeg"
                alt="Tejas Dairy"
                className="w-full h-full object-cover"
              />
            </motion.div>
            <div className="hidden sm:block">
              <div
                className="font-black text-base text-white leading-tight tracking-[-0.02em]"
                style={{ fontFamily: "'DM Serif Display', Georgia, serif" }}
              >
                Tejas Dairy
              </div>
              <div className="text-[8px] text-white/35 font-bold tracking-[0.14em] uppercase">
                Management Suite
              </div>
            </div>
          </div>

          {/* Page Tabs */}
          <nav className="flex gap-1 bg-white/[0.07] rounded-xl p-1 border border-white/[0.06]">
            {PAGES.map((page) => (
              <button
                key={page.id}
                onClick={() => handleNavigate(page.id)}
                className="relative flex items-center gap-1.5 px-3 sm:px-4 py-1.5 sm:py-2 rounded-[9px] border-none cursor-pointer text-xs sm:text-[13px] font-bold transition-all duration-200"
                style={{
                  color:
                    activePage === page.id
                      ? "#0D1B2A"
                      : "rgba(250,250,245,0.5)",
                  background:
                    activePage === page.id ? "#FAFAF5" : "transparent",
                  fontFamily: "'Sora', system-ui, sans-serif",
                }}
              >
                <page.icon size={13} />
                <span className="hidden sm:inline">{page.label}</span>
              </button>
            ))}
          </nav>

          {/* Right controls */}
          <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
            {/* Online indicator */}
            <div
              className={`hidden sm:flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-bold ${isOnline ? "text-emerald-400" : "text-red-400"}`}
            >
              {isOnline ? <Wifi size={11} /> : <WifiOff size={11} />}
              <span className="hidden md:inline">
                {isOnline ? "Live" : "Offline"}
              </span>
            </div>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/[0.08]">
              <Droplets size={11} color="#E3A32E" />
              <span className="text-[11px] text-white/75 font-mono font-semibold">
                {todayLitres.toFixed(1)}L
              </span>
            </div>

            <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl bg-white/[0.07] border border-white/[0.08]">
              <Users size={11} color="#43A67F" />
              <span className="text-[11px] text-white/75 font-semibold">
                {clients.length}
              </span>
            </div>

            <div className="hidden md:flex text-[10px] text-white/30 px-2 border-r border-white/10">
              {todayDateLabel}
            </div>

            <motion.button
              onClick={fetchDashboardData}
              disabled={isFetching}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-white/[0.07] text-white/50 hover:text-white hover:bg-white/[0.12] border border-white/[0.08] transition-all disabled:opacity-50"
              title="Sync data"
            >
              <Loader2 size={14} className={isFetching ? "animate-spin" : ""} />
            </motion.button>

            <motion.button
              onClick={logout}
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white border border-red-500/20 hover:border-red-500 transition-all"
              title="Secure Logout"
            >
              <LogOut size={15} />
            </motion.button>
          </div>
        </div>

        {/* Progress bar */}
        <div className="h-[2px] bg-white/[0.05]">
          <motion.div
            className="h-full rounded-full"
            style={{
              background: "linear-gradient(90deg, #C8891C, #E3A32E)",
              originX: 0,
            }}
            animate={{ width: `${((activePage + 1) / PAGES.length) * 100}%` }}
            transition={{ type: "spring", stiffness: 300, damping: 35 }}
          />
        </div>
      </header>

      {/* ══ CONTENT ══ */}
      <main className="flex-1 relative overflow-hidden">
        <AnimatePresence>
          {isFetching && entries.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-40 flex flex-col items-center justify-center"
              style={{
                background: "rgba(247,244,239,0.92)",
                backdropFilter: "blur(8px)",
              }}
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }}
              >
                <Droplets size={36} color="#C8891C" />
              </motion.div>
              <div className="mt-4 text-[13px] font-bold uppercase tracking-[0.15em] text-[#0D1B2A]">
                Syncing Data
              </div>
              <div className="mt-1 text-[10px] text-[#8A9BB0] font-medium">
                Connecting to Tejas Dairy servers...
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence mode="wait" custom={direction}>
          {activePage === 0 ? (
            <motion.div
              key="ops"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              <OperatorDashboard
                clients={clients}
                entries={entries}
                setEntries={setEntries}
              />
            </motion.div>
          ) : (
            <motion.div
              key="mgmt"
              custom={direction}
              variants={pageVariants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.22, ease: [0.4, 0, 0.2, 1] }}
              className="h-full"
            >
              <ManagementPage
                clients={clients}
                setClients={setClients}
                entries={entries}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default App;
