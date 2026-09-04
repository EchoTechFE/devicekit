/**
 * The mount-time replay effect used to key its "already replayed" guard on
 * element identity alone (`replayedFor.current !== el`). Identity survives a
 * `Suspense` boundary hiding and re-showing its content: React tears down
 * layout effects (unhearing the listener this wrapper attached) but keeps the
 * same connected DOM node underneath, display:none, while it waits on a
 * sibling's pending promise. If the frame's geometry moves during that
 * window, the resuming setup sees the same `el` it replayed for before and
 * — keyed on identity alone — would skip the replay, leaving the caller's
 * handler holding a rect from before the boundary ever suspended.
 */
import * as React from 'react'
import { act, cleanup, render } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { ContentRect } from '../content-rect.js'
import type { DeviceFrameElement } from '../device-frame.js'
import { DeviceFrame } from './index.js'

afterEach(() => {
  cleanup()
})

function stubScreenBox(el: DeviceFrameElement, box: { x: number, y: number, width: number, height: number }): void {
  const screenEl = el.shadowRoot!.querySelector<HTMLElement>('.screen')!
  screenEl.getBoundingClientRect = () => new DOMRect(box.x, box.y, box.width, box.height)
}

let resolveSuspender: (() => void) | null = null
let suspenderPromise: Promise<void> | null = null
let suspenderSettled = false

/**
 * Throws one cached pending promise while `pending`, the way a lazily-loaded
 * sibling would; once that promise settles, React's retry finds it done and
 * renders through. A fresh promise per render would re-suspend forever.
 */
function Suspender({ pending }: { pending: boolean }): null {
  if (pending && !suspenderSettled) {
    suspenderPromise ??= new Promise<void>((resolve) => {
      resolveSuspender = () => {
        suspenderSettled = true
        resolve()
      }
    })
    throw suspenderPromise
  }
  return null
}

function Harness({
  handler,
  exposeSetPending,
  frameRef,
}: {
  handler: (event: CustomEvent<ContentRect>) => void
  exposeSetPending: (setPending: (value: boolean) => void) => void
  frameRef: React.Ref<DeviceFrameElement>
}): React.ReactElement {
  const [pending, setPending] = React.useState(false)
  React.useEffect(() => {
    exposeSetPending(setPending)
  }, [exposeSetPending])
  return (
    <React.Suspense fallback={<div>loading</div>}>
      <DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={frameRef} />
      <Suspender pending={pending} />
    </React.Suspense>
  )
}

describe('<DeviceFrame onContentRectChange> under a Suspense boundary that hides and resumes it', () => {
  it('replays once more on resume when the geometry moved while the boundary was suspended', async () => {
    const handler = vi.fn()
    const frameRef = React.createRef<DeviceFrameElement>()
    let setPending: ((value: boolean) => void) | null = null

    const { container } = render(
      <Harness
        handler={handler}
        frameRef={frameRef}
        exposeSetPending={(fn) => {
          setPending = fn
        }}
      />,
    )

    expect(handler).toHaveBeenCalledTimes(1)
    const firstX = handler.mock.calls[0]![0].detail.x
    const el = frameRef.current!

    // A plain sync update, not a transition: a transition would keep the
    // already-shown content visible and never fall back, so nothing gets
    // hidden. A sync update that suspends an already-shown boundary makes
    // React show the fallback and hide the committed subtree with
    // `display: none`, tearing down its layout effects while keeping the
    // same connected DOM node.
    act(() => {
      setPending!(true)
    })

    expect(container.textContent).toContain('loading')
    expect(el.isConnected).toBe(true)
    expect(el.style.display).toBe('none')

    // The listener's layout effect was torn down while hidden: a rect change
    // now reaches nobody, so the resumed setup has to notice and replay it.
    stubScreenBox(el, { x: 40, y: 0, width: 300, height: 600 })
    el.refreshContentRect()
    expect(handler).toHaveBeenCalledTimes(1)

    await act(async () => {
      resolveSuspender?.()
      await new Promise<void>((resolve) => setTimeout(resolve, 0))
    })
    expect(container.textContent).not.toContain('loading')
    expect(el.style.display).not.toBe('none')

    expect(handler).toHaveBeenCalledTimes(2)
    const secondX = handler.mock.calls[1]![0].detail.x
    expect(secondX).not.toBe(firstX)
  })

  it('still replays exactly once on a plain StrictMode mount (no Suspense involved)', () => {
    const handler = vi.fn()
    const frameRef = React.createRef<DeviceFrameElement>()

    render(
      <React.StrictMode>
        <DeviceFrame device="iPhone 15" onContentRectChange={handler} ref={frameRef} />
      </React.StrictMode>,
    )

    expect(handler).toHaveBeenCalledTimes(1)
  })
})
