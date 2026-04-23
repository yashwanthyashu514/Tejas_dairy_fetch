import React, { useState, useMemo, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  CreditCard,
  CheckCircle2,
  Eye,
  Download,
  X,
  Loader2,
  MessageCircle,
  Droplets,
  Calendar,
} from "lucide-react";
import { useAppContext } from "../context/AppContext";

/* ─────────────────────────────────────────────
   COMPANY CONSTANTS
───────────────────────────────────────────── */
const COMPANY = {
  name: "TEJAS DAIRY",
  address:
    "Building No. 386/2, Makanur Main Road, Near Sri Nandi Medicals,\nMakanur, District Haveri, Karnataka – 581123",
  gstin: "29GFIPB3620A1ZY",
  phone: "+91-XXXXX-XXXXX",
  email: "tejasdairy@email.com",
};

/* ─────────────────────────────────────────────
   HELPER: FETCH LOGO FROM PUBLIC FOLDER
───────────────────────────────────────────── */
const getLogoBase64 = async () => {
  try {
    const res = await fetch("/logo.jpeg");
    const blob = await res.blob();
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result);
      reader.readAsDataURL(blob);
    });
  } catch (err) {
    console.warn("Could not load watermark logo:", err);
    return null;
  }
};

/* ─────────────────────────────────────────────
   DAIRY BILLING CYCLE  (1-10, 11-20, 21-EOM)
───────────────────────────────────────────── */
const getDairyCycle = () => {
  const d = new Date();
  const date = d.getDate();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  let from, to;
  if (date <= 10) {
    from = `${year}-${month}-01`;
    to = `${year}-${month}-10`;
  } else if (date <= 20) {
    from = `${year}-${month}-11`;
    to = `${year}-${month}-20`;
  } else {
    from = `${year}-${month}-21`;
    const lastDay = new Date(year, d.getMonth() + 1, 0).getDate();
    to = `${year}-${month}-${String(lastDay).padStart(2, "0")}`;
  }
  return { from, to };
};

const formatDate = (str) => {
  if (!str) return "N/A";
  const [y, m, d] = str.split("-");
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JUL",
    "AUG",
    "SEP",
    "OCT",
    "NOV",
    "DEC",
  ];
  return `${d} ${months[parseInt(m, 10) - 1]} ${y}`;
};

const generateInvoiceNo = (clientId, from) => {
  const d = new Date(from);
  return `TDY/${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, "0")}/${String(
    clientId || "000",
  )
    .slice(-4)
    .toUpperCase()}`;
};

