import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { adminApi } from "../api/admin";
import { profileApi } from "../api/profile";

export function useProfile(userId) {
  return useQuery({
    queryKey: ["profile", userId],
    queryFn: () => adminApi.getProfile(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: adminApi.listUsers,
  });
}

export function useDeleteUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (userId) => adminApi.deleteUser(userId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useSetAdmin() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, value }) => adminApi.setAdmin(userId, value),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}

export function useFullProfile(userId) {
  return useQuery({
    queryKey: ["fullProfile", userId],
    queryFn: () => profileApi.get(userId),
    enabled: !!userId,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateProfile(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (updates) => profileApi.update(userId, updates),
    onSuccess: (data) => queryClient.setQueryData(["fullProfile", userId], data),
  });
}

export function useUploadAvatar(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file) => profileApi.uploadAvatar(userId, file),
    onSuccess: (avatarUrl) => {
      queryClient.setQueryData(["fullProfile", userId], (prev) =>
        prev ? { ...prev, avatar_url: avatarUrl } : prev
      );
    },
  });
}

export function useCreateUser() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ email, password }) => adminApi.createUser(email, password),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin", "users"] }),
  });
}
