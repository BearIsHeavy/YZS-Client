// src/plugins/registry.ts
// Plugin registry - defines all available plugins

import type { PluginDefinition, PluginId } from './types';
import type { Component } from 'vue';
import {
  User,
  ChatDotRound,
  School,
  Files,
  Reading,
  Document,
  Notebook,
  Connection,
  DataAnalysis,
  Upload,
  MagicStick
} from '@element-plus/icons-vue';

export interface PluginDefinitionWithIcon extends PluginDefinition {
  icon: Component;
}

// All plugin definitions
export const PLUGIN_DEFINITIONS: PluginDefinitionWithIcon[] = [
  // Core plugins
  {
    id: 'profile',
    nameKey: 'nav.profile',
    descriptionKey: 'plugin.description.profile',
    icon: User,
    menuKey: 'profile',
    category: 'core',
    defaultEnabled: true,
    order: 0,
  },
  {
    id: 'feedback',
    nameKey: 'nav.feedback',
    descriptionKey: 'plugin.description.feedback',
    icon: ChatDotRound,
    menuKey: 'feedback',
    category: 'core',
    defaultEnabled: true,
    order: 70,
  },

  // Learning plugins
  {
    id: 'school',
    nameKey: 'school.title',
    descriptionKey: 'plugin.description.school',
    icon: School,
    menuKey: 'school',
    category: 'learning',
    defaultEnabled: true,
    order: 20,
  },
  {
    id: 'questions',
    nameKey: 'nav.questions',
    descriptionKey: 'plugin.description.questions',
    icon: Files,
    menuKey: 'questions',
    category: 'learning',
    defaultEnabled: true,
    order: 30,
  },
  {
    id: 'practice',
    nameKey: 'nav.practice',
    descriptionKey: 'plugin.description.practice',
    icon: Reading,
    menuKey: 'practice',
    category: 'learning',
    defaultEnabled: true,
    order: 50,
  },
  {
    id: 'mistakes',
    nameKey: 'nav.mistakes',
    descriptionKey: 'plugin.description.mistakes',
    icon: Document,
    menuKey: 'mistakes',
    category: 'learning',
    defaultEnabled: true,
    order: 60,
  },
  {
    id: 'books',
    nameKey: 'nav.books',
    descriptionKey: 'plugin.description.books',
    icon: Notebook,
    menuKey: 'books',
    category: 'learning',
    defaultEnabled: false,
    order: 35,
  },
  {
    id: 'knowledge',
    nameKey: 'nav.knowledge',
    descriptionKey: 'plugin.description.knowledge',
    icon: Connection,
    menuKey: 'knowledge',
    category: 'learning',
    defaultEnabled: false,
    order: 40,
  },
  {
    id: 'reports',
    nameKey: 'nav.reports',
    descriptionKey: 'plugin.description.reports',
    icon: DataAnalysis,
    menuKey: 'reports',
    category: 'learning',
    defaultEnabled: false,
    order: 65,
  },

  // Tools plugins
  {
    id: 'upload',
    nameKey: 'nav.upload',
    descriptionKey: 'plugin.description.upload',
    icon: Upload,
    menuKey: 'upload',
    category: 'tools',
    defaultEnabled: true,
    order: 45,
  },
  {
    id: 'blog',
    nameKey: 'blog.title',
    descriptionKey: 'plugin.description.blog',
    icon: Document,
    menuKey: 'blog',
    category: 'tools',
    defaultEnabled: true,
    order: 10,
  },
  {
    id: 'rag',
    nameKey: 'nav.rag',
    descriptionKey: 'plugin.description.rag',
    icon: MagicStick,
    menuKey: 'rag',
    category: 'tools',
    defaultEnabled: false,
    order: 75,
  },
];

// Get plugin by ID
export function getPluginById(id: PluginId): PluginDefinition | undefined {
  return PLUGIN_DEFINITIONS.find(p => p.id === id);
}

// Get all plugins sorted by order
export function getAllPlugins(): PluginDefinition[] {
  return [...PLUGIN_DEFINITIONS].sort((a, b) => a.order - b.order);
}

// Get enabled plugins based on config
export function getEnabledPlugins(config: Record<string, { enabled: boolean; order: number }>): PluginDefinition[] {
  return PLUGIN_DEFINITIONS
    .filter(plugin => config[plugin.id]?.enabled ?? plugin.defaultEnabled)
    .sort((a, b) => (config[a.id]?.order ?? a.order) - (config[b.id]?.order ?? b.order));
}
