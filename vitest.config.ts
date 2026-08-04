import { defineConfig } from "vitest/config"

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./apps/web/src/test/setup.ts"],
    include: [
      "apps/web/src/**/*.test.{ts,tsx}",
      "apps/web/src/**/*.spec.{ts,tsx}"
    ],
    exclude: [
      "**/node_modules/**",
      "**/.git/**",
      "**/.next/**",
      "apps/web/src/lib/server/**",
      "apps/web/src/features/**/legacy*.test.{ts,tsx}"
    ],
    css: true,
  },
})
