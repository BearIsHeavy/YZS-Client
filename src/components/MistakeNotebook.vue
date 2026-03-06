<!-- src/components/MistakeNotebook.vue -->
<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue';
import type { 
  WrongQuestionResponse, 
  PaginatedWrongQuestionResponse, 
  WrongQuestionCreate,
  QuestionStatusEnum,
  QuestionTypeEnum,
  ErrorReasonEnum
} from '../types';
import { API_BASE_URL, handleApiError } from '../utils/api';
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
  subject_id: null as number | null,
  status: null as QuestionStatusEnum | null,
  needs_review: false
});

// Mock Data for Dropdowns (Normally fetched from API)
const subjects = [
  { id: 1, name: 'Math' },
  { id: 2, name: 'English' },
  { id: 3, name: 'Physics' }
];

const statuses: { label: string; value: QuestionStatusEnum }[] = [
  { label: 'New', value: 'new' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Mastered', value: 'mastered' },
  { label: 'Removed', value: 'removed' }
];

// ==========================================
// STATE: ADD MODAL
// ==========================================
const showAddModal = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);

const defaultFormState = (): WrongQuestionCreate => ({
  subject_id: undefined as unknown as number, // Required
  question_text: '', // Required
  question_type: 'choice',
  options_json: ['', '', '', ''], // Default 4 options for choice
  correct_answer: '',
  user_answer: '',
  difficulty_level: 1,
  error_reason_type: null,
  error_reason_detail: '',
  source_info: '',
  knowledge_point_ids: []
});

const addForm = ref<WrongQuestionCreate>(defaultFormState());

// ==========================================
// METHODS: API CALLS
// ==========================================

async function fetchQuestions(): Promise<void> {
  isLoading.value = true;
  
  try {
    // Build query params
    const params = new URLSearchParams();
    params.append('page', filters.page.toString());
    params.append('size', filters.size.toString());
    if (filters.subject_id !== null) params.append('subject_id', filters.subject_id.toString());
    if (filters.status !== null) params.append('status', filters.status);
    if (filters.needs_review) params.append('needs_review', 'true');

    const response = await fetch(`${API_BASE_URL}/wrong-questions?${params.toString()}`, {
      headers: { 'Authorization': `Bearer ${props.token}` }
    });
    
    if (!response.ok) await handleApiError(response);
    
    const result = (await response.json()) as PaginatedWrongQuestionResponse;
    questions.value = result.data;
    totalQuestions.value = result.total;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    isLoading.value = false;
  }
}

