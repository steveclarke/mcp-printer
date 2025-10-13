import { defineConfig } from "vitest/config"

export default defineConfig({
  test: {
    // Test environment
    environment: "node",

    // Global test setup
    globals: true,

    // Coverage configuration
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      include: ["src/**/*.ts"],
      exclude: [
        "src/**/*.d.ts",
        "src/index.ts", // Entry point - just calls startServer
      ],
      // Coverage thresholds (optional - can be enabled later)
      // thresholds: {
      //   lines: 80,
      //   functions: 80,
      //   branches: 80,
      //   statements: 80,
      // },
    },

    // Include and exclude patterns
    include: ["tests/**/*.test.ts"],
    exclude: ["node_modules", "dist"],
  },
})
