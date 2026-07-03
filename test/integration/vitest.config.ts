import { defineConfig } from 'vitest/config'
import tsconfigPaths from 'vite-tsconfig-paths'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  plugins: [tsconfigPaths()],
  resolve: {
    // `import 'server-only'` throws unless resolved under the react-server export
    // condition, which a plain Vitest run does not set. Alias to an empty stub so
    // admin.ts (and any server-only module) is importable in Node integration tests.
    alias: {
      'server-only': fileURLToPath(new URL('./server-only-stub.ts', import.meta.url)),
    },
  },
  test: {
    environment: 'node',
    globals: true,
    include: ['test/integration/**/*.test.ts'],
  },
})
