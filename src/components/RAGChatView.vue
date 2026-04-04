<!-- src/components/RAGChatView.vue -->
<script setup lang="ts">
import { ref, onMounted, nextTick } from 'vue';
import { ragApi } from '../utils/api';
import type { RAGAnswerResponse } from '../types';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  sources?: Array<{ document_id: number; content: string; relevance: number }>;
  timestamp: Date;
}

const messages = ref<ChatMessage[]>([]);
const userInput = ref('');
  const isLoading = ref(false);
const chatContainer = ref<HTMLElement | null>(null);

async function handleSend(): Promise<void> {
  if (!userInput.value.trim() || isLoading.value) return;

  const userMessage: ChatMessage = {
    role: 'user',
    content: userInput.value,
    timestamp: new Date(),
  };
  messages.value.push(userMessage);

  const query = userInput.value;
  userInput.value = '';
  isLoading.value = true;

  try {
    const response: RAGAnswerResponse = await ragApi.answer(props.token, query);

    const assistantMessage: ChatMessage = {
      role: 'assistant',
      content: response.answer,
      sources: response.sources,
      timestamp: new Date(),
    };
    messages.value.push(assistantMessage);
  } catch (error) {
    console.error('Failed to get answer:', error);
    messages.value.push({
      role: 'assistant',
      content: '抱歉，获取答案时出现错误。请稍后再试。',
      timestamp: new Date(),
    });
  } finally {
    isLoading.value = false;
    await nextTick();
    scrollToBottom();
  }
}

function scrollToBottom(): void {
  if (chatContainer.value) {
    chatContainer.value.scrollTop = chatContainer.value.scrollHeight;
  }
}

function handleKeyPress(event: KeyboardEvent): void {
  if (event.key === 'Enter' && !event.shiftKey) {
    event.preventDefault();
    handleSend();
  }
}

function getRelevanceColor(score: number): string {
  if (score >= 0.8) return 'text-green-600';
  if (score >= 0.5) return 'text-yellow-600';
  return 'text-red-600';
}

onMounted(() => {
  scrollToBottom();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-4 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('nav.rag') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('rag.description') }}</p>
      </div>
    </div>

    <!-- Chat Container -->
    <div class="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex flex-col">
      <!-- Messages -->
      <div ref="chatContainer" class="flex-1 overflow-auto p-6 space-y-4">
        <div v-if="messages.length === 0" class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"></path>
            </svg>
            <p>{{ t('rag.empty') }}</p>
          </div>
        </div>

        <div
          v-for="(message, index) in messages"
          :key="index"
          class="flex"
          :class="message.role === 'user' ? 'justify-end' : 'justify-start'"
        >
          <div
            class="max-w-2xl rounded-2xl px-4 py-3"
            :class="message.role === 'user' 
              ? 'bg-indigo-600 text-white' 
              : 'bg-gray-100 text-gray-800'"
          >
            <div class="text-sm">{{ message.content }}</div>
            <div class="text-xs mt-2 opacity-60">
              {{ message.timestamp.toLocaleTimeString() }}
            </div>

            <!-- Sources -->
            <div v-if="message.sources && message.sources.length > 0" class="mt-3 pt-3 border-t border-gray-300">
              <p class="text-xs font-medium mb-2">{{ t('rag.sources') }}</p>
              <div class="space-y-2">
                <div
                  v-for="source in message.sources"
                  :key="source.document_id"
                  class="bg-white/50 rounded p-2 text-xs"
                >
                  <p class="font-medium">#{{ source.document_id }}</p>
                  <p class="mt-1 line-clamp-2">{{ source.content }}</p>
                  <p :class="getRelevanceColor(source.relevance)" class="mt-1">
                    {{ t('rag.relevance') }}: {{ (source.relevance * 100).toFixed(0) }}%
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Loading Indicator -->
        <div v-if="isLoading" class="flex justify-start">
          <div class="bg-gray-100 rounded-2xl px-4 py-3">
            <div class="flex space-x-2">
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.2s"></div>
              <div class="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style="animation-delay: 0.4s"></div>
            </div>
          </div>
        </div>
      </div>

      <!-- Input Area -->
      <div class="border-t border-gray-200 p-4">
        <div class="flex gap-2">
          <textarea
            v-model="userInput"
            @keydown="handleKeyPress"
            :placeholder="t('rag.placeholder')"
            rows="2"
            class="flex-1 px-4 py-2 border border-gray-300 rounded-xl resize-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          ></textarea>
          <el-button
            type="primary"
            @click="handleSend"
            :loading="isLoading"
            :disabled="!userInput.trim()"
            class="self-end"
          >
            <template #icon>
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"></path>
              </svg>
            </template>
            {{ t('rag.send') }}
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.overflow-auto::-webkit-scrollbar {
  width: 8px;
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

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
