import type { FastifyInstance } from "fastify";
import { z } from "zod";
import { runOutcome } from "../agents/outcomeAgent.js";

const decisionBodySchema = z.object({
  decision: z.enum(["Send Invitation", "Do Not Send"]),
  transcript: z.string(),
  notes: z.string().nullable().optional(),
});

export const decisionRoutes = async (app: FastifyInstance): Promise<void> => {
  app.post<{ Params: { id: string } }>(
    "/api/meetings/:id/decision",
    async (request, reply) => {
      const user = request.session.user;
      if (!user) return reply.code(401).send({ error: "Sign in required." });

      const parsed = decisionBodySchema.safeParse(request.body);
      if (!parsed.success) {
        return reply.code(400).send({ error: "Invalid decision payload." });
      }

      try {
        const result = await runOutcome({
          meeting_id: request.params.id,
          decision: parsed.data.decision,
          transcript: parsed.data.transcript,
          notes: parsed.data.notes ?? null,
          interviewer: user,
          steps_complete: {
            meeting_update: false,
            contact_update: false,
            email_sent: false,
            insight_saved: false,
          },
        });
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        app.log.error({ err }, "Outcome agent threw outside of step handling");
        return reply.code(500).send({ error: "Decision processing failed.", detail: message });
      }
    },
  );
};
