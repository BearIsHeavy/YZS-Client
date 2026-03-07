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
   */
  uploadCsv: async (token: string, bankId: number, file: File) => {
    const formData = new FormData();
    formData.append('bank_id', bankId.toString());
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/csv`, {
      method: 'POST',
      headers: getUploadHeaders(token),
      body: formData
    });
    if (!response.ok) await handleApiError(response);
    return response.json();
  },

  /**
   * Upload questions from XML file
   * POST /upload/xml
   */
  uploadXml: async (token: string, bankId: number, file: File) => {
    const formData = new FormData();
    formData.append('bank_id', bankId.toString());
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/upload/xml`, {
      method: 'POST',
      headers: getUploadHeaders(token),
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
