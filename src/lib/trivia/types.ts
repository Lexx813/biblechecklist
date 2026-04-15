export type TeamId = "A" | "B";
export type RoomStatus = "lobby" | "playing" | "finished";
export type Difficulty = "easy" | "medium" | "hard";

export interface TriviaRoom {
  id: string;
  room_code: string;
  host_id: string | null;
  status: RoomStatus;
  current_question_index: number;
  current_team: TeamId;
  team_a_score: number;
  team_b_score: number;
  time_limit_seconds: number;
  question_count: number;
  allow_custom: boolean;
  player_count: number;
  selected_question_ids: string[];
  pending_next: boolean;
  last_answer_index: number | null;
  has_timer: boolean;
  points_to_win: number;
  created_at: string;
  updated_at: string;
}

export interface TriviaPlayer {
  id: string;
  room_id: string;
  user_id: string | null;
  display_name: string;
  team: TeamId;
  is_host: boolean;
  avatar_url: string | null;
  joined_at: string;
}

export interface TriviaQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  book_reference: string | null;
  difficulty: Difficulty;
  category: string | null;
}

export interface TriviaCustomQuestion {
  id: string;
  room_id: string;
  question: string;
  options: string[];
  correct_index: number;
  created_by: string | null;
}

export interface TriviaGameLog {
  id: string;
  room_id: string;
  question_id: string;
  team: TeamId;
  is_correct: boolean;
  answered_at: string;
}

/** Unified question type used in-game (merged standard + custom) */
export interface ActiveQuestion {
  id: string;
  question: string;
  options: string[];
  correct_index: number;
  book_reference: string | null;
  difficulty: Difficulty;
  is_custom: boolean;
}

export interface AnswerResult {
  is_correct: boolean;
  correct_index: number;
  team_a_score: number;
  team_b_score: number;
  game_over: boolean;
}
