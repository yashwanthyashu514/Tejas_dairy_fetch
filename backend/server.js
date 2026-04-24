import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import dotenv from "dotenv";
import connectDB from "./config/mongoDB.js";
import router from "./routes/AppRouter.js";

dotenv.config();

const app = express();

/* ──────────────────────────────────
   Trust Proxy (Crucial for Rate Limiting in Production)
────────────────────────────────── */
// Required if hosting on Render, Railway, Heroku, etc.
app.set("trust proxy", 1);

/* ──────────────────────────────────
   Security Headers
────────────────────────────────── */
app.use(
  helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
  }),
);

/* ──────────────────────────────────
   CORS
────────────────────────────────── */
// FIX: Combined default URLs into one comma-separated string
const ALLOWED_ORIGINS = (
  process.env.ALLOWED_ORIGINS ||
  "https://tejas-dairy.vercel.app,http://localhost:5173"
)
  .split(",")
  .map((o) => o.trim());

app.use(
  cors({
    origin: (origin, cb) => {
      // Allow requests with no origin (mobile apps, curl, etc.)
      if (!origin || ALLOWED_ORIGINS.includes(origin)) return cb(null, true);
      cb(new Error(`CORS blocked: ${origin}`));
    },
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

/* ──────────────────────────────────
   Body Parsing
────────────────────────────────── */
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

/* ──────────────────────────────────
   Rate Limiting
────────────────────────────────── */
// Global limiter
app.use(
  rateLimit({
    windowMs: 15 * 60 * 1000, // FIX: Changed to actually be 15 minutes
    max: 300, // Limit each IP to 300 requests per window
    standardHeaders: true,
    legacyHeaders: false,
    message: {
      success: false,
      message: "Too many requests. Please try again later.",
    },
  }),
);

// Strict limiter for auth endpoints
const authLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 10, // Limit each IP to 10 login attempts per minute
  message: {
    success: false,
    message: "Too many login attempts. Please wait 1 minute.",
  },
});

// Apply strict limiter specifically to the login route BEFORE mounting the main router
app.use("/api/owner/login", authLimiter);

/* ──────────────────────────────────
   Routes
────────────────────────────────── */
app.use("/api/owner", router);

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Tejas Dairy API is running 🚀",
    version: "1.0.0",
    routes: "/api/owner/*",
  });
});

app.get("/health", (req, res) => {
  res.json({
    success: true,
    message: "Tejas Dairy API is running.",
    ts: new Date().toISOString(),
  });
});

/* ──────────────────────────────────
   404 Handler
────────────────────────────────── */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: `Route ${req.method} ${req.originalUrl} not found.`,
  });
});

/* ──────────────────────────────────
   Global Error Handler
────────────────────────────────── */
app.use((err, req, res, _next) => {
  console.error("[ERROR]", err.message);

  // Catch CORS errors specifically so they don't break the frontend silently
  if (err.message.includes("CORS blocked")) {
    return res
      .status(403)
      .json({ success: false, message: "CORS origin blocked." });
  }

  res.status(err.status || 500).json({
    success: false,
    message: err.message || "Internal server error.",
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

/* ──────────────────────────────────
   Start Database & Server
────────────────────────────────── */
const PORT = process.env.PORT || 5000;

// FIX: Wait for the database to connect before listening for requests
connectDB()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        `\nTejas Dairy API — Port ${PORT} | ${new Date().toLocaleString("en-IN")}\n`,
      );
    });
  })
  .catch((err) => {
    console.error("Failed to connect to Database. Server shutting down.", err);
    process.exit(1);
  });
