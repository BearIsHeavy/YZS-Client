<!-- src/components/UploadQuestions.vue -->
<script setup lang="ts">
import { ref } from 'vue';
import type { QuestionBankResponse } from '../types';
import { uploadApi } from '../utils/api';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  token: string;
}>();

// State
const questionBanks = ref<QuestionBankResponse[]>([]);
const isLoadingBanks = ref<boolean>(false);
const selectedBankId = ref<number | null>(null);
const uploadMethod = ref<'csv' | 'xml' | 'single'>('csv');

// File upload state
const selectedFile = ref<File | null>(null);
const isUploading = ref<boolean>(false);
const dragOver = ref<boolean>(false);

// Single question form
const singleQuestionForm = ref({
  category: '',
  stem: '',
  qus_type: 1 as 0 | 1 | 2 | 3,
  correct_ans_summary: '',
  is_public: true,
  options: {} as Record<string, unknown>,
  full_text: '',
  full_answer: '',
  explanation: ''
});

// Fetch question banks
async function fetchQuestionBanks(): Promise<void> {
  isLoadingBanks.value = true;
  try {
    // Note: This requires GET /question_banks endpoint on backend
    // For now, using empty array - will be populated when backend supports it
    questionBanks.value = [];
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to fetch question banks');
  } finally {
    isLoadingBanks.value = false;
  }
}

// Handle file selection
function onFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedFile.value = target.files[0] as File;
  }
}

// Handle drag over
function onDragOver(event: DragEvent): void {
  event.preventDefault();
  dragOver.value = true;
}

// Handle drag leave
function onDragLeave(): void {
  dragOver.value = false;
}

// Handle drop
function onDrop(event: DragEvent): void {
  event.preventDefault();
  dragOver.value = false;
  if (event.dataTransfer?.files && event.dataTransfer.files.length > 0) {
    selectedFile.value = event.dataTransfer.files[0] as File;
  }
}
// Upload file (CSV or XML)
async function uploadFile(): Promise<void> {
  if (!selectedFile.value) {
    ElMessage.warning('Please select a file first');
    return;
  }
  if (!selectedBankId.value) {
    ElMessage.warning('Please select a question bank');
    return;
  }

  isUploading.value = true;
  try {
    let result;
    if (uploadMethod.value === 'csv') {
      result = await uploadApi.uploadCsv(props.token, selectedBankId.value, selectedFile.value);
    } else {
      result = await uploadApi.uploadXml(props.token, selectedBankId.value, selectedFile.value);
    }
    
    ElMessage.success(`Upload successful! ${result.questions_imported || result.count || 0} questions imported.`);
    selectedFile.value = null;
    // Reset file input
    const fileInput = document.getElementById('file-upload') as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Upload failed');
  } finally {
    isUploading.value = false;
  }
}

// Upload single question
async function uploadSingleQuestion(): Promise<void> {
  if (!singleQuestionForm.value.category || !singleQuestionForm.value.stem) {
    ElMessage.warning('Category and Stem are required fields');
    return;
  }
  if (!selectedBankId.value) {
    ElMessage.warning('Please select a question bank');
    return;
  }

  isUploading.value = true;
  try {
    await uploadApi.uploadSingle(props.token, {
      bank_id: selectedBankId.value,
      ...singleQuestionForm.value
    });
    ElMessage.success('Question uploaded successfully!');
    
    // Reset form
    singleQuestionForm.value = {
      category: '',
      stem: '',
      qus_type: 1,
      correct_ans_summary: '',
      is_public: true,
      options: {},
      full_text: '',
      full_answer: '',
      explanation: ''
    };
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Upload failed');
  } finally {
    isUploading.value = false;
  }
}

// Lifecycle
fetchQuestionBanks();
</script>

