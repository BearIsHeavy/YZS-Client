// src/utils/__tests__/api-integration.test.ts
// Integration tests for API endpoints
// These tests verify that the frontend can communicate with the backend

import { describe, it, expect, beforeEach, beforeAll } from 'vitest'
import {
  API_BASE_URL,
  userApi,
  questionBankApi,
  uploadApi,
} from '../api'

// Test configuration - MUST match what's in test.sh
// The integration tests share the same test user
const TEST_EMAIL = 'testuser@example.com'
const TEST_PASSWORD = 'testpass123'
const TEST_NAME = 'Test_User'

describe('API Integration Tests', () => {
  let authToken: string = ''
  let bankId: number = 0

  // Helper to check if server is running
  async function checkServer(): Promise<boolean> {
    try {
      const response = await fetch(`${API_BASE_URL}/docs`)
      return response.ok
    } catch {
      return false
    }
  }

  beforeAll(async () => {
    // Skip tests if server is not running
    const serverRunning = await checkServer()
    if (!serverRunning) {
      console.warn('Backend server not running. Skipping integration tests.')
    }
  }, 30000)

  describe('User Authentication', () => {
    it('should register a new user', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return

      try {
        const result = await userApi.register({
          email: TEST_EMAIL,
          name: TEST_NAME,
          password: TEST_PASSWORD,
        })
        expect(result).toBeDefined()
        expect(result.email).toBe(TEST_EMAIL)
      } catch (error: unknown) {
        // User might already exist, which is ok
        if (error instanceof Error && error.message.includes('already')) {
          console.log('User already exists, continuing...')
        } else {
          throw error
        }
      }
    }, 10000)

    it('should login and get access token', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return

      const result = await userApi.login(TEST_EMAIL, TEST_PASSWORD)
      expect(result).toBeDefined()
      expect(result.access_token).toBeDefined()
      expect(result.token_type).toBe('bearer')
      authToken = result.access_token
    }, 10000)

    it('should get current user info with token', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken) {
        await userApi.login(TEST_EMAIL, TEST_PASSWORD)
      }

      const result = await userApi.getCurrentUser(authToken)
      expect(result).toBeDefined()
      expect(result.email).toBe(TEST_EMAIL)
      expect(result.name).toBe(TEST_NAME)
    }, 10000)

    it('should reject request without token', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return

      await expect(userApi.getCurrentUser('invalid-token')).rejects.toThrow()
    }, 10000)
  })

  describe('Question Bank API', () => {
    beforeEach(async () => {
      // Ensure we have a valid token
      const serverRunning = await checkServer()
      if (!serverRunning) return

      try {
        const loginResult = await userApi.login(TEST_EMAIL, TEST_PASSWORD)
        authToken = loginResult.access_token
      } catch {
        // Skip if not authenticated
      }
    })

    it('should get all question banks', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken) return

      const result = await questionBankApi.getAll(authToken)
      expect(Array.isArray(result)).toBe(true)
    }, 10000)

    it('should create a new question bank', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken) return

      const bankData = {
        name: `Test Bank ${Date.now()}`,
        is_public: false,
        description: 'Auto-created test bank',
      }

      const result = await questionBankApi.create(authToken, bankData)
      expect(result).toBeDefined()
      expect(result.name).toBe(bankData.name)
      expect(result.bank_id).toBeDefined()
      bankId = result.bank_id
    }, 10000)

    it('should get questions from a bank', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken || !bankId) return

      const result = await questionBankApi.getQuestions(authToken, bankId)
      expect(Array.isArray(result)).toBe(true)
    }, 10000)
  })

  describe('Question Upload API', () => {
    beforeEach(async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return

      try {
        const loginResult = await userApi.login(TEST_EMAIL, TEST_PASSWORD)
        authToken = loginResult.access_token

        // Create a bank if we don't have one
        if (!bankId) {
          const bankResult = await questionBankApi.create(authToken, {
            name: 'Test Bank for Upload',
            is_public: false,
          })
          bankId = bankResult.bank_id
        }
      } catch {
        // Skip if not authenticated
      }
    })

    it('should upload a single question with form-urlencoded', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken || !bankId) return

      const questionData = {
        bank_id: bankId,
        category: '历史',
        stem: '中国历史上第一个皇帝是谁？',
        qus_type: 1,
        correct_ans_summary: 'A',
        is_public: true,
        options: { A: '秦始皇', B: '汉高祖', C: '唐高祖', D: '胡亥' },
        full_text: '',
        full_answer: '',
        explanation: '',
      }

      const result = await uploadApi.uploadSingle(authToken, questionData)
      expect(result).toBeDefined()
      expect(result.No).toBeDefined()
      expect(result.category).toBe('历史')
      expect(result.stem).toBe('中国历史上第一个皇帝是谁？')
    }, 10000)

    it('should handle question with options as JSON string', async () => {
      const serverRunning = await checkServer()
      if (!serverRunning) return
      if (!authToken || !bankId) return

      const questionData = {
        bank_id: bankId,
        category: 'Math',
        stem: 'What is 2 + 2?',
        qus_type: 1,
        correct_ans_summary: 'B',
        is_public: false,
        options: '{"A":"3","B":"4","C":"5","D":"6"}',
      }

      const result = await uploadApi.uploadSingle(authToken, questionData)
      expect(result).toBeDefined()
      expect(result.No).toBeDefined()
    }, 10000)
  })
})
