// src/types/index.ts

export interface UserCreate {
  email?: string | null;
  password?: string;
  username?: string;
}

export interface UserResponse {
  id: number;
  email?: string | null;
  username?: string;
  is_active?: boolean;
  created_at?: string;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

// ==========================================
// NEW: WRONG QUESTIONS TYPES
// ==========================================

export type QuestionStatusEnum = 'new' | 'reviewing' | 'mastered' | 'removed';
export type QuestionTypeEnum = 'choice' | 'fill' | 'solution' | 'other';
export type ErrorReasonEnum = 'careless' | 'concept_gap' | 'logic_error' | 'time_limit' | 'other';
export type ReviewResultEnum = 'correct' | 'wrong' | 'hint_used';

export interface WrongQuestionCreate {
  subject_id: number;
  question_text: string;
  question_images?: string[] | null;
  options_json?: string[] | Record<string, unknown> | null;
  correct_answer?: string | null;
  user_answer?: string | null;
  question_type?: QuestionTypeEnum;
  source_info?: string | null;
  error_reason_type?: ErrorReasonEnum | null;
  error_reason_detail?: string | null;
  difficulty_level?: number;
  knowledge_point_ids?: number[];
}

export interface WrongQuestionResponse {
  id: number;
  subject_id: number;
  question_text: string;
  question_images?: string[] | null;
  options_json?: string[] | Record<string, unknown> | null;
  correct_answer?: string | null;
  user_answer?: string | null;
  question_type: QuestionTypeEnum;
  source_info?: string | null;
  error_reason_type?: ErrorReasonEnum | null;
  error_reason_detail?: string | null;
  status: QuestionStatusEnum;
  difficulty_level: number;
  mistake_count: number;
  last_reviewed_at?: string | null;
  next_review_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface PaginatedWrongQuestionResponse {
  data: WrongQuestionResponse[];
  total: number;
  page: number;
  size: number;
}

export interface ReviewRecordCreate {
  question_id: number;
  result: ReviewResultEnum;
  time_spent_seconds?: number | null;
  notes?: string | null;
}