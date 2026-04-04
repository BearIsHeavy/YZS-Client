<!-- src/App.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { UserResponse } from './types';
import { userApi } from './utils/api';
import { useI18n } from './i18n';
import { usePlugins } from './plugins';
import { PLUGIN_DEFINITIONS } from './plugins/registry';

// Import Components
import AuthView from './components/AuthView.vue';
import ProfileView from './components/ProfileView.vue';
import QuestionBankView from './components/QuestionBankView.vue';
import UploadQuestions from './components/UploadQuestions.vue';
import MistakeNotebook from './components/MistakeNotebook.vue';
import PracticeView from './components/PracticeView.vue';
import LanguageSwitcher from './components/LanguageSwitcher.vue';
import FeedbackView from './components/FeedbackView.vue';
import BlogView from './components/BlogView.vue';
import BlogDetail from './components/BlogDetail.vue';
import BlogEditor from './components/BlogEditor.vue';
import SchoolView from './components/SchoolView.vue';

// New Plugin Components
import BooksView from './components/BooksView.vue';
import KnowledgeView from './components/KnowledgeView.vue';
import ReportsView from './components/ReportsView.vue';
import RAGChatView from './components/RAGChatView.vue';
import PluginSettings from './plugins/components/PluginSettings.vue';

// Import Element Plus icons
import {
  Setting
} from '@element-plus/icons-vue';

// Initialize i18n
const { t } = useI18n();

// Initialize Plugin System
const { pluginConfig, isEnabled } = usePlugins();

type DashboardMenu = 'profile' | 'questions' | 'upload' | 'practice' | 'mistakes' | 'feedback' | 'blog' | 'school' | 'books' | 'knowledge' | 'reports' | 'rag' | 'pluginSettings';

// Global App State
const token = ref<string | null>(localStorage.getItem('access_token'));
const currentUser = ref<UserResponse | null>(null);
const activeMenu = ref<DashboardMenu>('profile');
const isAppLoading = ref<boolean>(false);
const globalError = ref<string | null>(null);
const isSidebarCollapsed = ref<boolean>(false);
const showPluginSettings = ref(false);

// Blog specific state
const selectedBlogId = ref<number | null>(null);
const editingBlogId = ref<number | null>(null);
const isCreatingBlog = ref<boolean>(false);

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

// ==========================================
// BLOG NAVIGATION HANDLERS
// ==========================================

function handleViewBlog(blogId: number): void {
  selectedBlogId.value = blogId;
  editingBlogId.value = null;
  isCreatingBlog.value = false;
}

function handleCreateBlog(): void {
  selectedBlogId.value = null;
  editingBlogId.value = null;
  isCreatingBlog.value = true;
}

function handleEditBlog(blogId: number): void {
  selectedBlogId.value = null;
  editingBlogId.value = blogId;
  isCreatingBlog.value = false;
}

function handleBlogBack(): void {
  selectedBlogId.value = null;
  editingBlogId.value = null;
  isCreatingBlog.value = false;
}

function handleBlogSaved(): void {
  handleBlogBack();
}

onMounted(() => {
  if (token.value) {
    fetchUserProfile();
  }
});

// Dynamic menu items based on plugin configuration
const menuItems = computed(() => {
  return PLUGIN_DEFINITIONS
    .filter(plugin => pluginConfig.value[plugin.id]?.enabled ?? plugin.defaultEnabled)
    .sort((a, b) => (pluginConfig.value[a.id]?.order ?? a.order) - (pluginConfig.value[b.id]?.order ?? b.order));
});

