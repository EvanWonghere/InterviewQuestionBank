import { defineConfig } from '@playwright/test';
import process from 'node:process';
import { existsSync } from 'node:fs';
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(macChrome) ? macChrome : undefined);
export default defineConfig({
  testDir: './tests/e2e', testMatch: 'gbits-written-mock.spec.js',
  use: { baseURL: 'http://127.0.0.1:4175/quiz/', trace: 'retain-on-failure', launchOptions: executablePath ? { executablePath } : undefined },
  webServer: { command: 'npm run build && npx vite preview --host 127.0.0.1 --port 4175 --strictPort', url: 'http://127.0.0.1:4175/quiz/', reuseExistingServer: false, env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' } },
});
