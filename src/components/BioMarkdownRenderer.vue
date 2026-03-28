<!-- src/components/BioMarkdownRenderer.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import type { UserResponse } from '../types';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
  user?: UserResponse | null;
}>();

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

// Variable substitution patterns
// Supports: {{name}}, {{email}}, {{phone}}, {{gender}}, {{user_id}}, {{created_at}}
const substituteVariables = (content: string, user: UserResponse): string => {
  if (!user) return content;

  const genderMap: Record<number, string> = {
    0: 'Unknown',
    1: 'Male',
    2: 'Female'
  };

  const substitutions: Record<string, string> = {
    'name': user.name || '',
    'email': user.email || '',
    'phone': user.phone || 'Not provided',
    'gender': genderMap[user.gender] || 'Unknown',
    'user_id': String(user.user_id),
    'created_at': new Date(user.created_at).toLocaleDateString(),
    // Chinese variants
    '姓名': user.name || '',
    '邮箱': user.email || '',
    '电话': user.phone || '未提供',
    '性别': genderMap[user.gender] || '未知',
    '用户 ID': String(user.user_id),
    '注册时间': new Date(user.created_at).toLocaleDateString(),
  };

  let result = content;
  Object.entries(substitutions).forEach(([key, value]) => {
    const pattern = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, 'g');
    result = result.replace(pattern, value);
  });

  return result;
};

const renderedContent = computed(() => {
  if (!props.content) return '';

  // Substitute variables if user info is provided
  const contentWithVariables = props.user
    ? substituteVariables(props.content, props.user)
    : props.content;

  // Parse markdown to HTML
  return marked.parse(contentWithVariables) as string;
});
</script>

<template>
  <div
    class="bio-markdown-content prose prose-lg max-w-none"
    v-html="renderedContent"
  ></div>
</template>

<style scoped>
.bio-markdown-content {
  color: #374151;
  line-height: 1.75;
}

/* Headings */
.bio-markdown-content :deep(h1) {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: #111827;
  line-height: 1.2;
}

.bio-markdown-content :deep(h2) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: #1f2937;
  line-height: 1.3;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.bio-markdown-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
  line-height: 1.4;
}

.bio-markdown-content :deep(h4) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #4b5563;
}

/* Paragraphs */
.bio-markdown-content :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}

/* Links */
.bio-markdown-content :deep(a) {
  color: #4f46e5;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;
}

.bio-markdown-content :deep(a:hover) {
  color: #4338ca;
}

/* Code blocks */
.bio-markdown-content :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.6;
}

.bio-markdown-content :deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.bio-markdown-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

/* Blockquotes */
.bio-markdown-content :deep(blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 1rem;
  margin: 1.25rem 0;
  color: #6b7280;
  font-style: italic;
}

/* Lists */
.bio-markdown-content :deep(ul),
.bio-markdown-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.bio-markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

.bio-markdown-content :deep(ul > li) {
  list-style-type: disc;
}

.bio-markdown-content :deep(ol > li) {
  list-style-type: decimal;
}

/* Tables */
.bio-markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.25rem;
}

.bio-markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
}

.bio-markdown-content :deep(td) {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
}

.bio-markdown-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* Images */
.bio-markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.25rem 0;
}

/* Horizontal rule */
.bio-markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}

/* Bold and Italic */
.bio-markdown-content :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.bio-markdown-content :deep(em) {
  font-style: italic;
}
</style>
