// src/types/index.ts
// Type definitions matching YanZhuShou backend API schemas

// ==========================================
// USER TYPES (from schemas/user.py)
// ==========================================

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  phone?: string;
  gender?: number; // 0:Unknown 1:Male 2:Female
}

export interface UserUpdate {
  name?: string;
  phone?: string;
  gender?: number;
}

export interface UserResponse {
  user_id: number;
  email: string;
  name: string;
  phone?: string | null;
  gender: number; // 0:Unknown 1:Male 2:Female
  created_at: string;
}

// ==========================================
// TOKEN TYPES (from schemas/token.py)
// ==========================================

export interface Token {
  access_token: string;
  token_type: string;
}

export interface TokenData {
  sub: string;
  user_id: number;
  exp?: number;
}

// ==========================================
// QUESTION BANK TYPES (from schemas/question.py)
// ==========================================

export interface QuestionBankCreate {
  name: string;
  is_public?: boolean;
  description?: string | null;
}

export interface QuestionBankUpdate {
  name?: string | null;
  is_public?: boolean | null;
  description?: string | null;
}

export interface QuestionBankResponse {
  bank_id: number;
  name: string;
  user_id: number;
  is_public: boolean;
  description?: string | null;
  created_at: string;
}

// ==========================================
// QUESTION TYPES (from schemas/question.py)
// ==========================================

export type QuestionTypeEnum = 0 | 1 | 2 | 3; // 0:Essay 1:Single 2:Multiple 3:Fill-in

export interface QuestionImportItem {
  category: string;
  stem: string;
  qus_type: QuestionTypeEnum;
  options?: Record<string, unknown> | null;
  correct_ans_summary?: string | null;
  full_text?: string | null;
  image_url?: string | null;
  full_answer?: string | null;
  explanation?: string | null;
}

export interface QuestionImportBatch {
  questions: QuestionImportItem[];
}

export interface QBQuestionCreate {
  bank_id?: number | null;
  category: string;
  stem: string;
  qus_type: QuestionTypeEnum;
  options?: Record<string, unknown>;
  correct_ans_summary?: string | null;
  is_public?: boolean;
}

export interface QBQuestionUpdate {
  bank_id?: number | null;
  category?: string | null;
  stem?: string | null;
  qus_type?: QuestionTypeEnum | null;
  options?: Record<string, unknown> | null;
  correct_ans_summary?: string | null;
  is_public?: boolean | null;
}

export interface QBQuestionResponse {
  No: number;
  bank_id?: number | null;
  category: string;
  stem: string;
  qus_type: QuestionTypeEnum;
  options: Record<string, unknown>;
  correct_ans_summary?: string | null;
  correct_num: number;
  uncorrect_num: number;
  is_public: boolean;
  user_id?: number | null;
  created_at: string;
}

// ==========================================
// STEM TEXT & ANSWER TEXT TYPES
// ==========================================

export interface StemText {
  id: number;
  question_no: number;
  full_text: string;
  image_url?: string | null;
}

export interface AnswerText {
  id: number;
  question_no: number;
  full_answer: string;
  explanation?: string | null;
}

// ==========================================
// ERROR TYPES (from FastAPI)
// ==========================================

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
  input?: unknown;
  ctx?: Record<string, unknown>;
}

export interface HTTPValidationError {
  detail: ValidationError[] | string;
}

// ==========================================
// MISTAKE NOTEBOOK TYPES (matching backend API)
// ==========================================

export type QuestionStatusEnum = 'new' | 'reviewing' | 'mastered' | 'removed';
export type QuestionTypeEnumStr = 'essay' | 'single_choice' | 'multiple_choice' | 'fill_blank';
export type ErrorReasonEnum = 'careless' | 'concept_gap' | 'logic_error' | 'time_limit' | 'other';
export type ReviewResultEnum = 'correct' | 'wrong' | 'hint_used';

/**
 * Wrong question response from the Mistake Notebook API.
 * Wrong questions are derived from user_question_logs where is_correct = false.
 */
export interface WrongQuestionResponse {
  log_id: number;  // ID from user_question_logs table
  question_no: number;  // ID from qb_questions table
  user_id: number;
  category: string;  // Subject/topic category from qb_questions
  stem: string;  // Question stem from qb_questions
  question_type: QuestionTypeEnumStr;
  source_info: string | null;  // Question bank name
  difficulty_level: number;
  user_answer: string | null;
  correct_ans_summary: string | null;
  options: Record<string, unknown> | null;
  error_reason_type: ErrorReasonEnum | null;
  error_reason_detail: string | null;
  status: QuestionStatusEnum;
  mistake_count: number;
  is_mastered: boolean;
  attempt_time: string;  // ISO datetime
  created_at: string;  // ISO datetime
}

export interface WrongQuestionUpdate {
  is_mastered?: boolean;
  error_reason_type?: ErrorReasonEnum | null;
  error_reason_detail?: string | null;
  status?: QuestionStatusEnum;
  difficulty_level?: number;
}

export interface PaginatedWrongQuestionResponse {
  data: WrongQuestionResponse[];
  total: number;
  page: number;
  size: number;
}

export interface MistakeNotebookStats {
  total_wrong: number;
  new_count: number;
  reviewing_count: number;
  mastered_count: number;
  by_category: Record<string, number>;
}

export interface ReviewRecordCreate {
  question_id: number;
  result: ReviewResultEnum;
  time_spent_seconds?: number | null;
  notes?: string | null;
}

// ==========================================
// HELPER TYPES
// ==========================================

export interface GenderOption {
  value: number;
  label: string;
}

export const GENDER_OPTIONS: GenderOption[] = [
  { value: 0, label: 'Unknown' },
  { value: 1, label: 'Male' },
  { value: 2, label: 'Female' }
];

export const QUESTION_TYPE_MAP: Record<QuestionTypeEnum, string> = {
  0: 'Essay',
  1: 'Single Choice',
  2: 'Multiple Choice',
  3: 'Fill in Blank'
};
