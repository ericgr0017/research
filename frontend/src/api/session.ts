import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { SessionUser } from "@zai/shared";
import { api } from "./client.js";

export interface WhoamiResponse {
  user: SessionUser | null;
  test_mode: boolean;
}

export const useTestMode = (): boolean => {
  const whoami = useWhoami();
  return whoami.data?.test_mode ?? false;
};

export const WHOAMI_KEY = ["whoami"] as const;

export const useWhoami = () =>
  useQuery<WhoamiResponse>({
    queryKey: WHOAMI_KEY,
    queryFn: () => api<WhoamiResponse>("/api/auth/whoami"),
    staleTime: 5 * 60 * 1000,
  });

export const useSetSessionUser = (): ((user: SessionUser | null) => void) => {
  const qc = useQueryClient();
  return (user) =>
    qc.setQueryData<WhoamiResponse>(WHOAMI_KEY, (prev) => ({
      user,
      test_mode: prev?.test_mode ?? false,
    }));
};
