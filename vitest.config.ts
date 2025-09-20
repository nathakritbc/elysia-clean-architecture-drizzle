import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    globals: true,
    globalSetup: "./vitest.global-setup.ts",
    environment: "node",
    include: ["src/**/*.spec.ts"],
    root: "./",
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
    },
  },
  resolve: {
    alias: {
      "@": "/src",
    },
  },
});
