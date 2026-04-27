import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useSetSessionUser, useTestMode, useWhoami } from "../api/session.js";

interface HeaderProps {
  scheduledCount?: number;
  completedCount?: number;
  onRefresh?: () => void;
}

const todayLabel = (): string =>
  new Date().toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });

export const AppHeader = ({
  scheduledCount,
  completedCount,
  onRefresh,
}: HeaderProps): React.ReactElement => {
  const whoami = useWhoami();
  const testMode = useTestMode();
  const setSessionUser = useSetSessionUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = whoami.data?.user ?? null;

  const handleSignOut = async (): Promise<void> => {
    try {
      await api("/api/auth/sign-out", { method: "POST" });
    } catch {
      // Sign-out failures shouldn't trap the user. Continue with local cleanup.
    }
    setSessionUser(null);
    qc.removeQueries({ queryKey: ["meetings"] });
    navigate("/sign-in", { replace: true });
  };

  return (
    <header className="border-b border-rule px-10 py-5">
      <div className="flex items-baseline justify-between gap-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted flex items-center gap-3">
            <span>{todayLabel()}</span>
            {testMode && (
              <span className="px-2 py-0.5 bg-amber-100 text-amber-900 rounded text-[10px] tracking-wider">
                TEST MODE
              </span>
            )}
          </div>
          <h1 className="text-lg font-medium tracking-tight mt-1">
            Research Interview Console
          </h1>
        </div>
        <div className="flex items-center gap-6 text-sm">
          {typeof scheduledCount === "number" && (
            <div className="text-muted">
              <span className="text-ink font-medium">{scheduledCount}</span> scheduled
              <span className="mx-2 text-rule">|</span>
              <span className="text-ink font-medium">{completedCount ?? 0}</span> completed
            </div>
          )}
          {onRefresh && (
            <button
              onClick={onRefresh}
              className="text-sm text-muted hover:text-ink transition-colors"
            >
              Refresh
            </button>
          )}
          {user && (
            <div className="flex items-center gap-3">
              <span className="text-muted">{user.name}</span>
              <button
                onClick={handleSignOut}
                className="text-sm text-muted hover:text-ink transition-colors"
              >
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
};
