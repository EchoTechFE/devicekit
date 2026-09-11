import { H5_NAVIGATION_TAG, DemoH5Navigation } from './h5-navigation.js'
import { MINI_PROGRAM_NAVIGATION_TAG, DemoMiniProgramNavigation } from './mini-program-navigation.js'
import { TAB_BAR_TAG, DemoTabBar } from './tab-bar.js'

export { H5_NAVIGATION_TAG, MINI_PROGRAM_NAVIGATION_TAG, TAB_BAR_TAG }

export function defineDemoComponents(): void {
  if (!customElements.get(MINI_PROGRAM_NAVIGATION_TAG)) customElements.define(MINI_PROGRAM_NAVIGATION_TAG, DemoMiniProgramNavigation)
  if (!customElements.get(H5_NAVIGATION_TAG)) customElements.define(H5_NAVIGATION_TAG, DemoH5Navigation)
  if (!customElements.get(TAB_BAR_TAG)) customElements.define(TAB_BAR_TAG, DemoTabBar)
}
