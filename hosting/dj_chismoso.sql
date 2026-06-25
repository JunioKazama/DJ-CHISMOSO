-- ============================================================
-- DJ CHISMOSO - Script de Base de Datos para phpMyAdmin
-- Version 2.0 - Incluye: Chat, Notificaciones, Reacciones y Perfiles
-- ============================================================
-- Instrucciones:
--   1. En Hostinger, crea una base de datos MySQL desde hPanel.
--   2. Abre phpMyAdmin desde tu panel de Hostinger.
--   3. Selecciona tu base de datos en el panel izquierdo.
--   4. Ve a la pestana "Importar".
--   5. Selecciona este archivo .sql y haz clic en "Continuar".
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- TABLA: users
-- featured_track: URL de Spotify para la cancion destacada del perfil.
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id`             INT          AUTO_INCREMENT PRIMARY KEY,
    `username`       VARCHAR(50)  NOT NULL UNIQUE,
    `password`       VARCHAR(255) NOT NULL,
    `avatar`         VARCHAR(255) NOT NULL,
    `bio`            TEXT         DEFAULT NULL,
    `featured_track` VARCHAR(500) DEFAULT NULL,
    `created_at`     TIMESTAMP    DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Agregar columna featured_track si la tabla ya existia sin ella
ALTER TABLE `users` ADD COLUMN IF NOT EXISTS `featured_track` VARCHAR(500) DEFAULT NULL AFTER `bio`;

-- ============================================================
-- TABLA: posts
-- ============================================================

CREATE TABLE IF NOT EXISTS `posts` (
    `id`           INT          AUTO_INCREMENT PRIMARY KEY,
    `user_id`      INT          NOT NULL,
    `spotify_url`  VARCHAR(500) NOT NULL,
    `spotify_id`   VARCHAR(100) NOT NULL,
    `spotify_type` VARCHAR(50)  NOT NULL,
    `title`        VARCHAR(255) NOT NULL,
    `chisme`       TEXT         NOT NULL,
    `category`     VARCHAR(50)  NOT NULL,
    `created_at`   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: likes
-- reaction_type: 'heart' | 'fire' | 'cry' | 'skull' | 'clap'
-- Un usuario puede tener una sola reaccion por post.
-- ============================================================

CREATE TABLE IF NOT EXISTS `likes` (
    `id`            INT         AUTO_INCREMENT PRIMARY KEY,
    `user_id`       INT         NOT NULL,
    `post_id`       INT         NOT NULL,
    `reaction_type` VARCHAR(20) NOT NULL DEFAULT 'heart',
    `created_at`    TIMESTAMP   DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_post` (`user_id`, `post_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`)  ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: comments
-- ============================================================

