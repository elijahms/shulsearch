import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  resolve: {
    // `import 'server-only'` throws in a plain test run; alias it to an empty stub.
    alias: {
      'server-only': fileURLToPath(new URL('./test/integration/server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./test/setup.ts'],
    // integration tests (emulator) run in their own pass; keep unit runs fast
    exclude: ['**/node_modules/**', 'test/integration/**'],
  },
})
