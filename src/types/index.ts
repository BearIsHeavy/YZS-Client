// src/types/index.ts

export interface UserCreate {
  email: string;
  password: string;
}

export interface UserResponse {
  id: number;
  email: string;
  is_active: boolean;
}

export interface Token {
  access_token: string;
  token_type: string;
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface QuestionResponse {
  id: number;
  stem: string;
  options: string[];
  correct_answer?: string | null;
  explanation?: string | null;
  knowledge_points?: string | null;
}

export interface ErrorRecordResponse {
  id: number;
  question_id: number;
  selected_option: string;
  question: QuestionResponse | null;
}