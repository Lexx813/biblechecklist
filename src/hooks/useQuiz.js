import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { quizApi } from "../api/quiz";

export function useQuizProgress(userId) {
  return useQuery({
    queryKey: ["quiz", "progress", userId],
    queryFn: () => quizApi.getUserProgress(userId),
    enabled: !!userId,
    staleTime: 30 * 1000,
  });
}

export function useQuizQuestions(level) {
  return useQuery({
    queryKey: ["quiz", "questions", level],
    queryFn: () => quizApi.getQuestionsForLevel(level),
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
    },
  });
}

export function useInitQuizProgress(userId) {
  return useMutation({
    mutationFn: () => quizApi.initProgress(userId),
  });
}
