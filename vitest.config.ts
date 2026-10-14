import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    // Use jsdom so browser globals (File, Blob, URL, etc.) are available
    environment: 'jsdom',
    globals: true,
    include: ['tests/**/*.test.ts'],
    // Silence noisy console output during tests
    silent: false,
    // Increase timeout for async detection tests
    testTimeout: 30000,
  },
});
