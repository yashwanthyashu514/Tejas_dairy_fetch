import jwt from "jsonwebtoken";
import crypto from "crypto";
import ClientModel from "../models/ClientModel.js";
import CollectionEntry from "../models/CollectionEntryModel.js";

/* ─────────────────────────────────────────
   Profile
───────────────────────────────────────── */
export const getOwnerProfile = async (req, res) => {
  try {
    return res.status(200).json({
      success: true,
      data: {
        email: process.env.OWNER_EMAIL,
        name: "Tejas Dairy Owner",
      },
    });
  } catch (err) {
    return res.status(500).json({ success: false, message: "Server error." });
  }
};

/* ─────────────────────────────────────────
   Auth
───────────────────────────────────────── */
export const loginOwner = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email?.trim() || !password?.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Email and password are required." });
    }

    const { OWNER_EMAIL, OWNER_PASSWORD, JWT_SECRET } = process.env;
    if (!OWNER_EMAIL || !OWNER_PASSWORD || !JWT_SECRET) {
      throw new Error("Server auth configuration is incomplete.");
    }

    // Constant-time comparison to prevent timing attacks
    const emailMatch = crypto.timingSafeEqual(
      Buffer.from(email.trim()),
      Buffer.from(OWNER_EMAIL),
    );
    const passMatch = crypto.timingSafeEqual(
      Buffer.from(password),
      Buffer.from(OWNER_PASSWORD),
    );

    if (!emailMatch || !passMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials. Access denied.",
      });
    }

    const token = jwt.sign({ role: "owner", email: OWNER_EMAIL }, JWT_SECRET, {
      expiresIn: "7d",
    });

    return res
      .status(200)
      .json({ success: true, message: "Authentication successful.", token });
  } catch (err) {
    console.error("[loginOwner]", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error during authentication." });
  }
};

/* ─────────────────────────────────────────
   Clients
───────────────────────────────────────── */
export const createClient = async (req, res) => {
  try {
    const { name, phone, whatsapp, address, bankAccount, ifsc } = req.body;

    if (!name?.trim() || !phone?.trim() || !address?.trim()) {
      return res.status(400).json({
        success: false,
        message: "Name, phone, and address are required.",
      });
    }

    if (!/^\d{10}$/.test(phone)) {
      return res.status(400).json({
        success: false,
        message: "Phone must be a valid 10-digit number.",
      });
    }

    // Check for duplicate phone
    const existing = await ClientModel.findOne({ phone: phone.trim() });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: `A client with phone ${phone} already exists (${existing.name}).`,
      });
    }

    // Generate sequential serial ID (e.g., TD-3331)
    // We use a more robust numeric search to avoid lexicographical sort issues (e.g., TD-999 > TD-1000)
    const allTdClients = await ClientModel.find({
      serialId: { $regex: /^TD-\d+$/ },
    }, "serialId").lean();

    let maxNumber = 3330; // Start sequence before 3331
    allTdClients.forEach(c => {
      const num = parseInt(c.serialId.replace("TD-", ""), 10);
      if (!isNaN(num) && num > maxNumber) {
        maxNumber = num;
      }
    });

    const nextNumber = maxNumber + 1;
    const serialId = `TD-${nextNumber}`; // No extra padding needed if we want literal TD-3331 and so on

    const client = await ClientModel.create({
      serialId,
      name: name.trim(),
      phone: phone.trim(),
      whatsapp: whatsapp?.trim() || "",
      address: address.trim(),
      bankAccount: bankAccount?.trim() || "",
      ifsc: ifsc?.trim().toUpperCase() || "",
    });

    return res.status(201).json({
      success: true,
      message: "Client registered successfully.",
      data: client,
    });
  } catch (err) {
    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern || {})[0] || "field";
      return res.status(409).json({
        success: false,
        message: `Duplicate ${field}. This client may already be registered.`,
      });
    }
    console.error("[createClient]", err.message);
    return res.status(500).json({
      success: false,
      message: "Server error registering client.",
    });
  }
};
export const getAllClients = async (req, res) => {
  try {
    console.log("[API] Fetching all clients...");
    const clients = await ClientModel.find({}).sort({ createdAt: -1 }).lean();
    console.log(`[API] Found ${clients.length} clients.`);
    return res.status(200).json({ success: true, count: clients.length, data: clients });
  } catch (err) {
    console.error("[getAllClients] Error:", err.message);
    return res.status(500).json({ success: false, message: "Failed to fetch clients." });
  }
};

