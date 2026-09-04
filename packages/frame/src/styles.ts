/**
 * Shadow-DOM styles for `<device-frame>`.
 *
 * Kept as a string rather than a `.css` file so the package builds with plain
 * `tsc` and carries no bundler requirement into its consumers.
 *
 * The phone is drawn at FIXED device-logical size and never stretches with its
 * container; centering and scrolling belong to the host's own stage around it.
 * Zoom is the host's business too (a CSS transform on the host element, or
 * Electron's zoomFactor) — nothing here reacts to it.
 */
import { STATUS_BAR_STYLES } from './status-bar-styles.js'

/**
 * Width, in device-logical px, of the `.body` hairline border drawn below.
 * `frameOuterSize()` (frame-size.ts) needs this same number to compute the
 * frame's outer footprint — imported from here so the two never drift apart.
 */
export const DEVICE_FRAME_BORDER_WIDTH = 1

/**
 * The element's whole shadow-DOM stylesheet, as one CSS string. Exported so a
 * host that registers the element under its own name, or renders it server-side,
 * can reuse exactly the rules the element ships with.
 */
export const DEVICE_FRAME_STYLES = `
:host {
  /* Reflected from the resolved device so slotted content can lay itself out
     against the same numbers the frame drew — see reflectMetrics(). */
  --device-width: 0px;
  --device-height: 0px;
  --device-pixel-ratio: 1;
  --device-status-bar-height: 0px;
  --device-navigation-bar-height: 0px;
  --device-tab-bar-height: 0px;
  --device-window-width: 0px;
  --device-window-height: 0px;
  --device-safe-area-top: 0px;
  --device-safe-area-right: 0px;
  --device-safe-area-bottom: 0px;
  --device-safe-area-left: 0px;
  --device-screen-radius: 38px;
  --device-bezel: 0px;
  --device-body-radius: 38px;
  --device-frame-border-width: ${DEVICE_FRAME_BORDER_WIDTH}px;

  /* Host-overridable skin. --device-frame-radius overrides the body radius the
     device itself resolved, for a host that wants one shape for every phone —
     .screen derives its own radius from it below, so the two stay concentric.
     The body defaults to near-black with a hairline border — a real phone's
     bezel is never the same shade as the page it's showing. A host that widens
     --device-frame-border must also update --device-frame-border-width, or the
     radius math below stays sized for the old, thinner border. */
  --device-frame-border: var(--device-frame-border-width) solid rgba(255, 255, 255, 0.08);
  --device-frame-background: #0b0b0c;
  --device-frame-shadow: 0 18px 50px rgba(16, 20, 24, 0.22);
  --device-cutout-color: #000;
  /* The status bar is transparent by default, so without a navigation-bar slot
     this is what shows behind the clock — a real screen is never the bezel
     color. A dark page sets it to its own background so white status-bar text
     keeps its contrast. */
  --device-screen-background: #ffffff;

  position: relative;
  display: inline-flex;
  flex: none;
}

/*
 * The phone body: content box = the screen at exactly the device size, bezel as
 * padding, hairline border outside both. It is a shadow-tree element rather
 * than :host so a light-DOM \`* { box-sizing: border-box }\` reset cannot fold
 * the border into the width and leave .screen narrower than the metrics say.
 */
.body {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: none;
  box-sizing: content-box;
  width: var(--device-width);
  height: var(--device-height);
  padding: var(--device-bezel);
  min-height: 0;
  overflow: hidden;
  border: var(--device-frame-border);
  border-radius: var(--device-frame-radius, calc(var(--device-body-radius) + var(--device-frame-border-width)));
  background: var(--device-frame-background);
  box-shadow: var(--device-frame-shadow);
}

/* Fills its container with no phone pretense: no bezel, no status bar, no home
   indicator. The same element, drawn as a plain screen. */
:host([embedded]) {
  display: block;
  width: 100%;
  height: 100%;
}

:host([embedded]) .body {
  box-sizing: border-box;
  width: 100%;
  height: 100%;
  padding: 0;
  border: 0;
  border-radius: 0;
  box-shadow: none;
}

:host([embedded]) .screen {
  border-radius: 0;
}

:host([hidden]) {
  display: none;
}

.screen {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: var(--device-screen-background);
  /* The screen sits inside both the bezel and the border, so staying concentric
     with the body needs both subtracted back out — floored at 0 so a small
     --device-frame-radius override never asks for a negative radius. */
  border-radius: max(0px, calc(var(--device-frame-radius, calc(var(--device-screen-radius) + var(--device-bezel) + var(--device-frame-border-width))) - var(--device-bezel) - var(--device-frame-border-width)));
}

/*
 * Where the default slot's content goes. The screen is a flex column but every
 * bar on it is absolutely positioned, so content left in flow would start at
 * y=0, behind the status and navigation bars. These offsets are the CSS half of
 * metrics.content: the same status-bar + navigation-bar top and tab-bar bottom
 * the element reports, taken from the custom properties it reflects. Embedded
 * mode needs no special case — every one of those variables is 0px there.
 */
.content {
  position: absolute;
  left: 0;
  right: 0;
  top: calc(var(--device-status-bar-height) + var(--device-navigation-bar-height));
  bottom: var(--device-tab-bar-height);
  overflow: hidden;
}

/* Immersive is the page running the full screen height behind the bars, which
   is what metrics.content already reports — the wrapper has to match it. */
:host([immersive]) .content {
  top: 0;
  bottom: 0;
}

/*
 * The host's own navigation bar. On a real phone the nav bar view starts at
 * y=0 and is status-bar-height + nav-bar-height tall — navigationBarBackgroundColor
 * paints the whole thing, status bar included, which is why this wrapper covers
 * the status bar too instead of stopping below it. Unlike the status bar it DOES
 * take pointer events: what a host slots in here is a real title bar with real
 * buttons.
 */
.navigation-bar {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: calc(var(--device-status-bar-height) + var(--device-navigation-bar-height));
  z-index: 250;
  box-sizing: border-box;
}

/*
 * The frame owns the slotted bar's vertical geometry, the way a real app's
 * navigation bar view always lays its content out below the status bar: the
 * element spans both bars and its content starts under the status bar, so its
 * own background is what the status bar is painted on. These are !important on
 * purpose — a light-DOM rule of equal specificity beats a shadow-tree one, and
 * a host's ordinary padding: 0 12px would otherwise silently zero the top
 * inset and put the title under the status bar. Horizontal padding, colors
 * and content stay the host's.
 */
::slotted([slot="navigation-bar"]) {
  box-sizing: border-box !important;
  height: 100% !important;
  padding-top: var(--device-status-bar-height) !important;
}

/*
 * The host's own tab bar, occupying the foot of the screen — exactly the strip
 * the reported window size gives up for it. On a gesture-bar phone a real tab
 * bar also covers the home indicator, and its height includes that inset; a
 * host with such a bar says so through tab-bar-height.
 */
.tab-bar {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  height: var(--device-tab-bar-height);
  z-index: 250;
  box-sizing: border-box;
}

${STATUS_BAR_STYLES}

/*
 * Home-indicator pill — an absolute overlay at the device bottom, present only
 * on gesture-bar devices (the home-button class has bottom inset 0). It is NOT
 * in flow and is transparent, so whatever the screen renders behind it shows
 * through; content reserves bottom space via its own safe-area handling.
 */
.home-indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--device-safe-area-bottom);
  pointer-events: none;
  /* Above the slotted tab bar: on a gesture-bar phone the pill floats over the
     app's own bottom bar rather than being tucked under it. */
  z-index: 300;
}

.home-indicator::before {
  content: "";
  position: absolute;
  left: 50%;
  bottom: 8px;
  width: 118px;
  height: 4px;
  transform: translateX(-50%);
  border-radius: 999px;
  /* currentColor, not a fixed shade — the pill follows the inline color the
     element sets from status-bar-text-style, same switch the status bar uses. */
  background: currentColor;
}

/* Host-owned layers that ride above the screen (extension mount points, chrome
   affordances). The frame owns the stacking; slotted children opt themselves
   back into pointer events. */
.overlay {
  position: absolute;
  inset: 0;
  z-index: 400;
  overflow: hidden;
  pointer-events: none;
}
`

