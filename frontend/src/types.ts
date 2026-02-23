// ─────────────────────────────────────────────────────────────
//  Shared Types
// ─────────────────────────────────────────────────────────────

export interface QuizInfo {
  title: string;
  theme_color: string;
  total_questions: number;
  /** Path to custom icon shown on the welcome page (e.g. "/images/welcome.png") */
  welcome_image?: string | null;
  /** Path to custom icon shown on the finished page (e.g. "/images/finished.png") */
  finished_image?: string | null;
}

export type QuizStatusType = "waiting" | "active" | "paused" | "finished";

export interface QuizStatus {
  status: QuizStatusType;
  current_question: number | null;
}

export interface Choice {
  id: string;
  image?: string;
  label: string;
}

export interface Question {
  available: boolean;
  accepting_answers: boolean;
  id: number;
  question_number: number;
  total_questions: number;
  title: string;
  body: string;
  choices: Choice[];
  status?: QuizStatusType;
  current_question?: number | null;
}

export interface UserAnswer {
  choice_id: string;
  is_correct: boolean;
  timestamp: string;
  correct_answer?: string;
  question_title?: string;
}

export interface MyResults {
  correct_count: number;
  total_questions: number;
  answers: Record<string, UserAnswer>;
  /** All questions in order, used to display unanswered questions too */
  questions?: Array<{ id: number; title: string }>;
}

// Admin types
export interface ParticipantResult {
  user_id: string;
  name: string;
  correct_count: number;
  total_answered: number;
  answers: Record<string, { choice_id: string; is_correct: boolean }>;
}

export interface AdminResults {
  participants: ParticipantResult[];
  total_questions: number;
  questions: Array<{ id: number; title: string }>;
}

// WebSocket messages
export interface WsQuizState {
  type: "quiz_state";
  status: QuizStatusType;
  current_question: number | null;
}

export interface WsAnswerUpdate {
  type: "answer_update";
  question_id: number;
}

export interface WsReset {
  type: "quiz_reset";
  status: "waiting";
  current_question: null;
}

export type WsMessage = WsQuizState | WsAnswerUpdate | WsReset;
