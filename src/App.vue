<!-- App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

// ==========================================
// TYPES (Derived from openapi.json)
// ==========================================

interface UserCreate {
  email: string;
  password: string;
}

interface UserResponse {
  id: number;
  email: string;
  is_active: boolean;
}

interface Token {
  access_token: string;
  token_type: string;
}

interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

interface HTTPValidationError {
  detail: ValidationError[];
}

// New Types for Questions and Errors
interface QuestionResponse {
  id: number;
  stem: string;
  options: string[];
  correct_answer?: string | null;
  explanation?: string | null;
  knowledge_points?: string | null;
}

interface ErrorRecordResponse {
  id: number;
  question_id: number;
  selected_option: string;
  question: QuestionResponse | null;
}

// ==========================================
// STATE & CONFIGURATION
// ==========================================

const API_BASE_URL = 'http://localhost:8000'; // Adjust if needed
type AuthState = 'login' | 'register' | 'dashboard';
type DashboardMenu = 'profile' | 'questions' | 'upload' | 'mistakes';

// Authentication State
const currentAuthView = ref<AuthState>('login');
const token = ref<string | null>(localStorage.getItem('access_token'));
const currentUser = ref<UserResponse | null>(null);

// Dashboard State
const activeMenu = ref<DashboardMenu>('profile');
const errorRecords = ref<ErrorRecordResponse[]>([]);
const selectedFile = ref<File | null>(null);

// Question Bank State
const questions = ref<QuestionResponse[]>([]);
const questionsLoading = ref<boolean>(false);
const userAnswers = ref<Record<number, string>>({});
const answerResults = ref<Record<number, boolean>>({});

// UI State
const isLoading = ref<boolean>(false);
const isUploading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Forms
const registerForm = ref<UserCreate>({ email: '', password: '' });
const loginForm = ref({ username: '', password: '' });

// ==========================================
// API UTILITIES
// ==========================================

async function handleApiError(response: Response): Promise<never> {
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

// ==========================================
// AUTHENTICATION ACTIONS
// ==========================================

async function registerUser(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const response = await fetch(`${API_BASE_URL}/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(registerForm.value),
    });

    if (!response.ok) await handleApiError(response);

    registerForm.value = { email: '', password: '' };
    successMessage.value = 'Registration successful! Please log in.';
    currentAuthView.value = 'login';
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}

async function loginUser(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const params = new URLSearchParams();
    params.append('username', loginForm.value.username);
    params.append('password', loginForm.value.password);
    params.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: params.toString(),
    });

    if (!response.ok) await handleApiError(response);

    const data = (await response.json()) as Token;
    token.value = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    loginForm.value = { username: '', password: '' };
    
    await fetchUserProfile();
    currentAuthView.value = 'dashboard';
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}

async function fetchUserProfile(): Promise<void> {
  if (!token.value) return;
  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    if (!response.ok) await handleApiError(response);
    currentUser.value = (await response.json()) as UserResponse;
  } catch (error: unknown) {
    console.error('Failed to fetch profile:', error);
    logoutLocalState();
    errorMessage.value = 'Session expired. Please log in again.';
  }
}

function logoutLocalState(): void {
  token.value = null;
  currentUser.value = null;
  localStorage.removeItem('access_token');
  currentAuthView.value = 'login';
}

async function logoutUser(): Promise<void> {
  if (!token.value) return;
  isLoading.value = true;
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
  } catch (error: unknown) {
    console.error('Logout request failed:', error);
  } finally {
    logoutLocalState();
    isLoading.value = false;
  }
}

// ==========================================
// DASHBOARD ACTIONS (Questions & Errors)
// ==========================================

function handleMenuSelect(index: string): void {
  activeMenu.value = index as DashboardMenu;
  errorMessage.value = null;
  successMessage.value = null;
  
  if (index === 'mistakes') {
    fetchMyErrors();
  } else if (index === 'questions') {
    fetchQuestions();
  }
}

// -- Upload Module --
function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
  }
}

async function uploadQuestionsFile(): Promise<void> {
  if (!selectedFile.value || !token.value) {
    errorMessage.value = 'Please select a file first.';
    return;
  }

  isUploading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    // Note: When sending FormData, DO NOT set Content-Type header. 
    // The browser automatically sets it to multipart/form-data with the correct boundary.
    const response = await fetch(`${API_BASE_URL}/questions/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`
      },
      body: formData,
    });

    if (!response.ok) await handleApiError(response);

    successMessage.value = 'File uploaded successfully!';
    selectedFile.value = null; // reset
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isUploading.value = false;
  }
}

// -- Question Bank Module --
async function fetchQuestions(): Promise<void> {
  if (!token.value) return;
  questionsLoading.value = true;
  errorMessage.value = null;

  try {
    const response = await fetch(`${API_BASE_URL}/questions?skip=0&limit=100`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });

    if (!response.ok) await handleApiError(response);

    questions.value = (await response.json()) as QuestionResponse[];
    // Reset selections upon refresh
    userAnswers.value = {};
    answerResults.value = {};
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    questionsLoading.value = false;
  }
}

async function submitAnswer(question: QuestionResponse, selectedOption: string): Promise<void> {
  // Prevent re-answering
  if (!token.value || userAnswers.value[question.id] !== undefined) return;

  userAnswers.value[question.id] = selectedOption;
  const isCorrect = question.correct_answer === selectedOption;
  answerResults.value[question.id] = isCorrect;

  // Immediately log incorrect answer to Mistake Notebook
  if (!isCorrect) {
    try {
      const response = await fetch(`${API_BASE_URL}/errors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token.value}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: question.id,
          selected_option: selectedOption
        })
      });

      if (!response.ok) await handleApiError(response);
    } catch (error: unknown) {
      console.error('Failed to record error:', error);
      errorMessage.value = 'Failed to record incorrect answer in Mistake Notebook.';
    }
  }
}

