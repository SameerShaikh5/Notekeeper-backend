import express from "express";
import mongoose from "mongoose";
import cors from "cors";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss";
import authRoutes from "./routes/auth";
import notesRoutes from "./routes/notes";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Security Middleware
app.use(helmet());

import rateLimit from "express-rate-limit";

// Global Rate Limiter
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per `window` (here, per 15 minutes)
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: { error: "Too many requests, please try again later." }
});

app.use(limiter);

// Custom Security Middleware (NoSQL & XSS)
const sanitizeObjectInPlace = (obj: any) => {
  if (obj !== null && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        obj[key] = xss(obj[key]);
      } else if (typeof obj[key] === 'object') {
        sanitizeObjectInPlace(obj[key]);
      }
    }
  }
};

const securitySanitizer = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  ['body', 'query', 'params'].forEach((k) => {
    const reqObj = (req as any)[k];
    if (reqObj) {
      // Prevent NoSQL Injection
      mongoSanitize.sanitize(reqObj, { replaceWith: '_' });
      // Prevent XSS
      sanitizeObjectInPlace(reqObj);
    }
  });
  next();
};
app.use(securitySanitizer);

// Standard Middleware
app.use(express.json());
app.use(cookieParser());
const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean) as string[];

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.get("/", (req, res) => {
  res.send("NoteKeeper Backend is running");
});
// Routes
app.use("/api/auth", authRoutes);
app.use("/api/notes", notesRoutes);

// Database connection
const MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/Notekeeper";

mongoose
  .connect(MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB");
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });
