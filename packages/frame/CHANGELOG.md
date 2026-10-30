# @devicekit/frame

## Unreleased

### Minor Changes

- Screen continuous corners: Figma ξ≈0.6 `clip-path` on `.screen` + matching outer body chrome; Chromium `corner-shape: squircle` kept as progressive enhancement. Documented in the frame README.
- Face ID notch paint: circular `clip-path` ears + bottom fillets (`notch-continuous-path`); no Figma ξ on the notch.
- Home indicator: iOS-only — hidden for every non-iOS preset.

### Patch Changes

- Updated dependencies
  - @devicekit/devices (screen-fidelity radii / Duo landscape / Android cutouts)

## 0.4.1

### Patch Changes

- e9e71b0: Add a crawlable device-profile directory and static profile details to the demo.
- @devicekit/devices@0.4.1

## 0.4.1-alpha.0

### Patch Changes

- 39f32b3: Test changeset to verify the OIDC trusted-publishing release pipeline end to end via an alpha prerelease. No functional change.
- Updated dependencies [39f32b3]
  - @devicekit/devices@0.4.1-alpha.0