// -- Mistake Notebook Module --
async function fetchMyErrors(): Promise<void> {
  if (!token.value) return;
  isLoading.value = true;
  
  try {
    const response = await fetch(`${API_BASE_URL}/errors/me`, {
      headers: { 'Authorization': `Bearer ${token.value}` }
    });
    
    if (!response.ok) await handleApiError(response);
    
    errorRecords.value = (await response.json()) as ErrorRecordResponse[];
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(async () => {
  if (token.value) {
    await fetchUserProfile();
    if (currentUser.value) {
      currentAuthView.value = 'dashboard';
    }
  }
});
</script>

<template>
  <!-- ========================================== -->
  <!-- AUTHENTICATION LAYOUT -->
  <!-- ========================================== -->
  <div v-if="currentAuthView !== 'dashboard'" class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        <span v-if="currentAuthView === 'login'">Sign in to your account</span>
        <span v-else>Create a new account</span>
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <el-card class="shadow sm:rounded-lg sm:px-4">
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="mb-4" />
        <el-alert v-if="successMessage" :title="successMessage" type="success" show-icon :closable="false" class="mb-4" />

        <!-- Login Form -->
        <el-form v-if="currentAuthView === 'login'" @submit.prevent="loginUser" label-position="top">
          <el-form-item label="Email address">
            <el-input v-model="loginForm.username" type="email" required />
          </el-form-item>
          <el-form-item label="Password">
            <el-input v-model="loginForm.password" type="password" show-password required />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isLoading" class="w-full">Sign in</el-button>
          </el-form-item>
          <div class="text-center mt-2">
            <el-link type="primary" @click.prevent="currentAuthView = 'register'; errorMessage = null;">Don't have an account? Register here.</el-link>
          </div>
        </el-form>

        <!-- Register Form -->
        <el-form v-else @submit.prevent="registerUser" label-position="top">
          <el-form-item label="Email address">
            <el-input v-model="registerForm.email" type="email" required />
          </el-form-item>
          <el-form-item label="Password">
            <el-input v-model="registerForm.password" type="password" show-password required minlength="8" maxlength="64" />
          </el-form-item>
          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isLoading" class="w-full">Register</el-button>
          </el-form-item>
          <div class="text-center mt-2">
            <el-link type="primary" @click.prevent="currentAuthView = 'login'; errorMessage = null;">Already have an account? Sign in.</el-link>
          </div>
        </el-form>
      </el-card>
    </div>
  </div>

  <!-- ========================================== -->
  <!-- DASHBOARD LAYOUT -->
  <!-- ========================================== -->
  <div v-else class="h-screen flex flex-col bg-gray-50 font-sans">
    <!-- Header -->
    <header class="bg-indigo-600 text-white shadow-md flex justify-between items-center px-6 py-4">
      <div class="text-xl font-bold flex items-center gap-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        Smart Learning Platform
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">{{ currentUser?.email }}</span>
        <el-button size="small" @click="logoutUser" :loading="isLoading" plain>Logout</el-button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <el-menu :default-active="activeMenu" @select="handleMenuSelect" class="h-full border-none pt-4">
          <el-menu-item index="profile">
            Profile Settings
          </el-menu-item>
          <el-menu-item index="questions">
            Question Bank
          </el-menu-item>
          <el-menu-item index="upload">
            Upload CSV/XML
          </el-menu-item>
          <el-menu-item index="mistakes">
            Mistake Notebook
          </el-menu-item>
        </el-menu>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-8">
        
        <!-- Global Dashboard Alerts -->
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-6" @close="errorMessage = null" />
        <el-alert v-if="successMessage" :title="successMessage" type="success" show-icon class="mb-6" @close="successMessage = null" />

        <!-- 1. PROFILE VIEW -->
        <div v-if="activeMenu === 'profile' && currentUser" class="max-w-3xl">
          <h2 class="text-2xl font-bold text-gray-800 mb-6">User Profile</h2>
          <el-descriptions border :column="1" class="bg-white shadow-sm rounded-lg">
            <el-descriptions-item label="User ID">{{ currentUser.id }}</el-descriptions-item>
            <el-descriptions-item label="Email address">{{ currentUser.email }}</el-descriptions-item>
            <el-descriptions-item label="Account Status">
              <el-tag :type="currentUser.is_active ? 'success' : 'danger'">
                {{ currentUser.is_active ? 'Active' : 'Inactive' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>
        </div>

        <!-- 2. QUESTION BANK VIEW -->
        <div v-if="activeMenu === 'questions'" class="max-w-4xl">
          <div class="flex justify-between items-center mb-6">
            <h2 class="text-2xl font-bold text-gray-800">Question Bank</h2>
            <div>
              <el-button @click="fetchQuestions" :loading="questionsLoading" class="mr-2">Refresh</el-button>
              <el-button type="primary" @click="activeMenu = 'upload'">+ Add Questions</el-button>
            </div>
          </div>

          <div v-if="questionsLoading" class="py-10 text-center text-gray-500">Loading questions...</div>

          <el-empty v-else-if="questions.length === 0" description="No questions found.">
            <p class="text-gray-500 text-sm mt-2">
              Upload some questions via the 'Upload CSV/XML' tab to get started!
            </p>
          </el-empty>

          <div v-else class="space-y-6">
            <el-card v-for="q in questions" :key="q.id" class="shadow-sm">
              <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ q.stem }}</h3>

              <div class="space-y-2 mb-4">
                <div v-for="(opt, idx) in q.options" :key="idx"
                     @click="submitAnswer(q, opt)"
                     class="p-3 rounded-md border text-sm transition-colors"
                     :class="{
                       'cursor-pointer hover:bg-gray-50': userAnswers[q.id] === undefined,
                       'cursor-not-allowed': userAnswers[q.id] !== undefined,
                       'bg-red-50 border-red-300 text-red-800': userAnswers[q.id] === opt && !answerResults[q.id],
                       'bg-green-50 border-green-300 text-green-800 font-medium': userAnswers[q.id] !== undefined && opt === q.correct_answer,
                       'bg-gray-50 border-gray-200 text-gray-700': userAnswers[q.id] !== undefined && opt !== q.correct_answer && !(userAnswers[q.id] === opt && !answerResults[q.id])
                     }">
                  {{ String.fromCharCode(65 + idx) }}. {{ opt }}

                  <span v-if="userAnswers[q.id] === opt && !answerResults[q.id]" class="ml-2 text-xs font-bold text-red-600">(Your Answer)</span>
                  <span v-if="userAnswers[q.id] !== undefined && opt === q.correct_answer" class="ml-2 text-xs font-bold text-green-600">(Correct Answer)</span>
                </div>
              </div>

              <!-- Explanation shown after answering -->
              <div v-if="userAnswers[q.id] !== undefined && (q.explanation || q.knowledge_points)" class="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-900">
                <p v-if="q.knowledge_points" class="mb-2"><strong>Tags:</strong> <el-tag size="small" type="info">{{ q.knowledge_points }}</el-tag></p>
                <p v-if="q.explanation"><strong>Explanation:</strong> {{ q.explanation }}</p>
              </div>
            </el-card>
          </div>
        </div>

        <!-- 3. UPLOAD QUESTIONS VIEW -->
        <div v-if="activeMenu === 'upload'" class="max-w-2xl">
          <h2 class="text-2xl font-bold text-gray-800 mb-2">Upload Question Bank</h2>
          <p class="text-gray-600 mb-6 text-sm">Upload a CSV or XML file containing new questions to import them into the database.</p>
          
          <el-card class="shadow-sm">
            <div class="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
              <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="mt-4 flex text-sm text-gray-600 justify-center">
                <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
                  <span>Upload a file</span>
                  <input id="file-upload" name="file-upload" type="file" class="sr-only" accept=".csv, .xml" @change="onFileChange" />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500 mt-2">CSV, XML up to 10MB</p>
            </div>
            
            <div v-if="selectedFile" class="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-md text-sm flex justify-between items-center">
              <span class="font-medium">Selected: {{ selectedFile.name }}</span>
              <el-button type="primary" size="small" @click="uploadQuestionsFile" :loading="isUploading">
                Confirm Upload
              </el-button>
            </div>
          </el-card>
        </div>

        <!-- 4. MISTAKE NOTEBOOK (WRONG QUESTIONS) VIEW -->
        <div v-if="activeMenu === 'mistakes'" class="max-w-4xl">
          <div class="flex justify-between items-center mb-6">
            <div>
              <h2 class="text-2xl font-bold text-gray-800">Mistake Notebook</h2>
              <p class="text-gray-600 text-sm mt-1">Review the questions you answered incorrectly to strengthen your knowledge.</p>
            </div>
            <el-button icon="Refresh" circle @click="fetchMyErrors" :loading="isLoading" />
          </div>

          <div v-if="isLoading" class="py-10 text-center text-gray-500">Loading your mistakes...</div>
          
          <el-empty v-else-if="errorRecords.length === 0" description="Great job! Your mistake notebook is empty." />
          
          <div v-else class="space-y-6">
            <el-card v-for="record in errorRecords" :key="record.id" class="shadow-sm border-l-4 border-l-red-500">
              <template v-if="record.question">
                <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ record.question.stem }}</h3>
                
                <div class="space-y-2 mb-4">
                  <div v-for="(option, index) in record.question.options" :key="index" 
                       class="p-3 rounded-md border text-sm"
                       :class="{
                         'bg-red-50 border-red-300 text-red-800': option === record.selected_option,
                         'bg-green-50 border-green-300 text-green-800 font-medium': option === record.question.correct_answer,
                         'bg-gray-50 border-gray-200 text-gray-700': option !== record.selected_option && option !== record.question.correct_answer
                       }">
                    {{ String.fromCharCode(65 + index) }}. {{ option }}
                    
                    <span v-if="option === record.selected_option" class="ml-2 text-xs font-bold text-red-600">(Your Answer)</span>
                    <span v-if="option === record.question.correct_answer" class="ml-2 text-xs font-bold text-green-600">(Correct Answer)</span>
                  </div>
                </div>

                <div v-if="record.question.explanation || record.question.knowledge_points" class="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-900">
                  <p v-if="record.question.knowledge_points" class="mb-2"><strong>Tags:</strong> <el-tag size="small" type="info">{{ record.question.knowledge_points }}</el-tag></p>
                  <p v-if="record.question.explanation"><strong>Explanation:</strong> {{ record.question.explanation }}</p>
                </div>
              </template>
              <template v-else>
                <div class="text-gray-500 text-sm">Question data is no longer available. (ID: {{ record.question_id }})</div>
              </template>
            </el-card>
          </div>
        </div>

      </main>
    </div>
  </div>
</template>

<style scoped>
/* App layout completely handled by Tailwind + Element Plus */
</style>