async function submitNewQuestion(): Promise<void> {
  if (!addForm.value.subject_id || !addForm.value.question_text) {
    ElMessage.warning('Subject and Question Text are required.');
    return;
  }

  isSubmitting.value = true;
  try {
    // Format payload
    const payload = { ...addForm.value };
    if (payload.question_type !== 'choice') {
      payload.options_json = null;
    }

    const response = await fetch(`${API_BASE_URL}/wrong-questions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) await handleApiError(response);

    ElMessage.success('Question added successfully!');
    showAddModal.value = false;
    addForm.value = defaultFormState();
    filters.page = 1; // Reset to first page
    fetchQuestions();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    isSubmitting.value = false;
  }
}

async function updateQuestionStatus(questionId: number, newStatus: QuestionStatusEnum): Promise<void> {
  try {
    const response = await fetch(`${API_BASE_URL}/wrong-questions/${questionId}/status?new_status=${newStatus}`, {
      method: 'PATCH',
      headers: { 'Authorization': `Bearer ${props.token}` }
    });

    if (!response.ok) await handleApiError(response);
    
    ElMessage.success('Status updated.');
    fetchQuestions(); // Refresh list
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  }
}

// ==========================================
// METHODS: UTILS & HANDLERS
// ==========================================

function resetFilters(): void {
  filters.subject_id = null;
  filters.status = null;
  filters.needs_review = false;
  filters.page = 1;
  fetchQuestions();
}

function getSubjectName(id: number): string {
  return subjects.find(s => s.id === id)?.name || `Subject ${id}`;
}

function getStatusType(status: QuestionStatusEnum): '' | 'success' | 'warning' | 'info' | 'danger' {
  switch (status) {
    case 'new': return ''; // primary/blue
    case 'mastered': return 'success'; // green
    case 'reviewing': return 'warning'; // yellow
    case 'removed': return 'info'; // gray
    default: return 'info';
  }
}

// Lifecycle
onMounted(() => {
  fetchQuestions();
});
</script>

<template>
  <div class="max-w-6xl mx-auto flex flex-col h-full">
    <!-- Header Area -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Mistake Notebook</h2>
        <p class="text-gray-500 text-sm mt-1">Manage and review your incorrect answers efficiently.</p>
      </div>
      <el-button type="primary" size="large" @click="showAddModal = true" class="shadow-sm">
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        </template>
        Add Wrong Question
      </el-button>
    </div>

    <!-- Filter Bar -->
    <div class="bg-white p-4 rounded-lg shadow-sm border border-gray-100 flex flex-wrap items-center gap-4 mb-6">
      <el-select v-model="filters.subject_id" placeholder="All Subjects" class="w-32" clearable @change="fetchQuestions">
        <el-option v-for="sub in subjects" :key="sub.id" :label="sub.name" :value="sub.id" />
      </el-select>

      <el-select v-model="filters.status" placeholder="All Statuses" class="w-32" clearable @change="fetchQuestions">
        <el-option v-for="stat in statuses" :key="stat.value" :label="stat.label" :value="stat.value" />
      </el-select>

      <el-checkbox v-model="filters.needs_review" @change="fetchQuestions" class="ml-2">
        Today's Review
      </el-checkbox>

      <div class="flex-grow"></div>

      <el-button text @click="resetFilters">Reset</el-button>
    </div>

    <!-- Main List -->
    <div v-loading="isLoading" class="flex-grow">
      <el-empty v-if="questions.length === 0 && !isLoading" description="No questions found matching your criteria." />
      
      <div v-else class="space-y-4">
        <el-card v-for="q in questions" :key="q.id" class="shadow-sm hover:shadow-md transition-shadow duration-200 border-none ring-1 ring-gray-100" body-class="p-5">
          <div class="flex justify-between items-start">
            
            <!-- Left Content -->
            <div class="flex-grow pr-6">
              <div class="flex items-center gap-2 mb-2">
                <el-tag size="small" effect="light">{{ getSubjectName(q.subject_id) }}</el-tag>
                <el-tag v-if="q.question_type" size="small" type="info" effect="plain">{{ q.question_type }}</el-tag>
                <span class="text-xs text-gray-400">Added: {{ new Date(q.created_at).toLocaleDateString() }}</span>
              </div>
              
              <h3 class="text-base font-medium text-gray-800 leading-relaxed mb-3">
                {{ q.question_text }}
              </h3>

              <!-- Tags / Meta -->
              <div class="flex items-center gap-3 text-sm text-gray-500">
                <span v-if="q.source_info" class="flex items-center gap-1">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path></svg>
                  {{ q.source_info }}
                </span>
                <span v-if="q.difficulty_level" class="flex items-center gap-1">
                  <el-rate v-model="q.difficulty_level" disabled show-score text-color="#faad14" class="h-4" />
                </span>
                <span v-if="q.error_reason_type" class="bg-red-50 text-red-600 px-2 py-0.5 rounded text-xs font-medium">
                  {{ q.error_reason_type.replace('_', ' ') }}
                </span>
              </div>
            </div>

            <!-- Right Actions & Status -->
            <div class="flex flex-col items-end gap-4 min-w-[120px]">
              <el-tag :type="getStatusType(q.status)" effect="dark" round class="font-medium">
                {{ q.status.toUpperCase() }}
              </el-tag>

              <div class="flex gap-2">
                <el-dropdown trigger="click" @command="(cmd) => updateQuestionStatus(q.id, cmd as QuestionStatusEnum)">
                  <el-button size="small" text bg>Status</el-button>
                  <template #dropdown>
                    <el-dropdown-menu>
                      <el-dropdown-item v-for="stat in statuses" :key="stat.value" :command="stat.value" :disabled="q.status === stat.value">
                        Mark as {{ stat.label }}
                      </el-dropdown-item>
                    </el-dropdown-menu>
                  </template>
                </el-dropdown>

                <!-- Future Review Logic -->
                <el-button type="primary" size="small" plain @click="ElMessage.info('Review module coming soon!')">Review</el-button>
              </div>
            </div>

          </div>
        </el-card>
      </div>
    </div>

    <!-- Pagination -->
    <div class="mt-6 flex justify-center pb-8">
      <el-pagination
        v-model:current-page="filters.page"
        v-model:page-size="filters.size"
        :page-sizes="[10, 20, 50]"
        :total="totalQuestions"
        layout="total, sizes, prev, pager, next"
        @size-change="fetchQuestions"
        @current-change="fetchQuestions"
        background
      />
    </div>

    <!-- ========================================== -->
    <!-- MODAL: ADD WRONG QUESTION (Strict Form) -->
    <!-- ========================================== -->
    <el-dialog v-model="showAddModal" title="Record New Mistake" width="650px" class="rounded-xl overflow-hidden" :close-on-click-modal="false">
      <el-form :model="addForm" label-position="top" class="mt-2">
        
        <!-- Section 1: Core Info -->
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Subject" required>
            <el-select v-model="addForm.subject_id" placeholder="Select Subject" class="w-full">
              <el-option v-for="sub in subjects" :key="sub.id" :label="sub.name" :value="sub.id" />
            </el-select>
          </el-form-item>
          <el-form-item label="Question Type">
            <el-select v-model="addForm.question_type" class="w-full">
              <el-option label="Multiple Choice" value="choice" />
              <el-option label="Fill in Blank" value="fill" />
              <el-option label="Solution / Essay" value="solution" />
              <el-option label="Other" value="other" />
            </el-select>
          </el-form-item>
        </div>

        <el-form-item label="Question Text" required>
          <el-input 
            v-model="addForm.question_text" 
            type="textarea" 
            :rows="3" 
            placeholder="Enter the question text (you can paste OCR results here)..." 
          />
        </el-form-item>

        <!-- Dynamic Options (If Choice) -->
        <div v-if="addForm.question_type === 'choice' && Array.isArray(addForm.options_json)" class="bg-gray-50 p-4 rounded-md mb-4 border border-gray-100">
          <label class="block text-sm font-medium text-gray-700 mb-2">Options</label>
          <div v-for="(_, index) in addForm.options_json" :key="index" class="flex items-center gap-2 mb-2">
            <span class="text-gray-500 font-medium w-6">{{ String.fromCharCode(65 + index) }}.</span>
            <el-input v-model="(addForm.options_json as string[])[index]" placeholder="Option text" />
          </div>
        </div>

        <!-- Section 2: Answers & Meta -->
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Correct Answer">
            <el-input v-model="addForm.correct_answer" placeholder="e.g., A, or 'x = 4'" />
          </el-form-item>
          <el-form-item label="Your Answer">
            <el-input v-model="addForm.user_answer" placeholder="What did you put?" />
          </el-form-item>
        </div>

        <!-- Section 3: Analysis -->
        <el-divider border-style="dashed" class="my-4" />
        
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Error Reason">
            <el-select v-model="addForm.error_reason_type" placeholder="Select root cause" class="w-full" clearable>
              <el-option label="Careless Mistake" value="careless" />
              <el-option label="Concept Gap" value="concept_gap" />
              <el-option label="Logic Error" value="logic_error" />
              <el-option label="Time Limit" value="time_limit" />
              <el-option label="Other" value="other" />
            </el-select>
          </el-form-item>
          <el-form-item label="Difficulty Level">
            <div class="pt-2">
              <el-rate v-model="addForm.difficulty_level" :max="5" show-score text-color="#faad14" />
            </div>
          </el-form-item>
        </div>

        <el-form-item label="Analysis / Notes">
          <el-input v-model="addForm.error_reason_detail" type="textarea" :rows="2" placeholder="Why did you get this wrong? How to avoid it next time?" />
        </el-form-item>

        <el-form-item label="Source">
          <el-input v-model="addForm.source_info" placeholder="e.g., 2025 Midterm Exam" />
        </el-form-item>

      </el-form>
      <template #footer>
        <span class="dialog-footer flex justify-end gap-3 mt-2">
          <el-button @click="showAddModal = false">Cancel</el-button>
          <el-button type="primary" @click="submitNewQuestion" :loading="isSubmitting" class="w-32">
            Save Record
          </el-button>
        </span>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* Scoped overrides to enforce the UX manual's refined look */
:deep(.el-dialog__header) {
  margin-right: 0;
  padding: 20px 24px 16px;
  border-bottom: 1px solid #f3f4f6;
}
:deep(.el-dialog__body) {
  padding: 24px;
}
:deep(.el-form-item__label) {
  font-weight: 500;
  color: #374151;
  padding-bottom: 4px;
}
</style>