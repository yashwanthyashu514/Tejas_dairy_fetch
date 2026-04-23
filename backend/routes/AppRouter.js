import express from "express";
import { verifyToken } from "../middleware/UserAuth.js";
import {
  loginOwner,
  createClient,
  getAllClients,
  searchClients,
  addCollectionEntry,
  getAllEntries,
  markEntriesPaid,
  getDashboardStats,
} from "../controllers/AppController.js";

const router = express.Router();

/* ── Public ── */
router.post("/login", loginOwner);

/* ── Protected ── */
router.use(verifyToken); // All routes below require auth

// Clients
router.post("/add-clients", createClient);
router.get("/clients", getAllClients);
router.get("/search-clients", searchClients);

// Entries
router.post("/entries", addCollectionEntry);
router.get("/entries", getAllEntries);
router.put("/entries/mark-paid", markEntriesPaid);

// Stats
router.get("/stats", getDashboardStats);

export default router;
