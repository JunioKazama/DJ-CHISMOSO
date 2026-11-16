<?php
/**
 * DJ CHISMOSO - Configuración de Base de Datos y Sesiones.
 *
 * Copia este archivo como config.php y completa los valores de tu entorno.
 * IMPORTANTE: config.php contiene credenciales privadas y no debe publicarse.
 */

if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuración MySQL
define('DB_HOST', 'localhost');
define('DB_USER', 'TU_USUARIO_MYSQL');
define('DB_PASS', 'TU_CONTRASENA_MYSQL');
define('DB_NAME', 'TU_BASE_DE_DATOS');

// Configuración Spotify OAuth
define('SPOTIFY_CLIENT_ID', 'TU_SPOTIFY_CLIENT_ID');
define('SPOTIFY_CLIENT_SECRET', 'TU_SPOTIFY_CLIENT_SECRET');
define('SPOTIFY_REDIRECT_URI', 'https://TU_DOMINIO/api.php?action=spotify_callback');

// Conexión PDO
$pdo = null;

try {
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    if ($e->getCode() == 1049) {
        try {
            $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
            $pdo_no_db = new PDO($dsn_no_db, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
        } catch (PDOException $e2) {
            die("Error de conexión al servidor MySQL: " . $e2->getMessage());
        }
    } else {
        die("Error de conexión a la base de datos. Verifica la configuración MySQL.");
    }
}

function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

function getLoggedInUser() {
    global $pdo;
    if (!isLoggedIn()) return null;

    $stmt = $pdo->prepare("SELECT id, username, avatar, bio, featured_track, created_at, spotify_account_id FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}
?>
