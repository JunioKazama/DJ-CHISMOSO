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
    currentFilter: 'recent', // 'recent', 'trending' o 'following'
    currentSpotifyType: '',  // '', 'track', 'playlist', 'album'
    currentView: 'feed', // 'feed' o 'profile'
    selectedProfileId: null,
    searchTimeout: null,
    playbackQueue: [],
    currentQueueIndex: -1,
    lastChatId: 0
};

// --- INTERVALOS GLOBALES ---
let chatInterval = null;
let notificationInterval = null;

// --- AL CARGAR EL DOCUMENTO ---
document.addEventListener('DOMContentLoaded', () => {
    AppInit();
});

// --- INICIALIZACIÓN DE LA APLICACIÓN ---
function AppInit() {
    checkUrlParams();
    fetchSession();
    loadFeed();
    loadRankings();
    loadTrends();
    bindEventEvents();
    startChatPolling();
    
    // Bind Spotify Link/Unlink buttons
    const btnLink = document.getElementById('btn-link-spotify');
    if (btnLink) {
        btnLink.addEventListener('click', async () => {
            try {
                const res = await fetch('api.php?action=spotify_login');
                const data = await res.json();
                if (data.success && data.data && data.data.url) {
                    window.location.href = data.data.url;
                } else {
                    showToast(data.message, 'error');
                }
            } catch (e) {
                console.error(e);
                showToast('Error al conectar con Spotify', 'error');
            }
        });
    }

    const btnUnlink = document.getElementById('btn-unlink-spotify');
    if (btnUnlink) {
        btnUnlink.addEventListener('click', async () => {
            if(!confirm('¿Estás seguro de que quieres desvincular tu cuenta de Spotify?')) return;
            try {
                const res = await fetch('api.php', { method: 'POST', body: new URLSearchParams({ action: 'unlink_spotify' }) });
                const data = await res.json();
                if (data.success) {
                    showToast(data.message, 'success');
                    if (AppState.currentUser) {
                        AppState.currentUser.spotify_account_id = null;
                        openEditProfileModal(AppState.currentUser);
                        loadProfileData(AppState.currentUser.id);
                    }
                } else {
                    showToast(data.message, 'error');
                }
            } catch (e) {
                showToast('Error al desvincular la cuenta', 'error');
            }
        });
    }
}

function checkUrlParams() {
    const params = new URLSearchParams(window.location.search);
    const err = params.get('spotify_err');
    const msg = params.get('spotify_msg');
    
    if (msg === 'linked') {
        setTimeout(() => showToast('¡Cuenta de Spotify vinculada exitosamente!', 'success'), 500);
    }
    
    if (err) {
        let errMsg = 'Ocurrió un error con la vinculación.';
        if (err === 'already_linked') errMsg = 'Esta cuenta de Spotify ya está vinculada a otro perfil de DJ CHISMOSO.';
        else if (err === 'auth_failed') errMsg = 'Cancelaste la autorización o hubo un error en Spotify.';
        
        setTimeout(() => showToast(errMsg, 'error'), 500);
    }
    
    // Limpiar URL para no mostrar el mensaje de nuevo al recargar
    if (err || msg) {
        window.history.replaceState({}, document.title, window.location.pathname);
    }
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
            
            // Mostrar opciones de usuario registrado
            document.getElementById('btn-nav-profile').style.display = 'flex';
            document.getElementById('btn-nav-following').style.display = 'flex';
            document.getElementById('tab-following').style.display = 'flex';
        } else {
            AppState.currentUser = null;
            renderGuestHeader();
            
            // Ocultar opciones de usuario registrado
            document.getElementById('btn-nav-profile').style.display = 'none';
            document.getElementById('btn-nav-following').style.display = 'none';
            document.getElementById('tab-following').style.display = 'none';
        }
    } catch (error) {
        console.error('Error al obtener la sesión:', error);
        renderGuestHeader();
    }
}

