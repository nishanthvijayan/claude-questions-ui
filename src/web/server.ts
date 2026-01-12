/**
 * Express web server for the questions UI
 */

import express from "express";
import { fileURLToPath } from "url";
import path from "path";
import { createServer } from "net";
import { router } from "./routes.js";

// Get the directory of this file
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration from environment
const PREFERRED_PORT = parseInt(process.env.QUESTIONS_UI_PORT || "3847", 10);
const PORT_RANGE_START = 3847;
const PORT_RANGE_END = 3947; // Try up to 100 ports

let serverInstance: ReturnType<typeof app.listen> | null = null;
let actualPort: number = PREFERRED_PORT;
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
 * Check if a port is available
 */
function isPortAvailable(port: number): Promise<boolean> {
  return new Promise((resolve) => {
    const server = createServer();
    server.once("error", () => {
      resolve(false);
    });
    server.once("listening", () => {
      server.close();
      resolve(true);
    });
    server.listen(port);
  });
}

/**
 * Find an available port starting from the preferred port
 */
async function findAvailablePort(): Promise<number> {
  // First try the preferred/configured port
  if (await isPortAvailable(PREFERRED_PORT)) {
    return PREFERRED_PORT;
  }

  // If preferred port is in the range, start searching from there
  const startPort = Math.max(PORT_RANGE_START, PREFERRED_PORT);

  // Try ports in the range
  for (let port = startPort; port <= PORT_RANGE_END; port++) {
    if (port === PREFERRED_PORT) continue; // Already tried
    if (await isPortAvailable(port)) {
      return port;
    }
  }

  // If we started above range start, also try ports before preferred
  if (PREFERRED_PORT > PORT_RANGE_START) {
    for (let port = PORT_RANGE_START; port < PREFERRED_PORT; port++) {
      if (await isPortAvailable(port)) {
        return port;
      }
    }
  }

  throw new Error(
    `No available ports found in range ${PORT_RANGE_START}-${PORT_RANGE_END}`
  );
}

/**
 * Start the web server
 */
export async function startServer(): Promise<void> {
  if (serverInstance) {
    return;
  }

  // Find an available port
  actualPort = await findAvailablePort();

  return new Promise((resolve, reject) => {
    try {
      serverInstance = app.listen(actualPort, () => {
        console.error(
          `Questions UI server running at http://localhost:${actualPort}`
        );
        resolve();
      });

      serverInstance.on("error", (err: NodeJS.ErrnoException) => {
        if (err.code === "EADDRINUSE") {
          console.error(`Port ${actualPort} is already in use.`);
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
 * Get the actual port the server is running on
 */
export function getPort(): number {
  return actualPort;
}
