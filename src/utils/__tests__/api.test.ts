// src/utils/__tests__/api.test.ts
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  API_BASE_URL,
  handleApiError,
  getAuthHeaders,
  getUploadHeaders,
  userApi,
  questionBankApi,
  uploadApi,
} from '../api'

describe('API Utilities', () => {
  describe('API_BASE_URL', () => {
    it('should use default URL when env is not set', () => {
      expect(API_BASE_URL).toBe('http://localhost:8000')
    })
  })

  describe('getAuthHeaders', () => {
    it('should return correct headers with token', () => {
      const token = 'test-token'
      const headers = getAuthHeaders(token)
      
      expect(headers).toEqual({
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      })
    })
  })

  describe('getUploadHeaders', () => {
    it('should return correct headers for file upload (no Content-Type)', () => {
      const token = 'test-token'
      const headers = getUploadHeaders(token)
      
      expect(headers).toEqual({
        'Authorization': `Bearer ${token}`,
      })
    })
  })

  describe('handleApiError', () => {
    it('should throw error with status code when no body', async () => {
      const mockResponse = {
        status: 500,
        json: vi.fn().mockRejectedValue(new Error('Invalid JSON')),
        text: vi.fn().mockResolvedValue('Server Error'),
      } as unknown as Response

      await expect(handleApiError(mockResponse)).rejects.toThrow('Server Error')
    })

    it('should parse and throw error with detail message', async () => {
      const mockResponse = {
        status: 400,
        json: vi.fn().mockResolvedValue({ detail: 'Bad request' }),
      } as unknown as Response

      await expect(handleApiError(mockResponse)).rejects.toThrow('Bad request')
    })

    it('should handle array of validation errors', async () => {
      const mockResponse = {
        status: 422,
        json: vi.fn().mockResolvedValue({
          detail: [
            { msg: 'Field required', loc: ['body', 'email'] },
            { msg: 'Field required', loc: ['body', 'password'] },
          ],
        }),
      } as unknown as Response

      await expect(handleApiError(mockResponse)).rejects.toThrow('Field required, Field required')
    })
  })

  describe('userApi', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    describe('register', () => {
      it('should call POST /users/register with correct payload', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ user_id: 1, email: 'test@example.com' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const userData = {
          email: 'test@example.com',
          name: 'Test User',
          password: 'password123',
        }

        const result = await userApi.register(userData)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/register`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(userData),
          }
        )
        expect(result).toEqual({ user_id: 1, email: 'test@example.com' })
      })

      it('should handle registration error', async () => {
        const mockResponse = {
          ok: false,
          status: 400,
          json: vi.fn().mockResolvedValue({ detail: 'Email already register' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const userData = {
          email: 'existing@example.com',
          name: 'Test User',
          password: 'password123',
        }

        await expect(userApi.register(userData)).rejects.toThrow('Email already register')
      })
    })

    describe('login', () => {
      it('should call POST /users/login with credentials', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ access_token: 'token', token_type: 'bearer' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const result = await userApi.login('test@example.com', 'password123')

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/login`,
          expect.objectContaining({
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          })
        )
        expect(result).toEqual({ access_token: 'token', token_type: 'bearer' })
      })
    })

    describe('getCurrentUser', () => {
      it('should call GET /users/me with auth headers', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ user_id: 1, email: 'test@example.com' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const result = await userApi.getCurrentUser('test-token')

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me`,
          {
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
          }
        )
        expect(result).toEqual({ user_id: 1, email: 'test@example.com' })
      })
    })

    describe('updateCurrentUser', () => {
      it('should call PUT /users/me with updated data', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ user_id: 1, name: 'Updated' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const updateData = { name: 'Updated' }
        const result = await userApi.updateCurrentUser('test-token', updateData)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/users/me`,
          {
            method: 'PUT',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updateData),
          }
        )
        expect(result).toEqual({ user_id: 1, name: 'Updated' })
      })
    })
  })

  describe('questionBankApi', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    describe('create', () => {
      it('should call POST /question_banks/book', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ bank_id: 1, name: 'Test Bank' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const bankData = { name: 'Test Bank', is_public: false }
        const result = await questionBankApi.create('test-token', bankData)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/question_banks/book`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(bankData),
          }
        )
        expect(result).toEqual({ bank_id: 1, name: 'Test Bank' })
      })
    })

    describe('getAll', () => {
      it('should call GET /question_banks', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue([{ bank_id: 1, name: 'Test Bank' }]),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const result = await questionBankApi.getAll('test-token')

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/question_banks`,
          {
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
          }
        )
        expect(result).toEqual([{ bank_id: 1, name: 'Test Bank' }])
      })
    })

    describe('getQuestions', () => {
      it('should call GET /question_banks/{bankId}/questions with pagination', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue([{ No: 1, stem: 'Question 1' }]),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const result = await questionBankApi.getQuestions('test-token', 1, 0, 10)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/question_banks/1/questions?skip=0&limit=10`,
          {
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
          }
        )
        expect(result).toEqual([{ No: 1, stem: 'Question 1' }])
      })
    })

    describe('delete', () => {
      it('should call DELETE /question_banks/{bankId}', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ detail: 'Deleted' }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const result = await questionBankApi.delete('test-token', 1)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/question_banks/1`,
          {
            method: 'DELETE',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/json',
            },
          }
        )
        expect(result).toEqual({ detail: 'Deleted' })
      })
    })
  })

  describe('uploadApi', () => {
    beforeEach(() => {
      vi.stubGlobal('fetch', vi.fn())
    })

    afterEach(() => {
      vi.unstubAllGlobals()
    })

    describe('uploadCsv', () => {
      it('should call POST /upload/csv with FormData', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ questions_added: 5 }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const file = new File(['test'], 'test.csv', { type: 'text/csv' })
        const result = await uploadApi.uploadCsv('test-token', 1, file)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/upload/csv`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
            },
            body: expect.any(FormData),
          }
        )
        expect(result).toEqual({ questions_added: 5 })
      })
    })

    describe('uploadXml', () => {
      it('should call POST /upload/xml with FormData', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ questions_added: 3 }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const file = new File(['<xml></xml>'], 'test.xml', { type: 'text/xml' })
        const result = await uploadApi.uploadXml('test-token', 1, file)

        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/upload/xml`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
            },
            body: expect.any(FormData),
          }
        )
        expect(result).toEqual({ questions_added: 3 })
      })
    })

    describe('uploadSingle', () => {
      it('should call POST /upload/question with form-urlencoded data', async () => {
        const mockResponse = {
          ok: true,
          json: vi.fn().mockResolvedValue({ No: 1 }),
        } as unknown as Response

        vi.mocked(fetch).mockResolvedValue(mockResponse)

        const questionData = {
          bank_id: 1,
          category: 'Math',
          stem: 'What is 2+2?',
          qus_type: 1,
        }

        const result = await uploadApi.uploadSingle('test-token', questionData)

        // Verify form-urlencoded format
        expect(fetch).toHaveBeenCalledWith(
          `${API_BASE_URL}/upload/question`,
          {
            method: 'POST',
            headers: {
              'Authorization': 'Bearer test-token',
              'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: expect.stringContaining('bank_id=1'),
          }
        )
        expect(result).toEqual({ No: 1 })
      })
    })
  })
})
