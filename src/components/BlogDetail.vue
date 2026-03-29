<!-- src/components/BlogDetail.vue -->
<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import type {
  BlogResponse,
  BlogCommentResponse,
  BlogCommentCreate
} from '../types';
import { blogApi } from '../utils/api';
import { ElMessage, ElMessageBox } from 'element-plus';
import { useI18n } from '../i18n';
import MarkdownRenderer from './MarkdownRenderer.vue';

const { t } = useI18n();

const props = defineProps<{
  token: string;
  blogId: number;
}>();

const emit = defineEmits<{
  (e: 'back'): void;
  (e: 'edit', blogId: number): void;
}>();

// State
const blog = ref<BlogResponse | null>(null);
const isLoading = ref<boolean>(false);
const comments = ref<BlogCommentResponse[]>([]);
const isLoadingComments = ref<boolean>(false);

// Comment form
const newCommentContent = ref<string>('');
const isSubmittingComment = ref<boolean>(false);
const replyingTo = ref<number | null>(null);
const replyContent = ref<string>('');

// Like state
const isLiking = ref<boolean>(false);

// Delete state
const isDeleting = ref<boolean>(false);
const deletingCommentId = ref<number | null>(null);

// Computed
const canManageBlog = computed(() => {
  // Backend will enforce ownership via token
  return true;
});

const canDeleteComment = computed(() => (_comment: BlogCommentResponse) => {
  // Backend will enforce ownership via token
  return true;
});

// Methods
async function fetchBlog(): Promise<void> {
  isLoading.value = true;
  try {
    blog.value = await blogApi.getById(props.token, props.blogId);
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to load blog post');
  } finally {
    isLoading.value = false;
  }
}

async function fetchComments(): Promise<void> {
  isLoadingComments.value = true;
  try {
    const response = await blogApi.listComments(props.token, props.blogId, 1, 100);
    comments.value = response.items;
  } catch (error: unknown) {
    console.error('Failed to load comments:', error);
  } finally {
    isLoadingComments.value = false;
  }
}

async function handleLike(): Promise<void> {
  if (isLiking.value) return;

  isLiking.value = true;
  try {
    const result = await blogApi.toggleLike(props.token, props.blogId);
    if (blog.value) {
      blog.value.has_liked = result.has_liked;
      blog.value.like_count = result.like_count;
    }
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : 'Failed to like post');
  } finally {
    isLiking.value = false;
  }
}

async function handleDelete(): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('blog.deleteConfirm'),
      t('blog.delete'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    );

    isDeleting.value = true;
    await blogApi.delete(props.token, props.blogId);

    ElMessage.success(t('blog.deleteSuccess'));
    emit('back');
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : t('blog.deleteFailed'));
    }
  } finally {
    isDeleting.value = false;
  }
}

async function submitComment(parentId: number | null = null): Promise<void> {
  const content = parentId !== null ? replyContent.value : newCommentContent.value;
  if (!content.trim()) {
    ElMessage.warning('Please enter comment content');
    return;
  }

  isSubmittingComment.value = true;
  try {
    const commentData: BlogCommentCreate = {
      content: content.trim(),
      parent_id: parentId
    };

    await blogApi.createComment(props.token, props.blogId, commentData);

    ElMessage.success(t('blog.comments.submitSuccess'));
    newCommentContent.value = '';
    replyContent.value = '';
    replyingTo.value = null;
    await fetchComments();
  } catch (error: unknown) {
    ElMessage.error(error instanceof Error ? error.message : t('blog.comments.submitFailed'));
  } finally {
    isSubmittingComment.value = false;
  }
}

async function deleteComment(commentId: number): Promise<void> {
  try {
    await ElMessageBox.confirm(
      t('blog.comments.deleteConfirm'),
      t('blog.comments.delete'),
      { confirmButtonText: t('common.confirm'), cancelButtonText: t('common.cancel'), type: 'warning' }
    );

    deletingCommentId.value = commentId;
    await blogApi.deleteComment(props.token, commentId);

    ElMessage.success(t('blog.comments.deleteSuccess'));
    await fetchComments();
  } catch (error: unknown) {
    if (error !== 'cancel') {
      ElMessage.error(error instanceof Error ? error.message : t('blog.comments.deleteFailed'));
    }
  } finally {
    deletingCommentId.value = null;
  }
}

