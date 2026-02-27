<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { UserResponse } from './types';
import { API_BASE_URL, handleApiError } from './utils/api';

// Import newly extracted components
import AuthView from './components/AuthView.vue';
import ProfileView from './components/ProfileView.vue';
import QuestionBank from './components/QuestionBank.vue';
import UploadQuestions from './components/UploadQuestions.vue';
import MistakeNotebook from './components/MistakeNotebook.vue';

type DashboardMenu = 'profile' | 'questions' | 'upload' | 'mistakes';

// Global App State
const token = ref<string | null>(localStorage.getItem('access_token'));
const currentUser = ref<UserResponse | null>(null);
const activeMenu = ref<DashboardMenu>('profile');
const isAppLoading = ref<boolean>(false);
const globalError = ref<string | null>(null);

// ==========================================
// SESSION MANAGEMENT
// ==========================================

async function handleAuthenticated(newToken: string): Promise<void> {
  token.value = newToken;
  localStorage.setItem('access_token', newToken);
  await fetchUserProfile();
}

async function fetchUserProfile(): Promise<void> {
  if (!token.value) return;
  isAppLoading.value = true;
  globalError.value = null;

  try {
    const response = await fetch(`${API_BASE_URL}/users/me`, {
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
    if (!response.ok) await handleApiError(response);
    
    currentUser.value = (await response.json()) as UserResponse;
    activeMenu.value = 'profile'; // Default view upon login
  } catch (error: unknown) {
    console.error('Failed to fetch profile:', error);
    logoutLocalState();
    globalError.value = 'Session expired. Please log in again.';
  } finally {
    isAppLoading.value = false;
  }
}

function logoutLocalState(): void {
  token.value = null;
  currentUser.value = null;
  localStorage.removeItem('access_token');
}

async function logoutUser(): Promise<void> {
  if (!token.value) return;
  try {
    await fetch(`${API_BASE_URL}/logout`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token.value}` },
    });
  } catch (error: unknown) {
    console.error('Logout request failed:', error);
  } finally {
    logoutLocalState();
  }
}

onMounted(() => {
  if (token.value) {
    fetchUserProfile();
  }
});
</script>

<template>
  <!-- Full Screen Loader during initial session check -->
  <div v-if="isAppLoading && !currentUser" class="min-h-screen bg-gray-50 flex items-center justify-center">
    <el-spinner size="large" />
  </div>

  <!-- Auth View Component -->
  <AuthView 
    v-else-if="!token || !currentUser" 
    @authenticated="handleAuthenticated" 
  />

  <!-- Dashboard Layout -->
  <div v-else class="h-screen flex flex-col bg-gray-50 font-sans">
    
    <header class="bg-indigo-600 text-white shadow-md flex justify-between items-center px-6 py-4">
      <div class="text-xl font-bold flex items-center gap-2">
        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
        Smart Learning Platform
      </div>
      <div class="flex items-center gap-4">
        <span class="text-sm font-medium">{{ currentUser?.email }}</span>
        <el-button size="small" @click="logoutUser" plain>Logout</el-button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside class="w-64 bg-white border-r border-gray-200 shadow-sm z-10">
        <el-menu :default-active="activeMenu" @select="(index: string) => activeMenu = index as DashboardMenu" class="h-full border-none pt-4">
          <el-menu-item index="profile">Profile Settings</el-menu-item>
          <el-menu-item index="questions">Question Bank</el-menu-item>
          <el-menu-item index="upload">Upload CSV/XML</el-menu-item>
          <el-menu-item index="mistakes">Mistake Notebook</el-menu-item>
        </el-menu>
      </aside>

      <!-- Main Content Area uses v-if to unmount and remount components to reset their states naturally -->
      <main class="flex-1 overflow-y-auto p-8">
        <el-alert v-if="globalError" :title="globalError" type="error" show-icon class="mb-6" @close="globalError = null" />

        <ProfileView v-if="activeMenu === 'profile'" :user="currentUser" />
        
        <QuestionBank 
          v-else-if="activeMenu === 'questions'" 
          :token="token" 
          @navigate-to-upload="activeMenu = 'upload'" 
        />
        
        <UploadQuestions v-else-if="activeMenu === 'upload'" :token="token" />
        
        <MistakeNotebook v-else-if="activeMenu === 'mistakes'" :token="token" />
      </main>
    </div>
  </div>
</template>

<style scoped>
/* App layout completely handled by Tailwind + Element Plus */
</style>