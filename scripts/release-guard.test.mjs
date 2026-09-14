// release.yml triggers on every push to main plus a manual workflow_dispatch.
// The push trigger already can't fire from another branch, but
// workflow_dispatch can be run from any branch in the Actions UI, so the
// job's `if:` is what stops a dispatch from a feature branch reaching npm.
// Unlike the old publish.yml (triggered by a GitHub Release, which can point
// at any branch or an old commit), there is no separate step-order guard to
// check here — the ref check alone is sufficient for both triggers.
//
// No YAML parser is a dependency of this repo (checked via `pnpm ls -r`), so
// this is a line-based parser scoped to this one file's structure: a single
// `jobs.release` block with a top-level `if:`. It is not a general YAML
// parser.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptsDir, '..')
const workflowPath = path.join(repoRoot, '.github/workflows/release.yml')

function parseReleaseJob(text) {
  const lines = text.split('\n')

  const ifLine = lines.find((line) => /^ {4}if:\s*/.test(line))
  const jobIf = ifLine ? ifLine.replace(/^ {4}if:\s*/, '').trim() : null

  return { jobIf }
}

test('jobs.release.if restricts the job to main', () => {
  const { jobIf } = parseReleaseJob(readFileSync(workflowPath, 'utf8'))
  assert.ok(jobIf, 'expected jobs.release.if to be present')
  assert.match(jobIf, /refs\/heads\/main/)
})

test('the workflow triggers on push to main and workflow_dispatch', () => {
  const text = readFileSync(workflowPath, 'utf8')
  const onIndex = text.indexOf('\non:')
  assert.notEqual(onIndex, -1, 'expected an `on:` trigger block')
  const jobsIndex = text.indexOf('\njobs:')
  const onBlock = text.slice(onIndex, jobsIndex === -1 ? undefined : jobsIndex)

  assert.match(onBlock, /push:/)
  assert.match(onBlock, /branches:\s*\[main\]/)
  assert.match(onBlock, /workflow_dispatch:/)
})
