<?php
/**
 * DJ CHISMOSO - Configuración de Base de Datos y Sesiones
 * 
 * Este archivo establece la conexión segura a la base de datos MySQL usando PDO
 * y maneja el inicio de las sesiones de usuario.
 */

// Iniciar la sesión de usuario de forma segura
if (session_status() === PHP_SESSION_NONE) {
    session_start();
}

// Configuración de la base de datos (Fácilmente modificable para Hostinger)
define('DB_HOST', 'localhost');
define('DB_USER', 'u310445577_Junio');
define('DB_PASS', 'K1ax71?y');
define('DB_NAME', 'u310445577_DJ_CHISMOSO');

// Configuración de Spotify OAuth
define('SPOTIFY_CLIENT_ID', '406e0399bfbe4e8d83130c8137994e09'); // Reemplazar con el Client ID de Spotify
define('SPOTIFY_CLIENT_SECRET', 'cac4ba1cffa1490d890553a1a91667a2'); // Reemplazar con el Client Secret de Spotify
define('SPOTIFY_REDIRECT_URI', 'https://quirozweb.com/api.php?action=spotify_callback');

// Conexión PDO a la Base de Datos
$pdo = null;

try {
    // Intentar conectarse a la base de datos específica
    $dsn = "mysql:host=" . DB_HOST . ";dbname=" . DB_NAME . ";charset=utf8mb4";
    $options = [
        PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES   => false,
    ];
    $pdo = new PDO($dsn, DB_USER, DB_PASS, $options);
} catch (PDOException $e) {
    // Si falla porque la base de datos no existe, permitiremos que db_setup.php se conecte
    // al servidor de base de datos sin especificar base de datos para poder crearla.
    if ($e->getCode() == 1049) { // 1049 es "Unknown database" en MySQL
        try {
            $dsn_no_db = "mysql:host=" . DB_HOST . ";charset=utf8mb4";
            $pdo_no_db = new PDO($dsn_no_db, DB_USER, DB_PASS, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
            ]);
            // Dejamos la variable pdo_no_db disponible para db_setup.php
        } catch (PDOException $e2) {
            // Si también falla, el servidor de base de datos está apagado
            die("Error de conexión al servidor MySQL: " . $e2->getMessage());
        }
    } else {
        // Otro tipo de error (usuario incorrecto, contraseña, host, etc.)
        die("Error de conexión a la Base de Datos: " . $e->getMessage());
    }
}

/**
 * Función helper para verificar si el usuario está autenticado
 */
function isLoggedIn() {
    return isset($_SESSION['user_id']);
}

/**
 * Función helper para obtener los datos del usuario logueado
 */
function getLoggedInUser() {
    global $pdo;
    if (!isLoggedIn()) return null;
    
    $stmt = $pdo->prepare("SELECT id, username, avatar, created_at, spotify_account_id FROM users WHERE id = ?");
    $stmt->execute([$_SESSION['user_id']]);
    return $stmt->fetch();
}
?>