/**
 * The constructed stylesheet each Document gets, once its own `CSSStyleSheet`
 * has built it — paired with that constructor so a Document whose
 * `CSSStyleSheet` is swapped out from under it (a test, or a page that
 * installs a polyfill later) rebuilds rather than adopting an object the new
 * constructor doesn't recognize as its own. Keyed by Document rather than
 * held in one module-level variable because a stylesheet is only adoptable
 * by shadow roots that belong to the same Document as the constructor that
 * built it — a frame in an iframe, a popup window, or a root moved there via
 * `adoptNode` has its own `window.CSSStyleSheet`, and assigning a sheet built
 * by a different one throws `NotAllowedError` (or is silently ignored,
 * depending on the engine). `WeakMap` lets a closed Document's cached sheet
 * be collected instead of pinning it forever.
 */
const sheetsByDocument = new WeakMap<Document, { sheet: CSSStyleSheet; ctor: typeof CSSStyleSheet }>()

/** Sheets this module built — as opposed to a `<style>`-less sheet a host adopted itself — so a stale one from another Document can be told apart from a host's own and swapped out. */
const ownedSheets = new WeakSet<CSSStyleSheet>()

/** Marks the fallback `<style>` element so a second call finds and reuses it instead of appending a duplicate. */
const FALLBACK_STYLE_MARKER = 'data-device-frame-styles'

/**
 * Puts the element's shadow-DOM CSS onto `root`, preferring a constructed
 * stylesheet — shared across every instance that lives in the same Document
 * as `root` — over a `<style>` element that re-parses the same text per
 * instance. Falls back to the `<style>` element when `root`'s Document has no
 * constructible-stylesheet support (jsdom, in most configurations, and any
 * older WebView) — CSP's `style-src` needs to allow inline styles for that
 * fallback; the adopted-stylesheet path needs no CSP allowance at all.
 *
 * Idempotent: calling it again on a `root` that already carries this
 * Document's sheet (or its fallback `<style>`) is a no-op, so
 * `connectedCallback` can call it unconditionally to cover a root moved to a
 * new Document between construction and connection.
 */
export function adoptDeviceFrameStyles(root: ShadowRoot): void {
  const doc = root.ownerDocument
  const Ctor = doc.defaultView?.CSSStyleSheet

  if (typeof Ctor === 'function' && 'adoptedStyleSheets' in root) {
    let cached = sheetsByDocument.get(doc)
    if (!cached || cached.ctor !== Ctor) {
      const sheet = new Ctor()
      sheet.replaceSync(DEVICE_FRAME_STYLES)
      cached = { sheet, ctor: Ctor }
      sheetsByDocument.set(doc, cached)
      ownedSheets.add(sheet)
    }
    const { sheet } = cached
    if (root.adoptedStyleSheets.includes(sheet)) return
    root.adoptedStyleSheets = [...root.adoptedStyleSheets.filter((s) => !ownedSheets.has(s)), sheet]
    return
  }

  if (root.querySelector(`style[${FALLBACK_STYLE_MARKER}]`)) return
  const style = doc.createElement('style')
  style.setAttribute(FALLBACK_STYLE_MARKER, '')
  style.textContent = DEVICE_FRAME_STYLES
  root.append(style)
}
