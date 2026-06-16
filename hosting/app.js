/**
 * DJ CHISMOSO - Controlador Principal del Frontend (SPA)
 * 
 * Este archivo gestiona el estado de la aplicación, el enrutamiento de vistas,
 * el envío de peticiones AJAX (Fetch API) a api.php y la interactividad visual de la interfaz.
 */

// --- ESTADO GLOBAL DE LA APP ---
const AppState = {
    currentUser: null,
    currentCategory: '',
    currentSearch: '',
    currentFilter: 'recent', // 'recent' o 'popular' (Trending)
    currentView: 'feed', // 'feed' o 'profile'
    selectedProfileId: null,
    searchTimeout: null
};

// --- AL CARGAR EL DOCUMENTO ---
document.addEventListener('DOMContentLoaded', () => {
    AppInit();
});

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
function AppInit() {
    // 1. Obtener la sesión del usuario actual
    fetchSession();

    // 2. Cargar contenido inicial de los feeds y paneles laterales
    loadFeed();
    loadRankings();
    loadTrends();

    // 3. Vincular todos los manejadores de eventos
    bindEventEvents();
}

// ==========================================
// 1. GESTIÓN DE SESIÓN Y USUARIO (AJAX)
// ==========================================

async function fetchSession() {
    try {
        const response = await fetch('api.php?action=get_session');
        const result = await response.json();
        
        if (result.success && result.data) {
            AppState.currentUser = result.data;
            renderUserHeader(result.data);
            
            // Mostrar opción de "Mi Perfil" en el menú de navegación
            document.getElementById('btn-nav-profile').style.display = 'flex';
        } else {
            AppState.currentUser = null;
            renderGuestHeader();
            document.getElementById('btn-nav-profile').style.display = 'none';
        }
    } catch (error) {
        console.error('Error al obtener la sesión:', error);
        renderGuestHeader();
    }
}

function renderUserHeader(user) {
    const userArea = document.getElementById('header-user-area');
    userArea.innerHTML = `
        <div class="user-menu-header" id="header-user-menu">
            <div class="user-menu-avatar">${user.avatar}</div>
            <span class="user-menu-name">${user.username}</span>
        </div>
    `;
    
    // Al hacer clic en el menú del usuario en la cabecera, nos lleva a su perfil
    document.getElementById('header-user-menu').addEventListener('click', () => {
        switchView('profile', user.id);
    });
}

function renderGuestHeader() {
    const userArea = document.getElementById('header-user-area');
    userArea.innerHTML = `
        <button class="btn btn-primary" id="btn-header-login">
            <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
        </button>
    `;
    
    document.getElementById('btn-header-login').addEventListener('click', () => {
        openModal('modal-auth');
    });
}

// ==========================================
// 2. ENRUTAMIENTO DE VISTAS (SPA)
// ==========================================

function switchView(viewName, targetId = null) {
    // Ocultar todas las vistas
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));
    
    // Desactivar todos los botones de navegación
    const navButtons = document.querySelectorAll('.nav-btn');
    navButtons.forEach(btn => btn.classList.remove('active'));

    AppState.currentView = viewName;

    if (viewName === 'feed') {
        document.getElementById('view-feed').classList.add('active');
        document.getElementById('btn-nav-feed').classList.add('active');
        AppState.selectedProfileId = null;
        loadFeed();
    } 
    else if (viewName === 'profile') {
        document.getElementById('view-profile').classList.add('active');
        // Si es el perfil del usuario activo, marcamos su botón de navegación
        if (targetId && AppState.currentUser && parseInt(targetId) === parseInt(AppState.currentUser.id)) {
            document.getElementById('btn-nav-profile').classList.add('active');
        }
        AppState.selectedProfileId = targetId;
        loadProfileData(targetId);
    }
    
    // Desplazarse al inicio
    document.querySelector('.content-area').scrollTop = 0;
}

// ==========================================
// 3. CARGA Y RENDERIZADO DE FEED (AJAX)
// ==========================================

