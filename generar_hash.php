<?php
/**
 * DJ CHISMOSO - Generador de archivo SQL con contraseñas reales
 * 
 * INSTRUCCIONES:
 * 1. Sube este archivo a tu servidor Hostinger
 * 2. Ábrelo en el navegador: https://tudominio.com/generar_hash.php
 * 3. Copia el hash que aparece en pantalla
 * 4. Úsalo para reemplazar los hashes en dj_chismoso.sql ANTES de importar
 *    O simplemente ejecuta db_setup.php directamente desde el navegador.
 */

echo "<h2>Hash bcrypt de '123456' para DJ CHISMOSO:</h2>";
$hash = password_hash("123456", PASSWORD_DEFAULT);
echo "<pre style='background:#111;color:#1ed760;padding:20px;border-radius:10px;font-size:1.2rem;'>" . $hash . "</pre>";
echo "<p>Copia este hash y reemplázalo en las líneas INSERT del archivo dj_chismoso.sql</p>";
echo "<hr>";
echo "<h3>¿O prefieres la opción fácil?</h3>";
echo "<p>Simplemente sube todos los archivos de la carpeta <strong>hosting/</strong> a tu servidor y visita <code>db_setup.php</code> en tu navegador. Ese script crea las tablas y los datos automáticamente con contraseñas correctas.</p>";
?>
