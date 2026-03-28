<!-- src/components/ProfileView.vue -->
<script setup lang="ts">
import { ref, computed, onMounted } from 'vue';
import type { UserResponse, UserUpdate } from '../types';
import { GENDER_OPTIONS } from '../types';
import { userApi, bioApi } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from '../i18n';
import BioMarkdownRenderer from './BioMarkdownRenderer.vue';
import MarkdownRenderer from './MarkdownRenderer.vue';

const { t } = useI18n();

const props = defineProps<{
  user: UserResponse;
}>();

const emit = defineEmits<{
  (e: 'user-updated', user: UserResponse): void;
}>();

// Profile editing state
const isEditing = ref<boolean>(false);
const isSaving = ref<boolean>(false);

const editForm = ref<UserUpdate>({
  name: props.user.name,
  phone: props.user.phone || undefined,
  gender: props.user.gender || undefined
});

// Bio state
const bioContent = ref<string | null>(null);
const isLoadingBio = ref<boolean>(false);
const isUploadingBio = ref<boolean>(false);
const isDeletingBio = ref<boolean>(false);
const showUploadDialog = ref<boolean>(false);
const selectedBioFile = ref<File | null>(null);
const bioTemplate = ref<string>('');

const genderLabel = computed(() => {
  const gender = GENDER_OPTIONS.find(g => g.value === props.user.gender);
  return gender ? t(`auth.${gender.label.toLowerCase() as 'unknown' | 'male' | 'female'}`) : t('auth.genderUnknown');
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// ==========================================
// BIO FUNCTIONS
// ==========================================

async function fetchBio(): Promise<void> {
  isLoadingBio.value = true;
  const token = localStorage.getItem('access_token');
  if (!token) {
    isLoadingBio.value = false;
    return;
  }

  try {
    const content = await bioApi.getBio(token);
    bioContent.value = content;
  } catch (error: unknown) {
    // 404 means no bio exists, which is fine
    if (error instanceof Error && error.message.includes('404')) {
      bioContent.value = null;
    } else {
      console.error('Failed to fetch bio:', error);
    }
  } finally {
    isLoadingBio.value = false;
  }
}

async function uploadBio(): Promise<void> {
  if (!selectedBioFile.value) {
    ElMessage.warning('Please select a markdown file first');
    return;
  }

  // Check file extension
  const validExtensions = ['.md', '.markdown'];
  const fileExtension = '.' + selectedBioFile.value.name.split('.').pop()?.toLowerCase();
  if (!validExtensions.includes(fileExtension)) {
    ElMessage.error('Please select a valid markdown file (.md or .markdown)');
    return;
  }

  // Check file size (max 1MB)
  const maxSize = 1 * 1024 * 1024;
  if (selectedBioFile.value.size > maxSize) {
    ElMessage.error('File size must be less than 1MB');
    return;
  }

  isUploadingBio.value = true;
  const token = localStorage.getItem('access_token');
  if (!token) {
    isUploadingBio.value = false;
    ElMessage.error('No authentication token found');
    return;
  }

  try {
    await bioApi.uploadBio(token, selectedBioFile.value);
    ElMessage.success('Bio uploaded successfully!');
    await fetchBio();
    showUploadDialog.value = false;
    selectedBioFile.value = null;
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to upload bio');
  } finally {
    isUploadingBio.value = false;
  }
}

async function deleteBio(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      'Are you sure you want to delete your bio? This action cannot be undone.',
      'Delete Bio',
      { confirmButtonText: 'Delete', cancelButtonText: 'Cancel', type: 'warning' }
    );

    isDeletingBio.value = true;
    const token = localStorage.getItem('access_token');
    if (!token) {
      isDeletingBio.value = false;
      ElMessage.error('No authentication token found');
      return;
    }

    await bioApi.deleteBio(token);
    ElMessage.success('Bio deleted successfully!');
    bioContent.value = null;
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : 'Failed to delete bio');
    }
  } finally {
    isDeletingBio.value = false;
  }
}

function onBioFileChange(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    selectedBioFile.value = target.files[0] as File;
  }
}

function openUploadDialog(): void {
  selectedBioFile.value = null;
  showUploadDialog.value = true;
}

function useTemplate(): void {
  bioTemplate.value = `# Hello, I'm {{name}}

## Contact Information
- **Email:** {{email}}
- **Phone:** {{phone}}
- **Gender:** {{gender}}

## About Me
Welcome to my profile! I'm excited to connect with you.

## Skills
- Skill 1
- Skill 2
- Skill 3

## Interests
- Interest 1
- Interest 2

---
*Member since {{created_at}}*
`;
}

// ==========================================
// PROFILE FUNCTIONS
// ==========================================