export const searchClients = async (req, res) => {
  try {
    const { q } = req.query;
    if (!q?.trim()) return res.status(200).json({ success: true, data: [] });

    const regex = new RegExp(
      q.trim().replace(/[.*+?^${}()|[\]\\]/g, "\\$&"),
      "i",
    );
    const clients = await ClientModel.find({
      $or: [{ name: regex }, { phone: regex }, { serialId: regex }],
    })
      .limit(6)
      .lean();

    return res.status(200).json({ success: true, data: clients });
  } catch (err) {
    console.error("[searchClients]", err.message);
    return res.status(500).json({ success: false, message: "Search failed." });
  }
};

export const deleteClient = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await ClientModel.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Client not found." });
    
    // Also delete associated entries? Yes, probably best to clean up.
    await CollectionEntry.deleteMany({ clientId: id });

    return res.status(200).json({ success: true, message: "Client deleted." });
  } catch (err) {
    console.error("[deleteClient]", err.message);
    return res.status(500).json({ success: false, message: "Failed to delete client." });
  }
};

/* ─────────────────────────────────────────
   Collection Entries
───────────────────────────────────────── */
export const addCollectionEntry = async (req, res) => {
  try {
    const { farmerId, date, shift, kgs, ltrs, fat, snf, rate, amount, paid } =
      req.body;

    // Validation
    if (
      !farmerId ||
      !date ||
      !shift ||
      ltrs == null ||
      fat == null ||
      snf == null ||
      rate == null ||
      amount == null
    ) {
      return res.status(400).json({
        success: false,
        message:
          "All fields (farmerId, date, shift, ltrs, fat, snf, rate, amount) are required.",
      });
    }

    if (!["AM", "PM"].includes(shift)) {
      return res
        .status(400)
        .json({ success: false, message: "Shift must be AM or PM." });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return res.status(400).json({
        success: false,
        message: "Date must be in YYYY-MM-DD format.",
      });
    }

    if (parseFloat(ltrs) <= 0 || parseFloat(rate) <= 0) {
      return res.status(400).json({
        success: false,
        message: "Litres and rate must be positive values.",
      });
    }

    const client = await ClientModel.findById(farmerId);
    if (!client)
      return res
        .status(404)
        .json({ success: false, message: "Client not found." });

    // Compute amount server-side to prevent tampering
    const computedAmount = parseFloat(
      (parseFloat(ltrs) * parseFloat(rate)).toFixed(2),
    );

    const entry = await CollectionEntry.create({
      clientId: client._id,
      clientSerialId: client.serialId,
      date,
      shift,
      kgs: parseFloat(kgs) || parseFloat(ltrs),
      ltrs: parseFloat(ltrs),
      fat: parseFloat(fat),
      snf: parseFloat(snf),
      rate: parseFloat(rate),
      amount: computedAmount,
      paid: paid || false,
    });

    return res.status(201).json({
      success: true,
      message: "Entry saved successfully.",
      data: entry,
    });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({
        success: false,
        message: `A ${req.body.shift} entry already exists for this client on ${req.body.date}.`,
      });
    }
    console.error("[addCollectionEntry]", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Server error saving entry." });
  }
};

