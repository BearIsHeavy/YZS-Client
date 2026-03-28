<!-- src/components/MarkdownRenderer.vue -->
<script setup lang="ts">
import { computed } from 'vue';
import { marked } from 'marked';

const props = defineProps<{
  content: string;
  contentType?: 'markdown' | 'html';
}>();

// Configure marked options
marked.setOptions({
  breaks: true,
  gfm: true
});

const renderedContent = computed(() => {
  if (!props.content) return '';
  
  if (props.contentType === 'html') {
    return props.content;
  }
  
  // Parse markdown to HTML
  return marked.parse(props.content) as string;
});
</script>

<template>
  <div
    class="markdown-content prose prose-lg max-w-none"
    v-html="renderedContent"
  ></div>
</template>

<style scoped>
.markdown-content {
  color: #374151;
  line-height: 1.75;
}

/* Headings */
.markdown-content :deep(h1) {
  font-size: 2.25rem;
  font-weight: 800;
  margin-bottom: 1.5rem;
  color: #111827;
  line-height: 1.2;
}

.markdown-content :deep(h2) {
  font-size: 1.875rem;
  font-weight: 700;
  margin-bottom: 1.25rem;
  color: #1f2937;
  line-height: 1.3;
  padding-bottom: 0.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(h3) {
  font-size: 1.5rem;
  font-weight: 600;
  margin-bottom: 1rem;
  color: #374151;
  line-height: 1.4;
}

.markdown-content :deep(h4) {
  font-size: 1.25rem;
  font-weight: 600;
  margin-bottom: 0.75rem;
  color: #4b5563;
}

/* Paragraphs */
.markdown-content :deep(p) {
  margin-bottom: 1.25rem;
  line-height: 1.8;
}

/* Links */
.markdown-content :deep(a) {
  color: #4f46e5;
  text-decoration: underline;
  font-weight: 500;
  transition: color 0.2s;
}

.markdown-content :deep(a:hover) {
  color: #4338ca;
}

/* Code blocks */
.markdown-content :deep(pre) {
  background-color: #1f2937;
  color: #f9fafb;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1.25rem;
  font-size: 0.875rem;
  line-height: 1.6;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  color: #dc2626;
  padding: 0.125rem 0.375rem;
  border-radius: 0.25rem;
  font-size: 0.875em;
  font-family: 'Monaco', 'Menlo', 'Ubuntu Mono', monospace;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  color: inherit;
  padding: 0;
}

/* Blockquotes */
.markdown-content :deep(blockquote) {
  border-left: 4px solid #6366f1;
  padding-left: 1rem;
  margin: 1.25rem 0;
  color: #6b7280;
  font-style: italic;
}

/* Lists */
.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1.25rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.5rem;
  line-height: 1.7;
}

.markdown-content :deep(ul > li) {
  list-style-type: disc;
}

.markdown-content :deep(ol > li) {
  list-style-type: decimal;
}

/* Tables */
.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1.25rem;
}

.markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
  text-align: left;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(td) {
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(tr:nth-child(even)) {
  background-color: #f9fafb;
}

/* Images */
.markdown-content :deep(img) {
  max-width: 100%;
  height: auto;
  border-radius: 0.5rem;
  margin: 1.25rem 0;
}

/* Horizontal rule */
.markdown-content :deep(hr) {
  border: none;
  border-top: 1px solid #e5e7eb;
  margin: 2rem 0;
}

/* Bold and Italic */
.markdown-content :deep(strong) {
  font-weight: 600;
  color: #111827;
}

.markdown-content :deep(em) {
  font-style: italic;
}

/* Task lists */
.markdown-content :deep(.task-list-item) {
  list-style-type: none;
}

.markdown-content :deep(.task-list-item input[type="checkbox"]) {
  margin-right: 0.5rem;
}
</style>
