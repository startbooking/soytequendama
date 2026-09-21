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
(Cuando elijas la tecnología, completa esta sección: instalar dependencias, importar datos, ejecutar en desarrollo, ejecutar pruebas y construir.)
