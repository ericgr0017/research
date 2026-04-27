import type { FastifyInstance } from "fastify";
import { ensureBriefInBackground, ensureBriefNow } from "../agents/briefManager.js";
import { getZohoClient } from "../zoho/createZohoClient.js";

export const meetingsRoutes = async (app: FastifyInstance): Promise<void> => {
  app.get("/api/meetings/today", async (request, reply) => {
    const user = request.session.user;
    if (!user) return reply.code(401).send({ error: "Sign in required." });

    try {
      const zoho = getZohoClient();
      const all = await zoho.getTodayMeetings(user.zoho_user_id);
      const pending = all.filter((m) => m.interview_decision === "Pending");

      // Kick off background brief generation for any pending meeting that
      // doesn't have one yet. The interviewer will see updated has_brief on
      // the next 60-second poll.
      for (const m of pending) ensureBriefInBackground(m);

      return {
        interviewer: user,
        scheduled_count: all.length,
        completed_count: all.length - pending.length,
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

  app.get<{ Params: { id: string } }>(
    "/api/meetings/:id/brief",
    async (request, reply) => {
      const user = request.session.user;
      if (!user) return reply.code(401).send({ error: "Sign in required." });

      try {
        const zoho = getZohoClient();
        const meeting = await zoho.getMeeting(request.params.id);
        if (!meeting) return reply.code(404).send({ error: "Meeting not found." });

        await ensureBriefNow(meeting);
        const brief = await zoho.getBrief(meeting.id);
        if (!brief) {
          return reply
            .code(500)
            .send({ error: "Brief generation finished but the brief was not stored." });
        }
        return brief;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        app.log.error({ err }, "Failed to load brief");
        return reply.code(500).send({ error: "Could not load brief.", detail: message });
      }
    },
  );

  app.post<{ Params: { id: string } }>(
    "/api/meetings/:id/take-call",
    async (request, reply) => {
      const user = request.session.user;
      if (!user) return reply.code(401).send({ error: "Sign in required." });

      try {
        const zoho = getZohoClient();
        const meeting = await zoho.getMeeting(request.params.id);
        if (!meeting) return reply.code(404).send({ error: "Meeting not found." });

        // V1: log the call_start in our backend log. The Zoho write for
        // "In Progress" status lands once we have a status field defined for
        // that state on Executive_Meeting_Summary.
        const callStart = new Date().toISOString();
        app.log.info(
          { meetingId: meeting.id, interviewer: user.email, callStart },
          "take-call",
        );
        return { meeting_id: meeting.id, call_start: callStart };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        app.log.error({ err }, "Failed to start call");
        return reply.code(500).send({ error: "Could not start call.", detail: message });
      }
    },
  );
};