async function loadFeed() {
    const postsContainer = document.getElementById('posts-container');
    
    // Mostrar loader esqueleto antes de cargar
    renderSkeletonLoader(postsContainer);

    try {
        let url = `api.php?action=get_posts&filter=${AppState.currentFilter}`;
        if (AppState.currentCategory) {
            url += `&category=${encodeURIComponent(AppState.currentCategory)}`;
        }
        if (AppState.currentSearch) {
            url += `&search=${encodeURIComponent(AppState.currentSearch)}`;
        }

        const response = await fetch(url);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            postsContainer.innerHTML = '';
            result.data.forEach(post => {
                postsContainer.appendChild(renderPostCard(post));
            });
        } else {
            postsContainer.innerHTML = `
                <div class="feed-empty-state">
                    <i class="fa-solid fa-compact-disc"></i>
                    <h4>No se encontraron chismes</h4>
                    <p>Sé el primero en compartir música sobre ${AppState.currentCategory || 'esta búsqueda'} en este canal.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar publicaciones:', error);
        postsContainer.innerHTML = `
            <div class="feed-empty-state">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--chisme-pink);"></i>
                <h4>Error de conexión</h4>
                <p>No se pudo conectar a la base de datos de DJ CHISMOSO.</p>
            </div>
        `;
    }
}

// Genera el HTML de una tarjeta de publicación
function renderPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;

    // Validar tipo de avatar
    const userAvatar = post.user_avatar || '🎧';
    
    // Comprobar si el usuario actual sigue a este creador
    let followBtnHtml = '';
    if (AppState.currentUser && parseInt(post.user_id) !== parseInt(AppState.currentUser.id)) {
        // En un escenario real verificaríamos si lo sigue, por ahora mostramos un botón rápido
        followBtnHtml = `<button class="follow-badge-btn" onclick="handleQuickFollow(event, ${post.user_id})">+ Seguir</button>`;
    }

    // Estilo especial para la tarjeta de música de Spotify
    let musicCardHtml = '';
    const iconType = post.spotify_type === 'playlist' ? 'fa-music' : (post.spotify_type === 'album' ? 'fa-record-vinyl' : 'fa-compact-disc');
    
    // Título descriptivo para la música
    const musicTitle = post.spotify_type.charAt(0).toUpperCase() + post.spotify_type.slice(1);
    
    musicCardHtml = `
        <div class="post-music-card">
            <div class="music-info-left">
                <div class="album-art-fallback">
                    <i class="fa-solid ${iconType}"></i>
                </div>
                <div class="music-text-details">
                    <span class="music-track-title">${escapeHTML(post.title)}</span>
                    <span class="music-artist-name">Compartido en canal #${escapeHTML(post.category)}</span>
                    <span class="music-badge-type">${musicTitle} Spotify</span>
                </div>
            </div>
            <div class="music-card-actions">
                <button class="btn-listen" onclick="playMusic('${post.spotify_id}', '${post.spotify_type}', '${escapeHTML(post.title)}', '${escapeHTML(post.category)}')">
                    <i class="fa-solid fa-play"></i> Escuchar
                </button>
                <a href="${post.spotify_url}" target="_blank" class="btn-spotify-link" title="Abrir en Spotify App">
                    <i class="fa-brands fa-spotify"></i>
                </a>
            </div>
        </div>
    `;

    // Validar si el usuario actual ya le dio like
    const likeActive = parseInt(post.user_liked) > 0 ? 'active' : '';

    card.innerHTML = `
        <span class="post-category-tag">#${escapeHTML(post.category)}</span>
        
        <div class="post-creator-info">
            <div class="post-avatar" onclick="handleViewProfile(${post.user_id})">${userAvatar}</div>
            <div class="post-meta">
                <span class="post-creator-name" onclick="handleViewProfile(${post.user_id})">
                    ${escapeHTML(post.username)}
                    ${followBtnHtml}
                </span>
                <span class="post-date">${formatDate(post.created_at)}</span>
            </div>
        </div>

        <h3 class="post-title">${escapeHTML(post.title)}</h3>
        <p class="post-chisme">${escapeHTML(post.chisme)}</p>

        ${musicCardHtml}

        <div class="post-action-bar">
            <button class="action-btn btn-like ${likeActive}" onclick="handleLikeToggle(event, ${post.id})">
                <i class="fa-regular fa-heart"></i>
                <span class="like-count">${post.likes_count}</span> Likes
            </button>
            <button class="action-btn btn-comment" onclick="openCommentsModal(${post.id})">
                <i class="fa-regular fa-comment"></i>
                <span>${post.comments_count}</span> Comentarios
            </button>
            <button class="action-btn btn-share" onclick="handleSharePost('${post.title}', ${post.id})">
                <i class="fa-regular fa-share-from-square"></i> Compartir
            </button>
        </div>
    `;

    return card;
}

// ==========================================
// 4. INTERACCIONES SOCIALES (LIKES, COMMENTS, FOLLOWS)
// ==========================================

async function handleLikeToggle(event, postId) {
    event.stopPropagation();
    
    if (!AppState.currentUser) {
        showToast('Inicia sesión para dar me gusta a este chisme musical.', 'info');
        openModal('modal-auth');
        return;
    }

    const likeBtn = event.currentTarget;
    const countSpan = likeBtn.querySelector('.like-count');

    try {
        const formData = new FormData();
        formData.append('action', 'toggle_like');
        formData.append('post_id', postId);

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            if (result.data.liked) {
                likeBtn.classList.add('active');
                showToast('¡Agregado a tus favoritos! ❤️', 'success');
            } else {
                likeBtn.classList.remove('active');
            }
            countSpan.textContent = result.data.likes_count;
            
            // Actualizar ranking en sidebar lateral
            loadRankings();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error al togglear like:', error);
    }
}

async function handleQuickFollow(event, targetUserId) {
    event.stopPropagation();
    
    if (!AppState.currentUser) {
        showToast('Inicia sesión para seguir a este DJ.', 'info');
        openModal('modal-auth');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'toggle_follow');
        formData.append('user_id', targetUserId);

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            
            // Si estamos viendo el perfil de ese usuario, actualizamos las estadísticas
            if (AppState.currentView === 'profile' && parseInt(AppState.selectedProfileId) === parseInt(targetUserId)) {
                loadProfileData(targetUserId);
            }
            // Recargar feeds para ocultar/cambiar estado visual
            loadFeed();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error al seguir usuario:', error);
    }
}

function handleViewProfile(userId) {
    switchView('profile', userId);
}

// ==========================================
// 5. MODAL DE COMENTARIOS (AJAX DETALLADO)
// ==========================================

let activeCommentPostId = null;

async function openCommentsModal(postId) {
    activeCommentPostId = postId;
    openModal('modal-comments');
    
    const previewArea = document.getElementById('comments-post-preview-area');
    const commentsList = document.getElementById('modal-comments-list');
    const formArea = document.getElementById('comment-form-auth-check');
    
    previewArea.innerHTML = '<div class="skeleton-list-item"></div>';
    commentsList.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        // 1. Obtener la publicación completa para la vista previa izquierda
        const postResponse = await fetch(`api.php?action=get_posts`);
        const postResult = await postResponse.json();
        
        if (postResult.success && postResult.data) {
            const currentPost = postResult.data.find(p => parseInt(p.id) === parseInt(postId));
            if (currentPost) {
                // Renders post card inside modal, pero removemos botones redundantes
                const tempCard = renderPostCard(currentPost);
                // Quitar botón de comentarios interno del modal
                const commentBtn = tempCard.querySelector('.btn-comment');
                if (commentBtn) commentBtn.style.pointerEvents = 'none';
                
                previewArea.innerHTML = '';
                previewArea.appendChild(tempCard);
            }
        }

        // 2. Obtener y renderizar los comentarios a la derecha
        loadCommentsForPost(postId);

        // 3. Renderizar formulario según sesión
        if (AppState.currentUser) {
            formArea.innerHTML = `
                <input type="text" id="comment-text-input" placeholder="Escribe tu chisme o respuesta sobre esta música..." autocomplete="off">
                <button class="btn-send-comment" onclick="submitComment(${postId})">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            `;
            
            // Permitir enviar con Enter
            document.getElementById('comment-text-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    submitComment(postId);
                }
            });
        } else {
            formArea.innerHTML = `
                <div style="text-align: center; width:100%; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
                    Deber <span class="setup-link" style="cursor:pointer;" onclick="openModal('modal-auth')">iniciar sesión</span> para unirte al chisme musical.
                </div>
            `;
        }
        
    } catch (error) {
        console.error('Error al abrir modal comentarios:', error);
    }
}

async function loadCommentsForPost(postId) {
    const commentsList = document.getElementById('modal-comments-list');
    commentsList.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        const response = await fetch(`api.php?action=get_comments&post_id=${postId}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            commentsList.innerHTML = '';
            result.data.forEach(comment => {
                const commentItem = document.createElement('div');
                commentItem.className = 'comment-item';
                commentItem.innerHTML = `
                    <div class="comment-avatar">${comment.user_avatar}</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-user" onclick="handleCommentUserClick(${comment.user_id})">${escapeHTML(comment.username)}</span>
                            <span class="comment-time">${formatDate(comment.created_at)}</span>
                        </div>
                        <p class="comment-body">${escapeHTML(comment.comment_text)}</p>
                    </div>
                `;
                commentsList.appendChild(commentItem);
            });
            
            // Desplazar al fondo del contenedor de comentarios
            commentsList.scrollTop = commentsList.scrollHeight;
        } else {
            commentsList.innerHTML = `
                <div class="no-comments-msg">
                    <i class="fa-regular fa-comments" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                    Aún no hay chismes aquí. ¡Añade tu comentario abajo!
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar comentarios:', error);
        commentsList.innerHTML = '<div class="no-comments-msg">Error de conexión al cargar comentarios.</div>';
    }
}

function handleCommentUserClick(userId) {
    closeModal('modal-comments');
    switchView('profile', userId);
}

async function submitComment(postId) {
    const input = document.getElementById('comment-text-input');
    const text = input.value.trim();

    if (!text) return;

    try {
        const formData = new FormData();
        formData.append('action', 'add_comment');
        formData.append('post_id', postId);
        formData.append('comment_text', text);

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            input.value = '';
            showToast('¡Comentario publicado!', 'success');
            
            // Recargar comentarios del modal
            loadCommentsForPost(postId);
            
            // Recargar feeds en el fondo para actualizar contadores de comentarios
            loadFeed();
            
            // Si estamos en perfil, actualizar también
            if (AppState.currentView === 'profile') {
                loadProfileData(AppState.selectedProfileId);
            }
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error al enviar comentario:', error);
    }
}

// ==========================================
// 6. PERFIL DE USUARIO Y CONFIGURACIÓN (AJAX)
// ==========================================

async function loadProfileData(userId) {
    try {
        const response = await fetch(`api.php?action=get_profile&user_id=${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
            const profile = result.data;
            const user = profile.user;

            // Renderizar datos del perfil
            document.getElementById('profile-avatar').textContent = user.avatar || '🎧';
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-joined').textContent = `Miembro desde: ${formatDate(user.created_at)}`;
            document.getElementById('profile-bio').textContent = user.bio || 'Este usuario es un DJ silencioso sin biografía.';
            
            // Stats
            document.getElementById('profile-followers-count').textContent = profile.followers_count;
            document.getElementById('profile-following-count').textContent = profile.following_count;
            
            // Nombre de sección de posts
            document.getElementById('profile-posts-user').textContent = user.username;

            // Configurar botones de acciones
            const followBtn = document.getElementById('profile-follow-btn');
            const logoutBtn = document.getElementById('profile-logout-btn');

            if (AppState.currentUser && parseInt(AppState.currentUser.id) === parseInt(user.id)) {
                // Perfil propio
                followBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-flex';
            } else {
                // Perfil ajeno
                logoutBtn.style.display = 'none';
                followBtn.style.display = 'inline-flex';

                if (profile.is_following) {
                    followBtn.className = 'btn btn-follow active';
                    followBtn.innerHTML = '<i class="fa-solid fa-user-minus"></i> Dejar de Seguir';
                } else {
                    followBtn.className = 'btn btn-primary';
                    followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Seguir';
                }

                // Reinventar click handler de follow en perfil
                followBtn.onclick = async () => {
                    if (!AppState.currentUser) {
                        showToast('Inicia sesión para seguir usuarios.', 'info');
                        openModal('modal-auth');
                        return;
                    }
                    
                    try {
                        const fd = new FormData();
                        fd.append('action', 'toggle_follow');
                        fd.append('user_id', user.id);

                        const r = await fetch('api.php', { method: 'POST', body: fd });
                        const res = await r.json();

                        if (res.success) {
                            showToast(res.message, 'success');
                            loadProfileData(user.id);
                        }
                    } catch (e) {
                        console.error(e);
                    }
                };
            }

            // Cargar posts del usuario en el sub-feed
            loadUserPosts(user.id);
        }
    } catch (error) {
        console.error('Error al cargar perfil:', error);
    }
}

