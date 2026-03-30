<!-- src/components/SchoolDetail.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { SchoolInfoResponse } from '../types';
import { schoolApi } from '../utils/api';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
  schoolId: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'back'): void;
}>();

// State
const school = ref<SchoolInfoResponse | null>(null);
const isLoading = ref(false);
const error = ref<string | null>(null);
const isEditing = ref(false);
const isSaving = ref(false);

// Form state for editing progress
const formState = ref({
  cutoff_score: '',
  contact_phone: '',
  supervisor_name: '',
  supervisor_contact: '',
  email_status: 0
});

// ==========================================
// DATA FETCHING
// ==========================================

async function fetchSchoolDetail(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    const data = await schoolApi.getById(props.token, props.schoolId);
    school.value = data;
    
    // Initialize form state with current values
    formState.value = {
      cutoff_score: data.cutoff_score || '',
      contact_phone: data.contact_phone || '',
      supervisor_name: data.supervisor_name || '',
      supervisor_contact: data.supervisor_contact || '',
      email_status: data.email_status || 0
    };
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch school details';
    console.error('Failed to fetch school details:', err);
  } finally {
    isLoading.value = false;
  }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function handleEdit(): void {
  isEditing.value = true;
}

function handleCancel(): void {
  if (school.value) {
    formState.value = {
      cutoff_score: school.value.cutoff_score || '',
      contact_phone: school.value.contact_phone || '',
      supervisor_name: school.value.supervisor_name || '',
      supervisor_contact: school.value.supervisor_contact || '',
      email_status: school.value.email_status || 0
    };
  }
  isEditing.value = false;
}

async function handleSave(): Promise<void> {
  if (!school.value) return;
  
  isSaving.value = true;
  error.value = null;

  try {
    const updatedData = await schoolApi.updateProgress(props.token, props.schoolId, {
      cutoff_score: formState.value.cutoff_score || null,
      contact_phone: formState.value.contact_phone || null,
      supervisor_name: formState.value.supervisor_name || null,
      supervisor_contact: formState.value.supervisor_contact || null,
      email_status: formState.value.email_status
    });
    
    school.value = updatedData;
    isEditing.value = false;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to update school';
    console.error('Failed to update school:', err);
  } finally {
    isSaving.value = false;
  }
}

function handleBack(): void {
  emit('back');
}

// ==========================================
// COMPUTED
// ==========================================

const emailStatusOptions = computed(() => [
  { value: 0, label: t('school.status.pending'), color: 'yellow' },
  { value: 1, label: t('school.status.completed'), color: 'green' },
  { value: 2, label: t('school.status.failed'), color: 'red' }
]);

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  fetchSchoolDetail();
});
</script>

