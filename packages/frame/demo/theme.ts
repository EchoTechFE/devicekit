export type DemoTheme = 'light' | 'dark'
export type DemoNavigation = 'none' | 'mp' | 'h5'

export function statusBarTextStyleForThemeAndNavigation(theme: DemoTheme, navigation: DemoNavigation): 'black' | 'white' {
  if (theme === 'dark' || navigation === 'h5') return 'white'
  return 'black'
}

export function applyDemoTheme(theme: DemoTheme, root: HTMLElement = document.documentElement): DemoTheme {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  return theme
}