<template>
  <div class="max-w-5xl mx-auto">
    <!-- Header -->
    <div class="mb-8">
      <h2 class="text-2xl font-bold text-gray-900">Upload Questions</h2>
      <p class="text-gray-500 text-sm mt-1">Import questions via CSV, XML, or add them individually</p>
    </div>

    <!-- Question Bank Selection -->
    <el-card class="shadow-sm border-0 mb-6" body-class="p-4">
      <div class="flex items-center gap-4">
        <label class="text-sm font-medium text-gray-700 whitespace-nowrap">Select Question Bank:</label>
        <el-select 
          v-model="selectedBankId" 
          placeholder="Choose a question bank" 
          class="flex-1"
          :loading="isLoadingBanks"
        >
          <el-option 
            v-for="bank in questionBanks" 
            :key="bank.bank_id" 
            :label="bank.name" 
            :value="bank.bank_id" 
          />
        </el-select>
        <el-alert 
          v-if="questionBanks.length === 0 && !isLoadingBanks" 
          title="No question banks found. Create one in the Question Bank tab first." 
          type="warning" 
          show-icon 
          class="flex-1"
          :closable="false"
        />
      </div>
    </el-card>

    <!-- Upload Method Tabs -->
    <el-card class="shadow-sm border-0" body-class="p-0">
      <el-tabs v-model="uploadMethod" class="upload-tabs">
        <!-- CSV Upload Tab -->
        <el-tab-pane name="csv">
          <template #label>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
              CSV Upload
            </span>
          </template>
          
          <div class="p-6">
            <el-alert 
              title="CSV Format" 
              type="info" 
              show-icon 
              :closable="false"
              class="mb-4"
            >
              <template #default>
                <div class="text-sm mt-2">
                  <p class="mb-2">Your CSV file should include these columns:</p>
                  <el-tag size="small" class="mr-2 mb-1">category</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">stem</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">qus_type</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">options</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">correct_ans_summary</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">full_text</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">image_url</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">full_answer</el-tag>
                  <el-tag size="small" class="mr-2 mb-1">explanation</el-tag>
                </div>
              </template>
            </el-alert>

            <!-- Drop Zone -->
            <div
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onDrop"
              class="border-2 border-dashed rounded-xl p-10 text-center transition-colors"
              :class="dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'"
            >
              <svg class="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="mt-4 flex text-sm text-gray-600 justify-center">
                <label for="csv-file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Upload a CSV file</span>
                  <input 
                    id="csv-file-upload" 
                    name="file-upload" 
                    type="file" 
                    class="sr-only" 
                    accept=".csv"
                    @change="onFileChange"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500 mt-2">CSV files up to 10MB</p>
            </div>

            <!-- Selected File -->
            <div v-if="selectedFile" class="mt-4 p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
              <div class="flex items-center gap-3">
                <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div>
                  <div class="font-medium text-indigo-900">{{ selectedFile.name }}</div>
                  <div class="text-xs text-indigo-600">{{ (selectedFile.size / 1024).toFixed(2) }} KB</div>
                </div>
              </div>
              <el-button 
                type="primary" 
                size="small" 
                @click="uploadFile" 
                :loading="isUploading"
                :disabled="!selectedBankId"
              >
                Upload CSV
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- XML Upload Tab -->
        <el-tab-pane name="xml">
          <template #label>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
              </svg>
              XML Upload
            </span>
          </template>
          
          <div class="p-6">
            <el-alert 
              title="XML Format" 
              type="info" 
              show-icon 
              :closable="false"
              class="mb-4"
            >
              <template #default>
                <div class="text-sm mt-2">
                  <p class="mb-2">Your XML file should follow this structure:</p>
                  <pre class="bg-gray-100 p-3 rounded text-xs overflow-x-auto">&lt;questions&gt;
  &lt;question&gt;
    &lt;category&gt;Math&lt;/category&gt;
    &lt;stem&gt;What is 2+2?&lt;/stem&gt;
    &lt;qus_type&gt;1&lt;/qus_type&gt;
    &lt;options&gt;{"A":"3","B":"4","C":"5"}&lt;/options&gt;
    &lt;correct_ans_summary&gt;B&lt;/correct_ans_summary&gt;
  &lt;/question&gt;
