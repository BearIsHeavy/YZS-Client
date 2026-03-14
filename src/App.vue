<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { UserResponse } from './types';
import { userApi } from './utils/api';
import { useI18n } from './i18n';

// Import components
import AuthView from './components/AuthView.vue';
import ProfileView from './components/ProfileView.vue';
import QuestionBankView from './components/QuestionBankView.vue';
import UploadQuestions from './components/UploadQuestions.vue';
import MistakeNotebook from './components/MistakeNotebook.vue';
import PracticeView from './components/PracticeView.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import FeedbackView from './components/FeedbackView.vue';

// Initialize i18n
const { t } = useI18n();

type DashboardMenu = 'profile' | 'questions' | 'upload' | 'practice' | 'mistakes' | 'feedback';

// Global App State
const token = ref<string | null>(localStorage.getItem('access_token'));
const currentUser = ref<UserResponse | null>(null);
const activeMenu = ref<DashboardMenu>('profile');
const isAppLoading = ref<boolean>(false);
const globalError = ref<string | null>(null);
const isSidebarCollapsed = ref<boolean>(false);

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
    currentUser.value = await userApi.getCurrentUser(token.value);
    activeMenu.value = 'profile';
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
    // Note: Backend may not have a logout endpoint
    // await fetch(`${API_BASE_URL}/logout`, {
    //   method: 'POST',
    //   headers: { 'Authorization': `Bearer ${token.value}` },
    // });
  } catch (error: unknown) {
    console.error('Logout request failed:', error);
  } finally {
    logoutLocalState();
  }
}

function handleUserUpdate(updatedUser: UserResponse): void {
  currentUser.value = updatedUser;
}

onMounted(() => {
  if (token.value) {
    fetchUserProfile();
  }
});

// Menu items configuration (using i18n)
const menuItems = [
  { key: 'profile' as DashboardMenu, labelKey: 'nav.profile', icon: 'User' },
  { key: 'questions' as DashboardMenu, labelKey: 'nav.questions', icon: 'Files' },
  { key: 'upload' as DashboardMenu, labelKey: 'nav.upload', icon: 'Upload' },
  { key: 'practice' as DashboardMenu, labelKey: 'nav.practice', icon: 'Reading' },
  { key: 'mistakes' as DashboardMenu, labelKey: 'nav.mistakes', icon: 'Document' },
  { key: 'feedback' as DashboardMenu, labelKey: 'nav.feedback', icon: 'Chat' }
] as const;
</script>

