<!-- src/components/SchoolView.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { SchoolInfoResponse, SchoolInfoListParams } from '../types';
import { schoolApi, API_BASE_URL } from '../utils/api';
import { useI18n } from '../i18n';
import SchoolDataFetch from './SchoolDataFetch.vue';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: 'view-school', schoolId: string): void;
}>();

// State
const schoolsData = ref<SchoolInfoResponse[]>([]);
const total = ref(0);
const page = ref(1);
const pageSize = ref(20);
const totalPages = ref(0);
const isLoading = ref(false);
const error = ref<string | null>(null);

// Filter state
const filters = ref<SchoolInfoListParams>({
  city: null,
  school_name: null,
  college_name: null,
  major_name: null,
  sort_by: 'school_name',
  order: 'asc'
});

// Search input state (for text input)
const searchInputs = ref({
  city: '',
  school_name: '',
  college_name: '',
  major_name: ''
});

// Cities for dropdown
const cities = ref<string[]>([]);
const schools = ref<string[]>([]);
const majors = ref<string[]>([]);
const isCitiesLoading = ref(false);
const isSchoolsLoading = ref(false);
const isMajorsLoading = ref(false);

// Filtered dropdown options (based on search input)
const filteredSchools = ref<string[]>([]);
const filteredMajors = ref<string[]>([]);

// School Detail State
const showDetailDialog = ref(false);
const selectedSchoolId = ref<string | null>(null);
const schoolDetail = ref<SchoolInfoResponse | null>(null);
const isDetailLoading = ref(false);
const isEditing = ref(false);
const isSaving = ref(false);

// Form state for editing
const formState = ref({
  cutoff_score: '',
  contact_phone: '',
  supervisor_name: '',
  supervisor_contact: '',
  email_status: 0
});

// Fetch Task Dialog State
const showFetchDialog = ref(false);

// Curl Runner State (kept for custom API calls)
const showCurlDialog = ref(false);
const curlCommand = ref('');
const curlResult = ref<unknown | null>(null);
const curlError = ref<string | null>(null);
const isCurlLoading = ref(false);

// Curl templates
const curlTemplates = {
  fetch: `curl -X POST "${API_BASE_URL}/school-info/fetch" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"source": "chsi"}'`,
  list: `curl -X GET "${API_BASE_URL}/school-info/schools?page=1&page_size=20" -H "Authorization: Bearer YOUR_TOKEN"`,
  update: `curl -X PUT "${API_BASE_URL}/school-info/schools/SCHOOL_ID/progress" -H "Authorization: Bearer YOUR_TOKEN" -H "Content-Type: application/json" -d '{"cutoff_score": "600"}'`
};

// ==========================================
// EVENT HANDLERS
// ==========================================

function openFetchDialog(): void {
  showFetchDialog.value = true;
}

function closeFetchDialog(): void {
  showFetchDialog.value = false;
}

function handleFetchComplete(): void {
  // Refresh school list when fetch is complete
  fetchSchoolList();
  closeFetchDialog();
}

async function fetchCities(): Promise<void> {
  if (cities.value.length > 0) return;
  
  isCitiesLoading.value = true;
  try {
    const data = await schoolApi.getCities(props.token);
    cities.value = data.cities || [];
  } catch (err: unknown) {
    console.error('Failed to fetch cities:', err);
  } finally {
    isCitiesLoading.value = false;
  }
}

async function fetchSchools(): Promise<void> {
  isSchoolsLoading.value = true;
  try {
    const data = await schoolApi.getSchools(props.token, {
      city: filters.value.city
    });
    schools.value = data.schools || [];
    filteredSchools.value = schools.value;
    
    // Clear school selection if not in the new list
    if (filters.value.school_name && !schools.value.includes(filters.value.school_name)) {
      filters.value.school_name = null;
      searchInputs.value.school_name = '';
    }
  } catch (err: unknown) {
    console.error('Failed to fetch schools:', err);
  } finally {
    isSchoolsLoading.value = false;
  }
}

