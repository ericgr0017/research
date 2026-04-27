import { useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { api } from "../api/client.js";
import { useSetSessionUser, useWhoami } from "../api/session.js";

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
  const setSessionUser = useSetSessionUser();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const user = whoami.data?.user ?? null;

  const handleSignOut = async (): Promise<void> => {
    await api("/api/auth/sign-out", { method: "POST" });
    setSessionUser(null);
    qc.removeQueries({ queryKey: ["meetings"] });
    navigate("/sign-in", { replace: true });
  };

  return (
    <header className="border-b border-rule px-10 py-5">
      <div className="flex items-baseline justify-between gap-8">
        <div>
          <div className="text-xs uppercase tracking-wider text-muted">{todayLabel()}</div>
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
