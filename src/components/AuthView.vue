<!-- src/components/AuthView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { UserCreate } from '../types';
import { userApi } from '../utils/api';

const emit = defineEmits<{
  (e: 'authenticated', token: string): void;
}>();

const currentAuthView = ref<'login' | 'register'>('login');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const registerForm = ref<UserCreate>({ 
  email: '', 
  name: '',
  password: ''
});
const loginForm = ref({ username: '', password: '' });

async function registerUser(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    await userApi.register(registerForm.value);
    registerForm.value = { email: '', name: '', password: '' };
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
    const data = await userApi.login(loginForm.value.username, loginForm.value.password);
    loginForm.value = { username: '', password: '' };
    emit('authenticated', data.access_token);
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}
</script>

<template>
  <div class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
    <!-- Logo and Title -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md text-center mb-8">
      <div class="flex justify-center">
        <div class="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center">
          <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
      </div>
      <h2 class="mt-6 text-3xl font-bold text-gray-900">
        <span v-if="currentAuthView === 'login'">Welcome Back</span>
        <span v-else>Create Account</span>
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        <span v-if="currentAuthView === 'login'">Sign in to access your question banks</span>
        <span v-else>Join us to start managing questions</span>
      </p>
    </div>

    <!-- Auth Card -->
    <div class="sm:mx-auto sm:w-full sm:max-w-md">
      <el-card class="shadow-xl border-0" body-class="px-8 py-10">
        <el-alert 
          v-if="errorMessage" 
          :title="errorMessage" 
          type="error" 
          show-icon 
          :closable="false" 
          class="mb-6" 
        />
        <el-alert 
          v-if="successMessage" 
          :title="successMessage" 
          type="success" 
          show-icon 
          :closable="false" 
          class="mb-6" 
        />

        <!-- Login Form -->
        <el-form v-if="currentAuthView === 'login'" label-position="top">
          <el-form-item label="Email Address">
            <el-input 
              v-model="loginForm.username" 
              type="email" 
              placeholder="Enter your email"
              prefix-icon="Message"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="Password">
            <el-input 
              v-model="loginForm.password" 
              type="password" 
              show-password 
              placeholder="Enter your password"
              prefix-icon="Lock"
              size="large"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              native-type="submit" 
              :loading="isLoading" 
              size="large"
              class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-md"
              @click="loginUser"
            >
              Sign In
            </el-button>
          </el-form-item>
          <div class="text-center mt-4">
            <el-link 
              type="primary" 
              @click.prevent="currentAuthView = 'register'; errorMessage = null;"
              class="text-sm font-medium"
            >
              Don't have an account? <span class="underline">Register here</span>
            </el-link>
          </div>
        </el-form>

        <!-- Register Form -->
        <el-form v-else label-position="top">
          <el-form-item label="Full Name">
            <el-input 
              v-model="registerForm.name" 
              placeholder="Enter your name"
              prefix-icon="User"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="Email Address">
            <el-input 
              v-model="registerForm.email" 
              type="email" 
              placeholder="Enter your email"
              prefix-icon="Message"
              size="large"
              clearable
            />
          </el-form-item>
          <el-form-item label="Password">
            <el-input 
              v-model="registerForm.password" 
              type="password" 
              show-password 
              placeholder="Create a password"
              prefix-icon="Lock"
              size="large"
              minlength="6"
              maxlength="64"
            />
          </el-form-item>
          <el-form-item>
            <el-button 
              type="primary" 
              native-type="submit" 
              :loading="isLoading" 
              size="large"
              class="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0 shadow-md"
              @click="registerUser"
            >
              Create Account
            </el-button>
          </el-form-item>
          <div class="text-center mt-4">
            <el-link 
              type="primary" 
              @click.prevent="currentAuthView = 'login'; errorMessage = null;"
              class="text-sm font-medium"
            >
              Already have an account? <span class="underline">Sign in</span>
            </el-link>
          </div>
        </el-form>
      </el-card>

      <!-- Footer -->
      <p class="mt-8 text-center text-xs text-gray-500">
        &copy; 2026 YanZhuShou - Question Bank Management System
      </p>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
}

:deep(.el-input.is-focus .el-input__wrapper) {
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
}

:deep(.el-button--primary) {
  transition: all 0.3s ease;
}

:deep(.el-card) {
  border-radius: 16px;
  backdrop-filter: blur(10px);
}
</style>
