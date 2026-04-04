<!-- src/components/ReportsView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { reportsApi } from '../utils/api';
import type { ReportResponse } from '../types';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

const reports = ref<ReportResponse[]>([]);
const isLoading = ref(false);
const isGenerating = ref(false);
const selectedReport = ref<ReportResponse | null>(null);
const reportData = ref<Record<string, unknown> | null>(null);

async function fetchReports(): Promise<void> {
  isLoading.value = true;
  try {
    const data = await reportsApi.list(props.token);
    reports.value = data.items || [];
  } catch (error) {
    console.error('Failed to fetch reports:', error);
  } finally {
    isLoading.value = false;
  }
}

async function handleViewReport(report: ReportResponse): Promise<void> {
  selectedReport.value = report;
  try {
    const data = await reportsApi.getData(props.token, report.report_id);
    reportData.value = data;
  } catch (error) {
    console.error('Failed to fetch report data:', error);
  }
}

async function handleGenerateWeakPoints(): Promise<void> {
  isGenerating.value = true;
  try {
    await reportsApi.generateWeakPoints(props.token);
    await fetchReports();
  } catch (error) {
    console.error('Failed to generate weak points report:', error);
  } finally {
    isGenerating.value = false;
  }
}

async function handleGenerateRecommendations(): Promise<void> {
  isGenerating.value = true;
  try {
    await reportsApi.generateRecommendations(props.token);
    await fetchReports();
  } catch (error) {
    console.error('Failed to generate recommendations report:', error);
  } finally {
    isGenerating.value = false;
  }
}

async function handleDeleteReport(report: ReportResponse): Promise<void> {
  if (!confirm(`确定要删除报告"${report.title}"吗？`)) return;
  try {
    await reportsApi.delete(props.token, report.report_id);
    if (selectedReport.value?.report_id === report.report_id) {
      selectedReport.value = null;
      reportData.value = null;
    }
    await fetchReports();
  } catch (error) {
    console.error('Failed to delete report:', error);
  }
}

function getReportTypeLabel(type: string): string {
  const labels: Record<string, string> = {
    weak_points: '薄弱点分析',
    recommendations: '学习建议',
    progress: '进度报告',
    comprehensive: '综合报告',
  };
  return labels[type] || type;
}

function getReportTypeColor(type: string): string {
  const colors: Record<string, string> = {
    weak_points: 'bg-red-100 text-red-800',
    recommendations: 'bg-green-100 text-green-800',
    progress: 'bg-blue-100 text-blue-800',
    comprehensive: 'bg-purple-100 text-purple-800',
  };
  return colors[type] || 'bg-gray-100 text-gray-800';
}

onMounted(() => {
  fetchReports();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('nav.reports') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('reports.description') }}</p>
      </div>
      <div class="flex gap-2">
        <el-button
          type="success"
          @click="handleGenerateWeakPoints"
          :loading="isGenerating"
        >
          {{ t('reports.generateWeakPoints') }}
        </el-button>
        <el-button
          type="primary"
          @click="handleGenerateRecommendations"
          :loading="isGenerating"
        >
          {{ t('reports.generateRecommendations') }}
        </el-button>
      </div>
    </div>

    <!-- Reports List -->
    <div class="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="reports.length === 0" class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
          </svg>
          <p>{{ t('reports.empty') }}</p>
          <p class="text-sm mt-2">{{ t('reports.generateHint') }}</p>
        </div>
      </div>

      <div v-else class="overflow-auto flex-1">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-6">
          <div
            v-for="report in reports"
            :key="report.report_id"
            class="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-shadow cursor-pointer"
            @click="handleViewReport(report)"
          >
            <div class="flex items-start justify-between mb-3">
              <h3 class="font-bold text-gray-800 flex-1 truncate">{{ report.title }}</h3>
              <el-button
                size="small"
                type="danger"
                text
                @click.stop="handleDeleteReport(report)"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                </svg>
              </el-button>
            </div>

            <span :class="getReportTypeColor(report.report_type)" class="px-2 py-0.5 rounded-full text-xs font-medium mb-2 inline-block">
              {{ getReportTypeLabel(report.report_type) }}
            </span>

            <p v-if="report.summary" class="text-sm text-gray-600 mb-2 line-clamp-2">{{ report.summary }}</p>

            <p class="text-xs text-gray-500">{{ new Date(report.created_at).toLocaleString() }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Report Detail Dialog -->
    <el-dialog
      v-model="selectedReport"
      :title="selectedReport?.title || ''"
      width="800px"
    >
      <div v-if="reportData" class="max-h-96 overflow-auto">
        <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ JSON.stringify(reportData, null, 2) }}</pre>
      </div>
      <div v-else class="text-center py-8 text-gray-500">
        {{ t('common.loading') }}
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.overflow-auto::-webkit-scrollbar {
  width: 8px;
  height: 8px;
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