/* ─────────────────────────────────────────────
   PDF BUILDER  –  Structured Code Style
───────────────────────────────────────────── */
const buildPDF = async (
  client,
  groupedData,
  ledgerEntries,
  totalVolume,
  totalAmount,
  from,
  to,
) => {
  const jsPDF = (await import("jspdf")).default;
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
  const PAGE_W = 210;
  const MARGIN = 14;
  const CONTENT_W = PAGE_W - MARGIN * 2;
  const today = new Date().toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
  const invoiceNo = generateInvoiceNo(client?.serialId || client?.id, from);

  const validEntries = ledgerEntries.filter((e) => e.ltrs > 0);
  const avgFat = validEntries.length
    ? validEntries.reduce((s, e) => s + e.fat, 0) / validEntries.length
    : 0;
  const avgSnf = validEntries.length
    ? validEntries.reduce((s, e) => s + e.snf, 0) / validEntries.length
    : 0;
  const allPaid =
    ledgerEntries.length > 0 && ledgerEntries.every((e) => e.paid);

  const rule = (y, weight = 0.2, color = [0, 0, 0]) => {
    doc.setDrawColor(...color);
    doc.setLineWidth(weight);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
  };

  // ── Page background
  doc.setFillColor(255, 255, 255);
  doc.rect(0, 0, PAGE_W, 297, "F");

  // ── WATERMARK (Logo)
  try {
    const logoData = await getLogoBase64();
    if (logoData) {
      // Find the GState class and set opacity to 8%
      const GState = doc.GState || jsPDF.GState || window.GState;
      if (GState) {
        doc.setGState(new GState({ opacity: 0.08 }));
      }

      const logoSize = 130;
      const centerX = (PAGE_W - logoSize) / 2;
      const centerY = (297 - logoSize) / 2 - 15;

      doc.addImage(logoData, "JPEG", centerX, centerY, logoSize, logoSize);

      // Reset opacity back to 1 for text and tables
      if (GState) {
        doc.setGState(new GState({ opacity: 1 }));
      }
    }
  } catch (e) {
    console.warn("Watermark could not be added:", e);
  }

  let y = 16;

  // ── Header Section (Monospace)
  doc.setFont("courier", "bold");
  doc.setFontSize(22);
  doc.setTextColor(0, 0, 0);
  doc.text(COMPANY.name, MARGIN, y);

  doc.setFontSize(10);
  doc.text("INVOICE NO: " + invoiceNo, PAGE_W - MARGIN, y, { align: "right" });

  y += 6;
  doc.setFont("courier", "normal");
  doc.setFontSize(9);
  const addrLines = doc.splitTextToSize(COMPANY.address, 120);
  doc.text(addrLines, MARGIN, y);

  doc.text(`DATE: ${today.toUpperCase()}`, PAGE_W - MARGIN, y, {
    align: "right",
  });

  y += addrLines.length * 4.5;
  doc.setFont("courier", "bold");
  doc.text(`GSTIN: ${COMPANY.gstin}`, MARGIN, y);

  y += 6;
  rule(y, 0.5); // Thick border
  rule(y + 1, 0.1); // Double border aesthetic
  y += 8;

  doc.setFontSize(14);
  doc.text("MILK COLLECTION STATEMENT", PAGE_W / 2, y, { align: "center" });

  y += 6;
  doc.setFontSize(10);
  doc.setFont("courier", "normal");
  doc.text(
    `PERIOD: ${formatDate(from).toUpperCase()} TO ${formatDate(to).toUpperCase()}`,
    PAGE_W / 2,
    y,
    { align: "center" },
  );

  y += 8;
  rule(y, 0.2);
  y += 6;

  // ── Client Info Grid
  doc.setFontSize(9);
  doc.setFont("courier", "bold");
  doc.text("CLIENT NAME :", MARGIN, y);
  doc.setFont("courier", "normal");
  doc.text(String(client?.name || "N/A").toUpperCase(), MARGIN + 35, y);

  doc.setFont("courier", "bold");
  doc.text("STATUS   :", PAGE_W / 2 + 10, y);
  doc.setFont("courier", "normal");
  doc.text(allPaid ? "PAID" : "PENDING", PAGE_W / 2 + 35, y);

  y += 6;
  doc.setFont("courier", "bold");
  doc.text("CLIENT ID   :", MARGIN, y);
  doc.setFont("courier", "normal");
  doc.text(String(client?.serialId || client?.id || "N/A"), MARGIN + 35, y);

  doc.setFont("courier", "bold");
  doc.text("PHONE NO :", PAGE_W / 2 + 10, y);
  doc.setFont("courier", "normal");
  doc.text(String(client?.phone || "N/A"), PAGE_W / 2 + 35, y);

  y += 6;
  doc.setFont("courier", "bold");
  doc.text("BANK A/C NO :", MARGIN, y);
  doc.setFont("courier", "normal");
  doc.text(String(client?.bankAccount || "N/A"), MARGIN + 35, y);

  doc.setFont("courier", "bold");
  doc.text("IFSC CODE:", PAGE_W / 2 + 10, y);
  doc.setFont("courier", "normal");
  doc.text(String(client?.ifsc || "N/A").toUpperCase(), PAGE_W / 2 + 35, y);

  y += 8;

  // ── Structured Grid Table
  const tableBody = [];
  groupedData.forEach((row) => {
    if (row.AM) {
      tableBody.push([
        { content: formatDate(row.date), rowSpan: row.PM ? 2 : 1 },
        "AM",
        row.AM.ltrs.toFixed(2),
        row.AM.fat.toFixed(2),
        row.AM.snf.toFixed(2),
        row.AM.rate.toFixed(2),
        row.AM.amount.toFixed(2),
      ]);
    }
    if (row.PM) {
      const pmRow = [
        "PM",
        row.PM.ltrs.toFixed(2),
        row.PM.fat.toFixed(2),
        row.PM.snf.toFixed(2),
        row.PM.rate.toFixed(2),
        row.PM.amount.toFixed(2),
      ];
      if (!row.AM) pmRow.unshift(formatDate(row.date));
      tableBody.push(pmRow);
    }
  });

  autoTable(doc, {
    startY: y,
    theme: "grid", // Full grid structured table
    head: [
      ["DATE", "SHIFT", "LITRES", "FAT %", "SNF %", "RATE(RS)", "AMT(RS)"],
    ],
    body: tableBody,
    styles: {
      font: "courier",
      fontSize: 9,
      halign: "center",
      valign: "middle",
      textColor: [0, 0, 0],
      lineColor: [0, 0, 0], // Solid black borders
      lineWidth: 0.2, // Thin crisp lines
    },
    headStyles: {
      fillColor: [230, 230, 230], // Light gray header
      textColor: [0, 0, 0],
      fontStyle: "bold",
    },
    columnStyles: {
      0: { halign: "left", fontStyle: "bold" },
      6: { halign: "right", fontStyle: "bold" }, // Amount column right aligned
    },
  });

  y = doc.lastAutoTable.finalY + 10;

  // ── Summary Box (Structured style)
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.4);
  doc.rect(MARGIN, y, CONTENT_W, 20);

  // Vertical dividers for the summary box
  const sectionW = CONTENT_W / 4;
  doc.setLineWidth(0.2);
  doc.line(MARGIN + sectionW, y, MARGIN + sectionW, y + 20);
  doc.line(MARGIN + sectionW * 2, y, MARGIN + sectionW * 2, y + 20);
  doc.line(MARGIN + sectionW * 3, y, MARGIN + sectionW * 3, y + 20);

  const drawStat = (label, val, index) => {
    const startX = MARGIN + sectionW * index;
    doc.setFont("courier", "bold");
    doc.setFontSize(8);
    doc.text(label, startX + sectionW / 2, y + 7, { align: "center" });
    doc.setFontSize(11);
    doc.text(val, startX + sectionW / 2, y + 15, { align: "center" });
  };

  drawStat("TOTAL LITRES", `${totalVolume.toFixed(2)} L`, 0);
  drawStat("AVG FAT %", `${avgFat.toFixed(2)} %`, 1);
  drawStat("AVG SNF %", `${avgSnf.toFixed(2)} %`, 2);
  drawStat("TOTAL ENTRIES", `${validEntries.length}`, 3);

  y += 28;

  // ── Net Payable Box
  doc.setFillColor(0, 0, 0);
  doc.rect(MARGIN, y, CONTENT_W, 14, "F");
  doc.setFont("courier", "bold");
  doc.setFontSize(10);
  doc.setTextColor(255, 255, 255);
  doc.text("NET PAYABLE AMOUNT :", MARGIN + 5, y + 9);
  doc.setFontSize(14);
  doc.text(`RS. ${totalAmount.toFixed(2)}`, PAGE_W - MARGIN - 5, y + 10, {
    align: "right",
  });

  y += 30;

  // ── Signatures
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.2);
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(9);

  doc.line(MARGIN, y, MARGIN + 50, y);
  doc.text("CLIENT SIGNATURE", MARGIN + 25, y + 5, { align: "center" });

  doc.line(PAGE_W - MARGIN - 50, y, PAGE_W - MARGIN, y);
  doc.text("AUTHORIZED SIGNATORY", PAGE_W - MARGIN - 25, y + 5, {
    align: "center",
  });

  // ── Footer
  doc.setFontSize(8);
  doc.setFont("courier", "normal");
  doc.text("SYSTEM GENERATED BILL - TEJAS DAIRY", PAGE_W / 2, 285, {
    align: "center",
  });

  return doc;
};

