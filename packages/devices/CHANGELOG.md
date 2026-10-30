# @devicekit/devices

## Unreleased

### Minor Changes

- Screen-fidelity P0 follow-up (adversarial review):
  - iOS ScreenCorners fractions: store **47.33** / **53.33** where measured (was truncated 47 / 53).
  - iPhone Duo outer hinge corners **8** (DeviceHub / safearea.info); free edge remains 59 continuous.
  - iPhone Duo **inner landscape** safe area **right 84 / bottom 34**.
  - Face ID notch: per-family `bottomRadius` / cited `topRadius` (X/XS/11 Pro ear 6); uncalibrated ears stay unset.
  - Classic drops **Pixel 8** until RoundedCorner is measured (no invented radius). Xiaomi 14 already omitted.
  - Classic / default **Galaxy S24 Ultra** documents FHD+ window **384×832 @2.8125** (was silent 412×915); radius 2.13 noted as near-sharp under FHD+.
  - Pixel 9 Pro status / safe top **52** + bottom **24** (emulator-tier windowinsets) called out vs older 68 strip.
  - Android cutout audit: Pixel 5 / 9 Pro Fold centerX; Pixel 9/10 Pro Ø; S20+/Ultra holes; Pixel 3 XL notch; cite-only elsewhere.
  - CI: Classic modern phones lock expected radius buckets; Harmony skip stays honest; cutout ⇒ explicit radius guard for modern iPhones.

## 0.4.1

No changes in this release.

## 0.4.1-alpha.0

### Patch Changes

- 39f32b3: Test changeset to verify the OIDC trusted-publishing release pipeline end to end via an alpha prerelease. No functional change.
