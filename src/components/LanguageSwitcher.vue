<!-- src/components/LanguageSwitcher.vue -->
<script setup lang="ts">
import { useI18n, type Locale } from '../i18n';

const { locale, setLocale, locales } = useI18n();

function handleLocaleChange(newLocale: Locale): void {
  setLocale(newLocale);
}
</script>

<template>
  <el-dropdown trigger="click" class="language-switcher">
    <button class="language-button flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/10 transition-colors">
      <span class="text-lg">{{ locales.find(l => l.code === locale)?.flag }}</span>
      <span class="text-sm font-medium">{{ locales.find(l => l.code === locale)?.name }}</span>
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
      </svg>
    </button>
    <template #dropdown>
      <el-dropdown-menu>
        <el-dropdown-item
          v-for="loc in locales"
          :key="loc.code"
          :command="loc.code"
          :disabled="loc.code === locale"
          @click="handleLocaleChange(loc.code)"
        >
          <span class="flex items-center gap-2">
            <span class="text-lg">{{ loc.flag }}</span>
            <span>{{ loc.name }}</span>
          </span>
        </el-dropdown-item>
      </el-dropdown-menu>
    </template>
  </el-dropdown>
</template>

<style scoped>
.language-switcher {
  display: inline-block;
}

.language-button {
  background: transparent;
  border: none;
  color: inherit;
  cursor: pointer;
  font-family: inherit;
}

:deep(.el-dropdown-menu__item) {
  padding: 8px 16px;
}

:deep(.el-dropdown-menu__item.is-disabled) {
  cursor: default;
}
</style>