async function loadUserPosts(userId) {
    const container = document.getElementById('profile-posts-container');
    container.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        const response = await fetch(`api.php?action=get_posts&user_id=${userId}`);
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            
            // Actualizar contador del perfil
            document.getElementById('profile-posts-count').textContent = result.data.length;
            
            result.data.forEach(post => {
                container.appendChild(renderPostCard(post));
            });
        } else {
            document.getElementById('profile-posts-count').textContent = '0';
            container.innerHTML = `
                <div class="feed-empty-state">
                    <i class="fa-solid fa-music"></i>
                    <h4>Sin aportes musicales</h4>
                    <p>Este DJ todavía no ha compartido ningún chisme musical.</p>
                </div>
            `;
        }
    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="feed-empty-state">Error al cargar publicaciones.</div>';
    }
}

// ==========================================
// 7. REPRODUCTOR INTEGRADO DE SPOTIFY
// ==========================================

function playMusic(spotifyId, type, title, category) {
    const playerBar = document.getElementById('floating-player');
    const embedWrapper = document.getElementById('player-embed-wrapper');
    const waves = document.getElementById('audio-waves-visualizer');
    
    // Títulos de visualización
    document.getElementById('player-title').textContent = title;
    document.getElementById('player-category').textContent = `#${category}`;
    
    // Generar el Iframe oficial de Spotify
    // Tipo: track, playlist, album
    // URL: https://open.spotify.com/embed/{type}/{id}?utm_source=generator&theme=0 (theme 0 es tema oscuro)
    embedWrapper.innerHTML = `
        <iframe style="border-radius:12px" 
                src="https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0" 
                width="100%" 
                height="80" 
                frameBorder="0" 
                allowfullscreen="" 
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                loading="lazy">
        </iframe>
    `;

    // Hacer visible el reproductor con animación
    playerBar.style.display = 'flex';
    waves.style.display = 'flex';
    
    showToast(`Reproduciendo chisme de canal #${category} 🎧`, 'info');
}

