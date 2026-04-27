import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ScheduledMeeting, SessionUser } from "@zai/shared";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { AppHeader } from "../components/AppHeader.js";

interface TodayResponse {
  interviewer: SessionUser;
  scheduled_count: number;
  completed_count: number;
  pending_count: number;
  meetings: ScheduledMeeting[];
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const DailyQueuePage = (): React.ReactElement => {
  const navigate = useNavigate();
  const qc = useQueryClient();

  const today = useQuery<TodayResponse>({
    queryKey: ["meetings", "today"],
    queryFn: () => api<TodayResponse>("/api/meetings/today"),
    refetchInterval: 60_000, // auto refresh every minute
  });

  const handleRefresh = (): void => {
    void qc.invalidateQueries({ queryKey: ["meetings", "today"] });
  };

  return (
    <div className="min-h-full flex flex-col">
      <AppHeader
        scheduledCount={today.data?.scheduled_count}
        completedCount={today.data?.completed_count}
        onRefresh={handleRefresh}
      />

      <main className="flex-1 px-10 py-8 max-w-4xl w-full mx-auto">
        {today.isLoading && <p className="text-muted">Loading.</p>}

        {today.isError && (
          <div className="text-red-700">
            <p>{(today.error as Error).message}</p>
            <button
              onClick={handleRefresh}
              className="mt-3 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {today.data && today.data.meetings.length === 0 && today.data.scheduled_count === 0 && (
          <div className="text-muted">
            No interviews scheduled today. Check back tomorrow or contact Stephene.
          </div>
        )}

        {today.data && today.data.meetings.length === 0 && today.data.scheduled_count > 0 && (
          <div className="text-muted">
            All of today&rsquo;s interviews are complete. Nice work.
          </div>
        )}

        {today.data && today.data.meetings.length > 0 && (
          <ul className="space-y-3">
            {today.data.meetings.map((m) => (
              <li
                key={m.id}
                className="bg-white border border-rule rounded-lg px-6 py-5 flex items-center gap-6"
              >
                <div className="text-sm font-mono text-muted w-20 shrink-0">
                  {formatTime(m.scheduled_time)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{m.contact.name}</div>
                  <div className="text-sm text-muted">
                    {m.contact.title}
                    {m.contact.company ? `, ${m.contact.company}` : ""}
                  </div>
                  {m.research_topic && (
                    <div className="text-sm mt-2">{m.research_topic}</div>
                  )}
                  {m.school && (
                    <div className="text-xs text-muted mt-1">{m.school.name}</div>
                  )}
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <div className="text-xs text-muted">
                    {m.has_brief ? "Brief ready" : "Brief pending"}
                  </div>
                  <button
                    onClick={() => navigate(`/call/${m.id}`)}
                    className="bg-ink text-paper rounded-md px-4 py-2 text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    Take call
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
};
