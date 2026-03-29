<!-- src/components/BlogView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type {
  BlogListItem,
  BlogStats,
  UserResponse
} from '../types';
import { blogApi, userApi, blogTagApi } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from '../i18n';
import TagSelector from './TagSelector.vue';

const { t } = useI18n();

const props = defineProps<{
  token: string;
}>();

const emit = defineEmits<{
  (e: 'view-blog', blogId: number): void;
  (e: 'create-blog'): void;
  (e: 'edit-blog', blogId: number): void;
}>();

// State
const blogList = ref<BlogListItem[]>([]);
const isLoading = ref<boolean>(false);
const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const totalItems = ref<number>(0);

// Stats
const stats = ref<BlogStats | null>(null);
const isLoadingStats = ref<boolean>(false);

// Current user
const currentUser = ref<UserResponse | null>(null);

// Filters
const searchQuery = ref<string>('');
const sortBy = ref<'created_at' | 'updated_at' | 'view_count' | 'like_count'>('created_at');
const showMyBlogsOnly = ref<boolean>(false);
const selectedTags = ref<string[]>([]);
const availableTags = ref<{ tag_id: number; name: string }[]>([]);
const isLoadingTags = ref<boolean>(false);

// Like loading states
const likingIds = ref<Set<number>>(new Set());

// Delete loading states
const deletingIds = ref<Set<number>>(new Set());

// Methods
async function fetchCurrentUser(): Promise<void> {
  try {
    currentUser.value = await userApi.getCurrentUser(props.token);
  } catch (error: unknown) {
    console.error('Failed to fetch current user:', error);
  }
}

async function fetchStats(): Promise<void> {
  isLoadingStats.value = true;
  try {
    stats.value = await blogApi.getStats(props.token);
  } catch (error: unknown) {
    console.error('Failed to fetch stats:', error);
  } finally {
    isLoadingStats.value = false;
  }
}

async function fetchBlogList(): Promise<void> {
  isLoading.value = true;
  try {
    const response = showMyBlogsOnly.value
      ? await blogApi.getMyBlogs(props.token, currentPage.value, 20)
      : await blogApi.list(props.token, {
          search: searchQuery.value || null,
          sort_by: sortBy.value,
          tags: selectedTags.value.length > 0 ? selectedTags.value.join(',') : null,
          page: currentPage.value,
          page_size: 20
        });

    blogList.value = response.items;
    totalPages.value = response.total_pages;
    totalItems.value = response.total;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to load blog posts');
  } finally {
    isLoading.value = false;
  }
}

async function handleLike(blogId: number): Promise<void> {
  if (likingIds.value.has(blogId)) return;

  if (!currentUser.value) {
    ElMessage.warning('Please login to like posts');
    return;
  }

  likingIds.value.add(blogId);
  try {
    const result = await blogApi.toggleLike(props.token, blogId);
    // Update local state
    const blog = blogList.value.find(b => b.blog_id === blogId);
    if (blog) {
      blog.has_liked = result.has_liked;
      blog.like_count = result.like_count;
    }
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to like post');
  } finally {
    likingIds.value.delete(blogId);
  }
}

async function handleDelete(blogId: number): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('blog.deleteConfirm'),
      t('blog.delete'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    );

    deletingIds.value.add(blogId);
    await blogApi.delete(props.token, blogId);

    ElMessage.success(t('blog.deleteSuccess'));
    await Promise.all([fetchBlogList(), fetchStats()]);
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : t('blog.deleteFailed'));
    }
  } finally {
    deletingIds.value.delete(blogId);
  }
}

function handleViewBlog(blogId: number): void {
  emit('view-blog', blogId);
}

function handleEditBlog(blogId: number): void {
  emit('edit-blog', blogId);
}

function handleCreateBlog(): void {
  emit('create-blog');
}

function handleFilterChange(): void {
  currentPage.value = 1;
  fetchBlogList();
}

async function fetchTags(): Promise<void> {
  isLoadingTags.value = true;
  try {
    const response = await blogTagApi.list(props.token);
    availableTags.value = response.items;
  } catch (error: unknown) {
    console.error('Failed to fetch tags:', error);
  } finally {
    isLoadingTags.value = false;
  }
}

