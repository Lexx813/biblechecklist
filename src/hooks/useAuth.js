import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { authApi } from "../api/auth";

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
    mutationFn: ({ email, password }) => authApi.login(email, password),
    onSuccess: (session) => {
      queryClient.setQueryData(["session"], session);
    },
  });
}

export function useRegister() {
  return useMutation({
    mutationFn: ({ email, password, displayName }) => authApi.register(email, password, displayName),
    // session is set via onAuthStateChange if confirmation is disabled;
    // if confirmation is required the component shows a message instead
  });
}

export function useResetPassword() {
  return useMutation({
    mutationFn: (email) => authApi.resetPassword(email),
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