CREATE TABLE IF NOT EXISTS `comments` (
    `id`           INT  AUTO_INCREMENT PRIMARY KEY,
    `post_id`      INT  NOT NULL,
    `user_id`      INT  NOT NULL,
    `comment_text` TEXT NOT NULL,
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`)  ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: follows
-- ============================================================

CREATE TABLE IF NOT EXISTS `follows` (
    `follower_id`  INT NOT NULL,
    `following_id` INT NOT NULL,
    `created_at`   TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`follower_id`, `following_id`),
    FOREIGN KEY (`follower_id`)  REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: chat_messages
-- Mensajes del chat en vivo "El Chismografo".
-- ============================================================

CREATE TABLE IF NOT EXISTS `chat_messages` (
    `id`         INT  AUTO_INCREMENT PRIMARY KEY,
    `user_id`    INT  NOT NULL,
    `message`    TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- TABLA: notifications
-- is_read: 0 = no leida, 1 = leida
-- type: 'like' | 'comment' | 'follow'
-- ============================================================

CREATE TABLE IF NOT EXISTS `notifications` (
    `id`         INT  AUTO_INCREMENT PRIMARY KEY,
    `user_id`    INT  NOT NULL,
    `sender_id`  INT  NOT NULL,
    `type`       ENUM('like','comment','follow') NOT NULL,
    `post_id`    INT  DEFAULT NULL,
    `is_read`    TINYINT(1) NOT NULL DEFAULT 0,
    `created_at` TIMESTAMP  DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`user_id`)   REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`sender_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- DATOS INICIALES: users
-- Contrasena de prueba para TODOS: 123456
-- Hash generado con PHP password_hash(..., PASSWORD_BCRYPT)
-- ============================================================

INSERT INTO `users` (`id`, `username`, `password`, `avatar`, `bio`) VALUES
(1, 'dj_chismoso',  '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🎧', 'El DJ oficial del chisme musical. Aqui comparto las playlists mas ardientes.'),
(2, 'el_rockero_99', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🎸', 'Amante de los solos de guitarra eternos, el vinilo y el rock clasico de verdad.'),
(3, 'indie_girl',    '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🌸', 'Descubriendo bandas indie que solo conocen 3 personas en un garaje de Seattle.'),
(4, 'lofi_relaxer',  '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '☕', 'Estudiando, durmiendo o tomando cafe con beats suaves de fondo. 24/7.'),
(5, 'gym_beast_88',  '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '⚡', 'Energia pura para romper records personales en el gimnasio. Sin musica no hay ganancias.');

-- ============================================================
-- DATOS INICIALES: posts
-- ============================================================

INSERT INTO `posts` (`id`, `user_id`, `spotify_url`, `spotify_id`, `spotify_type`, `title`, `chisme`, `category`) VALUES
(1, 4,
    'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhp79bB1',
    '37i9dQZF1DX8Uebhp79bB1', 'playlist',
    'Lo-Fi para Estudiar (y fingir productividad)',
    'Gente, esta playlist es mi salvacion. Sirve para cuando tienes que hacer una entrega en 3 horas pero en realidad pasas la mayor parte del tiempo mirando el gif de la chica anime en la ventana. Los beats son suaves, los pianos tienen la cantidad justa de melancolia y de verdad te transportan. 10/10 para concentrarse.',
    'Estudio'),
(2, 2,
    'https://open.spotify.com/playlist/37i9dQZF1DX3oM43Z9VHd2',
    '37i9dQZF1DX3oM43Z9VHd2', 'playlist',
    'Himnos del Rock de los 70s y 80s',
    'Si en tu playlist de manejo nocturno no tienes a Led Zeppelin, Queen, Pink Floyd y AC/DC... realmente estas viviendo? Arme y puli esta seleccion para sentir que vas manejando por la Ruta 66 en un convertible clasico, aunque solo vayas al supermercado en tu auto del 2012. Los solos de guitarra te curan la depresion.',
    'Rock'),
(3, 5,
    'https://open.spotify.com/playlist/37i9dQZF1DX76t638V6eg8',
    '37i9dQZF1DX76t638V6eg8', 'playlist',
    'Bestia del Gym: Modo Bestia Activado',
    'Para tirar ese press de banca pesado con la fuerza de mil soles. Si escuchas esta seleccion de metal y electronica pesada y no te crecen los biceps de inmediato, te devuelvo tus likes. Es la inyeccion de adrenalina pura que necesitas cuando tus musculos te ruegan que te rindas.',
    'Gym'),
(4, 3,
    'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3Xugwjg2',
    '37i9dQZF1DX2Nc3Xugwjg2', 'playlist',
    'Indie Pop para Dias Lluviosos',
    'Perfecto para sentarse junto a la ventana, mirar las gotas de lluvia caer y fingir que eres el protagonista de una pelicula adolescente de directores independientes que nadie conoce. Canciones nostalgicas, guitarras indie de baja fidelidad y voces susurradas. Ideal para sonar despierto.',
    'Indie'),
(5, 1,
    'https://open.spotify.com/track/60r5J2v6ug4ggZ426t566Z',
    '60r5J2v6ug4ggZ426t566Z', 'track',
    'Mice on Venus - C418 (Minecraft Nostalgia)',
    'El chisme de hoy es existencial. Alguien mas se pone extremadamente sentimental escuchando la musica de Minecraft? Te transporta a las 3 de la manana en el 2014, construyendo tu casita de tierra y piedra sin ninguna preocupacion de deudas o trabajo. C418 no compuso musica, compuso capsulas de tiempo nostalgicas.',
    'Gaming'),
(6, 4,
    'https://open.spotify.com/track/7MXVkcrfNqgL5P6UGmAn19',
    '7MXVkcrfNqgL5P6UGmAn19', 'track',
    'Another Love - Tom Odell (Para llorar feo)',
    'Advertencia: No escuches esto despues de las 12 AM si acabas de ver que tu ex subio una historia con su mejor amigo. Es una obra maestra melancolica. El crescendo de voz de Tom Odell te destroza el alma y te hace llorar aunque estes en una relacion estable y feliz. Chisme triste del dia.',
    'Triste');

-- ============================================================
-- DATOS INICIALES: likes
-- Se incluye reaction_type (columna NOT NULL con DEFAULT).
-- ============================================================

INSERT INTO `likes` (`user_id`, `post_id`, `reaction_type`) VALUES
(2, 1, 'heart'),
(3, 1, 'fire'),
(5, 1, 'clap'),
(1, 2, 'fire'),
(5, 2, 'heart'),
(1, 3, 'fire'),
(2, 3, 'skull'),
(1, 4, 'heart'),
(4, 4, 'cry'),
(2, 5, 'cry'),
(3, 5, 'heart'),
(4, 5, 'heart'),
(5, 5, 'cry'),
(1, 6, 'cry'),
(3, 6, 'skull');

-- ============================================================
-- DATOS INICIALES: comments
-- ============================================================

INSERT INTO `comments` (`post_id`, `user_id`, `comment_text`) VALUES
(1, 1, 'Totalmente de acuerdo, la nina de la ventana lofi es practicamente mi companera de cuarto a estas alturas.'),
(1, 3, 'Me encanta el track numero 4 de esa playlist, es una joya oculta.'),
(2, 1, 'El solo de Free Bird en esta lista te hace conducir al doble de velocidad permitido.'),
(2, 5, 'Perfecta para levantar pesado tambien, clasicos inmortales.'),
(3, 2, 'Esta musica del gym asusta a mis plantas, pero admito que levanto 10kg mas.'),
(4, 1, 'Recomiendo escuchar esto con una buena taza de te de manzanilla caliente.'),
(5, 4, 'Me acabas de desbloquear recuerdos hermosos de cuando jugaba con mis amigos del colegio. Que ganas de volver.'),
(6, 3, 'Me destruye esta cancion. La letra es demasiado.');

-- ============================================================
-- DATOS INICIALES: follows
-- ============================================================

INSERT INTO `follows` (`follower_id`, `following_id`) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 5),
(3, 1), (3, 4),
(4, 1), (4, 3),
(5, 1), (5, 2);

COMMIT;
