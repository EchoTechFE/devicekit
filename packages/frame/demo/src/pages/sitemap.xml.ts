import { DEVICES } from '@devicekit/devices'
import { DEMO_SITE_URL, deviceCanonicalUrl } from '../../../src/demo-device-seo.js'

export const prerender = true

export function GET(): Response {
  const urls = [DEMO_SITE_URL, ...DEVICES.map(deviceCanonicalUrl)]
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.map((url) => `  <url><loc>${url}</loc></url>`).join('\n')}\n</urlset>\n`
  return new Response(body, { headers: { 'Content-Type': 'application/xml' } })
}
