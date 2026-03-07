<!-- src/components/PracticeView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { PracticeQuestion, AnswerSubmitResponse, QuestionBankResponse } from '../types';
import { mistakeNotebookApi, questionBankApi } from '../utils/api';
import { ElMessage } from 'element-plus';
import AnswerCard from './AnswerCard.vue';

const props = defineProps<{
  token: string;
}>();

// State
const questionBanks = ref<QuestionBankResponse[]>([]);
const isLoadingBanks = ref<boolean>(false);
const selectedBankId = ref<number | null>(null);
const practiceSession = ref<{
  isActive: boolean;
  questions: PracticeQuestion[];
  currentIndex: number;
  answers: Record<number, AnswerSubmitResponse>;
  correctCount: number;
  wrongCount: number;
}>({
  isActive: false,
  questions: [],
  currentIndex: 0,
  answers: {},
  correctCount: 0,
  wrongCount: 0
});

const isStartingSession = ref<boolean>(false);
const questionCount = ref<number>(10);

// Session stats
const totalAnswered = computed(() => {
  return Object.keys(practiceSession.value.answers).length;
});

const accuracy = computed(() => {
  if (totalAnswered.value === 0) return 0;
  return Math.round((practiceSession.value.correctCount / totalAnswered.value) * 100);
});

// Fetch question banks
async function fetchQuestionBanks(): Promise<void> {
  isLoadingBanks.value = true;
  try {
    const data = await questionBankApi.getAll(props.token);
    questionBanks.value = data;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to fetch question banks');
  } finally {
    isLoadingBanks.value = false;
  }
}

// Start practice session
async function startPracticeSession(): Promise<void> {
  if (!selectedBankId.value) {
    ElMessage.warning('Please select a question bank first');
    return;
  }

  isStartingSession.value = true;
  try {
    const response = await mistakeNotebookApi.startPracticeSession(props.token, {
      bank_id: selectedBankId.value,
      question_count: questionCount.value
    });

    if (response.questions.length === 0) {
      ElMessage.warning('No questions available in this question bank');
      return;
    }

    practiceSession.value = {
      isActive: true,
      questions: response.questions,
      currentIndex: 0,
      answers: {},
      correctCount: 0,
      wrongCount: 0
    };

    ElMessage.success(`Started practice session with ${response.questions.length} questions`);
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to start practice session');
  } finally {
    isStartingSession.value = false;
  }
}

// Handle answer submission
function handleAnswerSubmitted(result: AnswerSubmitResponse): void {
  const currentQuestionNo = practiceSession.value.questions[practiceSession.value.currentIndex]?.question_no;
  if (currentQuestionNo) {
    practiceSession.value.answers[currentQuestionNo] = result;
    
    if (result.is_correct) {
      practiceSession.value.correctCount++;
    } else {
      practiceSession.value.wrongCount++;
    }
  }
}

// Navigate questions
function nextQuestion(): void {
  if (practiceSession.value.currentIndex < practiceSession.value.questions.length - 1) {
    practiceSession.value.currentIndex++;
  } else {
    // Session completed
    ElMessage.success(`Practice session completed! Score: ${practiceSession.value.correctCount}/${totalAnswered.value}`);
  }
}

function previousQuestion(): void {
  if (practiceSession.value.currentIndex > 0) {
    practiceSession.value.currentIndex--;
  }
}

function endSession(): void {
  practiceSession.value.isActive = false;
  selectedBankId.value = null;
}

// Lifecycle
fetchQuestionBanks();
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Practice Mode</h2>
      <p class="text-gray-500 text-sm mt-1">Answer questions to practice and track your progress</p>
    </div>

    <!-- Session Setup -->
    <el-card v-if="!practiceSession.isActive" class="shadow-sm border-0" body-class="p-6">
      <div class="space-y-6">
        <!-- Question Bank Selection -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Select Question Bank</label>
          <el-select
            v-model="selectedBankId"
            placeholder="Choose a question bank"
            class="w-full"
            :loading="isLoadingBanks"
          >
            <el-option
              v-for="bank in questionBanks"
              :key="bank.bank_id"
              :label="bank.name"
              :value="bank.bank_id"
            />
          </el-select>
          <p v-if="questionBanks.length === 0 && !isLoadingBanks" class="text-sm text-gray-500 mt-2">
            No question banks found. Create one in the Question Bank tab first.
          </p>
        </div>

        <!-- Question Count -->
        <div>
          <label class="block text-sm font-medium text-gray-700 mb-2">Number of Questions</label>
          <el-slider
            v-model="questionCount"
            :min="1"
            :max="50"
            :step="1"
            :marks="{ 1: '1', 10: '10', 20: '20', 30: '30', 50: '50' }"
            show-input
          />
        </div>

        <!-- Start Button -->
        <el-button
          type="primary"
          size="large"
          @click="startPracticeSession"
          :loading="isStartingSession"
          :disabled="!selectedBankId"
          class="w-full"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
          </template>
          Start Practice Session
        </el-button>
      </div>
    </el-card>

    <!-- Active Session -->
    <el-card v-else class="shadow-sm border-0" body-class="p-0">
      <!-- Session Header -->
      <div class="p-4 border-b bg-gradient-to-r from-indigo-50 to-purple-50">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-4">
            <div>
              <h3 class="font-semibold text-gray-900">Practice Session</h3>
              <p class="text-sm text-gray-500">Question {{ practiceSession.currentIndex + 1 }} of {{ practiceSession.questions.length }}</p>
            </div>
          </div>
          <div class="flex items-center gap-6">
            <div class="text-center">
              <div class="text-2xl font-bold text-green-600">{{ practiceSession.correctCount }}</div>
              <div class="text-xs text-gray-500">Correct</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-red-600">{{ practiceSession.wrongCount }}</div>
              <div class="text-xs text-gray-500">Wrong</div>
            </div>
            <div class="text-center">
              <div class="text-2xl font-bold text-indigo-600">{{ accuracy }}%</div>
              <div class="text-xs text-gray-500">Accuracy</div>
            </div>
            <el-button size="small" text type="danger" @click="endSession">
              End Session
            </el-button>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="mt-4">
          <el-progress
            :percentage="Math.round((totalAnswered / practiceSession.questions.length) * 100)"
            :stroke-width="4"
            :show-text="false"
          />
        </div>
      </div>

      <!-- Answer Card -->
      <div class="p-6">
        <AnswerCard
          :token="token"
          :question="practiceSession.questions[practiceSession.currentIndex] || null"
          :question-index="practiceSession.currentIndex"
          :total-questions="practiceSession.questions.length"
          @answer-submitted="handleAnswerSubmitted"
          @next-question="nextQuestion"
          @previous-question="previousQuestion"
        />
      </div>
    </el-card>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-slider) {
  padding: 0 8px;
}
</style>
