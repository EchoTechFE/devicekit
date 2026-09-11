export const prerender = true

export function GET(): Response {
  return new Response('User-agent: *\nAllow: /\nSitemap: https://echotechfe.github.io/devicekit/sitemap.xml\n', {
    headers: { 'Content-Type': 'text/plain' },
  })
}
