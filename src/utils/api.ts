// src/utils/api.ts
import type { HTTPValidationError, ValidationError } from '../types';

export const API_BASE_URL = 'http://localhost:8000'; // Adjust if needed

/**
 * Helper to strictly parse and format backend FastAPI errors
 */
export async function handleApiError(response: Response): Promise<never> {
  let errorMsg = `HTTP Error: ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        errorMsg = (errorData as HTTPValidationError).detail
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