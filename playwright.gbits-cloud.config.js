import { defineConfig } from '@playwright/test';
import { existsSync } from 'node:fs';
import process from 'node:process';
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(macChrome) ? macChrome : undefined);
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'gbits-written-cloud.spec.js', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4176/quiz/', trace: 'retain-on-failure', launchOptions: executablePath ? { executablePath } : undefined },
  webServer: { command: 'npx vite build --outDir dist-ai && npx vite preview --outDir dist-ai --host 127.0.0.1 --port 4176 --strictPort', url: 'http://127.0.0.1:4176/quiz/', reuseExistingServer: false, env: { VITE_SUPABASE_URL: 'https://gbits-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'synthetic-test-key' } },
});
