# Contributing to devicekit

Thanks for taking the time to contribute.

## Getting started

```sh
pnpm install
pnpm build
pnpm test
pnpm lint
pnpm check-types
```

To run the frame demo locally:

```sh
pnpm --filter @devicekit/frame demo
```

## Making changes

- Every bug fix needs a test that fails before the fix and passes after it.
- `pnpm lint` must report zero warnings.
- Commit messages follow [Conventional Commits](https://www.conventionalcommits.org/):
  `feat: ...`, `fix: ...`, `docs: ...`, `chore: ...`, etc.

## Adding a new device

Device presets live in `packages/devices/src/presets/{ios,android,harmony}.ts`,
one device per line. Prefer measured values over guesses, and note the
source of your numbers (official spec, physical device, teardown, etc.) in
the PR description. `presets-verified.test.ts` checks the shape of each
entry, so run `pnpm --filter @devicekit/devices test` after adding one.

## Pull requests

- Keep a PR focused on one change.
- CI must be green (build, test, lint, check-types) before merge.
- Update `CHANGELOG.md` under `## [Unreleased]` for user-facing changes.