function updateTags(tags: string[]): void {
  selectedTags.value = tags;
  fetchBlogList();
}

function selectTagFilter(tagName: string): void {
  if (!selectedTags.value.includes(tagName)) {
    selectedTags.value.push(tagName);
    fetchBlogList();
  }
}

function clearFilters(): void {
  selectedTags.value = [];
  searchQuery.value = '';
  showMyBlogsOnly.value = false;
  fetchBlogList();
}

function handlePageChange(page: number): void {
  currentPage.value = page;
  fetchBlogList();
}

function toggleMyBlogsFilter(): void {
  showMyBlogsOnly.value = !showMyBlogsOnly.value;
  currentPage.value = 1;
  fetchBlogList();
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
}

function canManageBlog(blog: BlogListItem): boolean {
  return currentUser.value?.user_id === blog.user_id;
}

// Lifecycle
onMounted(() => {
  Promise.all([
    fetchCurrentUser(),
    fetchStats(),
    fetchBlogList(),
    fetchTags()
  ]);
});
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ t('blog.title') }}</h2>
      <p class="text-gray-600">{{ t('blog.description') }}</p>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-indigo-600">{{ stats.total_posts }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.totalPosts') }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-blue-600">{{ stats.total_views }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.totalViews') }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-pink-600">{{ stats.total_likes }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.totalLikes') }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-green-600">{{ stats.total_comments }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.totalComments') }}</div>
      </div>
      <div v-if="stats.my_posts !== undefined" class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-purple-600">{{ stats.my_posts }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.myPosts') }}</div>
      </div>
      <div v-if="stats.my_drafts !== undefined" class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-orange-600">{{ stats.my_drafts }}</div>
        <div class="text-sm text-gray-600">{{ t('blog.stats.myDrafts') }}</div>
      </div>
    </div>

    <!-- Action Bar -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <!-- Row 1: Search and Tags -->
      <div class="flex flex-wrap gap-4 items-center mb-4">
        <!-- Search Input -->
        <div class="flex-1 min-w-[200px]">
          <el-input
            v-model="searchQuery"
            :placeholder="t('blog.search')"
            clearable
            @keyup.enter="handleFilterChange"
          >
            <template #prefix>
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
              </svg>
            </template>
          </el-input>
        </div>

        <!-- Sort By -->
        <el-select
          v-model="sortBy"
          :placeholder="t('blog.sortBy')"
          class="w-40"
          @change="handleFilterChange"
        >
          <el-option :label="t('blog.sortByCreatedAt')" value="created_at" />
          <el-option :label="t('blog.sortByUpdatedAt')" value="updated_at" />
          <el-option :label="t('blog.sortByViewCount')" value="view_count" />
          <el-option :label="t('blog.sortByLikeCount')" value="like_count" />
        </el-select>
      </div>

      <!-- Row 2: Tag Selector (full width) -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          Filter by Tags (click or type)
        </label>
        <TagSelector
          :token="token"
          v-model="selectedTags"
          :max-tags="5"
          @update:model-value="updateTags"
        />
      </div>

      <!-- Row 3: Filter Buttons and Create -->
      <div class="flex items-center justify-between">
        <div class="flex gap-2">
          <!-- My Posts Filter -->
          <el-button
            :type="showMyBlogsOnly ? 'primary' : 'default'"
            @click="toggleMyBlogsFilter"
          >
            {{ showMyBlogsOnly ? t('blog.allBlogs') : t('blog.myBlogs') }}
          </el-button>

          <!-- Clear Filters -->
          <el-button
            v-if="selectedTags.length > 0 || searchQuery"
            text
            @click="clearFilters"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
              </svg>
            </template>
            Clear Filters
          </el-button>
        </div>

        <!-- Create Button -->
        <el-button type="primary" @click="handleCreateBlog">
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </template>
          {{ t('blog.create') }}
        </el-button>
      </div>
    </div>

    <!-- Blog List -->
    <div class="space-y-4">
      <div
        v-for="blog in blogList"
        :key="blog.blog_id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Like Button -->
          <div class="flex flex-col items-center gap-1">
            <button
              @click="handleLike(blog.blog_id)"
              :disabled="likingIds.has(blog.blog_id)"
              class="flex flex-col items-center justify-center w-14 h-14 rounded-xl border-2 transition-all duration-200 hover:scale-105 active:scale-95"
              :class="blog.has_liked
                ? 'border-pink-500 bg-gradient-to-br from-pink-500 to-rose-500 text-white shadow-md'
                : 'border-gray-200 hover:border-pink-400 text-gray-600 hover:text-pink-600 hover:bg-pink-50'"
            >
              <svg
                class="w-6 h-6 transition-transform duration-200"
                :class="likingIds.has(blog.blog_id) ? 'animate-pulse' : ''"
                :fill="blog.has_liked ? 'currentColor' : 'none'"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
              </svg>
              <span class="text-sm font-bold">{{ blog.like_count }}</span>
            </button>
            <span class="text-xs text-gray-500">{{ t('blog.likes') }}</span>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <el-tag
                v-if="!blog.is_published"
                size="small"
                type="warning"
                effect="plain"
              >
                {{ t('blog.drafts') }}
              </el-tag>
              <el-tag
                size="small"
                :type="blog.content_type === 'markdown' ? 'success' : 'info'"
                effect="plain"
              >
                {{ blog.content_type === 'markdown' ? t('blog.markdown') : t('blog.html') }}
              </el-tag>
              <span class="text-xs text-gray-500">
                {{ t('blog.author') }}: {{ blog.author?.name ?? 'Anonymous' }}
              </span>
              <span class="text-xs text-gray-400">·</span>
              <span class="text-xs text-gray-500">{{ formatDate(blog.created_at) }}</span>
            </div>

            <h3
              class="text-lg font-semibold text-gray-900 mb-2 hover:text-indigo-600 cursor-pointer"
              @click="handleViewBlog(blog.blog_id)"
            >
              {{ blog.title }}
            </h3>

            <!-- Tags -->
            <div class="flex flex-wrap gap-2 mb-3">
              <el-tag
                v-for="tag in blog.tags || []"
                :key="tag.tag_id"
                size="small"
                effect="plain"
                class="cursor-pointer hover:bg-indigo-50"
                @click.stop="selectTagFilter(tag.name)"
              >
                {{ tag.name }}
              </el-tag>
            </div>

            <div class="flex items-center gap-4 text-sm text-gray-500 mb-3">
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
                </svg>
                {{ blog.view_count }} {{ t('blog.views') }}
              </span>
              <span class="flex items-center gap-1">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
                </svg>
                {{ blog.comment_count }} {{ t('blog.comments') }}
              </span>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2">
              <el-button size="small" @click="handleViewBlog(blog.blog_id)">
                {{ t('blog.viewPost') }}
              </el-button>
              <el-button
                v-if="canManageBlog(blog)"
                size="small"
                type="primary"
                @click="handleEditBlog(blog.blog_id)"
              >
                {{ t('blog.editPost') }}
              </el-button>
              <el-button
                v-if="canManageBlog(blog)"
                size="small"
                type="danger"
                :loading="deletingIds.has(blog.blog_id)"
                @click="handleDelete(blog.blog_id)"
              >
                {{ t('blog.delete') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- Empty State -->
      <div v-else-if="blogList.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-100">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <p class="text-gray-500 font-medium">{{ t('blog.noBlogs') }}</p>
        <p class="text-gray-400 text-sm mt-1">{{ t('blog.beFirst') }}</p>
        <el-button type="primary" class="mt-4" @click="handleCreateBlog">
          {{ t('blog.create') }}
        </el-button>
      </div>
    </div>

    <!-- Pagination -->
    <div v-if="totalPages > 1" class="mt-6 flex justify-center">
      <el-pagination
        v-model:current-page="currentPage"
        :page-size="20"
        :total="totalItems"
        layout="prev, pager, next"
        @current-change="handlePageChange"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  border-radius: 8px;
}
</style>