async function fetchMajors(): Promise<void> {
  isMajorsLoading.value = true;
  try {
    const data = await schoolApi.getMajors(props.token, {
      city: filters.value.city,
      school_name: filters.value.school_name
    });
    majors.value = data.majors || [];
    filteredMajors.value = majors.value;
    
    // Clear major selection if not in the new list
    if (filters.value.major_name && !majors.value.includes(filters.value.major_name)) {
      filters.value.major_name = null;
      searchInputs.value.major_name = '';
    }
  } catch (err: unknown) {
    console.error('Failed to fetch majors:', err);
  } finally {
    isMajorsLoading.value = false;
  }
}

async function fetchSchoolList(): Promise<void> {
  isLoading.value = true;
  error.value = null;

  try {
    const data = await schoolApi.list(props.token, {
      page: page.value,
      page_size: pageSize.value,
      city: filters.value.city || undefined,
      school_name: filters.value.school_name || undefined,
      college_name: filters.value.college_name || undefined,
      major_name: filters.value.major_name || undefined,
      sort_by: filters.value.sort_by,
      order: filters.value.order
    });

    schoolsData.value = data.items;
    total.value = data.total;
    totalPages.value = data.total_pages;
  } catch (err: unknown) {
    error.value = err instanceof Error ? err.message : 'Failed to fetch schools';
    console.error('Failed to fetch schools:', err);
  } finally {
    isLoading.value = false;
  }
}

// ==========================================
// EVENT HANDLERS
// ==========================================

function handlePageChange(newPage: number): void {
  page.value = newPage;
  fetchSchoolList();
}

function handlePageSizeChange(newSize: number): void {
  pageSize.value = newSize;
  page.value = 1;
  fetchSchoolList();
}

function handleApplyFilters(): void {
  filters.value = {
    ...filters.value,
    city: searchInputs.value.city || filters.value.city,
    school_name: filters.value.school_name,
    college_name: searchInputs.value.college_name || null,
    major_name: filters.value.major_name
  };
  page.value = 1;
  fetchSchoolList();
}

function handleResetFilters(): void {
  filters.value = {
    city: null,
    school_name: null,
    college_name: null,
    major_name: null,
    sort_by: 'school_name',
    order: 'asc'
  };
  searchInputs.value = {
    city: '',
    school_name: '',
    college_name: '',
    major_name: ''
  };
  filteredSchools.value = schools.value;
  filteredMajors.value = majors.value;
  page.value = 1;
  fetchSchoolList();
}

function handleSortChange(sortBy: string): void {
  if (filters.value.sort_by === sortBy) {
    filters.value.order = filters.value.order === 'asc' ? 'desc' : 'asc';
  } else {
    filters.value.sort_by = sortBy;
    filters.value.order = 'asc';
  }
  fetchSchoolList();
}

function handleViewSchool(school: SchoolInfoResponse): void {
  selectedSchoolId.value = school.id;
  fetchSchoolDetail(school.id);
}

async function fetchSchoolDetail(schoolId: string): Promise<void> {
  isDetailLoading.value = true;
  try {
    const data = await schoolApi.getById(props.token, schoolId);
    schoolDetail.value = data;
    // Initialize form state
    formState.value = {
      cutoff_score: data.cutoff_score || '',
      contact_phone: data.contact_phone || '',
      supervisor_name: data.supervisor_name || '',
      supervisor_contact: data.supervisor_contact || '',
      email_status: data.email_status || 0
    };
    showDetailDialog.value = true;
    isEditing.value = false;
  } catch (err: unknown) {
    console.error('Failed to fetch school detail:', err);
  } finally {
    isDetailLoading.value = false;
  }
}

function closeDetailDialog(): void {
  showDetailDialog.value = false;
  schoolDetail.value = null;
  selectedSchoolId.value = null;
  isEditing.value = false;
}

function startEditing(): void {
  isEditing.value = true;
}

function cancelEditing(): void {
  if (schoolDetail.value) {
    formState.value = {
      cutoff_score: schoolDetail.value.cutoff_score || '',
      contact_phone: schoolDetail.value.contact_phone || '',
      supervisor_name: schoolDetail.value.supervisor_name || '',
      supervisor_contact: schoolDetail.value.supervisor_contact || '',
      email_status: schoolDetail.value.email_status || 0
    };
  }
  isEditing.value = false;
}

