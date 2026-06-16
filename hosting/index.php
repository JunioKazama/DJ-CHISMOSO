<?php
/**
 * DJ CHISMOSO - Página Web Principal (SPA) - HOSTINGER
 */
require_once 'config.php';
?>
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta name="description" content="DJ CHISMOSO - La red social definitiva para descubrir música y compartir chismes sobre tus playlists de Spotify.">
    <title>DJ CHISMOSO - Descubrimiento Musical & Playlist Chismes</title>
    <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;600;700;800&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap" rel="stylesheet">
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <link rel="stylesheet" href="styles.css">
</head>
<body>

    <div class="glow-orb orb-1"></div>
    <div class="glow-orb orb-2"></div>
    <div class="glow-orb orb-3"></div>

    <div class="app-container">
        
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
                <div class="skeleton header-skeleton" style="width: 120px; height: 40px; border-radius: 20px;"></div>
            </div>
        </header>

        <div class="main-layout">
            
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

                <div class="categories-section">
                    <h3>Categorías</h3>
                    <div class="categories-list">
                        <button class="category-pill active" data-category="">Todos</button>
                        <button class="category-pill" data-category="Rock"><i class="fa-solid fa-guitar"></i> Rock</button>
                        <button class="category-pill" data-category="Indie"><i class="fa-solid fa-seedling"></i> Indie</button>
                        <button class="category-pill" data-category="Lo-fi"><i class="fa-solid fa-mug-hot"></i> Lo-fi</button>
                        <button class="category-pill" data-category="Gym"><i class="fa-solid fa-dumbbell"></i> Gym</button>
                        <button class="category-pill" data-category="Estudio"><i class="fa-solid fa-book"></i> Estudio</button>
                        <button class="category-pill" data-category="Triste"><i class="fa-solid fa-cloud-showers-heavy"></i> Triste</button>
                        <button class="category-pill" data-category="Gaming"><i class="fa-solid fa-gamepad"></i> Gaming</button>
                    </div>
                </div>

                <div class="sidebar-footer">
                    <p>© 2026 DJ CHISMOSO</p>
                    <p>Hecho para descubrir música 💚</p>
                    <a href="db_setup.php" class="setup-link"><i class="fa-solid fa-database"></i> Setup/Reset DB</a>
                </div>
            </aside>

            <main class="content-area">
                
                <section id="view-feed" class="app-view active">
                    <div class="feed-header">
                        <h2 id="feed-title">Explorar Chismes</h2>
                        <div class="feed-tabs">
                            <button class="feed-tab active" id="tab-recent">Recientes</button>
                            <button class="feed-tab" id="tab-popular">Más Votados</button>
                        </div>
                    </div>

                    <div class="posts-feed" id="posts-container">
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
                            <button id="profile-logout-btn" class="btn btn-outline" style="display: none;">
                                <i class="fa-solid fa-right-from-bracket"></i> Cerrar Sesión
                            </button>
                        </div>
                    </div>

                    <div class="profile-posts-section">
                        <h3>Publicaciones de <span id="profile-posts-user">...</span></h3>
                        <div class="posts-feed" id="profile-posts-container">
                            <!-- Posts -->
                        </div>
                    </div>
                </section>

            </main>

            <aside class="sidebar-right">
                
                <div class="ranking-panel">
                    <h3><i class="fa-solid fa-ranking-star accent-pink-text"></i> Chisme de la Semana</h3>
                    <div class="ranking-list" id="rankings-container">
                        <div class="skeleton-list-item"></div>
                        <div class="skeleton-list-item"></div>
                        <div class="skeleton-list-item"></div>
                    </div>
                </div>

                <div class="trending-panel">
                    <h3><i class="fa-solid fa-arrow-trend-up accent-green-text"></i> Canales Populares</h3>
                    <div class="trending-tags" id="trends-container">
                        <!-- Trends -->
                    </div>
                </div>

                <div class="active-users-panel">
                    <h3><i class="fa-solid fa-circle-nodes accent-purple-text"></i> DJ Activos en Sala</h3>
                    <div class="active-users-list">
                        <div class="user-active-item">
                            <div class="user-active-avatar">🎧<span class="online-indicator"></span></div>
                            <div class="user-active-info">
                                <span class="username">dj_chismoso</span>
                                <span class="status">Escuchando Lofi Chill</span>
                            </div>
                        </div>
                        <div class="user-active-item">
                            <div class="user-active-avatar">🎸<span class="online-indicator"></span></div>
                            <div class="user-active-info">
                                <span class="username">el_rockero_99</span>
                                <span class="status">Compartiendo Led Zeppelin</span>
                            </div>
                        </div>
                        <div class="user-active-item">
                            <div class="user-active-avatar">🌸<span class="online-indicator"></span></div>
                            <div class="user-active-info">
                                <span class="username">indie_girl</span>
                                <span class="status">Buscando joyas ocultas</span>
                            </div>
                        </div>
                    </div>
                </div>
            </aside>
        </div>

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
                    <!-- Spotify Embed -->
                </div>
            </div>

            <div class="player-right">
                <button class="btn-close-player" id="btn-close-player" title="Cerrar reproductor">
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>
        </footer>

    </div>

    <div class="modal-overlay" id="modal-auth">
        <div class="modal-card">
            <button class="modal-close" id="btn-close-modal-auth"><i class="fa-solid fa-xmark"></i></button>
            
            <div class="auth-tabs">
                <button class="auth-tab active" id="tab-login-btn">Iniciar Sesión</button>
                <button class="auth-tab" id="tab-register-btn">Registrarse</button>
            </div>

            <form id="form-login" class="auth-form active">
                <div class="form-group">
                    <label for="login-username">Usuario</label>
                    <input type="text" id="login-username" required placeholder="Ingresa tu usuario...">
                </div>
                <div class="form-group">
                    <label for="login-password">Contraseña</label>
                    <input type="password" id="login-password" required placeholder="Ingresa tu contraseña...">
                </div>
                <button type="submit" class="btn btn-primary btn-block">Entrar al Club 🎧</button>
            </form>

            <form id="form-register" class="auth-form">
                <div class="form-group">
                    <label for="register-username">Nombre de Usuario</label>
                    <input type="text" id="register-username" required placeholder="Min. 3 caracteres..." maxlength="20">
                </div>
                <div class="form-group">
                    <label for="register-password">Contraseña</label>
                    <input type="password" id="register-password" required placeholder="Min. 6 caracteres...">
                </div>
                <div class="form-group">
                    <label>Elige tu Avatar (Emoji)</label>
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
                <div class="form-group">
                    <label for="register-bio">Biografía Musical (Chisme sobre ti)</label>
                    <textarea id="register-bio" placeholder="¿Qué música escuchas? ¿Cuál es tu banda favorita?..." rows="3"></textarea>
                </div>
                <button type="submit" class="btn btn-primary btn-block">Crear Cuenta 🔥</button>
            </form>
            
            <div id="auth-error-msg" class="error-msg" style="display: none;"></div>
        </div>
    </div>

    <div class="modal-overlay" id="modal-create-post">
        <div class="modal-card">
            <button class="modal-close" id="btn-close-modal-create"><i class="fa-solid fa-xmark"></i></button>
            <h2>Compartir nuevo Chisme Musical 🎧</h2>
            <p style="color: var(--text-secondary); margin-bottom: 25px; font-size: 0.95rem;">Pega un enlace de Spotify y cuéntanos la historia detrás.</p>
            
            <form id="form-create-post">
                <div class="form-group">
                    <label for="post-spotify-url">Enlace de Spotify (Canción, Playlist o Álbum)</label>
                    <div class="input-with-icon">
                        <i class="fa-brands fa-spotify spotify-input-icon"></i>
                        <input type="url" id="post-spotify-url" required placeholder="https://open.spotify.com/playlist/... o /track/..." autocomplete="off">
                    </div>
                    <span class="input-help">Puedes copiar el enlace de compartir directamente de la app de Spotify.</span>
                </div>

                <div class="form-group">
                    <label for="post-title">Título Llamativo</label>
                    <input type="text" id="post-title" required placeholder="Ej: La playlist definitiva para llorar en la ducha..." maxlength="100">
                </div>

                <div class="form-group">
                    <label for="post-category">Categoría principal</label>
                    <select id="post-category">
                        <option value="Rock">Rock</option>
                        <option value="Indie">Indie</option>
                        <option value="Lo-fi">Lo-fi</option>
                        <option value="Gym">Gym</option>
                        <option value="Estudio">Estudio</option>
                        <option value="Triste">Triste</option>
                        <option value="Gaming">Gaming</option>
                    </select>
                </div>

                <div class="form-group">
                    <label for="post-chisme">El \"Chisme\" (¿Por qué nos recomiendas esto? Cuenta tu historia)</label>
                    <textarea id="post-chisme" required placeholder="Cuéntanos: ¿En qué momento la escuchas? ¿Cuál es tu chisme, historia o anécdota con este set musical?..." rows="5" maxlength="1500"></textarea>
                    <div class="textarea-counter"><span id="chisme-char-count">0</span> / 1500</div>
                </div>

                <div id="post-error-msg" class="error-msg" style="display: none;"></div>
                <button type="submit" class="btn btn-primary btn-block">¡Publicar Chisme! 🚀</button>
            </form>
        </div>
    </div>

    <div class="modal-overlay" id="modal-comments">
        <div class="modal-card comments-modal-card">
            <button class="modal-close" id="btn-close-modal-comments"><i class="fa-solid fa-xmark"></i></button>
            
            <div class="comments-modal-layout">
                <div class="comments-post-preview" id="comments-post-preview-area">
                    <!-- Post -->
                </div>
                
                <div class="comments-section-area">
                    <h3>Discusión sobre la música 💬</h3>
                    <div class="comments-list-container" id="modal-comments-list">
                        <!-- Comments -->
                    </div>
                    
                    <div class="add-comment-wrapper">
                        <div class="add-comment-input-row" id="comment-form-auth-check">
                            <!-- Form -->
                        </div>
                    </div>
                </div>
            </div>
        </div>
    </div>

    <div class="toast-notification" id="toast-notify">¡Acción realizada!</div>

    <script src="app.js"></script>
</body>
</html>
