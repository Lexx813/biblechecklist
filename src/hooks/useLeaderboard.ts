import { useQuery } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";

export function useReadingLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "reading"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_reading_leaderboard", { p_limit: 20 });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useQuizLeaderboard() {
  return useQuery({
    queryKey: ["leaderboard", "quiz"],
    queryFn: async () => {
      const { data, error } = await supabase.rpc("get_quiz_leaderboard", { p_limit: 20 });
      if (error) throw new Error(error.message);
      return data ?? [];
    },
    staleTime: 5 * 60 * 1000,
  });
}