export const getAllEntries = async (req, res) => {
  try {
    const { clientId, startDate, endDate, paid, limit = 1000 } = req.query;
    const query = {};
    if (clientId) query.clientId = clientId;
    if (startDate || endDate)
      query.date = {
        ...(startDate && { $gte: startDate }),
        ...(endDate && { $lte: endDate }),
      };
    if (paid !== undefined) query.paid = paid === "true";

    const entries = await CollectionEntry.find(query)
      .sort({ date: -1, shift: 1 })
      .limit(parseInt(limit))
      .lean();

    return res
      .status(200)
      .json({ success: true, count: entries.length, data: entries });
  } catch (err) {
    console.error("[getAllEntries]", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch entries." });
  }
};

export const updateCollectionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const { ltrs, fat, snf, rate } = req.body;
    
    const entry = await CollectionEntry.findById(id);
    if (!entry) return res.status(404).json({ success: false, message: "Entry not found." });

    const newLtrs = ltrs !== undefined ? parseFloat(ltrs) : entry.ltrs;
    const newRate = rate !== undefined ? parseFloat(rate) : entry.rate;
    const computedAmount = parseFloat((newLtrs * newRate).toFixed(2));

    entry.ltrs = newLtrs;
    entry.kgs = newLtrs;
    entry.fat = fat !== undefined ? parseFloat(fat) : entry.fat;
    entry.snf = snf !== undefined ? parseFloat(snf) : entry.snf;
    entry.rate = newRate;
    entry.amount = computedAmount;

    await entry.save();

    return res.status(200).json({ success: true, message: "Entry updated.", data: entry });
  } catch (err) {
    console.error("[updateCollectionEntry]", err.message);
    return res.status(500).json({ success: false, message: "Server error updating entry." });
  }
};

export const deleteCollectionEntry = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await CollectionEntry.findByIdAndDelete(id);
    if (!deleted) return res.status(404).json({ success: false, message: "Entry not found." });
    return res.status(200).json({ success: true, message: "Entry deleted." });
  } catch (err) {
    console.error("[deleteCollectionEntry]", err.message);
    return res.status(500).json({ success: false, message: "Server error deleting entry." });
  }
};


export const markEntriesPaid = async (req, res) => {
  try {
    const { clientId, startDate, endDate } = req.body;
    if (!clientId || !startDate || !endDate) {
      return res.status(400).json({
        success: false,
        message: "clientId, startDate, and endDate are required.",
      });
    }

    if (startDate > endDate) {
      return res.status(400).json({
        success: false,
        message: "startDate cannot be after endDate.",
      });
    }

    const result = await CollectionEntry.updateMany(
      { clientId, date: { $gte: startDate, $lte: endDate }, paid: false },
      { $set: { paid: true, paidAt: new Date() } },
    );

    if (result.modifiedCount === 0) {
      return res.status(200).json({
        success: true,
        message: "No unpaid entries found in this date range.",
        modifiedCount: 0,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Marked ${result.modifiedCount} entr${result.modifiedCount === 1 ? "y" : "ies"} as paid.`,
      modifiedCount: result.modifiedCount,
    });
  } catch (err) {
    console.error("[markEntriesPaid]", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to update payment status." });
  }
};

/* ─────────────────────────────────────────
   Summary Stats (bonus endpoint)
───────────────────────────────────────── */
export const getDashboardStats = async (req, res) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const monthStr = today.substring(0, 7);

    const [totalClients, todayEntries, monthEntries, pendingEntries] =
      await Promise.all([
        ClientModel.countDocuments({ active: true }),
        CollectionEntry.find({ date: today }).lean(),
        CollectionEntry.find({ date: { $regex: `^${monthStr}` } }).lean(),
        CollectionEntry.find({ paid: false }).lean(),
      ]);

    return res.status(200).json({
      success: true,
      data: {
        totalClients,
        today: {
          sessions: todayEntries.length,
          volume: todayEntries.reduce((s, e) => s + e.ltrs, 0),
          revenue: todayEntries.reduce((s, e) => s + e.amount, 0),
        },
        thisMonth: {
          sessions: monthEntries.length,
          volume: monthEntries.reduce((s, e) => s + e.ltrs, 0),
          revenue: monthEntries.reduce((s, e) => s + e.amount, 0),
        },
        pending: {
          count: pendingEntries.length,
          amount: pendingEntries.reduce((s, e) => s + e.amount, 0),
        },
      },
    });
  } catch (err) {
    console.error("[getDashboardStats]", err.message);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch stats." });
  }
};
