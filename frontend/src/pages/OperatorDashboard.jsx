import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import IdentitySearch from "../components/IdentitySearch";
import CollectionEntry from "../components/CollectionEntry";
import PaymentBilling from "../components/PaymentBilling";
import StatementOverview from "../components/StatementOverview";

const OperatorDashboard = ({ clients, entries, setEntries }) => {
  const [selectedClient, setSelectedClient] = useState(null);

  const handleSaveEntry = (entry) => {
    setEntries((prev) => {
      const exists = prev.some((e) => e.id === entry.id);
      return exists ? prev : [entry, ...prev];
    });
  };

  return (
    <div
      className="relative min-h-[calc(100vh-56px)] p-3 sm:p-4 lg:p-5"
      style={{
        fontFamily: "'Sora', system-ui, sans-serif",
        background: "#F7F4EF",
      }}
    >
      {/* Dot grid texture */}
      <div
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          backgroundImage:
            "radial-gradient(circle, #DDD0BC 1px, transparent 1px)",
          backgroundSize: "22px 22px",
          opacity: 0.35,
        }}
      />

      <div className="relative z-10">
        <AnimatePresence mode="wait">
          {!selectedClient ? (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(3px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center justify-center min-h-[calc(100vh-100px)] max-w-sm mx-auto"
            >
              <IdentitySearch
                clients={clients}
                selectedClient={selectedClient}
                setSelectedClient={setSelectedClient}
                entries={entries}
              />
            </motion.div>
          ) : (
            <motion.div
              key="dashboard"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.26, ease: "easeOut" }}
              className="flex flex-col gap-3 sm:gap-4"
            >
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4">
                {/* LEFT: Search + Collection Entry */}
                <div className="w-full lg:w-[340px] xl:w-[360px] flex flex-col gap-3 sm:gap-4 shrink-0">
                  <IdentitySearch
                    clients={clients}
                    selectedClient={selectedClient}
                    setSelectedClient={setSelectedClient}
                    entries={entries}
                  />
                  <div className="flex-1" style={{ minHeight: 380 }}>
                    <CollectionEntry
                      selectedClient={selectedClient}
                      onSave={handleSaveEntry}
                    />
                  </div>
                </div>
                {/* RIGHT: Billing + Statement */}
                <div className="flex-1 flex flex-col gap-3 sm:gap-4 min-w-0">
                  <div className="flex-1" style={{ minHeight: 0 }}>
                    <PaymentBilling
                      selectedClient={selectedClient}
                      entries={entries}
                      setEntries={setEntries}
                    />
                  </div>
                  <div style={{ height: 170, minHeight: 150, flexShrink: 0 }}>
                    <StatementOverview
                      selectedClient={selectedClient}
                      entries={entries}
                    />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default OperatorDashboard;
