import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { quizApi } from "../api/quiz";
import { badgesApi } from "../api/badges";
import { notificationsApi } from "../api/notifications";

const LEVEL_BADGES: Record<number, string> = {
  1: "📖", 2: "📚", 3: "🌱", 4: "👨‍👩‍👦", 5: "🏺", 6: "⚔️",
  7: "🎵", 8: "📯", 9: "🕊️", 10: "🌍", 11: "🔮", 12: "👑",
  25: "⚖️", 26: "📜", 27: "🏛️", 28: "🌾", 29: "✨", 30: "🔭",
  31: "🏰", 32: "⛪", 33: "🗺️", 34: "👩", 35: "📐", 36: "🔗",
};

export function useQuizProgress(userId: string | undefined) {
  return useQuery({
    queryKey: ["quiz", "progress", userId],
    queryFn: () => quizApi.getUserProgress(userId!),
    enabled: !!userId,
    staleTime: 10 * 60_000,
  });
}

export function useQuizQuestions(level: number | undefined) {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  return useQuery({
    queryKey: ["quiz", "questions", level, lang],
    queryFn: () => quizApi.getQuestionsForLevel(level!, lang),
    enabled: !!level,
    staleTime: 0, // always fresh for randomization
    gcTime: 0,
  });
}

export function useSubmitQuiz(userId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, score }: { level: number; score: number }) =>
      quizApi.submitResult(userId!, level, score),
    onSuccess: (data: { badge_earned?: boolean; next_unlocked?: boolean } | null, { level }) => {
      queryClient.invalidateQueries({ queryKey: ["quiz", "progress", userId] });
      if (userId) {
        // Fire badge earned notification immediately
        if (data?.badge_earned) {
          const emoji = LEVEL_BADGES[level] ?? "🏅";
          notificationsApi.create(userId, userId, "badge_earned", {
            preview: `${emoji} Level ${level} badge earned! Perfect score!`,
            linkHash: "quiz",
          }).catch(() => {});
        }

        // Check milestone badges after progress refreshes
        queryClient.fetchQuery({
          queryKey: ["quiz", "progress", userId],
          queryFn: () => quizApi.getUserProgress(userId),
          staleTime: 0,
        }).then((progress: Array<{ badge_earned: boolean; level: number }>) => {
          const basicDone = (progress ?? []).filter(p => p.badge_earned && p.level >= 1 && p.level <= 12).length === 12;
          if (basicDone) badgesApi.awardBadge(userId, "quiz_all_levels");
          const advancedDone = (progress ?? []).filter(p => p.badge_earned && p.level >= 25 && p.level <= 36).length === 12;
          if (advancedDone) badgesApi.awardBadge(userId, "quiz_advanced_all_levels");
        }).catch(() => {});
      }
    },
  });
}

export function useInitQuizProgress(userId: string | undefined, startLevel = 1) {
  return useMutation({
    mutationFn: () => quizApi.initProgress(userId!, startLevel),
  });
}

export function useAllQuizQuestions() {
  return useQuery({
    queryKey: ["quiz", "admin", "questions"],
    queryFn: quizApi.getAllQuestions,
    staleTime: 0,
  });
}

export function useCreateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, question, options, correctIndex }: { level: number; question: string; options: string[]; correctIndex: number }) =>
      quizApi.createQuestion(level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}

export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level, question, options, correctIndex }: { id: string; level: number; question: string; options: string[]; correctIndex: number }) =>
      quizApi.updateQuestion(id, level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => quizApi.deleteQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}
