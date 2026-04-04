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
  role: string;
  bio_file_path?: string | null;
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

// ==========================================
// PRACTICE & ANSWER SUBMISSION TYPES
// ==========================================

export interface PracticeQuestion {
  question_no: number;
  category: string;
  stem: string;
  question_type: string;
  options: Record<string, unknown> | null;
  difficulty_level: number;
}

export interface PracticeSessionResponse {
  bank_id: number;
  bank_name: string;
  questions: PracticeQuestion[];
  total_questions: number;
}

export interface AnswerSubmitResponse {
  is_correct: boolean;
  question_no: number;
  correct_answer: string;
  user_answer: string;
  explanation: string | null;
  log_id: number;
  is_first_wrong: boolean;
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

// ==========================================
// FEEDBACK / COMMENT TYPES (from schemas/feedback.py)
// ==========================================

export type FeedbackCategoryEnum = 'bug' | 'feature' | 'ui' | 'performance' | 'documentation' | 'other';
export type FeedbackStatusEnum = 'pending' | 'in_progress' | 'completed' | 'rejected';

export interface FeedbackCreate {
  content: string;
  category?: FeedbackCategoryEnum;
}

export interface FeedbackUpdate {
  status?: FeedbackStatusEnum | null;
  developer_response?: string | null;
}

export interface FeedbackUserResponse {
  user_id: number;
  name: string;
}

export interface FeedbackResponse {
  id: number;
  user_id: number;
  content: string;
  category: FeedbackCategoryEnum;
  status: FeedbackStatusEnum;
  vote_count: number;
  developer_response: string | null;
  responded_at: string | null;
  resolved_at: string | null;
  created_at: string;
  updated_at: string;
  author?: FeedbackUserResponse | null;
  has_voted: boolean;
}

export interface FeedbackListResponse {
  items: FeedbackResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface FeedbackStats {
  total_count: number;
  by_status: Record<string, number>;
  by_category: Record<string, number>;
  top_voted: Record<string, unknown>[];
}

export interface FeedbackVoteResponse {
  has_voted: boolean;
  vote_count: number;
}

export interface FeedbackSubmissionStatus {
  can_submit: boolean;
  next_submission_at: string | null;
  message: string;
}

export const FEEDBACK_CATEGORY_LABELS: Record<FeedbackCategoryEnum, string> = {
  bug: 'Bug',
  feature: 'Feature Request',
  ui: 'UI/UX',
  performance: 'Performance',
  documentation: 'Documentation',
  other: 'Other'
};

export const FEEDBACK_STATUS_LABELS: Record<FeedbackStatusEnum, string> = {
  pending: 'Pending',
  in_progress: 'In Progress',
  completed: 'Completed',
  rejected: 'Rejected'
};

export const FEEDBACK_STATUS_COLORS: Record<FeedbackStatusEnum, string> = {
  pending: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-blue-100 text-blue-800',
  completed: 'bg-green-100 text-green-800',
  rejected: 'bg-red-100 text-red-800'
};

// ==========================================
// BLOG TYPES (from schemas/blog.py)
// ==========================================

export type ContentTypeEnum = 'markdown' | 'html';

export interface BlogUserResponse {
  user_id: number;
  name: string;
}

export interface BlogCreate {
  title: string;
  content: string;
  content_type?: ContentTypeEnum;
  is_published?: boolean;
}

export interface BlogUpdate {
  title?: string | null;
  content?: string | null;
  content_type?: ContentTypeEnum | null;
  is_published?: boolean | null;
  tags?: string[] | null;  // Array of tag names
}

export interface BlogListItem {
  blog_id: number;
  user_id: number;
  title: string;
  content_type: string;
  is_published: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: BlogUserResponse | null;
  has_liked: boolean;
  tags?: BlogTagResponse[];
}

export interface BlogResponse {
  blog_id: number;
  user_id: number;
  title: string;
  content: string;
  content_type: string;
  is_published: boolean;
  view_count: number;
  like_count: number;
  comment_count: number;
  created_at: string;
  updated_at: string;
  author?: BlogUserResponse | null;
  has_liked: boolean;
  tags?: BlogTagResponse[];
}

export interface BlogListResponse {
  items: BlogListItem[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BlogStats {
  total_posts: number;
  total_views: number;
  total_likes: number;
  total_comments: number;
  my_posts?: number;
  my_drafts?: number;
}

export interface BlogLikeResponse {
  has_liked: boolean;
  like_count: number;
}

// ==========================================
// BLOG COMMENT TYPES
// ==========================================

export interface BlogCommentCreate {
  content: string;
  parent_id?: number | null;
}

export interface BlogCommentResponse {
  comment_id: number;
  blog_id: number;
  user_id: number;
  parent_id: number | null;
  content: string;
  is_deleted: boolean;
  created_at: string;
  updated_at: string;
  author?: BlogUserResponse | null;
  replies: BlogCommentResponse[];
}

export interface BlogCommentListResponse {
  items: BlogCommentResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// ==========================================
// USER BIO TYPES (from schemas/user.py)
// ==========================================

export interface BioFileResponse {
  file_path: string;
  file_name: string;
  uploaded_at: string;
}

// ==========================================
// BLOG TAG TYPES (from schemas/blog.py)
// ==========================================

export interface BlogContentResponse {
  content: string;
}

export interface BlogTagResponse {
  tag_id: number;
  name: string;
}

export interface BlogTagListResponse {
  items: BlogTagResponse[];
  total: number;
}

// ==========================================
// SCHOOL INFO TYPES (from schemas/school.py)
// ==========================================

export interface SchoolInfoResponse {
  school_name: string;
  college_name: string;
  major_name: string;
  direction_name: string;
  id: string;
  city: string;
  region: number;
  school_code: string;
  college_code: string;
  major_code: string;
  direction_code: string;
  adjustment_count: number;
  create_time: string;
  remarks: string | null;
  cutoff_score: string | null;
  contact_phone: string | null;
  supervisor_name: string | null;
  supervisor_contact: string | null;
  email_status: number;
}

export interface SchoolInfoUpdate {
  cutoff_score?: string | null;
  contact_phone?: string | null;
  supervisor_name?: string | null;
  supervisor_contact?: string | null;
  email_status?: number | null;
}

export interface SchoolInfoListResponse {
  items: SchoolInfoResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface SchoolInfoListParams {
  page?: number;
  page_size?: number;
  city?: string | null;
  school_name?: string | null;
  college_name?: string | null;
  major_name?: string | null;
  sort_by?: string;
  order?: 'asc' | 'desc';
}

export interface CitiesResponse {
  cities: string[];
}

export interface SchoolsResponse {
  schools: string[];
}

export interface MajorsResponse {
  majors: string[];
}

// ==========================================
// SCHOOL DATA FETCH TASK TYPES
// ==========================================

export type FetchTaskStatusEnum = 'none' | 'pending' | 'running' | 'success' | 'failed'

export interface FetchTaskStatusResponse {
  status: FetchTaskStatusEnum;
  error: string | null;
  message: string | null;
  fetched_count: number;
}

export interface CreateFetchTaskRequest {
  curl_command: string;
  mode: 'all' | 'incremental';
  pages?: number;
}

export interface CreateFetchTaskResponse {
  status: FetchTaskStatusEnum;
  message: string;
}

// ==========================================
// BOOKS TYPES (from /api/books)
// ==========================================

export interface BookResponse {
  book_id: number;
  title: string;
  author?: string | null;
  file_name: string;
  file_path: string;
  status: 'pending' | 'parsing' | 'ready' | 'failed';
  created_at: string;
  updated_at: string;
}

export interface BookListResponse {
  items: BookResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface BookUploadResponse {
  book_id: number;
  message: string;
}

export interface BookContentResponse {
  book_id: number;
  content: string;
  content_type: string;
}

// ==========================================
// KNOWLEDGE TYPES (from /api/knowledge)
// ==========================================

export interface KnowledgeResponse {
  knowledge_id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  level?: number;
  question_count?: number;
  created_at: string;
  updated_at: string;
}

export interface KnowledgeTreeNode extends KnowledgeResponse {
  children?: KnowledgeTreeNode[];
}

export interface KnowledgeTreeResponse {
  tree: KnowledgeTreeNode[];
  total: number;
}

export interface KnowledgeListResponse {
  items: KnowledgeResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface QuestionKnowledgeResponse {
  question_no: number;
  knowledge_points: KnowledgeResponse[];
}

// ==========================================
// REPORTS TYPES (from /api/reports)
// ==========================================

export type ReportTypeEnum = 'weak_points' | 'recommendations' | 'progress' | 'comprehensive';

export interface ReportResponse {
  report_id: number;
  report_type: ReportTypeEnum;
  title: string;
  summary?: string | null;
  data?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface ReportListResponse {
  items: ReportResponse[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface ReportSummaryResponse {
  total_reports: number;
  by_type: Record<string, number>;
  latest_report?: ReportResponse | null;
}

export interface WeakPointsResponse {
  weak_points: Array<{
    knowledge_id: number;
    knowledge_name: string;
    error_count: number;
    error_rate: number;
  }>;
  total_questions: number;
  total_errors: number;
}

export interface RecommendationsResponse {
  recommendations: Array<{
    type: string;
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
  }>;
  generated_at: string;
}

// ==========================================
// RAG TYPES (from /api/rag)
// ==========================================

export interface RAGSearchResult {
  query: string;
  results: Array<{
    document_id: number;
    content: string;
    score: number;
    metadata?: Record<string, unknown>;
  }>;
  total: number;
}

export interface RAGAnswerResponse {
  query: string;
  answer: string;
  sources: Array<{
    document_id: number;
    content: string;
    relevance: number;
  }>;
  confidence: number;
}

export interface RAGAnalyzeResponse {
  text: string;
  knowledge_points: string[];
  topics: string[];
  difficulty?: number;
}

export interface RAGQueryHistoryResponse {
  queries: Array<{
    query: string;
    timestamp: string;
    result_count: number;
  }>;
  total: number;
}

// ==========================================
// HEALTH TYPES (from /health)
// ==========================================

export interface HealthResponse {
  status: string;
  version?: string;
  database?: string;
  redis?: string;
}
