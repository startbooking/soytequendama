<?php
// Creates or updates a user in the usuarios table.
// Reads DB_HOST, DB_USER, DB_PASSWORD, DB_NAME and SUPER_ADMIN_EMAIL /
// SUPER_ADMIN_PASSWORD from the .env file at the repo root (or from the
// environment). Uses password_hash(), so the stored hash is verifiable by
// password_verify() in the PHP API.
//
// CLI arguments override the .env values:
//   php scripts/crear-usuario.php --email=x@example.com --password=clave --nombre=Nombre --rol=admin
//
// Roles: super-admin, admin, turista.

function envValor(array $env, string $clave, string $fallback = ''): string
{
    $valor = getenv($clave);
    if ($valor === false) {
        $valor = $env[$clave] ?? $fallback;
    }
    return $valor === false || $valor === null ? $fallback : trim((string) $valor);
}

$env = [];
$raiz = dirname(__DIR__);
$archivoEnv = $raiz . '/.env';
if (is_file($archivoEnv)) {
    foreach (file($archivoEnv, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) as $linea) {
        if (preg_match('/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/', $linea, $m)) {
            $env[$m[1]] = trim($m[2], "\"'");
        }
    }
}

$host = envValor($env, 'DB_HOST');
$user = envValor($env, 'DB_USER');
$pass = envValor($env, 'DB_PASSWORD');
$base = envValor($env, 'DB_NAME', 'mi_region_tequendama');

if ($host === '' || $user === '') {
    fwrite(STDERR, "Faltan DB_HOST/DB_USER en .env o en el entorno.\n");
    exit(1);
}

$opts = getopt('', ['email:', 'password:', 'nombre:', 'rol:']);
$email = $opts['email'] ?? envValor($env, 'SUPER_ADMIN_EMAIL');
$clave = $opts['password'] ?? envValor($env, 'SUPER_ADMIN_PASSWORD');
$nombre = $opts['nombre'] ?? 'Administrador';
$rol = $opts['rol'] ?? 'super-admin';

$roles = ['super-admin', 'admin', 'turista'];
if (!in_array($rol, $roles, true)) {
    fwrite(STDERR, 'Rol inválido. Usa: super-admin, admin o turista.' . "\n");
    exit(1);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    fwrite(STDERR, "Email inválido: {$email}\n");
    exit(1);
}
if (strlen($clave) < 8) {
    fwrite(STDERR, "La contraseña debe tener al menos 8 caracteres.\n");
    exit(1);
}

try {
    $pdo = new PDO(
        "mysql:host={$host};dbname={$base};charset=utf8mb4",
        $user,
        $pass,
        [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]
    );

    $hash = password_hash($clave, PASSWORD_BCRYPT);

    $pdo->prepare('INSERT INTO usuarios (nombre, email, password_hash, rol) VALUES (?, ?, ?, ?)
        ON DUPLICATE KEY UPDATE nombre = VALUES(nombre), password_hash = VALUES(password_hash), rol = VALUES(rol)')
        ->execute([$nombre, $email, $hash, $rol]);

    echo "✓ Usuario '{$email}' ({$rol}) creado/actualizado en {$host}/{$base}.\n";
} catch (PDOException $e) {
    fwrite(STDERR, '✗ Error de MySQL: ' . $e->getMessage() . "\n");
    exit(1);
}