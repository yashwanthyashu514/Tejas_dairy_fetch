import express from "express";
import { verifyToken } from "../middleware/UserAuth.js";
import {
  loginOwner,
  getOwnerProfile,
  createClient,
  getAllClients,
  searchClients,
  addCollectionEntry,
  getAllEntries,
  markEntriesPaid,
  getDashboardStats,
  updateCollectionEntry,
  deleteCollectionEntry,
  deleteClient,
} from "../controllers/AppController.js";

const router = express.Router();

/* ── Public ── */
router.post("/login", loginOwner);

/* ── Protected ── */
router.use(verifyToken); // All routes below require auth

// Owner profile (used by frontend token validation)
router.get("/profile", getOwnerProfile);
router.post("/add-clients", createClient);
router.get("/clients", getAllClients);
router.get("/search-clients", searchClients);
router.delete("/clients/:id", deleteClient);

// Entries
router.post("/entries", addCollectionEntry);
router.get("/entries", getAllEntries);
router.put("/entries/mark-paid", markEntriesPaid);
router.put("/entries/:id", updateCollectionEntry);
router.delete("/entries/:id", deleteCollectionEntry);

// Stats
router.get("/stats", getDashboardStats);

export default router;
