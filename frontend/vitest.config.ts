import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/support/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'src/**/*.{ts,tsx}',
      ],
      exclude: [
        '**/node_modules/**',
        '**/*.config.*',
        '**/middleware.ts',
        '**/*.d.ts',
        '**/tests/**',
        'src/app/**',
        'src/components/ui/**',
        'src/types/**',
        'src/styles/**',
        'src/instrumentation*.ts',
      ],
      thresholds: {
        branches: 95,
        functions: 100,
        lines: 100,
        statements: 100,
      },
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
  },
});
