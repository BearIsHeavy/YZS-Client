<!-- src/components/ProfileView.vue -->
<script setup lang="ts">
import { ref, computed } from 'vue';
import type { UserResponse, UserUpdate } from '../types';
import { GENDER_OPTIONS } from '../types';
import { userApi } from '../utils/api';
import { ElMessage } from 'element-plus';
import { useI18n } from '../i18n';

const { t } = useI18n();

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
  return gender ? t(`auth.${gender.label.toLowerCase() as 'unknown' | 'male' | 'female'}`) : t('auth.genderUnknown');
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
</style>
