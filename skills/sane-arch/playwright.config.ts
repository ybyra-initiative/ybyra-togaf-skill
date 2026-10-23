import { defineConfig } from '@playwright/test';

/**
 * Q20: behavioral DOM assertions are always on; pixel diffs are opt-in
 * (SANE_ARCH_PIXELS=1) and pinned to one platform — the snapshot path has no
 * {platform} token, so baselines only ever come from the machine that
 * generated them.
 */
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  workers: 1,
  fullyParallel: false,
  reporter: [['list']],
  snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}{ext}',
  use: {
    browserName: 'chromium',
    viewport: { width: 1440, height: 900 },
    screenshot: 'only-on-failure',
  },
});
