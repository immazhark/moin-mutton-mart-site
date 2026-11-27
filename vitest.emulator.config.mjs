import { defineConfig } from 'vitest/config';
export default defineConfig({ test: { include: ['tests/emulator/**/*.test.mjs'], fileParallelism: false, testTimeout: 25000, hookTimeout: 25000 } });
