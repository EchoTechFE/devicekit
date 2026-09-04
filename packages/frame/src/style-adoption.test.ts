/**
 * Guards how `<device-frame>` gets its shadow-DOM CSS onto the page. A
 * `<style>` element re-parses `DEVICE_FRAME_STYLES` on every instance the
 * host mounts; a platform that supports constructible stylesheets can build
 * that CSSOM once and share it across every instance via
 * `adoptedStyleSheets`. The element has to pick whichever the platform
 * actually offers and fall back cleanly when it doesn't — jsdom is one such
 * platform in most configurations, which is also the case this test can't
 * skip.
 *
 * The constructor and cache are keyed by `Document`, not by the Node global:
 * `adoptDeviceFrameStyles()` reads `root.ownerDocument.defaultView.CSSStyleSheet`,
 * so a shadow root inside an iframe's document — a different realm, with its
 * own `CSSStyleSheet` — must not share a sheet built by another document's
 * constructor, and must not be missed just because the Node-global
 * `CSSStyleSheet` was never touched.
 */
import { afterEach, describe, expect, it } from 'vitest'
import { defineDeviceFrame, DEVICE_FRAME_TAG, type DeviceFrameElement } from './device-frame.js'
import { adoptDeviceFrameStyles, DEVICE_FRAME_STYLES } from './styles.js'

defineDeviceFrame()

/** Records the text it was handed instead of actually parsing CSS. */
class FakeCSSStyleSheet {
  lastReplacedText = ''
  replaceSync(text: string): void {
    this.lastReplacedText = text
  }
}

// `adoptedStyleSheets` is a real accessor on `ShadowRoot.prototype` where the
// platform supports it, but jsdom's own support (or lack of it) is exactly
// what this stub needs to control, so the getter/setter here always wins
// while a test has it installed. One map serves every realm: a ShadowRoot
// instance is unique regardless of which document's prototype the accessor
// was installed on.
const adoptedSheetsByRoot = new WeakMap<ShadowRoot, unknown[]>()

function stubAdoptedStyleSheetsOn(shadowRootProto: object): void {
  Object.defineProperty(shadowRootProto, 'adoptedStyleSheets', {
    configurable: true,
    get(this: ShadowRoot) {
      return adoptedSheetsByRoot.get(this) ?? []
    },
    set(this: ShadowRoot, sheets: unknown[]) {
      adoptedSheetsByRoot.set(this, sheets)
    },
  })
}

function unstubAdoptedStyleSheetsOn(shadowRootProto: object): void {
  delete (shadowRootProto as { adoptedStyleSheets?: unknown }).adoptedStyleSheets
}

/**
 * Defines a fake constructible-stylesheet `CSSStyleSheet` directly on `win`
 * — never on the Node global. `adoptDeviceFrameStyles()` is specified to
 * read the constructor off `root.ownerDocument.defaultView`, and jsdom's
 * per-window `defaultView` is not the same object as `globalThis`, so
 * stubbing only the Node global would leave the code under test seeing the
 * real (in most configurations absent) jsdom `CSSStyleSheet`.
 */
function stubConstructibleStylesheets(win: Window & typeof globalThis, ctor: typeof FakeCSSStyleSheet): void {
  Object.defineProperty(win, 'CSSStyleSheet', { configurable: true, value: ctor })
  stubAdoptedStyleSheetsOn((win as unknown as { ShadowRoot: { prototype: object } }).ShadowRoot.prototype)
}

function unstubConstructibleStylesheets(win: Window & typeof globalThis): void {
  delete (win as unknown as { CSSStyleSheet?: unknown }).CSSStyleSheet
  unstubAdoptedStyleSheetsOn((win as unknown as { ShadowRoot: { prototype: object } }).ShadowRoot.prototype)
}

function mountFrame(): DeviceFrameElement {
  const el = document.createElement(DEVICE_FRAME_TAG) as DeviceFrameElement
  document.body.append(el)
  return el
}