// ==========================================
// 8. TENDENCIAS Y RANKINGS (LATERALES)
// ==========================================

async function loadRankings() {
    const container = document.getElementById('rankings-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_rankings');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach((rank, index) => {
                const posClass = `pos-${index + 1}`;
                const item = document.createElement('div');
                item.className = 'ranking-item';
                item.innerHTML = `
                    <div class="ranking-position ${posClass}">${index + 1}</div>
                    <div class="ranking-details">
                        <h4 class="ranking-title" onclick="openCommentsModal(${rank.id})">${escapeHTML(rank.title)}</h4>
                        <span class="ranking-creator">por @${escapeHTML(rank.username)}</span>
                    </div>
                    <span class="ranking-likes">
                        <i class="fa-solid fa-heart"></i> ${rank.likes_count}
                    </span>
                `;
                container.appendChild(item);
            });
        } else {
            container.innerHTML = '<p style="color:var(--text-muted); font-size:0.8rem; text-align:center;">Sin rankings esta semana</p>';
        }
    } catch (error) {
        console.error('Error al cargar rankings:', error);
    }
}

async function loadTrends() {
    const container = document.getElementById('trends-container');
    if (!container) return;

    try {
        const response = await fetch('api.php?action=get_trends');
        const result = await response.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach(trend => {
                const btn = document.createElement('button');
                btn.className = 'trend-tag-btn';
                btn.innerHTML = `#${escapeHTML(trend.name)} <span style="font-weight:400; opacity:0.65;">(${trend.posts_count})</span>`;
                btn.addEventListener('click', () => {
                    // Filtrar por esta categoría
                    selectCategory(trend.name);
                });
                container.appendChild(btn);
            });
        }
    } catch (error) {
        console.error('Error al cargar tendencias:', error);
    }
}