async function saveProgress(): Promise<void> {
  if (!selectedSchoolId.value) return;
  
  isSaving.value = true;
  try {
    const updatedData = await schoolApi.updateProgress(props.token, selectedSchoolId.value, {
      cutoff_score: formState.value.cutoff_score || null,
      contact_phone: formState.value.contact_phone || null,
      supervisor_name: formState.value.supervisor_name || null,
      supervisor_contact: formState.value.supervisor_contact || null,
      email_status: formState.value.email_status
    });
    
    schoolDetail.value = updatedData;
    isEditing.value = false;
    
    // Show success message
    alert('Progress saved successfully!');
  } catch (err: unknown) {
    console.error('Failed to save progress:', err);
    alert('Failed to save progress. Please try again.');
  } finally {
    isSaving.value = false;
  }
}

// ==========================================
// CURL RUNNER FUNCTIONS
// ==========================================

function openCurlDialog(): void {
  showCurlDialog.value = true;
  curlCommand.value = '';
  curlResult.value = null;
  curlError.value = null;
}

function closeCurlDialog(): void {
  showCurlDialog.value = false;
  curlCommand.value = '';
  curlResult.value = null;
  curlError.value = null;
}

function parseCurlCommand(curl: string): { method: string; url: string; headers: Record<string, string>; body?: unknown } {
  const normalized = curl.replace(/\\\n/g, ' ').replace(/\\n/g, ' ').replace(/\s+/g, ' ').trim();
  
  const methodMatch = normalized.match(/-X\s+(\w+)/);
  const method = methodMatch?.[1] ?? 'GET';
  
  const urlMatch = normalized.match(/["']?(https?:\/\/[^"'\s]+)["']?/);
  let url = urlMatch?.[1] ?? '';
  
  if (url.includes('localhost:8000')) {
    url = url.replace('localhost:8000', API_BASE_URL);
  }
  
  const headers: Record<string, string> = {};
  const headerRegex = /-H\s+["']([^"']+):([^"']+)["']/g;
  let headerMatch: RegExpExecArray | null;
  while ((headerMatch = headerRegex.exec(normalized)) !== null) {
    const key = headerMatch[1]?.trim();
    const value = headerMatch[2]?.trim();
    if (key && value) {
      headers[key] = value;
    }
  }
  
  let body: unknown;
  const bodyMatch = normalized.match(/-d\s+["'](.+)["']/);
  if (bodyMatch && bodyMatch[1]) {
    try {
      body = JSON.parse(bodyMatch[1]);
    } catch {
      body = bodyMatch[1];
    }
  }
  
  return { method, url, headers, body };
}

async function executeFetchCurl(): Promise<void> {
  if (!curlCommand.value.trim()) {
    curlError.value = t('curl.error.empty');
    return;
  }
  
  isCurlLoading.value = true;
  curlError.value = null;
  curlResult.value = null;
  
  try {
    const parsed = parseCurlCommand(curlCommand.value);
    
    if (!parsed.url) {
      curlError.value = t('curl.error.invalidUrl');
      isCurlLoading.value = false;
      return;
    }
    
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(parsed.headers)) {
      if (key === 'Authorization' && value.includes('YOUR_TOKEN')) {
        headers[key] = `Bearer ${props.token}`;
      } else {
        headers[key] = value;
      }
    }
    
    if (!headers['Authorization']) {
      headers['Authorization'] = `Bearer ${props.token}`;
    }
    
    const fetchOptions: RequestInit = {
      method: parsed.method,
      headers
    };
    
    if (parsed.body !== undefined && parsed.method !== 'GET' && parsed.method !== 'HEAD') {
      if (typeof parsed.body === 'object') {
        fetchOptions.body = JSON.stringify(parsed.body);
      } else {
        fetchOptions.body = String(parsed.body);
      }
    }
    
    const response = await fetch(parsed.url, fetchOptions);
    
    if (response.status === 204) {
      curlResult.value = { success: true, message: t('curl.success.noContent') };
    } else {
      try {
        curlResult.value = await response.json();
      } catch {
        curlResult.value = await response.text();
      }
    }
    
    if (!response.ok) {
      curlError.value = typeof curlResult.value === 'object'
        ? JSON.stringify(curlResult.value, null, 2)
        : String(curlResult.value);
    }
  } catch (err: unknown) {
    curlError.value = err instanceof Error ? err.message : t('curl.error.unknown');
    console.error('Curl execution failed:', err);
  } finally {
    isCurlLoading.value = false;
  }
}

function useTemplate(template: string): void {
  curlCommand.value = template;
}

// ==========================================
// FILTER FUNCTIONS
// ==========================================

function filterSchools(query: string): void {
  searchInputs.value.school_name = query;
  if (!query) {
    filteredSchools.value = schools.value;
    filters.value.school_name = null;
  } else {
    filteredSchools.value = schools.value.filter(school =>
      school.toLowerCase().includes(query.toLowerCase())
    );
    filters.value.school_name = null;
  }
}

function filterMajors(query: string): void {
  searchInputs.value.major_name = query;
  if (!query) {
    filteredMajors.value = majors.value;
    filters.value.major_name = null;
  } else {
    filteredMajors.value = majors.value.filter(major =>
      major.toLowerCase().includes(query.toLowerCase())
    );
    filters.value.major_name = null;
  }
}

function selectSchool(school: string): void {
  filters.value.school_name = school;
  searchInputs.value.school_name = school;
  // Reload majors when school changes
  fetchMajors();
}

function selectMajor(major: string): void {
  filters.value.major_name = major;
  searchInputs.value.major_name = major;
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  fetchCities();
  fetchSchools();
  fetchMajors();
  fetchSchoolList();
});

