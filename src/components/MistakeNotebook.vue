<!-- src/components/MistakeNotebook.vue -->
<script setup lang="ts">
import { ref, reactive } from 'vue';
import type {
  WrongQuestionResponse,
  WrongQuestionCreate,
  QuestionStatusEnum,
  ErrorReasonEnum
} from '../types';
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

// Mock Data - Since the YanZhuShou backend doesn't have a mistake notebook API yet
// This demonstrates the UI functionality with sample data
const mockSubjects = [
  { id: 1, name: 'Mathematics' },
  { id: 2, name: 'English' },
  { id: 3, name: 'Physics' },
  { id: 4, name: 'Chemistry' }
];

const statuses: { label: string; value: QuestionStatusEnum }[] = [
  { label: 'New', value: 'new' },
  { label: 'Reviewing', value: 'reviewing' },
  { label: 'Mastered', value: 'mastered' },
  { label: 'Removed', value: 'removed' }
];

const errorReasons: { label: string; value: ErrorReasonEnum }[] = [
  { label: 'Careless Mistake', value: 'careless' },
  { label: 'Concept Gap', value: 'concept_gap' },
  { label: 'Logic Error', value: 'logic_error' },
  { label: 'Time Limit', value: 'time_limit' },
  { label: 'Other', value: 'other' }
];

// Generate mock data for demonstration
function generateMockData(): WrongQuestionResponse[] {
  const mockQuestions: WrongQuestionResponse[] = [
    {
      id: 1,
      subject_id: 1,
      question_text: 'What is the derivative of x² + 3x?',
      question_type: 'choice',
      options_json: ['2x', '2x + 3', 'x + 3', '2x² + 3'],
      correct_answer: '2x + 3',
      user_answer: '2x',
      source_info: 'Calculus Midterm 2025',
      error_reason_type: 'concept_gap',
      error_reason_detail: 'Forgot to apply the power rule to the linear term',
      status: 'new',
      difficulty_level: 3,
      mistake_count: 1,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      subject_id: 2,
      question_text: 'Choose the correct past participle of "go"',
      question_type: 'choice',
      options_json: ['goed', 'gone', 'went', 'going'],
      correct_answer: 'gone',
      user_answer: 'went',
      source_info: 'English Grammar Test',
      error_reason_type: 'careless',
      error_reason_detail: 'Confused past tense with past participle',
      status: 'reviewing',
      difficulty_level: 2,
      mistake_count: 2,
      created_at: new Date(Date.now() - 86400000).toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 3,
      subject_id: 3,
      question_text: 'What is the acceleration due to gravity on Earth?',
      question_type: 'choice',
      options_json: ['8.9 m/s²', '9.8 m/s²', '10.2 m/s²', '9.5 m/s²'],
      correct_answer: '9.8 m/s²',
      user_answer: '10.2 m/s²',
      source_info: 'Physics Chapter 5',
      error_reason_type: 'concept_gap',
      error_reason_detail: 'Need to memorize standard constants',
      status: 'mastered',
      difficulty_level: 1,
      mistake_count: 3,
      last_reviewed_at: new Date().toISOString(),
      created_at: new Date(Date.now() - 172800000).toISOString(),
      updated_at: new Date().toISOString()
    }
  ];
  return mockQuestions;
}

// ==========================================
// STATE: ADD MODAL
// ==========================================
const showAddModal = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);

const defaultFormState = (): WrongQuestionCreate => ({
  subject_id: undefined as unknown as number,
  question_text: '',
  question_type: 'choice',
  options_json: ['', '', '', ''],
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
// METHODS: API CALLS (Mock Implementation)
// ==========================================

async function fetchQuestions(): Promise<void> {
  isLoading.value = true;
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  try {
    // Filter mock data based on filters
    let filtered = generateMockData();
    
    if (filters.subject_id !== null) {
      filtered = filtered.filter(q => q.subject_id === filters.subject_id);
    }
    if (filters.status !== null) {
      filtered = filtered.filter(q => q.status === filters.status);
    }
    if (filters.needs_review) {
      filtered = filtered.filter(q => q.status === 'new' || q.status === 'reviewing');
    }
    
    // Paginate
    const start = (filters.page - 1) * filters.size;
    const end = start + filters.size;
    
    questions.value = filtered.slice(start, end);
    totalQuestions.value = filtered.length;
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
  
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 800));
  
  try {
    const newQuestion: WrongQuestionResponse = {
      id: Date.now(),
      subject_id: addForm.value.subject_id,
      question_text: addForm.value.question_text,
      question_type: addForm.value.question_type || 'choice',
      options_json: addForm.value.options_json,
      correct_answer: addForm.value.correct_answer,
      user_answer: addForm.value.user_answer,
      source_info: addForm.value.source_info,
      error_reason_type: addForm.value.error_reason_type,
      error_reason_detail: addForm.value.error_reason_detail,
      status: 'new',
      difficulty_level: addForm.value.difficulty_level || 1,
      mistake_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    questions.value.unshift(newQuestion);
    totalQuestions.value++;
    
    ElMessage.success('Question added successfully!');
    showAddModal.value = false;
    addForm.value = defaultFormState();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  } finally {
    isSubmitting.value = false;
  }
}

async function updateQuestionStatus(questionId: number, newStatus: QuestionStatusEnum): Promise<void> {
  // Simulate API call
  await new Promise(resolve => setTimeout(resolve, 300));
  
  try {
    const question = questions.value.find(q => q.id === questionId);
    if (question) {
      question.status = newStatus;
      question.updated_at = new Date().toISOString();
    }
    ElMessage.success('Status updated.');
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : String(error));
  }
}

async function deleteQuestion(questionId: number): Promise<void> {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to remove this question from the notebook?',
      'Delete Question',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    );
    
    questions.value = questions.value.filter(q => q.id !== questionId);
    totalQuestions.value--;
    ElMessage.success('Question removed');
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : String(error));
    }
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
  return mockSubjects.find(s => s.id === id)?.name || `Subject ${id}`;
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

