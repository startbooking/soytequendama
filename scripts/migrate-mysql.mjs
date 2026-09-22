#!/usr/bin/env node
// Migrates the imported data (src/data/*.json) to a MySQL database.
// - Always writes migracion.sql (schema + data) at the repo root.
// - If DB settings are present (env or .env) and the mysql CLI exists, it also
//   applies the script to the database.
//
// Extras: ADMIN_PASSWORD in .env is NOT read here; the migration only needs
// DB_HOST, DB_PORT, DB_USER, DB_PASSWORD and DB_NAME.

import { readFileSync, writeFileSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');

// Tiny .env loader (no dependencies).
try {
  const env = readFileSync(join(root, '.env'), 'utf8');
  for (const line of env.split('\n')) {
    const m = line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/);
    if (m && !(m[1] in process.env)) {
      process.env[m[1]] = m[2].replace(/^["']|["']$/g, '');
    }
  }
} catch {
  /* no .env file */
}

const leer = (f) => JSON.parse(readFileSync(join(root, 'src', 'data', f), 'utf8'));

const proveedores = leer('proveedores.json');
const rutas = leer('rutas.json');
const paradas = leer('paradas.json');
const actividades = leer('actividades.json');

const DB_NAME = process.env.DB_NAME || 'mi_region_tequendama';

function q(v) {
  if (v === null || v === undefined || v === '') return 'NULL';
  return `'${String(v).replaceAll("'", "''")}'`;
}

function f(v) {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : 'NULL';
}

function int(v) {
  const n = Number(v);
  return Number.isInteger(n) ? String(n) : 'NULL';
}

const sql = [];
sql.push(`CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;`);
sql.push(`USE \`${DB_NAME}\`;`);
sql.push(`
CREATE TABLE IF NOT EXISTS proveedores (
  id VARCHAR(16) NOT NULL,
  categoria VARCHAR(40) NOT NULL,
  subcategoria VARCHAR(80) DEFAULT NULL,
  nombre VARCHAR(200) NOT NULL,
  municipio VARCHAR(80) NOT NULL,
  zona VARCHAR(80) DEFAULT NULL,
  direccion VARCHAR(255) DEFAULT NULL,
  latitud DECIMAL(10,7) DEFAULT NULL,
  longitud DECIMAL(10,7) DEFAULT NULL,
  telefono VARCHAR(40) DEFAULT NULL,
  sitio_web VARCHAR(255) DEFAULT NULL,
  horario VARCHAR(120) DEFAULT NULL,
  nivel_precio VARCHAR(40) DEFAULT NULL,
  precio_referencial VARCHAR(120) DEFAULT NULL,
  google_maps_url VARCHAR(500) DEFAULT NULL,
  place_id VARCHAR(120) DEFAULT NULL,
  rnt VARCHAR(40) DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  foto_url VARCHAR(500) DEFAULT NULL,
  estado VARCHAR(30) NOT NULL,
  notas TEXT DEFAULT NULL,
  PRIMARY KEY (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS rutas (
  ruta_id VARCHAR(12) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  municipios VARCHAR(200) DEFAULT NULL,
  tipo VARCHAR(80) DEFAULT NULL,
  duracion_sugerida VARCHAR(80) DEFAULT NULL,
  dificultad VARCHAR(40) DEFAULT NULL,
  publico VARCHAR(160) DEFAULT NULL,
  descripcion TEXT DEFAULT NULL,
  n_paradas INT DEFAULT NULL,
  km_linea_recta DECIMAL(7,2) DEFAULT NULL,
  estado VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (ruta_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS paradas (
  id INT NOT NULL AUTO_INCREMENT,
  ruta_id VARCHAR(12) NOT NULL,
  orden INT DEFAULT NULL,
  proveedor_id VARCHAR(16) DEFAULT NULL,
  nombre VARCHAR(200) DEFAULT NULL,
  tipo_parada VARCHAR(40) DEFAULT NULL,
  municipio VARCHAR(80) DEFAULT NULL,
  latitud DECIMAL(10,7) DEFAULT NULL,
  longitud DECIMAL(10,7) DEFAULT NULL,
  km_desde_anterior DECIMAL(7,2) DEFAULT NULL,
  nota VARCHAR(255) DEFAULT NULL,
  PRIMARY KEY (id),
  KEY idx_paradas_ruta (ruta_id),
  KEY idx_paradas_proveedor (proveedor_id),
  CONSTRAINT fk_paradas_ruta FOREIGN KEY (ruta_id) REFERENCES rutas (ruta_id),
  CONSTRAINT fk_paradas_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS actividades (
  actividad_id VARCHAR(12) NOT NULL,
  nombre VARCHAR(200) NOT NULL,
  tipo VARCHAR(80) DEFAULT NULL,
  municipio VARCHAR(80) DEFAULT NULL,
  proveedor_id VARCHAR(16) DEFAULT NULL,
  proveedor VARCHAR(120) DEFAULT NULL,
  duracion VARCHAR(80) DEFAULT NULL,
  dificultad VARCHAR(40) DEFAULT NULL,
  precio VARCHAR(120) DEFAULT NULL,
  notas VARCHAR(255) DEFAULT NULL,
  estado VARCHAR(20) DEFAULT NULL,
  PRIMARY KEY (actividad_id),
  KEY idx_actividades_proveedor (proveedor_id),
  CONSTRAINT fk_actividades_proveedor FOREIGN KEY (proveedor_id) REFERENCES proveedores (id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
`);

sql.push('SET FOREIGN_KEY_CHECKS=0;');
sql.push('TRUNCATE TABLE paradas;');
sql.push('TRUNCATE TABLE actividades;');
sql.push('TRUNCATE TABLE rutas;');
sql.push('TRUNCATE TABLE proveedores;');
sql.push('SET FOREIGN_KEY_CHECKS=1;');

const cols = (obj, names) => names.map((n) => q(obj[n] ?? null)).join(', ');

for (const p of proveedores) {
  sql.push(
    `INSERT INTO proveedores (id, categoria, subcategoria, nombre, municipio, zona, direccion, latitud, longitud, telefono, sitio_web, horario, nivel_precio, precio_referencial, google_maps_url, place_id, rnt, descripcion, foto_url, estado, notas) VALUES (${cols(p, [
      'id', 'categoria', 'subcategoria', 'nombre', 'municipio', 'zona', 'direccion',
    ])}, ${f(p.latitud)}, ${f(p.longitud)}, ${cols(p, ['telefono', 'sitio_web', 'horario', 'nivel_precio', 'precio_referencial', 'google_maps_url', 'place_id', 'rnt', 'descripcion', 'foto_url', 'estado', 'notas'])});`
  );
}

for (const r of rutas) {
  sql.push(
    `INSERT INTO rutas (ruta_id, nombre, municipios, tipo, duracion_sugerida, dificultad, publico, descripcion, n_paradas, km_linea_recta, estado) VALUES (${cols(r, [
      'ruta_id', 'nombre', 'municipios', 'tipo', 'duracion_sugerida', 'dificultad', 'publico', 'descripcion',
    ])}, ${int(r.n_paradas)}, ${f(r.km_linea_recta)}, ${q(r.estado ?? null)});`
  );
}

for (const s of paradas) {
  sql.push(
    `INSERT INTO paradas (ruta_id, ord, proveedor_id, nombre, tipo_parada, municipio, latitud, longitud, km_desde_anterior, nota) VALUES (${q(s.ruta_id)}, ${int(s.orden)}, ${q(s.proveedor_id ?? null)}, ${q(s.nombre ?? null)}, ${q(s.tipo_parada ?? null)}, ${q(s.municipio ?? null)}, ${f(s.latitud)}, ${f(s.longitud)}, ${f(s.km_desde_anterior)}, ${q(s.nota ?? null)});`
  );
}

for (const a of actividades) {
  sql.push(
    `INSERT INTO actividades (actividad_id, nombre, tipo, municipio, proveedor_id, proveedor, duracion, dificultad, precio, notas, estado) VALUES (${cols(a, [
      'actividad_id', 'nombre', 'tipo', 'municipio', 'proveedor_id', 'proveedor', 'duracion', 'dificultad', 'precio', 'notas', 'estado',
    ])});`
  );
}

const salida = sql.join('\n') + '\n';
const archivo = join(root, 'migracion.sql');
writeFileSync(archivo, salida, 'utf8');

const resumen = `Proveedores: ${proveedores.length} · Rutas: ${rutas.length} · Paradas: ${paradas.length} · Actividades: ${actividades.length}`;
console.log(`✓ migracion.sql generado (${resumen})`);

const host = process.env.DB_HOST;
const user = process.env.DB_USER;
const pass = process.env.DB_PASSWORD ?? '';
const port = process.env.DB_PORT || '3306';
const bind = process.env.DB_BIND || false; // optional --default-character-set

if (host && user) {
  const args = ['--host=' + host, '--port=' + port, '--user=' + user, '--database=' + DB_NAME];
  if (bind) args.push('--default-character-set=utf8mb4');
  const run = spawnSync('mysql', args, {
    input: salida,
    encoding: 'utf8',
    env: { ...process.env, MYSQL_PWD: pass },
    stdio: ['pipe', 'pipe', 'pipe'],
  });
  if (run.error) {
    console.error(`✗ No se pudo ejecutar mysql: ${run.error.message}`);
  } else if (run.status !== 0) {
    console.error(`✗ MySQL rechazó la migración (código ${run.status}):`);
    process.stderr.write(run.stderr || run.stdout || '');
  } else {
    console.log(`✓ Aplicada a MySQL en ${host}:${port}/${DB_NAME}`);
  }
} else {
  console.log('Sin credenciales de DB; el archivo migracion.sql quedó listo.');
  console.log('Aplícalo a mano con:');
  console.log(`  mysql --host=TU_HOST --user=TU_USUARIO --password < migracion.sql`);
  console.log('o define DB_HOST, DB_USER y DB_PASSWORD (y opcional DB_NAME) en .env y vuelve a ejecutar.');
}