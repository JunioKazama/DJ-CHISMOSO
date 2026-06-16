<?php
/**
 * DJ CHISMOSO - API de Backend (JSON) - HOSTINGER
 */

require_once 'config.php';

header('Content-Type: application/json; charset=utf-8');

$action = isset($_GET['action']) ? $_GET['action'] : (isset($_POST['action']) ? $_POST['action'] : '');

$response = [
    'success' => false,
    'message' => 'Acción no válida o no especificada.',
    'data' => null
];

function parseSpotifyUrl($url) {
    $pattern = '/spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]{15,30})/i';
    if (preg_match($pattern, $url, $matches)) {
        return [
            'type' => strtolower($matches[1]),
            'id' => $matches[2]
        ];
    }
    return null;
}

try {
    switch ($action) {
        
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
                $response['success'] = true;
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
            $avatar = trim($_POST['avatar'] ?? '🎧');
            $bio = trim($_POST['bio'] ?? '¡Hola! Soy nuevo en DJ CHISMOSO.');

            if (empty($username) || empty($password)) {
                $response['message'] = 'Usuario y contraseña son obligatorios.';
                break;
            }

            if (strlen($username) < 3 || strlen($username) > 20) {
                $response['message'] = 'El usuario debe tener entre 3 y 20 caracteres.';
                break;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM users WHERE username = ?");
            $stmt->execute([$username]);
            if ($stmt->fetchColumn() > 0) {
                $response['message'] = 'El nombre de usuario ya está en uso.';
                break;
            }

            $password_hash = password_hash($password, PASSWORD_DEFAULT);
            $stmt = $pdo->prepare("INSERT INTO users (username, password, avatar, bio) VALUES (?, ?, ?, ?)");
            $stmt->execute([$username, $password_hash, $avatar, $bio]);
            $new_user_id = $pdo->lastInsertId();

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

        case 'get_posts':
            $category = trim($_GET['category'] ?? '');
            $search = trim($_GET['search'] ?? '');
            $user_id = trim($_GET['user_id'] ?? '');
            $filter = trim($_GET['filter'] ?? 'recent');
            
            $sql = "SELECT p.*, u.username, u.avatar as user_avatar,
                    (SELECT COUNT(*) FROM likes WHERE post_id = p.id) as likes_count,
                    (SELECT COUNT(*) FROM comments WHERE post_id = p.id) as comments_count";
            
            if (isLoggedIn()) {
                $sql .= ", (SELECT COUNT(*) FROM likes WHERE post_id = p.id AND user_id = " . intval($_SESSION['user_id']) . ") as user_liked";
            } else {
                $sql .= ", 0 as user_liked";
            }
            
            $sql .= " FROM posts p JOIN users u ON p.user_id = u.id WHERE 1=1";
            $params = [];

            if (!empty($category)) {
                $sql .= " AND p.category = ?";
                $params[] = $category;
            }

            if (!empty($user_id)) {
                $sql .= " AND p.user_id = ?";
                $params[] = intval($user_id);
            }

            if (!empty($search)) {
                $sql .= " AND (p.title LIKE ? OR p.chisme LIKE ? OR u.username LIKE ? OR p.category LIKE ?)";
                $search_param = "%{$search}%";
                $params[] = $search_param;
                $params[] = $search_param;
                $params[] = $search_param;
                $params[] = $search_param;
            }

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

        case 'toggle_like':
            if (!isLoggedIn()) {
                $response['message'] = 'Debes iniciar sesión para dar likes.';
                break;
            }

            $post_id = intval($_POST['post_id'] ?? 0);
            $user_id = $_SESSION['user_id'];

            if ($post_id <= 0) {
                $response['message'] = 'Publicación no válida.';
                break;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM likes WHERE user_id = ? AND post_id = ?");
            $stmt->execute([$user_id, $post_id]);
            $exists = $stmt->fetchColumn() > 0;

            if ($exists) {
                $stmt = $pdo->prepare("DELETE FROM likes WHERE user_id = ? AND post_id = ?");
                $stmt->execute([$user_id, $post_id]);
                $liked = false;
                $message = 'Like eliminado.';
            } else {
                $stmt = $pdo->prepare("INSERT INTO likes (user_id, post_id) VALUES (?, ?)");
                $stmt->execute([$user_id, $post_id]);
                $liked = true;
                $message = '¡Like agregado!';
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM likes WHERE post_id = ?");
            $stmt->execute([$post_id]);
            $likes_count = $stmt->fetchColumn();

            $response['success'] = true;
            $response['message'] = $message;
            $response['data'] = [
                'liked' => $liked,
                'likes_count' => $likes_count
            ];
            break;

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

        case 'get_profile':
            $target_user_id = intval($_GET['user_id'] ?? 0);
            
            if ($target_user_id <= 0) {
                $response['message'] = 'Usuario no válido.';
                break;
            }

            $stmt = $pdo->prepare("SELECT id, username, avatar, bio, created_at FROM users WHERE id = ?");
            $stmt->execute([$target_user_id]);
            $user_data = $stmt->fetch();

            if (!$user_data) {
                $response['message'] = 'Usuario no encontrado.';
                break;
            }

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE following_id = ?");
            $stmt->execute([$target_user_id]);
            $followers_count = $stmt->fetchColumn();

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ?");
            $stmt->execute([$target_user_id]);
            $following_count = $stmt->fetchColumn();

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

            $stmt = $pdo->prepare("SELECT COUNT(*) FROM follows WHERE follower_id = ? AND following_id = ?");
            $stmt->execute([$follower_id, $following_id]);
            $exists = $stmt->fetchColumn() > 0;

            if ($exists) {
                $stmt = $pdo->prepare("DELETE FROM follows WHERE follower_id = ? AND following_id = ?");
                $stmt->execute([$follower_id, $following_id]);
                $following = false;
                $message = 'Dejaste de seguir a este usuario.';
            } else {
                $stmt = $pdo->prepare("INSERT INTO follows (follower_id, following_id) VALUES (?, ?)");
                $stmt->execute([$follower_id, $following_id]);
                $following = true;
                $message = '¡Ahora sigues a este usuario!';
            }

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

        case 'get_rankings':
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
    }
} catch (PDOException $e) {
    $response['message'] = 'Error en base de datos: ' . $e->getMessage();
}

echo json_encode($response, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT);
?>
