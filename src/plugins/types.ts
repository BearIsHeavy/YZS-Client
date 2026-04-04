// src/plugins/types.ts
// Plugin system type definitions

import type { Component } from 'vue';

export type PluginId =
  | 'profile'
  | 'blog'
  | 'school'
  | 'questions'
  | 'upload'
  | 'practice'
  | 'mistakes'
  | 'feedback'
  | 'books'
  | 'knowledge'
  | 'reports'
  | 'rag';

export interface PluginDefinition {
  id: PluginId;
  nameKey: string;        // i18n key for name
  descriptionKey: string; // i18n key for description
  icon: string | Component; // Icon name or Component (Element Plus icon)
  menuKey: string;        // Menu key for navigation
  category: 'core' | 'learning' | 'tools';
  defaultEnabled: boolean;
  order: number;
}

export interface PluginConfig {
  [pluginId: string]: {
    enabled: boolean;
    order: number;
  };
}
