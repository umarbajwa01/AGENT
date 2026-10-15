import { defineConfig } from "vitest/config";
export default defineConfig({
  test: {
    include: ["server/tests/**/*.test.js"],
    testTimeout: 30000,
    hookTimeout: 180000,
    fileParallelism: false,
  },
});
