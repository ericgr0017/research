import { useMutation, useQuery } from "@tanstack/react-query";
import type { SessionUser } from "@zai/shared";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { api, ApiError } from "../api/client.js";
import { useSetSessionUser } from "../api/session.js";

interface AllowedListResponse {
  users: Array<{ email: string; name: string }>;
}

export const SignInPage = (): React.ReactElement => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const setSessionUser = useSetSessionUser();

  const allowed = useQuery<AllowedListResponse>({
    queryKey: ["allowed-users"],
    queryFn: () => api<AllowedListResponse>("/api/auth/allowed-users"),
  });

  useEffect(() => {
    if (!email && allowed.data && allowed.data.users.length > 0) {
      setEmail(allowed.data.users[0]!.email);
    }
  }, [allowed.data, email]);

  const signIn = useMutation({
    mutationFn: async (selectedEmail: string) =>
      api<{ user: SessionUser }>("/api/auth/sign-in", {
        method: "POST",
        body: JSON.stringify({ email: selectedEmail }),
      }),
    onSuccess: (data) => {
      setSessionUser(data.user);
      navigate("/", { replace: true });
    },
    onError: (err) => {
      setError(err instanceof ApiError ? err.message : "Could not sign in.");
    },
  });

  const handleSubmit = (e: React.FormEvent): void => {
    e.preventDefault();
    setError(null);
    if (email) signIn.mutate(email);
  };

  return (
    <div className="min-h-full flex items-center justify-center px-6">
      <div className="w-full max-w-sm">
        <h1 className="text-xl font-medium tracking-tight">Sign in</h1>
        <p className="text-sm text-muted mt-1 mb-8">
          Pick the interviewer you are signing in as.
        </p>

        <form onSubmit={handleSubmit} className="space-y-5">
          {allowed.isLoading && <div className="text-muted text-sm">Loading users.</div>}
          {allowed.isError && (
            <div className="text-red-700 text-sm">
              Could not load the allowed user list. Check the backend.
            </div>
          )}
          {allowed.data && allowed.data.users.length === 0 && (
            <div className="text-red-700 text-sm">
              No allowed users configured. Add one to ALLOWED_USERS in .env, then restart the backend.
            </div>
          )}
          {allowed.data && allowed.data.users.length > 0 && (
            <label className="block">
              <span className="text-sm text-muted block mb-2">Interviewer</span>
              <select
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full border border-rule rounded-md px-3 py-2 bg-white"
              >
                {allowed.data.users.map((u) => (
                  <option key={u.email} value={u.email}>
                    {u.name} ({u.email})
                  </option>
                ))}
              </select>
            </label>
          )}

          {error && <div className="text-red-700 text-sm">{error}</div>}

          <button
            type="submit"
            disabled={!email || signIn.isPending}
            className="w-full bg-ink text-paper rounded-md py-2 text-sm font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
          >
            {signIn.isPending ? "Signing in." : "Sign in"}
          </button>
        </form>
      </div>
    </div>
  );
};
