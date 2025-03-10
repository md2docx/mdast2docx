import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: [],
    coverage: {
      include: ["src/**"],
      exclude: ["src/**/*.test.*", "src/**/declaration.d.ts"],
      reporter: ["text", "json", "clover", "html"],
    },
  },
});