&lt;/questions&gt;</pre>
                </div>
              </template>
            </el-alert>

            <!-- Drop Zone -->
            <div
              @dragover="onDragOver"
              @dragleave="onDragLeave"
              @drop="onDrop"
              class="border-2 border-dashed rounded-xl p-10 text-center transition-colors"
              :class="dragOver ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'"
            >
              <svg class="mx-auto h-16 w-16 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
              </svg>
              <div class="mt-4 flex text-sm text-gray-600 justify-center">
                <label for="xml-file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
                  <span>Upload an XML file</span>
                  <input 
                    id="xml-file-upload" 
                    name="file-upload" 
                    type="file" 
                    class="sr-only" 
                    accept=".xml"
                    @change="onFileChange"
                  />
                </label>
                <p class="pl-1">or drag and drop</p>
              </div>
              <p class="text-xs text-gray-500 mt-2">XML files up to 10MB</p>
            </div>

            <!-- Selected File -->
            <div v-if="selectedFile" class="mt-4 p-4 bg-indigo-50 rounded-lg flex justify-between items-center">
              <div class="flex items-center gap-3">
                <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                </svg>
                <div>
                  <div class="font-medium text-indigo-900">{{ selectedFile.name }}</div>
                  <div class="text-xs text-indigo-600">{{ (selectedFile.size / 1024).toFixed(2) }} KB</div>
                </div>
              </div>
              <el-button 
                type="primary" 
                size="small" 
                @click="uploadFile" 
                :loading="isUploading"
                :disabled="!selectedBankId"
              >
                Upload XML
              </el-button>
            </div>
          </div>
        </el-tab-pane>

        <!-- Single Question Tab -->
        <el-tab-pane name="single">
          <template #label>
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
              </svg>
              Single Question
            </span>
          </template>
          
          <div class="p-6">
            <el-form :model="singleQuestionForm" label-position="top" label-class-name="font-medium text-gray-700">
              <div class="grid grid-cols-2 gap-4">
                <el-form-item label="Category" required>
                  <el-input 
                    v-model="singleQuestionForm.category" 
                    placeholder="e.g., Algebra, Geometry"
                    maxlength="50"
                    show-word-limit
                  />
                </el-form-item>
                <el-form-item label="Question Type" required>
                  <el-select v-model="singleQuestionForm.qus_type" class="w-full">
                    <el-option label="Essay" :value="0" />
                    <el-option label="Single Choice" :value="1" />
                    <el-option label="Multiple Choice" :value="2" />
                    <el-option label="Fill in Blank" :value="3" />
                  </el-select>
                </el-form-item>
              </div>

              <el-form-item label="Stem (Question Text)" required>
                <el-input 
                  v-model="singleQuestionForm.stem" 
                  type="textarea" 
                  :rows="3"
                  placeholder="Enter the question text"
                  maxlength="255"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="Options (JSON format for选择题)">
                <el-input 
                  v-model="singleQuestionForm.options" 
                  type="textarea" 
                  :rows="3"
                  placeholder='e.g., {"A":"Option 1","B":"Option 2","C":"Option 3","D":"Option 4"}'
                />
              </el-form-item>

              <el-form-item label="Correct Answer Summary">
                <el-input 
                  v-model="singleQuestionForm.correct_ans_summary" 
                  placeholder="Brief answer (e.g., 'B' or '4')"
                  maxlength="255"
                  show-word-limit
                />
              </el-form-item>

              <el-form-item label="Full Question Text (Optional)">
                <el-input 
                  v-model="singleQuestionForm.full_text" 
                  type="textarea" 
                  :rows="3"
                  placeholder="Complete question text with formatting"
                />
              </el-form-item>

              <el-form-item label="Full Answer (Optional)">
                <el-input 
                  v-model="singleQuestionForm.full_answer" 
                  type="textarea" 
                  :rows="3"
                  placeholder="Complete correct answer"
                />
              </el-form-item>

              <el-form-item label="Explanation (Optional)">
                <el-input 
                  v-model="singleQuestionForm.explanation" 
                  type="textarea" 
                  :rows="3"
                  placeholder="Detailed explanation of the answer"
                />
              </el-form-item>

              <el-form-item label="Visibility">
                <el-switch 
                  v-model="singleQuestionForm.is_public" 
                  active-text="Public" 
                  inactive-text="Private"
                />
              </el-form-item>

              <el-form-item>
                <el-button 
                  type="primary" 
                  @click="uploadSingleQuestion" 
                  :loading="isUploading"
                  :disabled="!selectedBankId"
                  class="w-full"
                  size="large"
                >
                  Upload Question
                </el-button>
              </el-form-item>
            </el-form>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-tabs__header) {
  margin: 0;
  padding: 0 16px;
  background-color: #f9fafb;
  border-bottom: 1px solid #e5e7eb;
}

:deep(.el-tabs__item) {
  padding: 16px 20px;
  font-weight: 500;
}

:deep(.el-tabs__content) {
  padding: 0;
}

:deep(.el-input__wrapper),
:deep(.el-textarea__inner) {
  border-radius: 8px;
}

:deep(.el-form-item__content) {
  width: 100%;
}
</style>
