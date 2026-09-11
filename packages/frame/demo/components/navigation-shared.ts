export type DemoDeviceOS = 'ios' | 'android' | 'harmony'

const CHEVRON_MASK = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 9 14'><path d='M8 0 1 7l7 7 1-1-6-6 6-6z'/></svg>\")"
const ARROW_MASK = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 16 14'><path d='M6.5 0 0 7l6.5 7 1.4-1.4L3.8 8.5H16v-3H3.8l4.1-4.1z'/></svg>\")"
const CLOSE_MASK = "url(\"data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 14 14'><path d='m1 0 6 6 6-6 1 1-6 6 6 6-1 1-6-6-6 6-1-1 6-6-6-6z'/></svg>\")"

export const NAVIGATION_STYLE = `
  :host {
    display: block;
    height: 100%;
    color: var(--demo-navigation-color, #000);
    background: var(--demo-navigation-background, #ededed);
    font: 500 17px/1 -apple-system, BlinkMacSystemFont, sans-serif;
  }

  [data-role="bar"] {
    position: relative;
    display: flex;
    align-items: center;
    height: 100%;
    padding: 0 12px;
    background: inherit;
    color: inherit;
  }

  .icon-button {
    appearance: none;
    -webkit-appearance: none;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    flex: 0 0 32px;
    width: 32px;
    height: 32px;
    box-sizing: border-box;
    margin: 0;
    padding: 0;
    border: 0;
    border-radius: 0;
    background: transparent;
    box-shadow: none;
    color: inherit;
    font: inherit;
    line-height: 0;
    text-align: inherit;
    cursor: pointer;
  }

  .icon-button:focus-visible {
    outline: 2px solid currentColor;
    outline-offset: 2px;
  }

  .demo-icon {
    display: block;
    flex: none;
    background: currentColor;
    -webkit-mask: no-repeat center / contain;
    mask: no-repeat center / contain;
  }

  [data-role="back-glyph"] {
    width: 9px;
    height: 14px;
    --demo-icon-back-mask: ${CHEVRON_MASK};
    -webkit-mask-image: var(--demo-icon-back-mask);
    mask-image: var(--demo-icon-back-mask);
  }

  :host([device-os="android"]) [data-role="back-glyph"],
  :host([device-os="harmony"]) [data-role="back-glyph"] {
    width: 16px;
    --demo-icon-back-mask: ${ARROW_MASK};
  }

  [data-role="close-glyph"] {
    width: 14px;
    height: 14px;
    --demo-icon-close-mask: ${CLOSE_MASK};
    -webkit-mask-image: var(--demo-icon-close-mask);
    mask-image: var(--demo-icon-close-mask);
  }

  [data-role="title"] {
    position: absolute;
    left: 50%;
    transform: translateX(-50%);
    white-space: nowrap;
  }
`

export interface NavigationRefs {
  back: HTMLElement
  title: HTMLElement
  close?: HTMLElement
}

export function renderNavigation(root: ShadowRoot, title: string, close: boolean): NavigationRefs {
  root.innerHTML = `<style>${NAVIGATION_STYLE}</style>
    <div data-role="bar">
      <button class="icon-button" aria-label="Back"><span class="demo-icon" data-role="back-glyph" aria-hidden="true"></span></button>
      <span data-role="title"></span>
      ${close ? '<button class="icon-button" aria-label="Close"><span class="demo-icon" data-role="close-glyph" aria-hidden="true"></span></button>' : ''}
    </div>`
  const back = root.querySelector<HTMLElement>('[data-role="back-glyph"]')
  const heading = root.querySelector<HTMLElement>('[data-role="title"]')
  const closeGlyph = root.querySelector<HTMLElement>('[data-role="close-glyph"]')
  if (!back || !heading || (close && !closeGlyph)) throw new Error('demo navigation failed to render')
  heading.textContent = title
  return { back, title: heading, ...(closeGlyph ? { close: closeGlyph } : {}) }
}

export function updateNavigation(refs: NavigationRefs, host: HTMLElement, fallbackTitle: string): void {
  const os = host.getAttribute('device-os') as DemoDeviceOS | null
  refs.back.dataset.variant = os === 'android' || os === 'harmony' ? 'arrow' : 'chevron'
  refs.title.textContent = host.getAttribute('title') || fallbackTitle
}
