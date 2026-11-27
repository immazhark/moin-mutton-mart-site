# Owner console operating guide

The static /admin/ shell is public and marked noindex; Firestore membership and Rules enforce access. This build defaults to disconnected. Never add Admin SDK credentials to the browser, repository or Cloudflare build variables. Configure the five PUBLIC_FIREBASE_* names from .env.example only for an approved environment. The production project is refused on every host except the canonical apex; preview projects must be separate and use an exact approved preview host.

Session-scoped Google sign-in uses the browser popup. A popup-blocked browser is instructed to open the full browser and retry; mobile redirect is not implemented until the authorized auth-domain flow can be tested. Actual Google login and a real owner's phone trial remain launch gates.

After signing in, an active member sees the server-fetched catalogue. Edit rates in decimal rupees, choose availability, listing status, visibility and stock; blank stock means unknown, zero means none. The shop default can hide saved rates without deleting them. Public rates in the document are not confidential. The UI refuses publication until charging metadata is approved in source; provisional values are not invented.

Save performs the verified transaction, not a client-only write. Failed/uncertain saves keep the exact intent in memory and the verify/retry action reuses its operation ID. A conflict preserves the draft and requires reload and review. A successful transaction may be followed by a failed refresh; the UI pauses editing until verified data is reloaded. Never use an offline queue. Browser reload or sign-out can lose local unsaved or uncertain intent; the beforeunload/explicit sign-out warning is best effort, not guaranteed on mobile.

Export validated draft JSON privately on the device. Import accepts only the bounded exact versioned format, restores into the local draft and requires the normal audited save; no UID, revision, timestamp or operation ID is restored. Backups may contain rates and stock; keep them private. Do not upload them to the website repository.

Production membership bootstrap and catalogue seed are separately approved trusted-console operations. Never deploy these Rules or seed live values without explicit approval.
