// publish.yml is the only thing standing between a GitHub Release and npm.
// The job's `if:` guards workflow_dispatch to main, but a *Release* can be cut
// against any branch or an old commit — the ref check does nothing for that
// trigger. The step that actually protects it is a `git merge-base
// --is-ancestor` check against origin/main, and it only protects anything if
// it runs before the workflow installs anything or talks to npm. This has no
// registry-published equivalent to lean on (unlike scripts/npm-dist-tag.mjs's
// pure resolveDistTag()) because the guard's safety is entirely about *step
// order* inside the workflow YAML, so this test parses that file directly.
//
// No YAML parser is a dependency of this repo (checked via `pnpm ls -r`), so
// this is a line-based parser scoped to this one file's structure: a single
// `jobs.publish.steps` list, one item per `- ` at 6-space indent, each step's
// `run:` either inline or a `|` block scalar. It is not a general YAML parser.
import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

const scriptsDir = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(scriptsDir, '..')
const workflowPath = path.join(repoRoot, '.github/workflows/publish.yml')

function parsePublishJob(text) {
  const lines = text.split('\n')

  const ifLine = lines.find((line) => /^ {4}if:\s*/.test(line))
  const jobIf = ifLine ? ifLine.replace(/^ {4}if:\s*/, '').trim() : null

  const stepsIndex = lines.findIndex((line) => /^ {4}steps:\s*$/.test(line))
  assert.ok(stepsIndex !== -1, 'could not find jobs.publish.steps in publish.yml')
  const region = lines.slice(stepsIndex + 1)

  const stepStarts = []
  region.forEach((line, i) => {
    if (/^ {6}-\s/.test(line)) stepStarts.push(i)
  })
  assert.ok(stepStarts.length > 0, 'found no steps under jobs.publish.steps')

  const steps = stepStarts.map((start, idx) => {
    const end = idx + 1 < stepStarts.length ? stepStarts[idx + 1] : region.length
    const block = region.slice(start, end)

    let runText = ''
    for (let i = 0; i < block.length; i++) {
      const line = block[i]
      const match = line.match(/^(\s*)(?:-\s+)?run:\s*(.*)$/)
      if (!match) continue
      const [, indent, inline] = match
      const keyIndent = indent.length
      if (inline && !/^[|>][-+0-9]*$/.test(inline.trim())) {
        // `- run: pnpm install --frozen-lockfile` — the whole command is on this line.
        runText = inline.trim()
      } else {
        // `run: |` (or `>`) — a block scalar; gather every more-indented line
        // that follows, until the block dedents back to the key's own level.
        const collected = []
        for (let j = i + 1; j < block.length; j++) {
          const next = block[j]
          if (next.trim() === '') continue
          const nextIndent = next.match(/^(\s*)/)[1].length
          if (nextIndent <= keyIndent) break
          collected.push(next.trim())
        }
        runText = collected.join('\n')
      }
      break
    }

    return { runText }
  })

  return { jobIf, steps }
}

test('jobs.publish.if still restricts workflow_dispatch to main', () => {
  const { jobIf } = parsePublishJob(readFileSync(workflowPath, 'utf8'))
  assert.ok(jobIf, 'expected jobs.publish.if to be present')
  assert.match(jobIf, /refs\/heads\/main/)
})

test('a step runs `git merge-base --is-ancestor` against origin/main and GITHUB_SHA before install or publish', () => {
  const { steps } = parsePublishJob(readFileSync(workflowPath, 'utf8'))

  const mergeBaseIndex = steps.findIndex(
    (s) => s.runText.includes('git merge-base --is-ancestor') && s.runText.includes('GITHUB_SHA') && s.runText.includes('origin/main'),
  )
  const installIndex = steps.findIndex((s) => s.runText.includes('pnpm install'))
  const publishIndex = steps.findIndex((s) => s.runText.includes('pnpm publish'))

  assert.notEqual(mergeBaseIndex, -1, 'no step runs git merge-base --is-ancestor against GITHUB_SHA and origin/main')
  assert.notEqual(installIndex, -1, 'no step runs pnpm install')
  assert.notEqual(publishIndex, -1, 'no step runs pnpm publish')

  assert.ok(
    mergeBaseIndex < installIndex,
    `the merge-base guard (step ${mergeBaseIndex}) must run before pnpm install (step ${installIndex}), or a release from a stale branch already has code on disk before being refused`,
  )
  assert.ok(
    mergeBaseIndex < publishIndex,
    `the merge-base guard (step ${mergeBaseIndex}) must run before pnpm publish (step ${publishIndex}), or the check does not actually prevent the publish it is meant to block`,
  )
})
