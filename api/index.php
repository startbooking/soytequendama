<?php
// REST endpoint: Mi Región del Tequendama.
// Served by Apache at /api (FallbackResource -> /api/index.php).
//
//   GET  /api/proveedores                 lista (filtros: categoria, municipio, subcategoria, zona)
//   GET  /api/proveedores/{id}            un proveedor
//   GET  /api/rutas                       lista de rutas
//   GET  /api/rutas/{ruta_id}/paradas     paradas de una ruta (con datos del proveedor)
//   GET  /api/actividades                 lista de actividades
//   POST /api/usuarios/login              { email, password } -> { usuario: { id, nombre, email, rol } }
//   GET  /api/                            índices de endpoints

require __DIR__ . '/config.php';

function cuerpo_json(): array
{
    $raw = file_get_contents('php://input');
    $datos = json_decode($raw ?: '{}', true);
    return is_array($datos) ? $datos : [];
}

function limpiar_filtro(string $seccion): array
{
    $permitidos = [
        'proveedores' => ['categoria', 'municipio', 'subcategoria', 'zona'],
        'rutas' => ['tipo', 'municipios', 'dificultad'],
        'actividades' => ['tipo', 'municipio', 'dificultad'],
    ];
    $filtros = [];
    foreach ($permitidos[$seccion] as $campo) {
        $valor = $_GET[$campo] ?? '';
        if ($valor !== '') {
            $filtros[$campo] = $valor;
        }
    }
    // Nunca exponer proveedores marcados como "No publicar".
    if ($seccion === 'proveedores') {
        $filtros['estado[!]'] = 'No publicar';
    }
    return $filtros;
}

$uri = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH) ?? '/api';
$sinApi = str_starts_with($uri, '/api') ? substr($uri, strlen('/api')) : $uri;
$path = preg_split('#/+#', trim($sinApi, '/')) ?: [];
$path = array_values(array_filter($path, fn($s) => $s !== ''));
$metodo = $_SERVER['REQUEST_METHOD'];

// ---------------------------------------------------------------- índices
if ($path === []) {
    enviar_json(200, [
        'nombre' => 'Mi Región del Tequendama - API',
        'endpoints' => [
            'GET /api/proveedores',
            'GET /api/proveedores/{id}',
            'GET /api/rutas',
            'GET /api/rutas/{ruta_id}/paradas',
            'GET /api/actividades',
            'POST /api/usuarios/login',
        ],
    ]);
}

// ---------------------------------------------------------------- proveedores
if ($path[0] === 'proveedores') {
    if ($metodo !== 'GET') {
        enviar_json(405, ['error' => 'Método no permitido']);
    }
    if (count($path) === 1) {
        $orden = ['categoria' => 'ASC', 'nombre' => 'ASC'];
        $lista = $db->select('proveedores', '*', array_merge(limpiar_filtro('proveedores'), ['ORDER' => $orden]));
        enviar_json(200, ['conteo' => count($lista), 'proveedores' => $lista]);
    }
    if (count($path) === 2) {
        $id = $path[1];
        $reg = $db->get('proveedores', '*', ['AND' => ['id' => $id, 'estado[!]' => 'No publicar']]);
        if (!$reg) {
            enviar_json(404, ['error' => 'Proveedor no encontrado']);
        }
        enviar_json(200, ['proveedor' => $reg]);
    }
    enviar_json(404, ['error' => 'Ruta no válida']);
}

// ---------------------------------------------------------------- rutas
if ($path[0] === 'rutas') {
    if ($metodo !== 'GET') {
        enviar_json(405, ['error' => 'Método no permitido']);
    }
    if (count($path) === 1) {
        $lista = $db->select('rutas', '*', array_merge(limpiar_filtro('rutas'), ['ORDER' => 'nombre']));
        foreach ($lista as &$r) {
            $r['km_linea_recta'] = $r['km_linea_recta'] !== null ? (float) $r['km_linea_recta'] : null;
            unset($r);
        }
        enviar_json(200, ['conteo' => count($lista), 'rutas' => $lista]);
    }
    if (count($path) === 3 && $path[2] === 'paradas') {
        $rutaId = $path[1];
        $ruta = $db->get('rutas', ['ruta_id', 'nombre'], ['ruta_id' => $rutaId]);
        if (!$ruta) {
            enviar_json(404, ['error' => 'Ruta no encontrada']);
        }
        $paradas = $db->select('paradas', [
            '[><]proveedores' => ['proveedor_id' => 'id'],
        ], [
            'paradas.ruta_id',
            'paradas.orden',
            'paradas.proveedor_id',
            'paradas.nombre',
            'paradas.tipo_parada',
            'paradas.municipio',
            'paradas.latitud',
            'paradas.longitud',
            'paradas.km_desde_anterior',
            'paradas.nota',
            'proveedores.nombre(proveedor_nombre)',
            'proveedores.categoria(proveedor_categoria)',
        ], ['paradas.ruta_id' => $rutaId, 'ORDER' => 'paradas.orden']);
        enviar_json(200, ['ruta' => $ruta, 'conteo' => count($paradas), 'paradas' => $paradas]);
    }
    enviar_json(404, ['error' => 'Ruta no válida']);
}

// ---------------------------------------------------------------- actividades
if ($path[0] === 'actividades' && count($path) === 1) {
    if ($metodo !== 'GET') {
        enviar_json(405, ['error' => 'Método no permitido']);
    }
    $lista = $db->select('actividades', '*', array_merge(limpiar_filtro('actividades'), ['ORDER' => 'nombre']));
    enviar_json(200, ['conteo' => count($lista), 'actividades' => $lista]);
}

// ---------------------------------------------------------------- login
if ($path[0] === 'usuarios' && ($path[1] ?? '') === 'login') {
    if ($metodo !== 'POST') {
        enviar_json(405, ['error' => 'Método no permitido']);
    }
    $datos = cuerpo_json();
    $email = trim($datos['email'] ?? '');
    $clave = (string) ($datos['password'] ?? '');
    if ($email === '' || $clave === '') {
        enviar_json(400, ['error' => 'Campos email y password requeridos']);
    }
    $usuario = $db->get('usuarios', ['id', 'nombre', 'email', 'password_hash', 'rol'], ['email' => $email]);
    if (!$usuario || !password_verify($clave, $usuario['password_hash'])) {
        enviar_json(401, ['error' => 'Credenciales inválidas']);
    }
    unset($usuario['password_hash']);
    enviar_json(200, ['usuario' => $usuario]);
}

enviar_json(404, ['error' => 'Endpoint no encontrado']);