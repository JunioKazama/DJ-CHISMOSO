<?php
/**
 * DJ CHISMOSO - Página Web Principal (SPA) - HOSTINGER
 * 
 * Esta es la vista principal que carga el layout completo del dashboard de música.
 * Controla el esqueleto HTML, carga las fuentes, íconos, estilos CSS y el controlador Javascript.
 */
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="DJ CHISMOSO - La red social definitiva para descubrir música y compartir chismes sobre tus playlists de Spotify.">
    <title>DJ CHISMOSO - Descubrimiento Musical &amp; Playlist Chismes</title>
    
    <!-- Favicon / Icono de la pestaña: Emoji de Audífonos -->
    <link rel="icon" href="data:image/svg+xml,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 100 100%22><text y=%22.9em%22 font-size=%2280%22>🎧</text></svg>">
    
    <!-- Fuentes premium de Google Fonts -->
    <!-- PERF: preconnect abre la conexión TCP con anticipación, reduce carga de fuentes ~200ms -->
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">

    
    <!-- Iconos de FontAwesome -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    
    <!-- Bootstrap 5 CSS -->
    <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet" integrity="sha384-QWTKZyjpPEjISv5WaRU9OFeRpok6YctnYmDr5pNlyT2bRjXh0JMhjY6hW+ALEwIH" crossorigin="anonymous">

    <!-- Estilos CSS personalizados -->
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <!-- Fondos dinámicos difuminados (Ambient Glowing Orbs) -->
    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>
    <div class="glow-orb orb-3"></div>

    <div class="app-container">
        
        <!-- ==========================================
             1. HEADER (BARRA SUPERIOR)
             ========================================== -->
        <header class="app-header" id="app-header">
            <div class="header-left">
                <div class="logo-wrapper" id="nav-home-logo">
                    <span class="logo-emoji">🎧</span>
                    <span class="logo-text">DJ <span class="accent-text">CHISMOSO</span></span>
                </div>
            </div>
            
            <div class="header-center">
                <div class="search-bar-container">
                    <i class="fa-solid fa-magnifying-glass search-icon"></i>
                    <input type="text" id="search-input" placeholder="Buscar canciones, artistas, usuarios o chismes..." autocomplete="off">
                    <button id="search-clear-btn" class="search-clear-btn" style="display: none;">
                        <i class="fa-solid fa-xmark"></i>
                    </button>
                </div>
            </div>
            
            <div class="header-right" id="header-user-area">
                <!-- Se poblará dinámicamente con JS (Botón Login o Perfil de Usuario + Campana) -->
                <div class="skeleton header-skeleton" style="width: 120px; height: 40px; border-radius: 20px;"></div>
            </div>
        </header>

        <!-- ==========================================
             2. CUERPO PRINCIPAL (DISEÑO 3 COLUMNAS)
             ========================================== -->
        <div class="main-layout">
            
            <!-- --- COLUMNA 1: SIDEBAR IZQUIERDO (NAVEGACIÓN) --- -->
            <aside class="sidebar-left">
                <nav class="sidebar-nav">
                    <button class="nav-btn active" id="btn-nav-feed">
                        <i class="fa-solid fa-house"></i>
                        <span>Inicio / Feed</span>
                    </button>
                    <button class="nav-btn" id="btn-nav-trending">
                        <i class="fa-solid fa-fire"></i>
                        <span>Tendencias</span>
                    </button>
                    <button class="nav-btn" id="btn-nav-following" style="display: none;">
                        <i class="fa-solid fa-user-group"></i>
                        <span>Siguiendo</span>
                    </button>
                    <button class="nav-btn" id="btn-nav-create-post">
                        <i class="fa-solid fa-circle-plus"></i>
                        <span>Compartir Chisme</span>
                    </button>
                    <button class="nav-btn" id="btn-nav-profile" style="display: none;">
                        <i class="fa-solid fa-user"></i>
                        <span>Mi Perfil</span>
                    </button>
                </nav>

                <div class="sidebar-divider"></div>

                <!-- Filtros de Formato Spotify -->
                <div class="categories-section">
                    <h3>Formato</h3>
                    <div class="categories-list">
                        <button class="category-pill active" data-spotify-type="">🎵 Todos</button>
                        <button class="category-pill" data-spotify-type="track"><i class="fa-solid fa-music"></i> Canciones</button>
                        <button class="category-pill" data-spotify-type="playlist"><i class="fa-solid fa-list-music"></i> Playlists</button>
                        <button class="category-pill" data-spotify-type="album"><i class="fa-solid fa-record-vinyl"></i> Álbumes</button>
                    </div>
                </div>

                <div class="sidebar-divider"></div>

                <div class="categories-section">
                    <h3>Categorías</h3>
                    <div class="categories-list">
                        <button class="category-pill-genre active" data-category="">Todos</button>
                        <button class="category-pill-genre" data-category="Rock"><i class="fa-solid fa-guitar"></i> Rock</button>
                        <button class="category-pill-genre" data-category="Indie"><i class="fa-solid fa-seedling"></i> Indie</button>
                        <button class="category-pill-genre" data-category="Lo-fi"><i class="fa-solid fa-mug-hot"></i> Lo-fi</button>
                        <button class="category-pill-genre" data-category="Gym"><i class="fa-solid fa-dumbbell"></i> Gym</button>
                        <button class="category-pill-genre" data-category="Estudio"><i class="fa-solid fa-book"></i> Estudio</button>
                        <button class="category-pill-genre" data-category="Triste"><i class="fa-solid fa-cloud-showers-heavy"></i> Triste</button>
                        <button class="category-pill-genre" data-category="Gaming"><i class="fa-solid fa-gamepad"></i> Gaming</button>
                    </div>
                </div>

                <!-- Footer del Sidebar -->
                <div class="sidebar-footer">
                    <p>© 2026 DJ CHISMOSO</p>
                    <p>Hecho para descubrir música 💚</p>
                    <a href="db_setup.php" target="_blank" class="setup-link"><i class="fa-solid fa-database"></i> Reset Base de Datos</a>
                </div>
            </aside>

            <!-- --- COLUMNA 2: CONTENIDO CENTRAL (FEED / VISTAS) --- -->
            <main class="content-area">
                
                <!-- Vista: Feed Principal -->
                <section id="view-feed" class="app-view active">
                    <div class="feed-header">
                        <h2 id="feed-title">Explorar Chismes</h2>
                        <div class="feed-tabs">
                            <button class="feed-tab active" id="tab-recent">Recientes</button>
                            <button class="feed-tab" id="tab-popular">Más Votados</button>
                            <button class="feed-tab" id="tab-following" style="display:none;">Siguiendo</button>
                        </div>
                    </div>

                    <!-- Grid de Publicaciones -->
                    <div class="posts-feed" id="posts-container">
                        <!-- Cargador Esqueleto -->
                        <div class="post-card skeleton-card">
                            <div class="skeleton-header">
                                <div class="skeleton skeleton-avatar"></div>
                                <div class="skeleton skeleton-text" style="width: 150px;"></div>
                            </div>
                            <div class="skeleton skeleton-title"></div>
                            <div class="skeleton skeleton-body" style="height: 80px;"></div>
                            <div class="skeleton skeleton-player" style="height: 150px;"></div>
                        </div>
                    </div>
                </section>

                <!-- Vista: Perfil de Usuario -->
                <section id="view-profile" class="app-view">
                    <div class="profile-header-card">
                        <div class="profile-avatar-large" id="profile-avatar">🎧</div>
                        <div class="profile-info-details">
                            <h2 id="profile-username">Cargando...</h2>
                            <p class="profile-joined" id="profile-joined">Miembro desde: ...</p>
                            <p class="profile-bio" id="profile-bio">Este usuario aún no tiene biografía musical.</p>
                            
                            <div class="profile-stats">
                                <div class="stat-item">
                                    <span class="stat-num" id="profile-posts-count">0</span>
                                    <span class="stat-label">Chismes</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-num" id="profile-followers-count">0</span>
                                    <span class="stat-label">Seguidores</span>
                                </div>
                                <div class="stat-item">
                                    <span class="stat-num" id="profile-following-count">0</span>
                                    <span class="stat-label">Seguidos</span>
                                </div>
                            </div>
                        </div>
                        <div class="profile-actions-area">
                            <button id="profile-follow-btn" class="btn btn-follow" style="display: none;">
                                <i class="fa-solid fa-user-plus"></i> Seguir
                            </button>
                            <button id="profile-edit-btn" class="btn btn-outline-edit" style="display: none;">
                                <i class="fa-solid fa-pen-to-square"></i> Editar Perfil
                            </button>
                            <button id="profile-logout-btn" class="btn btn-outline" style="display: none;">
                                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                            </button>
                        </div>
                    </div>

                    <!-- Canción Insignia del DJ -->
                    <div id="profile-featured-track-area" style="display:none;">
                        <div class="featured-track-label">
                            <i class="fa-solid fa-star accent-text"></i> Canción Insignia del DJ
                        </div>
                        <div id="profile-featured-track-embed"></div>
                    </div>

                    <div class="profile-posts-section">
                        <h3>Publicaciones de <span id="profile-posts-user">...</span></h3>
                        <div class="posts-feed" id="profile-posts-container">
                            <!-- Publicaciones de este usuario -->
                        </div>
                    </div>
                </section>

            </main>

            <!-- --- COLUMNA 3: SIDEBAR DERECHO (TENDENCIAS, RANKINGS Y CHAT) --- -->
            <aside class="sidebar-right">
                
                <!-- Sección 1: Rankings Semanales -->
                <div class="ranking-panel">
                    <h3><i class="fa-solid fa-ranking-star accent-pink-text"></i> Chisme de la Semana</h3>
                    <div class="ranking-list" id="rankings-container">
                        <div class="skeleton-list-item"></div>
                        <div class="skeleton-list-item"></div>
                        <div class="skeleton-list-item"></div>
                    </div>
                </div>

                <!-- Sección 2: Categorías en Tendencia -->
                <div class="trending-panel">
                    <h3><i class="fa-solid fa-arrow-trend-up accent-green-text"></i> Canales Populares</h3>
                    <div class="trending-tags" id="trends-container">
                        <!-- Se poblará con JS -->
                    </div>
                </div>


            </aside>
        </div>

        <!-- ==========================================
             3. PERSISTENT FLOATING PLAYER (REPRODUCTOR INFERIOR)
             ========================================== -->
        <footer class="persistent-player-bar" id="floating-player" style="display: none;">
            <div class="player-left">
                <div class="now-playing-info">
                    <span class="music-note-icon"><i class="fa-solid fa-compact-disc animated-spin"></i></span>
                    <div class="playing-text">
                        <h4 id="player-title">Cargando reproductor...</h4>
                        <p id="player-category">Canal musical</p>
                    </div>
                </div>
            </div>
            
            <div class="player-center">
                <!-- Espectro animado de ondas de audio -->
                <div class="audio-waves" id="audio-waves-visualizer">
                    <span class="wave-bar bar1"></span>
                    <span class="wave-bar bar2"></span>
                    <span class="wave-bar bar3"></span>
                    <span class="wave-bar bar4"></span>
                    <span class="wave-bar bar5"></span>
                    <span class="wave-bar bar6"></span>
                    <span class="wave-bar bar7"></span>
                    <span class="wave-bar bar8"></span>
                </div>
                <div class="player-iframe-container" id="player-embed-wrapper">
                    <!-- Iframe de Spotify cargado dinámicamente -->
                </div>
            </div>

            <div class="player-right">
                <!-- Botón de cola de reproducción -->
                <button class="btn-queue-toggle" id="btn-queue-toggle" title="Cola de reproducción">
                    <i class="fa-solid fa-list-ol"></i>
                    <span class="queue-count-badge" id="queue-count-badge" style="display:none;">0</span>
                </button>
                <button class="btn-next-player" id="btn-next-player" title="Siguiente canción">
                    <i class="fa-solid fa-forward"></i>
                </button>
                <button class="btn-close-player" id="btn-close-player" title="Cerrar reproductor">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </footer>

        <!-- Panel flotante: Cola de Reproducción -->
        <div class="queue-panel" id="queue-panel" style="display:none;">
            <div class="queue-panel-header">
                <h4><i class="fa-solid fa-list-ol"></i> Cola de Reproducción</h4>
                <button id="btn-clear-queue" class="btn-clear-queue" title="Limpiar cola">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
            <div class="queue-list" id="queue-list">
                <div class="queue-empty">
                    <i class="fa-solid fa-music"></i>
                    <p>La cola está vacía.<br>Añade canciones desde el feed.</p>
                </div>
            </div>
        </div>

    </div>

    <!-- ==========================================
         4. MODALES
         ========================================== -->

    <!-- Modal 1: Login / Registro (Auth) -->
    <div class="modal fade" id="modal-auth" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bs-modal-content">
                <div class="modal-body p-4 position-relative">
                    <button type="button" class="btn-close btn-close-white position-absolute" style="top: 20px; right: 20px; z-index: 10;" data-bs-dismiss="modal" aria-label="Close" id="btn-close-modal-auth"></button>
                    
                    <div class="auth-tabs mt-2">
                        <button class="auth-tab active" id="tab-login-btn">Iniciar Sesión</button>
                        <button class="auth-tab" id="tab-register-btn">Registrarse</button>
                    </div>

                    <!-- Formulario de Login -->
                    <form id="form-login" class="auth-form active">
                        <div class="mb-3">
                            <label for="login-username" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Usuario</label>
                            <input type="text" id="login-username" class="form-control bs-input" required placeholder="Ingresa tu usuario...">
                        </div>
                        <div class="mb-3">
                            <label for="login-password" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Contraseña</label>
                            <input type="password" id="login-password" class="form-control bs-input" required placeholder="Ingresa tu contraseña...">
                        </div>
                        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">Entrar al Club 🎧</button>
                    </form>

                    <!-- Formulario de Registro -->
                    <form id="form-register" class="auth-form">
                        <div class="mb-3">
                            <label for="register-username" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Nombre de Usuario</label>
                            <input type="text" id="register-username" class="form-control bs-input" required placeholder="Min. 3 caracteres..." maxlength="20">
                        </div>
                        <div class="mb-3">
                            <label for="register-password" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Contraseña</label>
                            <input type="password" id="register-password" class="form-control bs-input" required placeholder="Min. 6 caracteres...">
                        </div>
                        <div class="mb-3">
                            <label class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Elige tu Avatar (Emoji)</label>
                            <div class="avatar-selector">
                                <label class="avatar-option"><input type="radio" name="avatar" value="🎧" checked><span>🎧</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="🎸"><span>🎸</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="🌸"><span>🌸</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="☕"><span>☕</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="⚡"><span>⚡</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="🐱"><span>🐱</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="👾"><span>👾</span></label>
                                <label class="avatar-option"><input type="radio" name="avatar" value="🔥"><span>🔥</span></label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="register-bio" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Biografía Musical (Chisme sobre ti)</label>
                            <textarea id="register-bio" class="form-control bs-input" placeholder="¿Qué música escuchas? ¿Cuál es tu banda favorita?..." rows="3"></textarea>
                        </div>
                        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">Crear Cuenta 🔥</button>
                    </form>
                    
                    <div id="auth-error-msg" class="error-msg mt-3" style="display: none;"></div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal 2: Crear Publicación (Crear Chisme) -->
    <div class="modal fade" id="modal-create-post" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-lg">
            <div class="modal-content bs-modal-content">
                <div class="modal-body p-4 position-relative">
                    <button type="button" class="btn-close btn-close-white position-absolute" style="top: 20px; right: 20px; z-index: 10;" data-bs-dismiss="modal" aria-label="Close" id="btn-close-modal-create"></button>
                    <h2 class="mb-2">Compartir nuevo Chisme Musical 🎧</h2>
                    <p class="text-secondary mb-4" style="font-size: 0.95rem;">Pega un enlace de Spotify y cuéntanos la historia detrás.</p>
                    
                    <form id="form-create-post">
                        <div class="mb-3">
                            <label for="post-spotify-url" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Enlace de Spotify (Canción, Playlist o Álbum)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-transparent border-end-0 text-success"><i class="fa-brands fa-spotify spotify-input-icon"></i></span>
                                <input type="url" id="post-spotify-url" class="form-control bs-input border-start-0" required placeholder="https://open.spotify.com/playlist/... o /track/..." autocomplete="off">
                            </div>
                            <div class="form-text text-muted mt-1" style="font-size: 0.8rem;">Puedes copiar el enlace de compartir directamente de la app de Spotify.</div>
                        </div>

                        <div class="mb-3">
                            <label for="post-title" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Título Llamativo</label>
                            <input type="text" id="post-title" class="form-control bs-input" required placeholder="Ej: La playlist definitiva para llorar en la ducha..." maxlength="100">
                        </div>

                        <div class="mb-3">
                            <label for="post-category" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Categoría principal</label>
                            <select id="post-category" class="form-select bs-input">
                                <option value="Rock">Rock</option>
                                <option value="Indie">Indie</option>
                                <option value="Lo-fi">Lo-fi</option>
                                <option value="Gym">Gym</option>
                                <option value="Estudio">Estudio</option>
                                <option value="Triste">Triste</option>
                                <option value="Gaming">Gaming</option>
                            </select>
                        </div>

                        <div class="mb-3">
                            <label for="post-chisme" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">El "Chisme" (¿Por qué nos recomiendas esto? Cuenta tu historia)</label>
                            <textarea id="post-chisme" class="form-control bs-input" required placeholder="Cuéntanos: ¿En qué momento la escuchas? ¿Cuál es tu chisme, historia o anécdota con este set musical?..." rows="5" maxlength="1500"></textarea>
                            <div class="textarea-counter mt-1 text-end text-muted" style="font-size: 0.75rem;"><span id="chisme-char-count">0</span> / 1500</div>
                        </div>

                        <div id="post-error-msg" class="error-msg mb-3" style="display: none;"></div>
                        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">¡Publicar Chisme! 🚀</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal 3: Comentarios Detallados -->
    <div class="modal fade" id="modal-comments" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered modal-xl">
            <div class="modal-content bs-modal-content">
                <div class="modal-body p-4 position-relative">
                    <button type="button" class="btn-close btn-close-white position-absolute" style="top: 20px; right: 20px; z-index: 10;" data-bs-dismiss="modal" aria-label="Close" id="btn-close-modal-comments"></button>
                    
                    <div class="comments-modal-layout mt-3">
                        <!-- Izquierda: Vista previa del Post -->
                        <div class="comments-post-preview" id="comments-post-preview-area">
                            <!-- Post cargado dinámicamente -->
                        </div>
                        
                        <!-- Derecha: Listado de Comentarios -->
                        <div class="comments-section-area">
                            <h3>Discusión sobre la música 💬</h3>
                            <div class="comments-list-container" id="modal-comments-list">
                                <!-- Comentarios dinámicos -->
                            </div>
                            
                            <!-- Formulario para agregar comentario -->
                            <div class="add-comment-wrapper">
                                <div class="add-comment-input-row" id="comment-form-auth-check">
                                    <!-- Se poblará dinámicamente dependiendo de si está logueado -->
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <!-- Modal 4: Editar Perfil -->
    <div class="modal fade" id="modal-edit-profile" tabindex="-1" aria-hidden="true">
        <div class="modal-dialog modal-dialog-centered">
            <div class="modal-content bs-modal-content">
                <div class="modal-body p-4 position-relative">
                    <button type="button" class="btn-close btn-close-white position-absolute" style="top: 20px; right: 20px; z-index: 10;" data-bs-dismiss="modal" aria-label="Close" id="btn-close-modal-edit"></button>
                    <h2 class="mb-1">Editar tu Perfil DJ 🎚️</h2>
                    <p class="text-secondary mb-4" style="font-size: 0.9rem;">Personaliza cómo te ven los demás DJs.</p>

                    <form id="form-edit-profile">
                        <div class="mb-3">
                            <label class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Tu Avatar (Emoji)</label>
                            <div class="avatar-selector" id="edit-avatar-selector">
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="🎧"><span>🎧</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="🎸"><span>🎸</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="🌸"><span>🌸</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="☕"><span>☕</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="⚡"><span>⚡</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="🐱"><span>🐱</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="👾"><span>👾</span></label>
                                <label class="avatar-option"><input type="radio" name="edit-avatar" value="🔥"><span>🔥</span></label>
                            </div>
                        </div>
                        <div class="mb-3">
                            <label for="edit-bio" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">Biografía Musical</label>
                            <textarea id="edit-bio" class="form-control bs-input" rows="3" placeholder="Cuéntanos tu historia musical..." maxlength="300"></textarea>
                        </div>
                        <div class="mb-3">
                            <label for="edit-featured-track" class="form-label text-secondary text-uppercase fw-bold" style="font-size: 0.85rem; letter-spacing: 0.5px;">🌟 Canción Insignia (Enlace Spotify)</label>
                            <div class="input-group">
                                <span class="input-group-text bg-transparent border-end-0 text-success"><i class="fa-brands fa-spotify"></i></span>
                                <input type="url" id="edit-featured-track" class="form-control bs-input border-start-0" placeholder="https://open.spotify.com/track/... (opcional)">
                            </div>
                            <div class="form-text text-muted mt-1" style="font-size: 0.8rem;">Esta canción aparecerá en tu perfil para que todos la escuchen.</div>
                        </div>

                        <div id="edit-profile-error-msg" class="error-msg mb-3" style="display: none;"></div>
                        <button type="submit" class="btn btn-primary w-100 py-2 fw-bold">Guardar Cambios ✅</button>
                    </form>
                </div>
            </div>
        </div>
    </div>

    <!-- Toast de Notificaciones Flotantes -->
    <div class="toast-container position-fixed bottom-0 end-0 p-3" style="z-index: 3000;">
        <div id="toast-notify" class="toast align-items-center border-0 bg-dark text-white" role="alert" aria-live="assertive" aria-atomic="true">
            <div class="d-flex">
                <div class="toast-body" id="toast-body-text">
                    ¡Acción realizada!
                </div>
                <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
            </div>
        </div>
    </div>

    <!-- ==========================================
         BURBUJA FLOTANTE: EL CHISMÓGRAFO (CHAT)
         ========================================== -->
    <div id="chat-bubble-root">

        <!-- Ventana de Chat (oculta por defecto) -->
        <div id="chat-window" class="chat-window" aria-hidden="true">
            <div class="chat-window-header">
                <div class="chat-window-title">
                    <i class="fa-solid fa-comments"></i>
                    <span>El Chismógrafo</span>
                    <span class="chat-live-dot"></span>
                    <span class="chat-live-label">EN VIVO</span>
                </div>
                <button id="btn-close-chat-window" class="btn-close-chat" title="Cerrar chat">
                    <i class="fa-solid fa-chevron-down"></i>
                </button>
            </div>
            <div class="chat-messages-container" id="chat-messages-list">
                <div class="chat-placeholder">
                    <i class="fa-solid fa-satellite-dish"></i>
                    <span>Sintonizando sala...</span>
                </div>
            </div>
            <div class="chat-input-row" id="chat-input-area">
                <!-- Se renderizará dinámicamente según sesión -->
                <div class="chat-login-prompt">
                    <span onclick="openModal('modal-auth')" style="cursor:pointer; color: var(--spotify-green);">Inicia sesión</span> para chatear
                </div>
            </div>
        </div>

        <!-- Burbuja (botón flotante) -->
        <button id="btn-chat-bubble" class="chat-bubble-btn" title="El Chismógrafo - Chat en Vivo" aria-label="Abrir chat">
            <i class="fa-solid fa-comments chat-bubble-icon-open"></i>
            <i class="fa-solid fa-chevron-down chat-bubble-icon-close" style="display:none;"></i>
            <span class="chat-bubble-badge" id="chat-bubble-unread" style="display:none;">!</span>
        </button>
    </div>


    <script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js" integrity="sha384-YvpcrYf0tY3lHB60NNkmXc5s9fDVZLESaAA55NDzOxhy9GkcIdslK1eN7N6jIeHz" crossorigin="anonymous"></script>

    <!-- Script Controlador principal -->
    <script src="app.js"></script>
</body>
</html>
