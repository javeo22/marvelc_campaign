import path from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "jsdom",
    exclude: ["tests/e2e/**", "node_modules/**", ".next/**", "dist/**"],
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    coverage: {
      reporter: ["text", "lcov"],
      include: ["src/domain/**/*.ts", "src/storage/**/*.ts", "src/integrations/**/*.ts"]
    }
  },
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "src")
    }
  }
});
