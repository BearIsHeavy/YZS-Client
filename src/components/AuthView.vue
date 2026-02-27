<!-- src/components/AuthView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { UserCreate, Token } from '../types';
import { API_BASE_URL, handleApiError } from '../utils/api';

const emit = defineEmits<{
  (e: 'authenticated', token: string): void;
}>();

const currentAuthView = ref<'login' | 'register'>('login');
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

const registerForm = ref<UserCreate>({ email: '', password: '' });
const loginForm = ref({ username: '', password: '' });

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
  <div class="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8 font-sans">
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
</template>