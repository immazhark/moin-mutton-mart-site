import { defineConfig } from '@playwright/test';

const rawPort = process.env.PLAYWRIGHT_PORT ?? '4321';
const port = Number(rawPort);
if (!/^\d+$/.test(rawPort) || !Number.isInteger(port) || port < 1024 || port > 65535) {
  throw new Error('PLAYWRIGHT_PORT must be an integer from 1024 to 65535.');
}
const baseURL = `http://127.0.0.1:${port}`;

export default defineConfig({
  testDir: 'tests/e2e',
  use: { baseURL, launchOptions: { args: ['--no-sandbox'] } },
  webServer: {
    command: `npm run build && python3 -m http.server ${port} --bind 127.0.0.1 --directory dist`,
    url: baseURL,
    reuseExistingServer: false,
    timeout: 120_000,
  },
});