// Filtro de categorías rápido
function selectCategory(categoryName) {
    AppState.currentCategory = categoryName;

    // Cambiar clases activas en sidebar
    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        if (pill.getAttribute('data-category') === categoryName) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    // Actualizar título del feed central
    const feedTitle = document.getElementById('feed-title');
    feedTitle.textContent = categoryName ? `Canal #${categoryName}` : 'Explorar Chismes';

    // Regresar al feed si estamos en perfil
    if (AppState.currentView !== 'feed') {
        switchView('feed');
    } else {
        loadFeed();
    }
}

// ==========================================
// 9. FORMULARIOS DE REGISTRO / LOGIN / POSTS
// ==========================================

async function handleLoginSubmit(event) {
    event.preventDefault();
    const usernameInput = document.getElementById('login-username');
    const passwordInput = document.getElementById('login-password');
    const errorMsg = document.getElementById('auth-error-msg');

    errorMsg.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('action', 'login');
        formData.append('username', usernameInput.value.trim());
        formData.append('password', passwordInput.value.trim());

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            usernameInput.value = '';
            passwordInput.value = '';
            closeModal('modal-auth');
            
            // Recargar estado
            await fetchSession();
            loadFeed();
            loadRankings();
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error de conexión con el servidor.';
        errorMsg.style.display = 'block';
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    
    const usernameInput = document.getElementById('register-username');
    const passwordInput = document.getElementById('register-password');
    const avatarInput = document.querySelector('input[name="avatar"]:checked');
    const bioInput = document.getElementById('register-bio');
    const errorMsg = document.getElementById('auth-error-msg');

    errorMsg.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('action', 'register');
        formData.append('username', usernameInput.value.trim());
        formData.append('password', passwordInput.value.trim());
        formData.append('avatar', avatarInput ? avatarInput.value : '🎧');
        formData.append('bio', bioInput.value.trim());

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            usernameInput.value = '';
            passwordInput.value = '';
            bioInput.value = '';
            closeModal('modal-auth');
            
            // Recargar estado
            await fetchSession();
            loadFeed();
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error de conexión en el registro.';
        errorMsg.style.display = 'block';
    }
}

