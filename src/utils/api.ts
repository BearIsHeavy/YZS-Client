// src/utils/api.ts
// API utilities for YanZhuShou backend integration

import type { ValidationError } from '../types';

// API Base URL - can be configured via environment variable
export const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

/**
 * Helper to strictly parse and format backend FastAPI errors
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMsg = `HTTP Error: ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        errorMsg = (errorData.detail as ValidationError[])
          .map((e: ValidationError) => e.msg)
          .join(', ');
      } else if (typeof errorData.detail === 'string') {
        errorMsg = errorData.detail;
      }
    }
  } catch {
    errorMsg = await response.text() || errorMsg;
  }
  throw new Error(errorMsg);
}

/**
 * Get authentication headers for API requests
 */
export function getAuthHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  };
}

/**
 * Get headers for file upload requests (no Content-Type for FormData)
 */
export function getUploadHeaders(token: string): HeadersInit {
  return {
    'Authorization': `Bearer ${token}`
  };
}

// ==========================================
// USER API ENDPOINTS
// ==========================================

export const userApi = {
  /**
   * Register a new user
   * POST /users/register
   */
  register: async (userData: { email: string; name: string; password: string; phone?: string; gender?: number }) => {
    const response = await fetch(`${API_BASE_URL}/users/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Login and get access token
   * POST /users/login
   */
  login: async (username: string, password: string) => {
    const params = new URLSearchParams();
    params.append('username', username);
    params.append('password', password);
    params.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString()
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get current user information
   * GET /users/me
   */
  getCurrentUser: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update current user information
   * PUT /users/me
   */
  updateCurrentUser: async (token: string, userData: { name?: string; phone?: string; gender?: number }) => {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(userData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// QUESTION BANK API ENDPOINTS
// ==========================================

export const questionBankApi = {
  /**
   * Create a new question bank
   * POST /question_banks/book
   */
  create: async (token: string, bankData: { name: string; is_public?: boolean; description?: string }) => {
    const response = await fetch(`${API_BASE_URL}/question_banks/book`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(bankData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get all question banks for current user
   * GET /question_banks
   */
  getAll: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/question_banks`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get a specific question bank by ID
   * GET /question_banks/{bank_id}
   */
  getById: async (token: string, bankId: number) => {
    const response = await fetch(`${API_BASE_URL}/question_banks/${bankId}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get questions from a specific question bank
   * GET /question_banks/{bank_id}/questions
   */
  getQuestions: async (token: string, bankId: number, skip?: number, limit?: number) => {
    const params = new URLSearchParams();
    if (skip !== undefined) params.append('skip', skip.toString());
    if (limit !== undefined) params.append('limit', limit.toString());

    const response = await fetch(`${API_BASE_URL}/question_banks/${bankId}/questions?${params.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Delete a question bank
   * DELETE /question_banks/{bank_id}
   */
  delete: async (token: string, bankId: number) => {
    const response = await fetch(`${API_BASE_URL}/question_banks/${bankId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// QUESTION UPLOAD API ENDPOINTS
// ==========================================

export const uploadApi = {
  /**
   * Upload questions from CSV file
   * POST /upload/csv
   * 
   * @param token - JWT access token
   * @param bankId - Target question bank ID
   * @param file - CSV file to upload
   * @returns Promise with upload result
   */
  uploadCsv: async (token: string, bankId: number, file: File) => {
    const formData = new FormData();
    formData.append('bank_id', bankId.toString());
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/csv`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Content-Type is automatically set by browser for FormData with boundary
      },
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Upload questions from XML file
   * POST /upload/xml
   * 
   * @param token - JWT access token
   * @param bankId - Target question bank ID
   * @param file - XML file to upload
   * @returns Promise with upload result
   */
  uploadXml: async (token: string, bankId: number, file: File) => {
    const formData = new FormData();
    formData.append('bank_id', bankId.toString());
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/xml`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Content-Type is automatically set by browser for FormData with boundary
      },
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Upload a single question
   * POST /upload/question
   * Note: Backend expects form-urlencoded data, not JSON
   */
  uploadSingle: async (token: string, questionData: {
    bank_id: number;
    category: string;
    stem: string;
    qus_type: number;
    correct_ans_summary?: string;
    is_public?: boolean;
    options?: string | Record<string, unknown>;
    full_text?: string;
    full_answer?: string;
    explanation?: string;
  }) => {
    // Convert questionData to URLSearchParams for form-urlencoded format
    const params = new URLSearchParams();
    params.append('bank_id', questionData.bank_id.toString());
    params.append('category', questionData.category);
    params.append('stem', questionData.stem);
    params.append('qus_type', questionData.qus_type.toString());
    
    if (questionData.correct_ans_summary) {
      params.append('correct_ans_summary', questionData.correct_ans_summary);
    }
    
    if (questionData.is_public !== undefined) {
      params.append('is_public', questionData.is_public.toString());
    }
    
    // Convert options object to JSON string if it's an object
    if (questionData.options) {
      const optionsStr = typeof questionData.options === 'string' 
        ? questionData.options 
        : JSON.stringify(questionData.options);
      params.append('options', optionsStr);
    }
    
    if (questionData.full_text) {
      params.append('full_text', questionData.full_text);
    }
    
    if (questionData.full_answer) {
      params.append('full_answer', questionData.full_answer);
    }
    
    if (questionData.explanation) {
      params.append('explanation', questionData.explanation);
    }

    const response = await fetch(`${API_BASE_URL}/upload/question`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded'
      },
      body: params.toString()
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// MISTAKE NOTEBOOK API ENDPOINTS
// ==========================================

export const mistakeNotebookApi = {
  /**
   * Get unique categories from user's wrong questions
   * GET /mistake-notebook/categories
   * 
   * @param token - JWT access token
   * @returns Promise with list of unique categories
   */
  getCategories: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/categories`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get paginated list of wrong questions for current user
   * GET /mistake-notebook/questions
   * 
   * Wrong questions are derived from user_question_logs where is_correct = false
   * 
   * @param token - JWT access token
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with paginated wrong questions
   */
  getWrongQuestions: async (
    token: string,
    params: {
      page?: number;
      size?: number;
      category?: string | null;
      status?: 'new' | 'reviewing' | 'mastered' | 'removed' | null;
      needs_review?: boolean | null;
    } = {}
  ) => {
    const queryParams = new URLSearchParams();
    
    if (params.page !== undefined && params.page !== null) {
      queryParams.append('page', params.page.toString());
    }
    if (params.size !== undefined && params.size !== null) {
      queryParams.append('size', params.size.toString());
    }
    if (params.category !== undefined && params.category !== null) {
      queryParams.append('category', params.category);
    }
    if (params.status !== undefined && params.status !== null) {
      queryParams.append('status', params.status);
    }
    if (params.needs_review !== undefined && params.needs_review !== null) {
      queryParams.append('needs_review', params.needs_review.toString());
    }

    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions?${queryParams.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get mistake notebook statistics
   * GET /mistake-notebook/stats
   * 
   * @param token - JWT access token
   * @returns Promise with statistics
   */
  getStats: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/stats`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update wrong question status/metadata
   * PUT /mistake-notebook/questions/{log_id}/status
   * 
   * @param token - JWT access token
   * @param logId - ID of the user_question_logs record
   * @param updateData - Update data (is_mastered, error_reason_type, etc.)
   * @returns Promise with updated wrong question
   */
  updateWrongQuestionStatus: async (
    token: string,
    logId: number,
    updateData: {
      is_mastered?: boolean;
      error_reason_type?: 'careless' | 'concept_gap' | 'logic_error' | 'time_limit' | 'other' | null;
      error_reason_detail?: string | null;
      status?: 'new' | 'reviewing' | 'mastered' | 'removed';
      difficulty_level?: number;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions/${logId}/status`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Mark wrong question as mastered
   * POST /mistake-notebook/questions/{log_id}/master
   * 
   * @param token - JWT access token
   * @param logId - ID of the user_question_logs record
   * @returns Promise that resolves on success
   */
  markAsMastered: async (token: string, logId: number) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions/${logId}/master`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Mark wrong question as not mastered (needs review)
   * POST /mistake-notebook/questions/{log_id}/unmaster
   * 
   * @param token - JWT access token
   * @param logId - ID of the user_question_logs record
   * @returns Promise that resolves on success
   */
  markAsUnmastered: async (token: string, logId: number) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions/${logId}/unmaster`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Remove wrong question from notebook
   * DELETE /mistake-notebook/questions/{log_id}
   * 
   * Deletes the user_question_logs record (not the actual question)
   * 
   * @param token - JWT access token
   * @param logId - ID of the user_question_logs record
   * @returns Promise that resolves on success
   */
  removeWrongQuestion: async (token: string, logId: number) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions/${logId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Batch update wrong questions
   * POST /mistake-notebook/questions/batch-update
   * 
   * @param token - JWT access token
   * @param logIds - Array of user_question_logs IDs to update
   * @param isMastered - New mastered status for all questions
   * @returns Promise that resolves on success
   */
  batchUpdate: async (token: string, logIds: number[], isMastered: boolean) => {
    const response = await fetch(`${API_BASE_URL}/mistake-notebook/questions/batch-update`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ question_log_ids: logIds, is_mastered: isMastered })
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Submit an answer for a practice question
   * POST /practice/submit-answer
   * 
   * @param token - JWT access token
   * @param answerData - Answer submission data
   * @returns Promise with answer result
   */
  submitAnswer: async (token: string, answerData: {
    question_no: number;
    user_answer: string;
    time_spent_seconds?: number | null;
  }) => {
    const response = await fetch(`${API_BASE_URL}/practice/submit-answer`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(answerData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Start a practice session
   * POST /practice/start-session
   * 
   * @param token - JWT access token
   * @param sessionData - Practice session configuration
   * @returns Promise with practice questions
   */
  startPracticeSession: async (token: string, sessionData: {
    bank_id: number;
    question_count?: number;
    category?: string | null;
  }) => {
    const response = await fetch(`${API_BASE_URL}/practice/start-session`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(sessionData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get a single practice question
   * GET /practice/question/{question_no}
   * 
   * @param token - JWT access token
   * @param questionNo - Question ID
   * @returns Promise with question data
   */
  getPracticeQuestion: async (token: string, questionNo: number) => {
    const response = await fetch(`${API_BASE_URL}/practice/question/${questionNo}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// FEEDBACK / COMMENT API ENDPOINTS
// ==========================================

export const feedbackApi = {
  /**
   * List all feedback with filtering and pagination
   * GET /api/feedback
   *
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with paginated feedback list
   */
  list: async (params: {
    status_filter?: 'pending' | 'in_progress' | 'completed' | 'rejected' | null;
    category?: 'bug' | 'feature' | 'ui' | 'performance' | 'documentation' | 'other' | null;
    sort_by?: 'vote_count' | 'created_at';
    page?: number;
    page_size?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();

    if (params.status_filter !== undefined && params.status_filter !== null) {
      queryParams.append('status_filter', params.status_filter);
    }
    if (params.category !== undefined && params.category !== null) {
      queryParams.append('category', params.category);
    }
    if (params.sort_by !== undefined) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.page_size !== undefined) {
      queryParams.append('page_size', params.page_size.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/feedback?${queryParams.toString()}`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Submit new feedback
   * POST /api/feedback
   *
   * Rate limit: 1 submission per user every 24 hours
   *
   * @param token - JWT access token
   * @param feedbackData - Feedback content and category
   * @returns Promise with created feedback
   */
  create: async (token: string, feedbackData: { content: string; category?: 'bug' | 'feature' | 'ui' | 'performance' | 'documentation' | 'other' }) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(feedbackData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get feedback details by ID
   * GET /api/feedback/{feedback_id}
   *
   * @param token - JWT access token
   * @param feedbackId - Feedback ID
   * @returns Promise with feedback details
   */
  getById: async (token: string, feedbackId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update feedback status and/or developer response
   * PUT /api/feedback/{feedback_id}
   *
   * Requires developer/admin role
   *
   * @param token - JWT access token
   * @param feedbackId - Feedback ID
   * @param updateData - Update data (status, developer_response)
   * @returns Promise with updated feedback
   */
  update: async (
    token: string,
    feedbackId: number,
    updateData: { status?: 'pending' | 'in_progress' | 'completed' | 'rejected' | null; developer_response?: string | null }
  ) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Delete feedback
   * DELETE /api/feedback/{feedback_id}
   *
   * Requires admin role or original author (if no votes)
   *
   * @param token - JWT access token
   * @param feedbackId - Feedback ID
   * @returns Promise that resolves on success
   */
  delete: async (token: string, feedbackId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Toggle vote for feedback
   * POST /api/feedback/{feedback_id}/vote
   *
   * Requires authentication. Cannot vote on own feedback.
   *
   * @param token - JWT access token
   * @param feedbackId - Feedback ID
   * @returns Promise with vote status
   */
  vote: async (token: string, feedbackId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}/vote`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get current user's vote status for a feedback
   * GET /api/feedback/{feedback_id}/vote
   *
   * @param token - JWT access token
   * @param feedbackId - Feedback ID
   * @returns Promise with vote status
   */
  getVoteStatus: async (token: string, feedbackId: number) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/${feedbackId}/vote`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get current user's feedback submissions
   * GET /api/feedback/me/submissions
   *
   * @param token - JWT access token
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise with paginated feedback list
   */
  getMyFeedback: async (token: string, page?: number, pageSize?: number) => {
    const queryParams = new URLSearchParams();
    if (page !== undefined) {
      queryParams.append('page', page.toString());
    }
    if (pageSize !== undefined) {
      queryParams.append('page_size', pageSize.toString());
    }

    const response = await fetch(`${API_BASE_URL}/api/feedback/me/submissions?${queryParams.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Check if current user can submit feedback today
   * GET /api/feedback/me/submission-status
   *
   * @param token - JWT access token
   * @returns Promise with submission status
   */
  getSubmissionStatus: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/me/submission-status`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get feedback statistics
   * GET /api/feedback/stats
   *
   * @returns Promise with feedback statistics
   */
  getStats: async () => {
    const response = await fetch(`${API_BASE_URL}/api/feedback/stats`);
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// BLOG API ENDPOINTS
// ==========================================

export const blogApi = {
  /**
   * List all published blog posts with filtering and pagination
   * GET /blogs
   *
   * @param token - JWT access token
   * @param params - Query parameters for filtering and pagination
   * @returns Promise with paginated blog list
   */
  list: async (token: string, params: {
    search?: string | null;
    user_id?: number | null;
    content_type?: 'markdown' | 'html' | null;
    tags?: string | null;  // Comma-separated tags
    sort_by?: 'created_at' | 'updated_at' | 'view_count' | 'like_count';
    page?: number;
    page_size?: number;
  } = {}) => {
    const queryParams = new URLSearchParams();

    if (params.search !== undefined && params.search !== null) {
      queryParams.append('search', params.search);
    }
    if (params.user_id !== undefined && params.user_id !== null) {
      queryParams.append('user_id', params.user_id.toString());
    }
    if (params.content_type !== undefined && params.content_type !== null) {
      queryParams.append('content_type', params.content_type);
    }
    if (params.tags !== undefined && params.tags !== null) {
      queryParams.append('tags', params.tags);
    }
    if (params.sort_by !== undefined) {
      queryParams.append('sort_by', params.sort_by);
    }
    if (params.page !== undefined) {
      queryParams.append('page', params.page.toString());
    }
    if (params.page_size !== undefined) {
      queryParams.append('page_size', params.page_size.toString());
    }

    const response = await fetch(`${API_BASE_URL}/blogs?${queryParams.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get current user's blog posts (including drafts)
   * GET /blogs/my
   *
   * @param token - JWT access token
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise with paginated blog list
   */
  getMyBlogs: async (token: string, page?: number, pageSize?: number) => {
    const queryParams = new URLSearchParams();
    if (page !== undefined) {
      queryParams.append('page', page.toString());
    }
    if (pageSize !== undefined) {
      queryParams.append('page_size', pageSize.toString());
    }

    const response = await fetch(`${API_BASE_URL}/blogs/my?${queryParams.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get blog post details by ID
   * GET /blogs/{blog_id}
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @returns Promise with blog details
   */
  getById: async (token: string, blogId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get blog post content as raw text
   * GET /blogs/{blog_id}/content
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @returns Promise with blog content
   */
  getBlogContent: async (token: string, blogId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/content`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Create a new blog post with file upload
   * POST /blogs
   * Content-Type: multipart/form-data
   *
   * Required fields:
   * - title: string (1-200 characters)
   * - content_file: File (markdown or HTML, max 5MB)
   *
   * Optional fields:
   * - content_type: 'markdown' | 'html' (default: 'markdown')
   * - is_published: string 'true' | 'false' (default: 'true')
   * - tags: string (comma-separated, max 5 tags, each max 10 chars)
   *
   * @param token - JWT access token
   * @param formData - Form data with title, content_file, content_type, is_published, tags
   * @returns Promise with created blog
   */
  createWithFile: async (token: string, formData: FormData) => {
    const response = await fetch(`${API_BASE_URL}/blogs`, {
      method: 'POST',
      headers: getUploadHeaders(token),
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update a blog post
   * PUT /blogs/{blog_id}
   * Content-Type: multipart/form-data
   *
   * Optional fields (all):
   * - title: string (1-200 characters)
   * - content_file: File (markdown or HTML, max 5MB)
   * - content_type: 'markdown' | 'html'
   * - is_published: string 'true' | 'false'
   * - tags: string (comma-separated, max 5 tags, each max 10 chars)
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @param formData - Form data with title, content_file, content_type, is_published, tags
   * @returns Promise with updated blog
   */
  update: async (
    token: string,
    blogId: number,
    formData: FormData
  ) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
      method: 'PUT',
      headers: getUploadHeaders(token),
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Delete a blog post
   * DELETE /blogs/{blog_id}
   *
   * Requires ownership
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @returns Promise that resolves on success
   */
  delete: async (token: string, blogId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Get blog statistics
   * GET /blogs/stats
   *
   * @param token - JWT access token
   * @returns Promise with blog statistics
   */
  getStats: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/blogs/stats`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Toggle like for a blog post
   * POST /blogs/{blog_id}/like
   *
   * Cannot like own blog
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @returns Promise with like status
   */
  toggleLike: async (token: string, blogId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/like`, {
      method: 'POST',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Get current user's like status for a blog post
   * GET /blogs/{blog_id}/like
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @returns Promise with like status
   */
  getLikeStatus: async (token: string, blogId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/like`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * List comments for a blog post
   * GET /blogs/{blog_id}/comments
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @param page - Page number
   * @param pageSize - Items per page
   * @returns Promise with paginated comments
   */
  listComments: async (token: string, blogId: number, page?: number, pageSize?: number) => {
    const queryParams = new URLSearchParams();
    if (page !== undefined) {
      queryParams.append('page', page.toString());
    }
    if (pageSize !== undefined) {
      queryParams.append('page_size', pageSize.toString());
    }

    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/comments?${queryParams.toString()}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Create a comment on a blog post
   * POST /blogs/{blog_id}/comments
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @param commentData - Comment data
   * @returns Promise with created comment
   */
  createComment: async (
    token: string,
    blogId: number,
    commentData: {
      content: string;
      parent_id?: number | null;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/comments`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify(commentData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update a comment
   * PUT /blogs/comments/{comment_id}
   *
   * Requires ownership
   *
   * @param token - JWT access token
   * @param commentId - Comment ID
   * @param updateData - Update data
   * @returns Promise with updated comment
   */
  updateComment: async (
    token: string,
    commentId: number,
    updateData: {
      content?: string | null;
    }
  ) => {
    const response = await fetch(`${API_BASE_URL}/blogs/comments/${commentId}`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify(updateData)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Delete a comment (soft delete)
   * DELETE /blogs/comments/{comment_id}
   *
   * Requires ownership or blog ownership
   *
   * @param token - JWT access token
   * @param commentId - Comment ID
   * @returns Promise that resolves on success
   */
  deleteComment: async (token: string, commentId: number) => {
    const response = await fetch(`${API_BASE_URL}/blogs/comments/${commentId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  }
};

// ==========================================
// USER BIO API ENDPOINTS
// ==========================================

export const bioApi = {
  /**
   * Get the current user's self-introduction markdown content
   * GET /users/bio
   *
   * @param token - JWT access token
   * @returns Promise with markdown content string
   */
  getBio: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/bio`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Upload a self-introduction markdown file
   * POST /users/bio
   *
   * @param token - JWT access token
   * @param file - Markdown file to upload
   * @returns Promise with BioFileResponse
   */
  uploadBio: async (token: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/users/bio`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
        // Note: Content-Type is automatically set by browser for FormData with boundary
      },
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Delete the current user's self-introduction file
   * DELETE /users/bio
   *
   * @param token - JWT access token
   * @returns Promise that resolves on success
   */
  deleteBio: async (token: string) => {
    const response = await fetch(`${API_BASE_URL}/users/bio`, {
      method: 'DELETE',
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return null;
  },

  /**
   * Get another user's self-introduction markdown content
   * GET /users/bio/{user_id}
   *
   * @param token - JWT access token
   * @param userId - User ID
   * @returns Promise with markdown content string
   */
  getUserBio: async (token: string, userId: number) => {
    const response = await fetch(`${API_BASE_URL}/users/bio/${userId}`, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};

// ==========================================
// BLOG TAG API ENDPOINTS
// ==========================================

export const blogTagApi = {
  /**
   * List all available tags
   * GET /blogs/tags
   *
   * @param token - JWT access token
   * @param search - Optional search term to filter tags
   * @returns Promise with tag list
   */
  list: async (token: string, search?: string) => {
    const queryParams = new URLSearchParams();
    if (search !== undefined && search !== null && search.trim() !== '') {
      queryParams.append('search', search);
    }

    const queryString = queryParams.toString();
    const url = queryString 
      ? `${API_BASE_URL}/blogs/tags?${queryString}`
      : `${API_BASE_URL}/blogs/tags`;

    const response = await fetch(url, {
      headers: getAuthHeaders(token)
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Create a new tag
   * POST /blogs/tags
   *
   * @param token - JWT access token
   * @param tagName - Tag name (max 10 characters)
   * @returns Promise with created tag
   */
  create: async (token: string, tagName: string) => {
    const response = await fetch(`${API_BASE_URL}/blogs/tags`, {
      method: 'POST',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ name: tagName })
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Update blog tags
   * PUT /blogs/{blog_id}/tags
   *
   * @param token - JWT access token
   * @param blogId - Blog post ID
   * @param tags - Array of tag names
   * @returns Promise with updated blog
   */
  updateBlogTags: async (token: string, blogId: number, tags: string[]) => {
    const response = await fetch(`${API_BASE_URL}/blogs/${blogId}/tags`, {
      method: 'PUT',
      headers: getAuthHeaders(token),
      body: JSON.stringify({ tags })
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  }
};
