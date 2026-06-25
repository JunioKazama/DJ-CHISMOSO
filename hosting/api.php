<?php
/**
 * DJ CHISMOSO - API de Backend (JSON) - HOSTINGER
 * 
 * Este archivo centraliza todas las operaciones de backend y las expone en formato JSON
 * para soportar interacciones frontend dinámicas mediante Fetch API (AJAX).
 */

require_once 'config.php';

// Encabezado para responder siempre en formato JSON con soporte UTF-8
header('Content-Type: application/json; charset=utf-8');

// Obtener la acción solicitada por GET o POST
$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

// Estructura de respuesta por defecto
$response = [
    'success' => false,
    'message' => 'Acción no válida o no especificada.',
    'data' => null
];

/**
 * Función para parsear URLs de Spotify
 * Soporta tracks, playlists y albums
 */
function parseSpotifyUrl($url) {
    // Limpiar espacios
    $url = trim($url);

    // 1. Si es un enlace corto de spotify.link, resolver la redirección
    if (stripos($url, 'spotify.link') !== false) {
        if (function_exists('curl_init')) {
            $ch = curl_init();
            curl_setopt($ch, CURLOPT_URL, $url);
            curl_setopt($ch, CURLOPT_HEADER, true);
            curl_setopt($ch, CURLOPT_FOLLOWLOCATION, false);
            curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
            curl_setopt($ch, CURLOPT_TIMEOUT, 3);
            curl_setopt($ch, CURLOPT_USERAGENT, 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
            $response = curl_exec($ch);
            if (!curl_errno($ch)) {
                $info = curl_getinfo($ch);
                if ($info['http_code'] >= 300 && $info['http_code'] < 400) {
                    if (preg_match('/^location:\s*(.*)$/im', $response, $matches)) {
                        $url = trim($matches[1]);
                    }
                }
            }
            curl_close($ch);
        } else {
            // Alternativa si no está disponible curl (get_headers)
            $headers = @get_headers($url, 1);
            if ($headers) {
                foreach ($headers as $key => $value) {
                    if (strtolower($key) === 'location') {
                        $url = is_array($value) ? end($value) : $value;
                        break;
                    }
                }
            }
        }
    }

    // 2. Formato estándar de open.spotify.com
    // Soporta cualquier prefijo de locale (como /intl-es/, /intl-pt-br/, etc.) usando un comodín de carpetas intermedias
    $pattern = '#spotify\.com/(?:[a-zA-Z0-9_-]+/)*(track|playlist|album)/([A-Za-z0-9]{15,30})#i';

    if (preg_match($pattern, $url, $matches)) {
        return [
            'type' => strtolower($matches[1]),
            'id'   => $matches[2]
        ];
    }

    // 3. Formato URI de Spotify (spotify:track:ID)
    $uriPattern = '#^spotify:(track|playlist|album):([A-Za-z0-9]{15,30})$#i';
    if (preg_match($uriPattern, $url, $matches)) {
        return [
            'type' => strtolower($matches[1]),
            'id'   => $matches[2]
        ];
    }

    return null;
}


try {
    switch ($action) {
        
        // ==========================================
        // 1. AUTENTICACIÓN (LOGIN / REGISTRO / SESION)
        // ==========================================
        
        case 'get_session':
            if (isLoggedIn()) {
                $user = getLoggedInUser();
                if ($user) {
                    $response['success'] = true;
                    $response['message'] = 'Usuario autenticado.';
                    $response['data'] = $user;
                } else {
                    $response['message'] = 'Usuario no encontrado.';
                }
            } else {
                $response['success'] = true; // Retorna true pero con data null (modo invitado)
                $response['message'] = 'Modo invitado (no logueado).';
                $response['data'] = null;
            }
            break;

        case 'login':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $response['message'] = 'Método de solicitud no permitido.';
                break;
            }

            $username = trim($_POST['username'] ?? '');
            $password = trim($_POST['password'] ?? '');

            if (empty($username) || empty($password)) {
                $response['message'] = 'Todos los campos son obligatorios.';
                break;
            }

            $stmt = $pdo->prepare("SELECT id, username, password, avatar FROM users WHERE username = ?");
            $stmt->execute([$username]);
            $user = $stmt->fetch();

            if ($user && password_verify($password, $user['password'])) {
                $_SESSION['user_id'] = $user['id'];
                $_SESSION['username'] = $user['username'];
                
                $response['success'] = true;
                $response['message'] = '¡Inicio de sesión exitoso! Bienvenido, ' . $user['username'];
                $response['data'] = [
                    'id' => $user['id'],
                    'username' => $user['username'],
                    'avatar' => $user['avatar']
                ];
            } else {
                $response['message'] = 'Usuario o contraseña incorrectos.';
            }
            break;

        case 'register':
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $response['message'] = 'Método de solicitud no permitido.';
                break;
            }

            $username = trim($_POST['username'] ?? '');
            $password = trim($_POST['password'] ?? '');
            $avatar = trim($_POST['avatar'] ?? '🎧'); // Avatar emoji por defecto
            $bio = trim($_POST['bio'] ?? '¡Hola! Soy nuevo en DJ CHISMOSO.');

            if (empty($username) || empty($password)) {
                $response['message'] = 'Usuario y contraseña son obligatorios.';
                break;
            }

            if (strlen($username) < 3 || strlen($username) > 20) {
                $response['message'] = 'El usuario debe tener entre 3 y 20 caracteres.';
                break;
            }

            // Verificar si el usuario ya existe
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                $response['message'] = 'El nombre de usuario ya está en uso.';
                break;
            }

            // Crear el usuario
            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, avatar, bio) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $password_hash, $avatar, $bio]);
            $new_user_id = $pdo->lastInsertId();

            // Loguear automáticamente al usuario recién registrado
            $_SESSION['user_id'] = $new_user_id;
            $_SESSION['username'] = $username;

            $response['success'] = true;
            $response['message'] = '¡Registro completado e inicio de sesión automático!';
            $response['data'] = [
                'id' => $new_user_id,
                'username' => $username,
                'avatar' => $avatar
            ];
            break;

        case 'logout':
            session_destroy();
            $response['success'] = true;
            $response['message'] = 'Sesión cerrada correctamente.';
            break;

        case 'update_profile':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para editar tu perfil.';
                break;
            }
            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $response['message'] = 'Método de solicitud no permitido.';
                break;
            }

            $bio = trim($_POST['bio'] ?? '');
            $avatar = trim($_POST['avatar'] ?? '');
            $featured_track = trim($_POST['featured_track'] ?? '');

            // Validar URL de Spotify si se provee
            $featured_spotify = null;
            if (!empty($featured_track)) {
                $parsed = parseSpotifyUrl($featured_track);
                if (!$parsed) {
                    $response['message'] = 'El enlace de canción insignia no es válido.';
                    break;
                }
                $featured_spotify = $featured_track;
            }

            $stmt = $pdo->prepare("UPDATE users SET bio = ?, avatar = ?, featured_track = ? WHERE id = ?");
            $stmt->execute([$bio, $avatar, $featured_spotify, $_SESSION['user_id']]);

            $response['success'] = true;
            $response['message'] = '¡Perfil actualizado exitosamente!';
            $response['data'] = [
                'bio' => $bio,
                'avatar' => $avatar,
                'featured_track' => $featured_spotify
            ];
            break;

        // ==========================================
        // 2. PUBLICACIONES (POSTS)
        // ==========================================

        case 'get_posts':
            $category = trim($_GET['category'] ?? '');
            $search = trim($_GET['search'] ?? '');
            $user_id = trim($_GET['user_id'] ?? '');
            $filter = trim($_GET['filter'] ?? 'recent'); // 'recent', 'trending' o 'following'
            $spotify_type = trim($_GET['spotify_type'] ?? ''); // 'track', 'playlist', 'album'
            
            $sql = "SELECT p.*, u.username, u.avatar as user_avatar,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count";
            
            // Si el usuario está logueado, verificar si ya le dio like a cada post y qué reacción
            if (isLoggedIn()) {
                $uid = intval($_SESSION['user_id']);
                $sql .= ", (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = {$uid}) as user_liked";
                $sql .= ", (SELECT reaction_type FROM likes WHERE post_id = p.id AND user_id = {$uid} LIMIT 1) as user_reaction";
            } else {
                $sql .= ", 0 as user_liked, NULL as user_reaction";
            }
            
            // Conteo de reacciones por tipo
            $sql .= ",
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'heart') as react_heart,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'fire') as react_fire,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'cry') as react_cry,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'wow') as react_wow,
                (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND reaction_type = 'dance') as react_dance";
            
            $sql .= " FROM posts p JOIN users u ON p.user_id = u.id WHERE 1=1";
            $params = [];

            // Filtrado solo por usuarios seguidos
            if ($filter === 'following' && isLoggedIn()) {
                $sql .= " AND p.user_id IN (SELECT following_id FROM follows WHERE follower_id = ?)";
                $params[] = intval($_SESSION['user_id']);
            }

            // Filtrado por Categoría
            if (!empty($category)) {
                $sql .= " AND p.category = ?";
                $params[] = $category;
            }

            // Filtrado por Tipo de Spotify (track, playlist, album)
            if (!empty($spotify_type)) {
                $sql .= " AND p.spotify_type = ?";
                $params[] = $spotify_type;
            }

            // Filtrado por Usuario
            if (!empty($user_id)) {
                $sql .= " AND p.user_id = ?";
                $params[] = intval($user_id);
            }

            // Buscador por Texto (Busca en título, chisme, tags o usuario)
            if (!empty($search)) {
                $sql .= " AND (p.title LIKE ? OR p.chisme LIKE ? OR u.username LIKE ? OR p.category LIKE ?)";
                $search_param = "%{$search}%";
                $params[] = $search_param;
                $params[] = $search_param;
                $params[] = $search_param;
                $params[] = $search_param;
            }

            // Ordenamiento
            if ($filter === 'trending') {
                $sql .= " ORDER BY likes_count DESC, p.created_at DESC";
            } else {
                $sql .= " ORDER BY p.created_at DESC";
            }

            $stmt = $pdo->prepare($sql);
            $stmt->execute($params);
            $posts = $stmt->fetchAll();

            $response['success'] = true;
            $response['message'] = 'Publicaciones obtenidas con éxito.';
            $response['data'] = $posts;
            break;

        case 'create_post':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para compartir música.';
                break;
            }

            if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
                $response['message'] = 'Método de solicitud no permitido.';
                break;
            }

            $spotify_url = trim($_POST['spotify_url'] ?? '');
            $title = trim($_POST['title'] ?? '');
            $chisme = trim($_POST['chisme'] ?? '');
            $category = trim($_POST['category'] ?? 'Rock');

            if (empty($spotify_url) || empty($title) || empty($chisme)) {
                $response['message'] = 'El enlace de Spotify, el título y el chisme son obligatorios.';
                break;
            }

            // Parsear el enlace de Spotify
            $spotify_data = parseSpotifyUrl($spotify_url);
            if (!$spotify_data) {
                $response['message'] = 'El enlace de Spotify no es válido. Asegúrate de copiar un enlace de canción, playlist o álbum.';
                break;
            }

            $stmt = $pdo->prepare("INSERT INTO posts (user_id, spotify_url, spotify_id, spotify_type, title, chisme, category) VALUES (?, ?, ?, ?, ?, ?, ?)");
            $stmt->execute([
                $_SESSION['user_id'],
                $spotify_url,
                $spotify_data['id'],
                $spotify_data['type'],
                $title,
                $chisme,
                $category
            ]);

            $response['success'] = true;
            $response['message'] = '¡Tu chisme musical se publicó exitosamente! 🎧💥';
            $response['data'] = ['id' => $pdo->lastInsertId()];
            break;

        // ==========================================
        // 3. ME GUSTA (LIKES)
        // ==========================================

        case 'toggle_like':
        case 'toggle_reaction':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para reaccionar.';
                break;
            }

            $post_id = intval($_POST['post_id'] ?? 0);
            $reaction_type = trim($_POST['reaction_type'] ?? 'heart');
            $user_id = $_SESSION['user_id'];
            $valid_reactions = ['heart', 'fire', 'cry', 'wow', 'dance'];

            if (!in_array($reaction_type, $valid_reactions)) $reaction_type = 'heart';

            if ($post_id <= 0) {
                $response['message'] = 'Publicación no válida.';
                break;
            }

            // Comprobar si ya existe alguna reacción del usuario a este post
            $stmt = $pdo->prepare("SELECT reaction_type FROM likes WHERE user_id = ? AND post_id = ?");
            $stmt->execute([$user_id, $post_id]);
            $existing = $stmt->fetch();

            if ($existing) {
                if ($existing['reaction_type'] === $reaction_type) {
                    // Mismo emoji: quitar reacción (toggle off)
                    $stmt = $pdo->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?");
                    $stmt->execute([$user_id, $post_id]);
                    $liked = false;
                    $user_reaction = null;
                    $message = 'Reacción eliminada.';
                } else {
                    // Diferente emoji: cambiar reacción
                    $stmt = $pdo->prepare("UPDATE likes SET reaction_type = ? WHERE user_id = ? AND post_id = ?");
                    $stmt->execute([$reaction_type, $user_id, $post_id]);
                    $liked = true;
                    $user_reaction = $reaction_type;
                    $message = '¡Reacción cambiada!';
                }
            } else {
                // Agregar nueva reacción
                $stmt = $pdo->prepare("INSERT INTO likes (user_id, post_id, reaction_type) VALUES (?, ?, ?)");
                $stmt->execute([$user_id, $post_id, $reaction_type]);
                $liked = true;
                $user_reaction = $reaction_type;
                $message = '¡Reacción agregada!';

                // Emitir notificación al autor del post (si no es el mismo usuario)
                $stmt_owner = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
                $stmt_owner->execute([$post_id]);
                $owner = $stmt_owner->fetchColumn();
                if ($owner && intval($owner) !== intval($user_id)) {
                    $stmt_notif = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, 'like', ?)");
                    $stmt_notif->execute([$owner, $user_id, $post_id]);
                }
            }

            // Conteo actualizado total y por tipo
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM likes WHERE post_id = ?");
            $stmt->execute([$post_id]);
            $likes_count = $stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT reaction_type, COUNT(*) as cnt FROM likes WHERE post_id = ? GROUP BY reaction_type");
            $stmt->execute([$post_id]);
            $breakdown = [];
            foreach ($stmt->fetchAll() as $row) {
                $breakdown[$row['reaction_type']] = intval($row['cnt']);
            }

            $response['success'] = true;
            $response['message'] = $message;
            $response['data'] = [
                'liked' => $liked,
                'user_reaction' => $user_reaction,
                'likes_count' => $likes_count,
                'breakdown' => $breakdown
            ];
            break;

        // ==========================================
        // 4. COMENTARIOS
        // ==========================================

        case 'get_comments':
            $post_id = intval($_GET['post_id'] ?? 0);
            
            if ($post_id <= 0) {
                $response['message'] = 'Publicación no válida.';
                break;
            }

            $stmt = $pdo->prepare("
                SELECT c.*, u.username, u.avatar as user_avatar 
                FROM comments c 
                JOIN users u ON c.user_id = u.id 
                WHERE c.post_id = ? 
                ORDER BY c.created_at ASC
            ");
            $stmt->execute([$post_id]);
            $comments = $stmt->fetchAll();

            $response['success'] = true;
            $response['message'] = 'Comentarios obtenidos con éxito.';
            $response['data'] = $comments;
            break;

        case 'add_comment':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para comentar.';
                break;
            }

            $post_id = intval($_POST['post_id'] ?? 0);
            $comment_text = trim($_POST['comment_text'] ?? '');
            $user_id = $_SESSION['user_id'];

            if ($post_id <= 0 || empty($comment_text)) {
                $response['message'] = 'El comentario no puede estar vacío.';
                break;
            }

            $stmt = $pdo->prepare("INSERT INTO comments (post_id, user_id, comment_text) VALUES (?, ?, ?)");
            $stmt->execute([$post_id, $user_id, $comment_text]);

            // Emitir notificación al autor del post
            $stmt_owner = $pdo->prepare("SELECT user_id FROM posts WHERE id = ?");
            $stmt_owner->execute([$post_id]);
            $owner = $stmt_owner->fetchColumn();
            if ($owner && intval($owner) !== intval($user_id)) {
                $stmt_notif = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, type, post_id) VALUES (?, ?, 'comment', ?)");
                $stmt_notif->execute([$owner, $user_id, $post_id]);
            }

            $response['success'] = true;
            $response['message'] = '¡Comentario publicado!';
            $response['data'] = [
                'comment_id' => $pdo->lastInsertId(),
                'username' => $_SESSION['username'],
                'avatar' => $_SESSION['avatar'] ?? '🎧',
                'comment_text' => $comment_text,
                'created_at' => date('Y-m-d H:i:s')
            ];
            break;

        // ==========================================
        // 5. PERFILES Y SOCIAL (FOLLOWS)
        // ==========================================

        case 'get_profile':
            $target_user_id = intval($_GET['user_id'] ?? 0);
            
            if ($target_user_id <= 0) {
                $response['message'] = 'Usuario no válido.';
                break;
            }

            // Obtener datos del usuario (incluyendo featured_track)
            $stmt = $pdo->prepare("SELECT id, username, avatar, bio, featured_track, created_at FROM users WHERE id = ?");
            $stmt->execute([$target_user_id]);
            $user_data = $stmt->fetch();

            if (!$user_data) {
                $response['message'] = 'Usuario no encontrado.';
                break;
            }

            // Obtener número de seguidores
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE following_id = ?");
            $stmt->execute([$target_user_id]);
            $followers_count = $stmt->fetchColumn();

            // Obtener número de seguidos
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ?");
            $stmt->execute([$target_user_id]);
            $following_count = $stmt->fetchColumn();

            // Verificar si el usuario actual sigue a este usuario
            $is_following = false;
            if (isLoggedIn() && $_SESSION['user_id'] != $target_user_id) {
                $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?");
                $stmt->execute([$_SESSION['user_id'], $target_user_id]);
                $is_following = $stmt->fetchColumn() > 0;
            }

            $response['success'] = true;
            $response['message'] = 'Perfil obtenido con éxito.';
            $response['data'] = [
                'user' => $user_data,
                'followers_count' => $followers_count,
                'following_count' => $following_count,
                'is_following' => $is_following
            ];
            break;

        case 'toggle_follow':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para seguir usuarios.';
                break;
            }

            $following_id = intval($_POST['user_id'] ?? 0);
            $follower_id = $_SESSION['user_id'];

            if ($following_id <= 0 || $following_id == $follower_id) {
                $response['message'] = 'Operación de seguimiento no válida.';
                break;
            }

            // Verificar si ya lo sigue
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$follower_id, $following_id]);
            $exists = $stmt->fetchColumn() > 0;

            if ($exists) {
                // Dejar de seguir
                $stmt = $pdo->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
                $stmt->execute([$follower_id, $following_id]);
                $following = false;
                $message = 'Dejaste de seguir a este usuario.';
            } else {
                // Seguir
                $stmt = $pdo->prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
                $stmt->execute([$follower_id, $following_id]);
                $following = true;
                $message = '¡Ahora sigues a este usuario!';

                // Emitir notificación de seguimiento
                $stmt_notif = $pdo->prepare("INSERT INTO notifications (user_id, sender_id, type) VALUES (?, ?, 'follow')");
                $stmt_notif->execute([$following_id, $follower_id]);
            }

            // Obtener el conteo actualizado de seguidores
            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE following_id = ?");
            $stmt->execute([$following_id]);
            $followers_count = $stmt->fetchColumn();

            $response['success'] = true;
            $response['message'] = $message;
            $response['data'] = [
                'is_following' => $following,
                'followers_count' => $followers_count
            ];
            break;

        // ==========================================
        // 6. RANKINGS Y TENDENCIAS (SIDEBAR)
        // ==========================================

        case 'get_rankings':
            // Las 5 playlists/canciones más populares basadas en me gusta
            $stmt = $pdo->query("
                SELECT p.id, p.title, p.spotify_id, p.spotify_type, p.category, u.username,
                       (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count
                FROM posts p
                JOIN users u ON p.user_id = u.id
                ORDER BY likes_count DESC, p.created_at DESC
                LIMIT 5
            ");
            $rankings = $stmt->fetchAll();

            $response['success'] = true;
            $response['message'] = 'Rankings obtenidos.';
            $response['data'] = $rankings;
            break;

        case 'get_trends':
            // Obtener categorías populares con conteo de posts y me gusta totales
            $stmt = $pdo->query("
                SELECT category as name, COUNT(*) as posts_count,
                       (SELECT COUNT(*) FROM likes l JOIN posts p2 ON l.post_id = p2.id WHERE p2.category = posts.category) as total_likes
                FROM posts
                GROUP BY category
                ORDER BY posts_count DESC, total_likes DESC
                LIMIT 6
            ");
            $trends = $stmt->fetchAll();

            $response['success'] = true;
            $response['message'] = 'Tendencias obtenidas.';
            $response['data'] = $trends;
            break;

        // ==========================================
        // 7. CHAT EN VIVO (EL CHISMÓGRAFO)
        // ==========================================

        case 'get_chat_messages':
            $since_id = intval($_GET['since_id'] ?? 0);
            $stmt = $pdo->prepare("
                SELECT cm.id, cm.user_id, cm.message, cm.created_at, u.username, u.avatar
                FROM chat_messages cm
                JOIN users u ON cm.user_id = u.id
                WHERE cm.id > ?
                ORDER BY cm.created_at ASC
                LIMIT 60
            ");
            $stmt->execute([$since_id]);
            $messages = $stmt->fetchAll();
            $response['success'] = true;
            $response['data'] = $messages;
            break;

        case 'send_chat_message':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para chatear.';
                break;
            }
            $msg = trim($_POST['message'] ?? '');
            if (empty($msg) || mb_strlen($msg) > 300) {
                $response['message'] = 'Mensaje inválido.';
                break;
            }
            $stmt = $pdo->prepare("INSERT INTO chat_messages (user_id, message) VALUES (?, ?)");
            $stmt->execute([$_SESSION['user_id'], $msg]);
            $response['success'] = true;
            $response['data'] = ['id' => $pdo->lastInsertId()];
            break;

        // ==========================================
        // 8. NOTIFICACIONES
        // ==========================================

        case 'get_notifications':
            if (!isLoggedIn()) {
                $response['success'] = true;
                $response['data'] = ['notifications' => [], 'unread_count' => 0];
                break;
            }
            $stmt = $pdo->prepare("
                SELECT n.id, n.type, n.post_id, n.is_read, n.created_at,
                       u.username as sender_username, u.avatar as sender_avatar,
                       p.title as post_title
                FROM notifications n
                JOIN users u ON n.sender_id = u.id
                LEFT JOIN posts p ON n.post_id = p.id
                WHERE n.user_id = ?
                ORDER BY n.created_at DESC
                LIMIT 30
            ");
            $stmt->execute([$_SESSION['user_id']]);
            $notifs = $stmt->fetchAll();
            $stmt2 = $pdo->prepare("SELECT COUNT(*) FROM notifications WHERE user_id = ? AND is_read = 0");
            $stmt2->execute([$_SESSION['user_id']]);
            $unread_count = intval($stmt2->fetchColumn());
            $response['success'] = true;
            $response['data'] = ['notifications' => $notifs, 'unread_count' => $unread_count];
            break;

        case 'mark_notifications_read':
            if (!isLoggedIn()) break;
            $pdo->prepare("UPDATE notifications SET is_read = 1 WHERE user_id = ?")->execute([$_SESSION['user_id']]);
            $response['success'] = true;
            $response['message'] = 'Notificaciones marcadas como leídas.';
            break;
    }
} catch (PDOException $e) {
    $response['message'] = 'Error en base de datos: ' . $e->getMessage();
}

// Retornar respuesta codificada en JSON
echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
