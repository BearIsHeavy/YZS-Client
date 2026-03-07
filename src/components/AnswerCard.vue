<!-- src/components/AnswerCard.vue -->
<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import type { PracticeQuestion, AnswerSubmitResponse } from '../types';
import { mistakeNotebookApi } from '../utils/api';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  token: string;
  question: PracticeQuestion | null;
  questionIndex: number;
  totalQuestions: number;
}>();

const emit = defineEmits<{
  (e: 'answer-submitted', result: AnswerSubmitResponse): void;
  (e: 'next-question'): void;
  (e: 'previous-question'): void;
}>();

// State
const selectedAnswer = ref<string>('');
const isSubmitted = ref<boolean>(false);
const isSubmitting = ref<boolean>(false);
const submitResult = ref<AnswerSubmitResponse | null>(null);
const startTime = ref<number>(Date.now());

// Computed
const optionLabels = ['A', 'B', 'C', 'D', 'E', 'F'];

const optionsArray = computed(() => {
  if (!props.question?.options) return [];
  const options = props.question.options;
  if (Array.isArray(options)) {
    return options.map((opt, idx) => ({
      label: optionLabels[idx] || String.fromCharCode(65 + idx),
      text: opt
    }));
  }
  // Handle object format
  return Object.entries(options).map(([key, value]) => ({
    label: key.toUpperCase(),
    text: value as string
  }));
});

const elapsedTime = computed(() => {
  return Math.floor((Date.now() - startTime.value) / 1000);
});

// Methods
function selectAnswer(option: string): void {
  if (isSubmitted.value) return;
  selectedAnswer.value = option;
}

async function submitAnswer(): Promise<void> {
  if (!selectedAnswer.value || !props.question) {
    ElMessage.warning('Please select an answer first');
    return;
  }

  isSubmitting.value = true;
  try {
    const result = await mistakeNotebookApi.submitAnswer(props.token, {
      question_no: props.question.question_no,
      user_answer: selectedAnswer.value,
      time_spent_seconds: elapsedTime.value
    });

    submitResult.value = result;
    isSubmitted.value = true;

    // Show feedback
    if (result.is_correct) {
      ElMessage.success('Correct! 🎉');
    } else {
      ElMessage.error(`Incorrect. The correct answer is ${result.correct_answer}`);
    }

    emit('answer-submitted', result);
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to submit answer');
  } finally {
    isSubmitting.value = false;
  }
}

function resetQuestion(): void {
  selectedAnswer.value = '';
  isSubmitted.value = false;
  submitResult.value = null;
  startTime.value = Date.now();
}

// Watch for question changes
watch(() => props.question, () => {
  resetQuestion();
}, { immediate: true });
</script>

<template>
  <div v-if="question" class="answer-card">
    <!-- Progress Header -->
    <div class="flex items-center justify-between mb-6 pb-4 border-b">
      <div class="flex items-center gap-3">
        <span class="text-sm text-gray-500">Question</span>
        <span class="px-3 py-1 bg-indigo-100 text-indigo-700 rounded-full text-sm font-medium">
          {{ questionIndex + 1 }} / {{ totalQuestions }}
        </span>
      </div>
      <div class="flex items-center gap-2 text-sm text-gray-500">
        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>{{ elapsedTime }}s elapsed</span>
      </div>
    </div>

    <!-- Question Content -->
    <div class="mb-6">
      <div class="flex items-center gap-2 mb-3">
        <el-tag size="small" effect="light">{{ question.category }}</el-tag>
        <el-tag size="small" type="info" effect="plain">{{ question.question_type.replace('_', ' ') }}</el-tag>
      </div>
      <h3 class="text-lg font-medium text-gray-900 leading-relaxed">
        {{ question.stem }}
      </h3>
    </div>

    <!-- Answer Options -->
    <div class="space-y-3 mb-6">
      <div
        v-for="(option, idx) in optionsArray"
        :key="idx"
        @click="selectAnswer(option.label)"
        class="p-4 border-2 rounded-xl cursor-pointer transition-all duration-200 hover:shadow-md"
        :class="[
          selectedAnswer === option.label
            ? 'border-indigo-500 bg-indigo-50 shadow-md'
            : 'border-gray-200 hover:border-indigo-300',
          isSubmitted && option.label === submitResult?.correct_answer
            ? 'border-green-500 bg-green-50'
            : '',
          isSubmitted && selectedAnswer === option.label && !submitResult?.is_correct
            ? 'border-red-500 bg-red-50'
            : ''
        ]"
      >
        <div class="flex items-center gap-3">
          <span
            class="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
            :class="[
              selectedAnswer === option.label
                ? 'bg-indigo-500 text-white'
                : 'bg-gray-100 text-gray-600',
              isSubmitted && option.label === submitResult?.correct_answer
                ? 'bg-green-500 text-white'
                : '',
              isSubmitted && selectedAnswer === option.label && !submitResult?.is_correct
                ? 'bg-red-500 text-white'
                : ''
            ]"
          >
            {{ option.label }}
          </span>
          <span class="flex-1 text-gray-700">{{ option.text }}</span>
          <span v-if="isSubmitted && option.label === submitResult?.correct_answer" class="text-green-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
          </span>
          <span v-if="isSubmitted && selectedAnswer === option.label && !submitResult?.is_correct" class="text-red-600">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
          </span>
        </div>
      </div>
    </div>

    <!-- Explanation (shown after submission) -->
    <div v-if="isSubmitted && submitResult?.explanation" class="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-xl">
      <div class="flex items-center gap-2 mb-2 text-amber-800 font-medium">
        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>Explanation</span>
      </div>
      <p class="text-amber-900 text-sm leading-relaxed">{{ submitResult.explanation }}</p>
    </div>

    <!-- Action Buttons -->
    <div class="flex items-center justify-between pt-4 border-t">
      <el-button
        @click="$emit('previous-question')"
        :disabled="questionIndex === 0"
        size="large"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </template>
        Previous
      </el-button>

      <div class="flex items-center gap-3">
        <el-button
          v-if="!isSubmitted"
          type="primary"
          size="large"
          @click="submitAnswer"
          :loading="isSubmitting"
          :disabled="!selectedAnswer"
          class="px-8"
        >
          Submit Answer
        </el-button>
        <el-button
          v-else
          type="success"
          size="large"
          @click="$emit('next-question')"
          class="px-8"
        >
          {{ questionIndex < totalQuestions - 1 ? 'Next Question' : 'Finish' }}
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
            </svg>
          </template>
        </el-button>
      </div>
    </div>
  </div>

  <!-- Empty State -->
  <div v-else class="text-center py-12 text-gray-500">
    <svg class="w-16 h-16 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"></path>
    </svg>
    <p>No question loaded</p>
  </div>
</template>

<style scoped>
.answer-card {
  animation: fadeIn 0.3s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
