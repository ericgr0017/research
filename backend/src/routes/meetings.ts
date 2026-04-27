import type { FastifyInstance } from "fastify";
import { getZohoClient } from "../zoho/createZohoClient.js";

export const meetingsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/api/meetings/today", async (request, reply) => {
    const user = request.session.user;
    if (!user) {
      return reply.code(401).send({ error: "Sign in required." });
    }

    try {
      const zoho = getZohoClient();
      const all = await zoho.getTodayMeetings(user.zoho_user_id);
      const pending = all.filter((m) => m.interview_decision === "Pending");
      const completed = all.length - pending.length;
      return {
        interviewer: user,
        scheduled_count: all.length,
        completed_count: completed,
        pending_count: pending.length,
        meetings: pending,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error({ err }, "Failed to load today's meetings");
      return reply.code(500).send({ error: "Could not load meetings.", detail: message });
    }
  });

  app.get<{ Params: { id: string } }>("/api/meetings/:id", async (request, reply) => {
    const user = request.session.user;
    if (!user) return reply.code(401).send({ error: "Sign in required." });

    try {
      const zoho = getZohoClient();
      const meeting = await zoho.getMeeting(request.params.id);
      if (!meeting) return reply.code(404).send({ error: "Meeting not found." });
      return meeting;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error({ err }, "Failed to load meeting");
      return reply.code(500).send({ error: "Could not load meeting.", detail: message });
    }
  });
};
