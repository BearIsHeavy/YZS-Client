<!-- src/plugins/components/PluginSettings.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { usePlugins } from '../index';
import { useI18n } from '../../i18n';

const { t } = useI18n();
const { pluginConfig, allPlugins, togglePlugin, resetConfig } = usePlugins();

const emit = defineEmits<{
  (e: 'close'): void;
}>();

const categoryLabels: Record<string, string> = {
  core: '核心功能',
  learning: '学习功能',
  tools: '工具',
};

const categoryColors: Record<string, string> = {
  core: 'bg-blue-100 text-blue-800',
  learning: 'bg-green-100 text-green-800',
  tools: 'bg-purple-100 text-purple-800',
};

const groupedPlugins = computed(() => {
  const groups: Record<string, typeof allPlugins.value> = {};
  for (const plugin of allPlugins.value) {
    if (!groups[plugin.category]) {
      groups[plugin.category] = [];
    }
    groups[plugin.category]!.push(plugin);
  }
  return groups;
});

function handleReset(): void {
  if (confirm('确定要重置插件配置吗？')) {
    resetConfig();
  }
}
</script>

<template>
  <div class="plugin-settings">
    <div class="header mb-6">
      <h2 class="text-2xl font-bold text-gray-800">{{ t('plugin.settingsTitle') }}</h2>
      <p class="text-sm text-gray-500 mt-1">{{ t('plugin.settingsDescription') }}</p>
    </div>

    <div class="space-y-6">
      <div
        v-for="(plugins, category) in groupedPlugins"
        :key="category"
      >
        <div class="flex items-center gap-2 mb-3">
          <h3 class="text-lg font-semibold text-gray-700">{{ categoryLabels[category] || category }}</h3>
          <span :class="categoryColors[category]" class="px-2 py-0.5 rounded-full text-xs font-medium">
            {{ plugins.length }}
          </span>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div
            v-for="plugin in plugins"
            :key="plugin.id"
            class="bg-white border rounded-xl p-4 hover:shadow-md transition-shadow"
            :class="pluginConfig[plugin.id]?.enabled ? 'border-indigo-300 bg-indigo-50/30' : 'border-gray-200'"
          >
            <div class="flex items-start justify-between mb-3">
              <div class="flex items-center gap-3">
                <div
                  class="w-10 h-10 rounded-lg flex items-center justify-center"
                  :class="pluginConfig[plugin.id]?.enabled ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'"
                >
                  <el-icon :size="20">
                    <component :is="plugin.icon" />
                  </el-icon>
                </div>
                <div>
                  <h4 class="font-semibold text-gray-800">{{ t(plugin.nameKey) }}</h4>
                  <p class="text-xs text-gray-500">{{ t(plugin.descriptionKey) }}</p>
                </div>
              </div>
              <el-switch
                v-model="pluginConfig[plugin.id]!.enabled"
                @change="() => togglePlugin(plugin.id)"
                :disabled="plugin.category === 'core'"
              />
            </div>

            <div v-if="plugin.category === 'core'" class="text-xs text-gray-400 mt-2">
              {{ t('plugin.corePlugin') }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="flex justify-end gap-3 mt-6 pt-6 border-t">
      <el-button @click="handleReset">{{ t('plugin.resetDefaults') }}</el-button>
      <el-button type="primary" @click="$emit('close')">{{ t('common.close') }}</el-button>
    </div>
  </div>
</template>

<style scoped>
.plugin-settings {
  padding: 20px;
}
</style>