<template>
  <!-- Full Screen Loader during initial session check -->
  <div v-if="isAppLoading && !currentUser" class="min-h-screen bg-gradient-to-br from-indigo-100 via-purple-50 to-pink-100 flex items-center justify-center">
    <div class="text-center">
      <div class="w-16 h-16 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-4 animate-pulse">
        <svg class="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
        </svg>
      </div>
      <p class="text-gray-600 font-medium">Loading...</p>
    </div>
  </div>

  <!-- Auth View Component -->
  <AuthView
    v-else-if="!token || !currentUser"
    @authenticated="handleAuthenticated"
  />

  <!-- Dashboard Layout -->
  <div v-else class="h-screen flex flex-col bg-gray-50 font-sans">
    <!-- Header -->
    <header class="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 text-white shadow-lg flex justify-between items-center px-6 py-3 z-20">
      <div class="flex items-center gap-3">
        <div class="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
        </div>
        <div>
          <h1 class="text-lg font-bold">{{ t('app.name') }}</h1>
          <p class="text-xs text-white/80">{{ t('app.tagline') }}</p>
        </div>
      </div>

      <div class="flex items-center gap-4">
        <!-- Language Switcher -->
        <LanguageSwitcher />
        
        <div class="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-sm px-4 py-2 rounded-full">
          <div class="w-8 h-8 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
            {{ currentUser.name.charAt(0).toUpperCase() }}
          </div>
          <div class="text-sm">
            <div class="font-medium">{{ currentUser.name }}</div>
            <div class="text-xs text-white/70">{{ currentUser.email }}</div>
          </div>
        </div>
        <el-button
          size="small"
          @click="logoutUser"
          class="bg-white/20 hover:bg-white/30 border-0 text-white"
          circle
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path>
            </svg>
          </template>
        </el-button>
      </div>
    </header>

    <div class="flex flex-1 overflow-hidden">
      <!-- Sidebar Navigation -->
      <aside 
        class="bg-white border-r border-gray-200 shadow-sm z-10 transition-all duration-300 flex flex-col"
        :class="isSidebarCollapsed ? 'w-20' : 'w-64'"
      >
        <!-- Collapse Toggle -->
        <div class="p-4 border-b border-gray-100 flex justify-end">
          <el-button 
            text 
            size="small" 
            @click="isSidebarCollapsed = !isSidebarCollapsed"
            class="text-gray-500 hover:text-indigo-600"
          >
            <svg 
              class="w-5 h-5 transition-transform duration-300" 
              :class="isSidebarCollapsed ? 'rotate-180' : ''"
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7"></path>
            </svg>
          </el-button>
        </div>

        <!-- Menu Items -->
        <el-menu 
          :default-active="activeMenu" 
          @select="(index: string) => activeMenu = index as DashboardMenu" 
          class="flex-1 border-none pt-4"
          :collapse="isSidebarCollapsed"
          :collapse-transition="true"
        >
          <el-menu-item 
            v-for="item in menuItems" 
            :key="item.key" 
            :index="item.key"
            class="mx-2 rounded-lg mb-1"
          >
            <template #title>
              <span class="flex items-center gap-3">
                <!-- Icons based on menu key -->
                <svg v-if="item.key === 'profile'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
                <svg v-else-if="item.key === 'questions'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                </svg>
                <svg v-else-if="item.key === 'upload'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                </svg>
                <svg v-else-if="item.key === 'practice'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
                <svg v-else-if="item.key === 'mistakes'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <svg v-else-if="item.key === 'feedback'" class="w-5 h-5" style="color: #374151;" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                <span v-show="!isSidebarCollapsed" style="color: #374151;">{{ t(item.labelKey) }}</span>
              </span>
            </template>
          </el-menu-item>
        </el-menu>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-gray-100">
          <div v-if="!isSidebarCollapsed" class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-3">
            <div class="text-xs font-medium text-indigo-900 mb-1">Need Help?</div>
            <div class="text-xs text-indigo-600">Check the documentation for usage guide.</div>
          </div>
        </div>
      </aside>

      <!-- Main Content Area -->
      <main class="flex-1 overflow-y-auto p-6 bg-gray-50">
        <el-alert 
          v-if="globalError" 
          :title="globalError" 
          type="error" 
          show-icon 
          class="mb-6" 
          @close="globalError = null" 
        />

        <div class="h-full">
          <ProfileView
            v-if="activeMenu === 'profile'"
            :user="currentUser"
            @user-updated="handleUserUpdate"
          />

          <QuestionBankView
            v-else-if="activeMenu === 'questions'"
            :token="token"
            @navigate-to-upload="activeMenu = 'upload'"
          />

          <UploadQuestions
            v-else-if="activeMenu === 'upload'"
            :token="token"
          />

          <PracticeView
            v-else-if="activeMenu === 'practice'"
            :token="token"
          />

          <MistakeNotebook
            v-else-if="activeMenu === 'mistakes'"
            :token="token"
          />

          <FeedbackView
            v-else-if="activeMenu === 'feedback'"
            :token="token"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<style scoped>
/* Custom menu styles */
:deep(.el-menu-item) {
  height: 50px;
  line-height: 50px;
  border-radius: 8px;
  margin: 4px 8px;
  transition: all 0.3s ease;
}

:deep(.el-menu-item:hover) {
  background-color: #f3f4f6;
}

:deep(.el-menu-item.is-active) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white !important;
}

:deep(.el-menu-item.is-active .el-icon),
:deep(.el-menu-item.is-active span) {
  color: white !important;
}

/* Custom scrollbar */
main::-webkit-scrollbar {
  width: 8px;
}

main::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

main::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
