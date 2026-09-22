<?php
// API bootstrap: reads .env at the repo root, opens a Medoo connection and
// prepares JSON/CORS headers. Every endpoint file should require this.

require __DIR__ . '/vendor/autoload.php';

use Medoo\Medoo;

function env_valor(string $clave, string $fallback = ''): string
{
    $valor = getenv($clave);
    if ($valor === false) {
        $valor = $GLOBALS['__env'][$clave] ?? $fallback;
    }
    return (string) $valor;
}

$GLOBALS['__env'] = [];
$envFile = dirname(__DIR__) . '/.env';
if (is_file($envFile)) {
    foreach (file($envFile, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        if (preg_match('/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/', $linea, $m)) {
            $GLOBALS['__env'][$m[1]] = trim($m[2], "\"'");
        }
    }
}

header('Content-Type: application/json; charset=utf-8');
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: GET, POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

$host = env_valor('DB_HOST');
$user = env_valor('DB_USER');
$pass = env_valor('DB_PASSWORD');
$base = env_valor('DB_NAME', 'mi_region_tequendama');

if ($host === '' || $user === '') {
    enviar_json(500, ['error' => 'API sin configurar: faltan DB_HOST/DB_USER en .env']);
}

function enviar_json(int $codigo, array $datos): never
{
    http_response_code($codigo);
    echo json_encode($datos, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

try {
    $db = new Medoo([
        'type' => 'mysql',
        'host' => $host,
        'database' => $base,
        'username' => $user,
        'password' => $pass,
        'charset' => 'utf8mb4',
        'collation' => 'utf8mb4_unicode_ci',
    ]);
} catch (Throwable $e) {
    enviar_json(500, ['error' => 'No se pudo conectar a la base de datos', 'detalle' => $e->getMessage()]);
}