import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Users, UserPlus, FileText } from "lucide-react";
import ClientRegistration from "../components/ClientRegistration";
import ClientDirectory from "../components/ClientDirectory";
import Dashboard from "../components/Dashboard";
import Report from "../components/Report";

const TABS = [
  { id: "dashboard", label: "Dashboard", icon: BarChart3 },
  { id: "report", label: "Report", icon: FileText },
  { id: "clients", label: "Directory", icon: Users },
  { id: "register", label: "Add Client", icon: UserPlus },
];

const ManagementPage = ({ clients, setClients, entries }) => {
  const [activeTab, setActiveTab] = useState("dashboard");

  const handleAddClient = (newClient) => {
    setClients((prev) => {
      const exists = prev.some((c) => c.id === newClient.id);
      return exists
        ? prev
        : [{ ...newClient, id: newClient._id || newClient.id }, ...prev];
    });
  };

  return (
    <div
      className="relative min-h-[calc(100vh-56px)] flex flex-col"
      style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        background: "#F7F4EF",
      }}
    >
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #CBD5E1 1px, transparent 1px)",
          backgroundSize: "20px 20px",
          opacity: 0.3,
        }}
      />

      <div className="relative z-10 flex flex-col h-full p-3 sm:p-4 lg:p-5 gap-3 sm:gap-4">
        {/* Page Header */}
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-wrap items-center justify-between gap-3 shrink-0"
        >
          <div className="flex items-center gap-3">
            <div
              className="w-1 h-7 rounded-full"
              style={{
                background: "linear-gradient(to bottom, #C8891C, #0D1B2A)",
              }}
            />
            <div>
              <h1 className="text-xl font-black text-[#0D1B2A] tracking-tight leading-none">
                Management Centre
              </h1>
              <p className="text-[10px] font-black text-[#8A9BB0] uppercase tracking-widest mt-0.5">
                Dairy Operations & Analytics
              </p>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            {[
              {
                icon: Users,
                label: `${clients.length} Clients`,
                color: "#0D1B2A",
              },
              {
                icon: BarChart3,
                label: `${entries.length} Entries`,
                color: "#C8891C",
              },
            ].map((pill) => (
              <div
                key={pill.label}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-[#E8E0D0] shadow-sm"
              >
                <pill.icon size={12} color={pill.color} />
                <span className="text-[11px] font-bold text-[#0D1B2A]">
                  {pill.label}
                </span>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Tab Bar */}
        <div className="flex bg-white border border-[#E8E0D0] rounded-2xl p-1 gap-1 shadow-sm shrink-0">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[11px] sm:text-[12px] font-black transition-all duration-200 border-none cursor-pointer"
              style={{
                fontFamily: "'Sora', system-ui, sans-serif",
                background: activeTab === tab.id ? "#0D1B2A" : "transparent",
                color: activeTab === tab.id ? "#FAFAF5" : "#8A9BB0",
                boxShadow:
                  activeTab === tab.id
                    ? "0 4px 12px rgba(9,22,41,0.2)"
                    : "none",
              }}
            >
              <tab.icon size={13} />
              <span className="hidden xs:inline sm:inline">{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <AnimatePresence mode="wait">
            {activeTab === "dashboard" && (
              <motion.div
                key="dashboard"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto pb-4"
              >
                <Dashboard clients={clients} entries={entries} />
              </motion.div>
            )}
            {activeTab === "report" && (
              <motion.div
                key="report"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full overflow-y-auto pb-4"
              >
                <Report clients={clients} entries={entries} />
              </motion.div>
            )}
            {activeTab === "clients" && (
              <motion.div
                key="clients"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full"
                style={{ minHeight: "60vh" }}
              >
                <ClientDirectory
                  clients={clients}
                  setClients={setClients}
                  entries={entries}
                />
              </motion.div>
            )}
            {activeTab === "register" && (
              <motion.div
                key="register"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="h-full flex justify-center overflow-y-auto pb-4"
              >
                <div className="w-full max-w-2xl">
                  <ClientRegistration
                    clients={clients}
                    onAddClient={handleAddClient}
                  />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default ManagementPage;
