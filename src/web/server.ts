/**
 * Express web server for the questions UI
 */

import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { router } from "./routes.js";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment
const PORT = parseInt(process.env.QUESTIONS_UI_PORT || "3847", 10);

let serverInstance: ReturnType<typeof app.listen> | null = null;
const app = express();

// Middleware
app.use(express.json());

// Serve static files from public directory
// In production (dist), public is at ../../public relative to dist/web/server.js
// In development (src), public is at ../../public relative to src/web/server.ts
const publicPath = path.resolve(__dirname, "../../public");
app.use(express.static(publicPath));

// API routes
app.use(router);

// Serve the main HTML for session pages
app.get("/session/:id", (_req, res) => {
  res.sendFile(path.join(publicPath, "index.html"));
});

/**
 * Start the web server
 */
export function startServer(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (serverInstance) {
      resolve();
      return;
    }

    try {
      serverInstance = app.listen(PORT, () => {
        console.error(`Questions UI server running at http://localhost:${PORT}`);
        resolve();
      });

      serverInstance.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.error(
            `Port ${PORT} is already in use. Set QUESTIONS_UI_PORT to use a different port.`
          );
        }
        reject(err);
      });
    } catch (err) {
      reject(err);
    }
  });
}

/**
 * Stop the web server
 */
export function stopServer(): Promise<void> {
  return new Promise((resolve) => {
    if (serverInstance) {
      serverInstance.close(() => {
        serverInstance = null;
        resolve();
      });
    } else {
      resolve();
    }
  });
}

/**
 * Get the configured port
 */
export function getPort(): number {
  return PORT;
}
