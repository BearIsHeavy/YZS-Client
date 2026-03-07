// src/test/setup.ts
// Test setup file for Vitest

import { config } from '@vue/test-utils'

// Mock global properties if needed
config.global.mocks = {
  $t: (key: string) => key, // Mock i18n if used
}

// Mock window.matchMedia for components that use it
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {}, // Deprecated but may be used
    removeListener: () => {}, // Deprecated but may be used
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
})
