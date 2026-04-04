/**
 * Plugin System - YanZhuShou
 * 
 * Provides a flexible plugin system for enabling/disabling features.
 * 
 * Usage:
 *   import { usePlugins } from '@/plugins';
 *   const { enabledPlugins, pluginConfig, togglePlugin } = usePlugins();
 */

export * from './types';
export * from './registry';
export * from './pluginStorage';

import { ref, computed } from 'vue';
import type { PluginConfig, PluginId } from './types';
import { PLUGIN_DEFINITIONS, getEnabledPlugins } from './registry';
import { getPluginConfig, savePluginConfig, getDefaultConfig } from './pluginStorage';

// Reactive plugin config
const pluginConfig = ref<PluginConfig>(getPluginConfig());

/**
 * Composable for plugin management
 */
export function usePlugins() {
  // Get enabled plugins
  const enabledPlugins = computed(() => {
    return getEnabledPlugins(pluginConfig.value);
  });

  // Get all plugins
  const allPlugins = computed(() => PLUGIN_DEFINITIONS);

  // Toggle plugin
  function togglePluginFn(pluginId: PluginId) {
    const config = getPluginConfig();
    if (config[pluginId]) {
      config[pluginId].enabled = !config[pluginId].enabled;
    } else {
      const plugin = PLUGIN_DEFINITIONS.find(p => p.id === pluginId);
      if (plugin) {
        config[pluginId] = {
          enabled: !plugin.defaultEnabled,
          order: plugin.order,
        };
      }
    }
    savePluginConfig(config);
    pluginConfig.value = config;
  }

  // Reset config
  function resetConfig() {
    const defaultConfig = getDefaultConfig();
    savePluginConfig(defaultConfig);
    pluginConfig.value = defaultConfig;
  }

  // Check if enabled
  function isEnabled(pluginId: PluginId): boolean {
    return pluginConfig.value[pluginId]?.enabled ?? 
      PLUGIN_DEFINITIONS.find(p => p.id === pluginId)?.defaultEnabled ?? false;
  }

  return {
    pluginConfig,
    enabledPlugins,
    allPlugins,
    togglePlugin: togglePluginFn,
    resetConfig,
    isEnabled,
  };
}
