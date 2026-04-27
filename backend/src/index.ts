import cors from "@fastify/cors";
import Fastify from "fastify";
import { config } from "./config.js";
import { healthRoutes } from "./routes/health.js";
import { meetingsRoutes } from "./routes/meetings.js";

const start = async (): Promise<void> => {
  const app = Fastify({
    logger: {
      level: "info",
      transport: { target: "pino-pretty", options: { colorize: true, translateTime: "HH:MM:ss" } },
    },
  });

  await app.register(cors, {
    origin: config.frontendOrigin,
    credentials: true,
  });

  await app.register(healthRoutes);
  await app.register(meetingsRoutes);

  try {
    await app.listen({ port: config.port, host: "0.0.0.0" });
    app.log.info(
      `ZAI Console backend ready. test_mode=${config.testMode}, allowed_users=${config.allowedUsers.length}`,
    );
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }
};

void start();
