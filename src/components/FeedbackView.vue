<!-- src/components/FeedbackView.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type {
  FeedbackResponse,
  FeedbackListResponse,
  FeedbackCreate,
  FeedbackCategoryEnum,
  FeedbackStats,
  FeedbackSubmissionStatus
} from '../types';
import { feedbackApi } from '../utils/api';
import { useI18n } from '../i18n';
import {
  FEEDBACK_CATEGORY_LABELS,
  FEEDBACK_STATUS_LABELS,
  FEEDBACK_STATUS_COLORS
} from '../types';

const { t } = useI18n();

const props = defineProps<{
  token: string;
}>();

// State
const feedbackList = ref<FeedbackResponse[]>([]);
const isLoading = ref<boolean>(false);
const isLoadingStats = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const currentPage = ref<number>(1);
const totalPages = ref<number>(1);
const totalItems = ref<number>(0);

// Filters
const selectedCategory = ref<FeedbackCategoryEnum | null>(null);
const selectedStatus = ref<'pending' | 'in_progress' | 'completed' | 'rejected' | null>(null);
const sortBy = ref<'vote_count' | 'created_at'>('vote_count');

// Stats
const stats = ref<FeedbackStats | null>(null);

// Submission
const isSubmitting = ref<boolean>(false);
const showSubmitForm = ref<boolean>(false);
const newFeedbackContent = ref<string>('');
const newFeedbackCategory = ref<FeedbackCategoryEnum>('other');
const submissionStatus = ref<FeedbackSubmissionStatus | null>(null);

// Vote loading states
const votingIds = ref<Set<number>>(new Set());

// Computed
const canSubmitFeedback = computed(() => submissionStatus.value?.can_submit ?? true);

const categoryOptions: { value: FeedbackCategoryEnum | null; label: string }[] = [
  { value: null, label: 'All Categories' },
  { value: 'bug', label: t('feedback.categories.bug') },
  { value: 'feature', label: t('feedback.categories.feature') },
  { value: 'ui', label: t('feedback.categories.ui') },
  { value: 'performance', label: t('feedback.categories.performance') },
  { value: 'documentation', label: t('feedback.categories.documentation') },
  { value: 'other', label: t('feedback.categories.other') }
];

const statusOptions: { value: typeof selectedStatus.value; label: string }[] = [
  { value: null, label: 'All Statuses' },
  { value: 'pending', label: t('feedback.statuses.pending') },
  { value: 'in_progress', label: t('feedback.statuses.inProgress') },
  { value: 'completed', label: t('feedback.statuses.completed') },
  { value: 'rejected', label: t('feedback.statuses.rejected') }
];

