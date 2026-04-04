<!-- src/components/KnowledgeView.vue -->
<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { knowledgeApi } from '../utils/api';
import type { KnowledgeTreeNode, KnowledgeTreeResponse } from '../types';
import { useI18n } from '../i18n';

const { t } = useI18n();

interface Props {
  token: string;
}

const props = defineProps<Props>();

const treeData = ref<KnowledgeTreeNode[]>([]);
const isLoading = ref(false);
const selectedNode = ref<KnowledgeTreeNode | null>(null);
const showCreateDialog = ref(false);
const showEditDialog = ref(false);
const formData = ref({
  name: '',
  description: '',
  parent_id: null as number | null,
});

async function fetchTree(): Promise<void> {
  isLoading.value = true;
  try {
    const data: KnowledgeTreeResponse = await knowledgeApi.getTree(props.token);
    treeData.value = data.tree || [];
  } catch (error) {
    console.error('Failed to fetch knowledge tree:', error);
  } finally {
    isLoading.value = false;
  }
}

function handleNodeClick(node: KnowledgeTreeNode): void {
  selectedNode.value = node;
}

function handleCreate(parentNode?: KnowledgeTreeNode): void {
  formData.value = {
    name: '',
    description: '',
    parent_id: parentNode?.knowledge_id ?? null,
  };
  showCreateDialog.value = true;
}

async function handleCreateSubmit(): Promise<void> {
  try {
    await knowledgeApi.create(props.token, formData.value);
    showCreateDialog.value = false;
    await fetchTree();
  } catch (error) {
    console.error('Failed to create knowledge point:', error);
  }
}

function handleEdit(node: KnowledgeTreeNode): void {
  formData.value = {
    name: node.name,
    description: node.description || '',
    parent_id: node.parent_id ?? null,
  };
  selectedNode.value = node;
  showEditDialog.value = true;
}

async function handleEditSubmit(): Promise<void> {
  if (!selectedNode.value) return;
  try {
    await knowledgeApi.update(props.token, selectedNode.value.knowledge_id, formData.value);
    showEditDialog.value = false;
    await fetchTree();
  } catch (error) {
    console.error('Failed to update knowledge point:', error);
  }
}

async function handleDelete(node: KnowledgeTreeNode): Promise<void> {
  if (!confirm(`确定要删除知识点"${node.name}"吗？`)) return;
  try {
    await knowledgeApi.delete(props.token, node.knowledge_id);
    if (selectedNode.value?.knowledge_id === node.knowledge_id) {
      selectedNode.value = null;
    }
    await fetchTree();
  } catch (error) {
    console.error('Failed to delete knowledge point:', error);
  }
}

onMounted(() => {
  fetchTree();
});
</script>

<template>
  <div class="h-full flex flex-col">
    <!-- Header -->
    <div class="mb-6 flex items-center justify-between">
      <div>
        <h2 class="text-2xl font-bold text-gray-800">{{ t('nav.knowledge') }}</h2>
        <p class="text-sm text-gray-500 mt-1">{{ t('knowledge.description') }}</p>
      </div>
      <el-button
        type="primary"
        @click="handleCreate()"
        class="bg-indigo-600 hover:bg-indigo-700"
      >
        <template #icon>
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
          </svg>
        </template>
        {{ t('knowledge.create') }}
      </el-button>
    </div>

    <!-- Knowledge Tree -->
    <div class="bg-white rounded-xl shadow-sm flex-1 overflow-hidden flex">
      <!-- Tree Panel -->
      <div class="w-1/3 border-r border-gray-200 overflow-auto p-4">
        <div v-if="isLoading" class="flex justify-center py-8">
          <div class="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>

        <el-tree
          v-else
          :data="treeData"
          :props="{ children: 'children', label: 'name' }"
          node-key="knowledge_id"
          @node-click="handleNodeClick"
          class="knowledge-tree"
        >
          <template #default="{ node, data }">
            <div class="flex items-center justify-between w-full group">
              <span class="flex-1 truncate">{{ node.label }}</span>
              <div class="hidden group-hover:flex items-center gap-1 ml-2">
                <el-button
                  size="small"
                  text
                  @click.stop="handleCreate(data)"
                  class="text-green-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path>
                  </svg>
                </el-button>
                <el-button
                  size="small"
                  text
                  @click.stop="handleEdit(data)"
                  class="text-blue-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"></path>
                  </svg>
                </el-button>
                <el-button
                  size="small"
                  text
                  @click.stop="handleDelete(data)"
                  class="text-red-600"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
                  </svg>
                </el-button>
              </div>
            </div>
          </template>
        </el-tree>
      </div>

      <!-- Detail Panel -->
      <div class="flex-1 p-6 overflow-auto">
        <div v-if="selectedNode" class="max-w-2xl">
          <div class="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl p-6 border border-indigo-100">
            <h3 class="text-xl font-bold text-gray-800 mb-4">{{ selectedNode.name }}</h3>

            <div class="space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('knowledge.description') }}</label>
                <p class="text-gray-700">{{ selectedNode.description || t('common.noData') }}</p>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('knowledge.level') }}</label>
                  <p class="text-gray-700">{{ selectedNode.level || '-' }}</p>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('knowledge.questionCount') }}</label>
                  <p class="text-gray-700">{{ selectedNode.question_count || 0 }}</p>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-600 mb-1">{{ t('common.createdAt') }}</label>
                <p class="text-gray-700">{{ new Date(selectedNode.created_at).toLocaleString() }}</p>
              </div>
            </div>
          </div>
        </div>

        <div v-else class="flex items-center justify-center h-full text-gray-400">
          <div class="text-center">
            <svg class="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <p>{{ t('knowledge.selectNode') }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Create Dialog -->
    <el-dialog
      v-model="showCreateDialog"
      :title="t('knowledge.create')"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item :label="t('knowledge.name')">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="t('knowledge.description')">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showCreateDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleCreateSubmit">{{ t('common.create') }}</el-button>
      </template>
    </el-dialog>

    <!-- Edit Dialog -->
    <el-dialog
      v-model="showEditDialog"
      :title="t('knowledge.edit')"
      width="500px"
    >
      <el-form :model="formData" label-width="100px">
        <el-form-item :label="t('knowledge.name')">
          <el-input v-model="formData.name" />
        </el-form-item>
        <el-form-item :label="t('knowledge.description')">
          <el-input v-model="formData.description" type="textarea" :rows="3" />
        </el-form-item>
      </el-form>

      <template #footer>
        <el-button @click="showEditDialog = false">{{ t('common.cancel') }}</el-button>
        <el-button type="primary" @click="handleEditSubmit">{{ t('common.save') }}</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<style scoped>
.knowledge-tree :deep(.el-tree-node__content) {
  height: 40px;
}

.knowledge-tree :deep(.el-tree-node__content:hover) {
  background-color: #f3f4f6;
}
</style>