// Watch for filter changes - reload options when city changes
watch(
  () => filters.value.city,
  (newCity, oldCity) => {
    if (newCity !== oldCity && newCity) {
      // Reload schools and majors when city changes
      fetchSchools();
      fetchMajors();
    } else if (newCity !== oldCity && !newCity) {
      // City cleared, reload all
      fetchSchools();
      fetchMajors();
    }
  }
);

// Reload school list when filters change
watch(filters, () => {
  page.value = 1;
  fetchSchoolList();
}, { deep: true });

// ==========================================
// COMPUTED
// ==========================================

function getSortIcon(sortBy: string): string {
  if (filters.value.sort_by !== sortBy) return '↕';
  return filters.value.order === 'asc' ? '↑' : '↓';
}
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('school.title') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('school.description') }}</p>
      </div>
      <div class="flex gap-2">
        <el-button
          type="success"
          size="default"
          @click="openFetchDialog"
          class="bg-green-600 hover:bg-green-700"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
            </svg>
          </template>
          {{ t('curl.fetchData') }}
        </el-button>
        <el-button
          type="primary"
          size="default"
          @click="openCurlDialog"
          class="bg-indigo-600 hover:bg-indigo-700"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path>
            </svg>
          </template>
          {{ t('curl.customFetch') }}
        </el-button>
      </div>
    </div>

    <!-- Filters -->
    <div class="bg-white rounded-xl shadow-sm p-4 mb-6">
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <!-- City Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">{{ t('school.filters.city') }}</label>
          <el-select
            v-model="filters.city"
            :placeholder="t('school.filters.all')"
            class="w-full"
            size="default"
            clearable
            :loading="isCitiesLoading"
          >
            <el-option
              v-for="city in cities"
              :key="city"
              :label="city"
              :value="city"
            />
          </el-select>
        </div>

        <!-- School Name Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">{{ t('school.filters.schoolName') }}</label>
          <el-select
            v-model="filters.school_name"
            filterable
            remote
            :remote-method="filterSchools"
            :placeholder="t('school.filters.schoolName')"
            class="w-full"
            size="default"
            clearable
            :loading="isSchoolsLoading"
            @change="selectSchool"
          >
            <el-option
              v-for="school in filteredSchools"
              :key="school"
              :label="school"
              :value="school"
            />
          </el-select>
        </div>

        <!-- College Name Search -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">{{ t('school.filters.collegeName') }}</label>
          <el-input
            v-model="searchInputs.college_name"
            :placeholder="t('school.filters.collegeName')"
            size="default"
            clearable
            @keyup.enter="handleApplyFilters"
          />
        </div>

        <!-- Major Name Filter -->
        <div>
          <label class="block text-xs font-medium text-gray-600 mb-1">{{ t('school.filters.majorName') }}</label>
          <el-select
            v-model="filters.major_name"
            filterable
            remote
            :remote-method="filterMajors"
            :placeholder="t('school.filters.majorName')"
            class="w-full"
            size="default"
            clearable
            :loading="isMajorsLoading"
            @change="selectMajor"
          >
            <el-option
              v-for="major in filteredMajors"
              :key="major"
              :label="major"
              :value="major"
            />
          </el-select>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-end gap-2">
          <el-button
            type="primary"
            size="default"
            @click="handleApplyFilters"
            class="flex-1"
          >
            {{ t('common.search') }}
          </el-button>
          <el-button
            size="default"
            @click="handleResetFilters"
          >
            {{ t('common.reset') }}
          </el-button>
        </div>
      </div>
    </div>

    <!-- Error Alert -->
    <el-alert
      v-if="error"
      :title="error"
      type="error"
      show-icon
      class="mb-4"
      @close="error = null"
    />

    <!-- Schools Table -->
    <div class="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
      <div class="overflow-auto flex-1">
        <table class="w-full">
          <thead class="bg-gray-50 sticky top-0 z-10">
            <tr>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="handleSortChange('school_name')">
                <div class="flex items-center gap-1">
                  {{ t('school.table.school') }}
                  <span class="text-gray-400">{{ getSortIcon('school_name') }}</span>
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="handleSortChange('college_name')">
                <div class="flex items-center gap-1">
                  {{ t('school.table.college') }}
                  <span class="text-gray-400">{{ getSortIcon('college_name') }}</span>
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100" @click="handleSortChange('major_name')">
                <div class="flex items-center gap-1">
                  {{ t('school.table.major') }}
                  <span class="text-gray-400">{{ getSortIcon('major_name') }}</span>
                </div>
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('school.table.direction') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('school.table.cutoffScore') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('school.table.city') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('common.actions') }}
              </th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-100">
            <tr v-if="isLoading" class="animate-pulse">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                <div class="flex items-center justify-center gap-2">
                  <div class="w-5 h-5 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
                  {{ t('common.loading') }}
                </div>
              </td>
            </tr>
            <tr v-else-if="schoolsData.length === 0" class="hover:bg-gray-50">
              <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                {{ t('common.noData') }}
              </td>
            </tr>
            <tr
              v-else
              v-for="school in schoolsData"
              :key="school.id"
              class="hover:bg-indigo-50 cursor-pointer transition-colors"
              @click="handleViewSchool(school)"
            >
              <td class="px-4 py-3">
                <div class="font-medium text-gray-900">{{ school.school_name }}</div>
                <div class="text-xs text-gray-500">{{ school.school_code }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-gray-700">{{ school.college_name }}</div>
                <div class="text-xs text-gray-500">{{ school.college_code }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-gray-700">{{ school.major_name }}</div>
                <div class="text-xs text-gray-500">{{ school.major_code }}</div>
              </td>
              <td class="px-4 py-3">
                <div class="text-gray-700">{{ school.direction_name || '-' }}</div>
                <div class="text-xs text-gray-500">{{ school.direction_code || '' }}</div>
              </td>
              <td class="px-4 py-3">
                <span v-if="school.cutoff_score" class="text-sm font-medium text-gray-900">
                  {{ school.cutoff_score }}
                </span>
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
              <td class="px-4 py-3">
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {{ school.city }}
                </span>
              </td>
              <td class="px-4 py-3">
                <el-button
                  type="primary"
                  size="small"
                  @click.stop="handleViewSchool(school)"
                >
                  {{ t('common.view') }}
                </el-button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Pagination -->
      <div class="border-t border-gray-200 px-4 py-3 flex items-center justify-between bg-gray-50">
        <div class="text-sm text-gray-600">
          <span>{{ t('pagination.total').replace('{total}', total.toString()) }}</span>
          <span class="mx-2">|</span>
          <span>{{ t('pagination.currentPage').replace('{current}', page.toString()).replace('{pages}', totalPages.toString()) }}</span>
          <span class="mx-2">|</span>
          <span>{{ t('pagination.pageSizeLabel').replace('{size}', pageSize.toString()) }}</span>
        </div>
        <div>
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            :page-sizes="[10, 20, 50, 100]"
            layout="total, sizes, prev, pager, next, jumper"
            @size-change="handlePageSizeChange"
            @current-change="handlePageChange"
          />
        </div>
      </div>
    </div>

    <!-- School Detail Dialog -->
    <el-dialog
      v-model="showDetailDialog"
      :title="t('school.detail.title')"
      width="900px"
      :close-on-click-modal="false"
    >
      <!-- Header with Edit/Save buttons -->
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold text-gray-800">{{ t('school.detail.progressInfo') }}</h3>
        <div class="flex gap-2" v-if="!isDetailLoading">
          <el-button
            v-if="!isEditing"
            type="primary"
            size="small"
            @click="startEditing"
          >
            {{ t('common.edit') }}
          </el-button>
          <template v-else>
            <el-button
              size="small"
              @click="cancelEditing"
              :disabled="isSaving"
            >
              {{ t('common.cancel') }}
            </el-button>
            <el-button
              type="primary"
              size="small"
              @click="saveProgress"
              :loading="isSaving"
            >
              {{ t('common.save') }}
            </el-button>
          </template>
        </div>
      </div>

      <div v-if="isDetailLoading" class="flex justify-center items-center py-12">
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="schoolDetail" class="grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Basic Information -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <h4 class="text-lg font-semibold text-gray-800 mb-3">{{ t('school.detail.basicInfo') }}</h4>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.schoolName') }}</dt>
              <dd class="text-gray-900 font-medium">{{ schoolDetail.school_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.schoolCode') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.school_code }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.college') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.college_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.collegeCode') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.college_code }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.major') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.major_name }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.majorCode') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.major_code }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.direction') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.direction_name || '-' }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.directionCode') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.direction_code || '-' }}</dd>
            </div>
          </dl>
        </div>

        <!-- Location & Status -->
        <div class="border rounded-lg p-4 bg-gray-50">
          <h4 class="text-lg font-semibold text-gray-800 mb-3">{{ t('school.detail.location') }}</h4>
          <dl class="space-y-2 text-sm">
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.city') }}</dt>
              <dd class="text-gray-900">
                <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">
                  {{ schoolDetail.city }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.region') }}</dt>
              <dd class="text-gray-900">
                {{ schoolDetail.region === 1 ? t('school.region.1') : schoolDetail.region === 2 ? t('school.region.2') : t('school.region.3') }}
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.emailStatus') }}</dt>
              <dd class="text-gray-900">
                <span :class="{
                  'bg-green-100 text-green-800': schoolDetail.email_status === 1,
                  'bg-yellow-100 text-yellow-800': schoolDetail.email_status === 0,
                  'bg-red-100 text-red-800': schoolDetail.email_status === 2
                }" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                  {{ schoolDetail.email_status === 1 ? t('school.status.completed') : schoolDetail.email_status === 0 ? t('school.status.pending') : t('school.status.failed') }}
                </span>
              </dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-gray-600">{{ t('school.detail.adjustmentCount') }}</dt>
              <dd class="text-gray-900">{{ schoolDetail.adjustment_count }}</dd>
            </div>
          </dl>
        </div>

        <!-- Progress Information -->
        <div class="border rounded-lg p-4 bg-gray-50 md:col-span-2">
          <h4 class="text-lg font-semibold text-gray-800 mb-3">{{ t('school.detail.progressInfo') }}</h4>
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
                {{ schoolDetail.cutoff_score || '-' }}
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
                {{ schoolDetail.contact_phone || '-' }}
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
                {{ schoolDetail.supervisor_name || '-' }}
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
                {{ schoolDetail.supervisor_contact || '-' }}
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
                <el-option :label="t('school.status.pending')" :value="0" />
                <el-option :label="t('school.status.completed')" :value="1" />
                <el-option :label="t('school.status.failed')" :value="2" />
              </el-select>
              <div v-else>
                <span :class="{
                  'bg-green-100 text-green-800': schoolDetail.email_status === 1,
                  'bg-yellow-100 text-yellow-800': schoolDetail.email_status === 0,
                  'bg-red-100 text-red-800': schoolDetail.email_status === 2
                }" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                  {{ schoolDetail.email_status === 1 ? t('school.status.completed') : schoolDetail.email_status === 0 ? t('school.status.pending') : t('school.status.failed') }}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="closeDetailDialog">
          {{ t('common.close') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Fetch Task Dialog -->
    <el-dialog
      v-model="showFetchDialog"
      :title="t('curl.fetchDataTitle')"
      width="700px"
      :close-on-click-modal="false"
    >
      <SchoolDataFetch
        :token="props.token"
        @refresh="handleFetchComplete"
        @close="closeFetchDialog"
      />
    </el-dialog>

    <!-- Curl Runner Dialog -->
    <el-dialog
      v-model="showCurlDialog"
      :title="t('curl.title')"
      width="800px"
      :close-on-click-modal="false"
    >
      <!-- Quick Templates -->
      <div class="mb-4">
        <h4 class="text-sm font-semibold text-gray-700 mb-2">{{ t('curl.quickTemplates') }}</h4>
        <div class="flex flex-wrap gap-2">
          <el-button size="small" @click="useTemplate(curlTemplates.fetch)">
            🔄 {{ t('curl.endpoints.fetchData') }}
          </el-button>
          <el-button size="small" @click="useTemplate(curlTemplates.list)">
            📚 {{ t('curl.endpoints.schoolList') }}
          </el-button>
          <el-button size="small" @click="useTemplate(curlTemplates.update)">
            ✏️ {{ t('curl.endpoints.schoolUpdate') }}
          </el-button>
        </div>
      </div>

      <!-- Curl Input -->
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('curl.curlCommand') }}
        </label>
        <el-input
          v-model="curlCommand"
          :placeholder="t('curl.placeholder')"
          type="textarea"
          :rows="6"
          class="font-mono text-sm"
        />
      </div>

      <!-- Action Buttons -->
      <div class="flex gap-3 mb-4">
        <el-button
          type="primary"
          @click="executeFetchCurl"
          :loading="isCurlLoading"
          class="flex-1"
        >
          {{ t('curl.execute') }}
        </el-button>
        <el-button @click="curlCommand = ''; curlResult = null; curlError = null">
          {{ t('common.clear') }}
        </el-button>
      </div>

      <!-- Loading State -->
      <div v-if="isCurlLoading" class="text-center py-4">
        <div class="w-6 h-6 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
        <p class="text-gray-500 text-sm">{{ t('common.loading') }}</p>
      </div>

      <!-- Error Result -->
      <div v-if="curlError && !curlResult" class="mb-4">
        <el-alert
          :title="t('common.error')"
          type="error"
          show-icon
          class="mb-2"
          @close="curlError = null"
        />
        <pre class="bg-red-50 border border-red-200 rounded-lg p-3 text-sm text-red-800 overflow-auto max-h-48">{{ curlError }}</pre>
      </div>

      <!-- Success Result -->
      <div v-if="curlResult" class="mb-4">
        <el-alert
          :title="curlError ? t('common.error') : t('common.success')"
          :type="curlError ? 'error' : 'success'"
          show-icon
          class="mb-2"
          @close="curlResult = null"
        />
        <pre
          :class="curlError ? 'bg-red-50 text-red-800 border-red-200' : 'bg-green-50 text-green-800 border-green-200'"
          class="border rounded-lg p-3 text-sm overflow-auto max-h-64"
        >{{ typeof curlResult === 'string' ? curlResult : JSON.stringify(curlResult, null, 2) }}</pre>
      </div>

      <template #footer>
        <el-button @click="closeCurlDialog">
          {{ t('common.close') }}
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
/* Custom scrollbar for table */
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