async function handleCreatePostSubmit(event) {
    event.preventDefault();
    
    const spotifyUrlInput = document.getElementById('post-spotify-url');
    const titleInput = document.getElementById('post-title');
    const categorySelect = document.getElementById('post-category');
    const chismeInput = document.getElementById('post-chisme');
    const errorMsg = document.getElementById('post-error-msg');

    errorMsg.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('action', 'create_post');
        formData.append('spotify_url', spotifyUrlInput.value.trim());
        formData.append('title', titleInput.value.trim());
        formData.append('category', categorySelect.value);
        formData.append('chisme', chismeInput.value.trim());

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            
            // Limpiar formulario
            spotifyUrlInput.value = '';
            titleInput.value = '';
            chismeInput.value = '';
            document.getElementById('chisme-char-count').textContent = '0';
            
            closeModal('modal-create-post');
            
            // Forzar volver al feed de "Todos" recientes para ver la publicación
            AppState.currentCategory = '';
            selectCategory('');
            switchView('feed');
            loadFeed();
            loadRankings();
            loadTrends();
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error de comunicación al publicar.';
        errorMsg.style.display = 'block';
    }
}

// ==========================================
// 10. VINDO DE EVENTOS Y EFECTOS UI
// ==========================================

function bindEventEvents() {
    // Logo Click -> Vuelve al inicio
    document.getElementById('nav-home-logo').addEventListener('click', () => {
        AppState.currentCategory = '';
        AppState.currentSearch = '';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear-btn').style.display = 'none';
        selectCategory('');
        switchView('feed');
    });

    // Botones de Navegación Lateral
    document.getElementById('btn-nav-feed').addEventListener('click', () => {
        AppState.currentFilter = 'recent';
        document.getElementById('tab-recent').classList.add('active');
        document.getElementById('tab-popular').classList.remove('active');
        switchView('feed');
    });
    
    document.getElementById('btn-nav-trending').addEventListener('click', () => {
        AppState.currentFilter = 'trending';
        document.getElementById('tab-recent').classList.remove('active');
        document.getElementById('tab-popular').classList.add('active');
        switchView('feed');
    });

    document.getElementById('btn-nav-create-post').addEventListener('click', () => {
        if (!AppState.currentUser) {
            showToast('Debes iniciar sesión para publicar un chisme musical.', 'info');
            openModal('modal-auth');
        } else {
            openModal('modal-create-post');
        }
    });

    document.getElementById('btn-nav-profile').addEventListener('click', () => {
        if (AppState.currentUser) {
            switchView('profile', AppState.currentUser.id);
        }
    });

    // Feed Tabs (Reciente vs Más Votados)
    document.getElementById('tab-recent').addEventListener('click', (e) => {
        AppState.currentFilter = 'recent';
        e.target.classList.add('active');
        document.getElementById('tab-popular').classList.remove('active');
        loadFeed();
    });

    document.getElementById('tab-popular').addEventListener('click', (e) => {
        AppState.currentFilter = 'trending';
        e.target.classList.add('active');
        document.getElementById('tab-recent').classList.remove('active');
        loadFeed();
    });

    // Filtros de Categorías
    const categoryButtons = document.querySelectorAll('.category-pill');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-category');
            selectCategory(cat);
        });
    });

    // Buscador en tiempo real con Debounce (300ms)
    const searchInput = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('search-clear-btn');
    
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        AppState.currentSearch = query;

        if (query) {
            clearSearchBtn.style.display = 'block';
        } else {
            clearSearchBtn.style.display = 'none';
        }

        clearTimeout(AppState.searchTimeout);
        AppState.searchTimeout = setTimeout(() => {
            loadFeed();
        }, 350);
    });

    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        AppState.currentSearch = '';
        clearSearchBtn.style.display = 'none';
        loadFeed();
    });

    // Modales Cierres
    document.getElementById('btn-close-modal-auth').addEventListener('click', () => closeModal('modal-auth'));
    document.getElementById('btn-close-modal-create').addEventListener('click', () => closeModal('modal-create-post'));
    document.getElementById('btn-close-modal-comments').addEventListener('click', () => closeModal('modal-comments'));

    // Pestañas del Modal Auth (Login vs Registro)
    document.getElementById('tab-login-btn').addEventListener('click', (e) => {
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-register-btn').classList.remove('active');
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-register').classList.remove('active');
    });

    document.getElementById('tab-register-btn').addEventListener('click', (e) => {
        document.getElementById('tab-register-btn').classList.add('active');
        document.getElementById('tab-login-btn').classList.remove('active');
        document.getElementById('form-register').classList.add('active');
        document.getElementById('form-login').classList.remove('active');
    });

    // Envíos de Formularios
    document.getElementById('form-login').addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-register').addEventListener('submit', handleRegisterSubmit);
    document.getElementById('form-create-post').addEventListener('submit', handleCreatePostSubmit);

    // Logout en perfil
    document.getElementById('profile-logout-btn').addEventListener('click', async () => {
        try {
            const response = await fetch('api.php?action=logout');
            const result = await response.json();
            if (result.success) {
                showToast('Has cerrado sesión.', 'info');
                await fetchSession();
                switchView('feed');
            }
        } catch (error) {
            console.error(error);
        }
    });

    // Contador de Caracteres en el Textarea del Chisme
    const chismeTextarea = document.getElementById('post-chisme');
    chismeTextarea.addEventListener('input', (e) => {
        const len = e.target.value.length;
        document.getElementById('chisme-char-count').textContent = len;
    });

    // Reproductor - Cerrar
    document.getElementById('btn-close-player').addEventListener('click', () => {
        const playerBar = document.getElementById('floating-player');
        const embedWrapper = document.getElementById('player-embed-wrapper');
        
        embedWrapper.innerHTML = '';
        playerBar.style.display = 'none';
    });

    // Limpiar errores cuando los modales de Bootstrap se ocultan
    const modalAuth = document.getElementById('modal-auth');
    if (modalAuth) {
        modalAuth.addEventListener('hidden.bs-modal', () => {
            const authError = document.getElementById('auth-error-msg');
            if (authError) authError.style.display = 'none';
        });
    }
    const modalCreatePost = document.getElementById('modal-create-post');
    if (modalCreatePost) {
        modalCreatePost.addEventListener('hidden.bs-modal', () => {
            const postError = document.getElementById('post-error-msg');
            if (postError) postError.style.display = 'none';
        });
    }
}

