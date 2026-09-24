import { existsSync } from 'node:fs';
import process from 'node:process';
import { defineConfig } from '@playwright/test';
// Prefer the local Google Chrome on macOS; fall back to Playwright's bundled Chromium elsewhere (cloud, Linux).
const macChrome='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const executablePath=process.env.PLAYWRIGHT_CHROMIUM_EXECUTABLE_PATH??(existsSync(macChrome)?macChrome:undefined);
export default defineConfig({
 testDir:'./tests/ai-e2e',fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:4175/quiz/',headless:true,launchOptions:executablePath?{executablePath}:undefined},
 webServer:{command:'VITE_SUPABASE_URL=https://ai-test.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=synthetic-key npm exec vite build -- --outDir dist-ai && npm exec vite preview -- --outDir dist-ai --host 127.0.0.1 --port 4175',url:'http://127.0.0.1:4175/quiz/',reuseExistingServer:false,timeout:120000},
});