function getErrorReasonLabel(reason: ErrorReasonEnum | null): string {
  if (!reason) return '';
  const found = errorReasons.find(r => r.value === reason);
  return found?.label || reason;
}

// Lifecycle
fetchQuestions();
</script>

<template>
  <div class="max-w-7xl mx-auto flex flex-col h-full">
    <!-- Header Area -->
    <div class="flex justify-between items-start mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Mistake Notebook</h2>
        <p class="text-gray-500 text-sm mt-1">Track and review your incorrect answers to improve learning</p>
      </div>
      <el-button 
        type="primary" 
        size="large" 
        @click="showAddModal = true" 
        class="shadow-sm bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </template>
        Add Wrong Question
      </el-button>
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
            <div class="text-2xl font-bold text-gray-900">{{ totalQuestions }}</div>
            <div class="text-xs text-gray-500">Total Questions</div>
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
            <div class="text-2xl font-bold text-gray-900">{{ questions.filter(q => q.status === 'new').length }}</div>
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
            <div class="text-2xl font-bold text-gray-900">{{ questions.filter(q => q.status === 'reviewing').length }}</div>
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
            <div class="text-2xl font-bold text-gray-900">{{ questions.filter(q => q.status === 'mastered').length }}</div>
            <div class="text-xs text-gray-500">Mastered</div>
          </div>
        </div>
      </el-card>
    </div>

    <!-- Filter Bar -->
    <el-card class="shadow-sm border-0 mb-6" body-class="p-4">
      <div class="flex flex-wrap items-center gap-4">
        <div class="flex items-center gap-2">
          <label class="text-sm font-medium text-gray-700">Subject:</label>
          <el-select 
            v-model="filters.subject_id" 
            placeholder="All Subjects" 
            class="w-40" 
            clearable 
            @change="fetchQuestions"
          >
            <el-option v-for="sub in mockSubjects" :key="sub.id" :label="sub.name" :value="sub.id" />
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
        >
          <el-button type="primary" @click="showAddModal = true">Add Question</el-button>
        </el-empty>

        <div v-else class="divide-y divide-gray-100">
          <div 
            v-for="q in questions" 
            :key="q.id" 
            class="p-5 hover:bg-gray-50 transition-colors"
          >
            <div class="flex justify-between items-start gap-4">
              <!-- Left Content -->
              <div class="flex-grow">
                <div class="flex items-center gap-2 mb-2">
                  <el-tag size="small" effect="light" class="font-medium">{{ getSubjectName(q.subject_id) }}</el-tag>
                  <el-tag 
                    size="small" 
                    :type="q.question_type === 'choice' ? 'info' : 'warning'" 
                    effect="plain"
                  >
                    {{ q.question_type }}
                  </el-tag>
                  <el-tag 
                    v-if="q.error_reason_type" 
                    size="small" 
                    type="danger" 
                    effect="light"
                    class="ml-2"
                  >
                    {{ getErrorReasonLabel(q.error_reason_type) }}
                  </el-tag>
                </div>

                <h3 class="text-base font-medium text-gray-900 leading-relaxed mb-3">
                  {{ q.question_text }}
                </h3>

                <!-- Options for choice questions -->
                <div v-if="q.options_json && Array.isArray(q.options_json)" class="grid grid-cols-2 gap-2 mb-3 max-w-2xl">
                  <div 
                    v-for="(opt, idx) in q.options_json" 
                    :key="idx"
                    class="px-3 py-2 rounded border text-sm"
                    :class="{
                      'bg-green-50 border-green-300 text-green-800 font-medium': opt === q.correct_answer,
                      'bg-red-50 border-red-300 text-red-800': opt === q.user_answer && opt !== q.correct_answer,
                      'bg-gray-50 border-gray-200 text-gray-700': opt !== q.correct_answer && opt !== q.user_answer
                    }"
                  >
                    <span class="font-medium mr-2">{{ String.fromCharCode(65 + idx) }}.</span>
                    {{ opt }}
                    <span v-if="opt === q.correct_answer" class="ml-2 text-xs">✓ Correct</span>
                    <span v-if="opt === q.user_answer && opt !== q.correct_answer" class="ml-2 text-xs">✗ Your Answer</span>
                  </div>
                </div>

                <!-- Answer Summary -->
                <div class="flex items-center gap-4 text-sm mb-2">
                  <span class="text-gray-600">
                    <strong>Correct:</strong> 
                    <span class="text-green-600 font-medium">{{ q.correct_answer }}</span>
                  </span>
                  <span class="text-gray-600">
                    <strong>Your Answer:</strong>
                    <span :class="q.user_answer === q.correct_answer ? 'text-green-600' : 'text-red-600'" class="font-medium">{{ q.user_answer }}</span>
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
                    <el-rate v-model="q.difficulty_level" disabled show-score text-color="#faad14" class="h-4 text-xs" />
                  </span>
                  <span>Added: {{ new Date(q.created_at).toLocaleDateString() }}</span>
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
                  <el-dropdown trigger="click" @command="(cmd: string) => updateQuestionStatus(q.id, cmd as QuestionStatusEnum)">
                    <el-button size="small" text bg>
                      Change Status
                      <el-icon class="el-icon--right"><arrow-down /></el-icon>
                    </el-button>
                    <template #dropdown>
                      <el-dropdown-menu>
                        <el-dropdown-item 
                          v-for="stat in statuses" 
                          :key="stat.value" 
                          :command="stat.value"
                          :disabled="q.status === stat.value"
                        >
                          Mark as {{ stat.label }}
                        </el-dropdown-item>
                      </el-dropdown-menu>
                    </template>
                  </el-dropdown>

                  <el-button 
                    type="danger" 
                    size="small" 
                    text 
                    @click="deleteQuestion(q.id)"
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

    <!-- ========================================== -->
    <!-- MODAL: ADD WRONG QUESTION -->
    <!-- ========================================== -->
    <el-dialog 
      v-model="showAddModal" 
      title="Record New Mistake" 
      width="700px" 
      class="rounded-xl overflow-hidden" 
      :close-on-click-modal="false"
    >
      <el-form :model="addForm" label-position="top" label-class-name="font-medium text-gray-700">
        <!-- Section 1: Core Info -->
        <div class="grid grid-cols-2 gap-4">
          <el-form-item label="Subject" required>
            <el-select v-model="addForm.subject_id" placeholder="Select Subject" class="w-full">
              <el-option v-for="sub in mockSubjects" :key="sub.id" :label="sub.name" :value="sub.id" />
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
            placeholder="Enter the question text..."
          />
        </el-form-item>

        <!-- Dynamic Options (If Choice) -->
        <div v-if="addForm.question_type === 'choice' && Array.isArray(addForm.options_json)" 
             class="bg-gray-50 p-4 rounded-lg mb-4 border border-gray-200">
          <label class="block text-sm font-medium text-gray-700 mb-3">Options</label>
          <div v-for="(_, index) in addForm.options_json" :key="index" class="flex items-center gap-2 mb-2">
            <span class="text-gray-500 font-medium w-6 h-8 flex items-center justify-center bg-white rounded border">{{ String.fromCharCode(65 + index) }}.</span>
            <el-input v-model="(addForm.options_json as string[])[index]" placeholder="Option text" />
          </div>
        </div>

        <!-- Section 2: Answers -->
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
            <el-select 
              v-model="addForm.error_reason_type" 
              placeholder="Select root cause" 
              class="w-full" 
              clearable
            >
              <el-option v-for="reason in errorReasons" :key="reason.value" :label="reason.label" :value="reason.value" />
            </el-select>
          </el-form-item>
          <el-form-item label="Difficulty Level">
            <div class="pt-2">
              <el-rate v-model="addForm.difficulty_level" :max="5" show-score text-color="#faad14" />
            </div>
          </el-form-item>
        </div>

        <el-form-item label="Analysis / Notes">
          <el-input 
            v-model="addForm.error_reason_detail" 
            type="textarea" 
            :rows="2" 
            placeholder="Why did you get this wrong? How to avoid it next time?" 
          />
        </el-form-item>

        <el-form-item label="Source">
          <el-input v-model="addForm.source_info" placeholder="e.g., 2025 Midterm Exam, Chapter 5" />
        </el-form-item>
      </el-form>

      <template #footer>
        <div class="flex justify-end gap-3">
          <el-button @click="showAddModal = false">Cancel</el-button>
          <el-button 
            type="primary" 
            @click="submitNewQuestion" 
            :loading="isSubmitting" 
            class="w-32 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 border-0"
          >
            Save Record
          </el-button>
        </div>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-dialog) {
  border-radius: 16px;
  overflow: hidden;
}

:deep(.el-dialog__header) {
  padding: 20px 24px;
  border-bottom: 1px solid #f3f4f6;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
}

:deep(.el-dialog__title) {
  color: white;
  font-weight: 600;
}

:deep(.el-dialog__body) {
  padding: 24px;
  max-height: 70vh;
  overflow-y: auto;
}

:deep(.el-pagination) {
  padding: 16px 0;
}

:deep(.el-rate) {
  display: inline-flex;
  align-items: center;
}
</style>