function handleMenuSelect(index: string): void {
  if (index === 'pluginSettings') {
    showPluginSettings.value = true;
  } else {
    activeMenu.value = index as DashboardMenu;
  }
}
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
          @select="handleMenuSelect"
          class="flex-1 border-none pt-4"
          :collapse="isSidebarCollapsed"
          :collapse-transition="true"
        >
          <el-menu-item
            v-for="item in menuItems"
            :key="item.id"
            :index="item.menuKey"
            class="mx-2 rounded-lg mb-1"
          >
            <el-icon :size="20" style="color: #374151;">
              <component :is="item.icon" />
            </el-icon>
            <span style="color: #374151;">{{ t(item.nameKey) }}</span>
          </el-menu-item>
        </el-menu>

        <!-- Sidebar Footer -->
        <div class="p-4 border-t border-gray-100">
          <div
            @click="showPluginSettings = true"
            class="flex items-center gap-3 px-3 py-3 mx-2 rounded-lg mb-1 text-gray-500 hover:text-indigo-600 hover:bg-gray-100 cursor-pointer transition-colors"
          >
            <el-icon :size="20" style="color: #374151;">
              <Setting />
            </el-icon>
            <span v-if="!isSidebarCollapsed" style="color: #374151;">{{ t('nav.pluginSettings') }}</span>
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
          <!-- Core Plugins -->
          <ProfileView
            v-if="activeMenu === 'profile' && isEnabled('profile')"
            :user="currentUser"
            @user-updated="handleUserUpdate"
          />

          <BlogView
            v-else-if="activeMenu === 'blog' && !selectedBlogId && !editingBlogId && !isCreatingBlog && isEnabled('blog')"
            :token="token"
            @view-blog="handleViewBlog"
            @create-blog="handleCreateBlog"
            @edit-blog="handleEditBlog"
          />

          <SchoolView
            v-else-if="activeMenu === 'school' && isEnabled('school')"
            :token="token"
          />

          <QuestionBankView
            v-else-if="activeMenu === 'questions' && isEnabled('questions')"
            :token="token"
            @navigate-to-upload="activeMenu = 'upload'"
          />

          <UploadQuestions
            v-else-if="activeMenu === 'upload' && isEnabled('upload')"
            :token="token"
          />

          <PracticeView
            v-else-if="activeMenu === 'practice' && isEnabled('practice')"
            :token="token"
          />

          <MistakeNotebook
            v-else-if="activeMenu === 'mistakes' && isEnabled('mistakes')"
            :token="token"
          />

          <FeedbackView
            v-else-if="activeMenu === 'feedback' && isEnabled('feedback')"
            :token="token"
          />

          <!-- New Learning Plugins -->
          <BooksView
            v-else-if="activeMenu === 'books' && isEnabled('books')"
            :token="token"
          />

          <KnowledgeView
            v-else-if="activeMenu === 'knowledge' && isEnabled('knowledge')"
            :token="token"
          />

          <ReportsView
            v-else-if="activeMenu === 'reports' && isEnabled('reports')"
            :token="token"
          />

          <RAGChatView
            v-else-if="activeMenu === 'rag' && isEnabled('rag')"
            :token="token"
          />

          <!-- Blog Sub-states -->
          <BlogDetail
            v-else-if="activeMenu === 'blog' && selectedBlogId && !editingBlogId && !isCreatingBlog"
            :token="token"
            :blog-id="selectedBlogId"
            @back="handleBlogBack"
            @edit="handleEditBlog"
          />

          <BlogEditor
            v-else-if="activeMenu === 'blog' && (isCreatingBlog || editingBlogId)"
            :token="token"
            :blog-id="editingBlogId"
            @back="handleBlogBack"
            @saved="handleBlogSaved"
          />
        </div>
      </main>
    </div>

    <!-- Plugin Settings Dialog -->
    <el-dialog
      v-model="showPluginSettings"
      :title="t('plugin.settingsTitle')"
      width="900px"
      :close-on-click-modal="false"
    >
      <PluginSettings @close="showPluginSettings = false" />
    </el-dialog>
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

/* Remove black border and background from active state */
:deep(.el-menu-item.is-active) {
  background-color: transparent !important;
  border-left: none !important;
  box-shadow: none !important;
}

:deep(.el-menu-item.is-active .el-icon),
:deep(.el-menu-item.is-active span) {
  color: #374151;
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
