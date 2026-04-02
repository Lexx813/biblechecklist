import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import type { UserIdentity } from "@supabase/supabase-js";
import { authApi } from "../api/auth";

export function useIdentities() {
  return useQuery({
    queryKey: ["identities"],
    queryFn: authApi.getIdentities,
    staleTime: 1000 * 60 * 5,
  });
}

export function useLinkGoogle() {
  return useMutation({
    meta: { silent: true },
    mutationFn: authApi.linkGoogle,
  });
}

export function useUnlinkGoogle() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true },
    mutationFn: (identity: UserIdentity) => authApi.unlinkGoogle(identity),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["identities"] }),
  });
}

export function useSession() {
  return useQuery({
    queryKey: ["session"],
    queryFn: authApi.getSession,
    staleTime: Infinity, // kept fresh by the onAuthStateChange listener in App
    retry: false,
  });
}

export function useLogin() {
  const queryClient = useQueryClient();
  return useMutation({
    meta: { silent: true }, // AuthPage shows inline error — no toast needed
    mutationFn: ({ email, password }: { email: string; password: string }) =>
      authApi.login(email, password),
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
    },
  });
}

export function useRegister() {
  return useMutation({
    meta: { silent: true }, // AuthPage shows inline error — no toast needed
    mutationFn: ({ email, password, displayName }: { email: string; password: string; displayName: string }) =>
      authApi.register(email, password, displayName),
    // session is set via onAuthStateChange if confirmation is disabled;
    // if confirmation is required the component shows a message instead
  });
}

export function useResetPassword() {
  return useMutation({
    meta: { silent: true }, // AuthPage shows inline error — no toast needed
    mutationFn: (email: string) => authApi.resetPassword(email),
  });
}

export function useUpdatePassword() {
  return useMutation({
    meta: { silent: true },
    mutationFn: (newPassword: string) => authApi.updatePassword(newPassword),
  });
}

export function useLogout() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: authApi.logout,
    onSuccess: () => {
      queryClient.setQueryData(["session"], null);
    },
  });
}