/* ─────────────────────────────────────────────
   WHATSAPP MESSAGE
───────────────────────────────────────────── */
const buildWhatsAppMsg = (
  client,
  from,
  to,
  totalVolume,
  totalAmount,
  avgFat,
  avgSnf,
  allPaid,
  invoiceNo,
) =>
  `*${COMPANY.name}*\n` +
  `Makanur, Haveri Dist, Karnataka\n` +
  `GSTIN: ${COMPANY.gstin}\n\n` +
  `*MILK COLLECTION STATEMENT*\n` +
  `Invoice No : ${invoiceNo}\n` +
  `Client     : ${(client?.name || "").toUpperCase()}\n` +
  `Client ID  : ${client?.serialId || "N/A"}\n` +
  `Period     : ${formatDate(from)} to ${formatDate(to)}\n\n` +
  `Total Litres : ${totalVolume.toFixed(2)} L\n` +
  `Average FAT  : ${avgFat.toFixed(2)} %\n` +
  `Average SNF  : ${avgSnf.toFixed(2)} %\n` +
  `*Net Amount  : Rs. ${totalAmount.toFixed(2)}*\n` +
  `Status       : ${allPaid ? "PAID" : "PENDING"}\n\n` +
  `Please find the detailed PDF bill attached.`;

/* ─────────────────────────────────────────────
   DESIGN TOKENS
───────────────────────────────────────────── */
const TH = [
  "px-3 py-2.5",
  "text-[9px] font-bold uppercase tracking-widest",
  "text-[#888] text-center",
  "border-b border-[#e0e0e0] bg-[#f7f7f7]",
  "whitespace-nowrap font-mono",
].join(" ");

