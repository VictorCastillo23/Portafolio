import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "node:path";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "./"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    // No test files exist yet at this scaffold stage — later phases add
    // TDD suites for lib/projects.ts and lib/useActiveSection.ts.
    passWithNoTests: true,
  },
});
