<!-- src/components/BlogEditor.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type { BlogResponse, ContentTypeEnum } from '../types';
import { blogApi } from '../utils/api';
import { ElMessage } from 'element-plus';
import { useI18n } from '../i18n';
import MarkdownRenderer from './MarkdownRenderer.vue';

const { t } = useI18n();

const props = defineProps<{
  token: string;
  blogId?: number | null; // If provided, edit mode; otherwise create mode
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'saved'): void;
}>();

// State
const isEditing = computed(() => props.blogId !== null && props.blogId !== undefined);
const isLoading = ref<boolean>(false);
const isSaving = ref<boolean>(false);
const isPreviewMode = ref<boolean>(false);

// Form
const form = ref({
  title: '',
  content: '',
  content_type: 'markdown' as ContentTypeEnum,
  is_published: true
});

// Validation errors
const errors = ref({
  title: '',
  content: ''
});

// Methods
async function fetchBlog(): Promise<void> {
  if (!props.blogId) return;

  isLoading.value = true;
  try {
    const blog: BlogResponse = await blogApi.getById(props.token, props.blogId);
    form.value = {
      title: blog.title,
      content: blog.content,
      content_type: blog.content_type as ContentTypeEnum,
      is_published: blog.is_published
    };
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to load blog post');
  } finally {
    isLoading.value = false;
  }
}

function validateForm(): boolean {
  errors.value = { title: '', content: '' };
  let isValid = true;

  if (!form.value.title.trim()) {
    errors.value.title = 'Title is required';
    isValid = false;
  } else if (form.value.title.length > 200) {
    errors.value.title = 'Title must be less than 200 characters';
    isValid = false;
  }

  if (!form.value.content.trim()) {
    errors.value.content = 'Content is required';
    isValid = false;
  } else if (form.value.content.length > 50000) {
    errors.value.content = 'Content must be less than 50000 characters';
    isValid = false;
  }

  return isValid;
}

async function saveBlog(publishAsDraft = false): Promise<void> {
  if (!validateForm()) {
    ElMessage.warning(t('upload.requiredFields'));
    return;
  }

  isSaving.value = true;
  try {
    const blogData = {
      title: form.value.title.trim(),
      content: form.value.content.trim(),
      content_type: form.value.content_type,
      is_published: publishAsDraft ? false : form.value.is_published
    };

    if (isEditing.value && props.blogId) {
      await blogApi.update(props.token, props.blogId, blogData);
      ElMessage.success(t('blog.updateSuccess'));
    } else {
      await blogApi.create(props.token, blogData);
      ElMessage.success(t('blog.createSuccess'));
    }

    emit('saved');
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : (isEditing.value ? t('blog.updateFailed') : t('blog.createFailed')));
  } finally {
    isSaving.value = false;
  }
}

function handlePublish(): void {
  saveBlog(false);
}

function handleSaveAsDraft(): void {
  saveBlog(true);
}

