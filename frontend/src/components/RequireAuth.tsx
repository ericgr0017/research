import { Navigate, Outlet } from "react-router-dom";
import { useWhoami } from "../api/session.js";

export const RequireAuth = (): React.ReactElement => {
  const whoami = useWhoami();

  if (whoami.isLoading) {
    return <div className="px-10 py-8 text-muted">Loading.</div>;
  }
  if (!whoami.data?.user) {
    return <Navigate to="/sign-in" replace />;
  }
  return <Outlet />;
};
