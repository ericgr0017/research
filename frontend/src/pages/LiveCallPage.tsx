import { useMutation, useQuery } from "@tanstack/react-query";
import type { PrepBrief, ScheduledMeeting } from "@zai/shared";
import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { api, ApiError } from "../api/client.js";
import { useTestMode } from "../api/session.js";
import { AppHeader } from "../components/AppHeader.js";

const formatTimer = (seconds: number): string => {
  const m = Math.floor(seconds / 60).toString().padStart(2, "0");
  const s = (seconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
};

const FAKE_TRANSCRIPT_LINES = [
  "[Interviewer] Thanks for making the time today. Could you walk me through what you are working on right now?",
  "[Executive] Sure. Most of my time is on the operating side of two portfolio companies, plus one board engagement.",
  "[Interviewer] Got it. The research topic for today is...",
  "[Executive] I think the framing most people use is wrong. Let me give you a specific example from last quarter.",
  "[Interviewer] That is helpful. What did the team need from you that they were not getting before?",
  "[Executive] Honesty about the timeline. We had been pretending the change would take six months. It was always going to take eighteen.",
];

export const LiveCallPage = (): React.ReactElement => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const testMode = useTestMode();

  const [callStart] = useState<number>(() => Date.now());
  const [elapsed, setElapsed] = useState(0);
  const [currentQ, setCurrentQ] = useState(0);
  const [transcript, setTranscript] = useState("");
  const transcriptRef = useRef<HTMLTextAreaElement | null>(null);
  const callStartLoggedRef = useRef(false);

  // Count-up timer
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.floor((Date.now() - callStart) / 1000));
    }, 1000);
    return () => clearInterval(t);
  }, [callStart]);

  const meeting = useQuery<ScheduledMeeting>({
    queryKey: ["meeting", id],
    queryFn: () => api<ScheduledMeeting>(`/api/meetings/${id}`),
    enabled: Boolean(id),
  });

  const brief = useQuery<PrepBrief>({
    queryKey: ["brief", id],
    queryFn: () => api<PrepBrief>(`/api/meetings/${id}/brief`),
    enabled: Boolean(id),
    retry: 1,
    staleTime: Infinity,
  });

  const takeCall = useMutation({
    mutationFn: () =>
      api<{ meeting_id: string; call_start: string }>(
        `/api/meetings/${id}/take-call`,
        { method: "POST" },
      ),
  });

  // Fire take-call once on mount.
  useEffect(() => {
    if (id && !callStartLoggedRef.current) {
      callStartLoggedRef.current = true;
      takeCall.mutate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const handleEndCall = (): void => {
    navigate(`/call/${id}/decision`, {
      state: { transcript, elapsed_seconds: elapsed },
    });
  };

  const handleNextQuestion = (): void => {
    if (brief.data && currentQ < brief.data.questions.length - 1) {
      setCurrentQ((c) => c + 1);
    }
  };

  const handleGenerateFake = (): void => {
    setTranscript((prev) => {
      const lines = prev ? [prev] : [];
      lines.push(...FAKE_TRANSCRIPT_LINES);
      const out = lines.join("\n");
      requestAnimationFrame(() => transcriptRef.current?.scrollTo({ top: 99999 }));
      return out;
    });
  };

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader />

      <main className="flex-1 grid grid-cols-[60%_40%] min-h-0">
        <section className="border-r border-rule px-10 py-8 overflow-y-auto">
          {meeting.isLoading && <div className="text-muted">Loading meeting.</div>}
          {meeting.data && (
            <header className="mb-6">
              <h2 className="text-2xl font-medium tracking-tight">
                {meeting.data.contact.name}
              </h2>
              <div className="text-muted mt-1">
                {meeting.data.contact.title}
                {meeting.data.contact.company ? `, ${meeting.data.contact.company}` : ""}
              </div>
              {meeting.data.school && (
                <div className="text-sm text-muted mt-2">{meeting.data.school.name}</div>
              )}
              {meeting.data.research_topic && (
                <div className="text-sm mt-3 px-3 py-2 bg-white border border-rule rounded">
                  <span className="text-xs uppercase tracking-wider text-muted block mb-1">
                    Research topic
                  </span>
                  {meeting.data.research_topic}
                </div>
              )}
              {meeting.data.contact.linkedin_url && (
                <a
                  href={meeting.data.contact.linkedin_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-muted hover:text-ink underline mt-2 inline-block"
                >
                  LinkedIn profile
                </a>
              )}
            </header>
          )}

          <div className="mt-6">
            <div className="text-xs uppercase tracking-wider text-muted mb-3">Brief</div>
            {brief.isLoading && (
              <div className="text-muted">Generating brief. This usually takes a few seconds.</div>
            )}
            {brief.isError && (
              <div className="text-red-700">
                <p>{(brief.error as Error).message}</p>
                <button
                  onClick={() => brief.refetch()}
                  className="mt-2 text-sm underline hover:no-underline"
                >
                  Try again
                </button>
              </div>
            )}
            {brief.data && (
              <div className="space-y-4 text-[15px] leading-relaxed">
                {brief.data.brief_text.split(/\n\n+/).map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
              </div>
            )}
          </div>
        </section>

        <section className="px-8 py-8 flex flex-col min-h-0">
          <div>
            <div className="text-xs uppercase tracking-wider text-muted mb-3">Questions</div>
            {brief.data ? (
              <ol className="space-y-3">
                {brief.data.questions.map((q, i) => (
                  <li
                    key={i}
                    className={
                      "flex gap-3 text-sm " +
                      (i === currentQ ? "text-ink" : "text-muted")
                    }
                  >
                    <span className="font-mono w-5 shrink-0">{i + 1}.</span>
                    <span className={i === currentQ ? "font-medium" : ""}>{q}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <div className="text-muted text-sm">Waiting for brief.</div>
            )}
            {brief.data && currentQ < brief.data.questions.length - 1 && (
              <button
                onClick={handleNextQuestion}
                className="mt-4 text-sm text-muted hover:text-ink transition-colors"
              >
                Next question
              </button>
            )}
          </div>

          <div className="mt-8 flex-1 flex flex-col min-h-0">
            <div className="text-xs uppercase tracking-wider text-muted mb-2 flex items-baseline justify-between">
              <span>Transcript</span>
              {testMode && (
                <button
                  onClick={handleGenerateFake}
                  className="text-[10px] normal-case tracking-normal text-muted hover:text-ink"
                  title="Test mode helper"
                >
                  Insert fake lines
                </button>
              )}
            </div>
            <textarea
              ref={transcriptRef}
              value={transcript}
              onChange={(e) => setTranscript(e.target.value)}
              placeholder="Paste or type transcript here as the conversation goes."
              className="flex-1 min-h-[200px] w-full border border-rule rounded-md p-3 text-sm bg-white resize-none font-mono"
            />
          </div>
        </section>
      </main>

      <footer className="border-t border-rule px-10 py-4 flex items-center justify-between bg-white">
        <div className="font-mono text-lg tracking-wider">{formatTimer(elapsed)}</div>
        <button
          onClick={handleEndCall}
          className="bg-ink text-paper rounded-md px-5 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
        >
          End call
        </button>
      </footer>
    </div>
  );
};
