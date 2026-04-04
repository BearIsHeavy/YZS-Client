<!-- src/components/BooksView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { booksApi } from '../utils/api';
import type { BookResponse } from '../types';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

const books = ref<BookResponse[]>([]);
const isLoading = ref(false);
const showUploadDialog = ref(false);
const selectedBook = ref<BookResponse | null>(null);
const bookContent = ref<string>('');
const isUploading = ref(false);
const uploadFile = ref<File | undefined>(undefined);

async function fetchBooks(): Promise<void> {
  isLoading.value = true;
  try {
    const data = await booksApi.list(props.token);
    books.value = data.items || [];
  } catch (error) {
    console.error('Failed to fetch books:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleFileSelect(event: Event): void {
  const target = event.target as HTMLInputElement;
  if (target.files && target.files.length > 0) {
    uploadFile.value = target.files[0];
  }
}

async function handleUpload(): Promise<void> {
  if (!uploadFile.value) return;

  isUploading.value = true;
  try {
    const formData = new FormData();
    formData.append('file', uploadFile.value as File);
    await booksApi.upload(props.token, formData);
    showUploadDialog.value = false;
    uploadFile.value = undefined;
    await fetchBooks();
  } catch (error) {
    console.error('Failed to upload book:', error);
  } finally {
    isUploading.value = false;
  }
}

async function handleViewBook(book: BookResponse): Promise<void> {
  selectedBook.value = book;
  try {
    const data = await booksApi.getContent(props.token, book.book_id);
    bookContent.value = data.content || '';
  } catch (error) {
    console.error('Failed to fetch book content:', error);
  }
}

async function handleParseBook(book: BookResponse): Promise<void> {
  try {
    await booksApi.parse(props.token, book.book_id);
    await fetchBooks();
  } catch (error) {
    console.error('Failed to parse book:', error);
  }
}

async function handleDeleteBook(book: BookResponse): Promise<void> {
  if (!confirm(`确定要删除《${book.title}》吗？`)) return;
  try {
    await booksApi.delete(props.token, book.book_id);
    await fetchBooks();
  } catch (error) {
    console.error('Failed to delete book:', error);
  }
}

function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-yellow-100 text-yellow-800',
    parsing: 'bg-blue-100 text-blue-800',
    ready: 'bg-green-100 text-green-800',
    failed: 'bg-red-100 text-red-800',
  };
  return colors[status] || 'bg-gray-100 text-gray-800';
}

function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: '待处理',
    parsing: '解析中',
    ready: '已就绪',
    failed: '失败',
  };
  return labels[status] || status;
}

onMounted(() => {
  fetchBooks();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('nav.books') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('books.description') }}</p>
      </div>
      <el-button
        type="primary"
        @click="showUploadDialog = true"
        class="bg-indigo-600 hover:bg-indigo-700"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12"></path>
          </svg>
        </template>
        {{ t('books.upload') }}
      </el-button>
    </div>

    <!-- Books List -->
    <div class="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
      <div v-if="isLoading" class="flex items-center justify-center py-12">
        <div class="w-8 h-8 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      </div>

      <div v-else-if="books.length === 0" class="flex-1 flex items-center justify-center text-gray-500">
        <div class="text-center">
          <svg class="w-16 h-16 mx-auto mb-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
          </svg>
          <p>{{ t('books.empty') }}</p>
        </div>
      </div>

      <div v-else class="overflow-auto flex-1 p-6">
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            v-for="book in books"
            :key="book.book_id"
            class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-4 border border-indigo-100 hover:shadow-lg transition-shadow"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex-1">
                <h3 class="font-bold text-gray-800 mb-1">{{ book.title }}</h3>
                <p v-if="book.author" class="text-sm text-gray-600">{{ book.author }}</p>
              </div>
              <span :class="getStatusColor(book.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                {{ getStatusLabel(book.status) }}
              </span>
            </div>

            <p class="text-xs text-gray-500 mb-3">{{ book.file_name }}</p>

            <div class="flex gap-2">
              <el-button
                size="small"
                @click="handleViewBook(book)"
                :disabled="book.status !== 'ready'"
                class="flex-1"
              >
                {{ t('common.view') }}
              </el-button>
              <el-button
                size="small"
                @click="handleParseBook(book)"
                :disabled="book.status === 'parsing'"
              >
                {{ t('books.parse') }}
              </el-button>
              <el-button
                size="small"
                type="danger"
                @click="handleDeleteBook(book)"
              >
                {{ t('common.delete') }}
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Upload Dialog -->
    <el-dialog
      v-model="showUploadDialog"
      :title="t('books.uploadTitle')"
      width="500px"
    >
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">
          {{ t('books.selectFile') }}
        </label>
        <input
          type="file"
          @change="handleFileSelect"
          accept=".pdf,.txt,.md,.html"
          class="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
        <p class="mt-2 text-xs text-gray-500">
          {{ t('books.supportedFormats') }}
        </p>
      </div>

      <template #footer>
        <el-button @click="showUploadDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button
          type="primary"
          @click="handleUpload"
          :loading="isUploading"
          :disabled="!uploadFile"
        >
          {{ t('books.upload') }}
        </el-button>
      </template>
    </el-dialog>

    <!-- Book Content Dialog -->
    <el-dialog
      v-model="selectedBook"
      :title="selectedBook?.title || ''"
      width="800px"
    >
      <div class="max-h-96 overflow-auto">
        <pre class="whitespace-pre-wrap text-sm text-gray-700">{{ bookContent }}</pre>
      </div>
    </el-dialog>
  </div>
</template>

<style scoped>
/* Custom scrollbar */
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
