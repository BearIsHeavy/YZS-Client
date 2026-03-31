<!-- src/components/SchoolDataFetch.vue -->
<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { schoolApi } from '../utils/api';
import { FETCH_TASK_STATUS, STATUS_LABELS, STATUS_ICONS, STATUS_COLORS } from '../constants/school';
import type { FetchTaskStatusEnum } from '../types';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'refresh'): void;
  (e: 'close'): void;
}>();

// Form state
const curlCommand = ref('');
const pages = ref(10);

// Task state
const taskStatus = ref<{
  status: FetchTaskStatusEnum;
  error: string | null;
  message: string | null;
  fetched_count: number;
}>({
  status: FETCH_TASK_STATUS.NONE,
  error: null,
  message: null,
  fetched_count: 0
});

const pollTimer = ref<number | null>(null);
const errorMessage = ref<string | null>(null);
const isSubmitting = ref(false);

// Computed properties
const isTaskRunning = computed(() => {
  const status = taskStatus.value.status;
  return status === FETCH_TASK_STATUS.RUNNING || status === FETCH_TASK_STATUS.PENDING;
});

const statusText = computed(() => {
  return STATUS_LABELS[taskStatus.value.status] || 'Unknown Status';
});

const statusIcon = computed(() => {
  return STATUS_ICONS[taskStatus.value.status] || '❓';
});

const statusColor = computed(() => {
  return STATUS_COLORS[taskStatus.value.status] || 'text-gray-500';
});

// Methods
const startFetch = async () => {
  if (!curlCommand.value.trim()) {
    errorMessage.value = 'Please enter a cURL command';
    return;
  }

  isSubmitting.value = true;
  errorMessage.value = null;

  try {
    const result = await schoolApi.createFetchTask(props.token, curlCommand.value, pages.value);
    console.log('Task created:', result.message);
    taskStatus.value.status = FETCH_TASK_STATUS.PENDING;
    taskStatus.value.message = result.message;

    // Start polling for status updates
    startPolling();
  } catch (error) {
    console.error('Failed to create task:', error);
    const errorMsg = error instanceof Error ? error.message : 'Failed to create task';
    errorMessage.value = errorMsg;

    // If error indicates a running task, start polling
    if (errorMsg.includes('still running') || errorMsg.includes('already running')) {
      startPolling();
    }
  } finally {
    isSubmitting.value = false;
  }
};

const startPolling = () => {
  // Clear existing timer
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
  }

  // Check immediately
  checkStatus();

  // Poll every 5 seconds
  pollTimer.value = window.setInterval(checkStatus, 5000);
};

const checkStatus = async () => {
  try {
    const status = await schoolApi.getFetchStatus(props.token);
    taskStatus.value = status;

    if (status.status === FETCH_TASK_STATUS.SUCCESS) {
      // Task completed successfully
      stopPolling();
      console.log(`Data fetch completed! Fetched ${status.fetched_count} records`);
    } else if (status.status === FETCH_TASK_STATUS.FAILED) {
      // Task failed
      stopPolling();
      errorMessage.value = status.error || 'Task failed';
      console.error('Task failed:', status.error);
    }
    // Continue polling for running/pending states
  } catch (error) {
    console.error('Failed to check status:', error);
    // Continue polling on network errors
  }
};

const stopPolling = () => {
  if (pollTimer.value) {
    clearInterval(pollTimer.value);
    pollTimer.value = null;
  }
};

const handleRefresh = () => {
  emit('refresh');
  resetTask();
};

const resetTask = () => {
  stopPolling();
  taskStatus.value = {
    status: FETCH_TASK_STATUS.NONE,
    error: null,
    message: null,
    fetched_count: 0
  };
  errorMessage.value = null;
  curlCommand.value = '';
};

const handleClose = () => {
  emit('close');
};

// Lifecycle hooks
onMounted(() => {
  // Check for existing task on mount
  checkStatus();
});

onUnmounted(() => {
  // Clean up timer on component unmount
  stopPolling();
});
</script>

