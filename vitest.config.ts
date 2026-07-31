import { resolve } from "node:path";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": resolve(__dirname, "src"),
    },
  },
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    exclude: ["node_modules", ".next", "test-results", "playwright-report"],
    coverage: {
      provider: "v8",
      include: ["src/lib/scanner/**/*.ts", "src/db/**/*.ts"],
    },
  },
});