<template>
  <div class="h-full flex flex-col overflow-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <div class="flex items-center gap-2 text-sm text-gray-500 mb-1">
          <button @click="handleBack" class="hover:text-indigo-600 transition-colors">
            {{ t('school.title') }}
          </button>
          <span>/</span>
          <span class="text-gray-800 font-medium">{{ school?.school_name || t('common.loading') }}</span>
        </div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('school.detail.title') }}</h2>
      </div>
      <div class="flex items-center gap-3">
        <el-button @click="handleBack">
          {{ t('common.back') }}
        </el-button>
        <el-button
          v-if="!isEditing"
          type="primary"
          @click="handleEdit"
        >
          {{ t('common.edit') }}
        </el-button>
        <template v-else>
          <el-button @click="handleCancel">
            {{ t('common.cancel') }}
          </el-button>
          <el-button
            type="primary"
            :loading="isSaving"
            @click="handleSave"
          >
            {{ t('common.save') }}
          </el-button>
        </template>
      </div>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="flex-1 flex items-center justify-center">
      <div class="text-center">
        <div class="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p class="text-gray-500">{{ t('common.loading') }}</p>
      </div>
    </div>

    <!-- Error State -->
    <el-alert
      v-else-if="error"
      :title="error"
      type="error"
      show-icon
      class="mb-6"
      @close="error = null"
    />

    <!-- School Detail Content -->
    <div v-else-if="school" class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Basic Information Card -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"></path>
          </svg>
          {{ t('school.detail.basicInfo') }}
        </h3>
        <dl class="space-y-3">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.schoolName') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.school_name }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.schoolCode') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.school_code }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.college') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.college_name }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.collegeCode') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.college_code }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.major') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.major_name }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.majorCode') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.major_code }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.direction') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.direction_name || '-' }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.directionCode') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.direction_code || '-' }}</dd>
          </div>
        </dl>
      </div>

      <!-- Location & Status Card -->
      <div class="bg-white rounded-xl shadow-sm p-6">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
          </svg>
          {{ t('school.detail.location') }}
        </h3>
        <dl class="space-y-3">
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.city') }}</dt>
            <dd class="text-sm font-medium">
              <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                {{ school.city }}
              </span>
            </dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.region') }}</dt>
            <dd class="text-sm font-medium text-gray-900">
              {{ school.region === 1 ? t('school.region.1') : school.region === 2 ? t('school.region.2') : school.region === 3 ? t('school.region.3') : '-' }}
            </dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.emailStatus') }}</dt>
            <dd class="text-sm font-medium">
              <span
                :class="{
                  'bg-green-100 text-green-800': school.email_status === 1,
                  'bg-yellow-100 text-yellow-800': school.email_status === 0,
                  'bg-red-100 text-red-800': school.email_status === 2
                }"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ school.email_status === 1 ? t('school.status.completed') : school.email_status === 0 ? t('school.status.pending') : t('school.status.failed') }}
              </span>
            </dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.adjustmentCount') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ school.adjustment_count }}</dd>
          </div>
          <div class="flex justify-between py-2 border-b border-gray-100">
            <dt class="text-sm text-gray-500">{{ t('school.detail.createTime') }}</dt>
            <dd class="text-sm font-medium text-gray-900">{{ new Date(school.create_time).toLocaleString() }}</dd>
          </div>
        </dl>
      </div>

      <!-- Progress Information Card (Editable) -->
      <div class="bg-white rounded-xl shadow-sm p-6 lg:col-span-2">
        <h3 class="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
          </svg>
          {{ t('school.detail.progressInfo') }}
        </h3>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <!-- Cutoff Score -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('school.detail.cutoffScore') }}
            </label>
            <el-input
              v-if="isEditing"
              v-model="formState.cutoff_score"
              :placeholder="t('school.detail.cutoffScore')"
              size="default"
            />
            <div v-else class="text-sm text-gray-900 py-2">
              {{ school.cutoff_score || '-' }}
            </div>
          </div>

          <!-- Contact Phone -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('school.detail.contactPhone') }}
            </label>
            <el-input
              v-if="isEditing"
              v-model="formState.contact_phone"
              :placeholder="t('school.detail.contactPhone')"
              size="default"
            />
            <div v-else class="text-sm text-gray-900 py-2">
              {{ school.contact_phone || '-' }}
            </div>
          </div>

          <!-- Supervisor Name -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('school.detail.supervisorName') }}
            </label>
            <el-input
              v-if="isEditing"
              v-model="formState.supervisor_name"
              :placeholder="t('school.detail.supervisorName')"
              size="default"
            />
            <div v-else class="text-sm text-gray-900 py-2">
              {{ school.supervisor_name || '-' }}
            </div>
          </div>

          <!-- Supervisor Contact -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('school.detail.supervisorContact') }}
            </label>
            <el-input
              v-if="isEditing"
              v-model="formState.supervisor_contact"
              :placeholder="t('school.detail.supervisorContact')"
              size="default"
            />
            <div v-else class="text-sm text-gray-900 py-2">
              {{ school.supervisor_contact || '-' }}
            </div>
          </div>

          <!-- Email Status -->
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">
              {{ t('school.detail.emailStatus') }}
            </label>
            <el-select
              v-if="isEditing"
              v-model="formState.email_status"
              class="w-full"
              size="default"
            >
              <el-option
                v-for="option in emailStatusOptions"
                :key="option.value"
                :label="option.label"
                :value="option.value"
              />
            </el-select>
            <div v-else>
              <span
                :class="{
                  'bg-green-100 text-green-800': school.email_status === 1,
                  'bg-yellow-100 text-yellow-800': school.email_status === 0,
                  'bg-red-100 text-red-800': school.email_status === 2
                }"
                class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
              >
                {{ school.email_status === 1 ? t('school.status.completed') : school.email_status === 0 ? t('school.status.pending') : t('school.status.failed') }}
              </span>
            </div>
          </div>
        </div>

        <!-- Remarks -->
        <div class="mt-4">
          <label class="block text-sm font-medium text-gray-700 mb-1">
            {{ t('school.detail.remarks') }}
          </label>
          <div v-if="!isEditing" class="text-sm text-gray-900 py-2 min-h-[60px]">
            {{ school.remarks || '-' }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
.overflow-auto::-webkit-scrollbar {
  width: 8px;
}

.overflow-auto::-webkit-scrollbar-track {
  background: #f1f1f1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb {
  background: #c1c1c1;
  border-radius: 4px;
}

.overflow-auto::-webkit-scrollbar-thumb:hover {
  background: #a1a1a1;
}
</style>
