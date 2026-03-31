// src/constants/school.ts
// School data fetch task status constants

export const FETCH_TASK_STATUS = {
  NONE: 'none' as const,           // No task
  PENDING: 'pending' as const,     // Waiting to be processed
  RUNNING: 'running' as const,     // Processing
  SUCCESS: 'success' as const,     // Completed successfully
  FAILED: 'failed' as const        // Failed
}

export type FetchTaskStatus = typeof FETCH_TASK_STATUS[keyof typeof FETCH_TASK_STATUS]

export const STATUS_LABELS: Record<FetchTaskStatus, string> = {
  [FETCH_TASK_STATUS.NONE]: 'Not Started',
  [FETCH_TASK_STATUS.PENDING]: 'Waiting',
  [FETCH_TASK_STATUS.RUNNING]: 'Processing',
  [FETCH_TASK_STATUS.SUCCESS]: 'Completed',
  [FETCH_TASK_STATUS.FAILED]: 'Failed'
}

export const STATUS_ICONS: Record<FetchTaskStatus, string> = {
  [FETCH_TASK_STATUS.NONE]: '⏸️',
  [FETCH_TASK_STATUS.PENDING]: '⏳',
  [FETCH_TASK_STATUS.RUNNING]: '🔄',
  [FETCH_TASK_STATUS.SUCCESS]: '✅',
  [FETCH_TASK_STATUS.FAILED]: '❌'
}

export const STATUS_COLORS: Record<FetchTaskStatus, string> = {
  [FETCH_TASK_STATUS.NONE]: 'text-gray-500',
  [FETCH_TASK_STATUS.PENDING]: 'text-yellow-500',
  [FETCH_TASK_STATUS.RUNNING]: 'text-blue-500',
  [FETCH_TASK_STATUS.SUCCESS]: 'text-green-500',
  [FETCH_TASK_STATUS.FAILED]: 'text-red-500'
}