function renderUserHeader(user) {
    const userArea = document.getElementById('header-user-area');
    userArea.innerHTML = `
        <div class="header-notifications-container">
            <button class="btn-notification-bell" id="btn-notifications-toggle" title="Notificaciones">
                <i class="fa-solid fa-bell"></i>
                <span class="notification-badge" id="notif-badge" style="display:none;">0</span>
            </button>
            <div class="notifications-dropdown" id="notifications-dropdown" style="display:none;">
                <div class="notifications-header">
                    <h4>Notificaciones</h4>
                    <button id="btn-clear-notifications" class="btn-clear-notifications">Marcar como leídas</button>
                </div>
                <div class="notifications-list" id="notifications-list">
                    <div class="notif-placeholder">Cargando...</div>
                </div>
            </div>
        </div>
        <div class="user-menu-header" id="header-user-menu">
            <div class="user-menu-avatar">${user.avatar}</div>
            <span class="user-menu-name">${user.username}</span>
        </div>
    `;
    
    // Vincular clics de la campana y dropdown
    document.getElementById('btn-notifications-toggle').addEventListener('click', (e) => {
        e.stopPropagation();
        toggleNotificationsDropdown();
    });
    
    document.getElementById('notifications-dropdown').addEventListener('click', (e) => {
        e.stopPropagation();
    });
    
    document.getElementById('btn-clear-notifications').addEventListener('click', (e) => {
        e.stopPropagation();
        markNotificationsAsRead();
    });

    // Al hacer clic en el menú del usuario en la cabecera, nos lleva a su perfil
    document.getElementById('header-user-menu').addEventListener('click', () => {
        switchView('profile', user.id);
    });
    
    // Cargar notificaciones
    loadNotifications();
    
    // Dibujar chat
    renderChatInputArea();
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
    
    // Dibujar chat
    renderChatInputArea();
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
        if (AppState.currentSpotifyType) {
            url += `&spotify_type=${encodeURIComponent(AppState.currentSpotifyType)}`;
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
                <button class="btn-add-queue" onclick="addToQueue(event, '${post.spotify_id}', '${post.spotify_type}', '${escapeHTML(post.title)}', '${escapeHTML(post.category)}')" title="Añadir a la cola">
                    <i class="fa-solid fa-plus"></i> Cola
                </button>
                <a href="${post.spotify_url}" target="_blank" class="btn-spotify-link" title="Abrir en Spotify App">
                    <i class="fa-brands fa-spotify"></i>
                </a>
            </div>
        </div>
    `;

    // Validar si el usuario actual ya reaccionó
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

        <div class="post-reactions-display" id="post-reactions-display-${post.id}">
            ${renderReactionsSummary(post)}
        </div>

        <div class="post-action-bar">
            <div class="reaction-container" onmouseenter="showReactionsPopover(${post.id})" onmouseleave="hideReactionsPopover(${post.id})">
                <button class="action-btn btn-like ${likeActive}" onclick="handleReactionClick(event, ${post.id}, '${post.user_reaction || 'heart'}')">
                    <span class="active-reaction-icon" id="reaction-icon-${post.id}">${getActiveReactionIcon(post.user_reaction)}</span>
                    <span class="like-count" id="reaction-count-${post.id}">${post.likes_count}</span> Reacciones
                </button>
                <div class="reactions-popover" id="reactions-popover-${post.id}">
                    <span class="reaction-emoji-btn" onclick="handleReactionClick(event, ${post.id}, 'heart')" title="Me gusta">❤️</span>
                    <span class="reaction-emoji-btn" onclick="handleReactionClick(event, ${post.id}, 'fire')" title="Fuego">🔥</span>
                    <span class="reaction-emoji-btn" onclick="handleReactionClick(event, ${post.id}, 'cry')" title="Triste">😭</span>
                    <span class="reaction-emoji-btn" onclick="handleReactionClick(event, ${post.id}, 'wow')" title="Sorprendido">😱</span>
                    <span class="reaction-emoji-btn" onclick="handleReactionClick(event, ${post.id}, 'dance')" title="A bailar">🕺</span>
                </div>
            </div>
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

function showReactionsPopover(postId) {
    const popover = document.getElementById(`reactions-popover-${postId}`);
    if (popover) popover.style.display = 'flex';
}

function hideReactionsPopover(postId) {
    const popover = document.getElementById(`reactions-popover-${postId}`);
    if (popover) popover.style.display = 'none';
}

function getActiveReactionIcon(reactionType) {
    switch (reactionType) {
        case 'heart': return '❤️';
        case 'fire': return '🔥';
        case 'cry': return '😭';
        case 'wow': return '😱';
        case 'dance': return '🕺';
        default: return '<i class="fa-regular fa-heart"></i>';
    }
}

function renderReactionsSummary(post) {
    const reactions = [
        { type: 'heart', emoji: '❤️', count: parseInt(post.react_heart || 0) },
        { type: 'fire', emoji: '🔥', count: parseInt(post.react_fire || 0) },
        { type: 'cry', emoji: '😭', count: parseInt(post.react_cry || 0) },
        { type: 'wow', emoji: '😱', count: parseInt(post.react_wow || 0) },
        { type: 'dance', emoji: '🕺', count: parseInt(post.react_dance || 0) }
    ];
    
    const active = reactions.filter(r => r.count > 0);
    if (active.length === 0) return '';
    
    let html = '<div class="post-reactions-summary">';
    active.forEach(r => {
        html += `<span class="reaction-badge-item" title="${r.count} reacciones de ${r.type}">${r.emoji} <span class="badge-count">${r.count}</span></span>`;
    });
    html += '</div>';
    return html;
}

async function handleReactionClick(event, postId, reactionType) {
    event.stopPropagation();
    
    if (!AppState.currentUser) {
        showToast('Inicia sesión para reaccionar a este chisme musical.', 'info');
        openModal('modal-auth');
        return;
    }

    try {
        const formData = new FormData();
        formData.append('action', 'toggle_reaction');
        formData.append('post_id', postId);
        formData.append('reaction_type', reactionType);

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            const container = document.getElementById(`post-${postId}`);
            if (container) {
                const likeBtn = container.querySelector('.btn-like');
                const iconSpan = document.getElementById(`reaction-icon-${postId}`);
                const countSpan = document.getElementById(`reaction-count-${postId}`);
                
                if (result.data.liked) {
                    likeBtn.classList.add('active');
                    iconSpan.innerHTML = getActiveReactionIcon(result.data.user_reaction);
                    likeBtn.setAttribute('onclick', `handleReactionClick(event, ${postId}, '${result.data.user_reaction}')`);
                    showToast(`¡Reaccionaste con ${result.data.user_reaction}!`, 'success');
                } else {
                    likeBtn.classList.remove('active');
                    iconSpan.innerHTML = '<i class="fa-regular fa-heart"></i>';
                    likeBtn.setAttribute('onclick', `handleReactionClick(event, ${postId}, 'heart')`);
                    showToast('Reacción eliminada.', 'info');
                }
                countSpan.textContent = result.data.likes_count;
                
                const displayArea = document.getElementById(`post-reactions-display-${postId}`);
                if (displayArea) {
                    const mockPost = {
                        react_heart: result.data.breakdown.heart || 0,
                        react_fire: result.data.breakdown.fire || 0,
                        react_cry: result.data.breakdown.cry || 0,
                        react_wow: result.data.breakdown.wow || 0,
                        react_dance: result.data.breakdown.dance || 0
                    };
                    displayArea.innerHTML = renderReactionsSummary(mockPost);
                }
            }
            hideReactionsPopover(postId);
            loadRankings();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error al enviar reacción:', error);
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
        // 1. Obtener el post desde el DOM ya renderizado (evita descargar todo el feed)
        // PERF: antes se hacía fetch a get_posts completo solo para encontrar 1 post.
        const existingCard = document.getElementById(`post-${postId}`);
        if (existingCard) {
            // Clonar la card del DOM y quitarle el botón de comentarios para evitar recursividad
            const clonedCard = existingCard.cloneNode(true);
            const commentBtn = clonedCard.querySelector('.btn-comment');
            if (commentBtn) commentBtn.style.pointerEvents = 'none';
            previewArea.innerHTML = '';
            previewArea.appendChild(clonedCard);
        } else {
            previewArea.innerHTML = '';
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
            
            // Badge Spotify
            const badge = document.getElementById('profile-spotify-badge');
            if (badge) {
                badge.style.display = user.spotify_account_id ? 'inline-flex' : 'none';
            }

            // Configurar botones de acciones
            const followBtn = document.getElementById('profile-follow-btn');
            const logoutBtn = document.getElementById('profile-logout-btn');
            const editBtn = document.getElementById('profile-edit-btn');

            if (AppState.currentUser && parseInt(AppState.currentUser.id) === parseInt(user.id)) {
                // Perfil propio
                followBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-flex';
                editBtn.style.display = 'inline-flex';

                editBtn.onclick = () => {
                    document.getElementById('edit-bio').value = user.bio || '';
                    document.getElementById('edit-featured-track').value = user.featured_track || '';
                    
                    const avatarRadio = document.querySelector(`input[name="edit-avatar"][value="${user.avatar || '🎧'}"]`);
                    if (avatarRadio) {
                        avatarRadio.checked = true;
                    }
                    
                    // Estado Spotify
                    const title = document.getElementById('edit-spotify-status-title');
                    const desc = document.getElementById('edit-spotify-status-desc');
                    const btnLink = document.getElementById('btn-link-spotify');
                    const btnUnlink = document.getElementById('btn-unlink-spotify');

                    if (user.spotify_account_id) {
                        if (title) { title.textContent = 'Vinculado'; title.style.color = '#1ed760'; }
                        if (desc) desc.textContent = 'Cuenta de Spotify conectada y verificada';
                        if (btnLink) btnLink.style.display = 'none';
                        if (btnUnlink) btnUnlink.style.display = 'inline-block';
                    } else {
                        if (title) { title.textContent = 'No vinculado'; title.style.color = 'inherit'; }
                        if (desc) desc.textContent = 'Conecta tu cuenta para verificar tu perfil';
                        if (btnLink) btnLink.style.display = 'inline-block';
                        if (btnUnlink) btnUnlink.style.display = 'none';
                    }
                    
                    openModal('modal-edit-profile');
                };
            } else {
                // Perfil ajeno
                logoutBtn.style.display = 'none';
                editBtn.style.display = 'none';
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

            // Canción Insignia
            const featuredArea = document.getElementById('profile-featured-track-area');
            const featuredEmbed = document.getElementById('profile-featured-track-embed');
            if (user.featured_track) {
                const parsed = parseSpotifyUrl(user.featured_track);
                if (parsed) {
                    featuredArea.style.display = 'block';
                    featuredEmbed.innerHTML = `
                        <iframe style="border-radius:12px" 
                                src="https://open.spotify.com/embed/${parsed.type}/${parsed.id}?utm_source=generator&theme=0" 
                                width="100%" 
                                height="80" 
                                frameBorder="0" 
                                allowfullscreen="" 
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" 
                                loading="lazy">
                        </iframe>
                    `;
                } else {
                    featuredArea.style.display = 'none';
                    featuredEmbed.innerHTML = '';
                }
            } else {
                featuredArea.style.display = 'none';
                featuredEmbed.innerHTML = '';
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

// --- COLA DE REPRODUCCIÓN ---


function addToQueue(event, spotifyId, spotifyType, title, category) {
    if (event) event.stopPropagation();
    
    const exists = AppState.playbackQueue.some(item => item.id === spotifyId);
    if (exists) {
        showToast('Esta canción ya está en la cola.', 'info');
        return;
    }

    AppState.playbackQueue.push({
        id: spotifyId,
        type: spotifyType,
        title: title,
        category: category
    });

    updateQueueBadge();
    renderQueue();
    showToast('¡Canción añadida a la cola! 🎵', 'success');
}

function updateQueueBadge() {
    const badge = document.getElementById('queue-count-badge');
    if (!badge) return;
    
    const count = AppState.playbackQueue.length;
    if (count > 0) {
        badge.textContent = count;
        badge.style.display = 'flex';
    } else {
        badge.style.display = 'none';
    }
}

function renderQueue() {
    const list = document.getElementById('queue-list');
    if (!list) return;

    if (AppState.playbackQueue.length === 0) {
        list.innerHTML = `
            <div class="queue-empty">
                <i class="fa-solid fa-music"></i>
                <p>La cola está vacía.<br>Añade canciones desde el feed.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    AppState.playbackQueue.forEach((item, index) => {
        const queueItem = document.createElement('div');
        const isCurrent = index === AppState.currentQueueIndex ? 'current' : '';
        queueItem.className = `queue-item ${isCurrent}`;
        
        queueItem.innerHTML = `
            <div class="queue-item-details" onclick="playQueueItem(${index})">
                <span class="queue-index">${index + 1}</span>
                <div class="queue-text">
                    <span class="queue-title">${escapeHTML(item.title)}</span>
                    <span class="queue-category">#${escapeHTML(item.category)}</span>
                </div>
            </div>
            <div class="queue-actions">
                <button class="btn-queue-remove" onclick="removeFromQueue(event, ${index})" title="Eliminar de la cola">
                    <i class="fa-solid fa-trash"></i>
                </button>
            </div>
        `;
        list.appendChild(queueItem);
    });
}

function playQueueItem(index) {
    if (index < 0 || index >= AppState.playbackQueue.length) return;
    
    AppState.currentQueueIndex = index;
    const item = AppState.playbackQueue[index];
    playMusic(item.id, item.type, item.title, item.category);
    renderQueue();
}

function removeFromQueue(event, index) {
    if (event) event.stopPropagation();
    
    AppState.playbackQueue.splice(index, 1);
    
    if (AppState.currentQueueIndex === index) {
        AppState.currentQueueIndex = -1;
    } else if (AppState.currentQueueIndex > index) {
        AppState.currentQueueIndex--;
    }
    
    updateQueueBadge();
    renderQueue();
    showToast('Eliminado de la cola.', 'info');
}

function playNext() {
    if (AppState.playbackQueue.length === 0) {
        showToast('La cola de reproducción está vacía.', 'info');
        return;
    }
    
    const nextIndex = AppState.currentQueueIndex + 1;
    if (nextIndex < AppState.playbackQueue.length) {
        playQueueItem(nextIndex);
    } else {
        showToast('Llegaste al final de la cola de reproducción.', 'info');
    }
}

function clearQueue() {
    AppState.playbackQueue = [];
    AppState.currentQueueIndex = -1;
    updateQueueBadge();
    renderQueue();
    showToast('Cola de reproducción vaciada.', 'info');
}

function toggleQueuePanel() {
    const panel = document.getElementById('queue-panel');
    if (!panel) return;
    
    if (panel.style.display === 'none' || panel.style.display === '') {
        panel.style.display = 'block';
        renderQueue();
    } else {
        panel.style.display = 'none';
    }
}

// --- CHAT EN VIVO "EL CHISMÓGRAFO" ---
async function loadChatMessages() {
    const chatList = document.getElementById('chat-messages-list');
    if (!chatList) return;
    
    try {
        const response = await fetch(`api.php?action=get_chat_messages&since_id=${AppState.lastChatId}`);
        const result = await response.json();
        
        if (result.success && result.data && result.data.length > 0) {
            if (AppState.lastChatId === 0) {
                chatList.innerHTML = '';
            }
            
            result.data.forEach(msg => {
                const msgItem = document.createElement('div');
                const isOwn = AppState.currentUser && AppState.currentUser.username === msg.username ? 'own' : '';
                msgItem.className = `chat-msg-item ${isOwn}`;
                
                msgItem.innerHTML = `
                    <div class="chat-msg-avatar" onclick="handleViewProfile(${msg.user_id})" title="Ver perfil de ${msg.username}">${msg.avatar || '🎧'}</div>
                    <div class="chat-msg-content">
                        <div class="chat-msg-header">
                            <span class="chat-msg-user" onclick="handleViewProfile(${msg.user_id})">${escapeHTML(msg.username)}</span>
                            <span class="chat-msg-time">${formatChatTime(msg.created_at)}</span>
                        </div>
                        <p class="chat-msg-text">${escapeHTML(msg.message)}</p>
                    </div>
                `;
                chatList.appendChild(msgItem);
                
                if (parseInt(msg.id) > AppState.lastChatId) {
                    AppState.lastChatId = parseInt(msg.id);
                }
            });
            
            chatList.scrollTop = chatList.scrollHeight;
        } else if (AppState.lastChatId === 0) {
            chatList.innerHTML = `
                <div class="chat-placeholder">
                    <i class="fa-solid fa-comments"></i>
                    <span>¡Silencio en la sala! Comienza el chisme.</span>
                </div>
            `;
        }
    } catch (error) {
        console.error('Error al cargar mensajes del chat:', error);
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-message-input');
    if (!input) return;
    
    const message = input.value.trim();
    if (!message) return;
    
    try {
        const formData = new FormData();
        formData.append('action', 'send_chat_message');
        formData.append('message', message);
        
        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();
        
        if (result.success) {
            input.value = '';
            await loadChatMessages();
        } else {
            showToast(result.message, 'error');
        }
    } catch (error) {
        console.error('Error al enviar mensaje de chat:', error);
    }
}

function renderChatInputArea() {
    const chatInputArea = document.getElementById('chat-input-area');
    if (!chatInputArea) return;
    
    if (AppState.currentUser) {
        chatInputArea.innerHTML = `
            <input type="text" id="chat-message-input" placeholder="Escribe un chisme en vivo..." maxlength="300" autocomplete="off">
            <button id="btn-send-chat" class="btn-send-chat" title="Enviar chisme">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        `;
        
        document.getElementById('btn-send-chat').addEventListener('click', sendChatMessage);
        document.getElementById('chat-message-input').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendChatMessage();
            }
        });
    } else {
        chatInputArea.innerHTML = `
            <div class="chat-login-prompt">
                <span onclick="openModal('modal-auth')" style="cursor:pointer; color: var(--spotify-green);">Inicia sesión</span> para chatear
            </div>
        `;
    }
}

