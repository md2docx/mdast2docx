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
      include: ["src/index.ts"],
      exclude: ["src/**/*.test.*", "src/**/declaration.d.ts", "src/plugins/**"],
      reporter: ["text", "json", "clover", "html"],
    },
  },
});
