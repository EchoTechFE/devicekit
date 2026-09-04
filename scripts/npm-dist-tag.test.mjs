// resolveDistTag() is the decision publish.yml's NPM_TAG should defer to.
// The workflow today only reads the release's prerelease checkbox / the
// workflow_dispatch input — it never looks at the version strings actually
// being published, so a prerelease version can be tagged `latest` if the
// checkbox was left unticked. These cases pin the contract: any published
// version with a semver prerelease segment must go out as `next`, and asking
// for `latest` anyway is a mistake worth failing loudly on rather than
// publishing silently wrong.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { resolveDistTag } from './npm-dist-tag.mjs'

test('a plain release of stable versions with no requested tag publishes latest', () => {
  const tag = resolveDistTag({
    versions: ['1.2.0', '0.1.0'],
    requested: '',
    eventName: 'release',
    prerelease: false,
  })
  assert.equal(tag, 'latest')
})

test('a prerelease version with no requested tag falls back to next, not latest', () => {
  const tag = resolveDistTag({
    versions: ['0.2.0-beta.1'],
    requested: '',
    eventName: 'release',
    prerelease: false,
  })
  assert.equal(tag, 'next')
})

test('a prerelease version explicitly requested as latest is refused', () => {
  assert.throws(() => {
    resolveDistTag({
      versions: ['0.2.0-beta.1'],
      requested: 'latest',
      eventName: 'workflow_dispatch',
      prerelease: false,
    })
  })
})

test('stable versions from a release marked pre-release still publish as next', () => {
  const tag = resolveDistTag({
    versions: ['1.2.0'],
    requested: '',
    eventName: 'release',
    prerelease: true,
  })
  assert.equal(tag, 'next')
})

test('a manual dispatch requesting next publishes next even for stable versions', () => {
  const tag = resolveDistTag({
    versions: ['1.2.0'],
    requested: 'next',
    eventName: 'workflow_dispatch',
    prerelease: false,
  })
  assert.equal(tag, 'next')
})
