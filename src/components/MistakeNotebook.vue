<!-- src/components/MistakeNotebook.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { ErrorRecordResponse } from '../types';
import { API_BASE_URL, handleApiError } from '../utils/api';

const props = defineProps<{
  token: string;
}>();

const errorRecords = ref<ErrorRecordResponse[]>([]);
const isLoading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);

async function fetchMyErrors(): Promise<void> {
  isLoading.value = true;
  errorMessage.value = null;
  
  try {
    const response = await fetch(`${API_BASE_URL}/errors/me`, {
      headers: { 'Authorization': `Bearer ${props.token}` }
    });
    
    if (!response.ok) await handleApiError(response);
    
    errorRecords.value = (await response.json()) as ErrorRecordResponse[];
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isLoading.value = false;
  }
}

onMounted(() => {
  fetchMyErrors();
});
</script>

<template>
  <div class="max-w-4xl">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-6" @close="errorMessage = null" />

    <div class="flex justify-between items-center mb-6">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">Mistake Notebook</h2>
        <p class="text-gray-600 text-sm mt-1">Review the questions you answered incorrectly to strengthen your knowledge.</p>
      </div>
      <el-button icon="Refresh" circle @click="fetchMyErrors" :loading="isLoading" />
    </div>

    <div v-if="isLoading" class="py-10 text-center text-gray-500">Loading your mistakes...</div>
    
    <el-empty v-else-if="errorRecords.length === 0" description="Great job! Your mistake notebook is empty." />
    
    <div v-else class="space-y-6">
      <el-card v-for="record in errorRecords" :key="record.id" class="shadow-sm border-l-4 border-l-red-500">
        <template v-if="record.question">
          <h3 class="text-lg font-semibold text-gray-900 mb-4">{{ record.question.stem }}</h3>
          
          <div class="space-y-2 mb-4">
            <div v-for="(option, index) in record.question.options" :key="index" 
                 class="p-3 rounded-md border text-sm"
                 :class="{
                   'bg-red-50 border-red-300 text-red-800': option === record.selected_option,
                   'bg-green-50 border-green-300 text-green-800 font-medium': option === record.question.correct_answer,
                   'bg-gray-50 border-gray-200 text-gray-700': option !== record.selected_option && option !== record.question.correct_answer
                 }">
              {{ String.fromCharCode(65 + index) }}. {{ option }}
              
              <span v-if="option === record.selected_option" class="ml-2 text-xs font-bold text-red-600">(Your Answer)</span>
              <span v-if="option === record.question.correct_answer" class="ml-2 text-xs font-bold text-green-600">(Correct Answer)</span>
            </div>
          </div>

          <div v-if="record.question.explanation || record.question.knowledge_points" class="bg-blue-50 p-4 rounded-md mt-4 text-sm text-blue-900">
            <p v-if="record.question.knowledge_points" class="mb-2"><strong>Tags:</strong> <el-tag size="small" type="info">{{ record.question.knowledge_points }}</el-tag></p>
            <p v-if="record.question.explanation"><strong>Explanation:</strong> {{ record.question.explanation }}</p>
          </div>
        </template>
        <template v-else>
          <div class="text-gray-500 text-sm">Question data is no longer available. (ID: {{ record.question_id }})</div>
        </template>
      </el-card>
    </div>
  </div>
</template>