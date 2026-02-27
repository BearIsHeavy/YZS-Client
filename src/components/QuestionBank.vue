<!-- src/components/QuestionBank.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { QuestionResponse } from '../types';
import { API_BASE_URL, handleApiError } from '../utils/api';

const props = defineProps<{
  token: string;
}>();

const emit = defineEmits<{
  (e: 'navigate-to-upload'): void;
}>();

const questions = ref<QuestionResponse[]>([]);
const questionsLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

const userAnswers = ref<Record<number, string>>({});
const answerResults = ref<Record<number, boolean>>({});

async function fetchQuestions(): Promise<void> {
  questionsLoading.value = true;
  errorMessage.value = null;

  try {
    const response = await fetch(`${API_BASE_URL}/questions?skip=0&limit=100`, {
      headers: { 'Authorization': `Bearer ${props.token}` }
    });

    if (!response.ok) await handleApiError(response);

    questions.value = (await response.json()) as QuestionResponse[];
    userAnswers.value = {};
    answerResults.value = {};
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    questionsLoading.value = false;
  }
}

async function submitAnswer(question: QuestionResponse, selectedOption: string): Promise<void> {
  if (userAnswers.value[question.id] !== undefined) return;

  userAnswers.value[question.id] = selectedOption;
  const isCorrect = question.correct_answer === selectedOption;
  answerResults.value[question.id] = isCorrect;

  if (!isCorrect) {
    try {
      const response = await fetch(`${API_BASE_URL}/errors`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${props.token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          question_id: question.id,
          selected_option: selectedOption
        })
      });

      if (!response.ok) await handleApiError(response);
    } catch (error: unknown) {
      console.error('Failed to record error:', error);
      errorMessage.value = 'Failed to record incorrect answer in Mistake Notebook.';
    }
  }
}

onMounted(() => {
  fetchQuestions();
});
</script>

<template>
  <div class="max-w-4xl">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-6" @close="errorMessage = null" />

    <div class="flex justify-between items-center mb-6">
      <h2 class="text-2xl font-bold text-gray-800">Question Bank</h2>
      <div>
        <el-button @click="fetchQuestions" :loading="questionsLoading" class="mr-2">Refresh</el-button>
        <el-button type="primary" @click="emit('navigate-to-upload')">+ Add Questions</el-button>
      </div>
    </div>

    <div v-if="questionsLoading" class="py-10 text-center text-gray-500">Loading questions...</div>

    <el-empty v-else-if="questions.length === 0" description="No questions found.">
      <p class="text-gray-500 text-sm mt-2">
        Upload some questions via the 'Upload CSV/XML' tab to get started!
      </p>
    </el-empty>

    <div v-else class="space-y-6">
      <el-card v-for="q in questions" :key="q.id" class="shadow-sm">
        <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ q.stem }}</h3>

        <div class="space-y-2 mb-4">
          <div v-for="(opt, idx) in q.options" :key="idx"
               @click="submitAnswer(q, opt)"
               class="p-3 rounded-md border text-sm transition-colors"
               :class="{
                 'cursor-pointer hover:bg-gray-50': userAnswers[q.id] === undefined,
                 'cursor-not-allowed': userAnswers[q.id] !== undefined,
                 'bg-red-50 border-red-300 text-red-800': userAnswers[q.id] === opt && !answerResults[q.id],
                 'bg-green-50 border-green-300 text-green-800 font-medium': userAnswers[q.id] !== undefined && opt === q.correct_answer,
                 'bg-gray-50 border-gray-200 text-gray-700': userAnswers[q.id] !== undefined && opt !== q.correct_answer && !(userAnswers[q.id] === opt && !answerResults[q.id])
               }">
            {{ String.fromCharCode(65 + idx) }}. {{ opt }}

            <span v-if="userAnswers[q.id] === opt && !answerResults[q.id]" class="ml-2 text-xs font-bold text-red-600">(Your Answer)</span>
            <span v-if="userAnswers[q.id] !== undefined && opt === q.correct_answer" class="ml-2 text-xs font-bold text-green-600">(Correct Answer)</span>
          </div>
        </div>

        <div v-if="userAnswers[q.id] !== undefined && (q.explanation || q.knowledge_points)" class="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-900">
          <p v-if="q.knowledge_points" class="mb-2"><strong>Tags:</strong> <el-tag size="small" type="info">{{ q.knowledge_points }}</el-tag></p>
          <p v-if="q.explanation"><strong>Explanation:</strong> {{ q.explanation }}</p>
        </div>
      </el-card>
    </div>
  </div>
</template>