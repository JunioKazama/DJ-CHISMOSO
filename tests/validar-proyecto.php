<?php
declare(strict_types=1);

/**
 * Pruebas de humo estáticas para verificar la estructura básica de DJ CHISMOSO.
 * No requieren conexión a MySQL ni credenciales de producción.
 */
$root = dirname(__DIR__);
$hosting = $root . DIRECTORY_SEPARATOR . 'hosting';

$checks = [
    'Página principal disponible' => $hosting . '/index.php',
    'API disponible' => $hosting . '/api.php',
    'JavaScript principal disponible' => $hosting . '/app.js',
    'Hoja de estilos disponible' => $hosting . '/styles.css',
    'Configuración de ejemplo disponible' => $hosting . '/config.example.php',
];

$failed = 0;
foreach ($checks as $label => $path) {
    if (is_file($path) && filesize($path) > 0) {
        echo "[OK] {$label}\n";
    } else {
        echo "[ERROR] {$label}\n";
        $failed++;
    }
}

$api = file_get_contents($hosting . '/api.php');
$index = file_get_contents($hosting . '/index.php');
$app = file_get_contents($hosting . '/app.js');

$sourceChecks = [
    'La API contiene autenticación por sesión' => str_contains($api, "case 'get_session'"),
    'La API contiene registro de usuarios' => str_contains($api, "case 'register'"),
    'La API contiene inicio de sesión' => str_contains($api, "case 'login'"),
    'La API contiene consulta de publicaciones' => str_contains($api, "case 'get_posts'"),
    'La interfaz solicita la sesión al backend' => str_contains($app, 'get_session'),
    'La interfaz consulta publicaciones' => str_contains($app, 'get_posts'),
    'La página principal carga la configuración' => str_contains($index, "require_once 'config.php'"),
];

foreach ($sourceChecks as $label => $passed) {
    if ($passed) {
        echo "[OK] {$label}\n";
    } else {
        echo "[ERROR] {$label}\n";
        $failed++;
    }
}

if ($failed > 0) {
    fwrite(STDERR, "\nResultado: {$failed} comprobación(es) fallaron.\n");
    exit(1);
}

echo "\nTodas las pruebas de humo finalizaron correctamente.\n";
