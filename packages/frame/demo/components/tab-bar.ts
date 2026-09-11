const TAB_STYLE = `
  :host {
    display: block;
    height: 100%;
    background: var(--demo-tab-background, #f7f7f7);
    border-top: 1px solid var(--demo-tab-border, #d8d8d8);
    color: var(--demo-tab-color, #7a7e83);
  }

  [data-role="bar"] {
    display: flex;
    height: 100%;
    box-sizing: border-box;
    padding-bottom: var(--device-safe-area-bottom);
  }

  button {
    flex: 1;
    border: 0;
    background: transparent;
    color: inherit;
    font: inherit;
    font-size: 12px;
    cursor: pointer;
  }

  button[aria-current="page"] {
    color: var(--demo-tab-active, #07c160);
  }
`

export const TAB_BAR_TAG = 'devicekit-demo-tab-bar'

export class DemoTabBar extends HTMLElement {
  static readonly observedAttributes = ['active']
  #buttons: HTMLButtonElement[] = []

  constructor() {
    super()
    this.attachShadow({ mode: 'open' })
  }

  connectedCallback(): void {
    this.slot = 'tab-bar'
    this.shadowRoot!.innerHTML = `<style>${TAB_STYLE}</style>
      <nav data-role="bar" aria-label="Tabs">
        <button type="button" data-tab="home">Home</button>
        <button type="button" data-tab="browse">Browse</button>
        <button type="button" data-tab="me">Me</button>
      </nav>`
    this.#buttons = [...this.shadowRoot!.querySelectorAll<HTMLButtonElement>('button')]
    for (const button of this.#buttons) {
      button.addEventListener('click', () => this.setAttribute('active', button.dataset.tab ?? 'home'))
    }
    this.#update()
  }

  attributeChangedCallback(): void {
    this.#update()
  }

  #update(): void {
    const active = this.getAttribute('active') || 'home'
    for (const button of this.#buttons) {
      button.toggleAttribute('aria-current', button.dataset.tab === active)
      if (button.dataset.tab === active) button.setAttribute('aria-current', 'page')
      else button.removeAttribute('aria-current')
    }
  }
}
