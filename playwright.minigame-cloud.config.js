import { defineConfig } from '@playwright/test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
const testRoot = mkdtempSync(join(tmpdir(), 'quiz-minigame-cloud-'));
const buildDir = join(testRoot, 'build');
const quote = (value) => "'" + value.replace(/'/g, "'\\''") + "'";
process.on('exit', () => rmSync(testRoot, { recursive: true, force: true }));
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(macChrome) ? macChrome : undefined);
export default defineConfig({
  outputDir: join(testRoot, 'results'), testDir: './tests/fixtures', testMatch: 'minigame-cloud.e2e.js', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4189/quiz/', trace: 'retain-on-failure', launchOptions: executablePath ? { executablePath } : undefined },
  webServer: {
    command: `npx vite build --outDir ${quote(buildDir)} --emptyOutDir && npx vite preview --outDir ${quote(buildDir)} --host 127.0.0.1 --port 4189 --strictPort`,
    url: 'http://127.0.0.1:4189/quiz/', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: 'https://minigame-test.supabase.co', VITE_SUPABASE_PUBLISHABLE_KEY: 'synthetic-test-key' },
  },
});
