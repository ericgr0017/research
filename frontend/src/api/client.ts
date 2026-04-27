// Tiny fetch wrapper that always sends cookies and surfaces JSON errors.

export class ApiError extends Error {
  constructor(public readonly status: number, message: string, public readonly detail?: string) {
    super(message);
  }
}

export const api = async <T>(path: string, init: RequestInit = {}): Promise<T> => {
  // Only set Content-Type when we have a body. Fastify rejects empty JSON bodies
  // when the header is set, which trips up POSTs like /api/auth/sign-out.
  const headers: Record<string, string> = { ...(init.headers as Record<string, string> ?? {}) };
  if (init.body && !headers["Content-Type"]) {
    headers["Content-Type"] = "application/json";
  }
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers,
  });

  if (res.status === 204) return undefined as T;

  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new ApiError(res.status, body.error ?? `Request failed (${res.status})`, body.detail);
  }
  return body as T;
};
