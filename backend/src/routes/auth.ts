import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";

const signInSchema = z.object({
  email: z.string().email(),
});

export const authRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/api/auth/whoami", async (request) => {
    return { user: request.session.user ?? null, test_mode: config.testMode };
  });

  // V1 sign-in is a dropdown over the ALLOWED_USERS env list. There is no
  // password. We will harden this in V2.
  app.post("/api/auth/sign-in", async (request, reply) => {
    const parsed = signInSchema.safeParse(request.body);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Email is required." });
    }
    const match = config.allowedUsers.find(
      (u) => u.email.toLowerCase() === parsed.data.email.toLowerCase(),
    );
    if (!match) {
      return reply.code(403).send({ error: "This email is not on the allowed list." });
    }
    request.session.user = match;
    return { user: match };
  });

  app.post("/api/auth/sign-out", async (request, reply) => {
    request.session.user = undefined;
    await new Promise<void>((resolve, reject) => {
      request.session.destroy((err) => (err ? reject(err) : resolve()));
    });
    return reply.code(204).send();
  });

  app.get("/api/auth/allowed-users", async () => {
    // Used to populate the sign-in dropdown. Returns names and emails only.
    return {
      users: config.allowedUsers.map((u) => ({ email: u.email, name: u.name })),
    };
  });
};