const TD = [
  "px-3 py-2",
  "text-[11px] font-mono font-medium",
  "text-[#222] text-center",
  "border-b border-[#efefef]",
  "whitespace-nowrap",
].join(" ");

/* ─────────────────────────────────────────────
   MAIN COMPONENT
───────────────────────────────────────────── */
const PaymentBilling = ({ selectedClient, entries, setEntries }) => {
  const { axios, apiRequest, toast } = useAppContext();
  const initialCycle = getDairyCycle();

  const [dateMode, setDateMode] = useState("TEN_DAYS");
  const [from, setFrom] = useState(initialCycle.from);
  const [to, setTo] = useState(initialCycle.to);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [isFetchingLedger, setIsFetchingLedger] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);
  const [isMarkingPaid, setIsMarkingPaid] = useState(false);
  const [isGeneratingPDF, setIsGeneratingPDF] = useState(false);
  const [isWhatsApping, setIsWhatsApping] = useState(false);

  const handleTenDays = () => {
    setDateMode("TEN_DAYS");
    const { from: f, to: t } = getDairyCycle();
    setFrom(f);
    setTo(t);
  };

  // ✅ Auto-refresh ledger when a new global entry is saved (tracked by entries.length)
  useEffect(() => {
    const fetchLedger = async () => {
      if (!selectedClient) {
        setLedgerEntries([]);
        return;
      }
      setIsFetchingLedger(true);
      try {
        const cId = selectedClient.id || selectedClient._id;
        const res = await axios.get("/api/owner/entries", {
          params: { clientId: cId, startDate: from, endDate: to },
        });
        if (res.data.success) setLedgerEntries(res.data.data);
      } catch {
        toast.error("Failed to load billing records.");
      } finally {
        setIsFetchingLedger(false);
      }
    };
    fetchLedger();
  }, [selectedClient, from, to, axios, toast, entries.length]);

  const {
    groupedData,
    totalAmount,
    allPaid,
    totalVolume,
    avgFat,
    avgSnf,
    invoiceNo,
  } = useMemo(() => {
    if (!selectedClient || ledgerEntries.length === 0)
      return {
        groupedData: [],
        totalAmount: 0,
        allPaid: false,
        totalVolume: 0,
        avgFat: 0,
        avgSnf: 0,
        invoiceNo: "—",
      };

    const groups = {};
    ledgerEntries.forEach((e) => {
      if (!groups[e.date])
        groups[e.date] = { date: e.date, AM: null, PM: null };
      groups[e.date][e.shift] = e;
    });

    const valid = ledgerEntries.filter((e) => e.ltrs > 0);
    return {
      groupedData: Object.values(groups).sort((a, b) =>
        a.date.localeCompare(b.date),
      ),
      totalAmount: ledgerEntries.reduce((s, e) => s + e.amount, 0),
      totalVolume: ledgerEntries.reduce((s, e) => s + e.ltrs, 0),
      allPaid: ledgerEntries.length > 0 && ledgerEntries.every((e) => e.paid),
      avgFat: valid.length
        ? valid.reduce((s, e) => s + e.fat, 0) / valid.length
        : 0,
      avgSnf: valid.length
        ? valid.reduce((s, e) => s + e.snf, 0) / valid.length
        : 0,
      invoiceNo: generateInvoiceNo(
        selectedClient?.serialId || selectedClient?.id,
        from,
      ),
    };
  }, [selectedClient, ledgerEntries, from]);

  const handleMarkPaid = async () => {
    if (allPaid || totalAmount === 0 || !selectedClient) return;
    setIsMarkingPaid(true);
    const cId = selectedClient.id || selectedClient._id;
    try {
      const res = await apiRequest("PUT", "/api/owner/entries/mark-paid", {
        clientId: cId,
        startDate: from,
        endDate: to,
      });
      if (res.success) {
        setLedgerEntries((prev) => prev.map((e) => ({ ...e, paid: true })));
        setEntries((prev) =>
          prev.map((e) => {
            const eId = e.clientId || e.farmerId;
            if (eId === cId && e.date >= from && e.date <= to)
              return { ...e, paid: true };
            return e;
          }),
        );
        toast.success("Marked as paid!");
      }
    } catch {
      toast.error("Failed to mark as paid.");
    } finally {
      setIsMarkingPaid(false);
    }
  };

  const generatePDF = useCallback(async () => {
    if (!selectedClient || groupedData.length === 0) return null;
    setIsGeneratingPDF(true);
    try {
      const doc = await buildPDF(
        selectedClient,
        groupedData,
        ledgerEntries,
        totalVolume,
        totalAmount,
        from,
        to,
      );
      const blob = doc.output("blob");
      const url = URL.createObjectURL(blob);
      setPdfUrl(url);
      return { doc, blob };
    } catch {
      toast.error("PDF generation failed.");
      return null;
    } finally {
      setIsGeneratingPDF(false);
    }
  }, [
    selectedClient,
    groupedData,
    ledgerEntries,
    totalVolume,
    totalAmount,
    from,
    to,
  ]);

  const handlePreview = async () => {
    const result = await generatePDF();
    if (result) setPreviewOpen(true);
  };

  const handleDownload = async () => {
    const result = await generatePDF();
    if (result) {
      result.doc.save(
        `TejasDairy_${selectedClient.name.replace(/\s+/g, "_")}_${from}.pdf`,
      );
    }
  };

  const handleWhatsAppShare = async () => {
    if (!selectedClient) return;

    let phone = (
      selectedClient?.whatsapp ||
      selectedClient?.phone ||
      ""
    ).replace(/\D/g, "");

    if (!phone) {
      toast.error("No phone number available for this client.");
      return;
    }
    if (phone.length === 10) phone = "91" + phone;

    setIsWhatsApping(true);

    const result = await generatePDF();
    if (!result) {
      setIsWhatsApping(false);
      return;
    }

    const fileName = `TejasDairy_Bill_${(selectedClient.name || "Client").replace(/\s+/g, "_")}_${from}.pdf`;
    
    // Download the PDF directly so they can attach it manually
    const link = document.createElement("a");
    link.href = URL.createObjectURL(result.blob);
    link.download = fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    const msg = buildWhatsAppMsg(
      selectedClient,
      from,
      to,
      totalVolume,
      totalAmount,
      avgFat,
      avgSnf,
      allPaid,
      invoiceNo,
    );

    toast.success(
      "Opening WhatsApp chat directly! Please attach the downloaded PDF manually.",
      { duration: 5000 },
    );

    // Open WhatsApp directly to their specific contact chat box
    setTimeout(() => {
      window.open(
        `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`,
        "_blank",
      );
      setIsWhatsApping(false);
    }, 1200);
  };

  const isActionDisabled =
    totalAmount === 0 || isGeneratingPDF || !selectedClient || isFetchingLedger;

  return (
    <>
      <div
        className="bg-white rounded-2xl border border-[#e0e0e0] shadow-sm h-full flex flex-col overflow-hidden"
        style={{ fontFamily: "'Courier New', Courier, monospace" }}
      >
        <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 border-b border-[#e8e8e8] bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-md flex items-center justify-center bg-[#111] border border-[#111]">
              <CreditCard size={14} className="text-white" />
            </div>
            <div>
              <div className="text-[11px] font-mono font-black uppercase tracking-widest text-[#111]">
                Billing Ledger
              </div>
              {selectedClient && (
                <div className="text-[9px] font-mono text-[#999] uppercase tracking-wider">
                  {invoiceNo}
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <div className="flex bg-[#f0f0f0] rounded-lg p-0.5 border border-[#e0e0e0]">
              <button
                onClick={handleTenDays}
                className={`px-3 py-1.5 rounded-md text-[9px] font-mono font-black uppercase tracking-widest transition-all ${
                  dateMode === "TEN_DAYS"
                    ? "bg-[#111] text-white shadow-sm"
                    : "text-[#888] hover:text-[#333]"
                }`}
              >
                Cycle
              </button>
              <button
                onClick={() => setDateMode("CUSTOM")}
                className={`px-3 py-1.5 rounded-md text-[9px] font-mono font-black uppercase tracking-widest transition-all ${
                  dateMode === "CUSTOM"
                    ? "bg-[#111] text-white shadow-sm"
                    : "text-[#888] hover:text-[#333]"
                }`}
              >
                Custom
              </button>
            </div>

            {selectedClient && totalAmount > 0 && (
              <div
                className={`px-2.5 py-1 rounded-full text-[8px] font-mono font-black uppercase tracking-widest border ${
                  allPaid
                    ? "bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]"
                    : "bg-[#fffbeb] text-[#b45309] border-[#fde68a]"
                }`}
              >
                {allPaid ? "● Paid" : "● Pending"}
              </div>
            )}
          </div>
        </div>

        <AnimatePresence>
          {dateMode === "CUSTOM" && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden border-b border-[#e8e8e8] bg-white"
            >
              <div className="flex gap-4 px-4 py-3">
                <div className="flex-1">
                  <label className="block text-[8px] font-mono font-black uppercase tracking-widest text-[#aaa] mb-1.5">
                    From Date
                  </label>
                  <input
                    type="date"
                    value={from}
                    onChange={(e) => setFrom(e.target.value)}
                    className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[11px] font-mono text-[#222] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all bg-[#fafafa]"
                  />
                </div>
                <div className="flex-1">
                  <label className="block text-[8px] font-mono font-black uppercase tracking-widest text-[#aaa] mb-1.5">
                    To Date
                  </label>
                  <input
                    type="date"
                    value={to}
                    onChange={(e) => setTo(e.target.value)}
                    className="w-full border border-[#ddd] rounded-lg px-3 py-2 text-[11px] font-mono text-[#222] outline-none focus:border-[#111] focus:ring-1 focus:ring-[#111]/10 transition-all bg-[#fafafa]"
                  />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {dateMode === "TEN_DAYS" && (
          <div className="flex items-center gap-2 px-4 py-2 bg-[#f7f7f7] border-b border-[#e8e8e8] shrink-0">
            <Calendar size={10} className="text-[#aaa]" />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest text-[#999]">
              Period:
            </span>
            <span className="text-[9px] font-mono font-black text-[#444] uppercase tracking-wider">
              {formatDate(from)} — {formatDate(to)}
            </span>
          </div>
        )}

        <div className="flex-1 overflow-x-auto relative">
          <table className="w-full text-left min-w-[520px]">
            <thead className="sticky top-0 z-10">
              <tr>
                {[
                  { label: "Date", icon: <Calendar size={9} /> },
                  { label: "Shift" },
                  { label: "Litres (L)" },
                  { label: "Fat %" },
                  { label: "SNF %" },
                  { label: "Rate (₹)" },
                  { label: "Amount (₹)" },
                ].map((h, i) => (
                  <th key={i} className={TH}>
                    <div className="flex items-center justify-center gap-1">
                      {h.icon}
                      {h.label}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isFetchingLedger ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Loader2
                      size={22}
                      className="animate-spin text-[#ccc] mx-auto mb-2"
                    />
                    <span className="text-[10px] font-mono font-bold uppercase tracking-widest text-[#bbb]">
                      Fetching Records...
                    </span>
                  </td>
                </tr>
              ) : groupedData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-16 text-center">
                    <Droplets size={26} className="text-[#ddd] mx-auto mb-2" />
                    <span className="text-[11px] font-mono font-medium text-[#bbb]">
                      {selectedClient
                        ? "No records found for this period."
                        : "Select a Client to view ledger."}
                    </span>
                  </td>
                </tr>
              ) : (
                groupedData.map((day, idx) => (
                  <React.Fragment key={idx}>
                    {day.AM && (
                      <tr className="hover:bg-[#fafafa] transition-colors group">
                        <td
                          rowSpan={day.PM ? 2 : 1}
                          className={`${TD} font-mono font-black text-[#111] border-r border-[#e8e8e8] bg-white group-hover:bg-[#fafafa] text-left px-3`}
                          style={{ verticalAlign: "middle" }}
                        >
                          <span className="text-[9px] font-mono font-black uppercase tracking-wide">
                            {formatDate(day.date)}
                          </span>
                        </td>
                        <td className={`${TD}`}>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-[#fef9c3] text-[#92400e] border border-[#fde68a] tracking-widest">
                            AM
                          </span>
                        </td>
                        <td className={TD}>{day.AM.ltrs.toFixed(2)}</td>
                        <td className={TD}>{day.AM.fat.toFixed(2)}</td>
                        <td className={TD}>{day.AM.snf.toFixed(2)}</td>
                        <td className={TD}>₹{day.AM.rate.toFixed(2)}</td>
                        <td
                          className={`${TD} font-black text-[#111] text-right pr-4`}
                        >
                          ₹{day.AM.amount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                    {day.PM && (
                      <tr className="hover:bg-[#fafafa] transition-colors group">
                        {!day.AM && (
                          <td
                            className={`${TD} font-mono font-black text-[#111] border-r border-[#e8e8e8] text-left px-3`}
                          >
                            <span className="text-[9px] font-mono font-black uppercase tracking-wide">
                              {formatDate(day.date)}
                            </span>
                          </td>
                        )}
                        <td className={`${TD}`}>
                          <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[9px] font-mono font-black bg-[#eff6ff] text-[#1d4ed8] border border-[#bfdbfe] tracking-widest">
                            PM
                          </span>
                        </td>
                        <td className={TD}>{day.PM.ltrs.toFixed(2)}</td>
                        <td className={TD}>{day.PM.fat.toFixed(2)}</td>
                        <td className={TD}>{day.PM.snf.toFixed(2)}</td>
                        <td className={TD}>₹{day.PM.rate.toFixed(2)}</td>
                        <td
                          className={`${TD} font-black text-[#111] text-right pr-4`}
                        >
                          ₹{day.PM.amount.toFixed(2)}
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="px-4 py-3 bg-white border-t border-[#e0e0e0] flex flex-wrap items-center gap-2 shrink-0">
          <div className="flex-1 min-w-[140px] bg-[#111] rounded-xl px-4 py-2.5">
            <div className="text-[8px] font-mono font-bold uppercase tracking-widest text-[#888] mb-0.5">
              Grand Total
            </div>
            <div className="text-[16px] font-mono font-black text-white leading-none">
              ₹{totalAmount.toFixed(2)}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handlePreview}
              disabled={isActionDisabled}
              title="Preview PDF"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f3f3f3] hover:bg-[#e8e8e8] border border-[#ddd] text-[10px] font-mono font-black uppercase tracking-widest text-[#444] transition-all disabled:opacity-40"
            >
              {isGeneratingPDF ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Eye size={13} />
              )}
              Preview
            </button>

            <button
              onClick={handleDownload}
              disabled={isActionDisabled}
              title="Download PDF"
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#f3f3f3] hover:bg-[#e8e8e8] border border-[#ddd] text-[10px] font-mono font-black uppercase tracking-widest text-[#444] transition-all disabled:opacity-40"
            >
              <Download size={13} />
              PDF
            </button>

            <button
              onClick={handleMarkPaid}
              disabled={
                allPaid ||
                totalAmount === 0 ||
                isMarkingPaid ||
                !selectedClient ||
                isFetchingLedger
              }
              className={`flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl text-[10px] font-mono font-black uppercase tracking-widest transition-all disabled:opacity-40 ${
                allPaid
                  ? "bg-[#f0fdf4] text-[#16a34a] border border-[#bbf7d0]"
                  : "bg-[#111] hover:bg-[#222] text-white border border-[#111]"
              }`}
            >
              {isMarkingPaid ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <CheckCircle2 size={13} />
              )}
              {allPaid ? "Paid" : "Mark Paid"}
            </button>

            <button
              onClick={handleWhatsAppShare}
              disabled={isActionDisabled || isWhatsApping}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-xl bg-[#25d366] hover:bg-[#1fb855] text-white text-[10px] font-mono font-black uppercase tracking-widest transition-all disabled:opacity-40 border border-[#1fb855]"
            >
              {isWhatsApping ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <MessageCircle size={13} />
              )}
              WhatsApp
            </button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {previewOpen && pdfUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
            onClick={(e) =>
              e.target === e.currentTarget && setPreviewOpen(false)
            }
          >
            <motion.div
              initial={{ scale: 0.96, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.96, y: 16 }}
              transition={{ type: "spring", stiffness: 320, damping: 28 }}
              className="bg-white w-full max-w-4xl rounded-2xl flex flex-col overflow-hidden shadow-2xl border border-[#e0e0e0]"
              style={{ height: "92vh" }}
            >
              <div className="flex items-center justify-between px-5 py-4 border-b border-[#e8e8e8] bg-[#fafafa] shrink-0">
                <div>
                  <div className="text-[11px] font-mono font-black uppercase tracking-widest text-[#111]">
                    Bill Preview
                  </div>
                  <div className="text-[9px] font-mono text-[#999] uppercase tracking-wider mt-0.5">
                    {selectedClient?.name?.toUpperCase()} &nbsp;·&nbsp;{" "}
                    {invoiceNo} &nbsp;·&nbsp; {formatDate(from)} —{" "}
                    {formatDate(to)}
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={handleDownload}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[#f3f3f3] hover:bg-[#e8e8e8] border border-[#ddd] text-[10px] font-mono font-black uppercase tracking-widest text-[#444] transition-all"
                  >
                    <Download size={13} /> Download
                  </button>
                  <button
                    onClick={() => setPreviewOpen(false)}
                    className="p-2 rounded-lg bg-[#f3f3f3] hover:bg-[#e8e8e8] border border-[#ddd] text-[#444] transition-all"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-[#555] p-3 overflow-hidden">
                <iframe
                  src={pdfUrl}
                  className="w-full h-full rounded-lg shadow-xl bg-white"
                  title="Bill Preview"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default PaymentBilling;
