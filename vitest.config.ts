import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['tests/**/*.test.ts', 'src/**/*.integration.test.ts'],
    coverage: {
      reporter: ['text', 'html']
    }
  }
});
