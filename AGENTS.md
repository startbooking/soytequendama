# Mi Región del Tequendama

Aplicación web de directorio turístico de la provincia del Tequendama (Cundinamarca, Colombia): proveedores, rutas y actividades.

## Idioma y público
- Toda la interfaz va en español. El código, los nombres de variables y los commits van en inglés.
- Diseño mobile-first: la mayoría de usuarios entrará desde el celular.
- Estilo: moderno y limpio, colores verdes y cálidos, tarjetas con esquinas redondeadas, textos grandes y buen contraste.

## Datos (carpeta data/, CSV en UTF-8)
- `proveedores.csv`: id, categoria, subcategoria, nombre, municipio, zona, direccion, latitud, longitud, telefono, sitio_web, horario, nivel_precio, precio_referencial, google_maps_url, place_id, rnt, descripcion, foto_url, estado, notas.
  - categoria: Hospedaje, Restaurante, Atractivo turístico o Agencia / Operador.
- `rutas.csv`: ruta_id, nombre, municipios, tipo, duracion_sugerida, dificultad, publico, descripcion, n_paradas, km_linea_recta, estado.
- `paradas.csv`: ruta_id, orden, proveedor_id, nombre, tipo_parada, municipio, latitud, longitud, km_desde_anterior, nota.
- `actividades.csv`: actividad_id, nombre, tipo, municipio, proveedor_id, proveedor, duracion, dificultad, precio, notas, estado.
- Relaciones: paradas.proveedor_id y actividades.proveedor_id apuntan a proveedores.id; paradas.ruta_id apunta a rutas.ruta_id.

## Reglas sobre los datos (obligatorias)
- Usa solo los datos de data/. No inventes proveedores, precios, horarios, fotos ni descripciones.
- No muestres proveedores con estado "No publicar".
- Muestra "Por definir" y "Consultar con el proveedor" tal cual; no los rellenes.
- Las rutas y actividades están en Borrador: muéstralas con la etiqueta "Ruta sugerida" o "Actividad sugerida".
- Las distancias de las rutas son en línea recta; indícalo en pantalla.
- Si un proveedor no tiene foto_url, muestra una imagen genérica de su categoría.
- Muestra el RNT cuando exista.
- No copies fotos ni reseñas de Google. Las fotos se cargan desde foto_url.
- Las coordenadas vienen de Google Maps y pueden desactualizarse: guárdalas como datos editables y deja lista la opción de refrescarlas con place_id.
- Nunca modifiques ni borres los archivos de data/ sin que yo lo pida. Los cambios de datos se hacen en el script de importación.

## Forma de trabajar
- Antes de escribir código, propón un plan y espera mi confirmación.
- Trabaja por etapas pequeñas: una etapa por vez.
- Al terminar cada etapa, dime cómo ejecutarla y cómo probarla, y ejecuta las pruebas o el linter si existen.
- No hagas git commit ni instales dependencias globales sin preguntarme.
- No guardes claves ni secretos en el código: usa variables de entorno y un archivo .env.example.
- Prefiere la solución más simple y mantenible.

## Comandos
Tecnología: Astro 5 (sitio estático) + Node ≥ 18.17 / 20.3 (o ≥ 22). Los datos viven en data/*.csv (fuente de verdad) y se importan a src/data/*.json.

- Instalar dependencias: `npm install`
- Importar datos (CSV → JSON, validando integridad): `npm run import:data`
- Migrar los datos importados a una base MySQL (`scripts/migrate-mysql.mjs`):
  - Genera `migracion.sql` (esquema + datos, tablas truncadas antes de cargar) en la raíz del repo.
  - Con credenciales en `.env` (`DB_HOST`, `DB_USER`, `DB_PASSWORD`, opcional `DB_NAME`) y el CLI `mysql` instalado, además la aplica directo. Copia `.env.example` a `.env` para ver las variables.
  - Crea `mi_region_tequendama` con tablas `proveedores`, `rutas`, `paradas`, `actividades` y `usuarios` (roles `super-admin`/`admin`/`turista`).
  - Crear/actualizar un usuario (`scripts/crear-usuario.php`, usa `password_hash` de PHP): `npm run db:usuario` (usa `SUPER_ADMIN_EMAIL`/`SUPER_ADMIN_PASSWORD` del `.env`) u opciones `--email= --password= --nombre= --rol=`.
- API PHP + Medoo en `api/` (servida por Apache en `/api` vía el vhost; `composer` instalado, vendor versionado):
  - `GET /api/proveedores` (`?categoria=&municipio=&subcategoria=&zona=`, excluye "No publicar"), `GET /api/proveedores/{id}`, `GET /api/rutas`, `GET /api/rutas/{ruta_id}/paradas`, `GET /api/actividades`, `POST /api/usuarios/login` (`{"email","password"}` → `{usuario:{id,nombre,email,rol}}`), `GET /api` (índice).
  - Probar sin Apache: `php -S 127.0.0.1:8787 api/index.php`.
- Panel de administración (`/admin/`): login por contraseña. Configura `ADMIN_PASSWORD` en `.env` (solo su hash SHA-256 se incluye en el build); sin password el panel avisa que no está configurado.
- Ejecutar en desarrollo: `npm run dev` (abre http://localhost:4321)
  - Para probar desde el celular en la misma red: `npm run dev -- --host`
- Verificar tipos y linter de Astro: `npm run check`
- Construir para producción: `npm run build` (genera dist/, ~120 páginas HTML)
- Previsualizar el build: `npm run preview` (o abrir dist/ con el servidor local)
- Desplegar en producción (este computador, requiere sudo): `bash scripts/setup-domain.sh`
  - Actualiza /etc/hosts, instala el vhost de Apache (`deploy/soytequenda.lan.conf`, DocumentRoot `dist/`) y hace relanzar Apache. El sitio queda en http://soytequenda.lan (alias soytequendama.lan).
  - El vhost además expone la API en `/api` (Alias a `api/` con `FallbackResource` → `api/index.php`).
  - Tras un cambio en el código, rehaz el build y la página se actualiza sola en el vhost (Apache sirve `dist/`): `npm run build`

Notas:
- Tras actualizar un CSV: `npm run import:data` → `npm run build`. No edites `src/data/*.json` a mano.
- No hay suite de pruebas automatizadas; la verificación es `npm run check` + revisión manual en el navegador.
- Leaflet está vendored en `public/vendor/leaflet/` (sin CDN); los tiles de OpenStreetMap y las fuentes de Google requieren internet.
- Assets estáticos (no requieren build): `public/favicon.svg`, `public/robots.txt`, `public/vendor/leaflet/`, `public/vendor/sha256.min.js` (SHA-256 para el login de `/admin/` en contexto sin `crypto.subtle`). `public/og.png` (imagen para redes) y `sitemap.xml` se generan/regeneran en el build.
- En desarrollo (`npm run dev`), no se aplica el archivo `public/robots.txt` de forma automática; robots.txt solo importa en producción.

### En tu computador
Pasos para correr el proyecto desde cero en una máquina nueva:
1. Clona el repo y entra: `git clone https://github.com/startbooking/soytequendama.git && cd soytequendama`
2. Instala dependencias: `npm install`
3. Importa los datos: `npm run import:data`
4. Corre el servidor de desarrollo: `npm run dev` → abre http://localhost:4321
5. Para producción local: `npm run build` y luego `npm run preview` (o sirve `dist/` con Apache/nginx).
   - Si quieres el dominio `.lan`, ejecuta `bash scripts/setup-domain.sh` (pide sudo) y entra a http://soytequenda.lan.
