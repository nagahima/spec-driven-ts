import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    // Phase 0: テスト未実装でもCIをグリーンにする(implementation-plan Phase 0 完了条件)
    passWithNoTests: true,
    coverage: {
      provider: "v8",
      include: ["src/**"],
    },
  },
});