// Methods
async function fetchFeedbackList(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;

  try {
    const response: FeedbackListResponse = await feedbackApi.list({
      category: selectedCategory.value,
      status_filter: selectedStatus.value,
      sort_by: sortBy.value,
      page: currentPage.value,
      page_size: 20
    });

    feedbackList.value = response.items;
    totalPages.value = response.total_pages;
    totalItems.value = response.total;
  } catch (error: unknown) {
    console.error('Failed to fetch feedback:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to load feedback';
  } finally {
    isLoading.value = false;
  }
}

async function fetchStats(): Promise<void> {
  isLoadingStats.value = true;
  try {
    stats.value = await feedbackApi.getStats();
  } catch (error: unknown) {
    console.error('Failed to fetch stats:', error);
  } finally {
    isLoadingStats.value = false;
  }
}

async function fetchSubmissionStatus(): Promise<void> {
  try {
    submissionStatus.value = await feedbackApi.getSubmissionStatus(props.token);
  } catch (error: unknown) {
    console.error('Failed to fetch submission status:', error);
  }
}

async function submitFeedback(): Promise<void> {
  if (!newFeedbackContent.value.trim()) {
    errorMessage.value = 'Please enter feedback content';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const feedbackData: FeedbackCreate = {
      content: newFeedbackContent.value.trim(),
      category: newFeedbackCategory.value
    };

    await feedbackApi.create(props.token, feedbackData);

    // Reset form
    newFeedbackContent.value = '';
    newFeedbackCategory.value = 'other';
    showSubmitForm.value = false;

    // Refresh list and status
    await Promise.all([
      fetchFeedbackList(),
      fetchSubmissionStatus()
    ]);

    // Show success message via event or toast (can be enhanced)
  } catch (error: unknown) {
    console.error('Failed to submit feedback:', error);
    errorMessage.value = error instanceof Error ? error.message : 'Failed to submit feedback';
  } finally {
    isSubmitting.value = false;
  }
}

async function handleVote(feedbackId: number): Promise<void> {
  if (votingIds.value.has(feedbackId)) return;

  votingIds.value.add(feedbackId);

  try {
    const result = await feedbackApi.vote(props.token, feedbackId);
    // Update local state
    const feedback = feedbackList.value.find(f => f.id === feedbackId);
    if (feedback) {
      feedback.has_voted = result.has_voted;
      feedback.vote_count = result.vote_count;
    }
  } catch (error: unknown) {
    console.error('Failed to vote:', error);
  } finally {
    votingIds.value.delete(feedbackId);
  }
}

function handlePageChange(page: number): void {
  currentPage.value = page;
  fetchFeedbackList();
}

function handleFilterChange(): void {
  currentPage.value = 1;
  fetchFeedbackList();
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Lifecycle
onMounted(() => {
  Promise.all([
    fetchFeedbackList(),
    fetchStats(),
    fetchSubmissionStatus()
  ]);
});
</script>

<template>
  <div class="max-w-6xl mx-auto">
    <!-- Header -->
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-900 mb-2">{{ t('feedback.title') }}</h2>
      <p class="text-gray-600">{{ t('feedback.description') }}</p>
    </div>

    <!-- Stats Cards -->
    <div v-if="stats" class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-indigo-600">{{ stats.total_count }}</div>
        <div class="text-sm text-gray-600">Total Feedback</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-yellow-600">{{ stats.by_status.pending ?? 0 }}</div>
        <div class="text-sm text-gray-600">{{ t('feedback.statuses.pending') }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-blue-600">{{ stats.by_status.in_progress ?? 0 }}</div>
        <div class="text-sm text-gray-600">{{ t('feedback.statuses.inProgress') }}</div>
      </div>
      <div class="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
        <div class="text-2xl font-bold text-green-600">{{ stats.by_status.completed ?? 0 }}</div>
        <div class="text-sm text-gray-600">{{ t('feedback.statuses.completed') }}</div>
      </div>
    </div>

    <!-- Error Message -->
    <el-alert
      v-if="errorMessage"
      :title="errorMessage"
      type="error"
      show-icon
      class="mb-6"
      @close="errorMessage = null"
    />

    <!-- Submit Feedback Section -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
      <div class="flex items-center justify-between mb-4">
        <h3 class="text-lg font-semibold text-gray-900">
          {{ showSubmitForm ? 'New Feedback' : t('feedback.submit') }}
        </h3>
        <el-button
          v-if="!showSubmitForm"
          type="primary"
          @click="showSubmitForm = true"
          :disabled="!canSubmitFeedback"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </template>
          {{ t('feedback.submit') }}
        </el-button>
      </div>

      <div v-if="showSubmitForm" class="space-y-4">
        <el-form label-position="top">
          <el-form-item :label="t('feedback.category')" required>
            <el-select v-model="newFeedbackCategory" class="w-full">
              <el-option
                v-for="cat in categoryOptions.filter(o => o.value !== null)"
                :key="cat.value"
                :label="cat.label"
                :value="cat.value"
              />
            </el-select>
          </el-form-item>

          <el-form-item :label="t('feedback.content')" required>
            <el-input
              v-model="newFeedbackContent"
              type="textarea"
              :rows="4"
              :placeholder="t('feedback.contentPlaceholder')"
              :maxlength="2000"
              show-word-limit
              :disabled="isSubmitting"
            />
          </el-form-item>

          <div class="flex gap-3">
            <el-button
              type="primary"
              @click="submitFeedback"
              :loading="isSubmitting"
            >
              {{ t('feedback.submit') }}
            </el-button>
            <el-button
              @click="() => { showSubmitForm = false; newFeedbackContent = ''; }"
              :disabled="isSubmitting"
            >
              {{ t('common.cancel') }}
            </el-button>
          </div>

          <p v-if="!canSubmitFeedback && submissionStatus?.next_submission_at" class="text-sm text-gray-500">
            {{ t('feedback.rateLimit') }}
          </p>
        </el-form>
      </div>

      <div v-else class="text-gray-600">
        <p>{{ t('feedback.description') }}</p>
        <p v-if="!canSubmitFeedback && submissionStatus?.message" class="text-sm text-gray-500 mt-2">
          {{ submissionStatus.message }}
        </p>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm border border-gray-100 p-4 mb-6">
      <div class="flex flex-wrap gap-4">
        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('feedback.category') }}</label>
          <el-select v-model="selectedCategory" @change="handleFilterChange" class="w-full">
            <el-option
              v-for="opt in categoryOptions"
              :key="opt.label"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">{{ t('feedback.status') }}</label>
          <el-select v-model="selectedStatus" @change="handleFilterChange" class="w-full">
            <el-option
              v-for="opt in statusOptions"
              :key="opt.label"
              :label="opt.label"
              :value="opt.value"
            />
          </el-select>
        </div>

        <div class="flex-1 min-w-[200px]">
          <label class="block text-sm font-medium text-gray-700 mb-1">Sort By</label>
          <el-select v-model="sortBy" @change="handleFilterChange" class="w-full">
            <el-option label="Most Voted" value="vote_count" />
            <el-option label="Newest First" value="created_at" />
          </el-select>
        </div>
      </div>
    </div>

    <!-- Feedback List -->
    <div class="space-y-4">
      <div
        v-for="feedback in feedbackList"
        :key="feedback.id"
        class="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
      >
        <div class="flex items-start gap-4">
          <!-- Vote Button -->
          <div class="flex flex-col items-center gap-1">
            <button
              @click="handleVote(feedback.id)"
              :disabled="votingIds.has(feedback.id)"
              class="flex flex-col items-center justify-center w-12 h-12 rounded-lg border transition-colors"
              :class="feedback.has_voted
                ? 'border-indigo-500 bg-indigo-50 text-indigo-600'
                : 'border-gray-200 hover:border-indigo-300 text-gray-600 hover:text-indigo-600'"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2L6 8h8l-4-6z" />
                <path d="M10 18l4-6H6l4 6z" opacity="0.3" />
              </svg>
              <span class="text-xs font-medium">{{ feedback.vote_count }}</span>
            </button>
          </div>

          <!-- Content -->
          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2 mb-2 flex-wrap">
              <span
                class="px-2 py-1 rounded-full text-xs font-medium"
                :class="FEEDBACK_STATUS_COLORS[feedback.status]"
              >
                {{ FEEDBACK_STATUS_LABELS[feedback.status] }}
              </span>
              <span class="px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                {{ FEEDBACK_CATEGORY_LABELS[feedback.category] }}
              </span>
              <span class="text-xs text-gray-500">
                by {{ feedback.author?.name ?? 'Anonymous' }}
              </span>
              <span class="text-xs text-gray-400">·</span>
              <span class="text-xs text-gray-500">{{ formatDate(feedback.created_at) }}</span>
            </div>

            <p class="text-gray-900 mb-3 whitespace-pre-wrap">{{ feedback.content }}</p>

            <!-- Developer Response -->
            <div v-if="feedback.developer_response" class="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div class="flex items-center gap-2 mb-2">
                <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path>
                </svg>
                <span class="text-sm font-medium text-indigo-600">{{ t('feedback.developerResponse') }}</span>
              </div>
              <p class="text-sm text-gray-700">{{ feedback.developer_response }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div v-if="isLoading" class="text-center py-12">
        <el-skeleton :rows="3" animated />
      </div>

      <!-- Empty State -->
      <div v-else-if="feedbackList.length === 0" class="text-center py-12 bg-white rounded-xl border border-gray-100">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        <p class="text-gray-500 font-medium">{{ t('feedback.noFeedback') }}</p>
        <p class="text-gray-400 text-sm mt-1">{{ t('feedback.beFirst') }}</p>
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
:deep(.el-select) {
  width: 100%;
}

:deep(.el-input__wrapper),
:deep(.el-select__wrapper) {
  border-radius: 8px;
}

:deep(.el-button--primary) {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}
</style>
