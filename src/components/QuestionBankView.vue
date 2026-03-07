<!-- src/components/QuestionBankView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { QuestionBankResponse, QBQuestionResponse } from '../types';
import { questionBankApi } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from '../i18n';

const { t } = useI18n();

const props = defineProps<{
  token: string;
}>();

const emit = defineEmits<{
  (e: 'navigate-to-upload'): void;
}>();

// State
const questionBanks = ref<QuestionBankResponse[]>([]);
const selectedBank = ref<QuestionBankResponse | null>(null);
const questions = ref<QBQuestionResponse[]>([]);
const isLoading = ref<boolean>(false);
const isLoadingQuestions = ref<boolean>(false);

// Create bank dialog
const showCreateDialog = ref<boolean>(false);
const isCreating = ref<boolean>(false);
const newBankForm = ref({
  name: '',
  is_public: false,
  description: ''
});

// Fetch all question banks
async function fetchQuestionBanks(): Promise<void> {
  isLoading.value = true;
  try {
    const data = await questionBankApi.getAll(props.token);
    questionBanks.value = data;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : t('messages.uploadFailed'));
  } finally {
    isLoading.value = false;
  }
}

// Fetch questions from a specific bank
async function fetchQuestions(bankId: number): Promise<void> {
  isLoadingQuestions.value = true;
  try {
    const data = await questionBankApi.getQuestions(props.token, bankId);
    questions.value = data;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : t('messages.uploadFailed'));
  } finally {
    isLoadingQuestions.value = false;
  }
}

// Select a question bank
async function selectQuestionBank(bank: QuestionBankResponse): Promise<void> {
  selectedBank.value = bank;
  await fetchQuestions(bank.bank_id);
}

// Create new question bank
async function createQuestionBank(): Promise<void> {
  if (!newBankForm.value.name || newBankForm.value.name.trim() === '') {
    ElMessage.warning(t('questionBank.bankName') + ' ' + t('common.required'));
    return;
  }

  isCreating.value = true;
  try {
    const newBank = await questionBankApi.create(props.token, newBankForm.value);
    questionBanks.value.push(newBank);
    selectedBank.value = newBank;
    await fetchQuestions(newBank.bank_id);

    ElMessage.success(t('messages.saveSuccess'));
    showCreateDialog.value = false;
    newBankForm.value = { name: '', is_public: false, description: '' };
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : t('messages.saveFailed'));
  } finally {
    isCreating.value = false;
  }
}

// Delete question bank
async function deleteQuestionBank(bank: QuestionBankResponse): Promise<void> {
  try {
    await ElMessageBox.confirm(
      `Are you sure you want to delete "${bank.name}"? This action cannot be undone.`,
      'Delete Question Bank',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    );

    await questionBankApi.delete(props.token, bank.bank_id);
    questionBanks.value = questionBanks.value.filter(b => b.bank_id !== bank.bank_id);
    if (selectedBank.value?.bank_id === bank.bank_id) {
      selectedBank.value = null;
      questions.value = [];
    }
    ElMessage.success(t('messages.deleteSuccess'));
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : t('messages.deleteFailed'));
    }
  }
}

// Format date
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

// Get question type label
const getQuestionTypeLabel = (type: number) => {
  const typeMap: Record<number, string> = {
    0: 'Essay',
    1: 'Single Choice',
    2: 'Multiple Choice',
    3: 'Fill in Blank'
  };
  return typeMap[type] || 'Unknown';
};