function startReply(commentId: number): void {
  replyingTo.value = commentId;
  replyContent.value = '';
}

function cancelReply(): void {
  replyingTo.value = null;
  replyContent.value = '';
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// Lifecycle
onMounted(() => {
  Promise.all([
    fetchBlog(),
    fetchComments()
  ]);
});
</script>

<template>
  <div class="max-w-4xl mx-auto">
    <!-- Back Button -->
    <div class="mb-4">
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

    <!-- Blog Content -->
    <article v-else-if="blog" class="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
      <!-- Header -->
      <div class="p-6 border-b border-gray-100">
        <div class="flex items-start justify-between mb-4">
          <h1 class="text-3xl font-bold text-gray-900">{{ blog.title }}</h1>
          <div class="flex items-center gap-2">
            <el-tag
              v-if="!blog.is_published"
              size="small"
              type="warning"
              effect="plain"
            >
              {{ t('blog.drafts') }}
            </el-tag>
            <el-tag
              size="small"
              :type="blog.content_type === 'markdown' ? 'success' : 'info'"
              effect="plain"
            >
              {{ blog.content_type === 'markdown' ? t('blog.markdown') : t('blog.html') }}
            </el-tag>
          </div>
        </div>

        <div class="flex items-center gap-4 text-sm text-gray-500 flex-wrap">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-sm">
              {{ blog.author?.name?.charAt(0).toUpperCase() ?? 'A' }}
            </div>
            <span>{{ blog.author?.name ?? 'Anonymous' }}</span>
          </div>
          <span class="text-gray-400">·</span>
          <span>{{ t('blog.createdAt') }}: {{ formatDate(blog.created_at) }}</span>
          <span class="text-gray-400">·</span>
          <span>{{ t('blog.updatedAt') }}: {{ formatDate(blog.updated_at) }}</span>
        </div>

        <div class="flex items-center gap-4 mt-4 text-sm text-gray-500">
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path>
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path>
            </svg>
            {{ blog.view_count }} {{ t('blog.views') }}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
            {{ blog.like_count }} {{ t('blog.likes') }}
          </span>
          <span class="flex items-center gap-1">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
            </svg>
            {{ blog.comment_count }} {{ t('blog.comments') }}
          </span>
        </div>

        <!-- Tags -->
        <div class="flex flex-wrap gap-2 mt-4">
          <el-tag
            v-for="tag in blog.tags || []"
            :key="tag.tag_id"
            size="small"
            effect="plain"
          >
            {{ tag.name }}
          </el-tag>
        </div>
      </div>

      <!-- Actions Bar -->
      <div class="px-6 py-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
        <el-button
          :type="blog.has_liked ? 'danger' : 'default'"
          :loading="isLiking"
          @click="handleLike"
        >
          <template #icon>
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path>
            </svg>
          </template>
          {{ blog.has_liked ? t('blog.liked') : t('blog.like') }}
        </el-button>

        <div class="flex gap-2">
          <el-button v-if="canManageBlog" type="primary" @click="emit('edit', blog.blog_id)">
            {{ t('blog.edit') }}
          </el-button>
          <el-button
            v-if="canManageBlog"
            type="danger"
            :loading="isDeleting"
            @click="handleDelete"
          >
            {{ t('blog.delete') }}
          </el-button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-6">
        <MarkdownRenderer
          :content="blog.content"
          :content-type="blog.content_type as 'markdown' | 'html'"
        />
      </div>
    </article>

    <!-- Comments Section -->
    <div class="mt-6 bg-white rounded-xl shadow-sm border border-gray-100 p-6">
      <h3 class="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"></path>
        </svg>
        {{ t('blog.comments.title') }} ({{ comments.length }})
      </h3>

      <!-- Add Comment Form -->
      <div class="mb-6">
        <el-input
          v-model="newCommentContent"
          :placeholder="t('blog.comments.contentPlaceholder')"
          :rows="3"
          type="textarea"
          :disabled="isSubmittingComment"
        />
        <div class="mt-2 flex justify-end">
          <el-button
            type="primary"
            :loading="isSubmittingComment"
            @click="() => submitComment(null)"
          >
            {{ t('blog.comments.submit') }}
          </el-button>
        </div>
      </div>

      <!-- Comments List -->
      <div v-loading="isLoadingComments" class="space-y-4">
        <div v-if="comments.length === 0 && !isLoadingComments" class="text-center py-8 text-gray-500">
          <p>{{ t('blog.comments.noComments') }}</p>
          <p class="text-sm mt-1">{{ t('blog.comments.beFirst') }}</p>
        </div>

        <div
          v-for="comment in comments"
          :key="comment.comment_id"
          class="border-b border-gray-100 pb-4 last:border-0"
        >
          <div class="flex gap-3">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
              {{ comment.author?.name?.charAt(0).toUpperCase() ?? 'A' }}
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-1">
                <span class="font-medium text-gray-900">{{ comment.author?.name ?? 'Anonymous' }}</span>
                <span class="text-xs text-gray-400">{{ formatDate(comment.created_at) }}</span>
              </div>
              <p class="text-gray-700 text-sm mb-2">{{ comment.content }}</p>
              <div class="flex items-center gap-3">
                <el-button
                  text
                  size="small"
                  @click="startReply(comment.comment_id)"
                >
                  {{ t('blog.comments.addReply') }}
                </el-button>
                <el-button
                  v-if="canDeleteComment(comment)"
                  text
                  size="small"
                  type="danger"
                  :loading="deletingCommentId === comment.comment_id"
                  @click="deleteComment(comment.comment_id)"
                >
                  {{ t('blog.comments.delete') }}
                </el-button>
              </div>

              <!-- Reply Form -->
              <div v-if="replyingTo === comment.comment_id" class="mt-3">
                <el-input
                  v-model="replyContent"
                  :placeholder="t('blog.comments.contentPlaceholder')"
                  :rows="2"
                  type="textarea"
                  :disabled="isSubmittingComment"
                />
                <div class="mt-2 flex gap-2">
                  <el-button
                    type="primary"
                    size="small"
                    :loading="isSubmittingComment"
                    @click="() => submitComment(comment.comment_id)"
                  >
                    {{ t('blog.comments.submit') }}
                  </el-button>
                  <el-button size="small" @click="cancelReply">
                    {{ t('common.cancel') }}
                  </el-button>
                </div>
              </div>

              <!-- Replies -->
              <div v-if="comment.replies && comment.replies.length > 0" class="mt-3 ml-4 space-y-3">
                <div
                  v-for="reply in comment.replies"
                  :key="reply.comment_id"
                  class="flex gap-3"
                >
                  <div class="w-8 h-8 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {{ reply.author?.name?.charAt(0).toUpperCase() ?? 'A' }}
                  </div>
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="font-medium text-gray-900">{{ reply.author?.name ?? 'Anonymous' }}</span>
                      <span class="text-xs text-gray-400">{{ formatDate(reply.created_at) }}</span>
                    </div>
                    <p class="text-gray-700 text-sm mb-2">{{ reply.content }}</p>
                    <div class="flex items-center gap-3">
                      <el-button
                        v-if="canDeleteComment(reply)"
                        text
                        size="small"
                        type="danger"
                        :loading="deletingCommentId === reply.comment_id"
                        @click="deleteComment(reply.comment_id)"
                      >
                        {{ t('blog.comments.delete') }}
                      </el-button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
:deep(.el-input__wrapper) {
  border-radius: 8px;
}

:deep(.prose h1) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1rem;
  color: #111827;
}

:deep(.prose h2) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 0.875rem;
  color: #1f2937;
}

:deep(.prose h3) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #374151;
}

:deep(.prose p) {
  margin-bottom: 1rem;
  line-height: 1.75;
  color: #4b5563;
}

:deep(.prose strong) {
  font-weight: 600;
  color: #111827;
}

:deep(.prose code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875rem;
  color: #dc2626;
}

:deep(.prose br) {
  margin-bottom: 0.5rem;
}
</style>
