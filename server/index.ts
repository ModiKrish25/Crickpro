import "dotenv/config";
import express from "express";
import { createServer } from "http";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerOAuthRoutes } from "./routes/oauth";
import { registerPhoneOtpRoutes } from "./routes/phone-otp";
import { registerEmailAuthRoutes } from "./routes/email-auth";
import { registerStorageProxy } from "./routes/storageProxy";
import { appRouter } from "./routes/routers";
import { createContext } from "./core/context";
import { wsManager } from "./core/websocket";

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Enable CORS for all routes - reflect the request origin to support credentials
  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin) {
      res.header("Access-Control-Allow-Origin", origin);
    }
    res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
    res.header(
      "Access-Control-Allow-Headers",
      "Origin, X-Requested-With, Content-Type, Accept, Authorization",
    );
    res.header("Access-Control-Allow-Credentials", "true");

    // Handle preflight requests
    if (req.method === "OPTIONS") {
      res.sendStatus(200);
      return;
    }
    next();
  });

  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  registerStorageProxy(app);
  registerOAuthRoutes(app);
  registerPhoneOtpRoutes(app);
  registerEmailAuthRoutes(app);

  app.get("/api/health", (_req, res) => {
    const port = process.env.PORT || "3000";
    res.json({
      ok: true,
      port: parseInt(port, 10),
      apiUrl: `http://localhost:${port}`,
      wsUrl: `ws://localhost:${port}/ws`,
      timestamp: Date.now(),
    });
  });

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  const port = parseInt(process.env.PORT || "3000");

  // Initialise WebSocket server for live match broadcast
  wsManager.init(server);

  server.listen(port, () => {
    console.log(`[api] server listening on port ${port}`);
    console.log(`[ws] WebSocket ready at ws://localhost:${port}/ws`);
  });
}

startServer().catch(console.error);
