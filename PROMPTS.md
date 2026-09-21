# Cómo usar OpenCode para construir "Mi Región del Tequendama"

## 0. Preparar la carpeta (una sola vez)

```bash
mkdir mi-region-tequendama && cd mi-region-tequendama
unzip ~/Descargas/opencode_tequendama.zip     # deja AGENTS.md, PROMPTS.md y data/ aquí
git init && git add . && git commit -m "Datos iniciales"
opencode
```

- AGENTS.md ya trae las reglas del proyecto. OpenCode lo lee en cada sesión, por eso los mensajes de abajo son cortos.
- Con la Tab cambias entre modo Plan (solo analiza, no modifica archivos) y modo Build (puede editar y ejecutar).
- Con @ escribes la ruta de un archivo para que OpenCode lo lea.
- Elige un modelo con buen desempeño en código. OpenCode permite varios proveedores.

## 1. Primer mensaje (en modo Plan)

```
Lee AGENTS.md y estos archivos: @data/proveedores.csv, @data/rutas.csv, @data/paradas.csv y @data/actividades.csv.

Quiero construir "Mi Región del Tequendama", una app web en español para turistas, mobile-first, con el directorio de proveedores, las rutas y las actividades de la provincia del Tequendama.

No escribas código todavía. Propón:
1. La tecnología que elegirías y por qué, en tres líneas. Prefiero lo más simple y mantenible.
2. La estructura de carpetas.
3. El modelo de datos y cómo se importan los CSV. El script de importación debe poder ejecutarse de nuevo cuando yo actualice los archivos.
4. Un plan de 5 etapas y qué queda funcionando al final de cada una.
5. Problemas o dudas que veas en los datos.

La etapa 1 debe incluir: inicio con buscador y accesos por categoría y municipio; lista de proveedores con filtros por categoría, subcategoría y municipio; ficha de cada proveedor con datos, horario, precio, botón de llamada o WhatsApp y enlace a Google Maps.

Espera mi confirmación antes de construir.
```

Revisa el plan, pide cambios en el mismo modo Plan y, cuando estés de acuerdo, pasa al paso 2.

## 2. Construir la etapa 1 (pulsa Tab para pasar a modo Build)

```
Perfecto. Construye solo la etapa 1 del plan.
Al terminar: ejecuta las pruebas o el linter, dime cómo correr la app en mi computador y completa la sección "Comandos" de AGENTS.md.
```

Cuando termine, prueba la app en el navegador y guarda una versión con git antes de seguir.

## 3. Comprobar la etapa 1

```
Revisa lo que construiste contra las reglas de AGENTS.md. Confirma que:
- no aparece ningún proveedor con estado "No publicar";
- "Por definir" y "Consultar con el proveedor" se muestran tal cual;
- los proveedores sin foto muestran la imagen genérica;
- la app funciona bien en pantalla de celular.
Lista lo que no cumpla y corrígelo.
```

## 4. Etapas siguientes (cada una: Plan, revisar, Build)

**Etapa 2 – Mapa**
```
Etapa 2: agrega un mapa con todos los proveedores, con filtro por categoría y popup con enlace a la ficha. Propón primero qué librería de mapas usar y si necesita clave de API. No uses claves dentro del código.
```

**Etapa 3 – Rutas**
```
Etapa 3: agrega la lista de rutas y el detalle de cada una con sus paradas en orden, el tipo de parada, los km entre paradas y la ruta dibujada en el mapa. Usa la etiqueta "Ruta sugerida" y aclara que los km son en línea recta.
```

**Etapa 4 – Actividades**
```
Etapa 4: agrega la lista de actividades con filtros por tipo y municipio. Cada actividad debe enlazar con la ficha de su proveedor, y cada ficha debe mostrar las actividades que ofrece.
```

**Etapa 5 – Administración y publicación**
```
Etapa 5: agrega un panel de administración con inicio de sesión para crear, editar y ocultar proveedores, rutas y actividades. Después, propón cómo publicar la app en internet y qué hace falta (dominio, hosting, variables de entorno). No publiques nada sin mi confirmación.
```

## Consejos
- Un plan y una etapa por sesión de trabajo. Si la conversación se hace larga, abre una sesión nueva: AGENTS.md conserva el contexto.
- Guarda una versión con git antes de cada etapa.
- Si algo sale mal, pídele en modo Plan que explique qué pasó antes de dejar que edite.
- Cuando OpenCode repita un error, dile qué archivo y qué mensaje ves.
- Antes de publicar: confirma con cada proveedor que acepta estar listado, verifica su RNT y usa fotos propias o autorizadas.
