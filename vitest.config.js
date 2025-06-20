import { fileURLToPath } from 'node:url'
import { mergeConfig, defineConfig, configDefaults } from 'vitest/config'
import viteConfig from './vite.config'

export default mergeConfig(
  viteConfig,
  defineConfig({
    test: {
      environment: 'jsdom',
      exclude: [...configDefaults.exclude, 'e2e/**'],
      root: fileURLToPath(new URL('./', import.meta.url)),
      setupFiles: ['./tests/setup.js'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
        exclude: [
          '**/node_modules/**',
          '**/dist/**',
          '**/tests/**',
          '**/cypress/**',
          '**/*.d.ts',
          '**/*.config.js',
          '**/server.js'
        ]
      },
      globals: true
    },
  }),
)
