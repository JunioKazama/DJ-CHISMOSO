<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Instalador Automático - DJ CHISMOSO</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;800&family=Plus+Jakarta+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>
        :root {
            --bg-color: #08080c;
            --card-bg: rgba(15, 15, 25, 0.7);
            --border-color: rgba(255, 255, 255, 0.08);
            --accent-green: #1ed760;
            --accent-purple: #5865F2;
            --accent-pink: #f43f5e;
            --text-primary: #ffffff;
            --text-secondary: #a0a0b0;
        }
        body {
            font-family: 'Plus Jakarta Sans', sans-serif;
            background-color: var(--bg-color);
            background-image: 
                radial-gradient(circle at 10% 20%, rgba(90, 40, 200, 0.15) 0%, transparent 40%),
                radial-gradient(circle at 90% 80%, rgba(30, 215, 96, 0.12) 0%, transparent 45%);
            background-attachment: fixed;
            color: var(--text-primary);
            min-height: 100vh;
            margin: 0;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 20px;
            box-sizing: border-box;
        }
        .container {
            width: 100%;
            max-width: 650px;
            background: var(--card-bg);
            backdrop-filter: blur(16px);
            border: 1px solid var(--border-color);
            border-radius: 24px;
            padding: 40px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.5);
            text-align: center;
            animation: fadeIn 0.8s ease;
        }
        h1 {
            font-family: 'Outfit', sans-serif;
            font-size: 2.5rem;
            font-weight: 800;
            margin-top: 0;
            margin-bottom: 8px;
            background: linear-gradient(135deg, #1ed760 0%, #8b5cf6 50%, #f43f5e 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
        }
        .subtitle {
            color: var(--text-secondary);
            font-size: 1.1rem;
            margin-bottom: 35px;
        }
        .log-box {
            text-align: left;
            background: rgba(0,0,0,0.3);
            border: 1px solid var(--border-color);
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
            font-family: monospace;
            font-size: 0.95rem;
            max-height: 300px;
            overflow-y: auto;
        }
        .log-item {
            margin-bottom: 10px;
            display: flex;
            align-items: center;
        }
        .log-item.success { color: var(--accent-green); }
        .log-item.info { color: var(--text-secondary); }
        .log-item.error { color: var(--accent-pink); }
        .icon {
            margin-right: 10px;
            font-weight: bold;
        }
        .btn {
            display: inline-block;
            background: linear-gradient(135deg, var(--accent-green) 0%, #17a34a 100%);
            color: #000000;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 30px;
            font-weight: 700;
            font-size: 1rem;
            font-family: 'Outfit', sans-serif;
            box-shadow: 0 0 20px rgba(30, 215, 96, 0.4);
            transition: all 0.3s ease;
            border: none;
            cursor: pointer;
        }
        .btn:hover {
            transform: translateY(-2px);
            box-shadow: 0 0 30px rgba(30, 215, 96, 0.6);
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(20px); }
            to { opacity: 1; transform: translateY(0); }
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>DJ CHISMOSO</h1>
        <div class="subtitle">Asistente de Configuración (Hostinger)</div>
        
        <div class="log-box">
            <?php
            // Incluir variables de configuración
            if (file_exists('config.php')) {
                include_once 'config.php';
                $db_host = DB_HOST;
                $db_user = DB_USER;
                $db_pass = DB_PASS;
                $db_name = DB_NAME;
            } else {
                die("Error: No se encontró 'config.php' en el directorio de subida.");
            }

            function logMsg($msg, $type = 'info') {
                $icon = '✦';
                if ($type == 'success') $icon = '✔';
                if ($type == 'error') $icon = '✘';
                echo "<div class='log-item {$type}'><span class='icon'>{$icon}</span> " . htmlspecialchars($msg) . "</div>";
                flush();
            }

            try {
                logMsg("Conectando al servidor de Hostinger '{$db_host}' como usuario '{$db_user}'...", 'info');
                
                // Conectarse inicialmente
                $pdo_setup = new PDO("mysql:host={$db_host};charset=utf8mb4", $db_user, $db_pass, [
                    PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION
                ]);
                logMsg("Conexión al servidor exitosa.", "success");

                // Crear Base de Datos
                logMsg("Creando base de datos '{$db_name}' si no existe...", 'info');
                $pdo_setup->exec("CREATE DATABASE IF NOT EXISTS `{$db_name}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci");
                logMsg("Base de datos '{$db_name}' lista.", 'success');

                // Conectarse a la base de datos
                $pdo_setup->exec("USE `{$db_name}`");

                // 1. Crear Tabla de Usuarios
                logMsg("Creando tabla 'users'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `users` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `username` VARCHAR(50) NOT NULL UNIQUE,
                    `password` VARCHAR(255) NOT NULL,
                    `avatar` VARCHAR(255) NOT NULL,
                    `bio` TEXT DEFAULT NULL,
                    `featured_track` VARCHAR(500) DEFAULT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                
                // Asegurar que la columna featured_track exista si la tabla ya existía
                try {
                    $pdo_setup->exec("SELECT featured_track FROM users LIMIT 1");
                } catch (PDOException $e) {
                    $pdo_setup->exec("ALTER TABLE users ADD COLUMN featured_track VARCHAR(500) DEFAULT NULL AFTER bio");
                    logMsg("Columna 'featured_track' agregada a la tabla 'users'.", 'info');
                }
                logMsg("Tabla 'users' creada o actualizada exitosamente.", 'success');

                // 2. Crear Tabla de Publicaciones
                logMsg("Creando tabla 'posts'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `posts` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `spotify_url` VARCHAR(500) NOT NULL,
                    `spotify_id` VARCHAR(100) NOT NULL,
                    `spotify_type` VARCHAR(50) NOT NULL,
                    `title` VARCHAR(255) NOT NULL,
                    `chisme` TEXT NOT NULL,
                    `category` VARCHAR(50) NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                logMsg("Tabla 'posts' creada exitosamente.", 'success');

                // 3. Crear Tabla de Likes (con tipo de reacción)
                logMsg("Creando tabla 'likes'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `likes` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `post_id` INT NOT NULL,
                    `reaction_type` VARCHAR(20) NOT NULL DEFAULT 'heart',
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    UNIQUE KEY `unique_user_post` (`user_id`, `post_id`),
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");

                // Asegurar que la columna reaction_type exista si la tabla ya existía
                try {
                    $pdo_setup->exec("SELECT reaction_type FROM likes LIMIT 1");
                } catch (PDOException $e) {
                    $pdo_setup->exec("ALTER TABLE likes ADD COLUMN reaction_type VARCHAR(20) NOT NULL DEFAULT 'heart' AFTER post_id");
                    logMsg("Columna 'reaction_type' agregada a la tabla 'likes'.", 'info');
                }
                logMsg("Tabla 'likes' creada o actualizada exitosamente.", 'success');

                // 4. Crear Tabla de Comentarios
                logMsg("Creando tabla 'comments'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `comments` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `post_id` INT NOT NULL,
                    `user_id` INT NOT NULL,
                    `comment_text` TEXT NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                logMsg("Tabla 'comments' creada exitosamente.", 'success');

                // 5. Crear Tabla de Seguimiento
                logMsg("Creando tabla 'follows'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `follows` (
                    `follower_id` INT NOT NULL,
                    `following_id` INT NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    PRIMARY KEY (`follower_id`, `following_id`),
                    FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                    FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                logMsg("Tabla 'follows' creada exitosamente.", 'success');

                // 6. Crear Tabla de Mensajes de Chat
                logMsg("Creando tabla 'chat_messages'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `chat_messages` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `message` TEXT NOT NULL,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                logMsg("Tabla 'chat_messages' creada exitosamente.", 'success');

                // 7. Crear Tabla de Notificaciones
                logMsg("Creando tabla 'notifications'...", 'info');
                $pdo_setup->exec("CREATE TABLE IF NOT EXISTS `notifications` (
                    `id` INT AUTO_INCREMENT PRIMARY KEY,
                    `user_id` INT NOT NULL,
                    `sender_id` INT NOT NULL,
                    `type` ENUM('like','comment','follow') NOT NULL,
                    `post_id` INT DEFAULT NULL,
                    `is_read` TINYINT(1) NOT NULL DEFAULT 0,
                    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
                    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci");
                logMsg("Tabla 'notifications' creada exitosamente.", 'success');

                // 6. Sembrar datos de ejemplo (Seeds) si está vacía
                logMsg("Comprobando si la base de datos ya tiene usuarios...", 'info');
                $stmt = $pdo_setup->query("SELECT COUNT(*) FROM `users`");
                $user_count = $stmt->fetchColumn();

                if ($user_count == 0) {
                    logMsg("Sembrando usuarios iniciales...", 'info');
                    $pass_hashed = password_hash("123456", PASSWORD_DEFAULT);

                    $insert_user = $pdo_setup->prepare("INSERT INTO `users` (id, username, password, avatar, bio) VALUES (?, ?, ?, ?, ?)");
                    $users = [
                        [1, 'dj_chismoso', $pass_hashed, '🎧', 'El DJ oficial del chisme musical. Aquí comparto las playlists más ardientes.'],
                        [2, 'el_rockero_99', $pass_hashed, '🎸', 'Amante de los solos de guitarra eternos, el vinilo y el rock clásico de verdad.'],
                        [3, 'indie_girl', $pass_hashed, '🌸', 'Descubriendo bandas indie que solo conocen 3 personas en un garaje de Seattle.'],
                        [4, 'lofi_relaxer', $pass_hashed, '☕', 'Estudiando, durmiendo o tomando café con beats suaves de fondo. 24/7.'],
                        [5, 'gym_beast_88', $pass_hashed, '⚡', 'Energía pura para romper récords personales en el gimnasio. Sin música no hay ganancias.']
                    ];

                    foreach ($users as $u) {
                        $insert_user->execute($u);
                    }
                    logMsg("Usuarios iniciales insertados.", 'success');

                    logMsg("Sembrando posts musicales y chismes iniciales...", 'info');
                    $insert_post = $pdo_setup->prepare("INSERT INTO `posts` (id, user_id, spotify_url, spotify_id, spotify_type, title, chisme, category) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
                    
                    $posts = [
                        [
                            1, 4, 
                            'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhp79bB1', 
                            '37i9dQZF1DX8Uebhp79bB1', 'playlist',
                            'Lo-Fi para Estudiar (y fingir productividad)', 
                            'Gente, esta playlist es mi salvación. Sirve para cuando tienes que hacer una entrega en 3 horas pero en realidad pasas la mayor parte del tiempo mirando el gif de la chica anime en la ventana. Los beats son suaves, los pianos tienen la cantidad justa de melancolía y de verdad te transportan. 10/10 para concentrarse.', 
                            'Estudio'
                        ],
                        [
                            2, 2, 
                            'https://open.spotify.com/playlist/37i9dQZF1DX3oM43Z9VHd2', 
                            '37i9dQZF1DX3oM43Z9VHd2', 'playlist',
                            'Himnos del Rock de los 70s y 80s 🤘', 
                            'Si en tu playlist de manejo nocturno no tienes a Led Zeppelin, Queen, Pink Floyd y AC/DC... ¿realmente estás viviendo? Armé y pulí esta selección para sentir que vas manejando por la Ruta 66 en un convertible clásico, aunque solo vayas al supermercado en tu auto del 2012. Los solos de guitarra te curan la depresión.', 
                            'Rock'
                        ],
                        [
                            3, 5, 
                            'https://open.spotify.com/playlist/37i9dQZF1DX76t638V6eg8', 
                            '37i9dQZF1DX76t638V6eg8', 'playlist',
                            'Bestia del Gym: Modo Bestia Activado 🏋️‍♂️', 
                            'Para tirar ese press de banca pesado con la fuerza de mil soles. Si escuchas esta selección de metal y electrónica pesada y no te crecen los bíceps de inmediato, te devuelvo tus likes. Es la inyección de adrenalina pura que necesitas cuando tus músculos te ruegan que te rindas.', 
                            'Gym'
                        ],
                        [
                            4, 3, 
                            'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3Xugwjg2', 
                            '37i9dQZF1DX2Nc3Xugwjg2', 'playlist',
                            'Indie Pop para Días Lluviosos ☔', 
                            'Perfecto para sentarse junto a la ventana, mirar las gotas de lluvia caer y fingir que eres el protagonista de una película adolescente de directores independientes que nadie conoce en un día lluvioso de otoño. Canciones nostálgicas, guitarras indie de baja fidelidad y voces susurradas. Ideal para soñar despierto.', 
                            'Indie'
                        ],
                        [
                            5, 1, 
                            'https://open.spotify.com/track/60r5J2v6ug4ggZ426t566Z', 
                            '60r5J2v6ug4ggZ426t566Z', 'track',
                            'Mice on Venus - C418 (Minecraft Nostalgia)', 
                            'El chisme de hoy es existencial. ¿Alguien más se pone extremadamente sentimental escuchando la música de Minecraft? Te transporta a las 3 de la mañana en el 2014, construyendo tu casita de tierra y piedra sin ninguna preocupación de deudas o trabajo. C418 no compuso música, compuso cápsulas de tiempo nostálgicas.', 
                            'Gaming'
                        ],
                        [
                            6, 4, 
                            'https://open.spotify.com/track/7MXVrxvOI26DynamicH316P', 
                            '7MXVrxvOI26DynamicH316P', 'track',
                            'Another Love - Tom Odell (Para llorar feo)', 
                            'Advertencia: No escuches esto después de las 12 AM si acabas de ver que tu ex subió una historia con su "mejor amigo/a". Es una obra maestra melancólica. El crescendo de voz de Tom Odell te destroza el alma y te hace llorar aunque estés en una relación estable y feliz. Chisme triste del día.', 
                            'Triste'
                        ]
                    ];

                    foreach ($posts as $p) {
                        $insert_post->execute($p);
                    }
                    logMsg("Publicaciones iniciales creadas.", 'success');

                    // Sembrar Likes
                    logMsg("Sembrando likes iniciales...", 'info');
                    $insert_like = $pdo_setup->prepare("INSERT INTO `likes` (user_id, post_id) VALUES (?, ?)");
                    $likes = [
                        [2, 1], [3, 1], [5, 1],
                        [1, 2], [5, 2],
                        [1, 3], [2, 3],
                        [1, 4], [4, 4],
                        [2, 5], [3, 5], [4, 5], [5, 5],
                        [1, 6], [3, 6]
                    ];
                    foreach ($likes as $l) {
                        $insert_like->execute($l);
                    }
                    logMsg("Likes iniciales creados.", 'success');

                    // Sembrar Comentarios
                    logMsg("Sembrando comentarios iniciales...", 'info');
                    $insert_comment = $pdo_setup->prepare("INSERT INTO `comments` (post_id, user_id, comment_text) VALUES (?, ?, ?)");
                    $comments = [
                        [1, 1, 'Totalmente de acuerdo, la niña de la ventana lofi es prácticamente mi compañera de cuarto a estas alturas.'],
                        [1, 3, 'Me encanta el track número 4 de esa playlist, es una joya oculta.'],
                        [2, 1, '¡Uff! El solo de Free Bird en esta lista te hace conducir al doble de velocidad permitido.'],
                        [2, 5, 'Perfecta para levantar pesado también, clásicos inmortales.'],
                        [3, 2, 'Esta música del gym asusta a mis plantas, pero admito que levanto 10kg más.'],
                        [4, 1, 'Recomiendo escuchar esto con una buena taza de té de manzanilla caliente.'],
                        [5, 4, 'Me acabas de desbloquear recuerdos hermosos de cuando jugaba con mis amigos del colegio. Qué ganas de volver.'],
                        [6, 3, 'Me destruye esta canción. La letra de "And if somebody hurts you, I wanna fight" es demasiado.'],
                    ];
                    foreach ($comments as $c) {
                        $insert_comment->execute($c);
                    }
                    logMsg("Comentarios iniciales agregados.", 'success');

                    // Sembrar Follows
                    logMsg("Sembrando seguidores iniciales...", 'info');
                    $insert_follow = $pdo_setup->prepare("INSERT INTO `follows` (follower_id, following_id) VALUES (?, ?)");
                    $follows = [
                        [1, 2], [1, 3], [1, 4],
                        [2, 1], [2, 5],
                        [3, 1], [3, 4],
                        [4, 1], [4, 3],
                        [5, 1], [5, 2]
                    ];
                    foreach ($follows as $f) {
                        $insert_follow->execute($f);
                    }
                    logMsg("Seguimientos iniciales agregados.", 'success');
                } else {
                    logMsg("La base de datos en Hostinger ya cuenta con registros. Se omitió la siembra.", 'info');
                }

                logMsg("¡INSTALACIÓN COMPLETADA EN HOSTINGER CON ÉXITO!", 'success');
                echo "<div style='margin-top: 25px; color: var(--accent-green); font-weight: 800; font-size: 1.2rem;'>DJ CHISMOSO está listo para Hostinger. 🎧🔥</div>";

            } catch (PDOException $e) {
                logMsg("ERROR DE INSTALACIÓN EN HOSTINGER: " . $e->getMessage(), 'error');
                logMsg("Asegúrate de haber ingresado el host, usuario, contraseña y base de datos correctos de Hostinger en el archivo 'config.php' e intenta recargar esta página.", 'error');
            }
            ?>
        </div>

        <a href="index.php" class="btn">Entrar a DJ CHISMOSO</a>
    </div>
</body>
</html>
