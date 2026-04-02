// @ts-nocheck
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { quizApi } from "../api/quiz";
import { badgesApi } from "../api/badges";

export function useQuizProgress(userId) {
  return useQuery({
    queryKey: ["quiz", "progress", userId],
    queryFn: () => quizApi.getUserProgress(userId),
    enabled: !!userId,
    staleTime: 10 * 60_000,
  });
}

export function useQuizQuestions(level) {
  const { i18n } = useTranslation();
  const lang = i18n.language.split("-")[0];
  return useQuery({
    queryKey: ["quiz", "questions", level, lang],
    queryFn: () => quizApi.getQuestionsForLevel(level, lang),
    enabled: !!level,
    staleTime: 0, // always fresh for randomization
    gcTime: 0,
  });
}

export function useSubmitQuiz(userId) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ level, score }) => quizApi.submitResult(userId, level, score),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["quiz", "progress", userId] });
      if (userId) {
        // Fetch fresh progress to check if all 12 levels have badge_earned
        queryClient.fetchQuery({
          queryKey: ["quiz", "progress", userId],
          queryFn: () => quizApi.getUserProgress(userId),
          staleTime: 0,
        }).then((progress) => {
          const allLevelsDone = (progress ?? []).filter(p => p.badge_earned).length === 12;
          if (allLevelsDone) badgesApi.awardBadge(userId, "quiz_all_levels");
        }).catch(() => {});
      }
    },
  });
}

export function useInitQuizProgress(userId) {
  return useMutation({
    mutationFn: () => quizApi.initProgress(userId),
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
    mutationFn: ({ level, question, options, correctIndex }) =>
      quizApi.createQuestion(level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}

export function useUpdateQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, level, question, options, correctIndex }) =>
      quizApi.updateQuestion(id, level, question, options, correctIndex),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}

export function useDeleteQuizQuestion() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id) => quizApi.deleteQuestion(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["quiz"] }),
  });
}
