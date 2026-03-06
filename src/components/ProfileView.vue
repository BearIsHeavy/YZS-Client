<!-- src/components/ProfileView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UserResponse, UserUpdate } from '../types';
import { GENDER_OPTIONS } from '../types';
import { userApi } from '../utils/api';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  user: UserResponse;
}>();

const emit = defineEmits<{
  (e: 'user-updated', user: UserResponse): void;
}>();

const isEditing = ref<boolean>(false);
const isSaving = ref<boolean>(false);

const editForm = ref<UserUpdate>({
  name: props.user.name,
  phone: props.user.phone || undefined,
  gender: props.user.gender || undefined
});

const genderLabel = computed(() => {
  const gender = GENDER_OPTIONS.find(g => g.value === props.user.gender);
  return gender?.label || 'Unknown';
});

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

async function toggleEdit(): Promise<void> {
  if (isEditing.value) {
    // Cancel editing
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
    ElMessage.warning('Name is required');
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
    ElMessage.success('Profile updated successfully!');
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to update profile');
  } finally {
    isSaving.value = false;
  }
}
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="flex justify-between items-center mb-8">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">Profile Settings</h2>
        <p class="text-gray-500 text-sm mt-1">Manage your account information</p>
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
        Edit Profile
      </el-button>
      <div v-else class="flex gap-2">
        <el-button @click="toggleEdit">Cancel</el-button>
        <el-button type="primary" :loading="isSaving" @click="saveProfile">Save Changes</el-button>
      </div>
    </div>

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
          <el-descriptions-item label="User ID" label-class-name="font-semibold">
            <span class="text-gray-700">#{{ user.user_id }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Account Created" label-class-name="font-semibold">
            <span class="text-gray-700">{{ formatDate(user.created_at) }}</span>
          </el-descriptions-item>
          <el-descriptions-item label="Email Address" label-class-name="font-semibold" :span="2">
            <div v-if="!isEditing" class="flex items-center gap-2">
              <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
              </svg>
              <span class="text-gray-700">{{ user.email }}</span>
            </div>
          </el-descriptions-item>
          <el-descriptions-item label="Full Name" label-class-name="font-semibold">
            <div v-if="!isEditing">
              <span class="text-gray-700">{{ user.name }}</span>
            </div>
            <el-input v-else v-model="editForm.name" placeholder="Enter your name" />
          </el-descriptions-item>
          <el-descriptions-item label="Gender" label-class-name="font-semibold">
            <div v-if="!isEditing">
              <el-tag :type="user.gender === 1 ? 'success' : user.gender === 2 ? 'danger' : 'info'" size="small">
                {{ genderLabel }}
              </el-tag>
            </div>
            <el-select v-else v-model="editForm.gender" class="w-full">
              <el-option 
                v-for="option in GENDER_OPTIONS" 
                :key="option.value" 
                :label="option.label" 
                :value="option.value" 
              />
            </el-select>
          </el-descriptions-item>
          <el-descriptions-item label="Phone Number" label-class-name="font-semibold">
            <div v-if="!isEditing">
              <span v-if="user.phone" class="text-gray-700">{{ user.phone }}</span>
              <span v-else class="text-gray-400 italic">Not provided</span>
            </div>
            <el-input v-else v-model="editForm.phone" placeholder="Enter phone number" clearable />
          </el-descriptions-item>
        </el-descriptions>

        <!-- Stats Section -->
        <div class="mt-8 grid grid-cols-3 gap-4">
          <div class="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-indigo-600">0</div>
            <div class="text-sm text-gray-600 mt-1">Question Banks</div>
          </div>
          <div class="bg-gradient-to-br from-purple-50 to-pink-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-purple-600">0</div>
            <div class="text-sm text-gray-600 mt-1">Total Questions</div>
          </div>
          <div class="bg-gradient-to-br from-orange-50 to-red-50 rounded-xl p-4 text-center">
            <div class="text-2xl font-bold text-orange-600">0</div>
            <div class="text-sm text-gray-600 mt-1">Mistakes Recorded</div>
          </div>
        </div>
      </div>
    </el-card>

    <!-- Account Security Section -->
    <el-card class="shadow-lg border-0 mt-6" body-class="p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path>
        </svg>
        Account Security
      </h3>
      <div class="space-y-3">
        <div class="flex items-center justify-between py-3 border-b border-gray-100">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">Password Protection</div>
              <div class="text-sm text-gray-500">Your account is secured with a password</div>
            </div>
          </div>
          <el-tag type="success" size="small">Active</el-tag>
        </div>
        <div class="flex items-center justify-between py-3">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"></path>
              </svg>
            </div>
            <div>
              <div class="font-medium text-gray-900">Session Token</div>
              <div class="text-sm text-gray-500">Currently logged in with JWT token</div>
            </div>
          </div>
          <el-tag type="success" size="small">Active</el-tag>
        </div>
      </div>
    </el-card>
  </div>
</template>

<style scoped>
:deep(.el-descriptions__label) {
  width: 180px;
  font-weight: 500;
  background-color: #f9fafb;
}

:deep(.el-descriptions__content) {
  background-color: #ffffff;
}

:deep(.el-card) {
  border-radius: 12px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-select) {
  width: 100%;
}
</style>