// Lifecycle
onMounted(() => {
  if (isEditing.value) {
    fetchBlog();
  }
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-900">
          {{ isEditing ? t('blog.edit') : t('blog.create') }}
        </h2>
        <p class="text-gray-500 text-sm mt-1">
          {{ isEditing ? t('blog.editPost') : t('blog.writeNewPost') }}
        </p>
      </div>
      <el-button text @click="emit('back')">
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"></path>
          </svg>
        </template>
        {{ t('blog.backToList') }}
      </el-button>
    </div>

    <!-- Loading State -->
    <div v-if="isLoading" class="bg-white rounded-xl shadow-sm border border-gray-100 p-8">
      <el-skeleton :rows="10" animated />
    </div>

    <!-- Editor -->
    <div v-else class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Toolbar -->
      <div class="border-b border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
        <div class="flex items-center gap-3">
          <!-- Content Type Toggle -->
          <el-radio-group v-model="form.content_type" size="small">
            <el-radio-button label="markdown">{{ t('blog.markdown') }}</el-radio-button>
            <el-radio-button label="html">{{ t('blog.html') }}</el-radio-button>
          </el-radio-group>

          <!-- Preview Toggle -->
          <el-button
            :type="isPreviewMode ? 'primary' : 'default'"
            size="small"
            @click="isPreviewMode = !isPreviewMode"
          >
            <template #icon>
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
              </svg>
            </template>
            {{ t('blog.preview') }}
          </el-button>
        </div>

        <div class="flex items-center gap-2">
          <!-- Publish Toggle -->
          <el-switch
            v-model="form.is_published"
            :active-text="t('blog.published')"
            :inactive-text="t('blog.drafts')"
            size="small"
          />
        </div>
      </div>

      <!-- Editor Body -->
      <div class="p-6">
        <!-- Title Input -->
        <div class="mb-4">
          <el-input
            v-model="form.title"
            :placeholder="t('blog.titlePlaceholder')"
            maxlength="200"
            show-word-limit
            :error="errors.title"
            size="large"
          >
            <template #prefix>
              <span class="text-gray-400 font-medium">{{ t('blog.title') }}</span>
            </template>
          </el-input>
        </div>

        <!-- Content Editor / Preview -->
        <div class="grid gap-4" :class="isPreviewMode ? 'grid-cols-2' : 'grid-cols-1'">
          <!-- Editor -->
          <div>
            <el-input
              v-model="form.content"
              :placeholder="t('blog.contentPlaceholder')"
              :rows="15"
              type="textarea"
              :error="errors.content"
              :disabled="isPreviewMode && form.content_type === 'html'"
            />
          </div>

          <!-- Preview -->
          <div
            v-if="isPreviewMode"
            class="border border-gray-200 rounded-md p-4 bg-gray-50 min-h-[300px] max-h-[500px] overflow-y-auto"
          >
            <h4 class="text-lg font-bold text-gray-900 mb-2">{{ form.title || 'Untitled' }}</h4>
            <MarkdownRenderer
              :content="form.content"
              :content-type="form.content_type"
            />
          </div>
        </div>

        <!-- Help Text -->
        <div v-if="form.content_type === 'markdown' && !isPreviewMode" class="mt-3 text-xs text-gray-500">
          <p class="font-medium mb-1">Markdown supported:</p>
          <div class="grid grid-cols-2 gap-2 text-xs">
            <span><code># Heading 1</code></span>
            <span><code>## Heading 2</code></span>
            <span><code>**bold**</code></span>
            <span><code>*italic*</code></span>
            <span><code>`code`</code></span>
            <span><code>[link](url)</code></span>
          </div>
        </div>
      </div>

      <!-- Footer Actions -->
      <div class="border-t border-gray-100 p-4 bg-gray-50 flex items-center justify-between">
        <el-button text @click="emit('back')">
          {{ t('common.cancel') }}
        </el-button>
        <div class="flex gap-3">
          <el-button
            :loading="isSaving"
            @click="handleSaveAsDraft"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path>
              </svg>
            </template>
            {{ t('blog.saveAsDraft') }}
          </el-button>
          <el-button
            type="primary"
            :loading="isSaving"
            @click="handlePublish"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
              </svg>
            </template>
            {{ isEditing ? t('blog.updateSuccess').split(' ')[0] : t('blog.publish') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.el-textarea__inner) {
  border-radius: 8px;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
  font-size: 14px;
}

:deep(.el-radio-group) {
  font-size: 12px;
}

:deep(.prose h1) {
  font-size: 1.5rem;
  font-weight: 700;
  margin-bottom: 0.75rem;
  color: #111827;
}

:deep(.prose h2) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #1f2937;
}

:deep(.prose h3) {
  font-size: 1.125rem;
  font-weight: 600;
  margin-bottom: 0.5rem;
  color: #374151;
}

:deep(.prose p) {
  margin-bottom: 0.75rem;
  line-height: 1.6;
  color: #4b5563;
}

:deep(.prose strong) {
  font-weight: 600;
  color: #111827;
}

:deep(.prose code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  color: #dc2626;
}
</style>