const iframes: HTMLIFrameElement[] = []

/** A shadow root in a second document/realm, with its own `window` and prototypes. */
function crossDocumentShadowRoot(): { root: ShadowRoot; win: Window & typeof globalThis } {
  const iframe = document.createElement('iframe')
  document.body.append(iframe)
  iframes.push(iframe)
  const doc = iframe.contentDocument!
  const win = iframe.contentWindow as Window & typeof globalThis
  const host = doc.body.appendChild(doc.createElement('div'))
  const root = host.attachShadow({ mode: 'open' })
  return { root, win }
}

afterEach(() => {
  document.body.innerHTML = ''
  for (const iframe of iframes.splice(0)) iframe.remove()
  unstubConstructibleStylesheets(window)
})

describe('shadow-root style adoption', () => {
  it('adopts one shared constructed stylesheet instead of inserting a <style> element', () => {
    stubConstructibleStylesheets(window, FakeCSSStyleSheet)

    const first = mountFrame()
    const second = mountFrame()

    expect(first.shadowRoot!.querySelector('style')).toBeNull()
    expect(first.shadowRoot!.adoptedStyleSheets).toHaveLength(1)

    const [sheet] = first.shadowRoot!.adoptedStyleSheets as unknown as FakeCSSStyleSheet[]
    expect(sheet!.lastReplacedText).toBe(DEVICE_FRAME_STYLES)

    // The whole point of building it once at document scope: every instance
    // in the same document rides the same CSSOM object rather than
    // re-parsing its own copy.
    expect(second.shadowRoot!.adoptedStyleSheets[0]).toBe(sheet)
  })

  it('falls back to an inline <style> element when constructible stylesheets are unavailable', () => {
    unstubConstructibleStylesheets(window)

    const el = mountFrame()

    expect(el.shadowRoot!.querySelector('style')!.textContent).toBe(DEVICE_FRAME_STYLES)
  })

  it('adopting twice on the same root leaves exactly one of our sheets in adoptedStyleSheets', () => {
    stubConstructibleStylesheets(window, FakeCSSStyleSheet)

    const el = mountFrame()
    const before = el.shadowRoot!.adoptedStyleSheets as unknown as FakeCSSStyleSheet[]
    expect(before).toHaveLength(1)

    adoptDeviceFrameStyles(el.shadowRoot!)

    const after = el.shadowRoot!.adoptedStyleSheets as unknown as FakeCSSStyleSheet[]
    expect(after).toHaveLength(1)
    expect(after[0]).toBe(before[0])
  })

  it('falling back twice on the same root does not insert a second <style> element', () => {
    unstubConstructibleStylesheets(window)

    const el = mountFrame()
    expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(1)

    adoptDeviceFrameStyles(el.shadowRoot!)

    expect(el.shadowRoot!.querySelectorAll('style')).toHaveLength(1)
  })

  it('the fallback <style> element is created via root.ownerDocument, not the Node global document', () => {
    unstubConstructibleStylesheets(window)
    const { root, win } = crossDocumentShadowRoot()

    adoptDeviceFrameStyles(root)

    const style = root.querySelector('style')!
    expect(style.ownerDocument).toBe(win.document)
  })

  it('a different document builds its own sheet, independent of the main document one', () => {
    stubConstructibleStylesheets(window, FakeCSSStyleSheet)
    const mainSheet = mountFrame().shadowRoot!.adoptedStyleSheets[0]

    class IframeSheet extends FakeCSSStyleSheet {}
    const { root: iframeRoot, win: iframeWin } = crossDocumentShadowRoot()
    stubConstructibleStylesheets(iframeWin, IframeSheet)
    adoptDeviceFrameStyles(iframeRoot)

    const crossDocSheet = iframeRoot.adoptedStyleSheets[0]
    expect(crossDocSheet).toBeInstanceOf(IframeSheet)
    expect(crossDocSheet).not.toBe(mainSheet)

    unstubConstructibleStylesheets(iframeWin)
  })
})
