<!-- src/components/MistakeNotebook.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type {
  WrongQuestionResponse,
  QuestionStatusEnum,
  MistakeNotebookStats
} from '../types';
import { mistakeNotebookApi } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';

const props = defineProps<{
  token: string;
}>();

// ==========================================
// STATE: LIST & FILTERS
// ==========================================
const questions = ref<WrongQuestionResponse[]>([]);
const totalQuestions = ref<number>(0);
const isLoading = ref<boolean>(false);

const filters = reactive({
  page: 1,
  size: 20,
  category: null as string | null,
  status: null as QuestionStatusEnum | null,
  needs_review: false
});

// Category options - will be populated dynamically from API
const categoryOptions = ref<string[]>([]);
const isLoadingCategories = ref<boolean>(false);

const statuses: { label: string; value: QuestionStatusEnum }[] = [
  { label: 'New', value: 'new' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Mastered', value: 'mastered' },
  { label: 'Removed', value: 'removed' }
];

// ==========================================
// STATE: STATS
// ==========================================
const stats = ref<MistakeNotebookStats>({
  total_wrong: 0,
  new_count: 0,
  reviewing_count: 0,
  mastered_count: 0,
  by_category: {}
});

// ==========================================
// METHODS: API CALLS
// ==========================================

async function fetchCategories(): Promise<void> {
  isLoadingCategories.value = true;
  try {
    const data = await mistakeNotebookApi.getCategories(props.token);
    categoryOptions.value = data;
  } catch (error: unknown) {
    console.error('Failed to fetch categories:', error);
  } finally {
    isLoadingCategories.value = false;
  }
}

async function fetchStats(): Promise<void> {
  try {
    const data = await mistakeNotebookApi.getStats(props.token);
    stats.value = data;
  } catch (error: unknown) {
    console.error('Failed to fetch stats:', error);
  }
}

async function fetchQuestions(): Promise<void> {
  isLoading.value = true;

  try {
    const response = await mistakeNotebookApi.getWrongQuestions(props.token, {
      page: filters.page,
      size: filters.size,
      category: filters.category,
      status: filters.status,
      needs_review: filters.needs_review
    });

    questions.value = response.data;
    totalQuestions.value = response.total;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to fetch questions');
  } finally {
    isLoading.value = false;
  }
}

async function markAsMastered(logId: number): Promise<void> {
  try {
    await mistakeNotebookApi.markAsMastered(props.token, logId);
    
    // Update local state
    const question = questions.value.find(q => q.log_id === logId);
    if (question) {
      question.is_mastered = true;
      question.status = 'mastered';
    }
    
    ElMessage.success('Marked as mastered.');
    fetchStats();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to update status');
  }
}

async function markAsUnmastered(logId: number): Promise<void> {
  try {
    await mistakeNotebookApi.markAsUnmastered(props.token, logId);
    
    // Update local state
    const question = questions.value.find(q => q.log_id === logId);
    if (question) {
      question.is_mastered = false;
      question.status = 'reviewing';
    }
    
    ElMessage.success('Marked as needs review.');
    fetchStats();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to update status');
  }
}

async function removeQuestion(logId: number): Promise<void> {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to remove this question from the notebook?',
      'Remove Question',
      { confirmButtonText: 'Remove', cancelButtonText: 'Cancel', type: 'warning' }
    );

    await mistakeNotebookApi.removeWrongQuestion(props.token, logId);
    
    // Update local state
    questions.value = questions.value.filter(q => q.log_id !== logId);
    totalQuestions.value--;
    ElMessage.success('Question removed');
    fetchStats();
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : 'Failed to remove question');
    }
  }
}

// ==========================================
// METHODS: UTILS & HANDLERS
// ==========================================

function resetFilters(): void {
  filters.category = null;
  filters.status = null;
  filters.needs_review = false;
  filters.page = 1;
  fetchQuestions();
}