function formatChatTime(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(/-/g, "/"));
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
}

// PERF: El polling solo corre cuando la ventana del chat está abierta.
// Se pausa automáticamente al cerrar para no gastar CPU en background.
function startChatPolling() {
    if (chatInterval) clearInterval(chatInterval);
    const chatWin = document.getElementById('chat-window');
    // Solo arrancar si la ventana está visible
    if (!chatWin || chatWin.getAttribute('aria-hidden') !== 'false') return;
    chatInterval = setInterval(() => {
        loadChatMessages();
    }, 3500);
}

function stopChatPolling() {
    if (chatInterval) {
        clearInterval(chatInterval);
        chatInterval = null;
    }
}

// --- SISTEMA DE NOTIFICACIONES ---

// Helper: ver perfil desde el chat
function handleViewProfile(userId) {
    if (userId) switchView('profile', userId);
}

async function loadNotifications() {
    if (!AppState.currentUser) return;
    
    const list = document.getElementById('notifications-list');
    const badge = document.getElementById('notif-badge');
    if (!list) return;

    try {
        const response = await fetch('api.php?action=get_notifications');
        const result = await response.json();

        if (result.success && result.data) {
            const notifs = result.data.notifications;
            const unreadCount = result.data.unread_count;

            if (badge) {
                if (unreadCount > 0) {
                    badge.textContent = unreadCount;
                    badge.style.display = 'flex';
                } else {
                    badge.style.display = 'none';
                }
            }

            if (notifs.length === 0) {
                list.innerHTML = '<div class="notif-empty">Sin notificaciones</div>';
                return;
            }

            list.innerHTML = '';
            notifs.forEach(n => {
                const item = document.createElement('div');
                const isReadClass = n.is_read ? 'read' : 'unread';
                item.className = `notification-item ${isReadClass}`;
                
                let text = '';
                if (n.type === 'like') {
                    text = `reaccionó a tu chisme <b>"${escapeHTML(n.post_title)}"</b>`;
                } else if (n.type === 'comment') {
                    text = `comentó en tu chisme <b>"${escapeHTML(n.post_title)}"</b>`;
                } else if (n.type === 'follow') {
                    text = `comenzó a seguirte`;
                }

                item.innerHTML = `
                    <div class="notif-avatar">${n.sender_avatar || '🎧'}</div>
                    <div class="notif-content">
                        <p class="notif-text"><b>@${escapeHTML(n.sender_username)}</b> ${text}</p>
                        <span class="notif-time">${formatDate(n.created_at)}</span>
                    </div>
                `;

                if (n.post_id) {
                    item.style.cursor = 'pointer';
                    item.addEventListener('click', () => {
                        closeNotificationsDropdown();
                        openCommentsModal(n.post_id);
                    });
                } else {
                    item.style.cursor = 'pointer';
                    item.addEventListener('click', () => {
                        closeNotificationsDropdown();
                    });
                }
                
                list.appendChild(item);
            });
        }
    } catch (error) {
        console.error('Error al cargar notificaciones:', error);
    }
}

