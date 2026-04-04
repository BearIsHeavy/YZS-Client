<!-- src/components/AuthView.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { UserCreate } from '../types';
import { userApi } from '../utils/api';
import { useI18n } from '../i18n';

const { t } = useI18n();

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
    successMessage.value = t('messages.registerSuccess');
    currentAuthView.value = 'login';
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : t('messages.registerFailed');
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
    errorMessage.value = error instanceof Error ? error.message : t('messages.loginFailed');
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
        <span v-if="currentAuthView === 'login'">{{ t('auth.loginTitle') }}</span>
        <span v-else>{{ t('auth.registerTitle') }}</span>
      </h2>
      <p class="mt-2 text-sm text-gray-600">
        <span v-if="currentAuthView === 'login'">{{ t('auth.loginSubtitle') }}</span>
        <span v-else>{{ t('auth.registerSubtitle') }}</span>
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
          <el-form-item :label="t('auth.email')">
            <el-input
              v-model="loginForm.username"
              type="email"
              placeholder="your@email.com"
              :disabled="isLoading"
            />
          </el-form-item>

          <el-form-item :label="t('auth.password')">
            <el-input
              v-model="loginForm.password"
              type="password"
              placeholder="Enter your password"
              :disabled="isLoading"
              @keyup.enter="loginUser"
            />
          </el-form-item>

          <el-button
            type="primary"
            @click="loginUser"
            :loading="isLoading"
            class="w-full mb-4"
            size="large"
          >
            {{ t('auth.login') }}
          </el-button>

          <div class="text-center text-sm">
            <span class="text-gray-600">{{ t('auth.noAccount') }}</span>
            <el-button type="text" @click="currentAuthView = 'register'" class="text-indigo-600">
              {{ t('auth.registerNow') }}
            </el-button>
          </div>
        </el-form>

        <!-- Register Form -->
        <el-form v-else label-position="top">
          <el-form-item :label="t('auth.name')" required>
            <el-input
              v-model="registerForm.name"
              placeholder="Your full name"
              :disabled="isLoading"
            />
          </el-form-item>

          <el-form-item :label="t('auth.email')" required>
            <el-input
              v-model="registerForm.email"
              type="email"
              placeholder="your@email.com"
              :disabled="isLoading"
            />
          </el-form-item>

          <el-form-item :label="t('auth.password')" required>
            <el-input
              v-model="registerForm.password"
              type="password"
              placeholder="At least 6 characters"
              :disabled="isLoading"
            />
          </el-form-item>

          <el-form-item :label="t('auth.phone')">
            <el-input
              v-model="registerForm.phone"
              placeholder="Your phone number (optional)"
              :disabled="isLoading"
            />
          </el-form-item>

          <el-form-item :label="t('auth.gender')">
            <el-select v-model="registerForm.gender" class="w-full" :disabled="isLoading">
              <el-option :label="t('auth.genderUnknown')" :value="0" />
              <el-option :label="t('auth.genderMale')" :value="1" />
              <el-option :label="t('auth.genderFemale')" :value="2" />
            </el-select>
          </el-form-item>

          <el-button
            type="primary"
            @click="registerUser"
            :loading="isLoading"
            class="w-full mb-4"
            size="large"
          >
            {{ t('auth.register') }}
          </el-button>

          <div class="text-center text-sm">
            <span class="text-gray-600">{{ t('auth.alreadyHaveAccount') }}</span>
            <el-button type="text" @click="currentAuthView = 'login'" class="text-indigo-600">
              {{ t('auth.loginNow') }}
            </el-button>
          </div>
        </el-form>
      </el-card>
    </div>

    <!-- Footer -->
    <div class="mt-8 text-center text-sm text-gray-600">
      <p>&copy; {{ new Date().getFullYear() }} YanZhuShou. All rights reserved.</p>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 16px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