<template>
  <div class="school-data-fetch">
    <!-- Input Area (shown when no active task) -->
    <div v-if="!isTaskRunning && taskStatus.status === FETCH_TASK_STATUS.NONE" class="input-section">
      <h3 class="text-lg font-semibold text-gray-800 mb-4">{{ t('curl.fetchTask.inputTitle') }}</h3>

      <div class="form-group mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('curl.fetchTask.curlCommandLabel') }}</label>
        <textarea
          v-model="curlCommand"
          :placeholder="t('curl.fetchTask.curlCommandHelp')"
          rows="6"
          class="w-full px-3 py-2 border border-gray-300 rounded-md font-mono text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        ></textarea>
      </div>

      <div class="form-group mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">{{ t('curl.fetchTask.pagesLabel') }}</label>
        <input
          type="number"
          v-model.number="pages"
          min="1"
          max="100"
          class="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div class="flex gap-2">
        <button
          @click="startFetch"
          :disabled="!curlCommand.trim() || isSubmitting"
          class="flex-1 bg-indigo-600 hover:bg-indigo-700 disabled:bg-gray-400 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ isSubmitting ? t('curl.fetchTask.starting') : t('curl.fetchTask.startFetch') }}
        </button>
        <button
          @click="handleClose"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ t('common.cancel') }}
        </button>
      </div>
    </div>

    <!-- Task Running/Completed/Failed Section -->
    <div v-else class="task-section">
      <div class="status-indicator flex items-center justify-center gap-3 mb-6" :class="statusColor">
        <span class="text-3xl">{{ statusIcon }}</span>
        <span class="text-xl font-medium">{{ statusText }}</span>
      </div>

      <!-- Progress indicator for running tasks -->
      <div v-if="taskStatus.status === FETCH_TASK_STATUS.RUNNING" class="mb-6">
        <div class="w-full bg-gray-200 rounded-full h-2">
          <div class="bg-indigo-600 h-2 rounded-full animate-pulse" style="width: 100%"></div>
        </div>
        <p class="text-center text-sm text-gray-600 mt-2">{{ t('curl.fetchTask.fetching') }}</p>
      </div>

      <!-- Progress info for completed tasks -->
      <div v-if="taskStatus.fetched_count > 0" class="mb-6 p-4 bg-green-50 rounded-lg">
        <p class="text-center text-green-800">
          {{ t('curl.fetchTask.recordsFetched').replace('{count}', taskStatus.fetched_count.toString()) }}
        </p>
      </div>

      <!-- Error message for failed tasks -->
      <div v-if="taskStatus.status === FETCH_TASK_STATUS.FAILED && errorMessage" class="mb-6 p-4 bg-red-50 rounded-lg">
        <p class="text-red-800 font-medium mb-2">{{ t('curl.fetchTask.errorDetails') }}</p>
        <pre class="text-sm text-red-700 bg-white p-3 rounded overflow-x-auto">{{ errorMessage }}</pre>
      </div>

      <!-- Action buttons -->
      <div class="flex gap-2">
        <button
          v-if="taskStatus.status === FETCH_TASK_STATUS.SUCCESS"
          @click="handleRefresh"
          class="flex-1 bg-green-600 hover:bg-green-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ t('curl.fetchTask.refreshList') }}
        </button>
        <button
          v-if="taskStatus.status === FETCH_TASK_STATUS.FAILED"
          @click="resetTask"
          class="flex-1 bg-gray-600 hover:bg-gray-700 text-white font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ t('curl.fetchTask.retry') }}
        </button>
        <button
          v-if="taskStatus.status === FETCH_TASK_STATUS.SUCCESS || taskStatus.status === FETCH_TASK_STATUS.FAILED"
          @click="handleClose"
          class="bg-gray-200 hover:bg-gray-300 text-gray-700 font-medium py-2 px-4 rounded-md transition-colors"
        >
          {{ t('common.close') }}
        </button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.school-data-fetch {
  padding: 20px;
}

.input-section {
  animation: fadeIn 0.3s ease-in;
}

.task-section {
  animation: fadeIn 0.3s ease-in;
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
