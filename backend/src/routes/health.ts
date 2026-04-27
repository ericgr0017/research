import type { FastifyInstance } from "fastify";
import { config } from "../config.js";

export const healthRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/health", async () => ({
    status: "ok",
    test_mode: config.testMode,
    allowed_users: config.allowedUsers.length,
    time: new Date().toISOString(),
  }));
};
