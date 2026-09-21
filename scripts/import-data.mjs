// Importa los CSV de data/ a JSON en src/data/ con validación de integridad.
// Se puede ejecutar de nuevo cuantas veces se quiera: escribe los JSON desde cero.
// Uso: npm run import:data

import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import { parse } from 'csv-parse/sync';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const DATA_DIR = path.join(ROOT, 'data');
const OUT_DIR = path.join(ROOT, 'src', 'data');

const EMPTY = (value) => (value ?? '').trim() === '';

function readCsv(filename) {
  const raw = readFile(path.join(DATA_DIR, filename), 'utf8');
  return raw.then((content) => parse(content, { columns: true, skip_empty_lines: true }));
}

function mapRows(rows) {
  return rows.map((row) => {
    const out = {};
    for (const [key, value] of Object.entries(row)) {
      out[key] = (value ?? '').trim() === '' ? null : value.trim();
    }
    return out;
  });
}

function fail(errors) {
  console.error('\nImportación cancelada. Errores encontrados:');
  for (const error of errors) console.error(`  - ${error}`);
  process.exit(1);
}

async function main() {
  const [providersRaw, routesRaw, stopsRaw, activitiesRaw] = await Promise.all([
    readCsv('proveedores.csv'),
    readCsv('rutas.csv'),
    readCsv('paradas.csv'),
    readCsv('actividades.csv'),
  ]);

  const providers = mapRows(providersRaw);
  const routes = mapRows(routesRaw);
  const stops = mapRows(stopsRaw);
  const activities = mapRows(activitiesRaw);

  const errors = [];

  const providerIds = new Set(providers.map((p) => p.id));
  const routeIds = new Set(routes.map((r) => r.ruta_id));

  const providersWithEstadoNoPublicar = providers
    .filter((p) => p.estado === 'No publicar')
    .map((p) => p.id)
    .sort();
  if (providersWithEstadoNoPublicar.length) {
    console.warn(`Aviso: proveedores "No publicar" (se conservan en JSON, no se muestran en el sitio): ${providersWithEstadoNoPublicar.join(', ')}`);
  }

  for (const stop of stops) {
    if (!providerIds.has(stop.proveedor_id)) {
      errors.push(`Parada ${stop.ruta_id}/${stop.orden}: proveedor_id "${stop.proveedor_id}" no existe en proveedores.csv.`);
    }
    if (!routeIds.has(stop.ruta_id)) {
      errors.push(`Parada ${stop.ruta_id}/${stop.orden}: ruta_id "${stop.ruta_id}" no existe en rutas.csv.`);
    }
    if (stop.orden !== '1' && EMPTY(stop.km_desde_anterior)) {
      errors.push(`Parada ${stop.ruta_id}/${stop.orden}: falta km_desde_anterior.`);
    }
  }

  for (const activity of activities) {
    if (activity.proveedor_id && !providerIds.has(activity.proveedor_id)) {
      errors.push(`Actividad ${activity.actividad_id}: proveedor_id "${activity.proveedor_id}" no existe en proveedores.csv.`);
    }
  }

  for (const route of routes) {
    const realStops = stops.filter((s) => s.ruta_id === route.ruta_id).sort((a, b) => Number(a.orden) - Number(b.orden));
    const expected = Number(route.n_paradas);
    const real = realStops.length;
    if (expected !== real) {
      errors.push(`Ruta ${route.ruta_id}: n_paradas dice ${expected} pero hay ${real} filas en paradas.csv.`);
    }
    const badOrder = realStops.filter((s, i) => Number(s.orden) !== i + 1);
    if (badOrder.length) {
      errors.push(`Ruta ${route.ruta_id}: el orden de paradas no es 1..n.`);
    }
  }

  const duplicates = (rows, idField, label) => {
    const seen = new Map();
    for (const row of rows) {
      if (row[idField] == null) continue;
      if (seen.has(row[idField])) errors.push(`${label} duplicado: ${row[idField]}.`);
      seen.set(row[idField], true);
    }
  };
  duplicates(providers, 'id', 'Proveedor');
  duplicates(routes, 'ruta_id', 'Ruta');
  duplicates(activities, 'actividad_id', 'Actividad');

  if (errors.length) fail(errors);

  const subcategoriesByCategory = {};
  for (const p of providers) {
    if (!p.categoria) continue;
    subcategoriesByCategory[p.categoria] ??= new Set();
    if (p.subcategoria) subcategoriesByCategory[p.categoria].add(p.subcategoria);
  }
  const categories = Object.keys(subcategoriesByCategory).map((name) => ({
    name,
    subcategories: [...subcategoriesByCategory[name]].sort((a, b) => a.localeCompare(b, 'es')),
  }));
  const municipalities = [...new Set(providers.map((p) => p.municipio).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  const zones = [...new Set(providers.map((p) => p.zona).filter(Boolean))];

  await mkdir(OUT_DIR, { recursive: true });

  await Promise.all([
    writeFile(path.join(OUT_DIR, 'proveedores.json'), JSON.stringify(providers, null, 2)),
    writeFile(path.join(OUT_DIR, 'rutas.json'), JSON.stringify(routes, null, 2)),
    writeFile(path.join(OUT_DIR, 'paradas.json'), JSON.stringify(stops, null, 2)),
    writeFile(path.join(OUT_DIR, 'actividades.json'), JSON.stringify(activities, null, 2)),
    writeFile(
      path.join(OUT_DIR, 'indice.json'),
      JSON.stringify({ categorias: categories, municipios: municipalities, zonas: zones }, null, 2),
    ),
  ]);

  console.log(`OK: ${providers.length} proveedores, ${routes.length} rutas, ${stops.length} paradas, ${activities.length} actividades.`);
  console.log(`Escritos ${OUT_DIR}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});