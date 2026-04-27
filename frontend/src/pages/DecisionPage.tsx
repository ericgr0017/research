import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScheduledMeeting, SessionUser } from "@zai/shared";
import { useEffect, useState } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client.js";
import { useTestMode } from "../api/session.js";
import { AppHeader } from "../components/AppHeader.js";

interface DecisionState {
  transcript?: string;
  elapsed_seconds?: number;
}

interface OutcomeResult {
  meeting_id: string;
  decision: "Send Invitation" | "Do Not Send";
  fully_succeeded: boolean;
  retry_id?: number;
  steps: Array<{ step: string; ok: boolean; error?: string }>;
}

interface TodayResponse {
  interviewer: SessionUser;
  meetings: ScheduledMeeting[];
}

const PROD_COOLDOWN_SECONDS = 60;
const TEST_COOLDOWN_SECONDS = 5;

export const DecisionPage = (): React.ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const qc = useQueryClient();
  const testMode = useTestMode();

  const state = (location.state ?? {}) as DecisionState;
  const transcript = state.transcript ?? "";

  const cooldownStart = testMode ? TEST_COOLDOWN_SECONDS : PROD_COOLDOWN_SECONDS;
  const [cooldown, setCooldown] = useState(cooldownStart);
  const [notes, setNotes] = useState("");
  const [result, setResult] = useState<OutcomeResult | null>(null);

  const meeting = useQuery<ScheduledMeeting>({
    queryKey: ["meeting", id],
    queryFn: () => api<ScheduledMeeting>(`/api/meetings/${id}`),
    enabled: Boolean(id),
  });

  // Countdown
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setInterval(() => setCooldown((c) => Math.max(0, c - 1)), 1000);
    return () => clearInterval(t);
  }, [cooldown]);

  const decide = useMutation({
    mutationFn: async (decision: "Send Invitation" | "Do Not Send") =>
      api<OutcomeResult>(`/api/meetings/${id}/decision`, {
        method: "POST",
        body: JSON.stringify({ decision, transcript, notes: notes || null }),
      }),
    onSuccess: async (data) => {
      setResult(data);
      // Refresh the queue and auto-advance to the next pending meeting.
      await qc.invalidateQueries({ queryKey: ["meetings", "today"] });
      const fresh = qc.getQueryData<TodayResponse>(["meetings", "today"]);
      // Wait a beat so the operator sees the result line, then advance.
      setTimeout(() => {
        const next = fresh?.meetings?.[0];
        if (next && next.id !== id) {
          navigate(`/call/${next.id}`, { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1200);
    },
  });

  const buttonsDisabled = cooldown > 0 || decide.isPending || Boolean(result);

  const schoolName = meeting.data?.school?.name ?? "the advisory community";

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader />
      <main className="flex-1 flex items-center justify-center px-10 py-10">
        <div className="w-full max-w-2xl">
          {meeting.data && (
            <div className="text-sm text-muted mb-6">
              {meeting.data.contact.name}
              {meeting.data.contact.title ? `, ${meeting.data.contact.title}` : ""}
              {meeting.data.contact.company ? `, ${meeting.data.contact.company}` : ""}
            </div>
          )}

          <h2 className="text-2xl font-medium tracking-tight leading-snug">
            Was this person substantive, professional, and a fit for{" "}
            {schoolName}?
          </h2>

          <div className="mt-10">
            <label className="block text-xs uppercase tracking-wider text-muted mb-2">
              Notes (optional)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Anything worth recording for the team. Saved either way."
              className="w-full border border-rule rounded-md p-3 text-sm bg-white resize-none"
              rows={3}
              disabled={Boolean(result)}
            />
          </div>

          <div className="mt-8 grid grid-cols-2 gap-4">
            <button
              onClick={() => decide.mutate("Send Invitation")}
              disabled={buttonsDisabled}
              className="bg-emerald-700 text-white rounded-md py-5 text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Send invitation
            </button>
            <button
              onClick={() => decide.mutate("Do Not Send")}
              disabled={buttonsDisabled}
              className="bg-stone-300 text-ink rounded-md py-5 text-base font-medium hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              Do not send
            </button>
          </div>

          <div className="mt-5 text-center text-sm text-muted h-5">
            {cooldown > 0 && !result && (
              <span>Buttons enable in {cooldown}s.</span>
            )}
            {decide.isPending && <span>Processing.</span>}
            {decide.isError && (
              <span className="text-red-700">
                {(decide.error as ApiError).message}
              </span>
            )}
            {result && (
              <span>
                {result.fully_succeeded
                  ? "Done. Moving to the next meeting."
                  : `Saved with warnings (retry id ${result.retry_id}). Moving on.`}
              </span>
            )}
          </div>

          {!result && (
            <div className="mt-8 text-center">
              <button
                onClick={() => navigate(`/call/${id}`)}
                className="text-xs text-muted hover:text-ink"
              >
                Back to call
              </button>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};
