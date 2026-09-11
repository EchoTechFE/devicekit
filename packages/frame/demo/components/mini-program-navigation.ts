import { renderNavigation, updateNavigation, type NavigationRefs } from './navigation-shared.js'

export const MINI_PROGRAM_NAVIGATION_TAG = 'devicekit-demo-mp-navigation'

export class DemoMiniProgramNavigation extends HTMLElement {
  static readonly observedAttributes = ['device-os', 'title']
  #refs: NavigationRefs | null = null

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.slot = 'navigation-bar'
    this.#refs = renderNavigation(this.shadowRoot!, 'Cart', false)
    this.#update()
  }

  attributeChangedCallback(): void {
    this.#update()
  }

  #update(): void {
    if (this.#refs) updateNavigation(this.#refs, this, 'Cart')
  }
}
