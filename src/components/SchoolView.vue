<!-- src/components/SchoolView.vue -->
<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import type { SchoolInfoResponse, SchoolInfoListParams } from '../types';
import { schoolApi } from '../utils/api';
import { useI18n } from '../i18n';

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

// Cities for dropdown
const cities = ref<string[]>([]);
const schools = ref<string[]>([]);
const majors = ref<string[]>([]);
const isCitiesLoading = ref(false);
const isSchoolsLoading = ref(false);
const isMajorsLoading = ref(false);

// Search input temporary state
const searchInputs = ref({
  school_name: '',
  college_name: '',
  major_name: ''
});

// ==========================================
// DATA FETCHING
// ==========================================

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
    const data = await schoolApi.getSchools(props.token, filters.value.city);
    schools.value = data.schools || [];
    
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
    const data = await schoolApi.getMajors(props.token, filters.value.school_name);
    majors.value = data.majors || [];
    
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
    school_name: searchInputs.value.school_name || null,
    college_name: searchInputs.value.college_name || null,
    major_name: searchInputs.value.major_name || null
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
    school_name: '',
    college_name: '',
    major_name: ''
  };
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
  emit('view-school', school.id);
}

// ==========================================
// LIFECYCLE
// ==========================================

onMounted(() => {
  fetchCities();
  fetchSchoolList();
});

// Watch for filter changes - cascade loading
watch(
  () => filters.value.city,
  (newCity, oldCity) => {
    if (newCity !== oldCity) {
      fetchSchools();
      // Reset dependent filters
      filters.value.school_name = null;
      filters.value.major_name = null;
      searchInputs.value.school_name = '';
      searchInputs.value.major_name = '';
    }
  }
);

watch(
  () => filters.value.school_name,
  (newSchool, oldSchool) => {
    if (newSchool !== oldSchool) {
      fetchMajors();
      // Reset dependent filter
      filters.value.major_name = null;
      searchInputs.value.major_name = '';
    }
  }
);

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
    <div class="mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ t('school.title') }}</h2>
      <p class="text-sm text-gray-500 mt-1">{{ t('school.description') }}</p>
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
            :placeholder="t('school.filters.all')"
            class="w-full"
            size="default"
            clearable
            :loading="isSchoolsLoading"
            :disabled="!filters.city"
          >
            <el-option
              v-for="school in schools"
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
            :placeholder="t('school.filters.all')"
            class="w-full"
            size="default"
            clearable
            :loading="isMajorsLoading"
            :disabled="!filters.school_name"
          >
            <el-option
              v-for="major in majors"
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
                {{ t('school.table.city') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('school.table.cutoffScore') }}
              </th>
              <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                {{ t('school.table.status') }}
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
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                  {{ school.city }}
                </span>
              </td>
              <td class="px-4 py-3">
                <span v-if="school.cutoff_score" class="text-sm font-medium text-gray-900">
                  {{ school.cutoff_score }}
                </span>
                <span v-else class="text-xs text-gray-400">-</span>
              </td>
              <td class="px-4 py-3">
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
          {{ t('pagination.total', { total }) }}
        </div>
        <div class="flex items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm text-gray-600">{{ t('pagination.pageSize') }}:</span>
            <el-select v-model="pageSize" size="small" @change="handlePageSizeChange" class="w-24">
              <el-option :label="10" :value="10" />
              <el-option :label="20" :value="20" />
              <el-option :label="50" :value="50" />
              <el-option :label="100" :value="100" />
            </el-select>
          </div>
          <el-pagination
            :current-page="page"
            :page-size="pageSize"
            :total="total"
            layout="prev, pager, next"
            @change="handlePageChange"
          />
        </div>
      </div>
    </div>
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
