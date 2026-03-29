<!-- src/components/TagSelector.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import type { BlogTagResponse } from '../types';
import { blogTagApi } from '../utils/api';
import { ElMessage } from 'element-plus';

const props = defineProps<{
  token: string;
  modelValue?: string[];
  maxTags?: number;
}>();

const emit = defineEmits<{
  (e: 'update:modelValue', tags: string[]): void;
}>();

const MAX_TAGS = props.maxTags || 5;
const MAX_TAG_LENGTH = 10;

// Common tags for quick selection
const COMMON_TAGS = [
  '网络安全',
  '信息安全',
  'AI',
  '逆向',
  'Web 安全',
  '渗透测试',
  '漏洞分析',
  '密码学',
  'CTF',
  '编程',
  'Python',
  'JavaScript',
  'Vue',
  'React',
  '数据库'
];

// State
const selectedTags = ref<string[]>(props.modelValue || []);
const availableTags = ref<BlogTagResponse[]>([]);
const isLoading = ref<boolean>(false);
const searchQuery = ref<string>('');
const showDropdown = ref<boolean>(false);
const newTagInput = ref<string>('');

// Filtered tags based on search
const filteredTags = ref<BlogTagResponse[]>([]);

// Methods
async function fetchTags(): Promise<void> {
  isLoading.value = true;
  try {
    const response = await blogTagApi.list(props.token, searchQuery.value || undefined);
    availableTags.value = response.items;
    filteredTags.value = availableTags.value.filter(
      tag => !selectedTags.value.includes(tag.name)
    );
  } catch (error: unknown) {
    console.error('Failed to fetch tags:', error);
  } finally {
    isLoading.value = false;
  }
}

function addTag(tagName: string): void {
  const trimmed = tagName.trim();
  
  // Validation
  if (!trimmed) return;
  if (trimmed.length > MAX_TAG_LENGTH) {
    ElMessage.warning(`Tag name must be ${MAX_TAG_LENGTH} characters or less`);
    return;
  }
  if (selectedTags.value.length >= MAX_TAGS) {
    ElMessage.warning(`Maximum ${MAX_TAGS} tags allowed`);
    return;
  }
  if (selectedTags.value.includes(trimmed)) {
    ElMessage.warning('Tag already selected');
    return;
  }

  selectedTags.value.push(trimmed);
  emit('update:modelValue', selectedTags.value);
  newTagInput.value = '';
  searchQuery.value = '';
  showDropdown.value = false;
}

function removeTag(tagName: string): void {
  selectedTags.value = selectedTags.value.filter(t => t !== tagName);
  emit('update:modelValue', selectedTags.value);
}

function handleInputChange(): void {
  if (newTagInput.value) {
    filteredTags.value = availableTags.value.filter(
      tag => tag.name.toLowerCase().includes(newTagInput.value.toLowerCase()) &&
             !selectedTags.value.includes(tag.name)
    );
    showDropdown.value = true;
  } else {
    showDropdown.value = false;
  }
}

function handleInputFocus(): void {
  showDropdown.value = true;
  fetchTags();
}

function handleInputBlur(): void {
  // Delay closing to allow clicking on dropdown items
  setTimeout(() => {
    showDropdown.value = false;
  }, 200);
}

function handleEnter(event: KeyboardEvent): void {
  event.preventDefault();
  if (newTagInput.value.trim()) {
    addTag(newTagInput.value);
  }
}

// Watch for prop changes
defineExpose({
  getSelectedTags: () => selectedTags.value
});

// Lifecycle
onMounted(() => {
  fetchTags();
});
</script>

<template>
  <div class="tag-selector">
    <!-- Selected Tags -->
    <div class="selected-tags flex flex-wrap gap-2 mb-3">
      <el-tag
        v-for="tag in selectedTags"
        :key="tag"
        closable
        type="info"
        effect="plain"
        @close="removeTag(tag)"
        class="cursor-pointer"
      >
        {{ tag }}
      </el-tag>
      <span v-if="selectedTags.length === 0" class="text-gray-400 text-sm">
        No tags selected
      </span>
    </div>

    <!-- Common Tags (always visible for quick selection) -->
    <div class="common-tags flex flex-wrap gap-2 mb-3">
      <el-tag
        v-for="tag in COMMON_TAGS.filter(t => !selectedTags.includes(t))"
        :key="tag"
        size="small"
        @click="addTag(tag)"
        class="cursor-pointer hover:bg-indigo-50 transition-colors"
      >
        {{ tag }}
      </el-tag>
    </div>

    <!-- Input Area -->
    <div class="input-area relative">
      <el-input
        v-model="newTagInput"
        placeholder="Search or create tags..."
        :maxlength="MAX_TAG_LENGTH"
        @input="handleInputChange"
        @focus="handleInputFocus"
        @blur="handleInputBlur"
        @keyup.enter="handleEnter"
      >
        <template #prefix>
          <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"></path>
          </svg>
        </template>
      </el-input>
      <span class="text-xs text-gray-400 ml-2">{{ selectedTags.length }}/{{ MAX_TAGS }}</span>
    </div>

    <!-- Dropdown -->
    <div
      v-if="showDropdown && newTagInput"
      class="dropdown absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-60 overflow-y-auto"
    >
      <!-- Search Results -->
      <div v-if="filteredTags.length > 0" class="p-2">
        <div class="text-xs text-gray-500 mb-2 px-2">Available Tags</div>
        <div
          v-for="tag in filteredTags.slice(0, 10)"
          :key="tag.tag_id"
          class="px-3 py-2 hover:bg-gray-100 cursor-pointer flex items-center justify-between"
          @click="addTag(tag.name)"
        >
          <span>{{ tag.name }}</span>
          <el-tag size="small" effect="plain">Tag</el-tag>
        </div>
      </div>

      <!-- Create New Tag -->
      <div
        v-if="newTagInput.trim() && !filteredTags.some(t => t.name.toLowerCase() === newTagInput.trim().toLowerCase())"
        class="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 cursor-pointer border-t border-gray-200"
        @click="addTag(newTagInput)"
      >
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
          <span class="text-indigo-600">Create "{{ newTagInput.trim() }}"</span>
        </div>
      </div>

      <!-- No Results -->
      <div
        v-if="newTagInput && filteredTags.length === 0 && selectedTags.includes(newTagInput.trim())"
        class="px-3 py-2 text-gray-500 text-sm"
      >
        Tag already selected
      </div>

      <!-- No Match -->
      <div
        v-if="newTagInput && filteredTags.length === 0 && !selectedTags.includes(newTagInput.trim())"
        class="px-3 py-2 text-gray-500 text-sm"
      >
        No matching tags. Press Enter to create.
      </div>
    </div>

    <!-- Helper Text -->
    <p class="text-xs text-gray-400 mt-2">
      Press Enter to create a new tag. Maximum {{ MAX_TAGS }} tags, {{ MAX_TAG_LENGTH }} characters each.
    </p>
  </div>
</template>

<style scoped>
.tag-selector {
  position: relative;
}

.selected-tags {
  min-height: 32px;
}

.input-area {
  display: flex;
  align-items: center;
}

.dropdown {
  animation: slideDown 0.2s ease-out;
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

:deep(.el-tag) {
  border-radius: 16px;
}

:deep(.el-input__wrapper) {
  border-radius: 8px;
}
</style>
