/** Stable, readable URL segment for one device profile. */
export function deviceSlug(name: string): string {
  return name
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/** Relative to the demo's Vite base, so it works in development and on Pages. */
export function devicePath(name: string): string {
  return `devices/${deviceSlug(name)}/`
}
