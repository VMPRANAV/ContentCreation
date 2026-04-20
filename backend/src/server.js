import cors from "cors";
import express from "express";
import { env, validateEnv } from "./config/env.js";
import { connectToMongo } from "./db/mongo.js";
import aiRoutes from "./routes/aiRoutes.js";

const app = express();

app.use(cors());

app.use(express.json({ limit: "6mb" }));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, service: "linkedin-content-engine" });
});

app.use("/api/ai", aiRoutes);

app.use((error, _req, res, _next) => {
  if (error instanceof SyntaxError && "body" in error) {
    return res.status(400).json({
      error: "Invalid JSON body. Make sure Postman is sending raw JSON with double quotes."
    });
  }

  console.error(error);
  res.status(error.status || 500).json({
    error: error.message || "Internal Server Error"
  });
});

const bootstrap = async () => {
  validateEnv();
  await connectToMongo();

  const server = app.listen(env.port, () => {
    console.log(`[server] Running at http://localhost:${env.port}`);
  });

  server.on("error", (error) => {
    if (error.code === "EADDRINUSE") {
      console.error(
        `[server] Port ${env.port} is already in use. Stop the other process or set PORT to a different value before starting the backend.`
      );
      process.exit(1);
    }

    console.error("Failed to start HTTP server:", error);
    process.exit(1);
  });
};

bootstrap().catch((error) => {
  console.error("Failed to start server:", error);
  process.exit(1);
});
