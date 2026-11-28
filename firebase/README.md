# Local security verification only

Use the demo project `demo-moin-security` and emulator port 8088. No production credentials or deployment command. The browser can update a known catalogue only with an active membership and an immutable matching audit created in the same atomic operation. Public prices hidden by visibility settings are still readable data, not confidential. Product-specific charging metadata remains in source and must be confirmed before release.

Run `npm ci --ignore-scripts` and `npm test` inside this directory. The generated lockfile is checked in. The deny-all baseline, all 13-offer write, adversarial rules and transaction tests must pass before integration. No production rule deployment is authorized.

## Tooling dependency risk

The Firestore Node SDK declared gRPC ~1.9.0, which npm audit flagged for GHSA-m9gg-hp2v-232j and GHSA-f596-whhp-79r4. The narrow override pins `@firebase/firestore`'s `@grpc/grpc-js` to 1.14.7 (outside the upstream minor range, so real emulator tests are required). The regenerated lockfile reported zero high/critical advisories and 14 moderate transitive tooling findings. CI fails on high or critical advisories.

Remaining moderate advisories affect the isolated Firebase CLI's OpenTelemetry baggage, glob/minimatch traversal, uuid buffer bounds, and dependent packages. No production app import, credentials, production project, untrusted path/glob input, or externally reachable emulator is permitted in this job. The emulator listens on loopback only, uses fixed synthetic fixtures, and runs with read-only repository permissions. Track upstream compatible upgrades rather than forcing broad major overrides or downgrading Firebase. Reassess if tooling is used outside this boundary.

## 28 November 2026 — current CLI audit triage

Current stable Firebase CLI is 15.37.0 ([npm versions](https://www.npmjs.com/package/firebase-tools?activeTab=versions)); no compatible stable parent upgrade proven. At Phase 2 CI 46116214282 and 46116345784, 14 moderate, zero high/critical. Four root advisories and dependent paths:

- GHSA-8988-4f7v-96qf: OpenTelemetry baggage allocation (<2.8.0); nested 1.x dependency of Google Pub/Sub. No external baggage propagation in fixed loopback emulator use.
- GHSA-3g3m-2fjr-6pw4: glob cancellation bypass (<=14.0.1); and GHSA-g3hv-75wg-m249: minimatch pattern amplification (<11.0.1). Fixed local file paths, no attacker-supplied glob input. archiver, archiver-utils, zip-stream, exegesis, rimraf and Firebase CLI inherit these advisories.
- GHSA-w5hq-g745-h8pq: uuid buffer bounds (<11.1.1), via gaxios and related paths. No caller-supplied UUID output buffer in our tests. gcp-metadata and google-gax have transitive audit entries with a nominal fixAvailable=true but no validated replacement lockfile; investigate compatible targeted updates in a later dependency-maintenance pass rather than force major overrides. Remaining npm remediation proposes downgrading Firebase CLI to 13.11.2, rejected because it regresses known security fixes and emulator compatibility. Do not use npm audit fix --force.

The full list is preserved in the redacted CI JSON audit output; all 14 entries are isolated test tooling, not customer/owner runtime packages. Residual risk remains and must be revisited with upstream fixes; no claim of zero tooling advisories. Test-only auth emulator is bound to 127.0.0.1:9099; Firestore to 127.0.0.1:8088. Temporary browser builds are disposable and never deployed. Modern CI actions pinned to verified signed commits checkout v6.1.0 and setup-node v6.5.0; no extra application dependency.
