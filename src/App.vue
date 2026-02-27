<!-- App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';

// ==========================================
// TYPES (Derived from openapi.json)
// ==========================================

interface UserCreate {
  email: string;
  password: string; // 8 to 64 characters
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
  input?: unknown;
  ctx?: Record<string, unknown>;
}

interface HTTPValidationError {
  detail: ValidationError[];
}

// ==========================================
// STATE & CONFIGURATION
// ==========================================

const API_BASE_URL = 'http://localhost:8000'; // Adjust to match your FastAPI backend port
type ViewState = 'login' | 'register' | 'dashboard';

const currentView = ref<ViewState>('login');
const token = ref<string | null>(localStorage.getItem('access_token'));
const currentUser = ref<UserResponse | null>(null);

const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

// Forms
const registerForm = ref<UserCreate>({ email: '', password: '' });
const loginForm = ref({ username: '', password: '' }); // 'username' acts as the email for OAuth2

// ==========================================
// API UTILITIES
// ==========================================

/**
 * Helper to parse backend errors strictly
 */
async function handleApiError(response: Response): Promise<never> {
  let errorMsg = `HTTP Error: ${response.status}`;
  try {
    const errorData = await response.json();
    if (errorData.detail) {
      if (Array.isArray(errorData.detail)) {
        // Handle HTTPValidationError (Array of ValidationErrors)
        errorMsg = (errorData as HTTPValidationError).detail
          .map((e: ValidationError) => e.msg)
          .join(', ');
      } else if (typeof errorData.detail === 'string') {
        // Handle standard HTTPException
        errorMsg = errorData.detail;
      }
    }
  } catch {
    // Fallback if response isn't JSON
    errorMsg = await response.text() || errorMsg;
  }
  throw new Error(errorMsg);
}

// ==========================================
// API ACTIONS
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

    if (!response.ok) {
      await handleApiError(response);
    }

    // Success
    registerForm.value = { email: '', password: '' };
    successMessage.value = 'Registration successful! Please log in.';
    currentView.value = 'login';
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
    // The /login endpoint requires application/x-www-form-urlencoded
    const params = new URLSearchParams();
    params.append('username', loginForm.value.username);
    params.append('password', loginForm.value.password);
    params.append('grant_type', 'password');

    const response = await fetch(`${API_BASE_URL}/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params.toString(),
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    const data = (await response.json()) as Token;
    
    token.value = data.access_token;
    localStorage.setItem('access_token', data.access_token);
    loginForm.value = { username: '', password: '' };
    
    await fetchUserProfile();
    currentView.value = 'dashboard';
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
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      await handleApiError(response);
    }

    currentUser.value = (await response.json()) as UserResponse;
  } catch (error: unknown) {
    console.error('Failed to fetch profile:', error);
    // If token is invalid/expired, clear state
    logoutLocalState();
    errorMessage.value = 'Session expired or invalid. Please log in again.';
  }
}

async function logoutUser(): Promise<void> {
  if (!token.value) return;
  isLoading.value = true;

  try {
    const response = await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token.value}`,
        'Content-Type': 'application/json'
      },
    });

    if (!response.ok) {
      console.warn('Backend logout encountered an issue, logging out locally anyway.');
    }
  } catch (error: unknown) {
    console.error('Logout request failed:', error);
  } finally {
    logoutLocalState();
    isLoading.value = false;
  }
}

function logoutLocalState(): void {
  token.value = null;
  currentUser.value = null;
  localStorage.removeItem('access_token');
  currentView.value = 'login';
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(async () => {
  if (token.value) {
    await fetchUserProfile();
    if (currentUser.value) {
      currentView.value = 'dashboard';
    }
  }
});
</script>

<template>
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <h2 class="mt-6 text-center text-3xl font-extrabold text-gray-900">
        <span v-if="currentView === 'login'">Sign in to your account</span>
        <span v-else-if="currentView === 'register'">Create a new account</span>
        <span v-else-if="currentView === 'dashboard'">Dashboard</span>
      </h2>
    </div>

    <div class="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
      <!-- Element Plus Card used alongside Tailwind utility classes -->
      <el-card class="shadow sm:rounded-lg sm:px-4">
        
        <!-- Alerts -->
        <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon :closable="false" class="mb-4" />
        <el-alert v-if="successMessage" :title="successMessage" type="success" show-icon :closable="false" class="mb-4" />

        <!-- ========================================== -->
        <!-- LOGIN VIEW -->
        <!-- ========================================== -->
        <el-form v-if="currentView === 'login'" @submit.prevent="loginUser" label-position="top">
          <el-form-item label="Email address">
            <el-input 
              v-model="loginForm.username" 
              type="email" 
              autocomplete="email" 
              placeholder="Enter your email"
              required 
            />
          </el-form-item>

          <el-form-item label="Password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              autocomplete="current-password" 
              placeholder="Enter your password"
              show-password 
              required 
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isLoading" class="w-full">
              Sign in
            </el-button>
          </el-form-item>
          
          <div class="mt-4 text-center">
            <el-link type="primary" @click.prevent="currentView = 'register'; errorMessage = null; successMessage = null;">
              Don't have an account? Register here.
            </el-link>
          </div>
        </el-form>

        <!-- ========================================== -->
        <!-- REGISTER VIEW -->
        <!-- ========================================== -->
        <el-form v-else-if="currentView === 'register'" @submit.prevent="registerUser" label-position="top">
          <el-form-item label="Email address">
            <el-input 
              v-model="registerForm.email" 
              type="email" 
              autocomplete="email" 
              placeholder="Enter your email"
              required 
            />
          </el-form-item>

          <el-form-item label="Password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              autocomplete="new-password" 
              placeholder="Create a strong password"
              show-password 
              required 
              minlength="8" 
              maxlength="64" 
            />
            <div class="text-xs text-gray-500 mt-1">Must be between 8 and 64 characters.</div>
          </el-form-item>

          <el-form-item>
            <el-button type="primary" native-type="submit" :loading="isLoading" class="w-full">
              Register
            </el-button>
          </el-form-item>
          
          <div class="mt-4 text-center">
            <el-link type="primary" @click.prevent="currentView = 'login'; errorMessage = null; successMessage = null;">
              Already have an account? Sign in.
            </el-link>
          </div>
        </el-form>

        <!-- ========================================== -->
        <!-- DASHBOARD VIEW -->
        <!-- ========================================== -->
        <div v-else-if="currentView === 'dashboard' && currentUser">
          <el-descriptions title="Welcome!" :column="1" border class="mb-6">
            <el-descriptions-item label="User ID">
              {{ currentUser.id }}
            </el-descriptions-item>
            <el-descriptions-item label="Email address">
              {{ currentUser.email }}
            </el-descriptions-item>
            <el-descriptions-item label="Account Status">
              <el-tag :type="currentUser.is_active ? 'success' : 'danger'">
                {{ currentUser.is_active ? 'Active' : 'Inactive' }}
              </el-tag>
            </el-descriptions-item>
          </el-descriptions>

          <el-button @click="logoutUser" :loading="isLoading" class="w-full">
            Log out
          </el-button>
        </div>

      </el-card>
    </div>
  </div>
</template>

<style scoped>
/* * Tailwind and Element Plus generally mix well.
 * Make sure you import element-plus/dist/index.css in your main.ts file! 
 */
</style>