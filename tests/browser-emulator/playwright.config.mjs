import {defineConfig} from '@playwright/test';
import {existsSync} from 'node:fs';
const dist=process.env.QA_DIST;
if(process.env.FIRESTORE_EMULATOR_HOST!=='127.0.0.1:8088'||process.env.FIREBASE_AUTH_EMULATOR_HOST!=='127.0.0.1:9099'||!dist||!dist.startsWith('/tmp/')||!existsSync(dist+'/index.html')){
  throw Error('Refusing non-local or missing QA build');
}
export default defineConfig({
  testDir:'.',testMatch:['catalogue.spec.ts','owner.spec.ts'],workers:1,timeout:45000,
  use:{baseURL:'http://127.0.0.1:4322',launchOptions:{args:['--no-sandbox']}},
  webServer:{
    command:'python3 tests/support/serve-preview.py 4322 "$QA_DIST"',
    url:'http://127.0.0.1:4322',reuseExistingServer:false,timeout:30000
  }
});
