#!/usr/bin/env bash
set -euo pipefail
if [[ "${FIRESTORE_EMULATOR_HOST:-}" != "127.0.0.1:8088" || "${FIREBASE_AUTH_EMULATOR_HOST:-}" != "127.0.0.1:9099" ]]; then
  echo "Refusing a non-local Firestore endpoint" >&2
  exit 1
fi
root="$(cd "$(dirname "$0")/../.." && pwd)"
qa="$(mktemp -d)"
trap 'rm -rf -- "$qa"' EXIT
cp -R "$root/src" "$root/public" "$root/astro.config.mjs" "$root/tsconfig.json" "$root/package.json" "$qa/"
ln -s "$root/node_modules" "$qa/node_modules"
cp "$root/tests/browser-emulator/OwnerHarness.tsx.template" "$qa/src/components/OwnerHarness.tsx"
# These synthetic, test-only charging units exist only in the disposable build.
# Never rewrite the real product metadata or publish this build.
node --input-type=module - "$qa" <<'NODE'
import {readFileSync,writeFileSync} from 'node:fs';
const dir=process.argv[2];
const edit=(path,from,to)=>{
  const file=dir+'/'+path;
  const input=readFileSync(file,'utf8');
  if(input.split(from).length!==2)throw Error('Unexpected fixture source '+path);
  writeFileSync(file,input.replace(from,to));
};
// Only the disposable copy targets loopback, never the actual production source.
edit('src/lib/catalogue/public-read.ts','https://firestore.googleapis.com/v1/','http://127.0.0.1:8088/v1/');
edit('src/pages/admin/index.astro',"import OwnerConsole from '../../components/OwnerConsole';","import OwnerConsole from '../../components/OwnerHarness';");
edit('src/data/products.ts','pricingBasis: null,','pricingBasis: unit === \'g\' ? \'kg\' : unit,');
NODE
(
  cd "$qa"
  export PUBLIC_FIREBASE_PROJECT_ID=demo-moin-security
  export PUBLIC_FIREBASE_AUTH_DOMAIN=demo-moin-security.firebaseapp.com
  export PUBLIC_FIREBASE_APP_ID=1:123:web:abc123
  export PUBLIC_FIREBASE_API_KEY=demo-fixture-only
  export PUBLIC_FIREBASE_ALLOWED_HOST=127.0.0.1
  npm run build
)
cd "$root"
QA_DIST="$qa/dist" npx --no-install playwright test --config tests/browser-emulator/playwright.config.mjs
