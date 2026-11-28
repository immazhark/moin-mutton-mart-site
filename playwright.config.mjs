import { defineConfig } from '@playwright/test';

const rawPort = process.env.PLAYWRIGHT_PORT ?? '4321';
const port = Number(rawPort);
if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1024 to 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;
const browserName=process.env.PLAYWRIGHT_BROWSER??'chromium';
if(!['chromium','firefox','webkit'].includes(browserName))throw Error('Unsupported PLAYWRIGHT_BROWSER');

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL, browserName, ...(browserName==='chromium'?{launchOptions:{args:['--no-sandbox']}}:{}) },
  webServer: {
    command: `npm run build && python3 tests/support/serve-preview.py ${port} dist`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
