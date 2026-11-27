# Local security verification only

Use the demo project `demo-moin-security` and emulator port 8088. No production credentials or deployment command. The browser can update a known catalogue only with an active membership and an immutable matching audit created in the same atomic operation. Public prices hidden by visibility settings are still readable data, not confidential. Product-specific charging metadata remains in source and must be confirmed before release.

Run `npm ci --ignore-scripts` and `npm test` inside this directory. The generated lockfile is checked in. The deny-all baseline, all 13-offer write, adversarial rules and transaction tests must pass before integration. No production rule deployment is authorized.

## Tooling dependency risk

The Firestore Node SDK declared gRPC ~1.9.0, which npm audit flagged for GHSA-m9gg-hp2v-232j and GHSA-f596-whhp-79r4. The narrow override pins `@firebase/firestore`'s `@grpc/grpc-js` to 1.14.7 (outside the upstream minor range, so real emulator tests are required). The regenerated lockfile reported zero high/critical advisories and 14 moderate transitive tooling findings. CI fails on high or critical advisories.

Remaining moderate advisories affect the isolated Firebase CLI's OpenTelemetry baggage, glob/minimatch traversal, uuid buffer bounds, and dependent packages. No production app import, credentials, production project, untrusted path/glob input, or externally reachable emulator is permitted in this job. The emulator listens on loopback only, uses fixed synthetic fixtures, and runs with read-only repository permissions. Track upstream compatible upgrades rather than forcing broad major overrides or downgrading Firebase. Reassess if tooling is used outside this boundary.
