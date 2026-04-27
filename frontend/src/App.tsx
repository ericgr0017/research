import { useQuery } from "@tanstack/react-query";
import type { ScheduledMeeting } from "@zai/shared";

interface TodayResponse {
  interviewer_id: string;
  meetings: ScheduledMeeting[];
}

interface HealthResponse {
  status: string;
  test_mode: boolean;
  allowed_users: number;
  time: string;
}

const formatTime = (iso: string): string =>
  new Date(iso).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });

export const App = (): React.ReactElement => {
  const health = useQuery<HealthResponse>({
    queryKey: ["health"],
    queryFn: async () => {
      const res = await fetch("/health");
      if (!res.ok) throw new Error("Backend not reachable");
      return res.json();
    },
  });

  const today = useQuery<TodayResponse>({
    queryKey: ["meetings", "today"],
    queryFn: async () => {
      const res = await fetch("/api/meetings/today");
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.error ?? "Could not load meetings");
      }
      return res.json();
    },
  });

  return (
    <div className="min-h-full flex flex-col">
      <header className="border-b border-rule px-10 py-6">
        <div className="flex items-baseline justify-between">
          <h1 className="text-xl font-medium tracking-tight">
            ZAI Research Interview Console
          </h1>
          <div className="text-sm text-muted">
            {health.data ? (
              <span>
                Backend ok. Test mode {health.data.test_mode ? "on" : "off"}. {health.data.allowed_users}{" "}
                allowed user{health.data.allowed_users === 1 ? "" : "s"}.
              </span>
            ) : health.isError ? (
              <span className="text-red-700">Backend not reachable.</span>
            ) : (
              <span>Checking backend.</span>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-10 py-8 max-w-5xl w-full mx-auto">
        <section>
          <h2 className="text-base font-medium mb-1">Today&rsquo;s queue</h2>
          <p className="text-sm text-muted mb-6">
            M1 preview. The real Daily Queue lands in M2.
          </p>

          {today.isLoading && <p className="text-muted">Loading.</p>}

          {today.isError && (
            <p className="text-red-700">{(today.error as Error).message}</p>
          )}

          {today.data && today.data.meetings.length === 0 && (
            <p className="text-muted">
              No interviews scheduled today. Check back tomorrow or contact Stephene.
            </p>
          )}

          {today.data && today.data.meetings.length > 0 && (
            <ul className="divide-y divide-rule border border-rule rounded-md bg-white">
              {today.data.meetings.map((m) => (
                <li key={m.id} className="px-5 py-4 flex items-center gap-6">
                  <div className="text-sm font-mono text-muted w-20">
                    {formatTime(m.scheduled_time)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium">{m.contact.name}</div>
                    <div className="text-sm text-muted">
                      {m.contact.title}
                      {m.contact.company ? `, ${m.contact.company}` : ""}
                    </div>
                    {m.research_topic && (
                      <div className="text-sm mt-1">{m.research_topic}</div>
                    )}
                    {m.school && (
                      <div className="text-xs text-muted mt-1">{m.school.name}</div>
                    )}
                  </div>
                  <div className="text-xs text-muted">
                    {m.has_brief ? "Brief ready" : "Brief pending"}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
};