function getStatusType(status: QuestionStatusEnum): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'new': return '';
    case 'mastered': return 'success';
    case 'reviewing': return 'warning';
    case 'removed': return 'info';
    default: return 'info';
  }
}

function getQuestionTypeLabel(type: string): string {
  const typeMap: Record<string, string> = {
    'essay': 'Essay',
    'single_choice': 'Single Choice',
    'multiple_choice': 'Multiple Choice',
    'fill_blank': 'Fill in Blank'
  };
  return typeMap[type] || type;
}

// Lifecycle - fetch data on mount
onMounted(() => {
  fetchCategories();
  fetchStats();
  fetchQuestions();
});
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col h-full">
    <!-- Header Area -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Mistake Notebook</h2>
        <p class="text-gray-500 text-sm mt-1">Track and review your incorrect answers to improve learning</p>
      </div>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-4 gap-4 mb-6">
      <el-card class="shadow-sm border-0" body-class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ stats.total_wrong }}</div>
            <div class="text-xs text-gray-500">Total Wrong</div>
          </div>
        </div>
      </el-card>
      <el-card class="shadow-sm border-0" body-class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ stats.new_count }}</div>
            <div class="text-xs text-gray-500">New Mistakes</div>
          </div>
        </div>
      </el-card>
      <el-card class="shadow-sm border-0" body-class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-yellow-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ stats.reviewing_count }}</div>
            <div class="text-xs text-gray-500">In Review</div>
          </div>
        </div>
      </el-card>
      <el-card class="shadow-sm border-0" body-class="p-4">
        <div class="flex items-center gap-3">
          <div class="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
            <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </div>
          <div>
            <div class="text-2xl font-bold text-gray-900">{{ stats.mastered_count }}</div>
            <div class="text-xs text-gray-500">Mastered</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Filter Bar -->
    <el-card class="shadow-sm border-0 mb-6" body-class="p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Category:</label>
          <el-select
            v-model="filters.category"
            placeholder="All Categories"
            class="w-40"
            clearable
            :loading="isLoadingCategories"
            @change="fetchQuestions"
          >
            <el-option v-for="cat in categoryOptions" :key="cat" :label="cat" :value="cat" />
          </el-select>
        </div>

        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Status:</label>
          <el-select 
            v-model="filters.status" 
            placeholder="All Statuses" 
            class="w-36" 
            clearable 
            @change="fetchQuestions"
          >
            <el-option v-for="stat in statuses" :key="stat.value" :label="stat.label" :value="stat.value" />
          </el-select>
        </div>

        <el-checkbox 
          v-model="filters.needs_review" 
          @change="fetchQuestions"
          class="ml-2"
        >
          Needs Review
        </el-checkbox>

        <div class="flex-grow"></div>

        <el-button text @click="resetFilters">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </template>
          Reset
        </el-button>
      </div>
    </el-card>

    <!-- Main List -->
    <el-card class="shadow-sm border-0 flex-grow" body-class="p-0">
      <div v-loading="isLoading" class="min-h-[400px]">
        <el-empty 
          v-if="questions.length === 0 && !isLoading" 
          description="No questions found. Add your first mistake to start tracking!"
          :image-size="120"
        />

        <div v-else class="divide-y divide-gray-100">
          <div
            v-for="q in questions"
            :key="q.log_id"
            class="p-5 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start gap-4">
              <!-- Left Content -->
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-2">
                  <el-tag size="small" effect="light" class="font-medium">{{ q.category }}</el-tag>
                  <el-tag
                    size="small"
                    :type="q.question_type.includes('choice') ? 'info' : 'warning'"
                    effect="plain"
                  >
                    {{ getQuestionTypeLabel(q.question_type) }}
                  </el-tag>
                  <el-tag
                    v-if="q.is_mastered"
                    size="small"
                    type="success"
                    effect="light"
                    class="ml-2"
                  >
                    Mastered
                  </el-tag>
                </div>

                <h3 class="text-base font-medium text-gray-900 leading-relaxed mb-3">
                  {{ q.stem }}
                </h3>

                <!-- Options for choice questions -->
                <div v-if="q.options && Array.isArray(q.options)" class="grid grid-cols-2 gap-2 mb-3 max-w-2xl">
                  <div
                    v-for="(opt, idx) in q.options"
                    :key="idx"
                    class="px-3 py-2 rounded border text-sm"
                    :class="{
                      'bg-green-50 border-green-300 text-green-800 font-medium': opt === q.correct_ans_summary,
                      'bg-red-50 border-red-300 text-red-800': opt === q.user_answer && opt !== q.correct_ans_summary,
                      'bg-gray-50 border-gray-200 text-gray-700': opt !== q.correct_ans_summary && opt !== q.user_answer
                    }"
                  >
                    <span class="font-medium mr-2">{{ String.fromCharCode(65 + idx) }}.</span>
                    {{ opt }}
                    <span v-if="opt === q.correct_ans_summary" class="ml-2 text-xs">✓ Correct</span>
                    <span v-if="opt === q.user_answer && opt !== q.correct_ans_summary" class="ml-2 text-xs">✗ Your Answer</span>
                  </div>
                </div>

                <!-- Answer Summary -->
                <div class="flex items-center gap-4 text-sm mb-2">
                  <span class="text-gray-600">
                    <strong>Correct:</strong>
                    <span class="text-green-600 font-medium">{{ q.correct_ans_summary }}</span>
                  </span>
                  <span class="text-gray-600">
                    <strong>Your Answer:</strong>
                    <span :class="q.user_answer === q.correct_ans_summary ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ q.user_answer }}</span>
                  </span>
                </div>

                <!-- Meta Info -->
                <div class="flex items-center gap-4 text-xs text-gray-500 mt-3">
                  <span v-if="q.source_info" class="flex items-center gap-1">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
                    </svg>
                    {{ q.source_info }}
                  </span>
                  <span class="flex items-center gap-1">
                    <span>Mistakes: {{ q.mistake_count }}</span>
                  </span>
                  <span>Attempted: {{ new Date(q.attempt_time).toLocaleDateString() }}</span>
                </div>

                <!-- Error Analysis -->
                <div v-if="q.error_reason_detail" class="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
                  <div class="text-xs font-medium text-amber-800 mb-1">Analysis:</div>
                  <div class="text-sm text-amber-900">{{ q.error_reason_detail }}</div>
                </div>
              </div>

              <!-- Right Actions -->
              <div class="flex flex-col items-end gap-3 min-w-[140px]">
                <el-tag :type="getStatusType(q.status)" effect="dark" round size="small" class="font-medium">
                  {{ q.status.toUpperCase() }}
                </el-tag>

                <div class="flex flex-col gap-2">
                  <el-button
                    v-if="!q.is_mastered"
                    type="success"
                    size="small"
                    text
                    @click="markAsMastered(q.log_id)"
                  >
                    Mark Mastered
                  </el-button>
                  <el-button
                    v-else
                    type="warning"
                    size="small"
                    text
                    @click="markAsUnmastered(q.log_id)"
                  >
                    Mark Review
                  </el-button>

                  <el-button
                    type="danger"
                    size="small"
                    text
                    @click="removeQuestion(q.log_id)"
                  >
                    Remove
                  </el-button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Pagination -->
    <div class="mt-4 flex justify-center">
      <el-pagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.size"
        :page-sizes="[10, 20, 50, 100]"
        :total="totalQuestions"
        layout="total, sizes, prev, pager, next, jumper"
        @size-change="fetchQuestions"
        @current-change="fetchQuestions"
        background
        class="pagination-custom"
      />
    </div>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-pagination) {
  padding: 16px 0;
}

:deep(.el-rate) {
  display: inline-flex;
  align-items: center;
}
</style>
