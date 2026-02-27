<!-- src/components/UploadQuestions.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import { API_BASE_URL, handleApiError } from '../utils/api';

const props = defineProps<{
  token: string;
}>();

const selectedFile = ref<File | null>(null);
const isUploading = ref<boolean>(false);
const errorMessage = ref<string | null>(null);
const successMessage = ref<string | null>(null);

function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0];
    errorMessage.value = null;
    successMessage.value = null;
  }
}

async function uploadQuestionsFile(): Promise<void> {
  if (!selectedFile.value) {
    errorMessage.value = 'Please select a file first.';
    return;
  }

  isUploading.value = true;
  errorMessage.value = null;
  successMessage.value = null;

  try {
    const formData = new FormData();
    formData.append('file', selectedFile.value);

    const response = await fetch(`${API_BASE_URL}/questions/upload`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${props.token}`
      },
      body: formData,
    });

    if (!response.ok) await handleApiError(response);

    successMessage.value = 'File uploaded successfully!';
    selectedFile.value = null;
  } catch (error: unknown) {
    errorMessage.value = error instanceof Error ? error.message : String(error);
  } finally {
    isUploading.value = false;
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <el-alert v-if="errorMessage" :title="errorMessage" type="error" show-icon class="mb-6" @close="errorMessage = null" />
    <el-alert v-if="successMessage" :title="successMessage" type="success" show-icon class="mb-6" @close="successMessage = null" />

    <h2 class="text-2xl font-bold text-gray-800 mb-2">Upload Question Bank</h2>
    <p class="text-gray-600 mb-6 text-sm">Upload a CSV or XML file containing new questions to import them into the database.</p>
    
    <el-card class="shadow-sm">
      <div class="border-2 border-dashed border-gray-300 rounded-lg p-10 text-center hover:bg-gray-50 transition-colors">
        <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
          <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
        </svg>
        <div class="mt-4 flex text-sm text-gray-600 justify-center">
          <label for="file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-indigo-500">
            <span>Upload a file</span>
            <input id="file-upload" name="file-upload" type="file" class="sr-only" accept=".csv, .xml" @change="onFileChange" />
          </label>
          <p class="pl-1">or drag and drop</p>
        </div>
        <p class="text-xs text-gray-500 mt-2">CSV, XML up to 10MB</p>
      </div>
      
      <div v-if="selectedFile" class="mt-4 p-3 bg-indigo-50 text-indigo-700 rounded-md text-sm flex justify-between items-center">
        <span class="font-medium">Selected: {{ selectedFile.name }}</span>
        <el-button type="primary" size="small" @click="uploadQuestionsFile" :loading="isUploading">
          Confirm Upload
        </el-button>
      </div>
    </el-card>
  </div>
</template>