async function markNotificationsAsRead() {
    if (!AppState.currentUser) return;
    
    try {
        const response = await fetch('api.php?action=mark_notifications_read');
        const result = await response.json();
        
        if (result.success) {
            const badge = document.getElementById('notif-badge');
            if (badge) badge.style.display = 'none';
            loadNotifications();
        }
    } catch (error) {
        console.error('Error al marcar notificaciones como leídas:', error);
    }
}

function toggleNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (!dropdown) return;
    
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
        dropdown.style.display = 'block';
        markNotificationsAsRead();
    } else {
        dropdown.style.display = 'none';
    }
}

function closeNotificationsDropdown() {
    const dropdown = document.getElementById('notifications-dropdown');
    if (dropdown) dropdown.style.display = 'none';
}

function startNotificationPolling() {
    if (notificationInterval) clearInterval(notificationInterval);
    notificationInterval = setInterval(() => {
        loadNotifications();
    }, 10000);
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

    // Cambiar clases activas en sidebar para categorías (géneros)
    const pills = document.querySelectorAll('.category-pill-genre');
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

async function handleEditProfileSubmit(event) {
    event.preventDefault();
    
    const bioInput = document.getElementById('edit-bio');
    const avatarInput = document.querySelector('input[name="edit-avatar"]:checked');
    const featuredInput = document.getElementById('edit-featured-track');
    const errorMsg = document.getElementById('edit-profile-error-msg');

    errorMsg.style.display = 'none';

    try {
        const formData = new FormData();
        formData.append('action', 'update_profile');
        formData.append('bio', bioInput.value.trim());
        formData.append('avatar', avatarInput ? avatarInput.value : '🎧');
        formData.append('featured_track', featuredInput.value.trim());

        const response = await fetch('api.php', {
            method: 'POST',
            body: formData
        });
        const result = await response.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModal('modal-edit-profile');
            
            // Recargar sesión y actualizar cabecera
            await fetchSession();
            
            // Recargar el perfil actual
            if (AppState.currentUser) {
                loadProfileData(AppState.currentUser.id);
            }
        } else {
            errorMsg.textContent = result.message;
            errorMsg.style.display = 'block';
        }
    } catch (error) {
        console.error(error);
        errorMsg.textContent = 'Error de conexión al guardar el perfil.';
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
        document.getElementById('tab-following').classList.remove('active');
        switchView('feed');
    });

    document.getElementById('btn-nav-following').addEventListener('click', () => {
        AppState.currentFilter = 'following';
        document.getElementById('tab-following').classList.add('active');
        document.getElementById('tab-recent').classList.remove('active');
        document.getElementById('tab-popular').classList.remove('active');
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

    // Feed Tabs (Reciente vs Más Votados vs Siguiendo)
    document.getElementById('tab-recent').addEventListener('click', (e) => {
        AppState.currentFilter = 'recent';
        e.target.classList.add('active');
        document.getElementById('tab-popular').classList.remove('active');
        document.getElementById('tab-following').classList.remove('active');
        loadFeed();
    });

    document.getElementById('tab-popular').addEventListener('click', (e) => {
        AppState.currentFilter = 'trending';
        e.target.classList.add('active');
        document.getElementById('tab-recent').classList.remove('active');
        document.getElementById('tab-following').classList.remove('active');
        loadFeed();
    });

    document.getElementById('tab-following').addEventListener('click', (e) => {
        AppState.currentFilter = 'following';
        e.target.classList.add('active');
        document.getElementById('tab-recent').classList.remove('active');
        document.getElementById('tab-popular').classList.remove('active');
        loadFeed();
    });

    // Filtros de Formato Spotify
    const formatButtons = document.querySelectorAll('.category-pill');
    formatButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            formatButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
            const type = e.currentTarget.getAttribute('data-spotify-type');
            AppState.currentSpotifyType = type;
            loadFeed();
        });
    });

    // Filtros de Categorías (Géneros)
    const categoryButtons = document.querySelectorAll('.category-pill-genre');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            categoryButtons.forEach(b => b.classList.remove('active'));
            e.currentTarget.classList.add('active');
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
    document.getElementById('btn-close-modal-edit').addEventListener('click', () => closeModal('modal-edit-profile'));

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
    document.getElementById('form-edit-profile').addEventListener('submit', handleEditProfileSubmit);

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

    // Cola de Reproducción
    document.getElementById('btn-queue-toggle').addEventListener('click', toggleQueuePanel);
    document.getElementById('btn-clear-queue').addEventListener('click', clearQueue);
    document.getElementById('btn-next-player').addEventListener('click', playNext);

    // Chat Burbuja
    const chatBubble = document.getElementById('btn-chat-bubble');
    const closeChatBtn = document.getElementById('btn-close-chat-window');
    if (chatBubble) chatBubble.addEventListener('click', toggleChatWindow);
    if (closeChatBtn) closeChatBtn.addEventListener('click', closeChatWindow);

    // Cerrar chat al hacer click fuera
    document.addEventListener('click', (e) => {
        const root = document.getElementById('chat-bubble-root');
        if (root && !root.contains(e.target)) {
            const chatWin = document.getElementById('chat-window');
            if (chatWin && chatWin.getAttribute('aria-hidden') === 'false') {
                closeChatWindow();
            }
        }
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

// --- Chat Burbuja flotante ---
function toggleChatWindow() {
    const chatWin = document.getElementById('chat-window');
    const bubble  = document.getElementById('btn-chat-bubble');
    const iconOpen  = bubble && bubble.querySelector('.chat-bubble-icon-open');
    const iconClose = bubble && bubble.querySelector('.chat-bubble-icon-close');
    if (!chatWin) return;

    const isHidden = chatWin.getAttribute('aria-hidden') === 'true';
    if (isHidden) {
        // Abrir
        chatWin.setAttribute('aria-hidden', 'false');
        chatWin.style.display = 'flex';
        bubble && bubble.classList.add('is-open');
        if (iconOpen)  iconOpen.style.display  = 'none';
        if (iconClose) iconClose.style.display = 'inline';
        // Resetear badge
        const badge = document.getElementById('chat-bubble-unread');
        if (badge) badge.style.display = 'none';
        // Cargar mensajes, hacer scroll y ARRANCAR el polling
        AppState.lastChatId = 0;
        loadChatMessages();
        renderChatInputArea();
        startChatPolling(); // PERF: polling solo cuando está abierto
    } else {
        closeChatWindow();
    }
}

function closeChatWindow() {
    const chatWin = document.getElementById('chat-window');
    const bubble  = document.getElementById('btn-chat-bubble');
    const iconOpen  = bubble && bubble.querySelector('.chat-bubble-icon-open');
    const iconClose = bubble && bubble.querySelector('.chat-bubble-icon-close');
    if (!chatWin) return;
    chatWin.setAttribute('aria-hidden', 'true');
    chatWin.style.display = 'none';
    bubble && bubble.classList.remove('is-open');
    if (iconOpen)  iconOpen.style.display  = 'inline';
    if (iconClose) iconClose.style.display = 'none';
    stopChatPolling(); // PERF: pausar polling al cerrar
}

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
