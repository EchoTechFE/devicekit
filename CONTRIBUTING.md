# Contributing to devicekit

Thanks for taking the time to contribute.

## Getting started

Requires Node 20.19 or newer.

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

## Releasing

Bump `version` in the package's `package.json`, then turn the accumulated
`## [Unreleased]` section of `CHANGELOG.md` into `## [x.y.z] - YYYY-MM-DD` and
open a fresh, empty `## [Unreleased]` above it. Merge to main and publish a
GitHub Release; the Publish workflow does the rest.

The dist-tag a version publishes under is decided by the version strings
themselves, not just the Release's pre-release checkbox or a manual dispatch
input: any version with a semver prerelease segment (`1.2.0-beta.1`) always
goes out as `next`, a Release marked pre-release goes out as `next` even for
a stable version number, and asking for `latest` on a prerelease version
fails the workflow instead of publishing it. See `scripts/npm-dist-tag.mjs`
for the exact rule and `scripts/npm-dist-tag.test.mjs` for the cases it
covers.

Before publishing, the workflow also runs `pnpm run verify:pack`: it builds
every package, packs it the way `pnpm publish` would, unpacks the tarball,
and loads it from a directory outside the workspace — catching an `exports`
map that points at a file the build never produced, which `pnpm test` alone
would not, since the workspace's own `exports` point straight at `src/*.ts`.

A Release pointing at a commit that isn't on `main` (e.g. cut from a feature
branch or an old commit) is refused before anything is published.

A manual `workflow_dispatch` run of Publish only does anything on `main` —
the job is a no-op on any other branch, so a dispatch from a feature branch
can't push a build to npm. Every `uses:` in the workflows is pinned to a
commit SHA rather than a mutable tag; Dependabot opens the PRs that move
those pins forward.
