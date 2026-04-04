// src/plugins/pluginStorage.ts
// Plugin configuration storage utilities

import type { PluginConfig, PluginId } from './types';
import { PLUGIN_DEFINITIONS } from './registry';

const STORAGE_KEY = 'plugin_config';

/**
 * Get plugin configuration from localStorage
 */
export function getPluginConfig(): PluginConfig {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Failed to load plugin config:', error);
  }

  // Return default config
  return getDefaultConfig();
}

/**
 * Save plugin configuration to localStorage
 */
export function savePluginConfig(config: PluginConfig): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Failed to save plugin config:', error);
  }
}

/**
 * Get default plugin configuration
 */
export function getDefaultConfig(): PluginConfig {
  const config: PluginConfig = {};
  for (const plugin of PLUGIN_DEFINITIONS) {
    config[plugin.id] = {
      enabled: plugin.defaultEnabled,
      order: plugin.order,
    };
  }
  return config;
}

/**
 * Reset plugin configuration to defaults
 */
export function resetPluginConfig(): PluginConfig {
  const defaultConfig = getDefaultConfig();
  savePluginConfig(defaultConfig);
  return defaultConfig;
}

/**
 * Toggle a plugin's enabled state
 */
export function togglePlugin(pluginId: PluginId): PluginConfig {
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
  return config;
}

/**
 * Update plugin order
 */
export function updatePluginOrder(pluginId: PluginId, newOrder: number): PluginConfig {
  const config = getPluginConfig();
  if (config[pluginId]) {
    config[pluginId].order = newOrder;
  }
  savePluginConfig(config);
  return config;
}

/**
 * Check if a plugin is enabled
 */
export function isPluginEnabled(pluginId: PluginId): boolean {
  const config = getPluginConfig();
  if (config[pluginId] !== undefined) {
    return config[pluginId].enabled;
  }
  const plugin = PLUGIN_DEFINITIONS.find(p => p.id === pluginId);
  return plugin?.defaultEnabled ?? false;
}
