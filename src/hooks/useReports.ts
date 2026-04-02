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
    mutationFn: ({ reporterId, contentType, contentId, contentPreview, reason }: {
      reporterId: string;
      contentType: string;
      contentId: string;
      contentPreview: string;
      reason: string;
    }) => reportsApi.submit(reporterId, contentType, contentId, contentPreview, reason),
  });
}

export function useUpdateReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, status }: { reportId: string; status: string }) =>
      reportsApi.updateStatus(reportId, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReport() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reportId: string) => reportsApi.delete(reportId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}

export function useDeleteReportedContent() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ reportId, contentType, contentId }: { reportId: string; contentType: string; contentId: string }) =>
      reportsApi.deleteContent(contentType as any, contentId)
        .then(() => reportsApi.delete(reportId)),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["reports"] }),
  });
}
