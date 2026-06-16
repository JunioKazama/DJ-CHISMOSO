-- ============================================================
-- DJ CHISMOSO - Script de Base de Datos para phpMyAdmin
-- ============================================================
-- Instrucciones:
-- 1. En Hostinger, crea una base de datos MySQL desde hPanel
-- 2. Abre phpMyAdmin desde tu panel de Hostinger
-- 3. Selecciona tu base de datos en el panel izquierdo
-- 4. Ve a la pestaña "Importar"
-- 5. Selecciona este archivo .sql y haz clic en "Continuar"
-- ============================================================

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";
SET NAMES utf8mb4;

-- ============================================================
-- Estructura de tabla: users
-- ============================================================

CREATE TABLE IF NOT EXISTS `users` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `username` VARCHAR(50) NOT NULL UNIQUE,
    `password` VARCHAR(255) NOT NULL,
    `avatar` VARCHAR(255) NOT NULL,
    `bio` TEXT DEFAULT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Estructura de tabla: posts
-- ============================================================

CREATE TABLE IF NOT EXISTS `posts` (
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
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Estructura de tabla: likes
-- ============================================================

CREATE TABLE IF NOT EXISTS `likes` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `user_id` INT NOT NULL,
    `post_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE KEY `unique_user_post` (`user_id`, `post_id`),
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Estructura de tabla: comments
-- ============================================================

CREATE TABLE IF NOT EXISTS `comments` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `post_id` INT NOT NULL,
    `user_id` INT NOT NULL,
    `comment_text` TEXT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`post_id`) REFERENCES `posts`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Estructura de tabla: follows
-- ============================================================

CREATE TABLE IF NOT EXISTS `follows` (
    `follower_id` INT NOT NULL,
    `following_id` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (`follower_id`, `following_id`),
    FOREIGN KEY (`follower_id`) REFERENCES `users`(`id`) ON DELETE CASCADE,
    FOREIGN KEY (`following_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- ============================================================
-- Datos iniciales: users
-- Contraseña de prueba para TODOS los usuarios: 123456
-- (Hash generado con password_hash de PHP)
-- ============================================================

INSERT INTO `users` (`id`, `username`, `password`, `avatar`, `bio`) VALUES
(1, 'dj_chismoso', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🎧', 'El DJ oficial del chisme musical. Aquí comparto las playlists más ardientes.'),
(2, 'el_rockero_99', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🎸', 'Amante de los solos de guitarra eternos, el vinilo y el rock clásico de verdad.'),
(3, 'indie_girl', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '🌸', 'Descubriendo bandas indie que solo conocen 3 personas en un garaje de Seattle.'),
(4, 'lofi_relaxer', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '☕', 'Estudiando, durmiendo o tomando café con beats suaves de fondo. 24/7.'),
(5, 'gym_beast_88', '$2y$10$e0MYzXyjpJS7Pd0RVDFKdu.1Hk5VmQGBxSNLabbJuVEgMZHJqnPe6', '⚡', 'Energía pura para romper récords personales en el gimnasio. Sin música no hay ganancias.');

-- ============================================================
-- Datos iniciales: posts
-- ============================================================

INSERT INTO `posts` (`id`, `user_id`, `spotify_url`, `spotify_id`, `spotify_type`, `title`, `chisme`, `category`) VALUES
(1, 4, 'https://open.spotify.com/playlist/37i9dQZF1DX8Uebhp79bB1', '37i9dQZF1DX8Uebhp79bB1', 'playlist', 'Lo-Fi para Estudiar (y fingir productividad)', 'Gente, esta playlist es mi salvación. Sirve para cuando tienes que hacer una entrega en 3 horas pero en realidad pasas la mayor parte del tiempo mirando el gif de la chica anime en la ventana. Los beats son suaves, los pianos tienen la cantidad justa de melancolía y de verdad te transportan. 10/10 para concentrarse.', 'Estudio'),
(2, 2, 'https://open.spotify.com/playlist/37i9dQZF1DX3oM43Z9VHd2', '37i9dQZF1DX3oM43Z9VHd2', 'playlist', 'Himnos del Rock de los 70s y 80s 🤘', 'Si en tu playlist de manejo nocturno no tienes a Led Zeppelin, Queen, Pink Floyd y AC/DC... ¿realmente estás viviendo? Armé y pulí esta selección para sentir que vas manejando por la Ruta 66 en un convertible clásico, aunque solo vayas al supermercado en tu auto del 2012. Los solos de guitarra te curan la depresión.', 'Rock'),
(3, 5, 'https://open.spotify.com/playlist/37i9dQZF1DX76t638V6eg8', '37i9dQZF1DX76t638V6eg8', 'playlist', 'Bestia del Gym: Modo Bestia Activado 🏋️‍♂️', 'Para tirar ese press de banca pesado con la fuerza de mil soles. Si escuchas esta selección de metal y electrónica pesada y no te crecen los bíceps de inmediato, te devuelvo tus likes. Es la inyección de adrenalina pura que necesitas cuando tus músculos te ruegan que te rindas.', 'Gym'),
(4, 3, 'https://open.spotify.com/playlist/37i9dQZF1DX2Nc3Xugwjg2', '37i9dQZF1DX2Nc3Xugwjg2', 'playlist', 'Indie Pop para Días Lluviosos ☔', 'Perfecto para sentarse junto a la ventana, mirar las gotas de lluvia caer y fingir que eres el protagonista de una película adolescente de directores independientes que nadie conoce. Canciones nostálgicas, guitarras indie de baja fidelidad y voces susurradas. Ideal para soñar despierto.', 'Indie'),
(5, 1, 'https://open.spotify.com/track/60r5J2v6ug4ggZ426t566Z', '60r5J2v6ug4ggZ426t566Z', 'track', 'Mice on Venus - C418 (Minecraft Nostalgia)', 'El chisme de hoy es existencial. ¿Alguien más se pone extremadamente sentimental escuchando la música de Minecraft? Te transporta a las 3 de la mañana en el 2014, construyendo tu casita de tierra y piedra sin ninguna preocupación de deudas o trabajo. C418 no compuso música, compuso cápsulas de tiempo nostálgicas.', 'Gaming'),
(6, 4, 'https://open.spotify.com/track/7MXVrxvOI26DynamicH316P', '7MXVrxvOI26DynamicH316P', 'track', 'Another Love - Tom Odell (Para llorar feo)', 'Advertencia: No escuches esto después de las 12 AM si acabas de ver que tu ex subió una historia con su \"mejor amigo/a\". Es una obra maestra melancólica. El crescendo de voz de Tom Odell te destroza el alma y te hace llorar aunque estés en una relación estable y feliz. Chisme triste del día.', 'Triste');

-- ============================================================
-- Datos iniciales: likes
-- ============================================================

INSERT INTO `likes` (`user_id`, `post_id`) VALUES
(2, 1), (3, 1), (5, 1),
(1, 2), (5, 2),
(1, 3), (2, 3),
(1, 4), (4, 4),
(2, 5), (3, 5), (4, 5), (5, 5),
(1, 6), (3, 6);

-- ============================================================
-- Datos iniciales: comments
-- ============================================================

INSERT INTO `comments` (`post_id`, `user_id`, `comment_text`) VALUES
(1, 1, 'Totalmente de acuerdo, la niña de la ventana lofi es prácticamente mi compañera de cuarto a estas alturas.'),
(1, 3, 'Me encanta el track número 4 de esa playlist, es una joya oculta.'),
(2, 1, '¡Uff! El solo de Free Bird en esta lista te hace conducir al doble de velocidad permitido.'),
(2, 5, 'Perfecta para levantar pesado también, clásicos inmortales.'),
(3, 2, 'Esta música del gym asusta a mis plantas, pero admito que levanto 10kg más.'),
(4, 1, 'Recomiendo escuchar esto con una buena taza de té de manzanilla caliente.'),
(5, 4, 'Me acabas de desbloquear recuerdos hermosos de cuando jugaba con mis amigos del colegio. Qué ganas de volver.'),
(6, 3, 'Me destruye esta canción. La letra de \"And if somebody hurts you, I wanna fight\" es demasiado.');

-- ============================================================
-- Datos iniciales: follows
-- ============================================================

INSERT INTO `follows` (`follower_id`, `following_id`) VALUES
(1, 2), (1, 3), (1, 4),
(2, 1), (2, 5),
(3, 1), (3, 4),
(4, 1), (4, 3),
(5, 1), (5, 2);

COMMIT;
