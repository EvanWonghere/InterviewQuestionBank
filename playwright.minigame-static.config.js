import { defineConfig } from '@playwright/test';
import { existsSync, mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
const testRoot = mkdtempSync(join(tmpdir(), 'quiz-minigame-static-'));
const buildDir = join(testRoot, 'build');
const quote = (value) => "'" + value.replace(/'/g, "'\\''") + "'";
process.on('exit', () => rmSync(testRoot, { recursive: true, force: true }));
const macChrome = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath = process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH ?? (existsSync(macChrome) ? macChrome : undefined);
export default defineConfig({
  outputDir: join(testRoot, 'results'), testDir: './tests/e2e', testMatch: 'minigame-topic.spec.js', workers: 1,
  use: { baseURL: 'http://127.0.0.1:4188/quiz/', trace: 'retain-on-failure', launchOptions: executablePath ? { executablePath } : undefined },
  webServer: {
    command: `npx vite build --outDir ${quote(buildDir)} --emptyOutDir && npx vite preview --outDir ${quote(buildDir)} --host 127.0.0.1 --port 4188 --strictPort`,
    url: 'http://127.0.0.1:4188/quiz/', reuseExistingServer: false,
    env: { VITE_SUPABASE_URL: '', VITE_SUPABASE_PUBLISHABLE_KEY: '' },
  },
});