async function toggleEdit(): Promise<void> {
  if (isEditing.value) {
    editForm.value = {
      name: props.user.name,
      phone: props.user.phone || undefined,
      gender: props.user.gender || undefined
    };
    isEditing.value = false;
  } else {
    isEditing.value = true;
  }
}

async function saveProfile(): Promise<void> {
  if (!editForm.value.name || editForm.value.name.trim() === '') {
    ElMessage.warning(t('messages.saveFailed'));
    return;
  }

  isSaving.value = true;
  try {
    const token = localStorage.getItem('access_token');
    if (!token) throw new Error('No authentication token found');

    const updatedUser = await userApi.updateCurrentUser(token, {
      name: editForm.value.name || undefined,
      phone: editForm.value.phone || undefined,
      gender: editForm.value.gender
    });
    emit('user-updated', updatedUser);
    isEditing.value = false;
    ElMessage.success(t('messages.saveSuccess'));
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : t('messages.saveFailed'));
  } finally {
    isSaving.value = false;
  }
}

// Lifecycle
onMounted(() => {
  fetchBio();
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">{{ t('profile.title') }}</h2>
        <p class="text-gray-500 text-sm mt-1">{{ t('profile.subtitle', 'Manage your account information') }}</p>
      </div>
      <el-button
        v-if="!isEditing"
        type="primary"
        @click="toggleEdit"
        class="shadow-sm"
      >
        <template #icon>
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
          </svg>
        </template>
        {{ t('profile.editProfile') }}
      </el-button>
      <div v-else class="flex gap-2">
        <el-button @click="toggleEdit">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" :loading="isSaving" @click="saveProfile">{{ t('profile.saveChanges') }}</el-button>
      </div>
    </div>

    <!-- Bio Section (shown first if exists) -->
    <el-card v-if="bioContent" class="shadow-lg border-0 mb-6" body-class="p-0">
      <div class="border-b border-gray-100 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 flex items-center justify-between">
        <h3 class="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
          </svg>
          About Me
        </h3>
        <div class="flex gap-2">
          <el-button size="small" text @click="openUploadDialog">
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2V9a2 2 0 00-2-2h-3.172a1 1 0 01-.707-.293L9.414 8.293a1 1 0 01-.293-.707V5.707a1 1 0 01.293-.707l2.828-2.828a1 1 0 01.707-.293H15a2 2 0 002-2z"></path>
              </svg>
            </template>
            Update
          </el-button>
          <el-button
            size="small"
            text
            type="danger"
            :loading="isDeletingBio"
            @click="deleteBio"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
              </svg>
            </template>
            Delete
          </el-button>
        </div>
      </div>
      <div class="p-6">
        <BioMarkdownRenderer :content="bioContent" :user="user" />
      </div>
    </el-card>

    <!-- Bio Upload Card (shown if no bio exists) -->
    <el-card v-else-if="!isLoadingBio" class="shadow-lg border-0 mb-6" body-class="p-0">
      <div class="p-6 text-center">
        <svg class="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
        </svg>
        <h3 class="text-lg font-semibold text-gray-900 mb-2">Create Your Bio</h3>
        <p class="text-gray-500 text-sm mb-4">Upload a markdown file to create your self-introduction. Your profile information will be automatically filled in.</p>
        <div class="flex justify-center gap-3">
          <el-button type="primary" @click="openUploadDialog">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
              </svg>
            </template>
            Upload Markdown File
          </el-button>
          <el-button @click="useTemplate">
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
              </svg>
            </template>
            Use Template
          </el-button>
        </div>
        <!-- Template Preview -->
        <div v-if="bioTemplate" class="mt-4 text-left">
          <h4 class="text-sm font-medium text-gray-700 mb-2">Template Preview:</h4>
          <div class="border border-gray-200 rounded-md p-4 bg-gray-50 max-h-60 overflow-y-auto">
            <MarkdownRenderer :content="bioTemplate" content-type="markdown" />
          </div>
          <p class="text-xs text-gray-500 mt-2">
            Available variables: <code v-text="'{{name}}'" />, <code v-text="'{{email}}'" />, <code v-text="'{{phone}}'" />, 
            <code v-text="'{{gender}}'" />, <code v-text="'{{user_id}}'" />, <code v-text="'{{created_at}}'" />
          </p>
        </div>
      </div>
    </el-card>

    <!-- Loading State for Bio -->
    <el-card v-if="isLoadingBio" class="shadow-lg border-0 mb-6" body-class="p-6">
      <el-skeleton :rows="3" animated />
    </el-card>

    <!-- Profile Card -->
    <el-card class="shadow-lg border-0" body-class="p-0">
      <!-- Cover Image -->
      <div class="h-32 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 rounded-t-lg"></div>

      <div class="px-8 pb-8">
        <!-- Avatar -->
        <div class="relative -mt-16 mb-6">
          <div class="w-32 h-32 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-full shadow-xl flex items-center justify-center text-white text-4xl font-bold border-4 border-white">
            {{ user.name.charAt(0).toUpperCase() }}
          </div>
        </div>

        <!-- Profile Information -->
        <el-descriptions :column="2" border class="mt-6">
          <el-descriptions-item :label="t('profile.userId', 'User ID')" label-class-name="font-semibold">
            <span class="text-gray-700">#{{ user.user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('profile.memberSince')" label-class-name="font-semibold">
            <span class="text-gray-700">{{ formatDate(user.created_at) }}</span>
          </el-descriptions-item>
          <el-descriptions-item :label="t('auth.email')" label-class-name="font-semibold" :span="2">
            <div v-if="!isEditing" class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="text-gray-700">{{ user.email }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item :label="t('auth.name')" label-class-name="font-semibold">
            <div v-if="!isEditing">
              <span class="text-gray-700">{{ user.name }}</span>
            </div>
            <el-input v-else v-model="editForm.name" :placeholder="t('auth.name')" />
          </el-descriptions-item>
          <el-descriptions-item :label="t('auth.gender')" label-class-name="font-semibold">
            <div v-if="!isEditing">
              <el-tag :type="user.gender === 1 ? 'success' : user.gender === 2 ? 'danger' : 'info'" size="small">
                {{ genderLabel }}
              </el-tag>
            </div>
            <el-select v-else v-model="editForm.gender" class="w-full">
              <el-option
                v-for="option in GENDER_OPTIONS"
                :key="option.value"
                :label="t(`auth.gender${option.label.toLowerCase()}`)"
                :value="option.value"
              />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item :label="t('auth.phone')" label-class-name="font-semibold">
            <div v-if="!isEditing" class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"></path>
              </svg>
              <span class="text-gray-700">{{ user.phone || '-' }}</span>
            </div>
            <el-input v-else v-model="editForm.phone" :placeholder="t('auth.phone')" />
          </el-descriptions-item>
        </el-descriptions>
      </div>
    </el-card>

    <!-- Upload Bio Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      title="Upload Bio Markdown"
      width="500px"
    >
      <div class="space-y-4">
        <el-alert
          title="Bio Template Variables"
          type="info"
          :closable="false"
        >
          <p class="text-sm">Your markdown file can include these variables that will be automatically replaced:</p>
          <div class="grid grid-cols-2 gap-2 mt-2 text-xs font-mono">
            <span><code v-text="'{{name}}'" /> - Your name</span>
            <span><code v-text="'{{email}}'" /> - Your email</span>
            <span><code v-text="'{{phone}}'" /> - Your phone</span>
            <span><code v-text="'{{gender}}'" /> - Your gender</span>
            <span><code v-text="'{{user_id}}'" /> - Your user ID</span>
            <span><code v-text="'{{created_at}}'" /> - Registration date</span>
          </div>
        </el-alert>

        <!-- Drop Zone -->
        <div
          class="border-2 border-dashed rounded-xl p-8 text-center transition-colors"
          :class="selectedBioFile ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'"
        >
          <svg class="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
            <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" />
          </svg>
          <div class="mt-4 flex text-sm text-gray-600 justify-center">
            <label for="bio-file-upload" class="relative cursor-pointer bg-white rounded-md font-medium text-indigo-600 hover:text-indigo-500">
              <span>Upload a markdown file</span>
              <input
                id="bio-file-upload"
                name="bio-file-upload"
                type="file"
                class="sr-only"
                accept=".md,.markdown"
                @change="onBioFileChange"
              />
            </label>
          </div>
          <p class="text-xs text-gray-500 mt-2">Markdown files (.md, .markdown) up to 1MB</p>
        </div>

        <!-- Selected File -->
        <div v-if="selectedBioFile" class="p-3 bg-indigo-50 rounded-lg flex justify-between items-center">
          <div class="flex items-center gap-3">
            <svg class="w-8 h-8 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
            </svg>
            <div>
              <div class="font-medium text-indigo-900">{{ selectedBioFile.name }}</div>
              <div class="text-xs text-indigo-600">{{ (selectedBioFile.size / 1024).toFixed(2) }} KB</div>
            </div>
          </div>
        </div>
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">Cancel</el-button>
        <el-button
          type="primary"
          :loading="isUploadingBio"
          :disabled="!selectedBioFile"
          @click="uploadBio"
        >
          Upload Bio
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-descriptions__label) {
  width: 180px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-dialog) {
  border-radius: 12px;
  overflow: hidden;
}
</style>