onMounted(() => {
  fetchQuestionBanks();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">{{ t('questionBank.title') }}</h2>
        <p class="text-gray-500 text-sm mt-1">{{ t('questionBank.description', 'Create and manage your question collections') }}</p>
      </div>
      <div class="flex gap-2">
        <el-button @click="fetchQuestionBanks" :loading="isLoading">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
            </svg>
          </template>
          {{ t('common.clear') }}
        </el-button>
        <el-button type="primary" @click="showCreateDialog = true">
          <template #icon>
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
            </svg>
          </template>
          {{ t('questionBank.createNew') }}
        </el-button>
      </div>
    </div>

    <div class="flex flex-1 gap-6 overflow-hidden">
      <!-- Question Banks Sidebar -->
      <div class="w-80 flex-shrink-0 overflow-y-auto">
        <el-card class="shadow-sm border-0 h-full" body-class="p-4 h-full flex flex-col">
          <h3 class="font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            Your Question Banks
          </h3>
          
          <div v-if="isLoading" class="flex-1 flex items-center justify-center">
            <el-spinner />
          </div>
          
          <div v-else-if="questionBanks.length === 0" class="flex-1 flex flex-col items-center justify-center text-gray-400">
            <svg class="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path>
            </svg>
            <p class="text-sm">No question banks yet</p>
            <el-button type="primary" text size="small" @click="showCreateDialog = true" class="mt-2">
              Create your first bank
            </el-button>
          </div>
          
          <div v-else class="space-y-2 overflow-y-auto flex-1">
            <div
              v-for="bank in questionBanks"
              :key="bank.bank_id"
              @click="selectQuestionBank(bank)"
              class="p-3 rounded-lg border cursor-pointer transition-all hover:shadow-md"
              :class="selectedBank?.bank_id === bank.bank_id ? 'border-indigo-500 bg-indigo-50 shadow-sm' : 'border-gray-200 bg-white hover:border-indigo-300'"
            >
              <div class="flex justify-between items-start">
                <div class="flex-1 min-w-0">
                  <div class="font-medium text-gray-900 truncate">{{ bank.name }}</div>
                  <div v-if="bank.description" class="text-xs text-gray-500 mt-1 truncate">{{ bank.description }}</div>
                  <div class="flex items-center gap-2 mt-2">
                    <el-tag size="small" :type="bank.is_public ? 'success' : 'info'">
                      {{ bank.is_public ? 'Public' : 'Private' }}
                    </el-tag>
                    <span class="text-xs text-gray-400">{{ formatDate(bank.created_at) }}</span>
                  </div>
                </div>
                <el-button 
                  type="danger" 
                  text 
                  size="small"
                  @click.stop="deleteQuestionBank(bank)"
                  class="opacity-0 group-hover:opacity-100"
                >
                  <template #icon>
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                    </svg>
                  </template>
                </el-button>
              </div>
            </div>
          </div>
        </el-card>
      </div>

      <!-- Questions List -->
      <div class="flex-1 overflow-y-auto">
        <el-card class="shadow-sm border-0 h-full" body-class="p-6">
          <div v-if="!selectedBank" class="h-full flex flex-col items-center justify-center text-gray-400">
            <svg class="w-20 h-20 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <p class="text-lg font-medium">Select a question bank</p>
            <p class="text-sm mt-2">Choose a bank from the sidebar to view its questions</p>
          </div>
          
          <div v-else>
            <div class="flex justify-between items-center mb-6">
              <div>
                <h3 class="text-xl font-bold text-gray-900">{{ selectedBank.name }}</h3>
                <p v-if="selectedBank.description" class="text-gray-500 text-sm mt-1">{{ selectedBank.description }}</p>
              </div>
              <el-button type="primary" @click="emit('navigate-to-upload')">
                <template #icon>
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
                  </svg>
                </template>
                Upload Questions
              </el-button>
            </div>

            <div v-if="isLoadingQuestions" class="flex justify-center py-10">
              <el-spinner />
            </div>

            <div v-else-if="questions.length === 0" class="text-center py-10 text-gray-400">
              <svg class="w-16 h-16 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              <p>No questions in this bank yet</p>
              <el-button type="primary" text @click="emit('navigate-to-upload')" class="mt-2">
                Upload your first question
              </el-button>
            </div>

            <div v-else class="space-y-4">
              <div v-for="q in questions" :key="q.No" class="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div class="flex justify-between items-start mb-3">
                  <div class="flex items-center gap-2">
                    <el-tag size="small" type="info">{{ getQuestionTypeLabel(q.qus_type) }}</el-tag>
                    <el-tag size="small" effect="plain">{{ q.category }}</el-tag>
                  </div>
                  <div class="text-xs text-gray-400">{{ formatDate(q.created_at) }}</div>
                </div>
                
                <h4 class="font-medium text-gray-900 mb-2">{{ q.stem }}</h4>
                
                <div v-if="q.correct_ans_summary" class="text-sm text-gray-600 bg-gray-50 rounded p-2 mt-2">
                  <strong>Answer:</strong> {{ q.correct_ans_summary }}
                </div>
                
                <div class="flex items-center gap-4 mt-3 text-xs text-gray-500">
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ q.correct_num }} correct
                  </span>
                  <span class="flex items-center gap-1">
                    <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                    {{ q.uncorrect_num }} incorrect
                  </span>
                </div>
              </div>
            </div>
          </div>
        </el-card>
      </div>
    </div>

    <!-- Create Question Bank Dialog -->
    <el-dialog 
      v-model="showCreateDialog" 
      title="Create New Question Bank" 
      width="500px"
      :close-on-click-modal="false"
    >
      <el-form :model="newBankForm" label-position="top">
        <el-form-item label="Bank Name" required>
          <el-input 
            v-model="newBankForm.name" 
            placeholder="e.g., Mathematics Grade 10" 
            maxlength="100"
            show-word-limit
          />
        </el-form-item>
        <el-form-item label="Description">
          <el-input 
            v-model="newBankForm.description" 
            type="textarea" 
            :rows="3"
            placeholder="Brief description of this question bank"
          />
        </el-form-item>
        <el-form-item label="Visibility">
          <el-switch 
            v-model="newBankForm.is_public" 
            active-text="Public" 
            inactive-text="Private"
          />
        </el-form-item>
      </el-form>
      <template #footer>
        <el-button @click="showCreateDialog = false">Cancel</el-button>
        <el-button type="primary" :loading="isCreating" @click="createQuestionBank">
          Create Bank
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}
</style>
