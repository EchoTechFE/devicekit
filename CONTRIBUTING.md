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
- Any user-facing change to `@devicekit/devices` or `@devicekit/frame` needs a
  changeset: run `pnpm changeset` and follow the prompts. It writes a small
  Markdown file describing the change and its semver bump; CI checks it in
  along with the PR.

## Adding a new device

Device presets live in `packages/devices/src/presets/{ios,android,harmony}.ts`,
one device per line. Prefer measured values over guesses, and note the
source of your numbers (official spec, physical device, teardown, etc.) in
the PR description. `presets-verified.test.ts` checks the shape of each
entry, so run `pnpm --filter @devicekit/devices test` after adding one.

## Pull requests

- Keep a PR focused on one change.
- CI must be green (build, test, lint, check-types) before merge.
- Include a changeset (see above) for any user-facing change.

## Releasing

Releases are automated with [Changesets](https://github.com/changesets/changesets)
— there's nothing to bump or publish by hand. Merging a PR with changesets
into `main` makes the Release workflow open (or update) a "Version Packages"
PR that applies the accumulated changesets: bumping `@devicekit/devices` and
`@devicekit/frame` together (they're a fixed group, so they always ship the
same version) and writing each package's own `CHANGELOG.md`. Merging that PR
is what actually publishes to npm.

Before publishing, the same `pnpm release` script the workflow runs also runs
`pnpm run verify:pack`: it builds every package, packs it the way `pnpm
publish` would, unpacks the tarball, and loads it from a directory outside
the workspace — catching an `exports` map that points at a file the build
never produced, which `pnpm test` alone would not, since the workspace's own
`exports` point straight at `src/*.ts`.

The Release workflow only does anything on `main` — a manual
`workflow_dispatch` run is a no-op on any other branch. Every `uses:` in the
workflows is pinned to a commit SHA rather than a mutable tag; Dependabot
opens the PRs that move those pins forward.
