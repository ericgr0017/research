import "@fastify/session";
import type { SessionUser } from "@zai/shared";

declare module "@fastify/session" {
  interface FastifySessionObject {
    user?: SessionUser;
  }
}
