import type { APIRoute } from 'astro';
import { publicProviders } from '../lib/format';
import proveedores from '../data/proveedores.json';
import rutas from '../data/rutas.json';

const ORIGEN = 'http://soytequenda.lan';

function url(path: string) {
  return `${ORIGEN}${path}`;
}

const rutasEstaticas = ['/', '/proveedores/', '/mapa/', '/rutas/', '/actividades/'];

const urls = [
  ...rutasEstaticas,
  ...publicProviders(proveedores).map((p) => `/proveedores/${p.id}/`),
  ...rutas.map((r) => `/rutas/${r.ruta_id}/`),
];

export const GET: APIRoute = () => {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls
  .map(
    (u) => `  <url>
    <loc>${url(u)}</loc>
  </url>`
  )
  .join('\n')}
</urlset>`;

  return new Response(xml, {
    headers: { 'Content-Type': 'application/xml; charset=utf-8' },
  });
};