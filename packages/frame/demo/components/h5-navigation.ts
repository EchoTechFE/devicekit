import { renderNavigation, updateNavigation, type NavigationRefs } from './navigation-shared.js'

export const H5_NAVIGATION_TAG = 'devicekit-demo-h5-navigation'

export class DemoH5Navigation extends HTMLElement {
  static readonly observedAttributes = ['device-os', 'title']
  #refs: NavigationRefs | null = null

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.slot = 'navigation-bar'
    this.#refs = renderNavigation(this.shadowRoot!, 'Campaign details', true)
    const style = document.createElement('style')
    style.textContent = `
      :host {
        --demo-navigation-background: #0f172a;
        --demo-navigation-color: #fff;
      }
      [data-role="bar"] { gap: 8px; }
      [data-role="title"] {
        position: static;
        flex: 1;
        transform: none;
        text-align: center;
      }
    `
    this.shadowRoot!.append(style)
    this.#update()
  }

  attributeChangedCallback(): void {
    this.#update()
  }

  #update(): void {
    if (this.#refs) updateNavigation(this.#refs, this, 'Campaign details')
  }
}
