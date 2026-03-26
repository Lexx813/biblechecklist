import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { reportsApi } from "../api/reports";

export function useReports() {
  return useQuery({
    queryKey: ["reports"],
    queryFn: reportsApi.getAll,
    staleTime: 30 * 1000,
  });
}

export function useSubmitReport() {
  return useMutation({
    mutationFn: ({ reporterId, contentType, contentId, contentPreview, reason }) =>
      reportsApi.submit(reporterId, contentType, contentId, contentPreview, reason),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status }) => reportsApi.updateStatus(reportId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId) => reportsApi.delete(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReportedContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, contentType, contentId }) =>
      reportsApi.deleteContent(contentType, contentId)
        .then(() => reportsApi.delete(reportId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}
