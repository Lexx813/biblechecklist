import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignApi, Campaign, SegmentConfig } from "../api/campaigns";

export function useCampaigns() {
  return useQuery({
    queryKey: ["campaigns"],
    queryFn: campaignApi.list,
    staleTime: 30 * 1000,
  });
}

export function useCampaign(id: string | null) {
  return useQuery({
    queryKey: ["campaign", id],
    queryFn: () => campaignApi.get(id!),
    enabled: !!id,
    staleTime: 30 * 1000,
  });
}

export function useCreateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.create,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUpdateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Partial<Campaign> }) =>
      campaignApi.update(id, payload),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["campaigns"] });
      queryClient.invalidateQueries({ queryKey: ["campaign", id] });
    },
  });
}

export function useDeleteCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.remove,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useDuplicateCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.duplicate,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useAudienceEstimate(segmentConfig: SegmentConfig, enabled = true) {
  return useQuery({
    queryKey: ["audienceEstimate", segmentConfig],
    queryFn: () => campaignApi.estimateAudience(segmentConfig),
    enabled,
    staleTime: 60 * 1000,
  });
}

export function useCampaignSends(campaignId: string, page = 0) {
  return useQuery({
    queryKey: ["campaignSends", campaignId, page],
    queryFn: () => campaignApi.getSends(campaignId, page),
    staleTime: 30 * 1000,
  });
}

export function useCampaignStats(campaignId: string) {
  return useQuery({
    queryKey: ["campaignStats", campaignId],
    queryFn: () => campaignApi.getSendStats(campaignId),
    staleTime: 30 * 1000,
  });
}

export function useCampaignTimeline(campaignId: string) {
  return useQuery({
    queryKey: ["campaignTimeline", campaignId],
    queryFn: () => campaignApi.getDailyTimeline(campaignId),
    staleTime: 30 * 1000,
  });
}

export function useSendCampaign() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: campaignApi.sendNow,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["campaigns"] }),
  });
}

export function useUserTags(userId: string) {
  return useQuery({
    queryKey: ["userTags", userId],
    queryFn: () => campaignApi.listUserTags(userId),
    staleTime: 60 * 1000,
  });
}

export function useAddUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ tag, createdBy }: { tag: string; createdBy: string }) =>
      campaignApi.addUserTag(userId, tag, createdBy),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userTags", userId] }),
  });
}

export function useRemoveUserTag(userId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (tag: string) => campaignApi.removeUserTag(userId, tag),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["userTags", userId] }),
  });
}

export function useDistinctTags() {
  return useQuery({
    queryKey: ["distinctTags"],
    queryFn: campaignApi.listDistinctTags,
    staleTime: 5 * 60 * 1000,
  });
}
