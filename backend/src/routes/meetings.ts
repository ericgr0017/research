import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { config } from "../config.js";
import { getZohoClient } from "../zoho/createZohoClient.js";

const todayQuerySchema = z.object({
  interviewer: z.string().optional(),
});

export const meetingsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/api/meetings/today", async (request, reply) => {
    const parsed = todayQuerySchema.safeParse(request.query);
    if (!parsed.success) {
      return reply.code(400).send({ error: "Invalid query params" });
    }

    // V1: interviewer comes from query string until session auth lands in M2.
    // Default to the first allowed user so the demo just works.
    const interviewerId =
      parsed.data.interviewer ?? config.allowedUsers[0]?.zoho_user_id;

    if (!interviewerId) {
      return reply.code(400).send({
        error: "No interviewer specified and ALLOWED_USERS is empty.",
      });
    }

    try {
      const zoho = getZohoClient();
      const meetings = await zoho.searchTodayMeetings(interviewerId);
      return { interviewer_id: interviewerId, meetings };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error({ err }, "Failed to load today's meetings");
      return reply.code(500).send({ error: "Could not load meetings", detail: message });
    }
  });

  app.get<{ Params: { id: string } }>("/api/meetings/:id", async (request, reply) => {
    try {
      const zoho = getZohoClient();
      const meeting = await zoho.getMeeting(request.params.id);
      if (!meeting) return reply.code(404).send({ error: "Meeting not found" });
      return meeting;
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      app.log.error({ err }, "Failed to load meeting");
      return reply.code(500).send({ error: "Could not load meeting", detail: message });
    }
  });
};
