export type DemoTheme = 'light' | 'dark'

export function statusBarTextStyleForTheme(theme: DemoTheme): 'black' | 'white' {
  return theme === 'dark' ? 'white' : 'black'
}

export function applyDemoTheme(theme: DemoTheme, root: HTMLElement = document.documentElement): DemoTheme {
  root.dataset.theme = theme
  root.style.colorScheme = theme
  return theme
}
