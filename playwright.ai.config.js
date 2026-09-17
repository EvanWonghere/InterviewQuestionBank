import { defineConfig } from '@playwright/test';
export default defineConfig({
 testDir:'./tests/ai-e2e',fullyParallel:false,workers:1,
 use:{baseURL:'http://127.0.0.1:4175/quiz/',headless:true,launchOptions:{executablePath:'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'}},
 webServer:{command:'VITE_SUPABASE_URL=https://ai-test.supabase.co VITE_SUPABASE_PUBLISHABLE_KEY=synthetic-key npm exec vite build -- --outDir dist-ai && npm exec vite preview -- --outDir dist-ai --host 127.0.0.1 --port 4175',url:'http://127.0.0.1:4175/quiz/',reuseExistingServer:false,timeout:120000},
});
