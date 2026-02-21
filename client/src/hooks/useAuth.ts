import { trpc } from "@/lib/trpc";
import { useCallback, useMemo } from "react";

export function useAuth() {
  const utils = trpc.useUtils();

  const meQuery = trpc.auth.me.useQuery(undefined, {
    retry: false,
    refetchOnWindowFocus: false,
  });

  const logout = useCallback(async () => {
    // Navigate to the logout endpoint which clears the cookie and redirects
    window.location.href = "/api/auth/logout";
  }, []);

  const refresh = useCallback(() => {
    return meQuery.refetch();
  }, [meQuery]);

  const state = useMemo(
    () => ({
      user: meQuery.data ?? null,
      loading: meQuery.isLoading,
      isAuthenticated: Boolean(meQuery.data),
    }),
    [meQuery.data, meQuery.isLoading]
  );

  return {
    ...state,
    logout,
    refresh,
  };
}
