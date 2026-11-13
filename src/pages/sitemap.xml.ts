// Mapa del sitio para Google: portada, índice, cada lugar y las páginas legales.
import { loadPlaces, SITE, placeUrl } from '../lib/siteData';

export async function GET() {
  const places = await loadPlaces();
  const today = new Date().toISOString().slice(0, 10);
  const urls = ['/', '/lugares', ...places.map((p) => placeUrl(p.id)), '/privacidad', '/terminos'];
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls
    .map((u) => `  <url><loc>${SITE}${u}</loc><lastmod>${today}</lastmod></url>`).join('\n')}\n</urlset>\n`;
  return new Response(body, { headers: { 'Content-Type': 'application/xml; charset=utf-8' } });
}