// ==========================================
// 11. HELPERS Y FUNCIONES DE SOPORTE (UI)
// ==========================================

function openModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        const bsModal = bootstrap.Modal.getOrCreateInstance(modalEl);
        bsModal.show();
    }
}

function closeModal(modalId) {
    const modalEl = document.getElementById(modalId);
    if (modalEl) {
        const bsModal = bootstrap.Modal.getInstance(modalEl);
        if (bsModal) {
            bsModal.hide();
        }
    }
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast-notify');
    if (!toastEl) return;
    
    const bodyText = document.getElementById('toast-body-text');
    if (bodyText) bodyText.textContent = message;
    
    // Limpiar clases de color de Bootstrap
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-white');
    
    if (type === 'success') {
        toastEl.classList.add('bg-success', 'text-white');
    } else if (type === 'error') {
        toastEl.classList.add('bg-danger', 'text-white');
    } else {
        toastEl.classList.add('bg-info', 'text-white');
    }
    
    const bsToast = bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 });
    bsToast.show();
}

function renderSkeletonLoader(container) {
    container.innerHTML = `
        <div class="post-card skeleton-card">
            <div class="skeleton-header">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-text" style="width: 150px;"></div>
            </div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-body" style="height: 80px;"></div>
            <div class="skeleton skeleton-player" style="height: 150px;"></div>
        </div>
        <div class="post-card skeleton-card">
            <div class="skeleton-header">
                <div class="skeleton skeleton-avatar"></div>
                <div class="skeleton skeleton-text" style="width: 120px;"></div>
            </div>
            <div class="skeleton skeleton-title"></div>
            <div class="skeleton skeleton-body" style="height: 60px;"></div>
            <div class="skeleton skeleton-player" style="height: 120px;"></div>
        </div>
    `;
}

// Formatear fecha legible
function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(/-/g, "/"));
    
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options);
}

// Escapar HTML para prevenir XSS
function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, 
        tag => ({
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            "'": '&#39;',
            '"': '&quot;'
        }[tag] || tag)
    );
}

function handleSharePost(title, postId) {
    const shareUrl = window.location.origin + window.location.pathname + `?post=${postId}`;
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('¡Enlace de chisme copiado al portapapeles! 📋🔗', 'success');
    }).catch(err => {
        console.error('Error al copiar enlace:', err);
        showToast('No se pudo copiar el enlace automáticamente.', 'error');
    });
}
