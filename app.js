/**
 * DJ CHISMOSO - Controlador Principal del Frontend (SPA)
 *
 * Gestiona el estado global, enrutamiento de vistas, peticiones AJAX a api.php,
 * y toda la interactividad: reacciones, chat, cola de reproducción, notificaciones y edición de perfil.
 */

// ==========================================
// ESTADO GLOBAL DE LA APP
// ==========================================
const AppState = {
    currentUser:        null,
    currentCategory:    '',
    currentSpotifyType: '',   // 'track' | 'playlist' | 'album' | ''
    currentSearch:      '',
    currentFilter:      'recent', // 'recent' | 'trending' | 'following'
    currentView:        'feed',
    selectedProfileId:  null,
    searchTimeout:      null,
    // Chat
    chatLastId:         0,
    chatInterval:       null,
    // Notificaciones
    notifInterval:      null,
    // Cola de reproducción
    playbackQueue:      [],
    currentQueueIndex:  -1,
};

// ==========================================
// MAPAS DE REACCIONES
// ==========================================
const REACTION_MAP = {
    heart: '❤️',
    fire:  '🔥',
    cry:   '😭',
    wow:   '😱',
    dance: '🕺',
};

// ==========================================
// INICIALIZACIÓN
// ==========================================
document.addEventListener('DOMContentLoaded', () => { AppInit(); });

function AppInit() {
    fetchSession();
    loadFeed();
    loadRankings();
    loadTrends();
    bindEventEvents();
    startChatPolling();
}

// ==========================================
// 1. GESTIÓN DE SESIÓN Y USUARIO
// ==========================================

async function fetchSession() {
    try {
        const res  = await fetch('api.php?action=get_session');
        const data = await res.json();

        if (data.success && data.data) {
            AppState.currentUser = data.data;
            renderUserHeader(data.data);
            document.getElementById('btn-nav-profile').style.display   = 'flex';
            document.getElementById('btn-nav-following').style.display = 'flex';
            document.getElementById('tab-following').style.display     = 'inline-flex';
            renderChatInput();
            startNotifPolling();
        } else {
            AppState.currentUser = null;
            renderGuestHeader();
            document.getElementById('btn-nav-profile').style.display   = 'none';
            document.getElementById('btn-nav-following').style.display = 'none';
            document.getElementById('tab-following').style.display     = 'none';
            renderChatInput();
        }
    } catch (e) {
        console.error('Error sesión:', e);
        renderGuestHeader();
    }
}

function renderUserHeader(user) {
    const area = document.getElementById('header-user-area');
    area.innerHTML = `
        <div class="notif-bell-wrapper" id="notif-bell-wrapper">
            <button class="btn-notif-bell" id="btn-notif-bell" title="Notificaciones">
                <i class="fa-solid fa-bell"></i>
                <span class="notif-badge" id="notif-badge" style="display:none;">0</span>
            </button>
            <div class="notif-dropdown" id="notif-dropdown" style="display:none;">
                <div class="notif-dropdown-header">
                    <span>Notificaciones</span>
                    <button class="notif-mark-read" id="btn-mark-notif-read">Marcar todo leído</button>
                </div>
                <div class="notif-list" id="notif-list">
                    <div class="notif-empty">Sin notificaciones nuevas 🎵</div>
                </div>
            </div>
        </div>
        <div class="user-menu-header" id="header-user-menu">
            <div class="user-menu-avatar">${user.avatar}</div>
            <span class="user-menu-name">${user.username}</span>
        </div>
    `;

    document.getElementById('header-user-menu').addEventListener('click', () => switchView('profile', user.id));

    // Bell toggle
    document.getElementById('btn-notif-bell').addEventListener('click', (e) => {
        e.stopPropagation();
        const dd = document.getElementById('notif-dropdown');
        dd.style.display = dd.style.display === 'none' ? 'block' : 'none';
        if (dd.style.display === 'block') {
            loadNotifications();
        }
    });
    document.addEventListener('click', () => {
        const dd = document.getElementById('notif-dropdown');
        if (dd) dd.style.display = 'none';
    });

    document.getElementById('btn-mark-notif-read').addEventListener('click', async () => {
        await fetch('api.php', { method: 'POST', body: new URLSearchParams({ action: 'mark_notifications_read' }) });
        document.getElementById('notif-badge').style.display = 'none';
        document.getElementById('notif-list').innerHTML = '<div class="notif-empty">Sin notificaciones nuevas 🎵</div>';
    });
}

function renderGuestHeader() {
    const area = document.getElementById('header-user-area');
    area.innerHTML = `
        <button class="btn btn-primary" id="btn-header-login">
            <i class="fa-solid fa-right-to-bracket"></i> Iniciar Sesión
        </button>
    `;
    document.getElementById('btn-header-login').addEventListener('click', () => openModal('modal-auth'));
}

// ==========================================
// 2. NOTIFICACIONES
// ==========================================

async function loadNotifications() {
    try {
        const res    = await fetch('api.php?action=get_notifications');
        const result = await res.json();
        if (!result.success) return;

        const { notifications, unread_count } = result.data;
        const badge = document.getElementById('notif-badge');
        if (badge) {
            if (unread_count > 0) {
                badge.textContent     = unread_count > 9 ? '9+' : unread_count;
                badge.style.display   = 'flex';
            } else {
                badge.style.display   = 'none';
            }
        }

        const list = document.getElementById('notif-list');
        if (!list) return;

        if (!notifications || notifications.length === 0) {
            list.innerHTML = '<div class="notif-empty">Sin notificaciones nuevas 🎵</div>';
            return;
        }

        list.innerHTML = '';
        notifications.forEach(n => {
            const item = document.createElement('div');
            item.className = 'notif-item' + (n.is_read == 0 ? ' unread' : '');
            const icons = { like: '❤️', comment: '💬', follow: '👤' };
            const texts = {
                like:    `<b>${n.sender_avatar} ${n.sender_username}</b> reaccionó a tu chisme${n.post_title ? ` <i>"${escapeHTML(n.post_title)}"</i>` : ''}`,
                comment: `<b>${n.sender_avatar} ${n.sender_username}</b> comentó en tu chisme${n.post_title ? ` <i>"${escapeHTML(n.post_title)}"</i>` : ''}`,
                follow:  `<b>${n.sender_avatar} ${n.sender_username}</b> ahora te sigue`,
            };
            item.innerHTML = `
                <span class="notif-icon">${icons[n.type] || '🔔'}</span>
                <div class="notif-text">${texts[n.type] || ''}</div>
                <div class="notif-time">${formatDate(n.created_at)}</div>
            `;
            if (n.post_id) {
                item.style.cursor = 'pointer';
                item.addEventListener('click', () => {
                    document.getElementById('notif-dropdown').style.display = 'none';
                    openCommentsModal(n.post_id);
                });
            }
            list.appendChild(item);
        });
    } catch (e) {
        console.error('Error notificaciones:', e);
    }
}

function startNotifPolling() {
    loadNotifications();
    AppState.notifInterval = setInterval(loadNotifications, 12000);
}

// ==========================================
// 3. ENRUTAMIENTO DE VISTAS (SPA)
// ==========================================

function switchView(viewName, targetId = null) {
    document.querySelectorAll('.app-view').forEach(v => v.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));

    AppState.currentView = viewName;

    if (viewName === 'feed') {
        document.getElementById('view-feed').classList.add('active');
        document.getElementById('btn-nav-feed').classList.add('active');
        AppState.selectedProfileId = null;
        loadFeed();
    } else if (viewName === 'profile') {
        document.getElementById('view-profile').classList.add('active');
        if (targetId && AppState.currentUser && parseInt(targetId) === parseInt(AppState.currentUser.id)) {
            document.getElementById('btn-nav-profile').classList.add('active');
        }
        AppState.selectedProfileId = targetId;
        loadProfileData(targetId);
    }

    document.querySelector('.content-area').scrollTop = 0;
}

// ==========================================
// 4. FEED PRINCIPAL
// ==========================================

async function loadFeed() {
    const container = document.getElementById('posts-container');
    renderSkeletonLoader(container);

    try {
        let url = `api.php?action=get_posts&filter=${AppState.currentFilter}`;
        if (AppState.currentCategory)    url += `&category=${encodeURIComponent(AppState.currentCategory)}`;
        if (AppState.currentSpotifyType) url += `&spotify_type=${encodeURIComponent(AppState.currentSpotifyType)}`;
        if (AppState.currentSearch)      url += `&search=${encodeURIComponent(AppState.currentSearch)}`;

        const res    = await fetch(url);
        const result = await res.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach(post => container.appendChild(renderPostCard(post)));
        } else {
            container.innerHTML = `
                <div class="feed-empty-state">
                    <i class="fa-solid fa-compact-disc"></i>
                    <h4>No se encontraron chismes</h4>
                    <p>Sé el primero en compartir música en este canal.</p>
                </div>
            `;
        }
    } catch (e) {
        console.error('Error cargando feed:', e);
        container.innerHTML = `
            <div class="feed-empty-state">
                <i class="fa-solid fa-triangle-exclamation" style="color: var(--chisme-pink);"></i>
                <h4>Error de conexión</h4>
                <p>No se pudo conectar a la base de datos de DJ CHISMOSO.</p>
            </div>
        `;
    }
}

// ==========================================
// 5. TARJETA DE POST (RENDER)
// ==========================================

function renderPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;

    const userAvatar = post.user_avatar || '🎧';
    let followBtnHtml = '';
    if (AppState.currentUser && parseInt(post.user_id) !== parseInt(AppState.currentUser.id)) {
        followBtnHtml = `<button class="follow-badge-btn" onclick="handleQuickFollow(event, ${post.user_id})">+ Seguir</button>`;
    }

    const iconType = post.spotify_type === 'playlist' ? 'fa-music' : (post.spotify_type === 'album' ? 'fa-record-vinyl' : 'fa-compact-disc');
    const musicTitle = post.spotify_type.charAt(0).toUpperCase() + post.spotify_type.slice(1);

    const musicCardHtml = `
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
                <button class="btn-add-queue" onclick="addToQueue('${post.spotify_id}', '${post.spotify_type}', '${escapeHTML(post.title)}', '${escapeHTML(post.category)}')" title="Añadir a la cola">
                    <i class="fa-solid fa-list-ol"></i>
                </button>
                <a href="${post.spotify_url}" target="_blank" class="btn-spotify-link" title="Abrir en Spotify App">
                    <i class="fa-brands fa-spotify"></i>
                </a>
            </div>
        </div>
    `;

    // Reacciones
    const userReaction  = post.user_reaction || null;
    const totalReacts   = parseInt(post.likes_count) || 0;
    const reactionsHtml = buildReactionBarHtml(post.id, userReaction, totalReacts, post);

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
            ${reactionsHtml}
            <button class="action-btn btn-comment" onclick="openCommentsModal(${post.id})">
                <i class="fa-regular fa-comment"></i>
                <span>${post.comments_count}</span> Comentarios
            </button>
            <button class="action-btn btn-share" onclick="handleSharePost('${escapeHTML(post.title)}', ${post.id})">
                <i class="fa-regular fa-share-from-square"></i> Compartir
            </button>
        </div>
    `;

    return card;
}

function buildReactionBarHtml(postId, userReaction, totalCount, post) {
    // Construir breakdown de reacciones
    const breakdown = {};
    ['heart','fire','cry','wow','dance'].forEach(r => {
        const val = parseInt(post[`react_${r}`]) || 0;
        if (val > 0) breakdown[r] = val;
    });

    const topReactions = Object.entries(breakdown)
        .sort((a,b) => b[1] - a[1])
        .slice(0, 3)
        .map(([r]) => REACTION_MAP[r])
        .join('');

    const activeClass = userReaction ? 'active' : '';
    const activeEmoji = userReaction ? REACTION_MAP[userReaction] : '❤️';

    const pickerHtml = Object.entries(REACTION_MAP).map(([key, emoji]) => `
        <button class="reaction-picker-btn ${userReaction === key ? 'selected' : ''}"
                onclick="handleReaction(event, ${postId}, '${key}')"
                title="${key}">
            ${emoji}
        </button>
    `).join('');

    return `
        <div class="reaction-wrapper" id="reaction-wrapper-${postId}">
            <button class="action-btn btn-like ${activeClass}" id="btn-react-${postId}"
                    onmouseenter="showReactionPicker(${postId})"
                    onclick="handleReaction(event, ${postId}, '${userReaction || 'heart'}')">
                ${activeEmoji}
                <span class="reaction-summary">${topReactions}</span>
                <span class="like-count">${totalCount}</span>
            </button>
            <div class="reaction-picker" id="reaction-picker-${postId}" style="display:none;"
                 onmouseenter="keepReactionPicker(${postId})" onmouseleave="hideReactionPicker(${postId})">
                ${pickerHtml}
            </div>
        </div>
    `;
}

// ==========================================
// 6. REACCIONES CON EMOJIS
// ==========================================

let reactionPickerTimers = {};

function showReactionPicker(postId) {
    clearTimeout(reactionPickerTimers[postId]);
    document.getElementById(`reaction-picker-${postId}`).style.display = 'flex';
}

function keepReactionPicker(postId) {
    clearTimeout(reactionPickerTimers[postId]);
}

function hideReactionPicker(postId) {
    reactionPickerTimers[postId] = setTimeout(() => {
        const picker = document.getElementById(`reaction-picker-${postId}`);
        if (picker) picker.style.display = 'none';
    }, 200);
}

document.addEventListener('mouseleave', (e) => {
    // cierra pickers si el mouse sale del documento
}, true);

async function handleReaction(event, postId, reactionType) {
    event.stopPropagation();
    hideReactionPicker(postId);

    if (!AppState.currentUser) {
        showToast('Inicia sesión para reaccionar a este chisme musical.', 'info');
        openModal('modal-auth');
        return;
    }

    try {
        const fd = new FormData();
        fd.append('action', 'toggle_reaction');
        fd.append('post_id', postId);
        fd.append('reaction_type', reactionType);

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            // Actualizar UI del botón
            const btn = document.getElementById(`btn-react-${postId}`);
            if (btn) {
                if (result.data.liked) {
                    btn.classList.add('active');
                    const emoji = REACTION_MAP[result.data.user_reaction] || '❤️';
                    const topReacts = Object.entries(result.data.breakdown || {})
                        .sort((a,b) => b[1]-a[1]).slice(0,3)
                        .map(([r]) => REACTION_MAP[r]).join('');
                    btn.innerHTML = `${emoji} <span class="reaction-summary">${topReacts}</span> <span class="like-count">${result.data.likes_count}</span>`;
                } else {
                    btn.classList.remove('active');
                    btn.innerHTML = `❤️ <span class="reaction-summary"></span> <span class="like-count">${result.data.likes_count}</span>`;
                }
            }
            loadRankings();
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) {
        console.error('Error reacción:', e);
    }
}

// ==========================================
// 7. INTERACCIONES SOCIALES (FOLLOWS)
// ==========================================

async function handleQuickFollow(event, targetUserId) {
    event.stopPropagation();
    if (!AppState.currentUser) {
        showToast('Inicia sesión para seguir a este DJ.', 'info');
        openModal('modal-auth');
        return;
    }
    try {
        const fd = new FormData();
        fd.append('action', 'toggle_follow');
        fd.append('user_id', targetUserId);
        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();
        if (result.success) {
            showToast(result.message, 'success');
            if (AppState.currentView === 'profile' && parseInt(AppState.selectedProfileId) === parseInt(targetUserId)) {
                loadProfileData(targetUserId);
            }
            loadFeed();
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) { console.error(e); }
}

function handleViewProfile(userId) { switchView('profile', userId); }

// ==========================================
// 8. MODAL DE COMENTARIOS
// ==========================================

let activeCommentPostId = null;

async function openCommentsModal(postId) {
    activeCommentPostId = postId;
    openModal('modal-comments');

    const previewArea = document.getElementById('comments-post-preview-area');
    const commentsList = document.getElementById('modal-comments-list');
    const formArea = document.getElementById('comment-form-auth-check');

    previewArea.innerHTML  = '<div class="skeleton-list-item"></div>';
    commentsList.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        const postRes    = await fetch('api.php?action=get_posts');
        const postResult = await postRes.json();

        if (postResult.success && postResult.data) {
            const currentPost = postResult.data.find(p => parseInt(p.id) === parseInt(postId));
            if (currentPost) {
                const tempCard = renderPostCard(currentPost);
                const commentBtn = tempCard.querySelector('.btn-comment');
                if (commentBtn) commentBtn.style.pointerEvents = 'none';
                previewArea.innerHTML = '';
                previewArea.appendChild(tempCard);
            }
        }

        loadCommentsForPost(postId);

        if (AppState.currentUser) {
            formArea.innerHTML = `
                <input type="text" id="comment-text-input" placeholder="Escribe tu chisme o respuesta sobre esta música..." autocomplete="off">
                <button class="btn-send-comment" onclick="submitComment(${postId})">
                    <i class="fa-solid fa-paper-plane"></i>
                </button>
            `;
            document.getElementById('comment-text-input').addEventListener('keypress', (e) => {
                if (e.key === 'Enter') submitComment(postId);
            });
        } else {
            formArea.innerHTML = `
                <div style="text-align: center; width:100%; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
                    Debes <span class="setup-link" style="cursor:pointer;" onclick="openModal('modal-auth')">iniciar sesión</span> para unirte al chisme musical.
                </div>
            `;
        }
    } catch (e) { console.error('Error modal comentarios:', e); }
}

async function loadCommentsForPost(postId) {
    const commentsList = document.getElementById('modal-comments-list');
    commentsList.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        const res    = await fetch(`api.php?action=get_comments&post_id=${postId}`);
        const result = await res.json();

        if (result.success && result.data && result.data.length > 0) {
            commentsList.innerHTML = '';
            result.data.forEach(comment => {
                const item = document.createElement('div');
                item.className = 'comment-item';
                item.innerHTML = `
                    <div class="comment-avatar">${comment.user_avatar}</div>
                    <div class="comment-content">
                        <div class="comment-header">
                            <span class="comment-user" onclick="handleCommentUserClick(${comment.user_id})">${escapeHTML(comment.username)}</span>
                            <span class="comment-time">${formatDate(comment.created_at)}</span>
                        </div>
                        <p class="comment-body">${escapeHTML(comment.comment_text)}</p>
                    </div>
                `;
                commentsList.appendChild(item);
            });
            commentsList.scrollTop = commentsList.scrollHeight;
        } else {
            commentsList.innerHTML = `
                <div class="no-comments-msg">
                    <i class="fa-regular fa-comments" style="font-size: 2rem; margin-bottom: 10px; display:block;"></i>
                    Aún no hay chismes aquí. ¡Añade tu comentario abajo!
                </div>
            `;
        }
    } catch (e) {
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
        const fd = new FormData();
        fd.append('action', 'add_comment');
        fd.append('post_id', postId);
        fd.append('comment_text', text);

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            input.value = '';
            showToast('¡Comentario publicado!', 'success');
            loadCommentsForPost(postId);
            loadFeed();
            if (AppState.currentView === 'profile') loadProfileData(AppState.selectedProfileId);
        } else {
            showToast(result.message, 'error');
        }
    } catch (e) { console.error(e); }
}

// ==========================================
// 9. PERFIL DE USUARIO
// ==========================================

async function loadProfileData(userId) {
    try {
        const res    = await fetch(`api.php?action=get_profile&user_id=${userId}`);
        const result = await res.json();

        if (result.success && result.data) {
            const profile = result.data;
            const user    = profile.user;

            document.getElementById('profile-avatar').textContent   = user.avatar || '🎧';
            document.getElementById('profile-username').textContent  = user.username;
            document.getElementById('profile-joined').textContent    = `Miembro desde: ${formatDate(user.created_at)}`;
            document.getElementById('profile-bio').textContent       = user.bio || 'Este usuario es un DJ silencioso sin biografía.';
            document.getElementById('profile-followers-count').textContent = profile.followers_count;
            document.getElementById('profile-following-count').textContent = profile.following_count;
            document.getElementById('profile-posts-user').textContent = user.username;

            // Canción Insignia
            const featuredArea  = document.getElementById('profile-featured-track-area');
            const featuredEmbed = document.getElementById('profile-featured-track-embed');
            if (user.featured_track) {
                const match = user.featured_track.match(/spotify\.com\/(playlist|track|album)\/([a-zA-Z0-9]+)/i);
                if (match) {
                    featuredEmbed.innerHTML = `
                        <iframe style="border-radius:12px"
                                src="https://open.spotify.com/embed/${match[1]}/${match[2]}?utm_source=generator&theme=0"
                                width="100%" height="80" frameBorder="0"
                                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                                loading="lazy">
                        </iframe>`;
                    featuredArea.style.display = 'block';
                }
            } else {
                featuredArea.style.display = 'none';
            }

            // Botones de acción
            const followBtn  = document.getElementById('profile-follow-btn');
            const editBtn    = document.getElementById('profile-edit-btn');
            const logoutBtn  = document.getElementById('profile-logout-btn');

            if (AppState.currentUser && parseInt(AppState.currentUser.id) === parseInt(user.id)) {
                followBtn.style.display = 'none';
                editBtn.style.display   = 'inline-flex';
                logoutBtn.style.display = 'inline-flex';

                editBtn.onclick = () => openEditProfileModal(user);
            } else {
                editBtn.style.display   = 'none';
                logoutBtn.style.display = 'none';
                followBtn.style.display = 'inline-flex';

                if (profile.is_following) {
                    followBtn.className = 'btn btn-follow active';
                    followBtn.innerHTML = '<i class="fa-solid fa-user-minus"></i> Dejar de Seguir';
                } else {
                    followBtn.className = 'btn btn-primary';
                    followBtn.innerHTML = '<i class="fa-solid fa-user-plus"></i> Seguir';
                }

                followBtn.onclick = async () => {
                    if (!AppState.currentUser) { showToast('Inicia sesión para seguir usuarios.', 'info'); openModal('modal-auth'); return; }
                    const fd = new FormData();
                    fd.append('action', 'toggle_follow');
                    fd.append('user_id', user.id);
                    const r = await fetch('api.php', { method: 'POST', body: fd });
                    const res = await r.json();
                    if (res.success) { showToast(res.message, 'success'); loadProfileData(user.id); }
                };
            }

            loadUserPosts(user.id);
        }
    } catch (e) { console.error('Error perfil:', e); }
}

async function loadUserPosts(userId) {
    const container = document.getElementById('profile-posts-container');
    container.innerHTML = '<div class="skeleton-list-item"></div>';

    try {
        const res    = await fetch(`api.php?action=get_posts&user_id=${userId}`);
        const result = await res.json();

        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            document.getElementById('profile-posts-count').textContent = result.data.length;
            result.data.forEach(post => container.appendChild(renderPostCard(post)));
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
    } catch (e) { container.innerHTML = '<div class="feed-empty-state">Error al cargar publicaciones.</div>'; }
}

// ==========================================
// 10. EDITAR PERFIL
// ==========================================

function openEditProfileModal(user) {
    // Pre-rellenar formulario
    const bioInput = document.getElementById('edit-bio');
    if (bioInput) bioInput.value = user.bio || '';

    const featInput = document.getElementById('edit-featured-track');
    if (featInput) featInput.value = user.featured_track || '';

    // Seleccionar avatar actual
    const radios = document.querySelectorAll('input[name="edit-avatar"]');
    radios.forEach(r => { r.checked = (r.value === user.avatar); });

    openModal('modal-edit-profile');
}

async function handleEditProfileSubmit(event) {
    event.preventDefault();
    const bioInput    = document.getElementById('edit-bio');
    const featInput   = document.getElementById('edit-featured-track');
    const avatarInput = document.querySelector('input[name="edit-avatar"]:checked');
    const errorMsg    = document.getElementById('edit-profile-error-msg');
    errorMsg.style.display = 'none';

    try {
        const fd = new FormData();
        fd.append('action', 'update_profile');
        fd.append('bio', bioInput.value.trim());
        fd.append('avatar', avatarInput ? avatarInput.value : '🎧');
        fd.append('featured_track', featInput.value.trim());

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            showToast(result.message, 'success');
            closeModal('modal-edit-profile');
            // Actualizar avatar en header
            if (AppState.currentUser) {
                AppState.currentUser.avatar = avatarInput ? avatarInput.value : '🎧';
                renderUserHeader(AppState.currentUser);
            }
            loadProfileData(AppState.currentUser.id);
        } else {
            errorMsg.textContent    = result.message;
            errorMsg.style.display  = 'block';
        }
    } catch (e) {
        errorMsg.textContent   = 'Error de conexión al guardar.';
        errorMsg.style.display = 'block';
    }
}

// ==========================================
// 11. REPRODUCTOR DE SPOTIFY + COLA
// ==========================================

function playMusic(spotifyId, type, title, category) {
    const playerBar     = document.getElementById('floating-player');
    const embedWrapper  = document.getElementById('player-embed-wrapper');
    const waves         = document.getElementById('audio-waves-visualizer');

    document.getElementById('player-title').textContent    = title;
    document.getElementById('player-category').textContent = `#${category}`;

    embedWrapper.innerHTML = `
        <iframe style="border-radius:12px"
                src="https://open.spotify.com/embed/${type}/${spotifyId}?utm_source=generator&theme=0"
                width="100%" height="80" frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                loading="lazy">
        </iframe>
    `;

    playerBar.style.display = 'flex';
    waves.style.display     = 'flex';
    showToast(`Reproduciendo en canal #${category} 🎧`, 'info');
}

// Cola de reproducción
function addToQueue(spotifyId, type, title, category) {
    AppState.playbackQueue.push({ spotifyId, type, title, category });
    updateQueueUI();
    showToast(`"${title}" añadido a la cola 🎵`, 'success');
}

function updateQueueUI() {
    const badge  = document.getElementById('queue-count-badge');
    const list   = document.getElementById('queue-list');
    const count  = AppState.playbackQueue.length;

    if (badge) {
        badge.textContent    = count;
        badge.style.display  = count > 0 ? 'flex' : 'none';
    }

    if (!list) return;

    if (count === 0) {
        list.innerHTML = `
            <div class="queue-empty">
                <i class="fa-solid fa-music"></i>
                <p>La cola está vacía.<br>Añade canciones desde el feed.</p>
            </div>
        `;
        return;
    }

    list.innerHTML = '';
    AppState.playbackQueue.forEach((item, idx) => {
        const el = document.createElement('div');
        el.className = 'queue-item' + (idx === AppState.currentQueueIndex ? ' playing' : '');
        el.innerHTML = `
            <span class="queue-num">${idx + 1}</span>
            <div class="queue-item-info">
                <span class="queue-item-title">${escapeHTML(item.title)}</span>
                <span class="queue-item-cat">#${escapeHTML(item.category)}</span>
            </div>
            <div class="queue-item-actions">
                <button onclick="playFromQueue(${idx})" title="Reproducir"><i class="fa-solid fa-play"></i></button>
                <button onclick="removeFromQueue(${idx})" title="Quitar"><i class="fa-solid fa-xmark"></i></button>
            </div>
        `;
        list.appendChild(el);
    });
}

function playFromQueue(idx) {
    if (idx < 0 || idx >= AppState.playbackQueue.length) return;
    AppState.currentQueueIndex = idx;
    const item = AppState.playbackQueue[idx];
    playMusic(item.spotifyId, item.type, item.title, item.category);
    updateQueueUI();
}

function removeFromQueue(idx) {
    AppState.playbackQueue.splice(idx, 1);
    if (AppState.currentQueueIndex >= idx) AppState.currentQueueIndex--;
    updateQueueUI();
}

// ==========================================
// 12. CHAT EN VIVO ("EL CHISMÓGRAFO")
// ==========================================

function renderChatInput() {
    const area = document.getElementById('chat-input-area');
    if (!area) return;

    if (AppState.currentUser) {
        area.innerHTML = `
            <input type="text" id="chat-msg-input" class="chat-text-input" placeholder="Escribe un chisme..." maxlength="300" autocomplete="off">
            <button class="btn-send-chat" id="btn-send-chat" title="Enviar">
                <i class="fa-solid fa-paper-plane"></i>
            </button>
        `;
        const input = document.getElementById('chat-msg-input');
        const btn   = document.getElementById('btn-send-chat');
        const send  = () => sendChatMessage();
        btn.addEventListener('click', send);
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') send(); });
    } else {
        area.innerHTML = `
            <div class="chat-login-prompt">
                <span onclick="openModal('modal-auth')" style="cursor:pointer; color: var(--chisme-green);">Inicia sesión</span> para chatear
            </div>
        `;
    }
}

async function sendChatMessage() {
    const input = document.getElementById('chat-msg-input');
    if (!input) return;
    const msg = input.value.trim();
    if (!msg) return;

    input.value = '';
    try {
        const fd = new FormData();
        fd.append('action', 'send_chat_message');
        fd.append('message', msg);
        await fetch('api.php', { method: 'POST', body: fd });
        await pollChat(true); // forzar recarga inmediata
    } catch (e) { console.error('Error enviando chat:', e); }
}

async function pollChat(forceScroll = false) {
    try {
        const res    = await fetch(`api.php?action=get_chat_messages&since_id=${AppState.chatLastId}`);
        const result = await res.json();

        if (!result.success || !result.data || result.data.length === 0) return;

        const container = document.getElementById('chat-messages-list');
        if (!container) return;

        // Limpiar placeholder inicial
        const placeholder = container.querySelector('.chat-placeholder');
        if (placeholder) placeholder.remove();

        const wasAtBottom = container.scrollHeight - container.clientHeight - container.scrollTop < 60;

        result.data.forEach(msg => {
            if (parseInt(msg.id) > AppState.chatLastId) {
                AppState.chatLastId = parseInt(msg.id);
            }
            const isMe  = AppState.currentUser && AppState.currentUser.username === msg.username;
            const item  = document.createElement('div');
            item.className = `chat-msg ${isMe ? 'chat-msg-me' : ''}`;
            item.innerHTML = `
                <span class="chat-msg-avatar">${msg.avatar}</span>
                <div class="chat-msg-bubble">
                    ${!isMe ? `<span class="chat-msg-user">${escapeHTML(msg.username)}</span>` : ''}
                    <span class="chat-msg-text">${escapeHTML(msg.message)}</span>
                </div>
            `;
            container.appendChild(item);
        });

        if (wasAtBottom || forceScroll) {
            container.scrollTop = container.scrollHeight;
        }
    } catch (e) { /* silencioso */ }
}

function startChatPolling() {
    pollChat(true);
    AppState.chatInterval = setInterval(() => pollChat(), 4000);
}

// ==========================================
// 13. RANKINGS Y TENDENCIAS
// ==========================================

async function loadRankings() {
    const container = document.getElementById('rankings-container');
    if (!container) return;
    try {
        const res    = await fetch('api.php?action=get_rankings');
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach((rank, index) => {
                const item = document.createElement('div');
                item.className = 'ranking-item';
                item.innerHTML = `
                    <div class="ranking-position pos-${index + 1}">${index + 1}</div>
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
    } catch (e) { console.error('Error rankings:', e); }
}

async function loadTrends() {
    const container = document.getElementById('trends-container');
    if (!container) return;
    try {
        const res    = await fetch('api.php?action=get_trends');
        const result = await res.json();
        if (result.success && result.data && result.data.length > 0) {
            container.innerHTML = '';
            result.data.forEach(trend => {
                const btn = document.createElement('button');
                btn.className = 'trend-tag-btn';
                btn.innerHTML = `#${escapeHTML(trend.name)} <span style="font-weight:400; opacity:0.65;">(${trend.posts_count})</span>`;
                btn.addEventListener('click', () => selectCategory(trend.name));
                container.appendChild(btn);
            });
        }
    } catch (e) { console.error('Error tendencias:', e); }
}

function selectCategory(categoryName) {
    AppState.currentCategory = categoryName;

    document.querySelectorAll('.category-pill-genre').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-category') === categoryName);
    });

    const feedTitle = document.getElementById('feed-title');
    feedTitle.textContent = categoryName ? `Canal #${categoryName}` : 'Explorar Chismes';

    if (AppState.currentView !== 'feed') {
        switchView('feed');
    } else {
        loadFeed();
    }
}

function selectSpotifyType(type) {
    AppState.currentSpotifyType = type;
    document.querySelectorAll('.category-pill').forEach(pill => {
        pill.classList.toggle('active', pill.getAttribute('data-spotify-type') === type);
    });
    loadFeed();
}

// ==========================================
// 14. FORMULARIOS AUTH / CREATE POST
// ==========================================

async function handleLoginSubmit(event) {
    event.preventDefault();
    const uInput  = document.getElementById('login-username');
    const pInput  = document.getElementById('login-password');
    const errMsg  = document.getElementById('auth-error-msg');
    errMsg.style.display = 'none';

    try {
        const fd = new FormData();
        fd.append('action', 'login');
        fd.append('username', uInput.value.trim());
        fd.append('password', pInput.value.trim());

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            showToast(result.message, 'success');
            uInput.value = ''; pInput.value = '';
            closeModal('modal-auth');
            await fetchSession();
            loadFeed();
            loadRankings();
        } else {
            errMsg.textContent   = result.message;
            errMsg.style.display = 'block';
        }
    } catch (e) {
        errMsg.textContent   = 'Error de conexión con el servidor.';
        errMsg.style.display = 'block';
    }
}

async function handleRegisterSubmit(event) {
    event.preventDefault();
    const uInput    = document.getElementById('register-username');
    const pInput    = document.getElementById('register-password');
    const aInput    = document.querySelector('input[name="avatar"]:checked');
    const bioInput  = document.getElementById('register-bio');
    const errMsg    = document.getElementById('auth-error-msg');
    errMsg.style.display = 'none';

    try {
        const fd = new FormData();
        fd.append('action', 'register');
        fd.append('username', uInput.value.trim());
        fd.append('password', pInput.value.trim());
        fd.append('avatar', aInput ? aInput.value : '🎧');
        fd.append('bio', bioInput.value.trim());

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            showToast(result.message, 'success');
            uInput.value = ''; pInput.value = ''; bioInput.value = '';
            closeModal('modal-auth');
            await fetchSession();
            loadFeed();
        } else {
            errMsg.textContent   = result.message;
            errMsg.style.display = 'block';
        }
    } catch (e) {
        errMsg.textContent   = 'Error de conexión en el registro.';
        errMsg.style.display = 'block';
    }
}

async function handleCreatePostSubmit(event) {
    event.preventDefault();
    const spotifyInput  = document.getElementById('post-spotify-url');
    const titleInput    = document.getElementById('post-title');
    const categoryInput = document.getElementById('post-category');
    const chismeInput   = document.getElementById('post-chisme');
    const errMsg        = document.getElementById('post-error-msg');
    errMsg.style.display = 'none';

    try {
        const fd = new FormData();
        fd.append('action', 'create_post');
        fd.append('spotify_url', spotifyInput.value.trim());
        fd.append('title', titleInput.value.trim());
        fd.append('category', categoryInput.value);
        fd.append('chisme', chismeInput.value.trim());

        const res    = await fetch('api.php', { method: 'POST', body: fd });
        const result = await res.json();

        if (result.success) {
            showToast(result.message, 'success');
            spotifyInput.value = ''; titleInput.value = ''; chismeInput.value = '';
            document.getElementById('chisme-char-count').textContent = '0';
            closeModal('modal-create-post');
            AppState.currentCategory    = '';
            AppState.currentSpotifyType = '';
            selectCategory('');
            switchView('feed');
            loadFeed(); loadRankings(); loadTrends();
        } else {
            errMsg.textContent   = result.message;
            errMsg.style.display = 'block';
        }
    } catch (e) {
        errMsg.textContent   = 'Error de comunicación al publicar.';
        errMsg.style.display = 'block';
    }
}

// ==========================================
// 15. BINDING DE EVENTOS
// ==========================================

function bindEventEvents() {
    // Logo
    document.getElementById('nav-home-logo').addEventListener('click', () => {
        AppState.currentCategory    = '';
        AppState.currentSpotifyType = '';
        AppState.currentSearch      = '';
        document.getElementById('search-input').value     = '';
        document.getElementById('search-clear-btn').style.display = 'none';
        selectCategory('');
        switchView('feed');
    });

    // Navegación lateral
    document.getElementById('btn-nav-feed').addEventListener('click', () => {
        AppState.currentFilter = 'recent';
        setActiveTab('tab-recent');
        switchView('feed');
    });
    document.getElementById('btn-nav-trending').addEventListener('click', () => {
        AppState.currentFilter = 'trending';
        setActiveTab('tab-popular');
        switchView('feed');
    });
    document.getElementById('btn-nav-following').addEventListener('click', () => {
        AppState.currentFilter = 'following';
        setActiveTab('tab-following');
        switchView('feed');
    });
    document.getElementById('btn-nav-create-post').addEventListener('click', () => {
        if (!AppState.currentUser) { showToast('Debes iniciar sesión para publicar un chisme musical.', 'info'); openModal('modal-auth'); }
        else openModal('modal-create-post');
    });
    document.getElementById('btn-nav-profile').addEventListener('click', () => {
        if (AppState.currentUser) switchView('profile', AppState.currentUser.id);
    });

    // Feed tabs
    document.getElementById('tab-recent').addEventListener('click', () => { AppState.currentFilter = 'recent'; setActiveTab('tab-recent'); loadFeed(); });
    document.getElementById('tab-popular').addEventListener('click', () => { AppState.currentFilter = 'trending'; setActiveTab('tab-popular'); loadFeed(); });
    document.getElementById('tab-following').addEventListener('click', () => { AppState.currentFilter = 'following'; setActiveTab('tab-following'); loadFeed(); });

    // Filtros de formato Spotify (sidebar)
    document.querySelectorAll('.category-pill[data-spotify-type]').forEach(btn => {
        btn.addEventListener('click', () => selectSpotifyType(btn.getAttribute('data-spotify-type')));
    });

    // Filtros de categoría/género
    document.querySelectorAll('.category-pill-genre').forEach(btn => {
        btn.addEventListener('click', () => selectCategory(btn.getAttribute('data-category')));
    });

    // Buscador
    const searchInput   = document.getElementById('search-input');
    const clearSearchBtn = document.getElementById('search-clear-btn');
    searchInput.addEventListener('input', (e) => {
        const query = e.target.value.trim();
        AppState.currentSearch = query;
        clearSearchBtn.style.display = query ? 'block' : 'none';
        clearTimeout(AppState.searchTimeout);
        AppState.searchTimeout = setTimeout(() => loadFeed(), 350);
    });
    clearSearchBtn.addEventListener('click', () => {
        searchInput.value = '';
        AppState.currentSearch = '';
        clearSearchBtn.style.display = 'none';
        loadFeed();
    });

    // Cerrar modales
    document.getElementById('btn-close-modal-auth').addEventListener('click',     () => closeModal('modal-auth'));
    document.getElementById('btn-close-modal-create').addEventListener('click',   () => closeModal('modal-create-post'));
    document.getElementById('btn-close-modal-comments').addEventListener('click', () => closeModal('modal-comments'));
    document.getElementById('btn-close-modal-edit').addEventListener('click',     () => closeModal('modal-edit-profile'));

    // Auth tabs
    document.getElementById('tab-login-btn').addEventListener('click', () => {
        document.getElementById('tab-login-btn').classList.add('active');
        document.getElementById('tab-register-btn').classList.remove('active');
        document.getElementById('form-login').classList.add('active');
        document.getElementById('form-register').classList.remove('active');
    });
    document.getElementById('tab-register-btn').addEventListener('click', () => {
        document.getElementById('tab-register-btn').classList.add('active');
        document.getElementById('tab-login-btn').classList.remove('active');
        document.getElementById('form-register').classList.add('active');
        document.getElementById('form-login').classList.remove('active');
    });

    // Formularios
    document.getElementById('form-login').addEventListener('submit',         handleLoginSubmit);
    document.getElementById('form-register').addEventListener('submit',      handleRegisterSubmit);
    document.getElementById('form-create-post').addEventListener('submit',   handleCreatePostSubmit);
    document.getElementById('form-edit-profile').addEventListener('submit',  handleEditProfileSubmit);

    // Logout
    document.getElementById('profile-logout-btn').addEventListener('click', async () => {
        const res = await fetch('api.php?action=logout');
        const r   = await res.json();
        if (r.success) {
            showToast('Has cerrado sesión.', 'info');
            AppState.currentUser = null;
            clearInterval(AppState.notifInterval);
            await fetchSession();
            switchView('feed');
        }
    });

    // Contador de caracteres
    document.getElementById('post-chisme').addEventListener('input', (e) => {
        document.getElementById('chisme-char-count').textContent = e.target.value.length;
    });

    // Reproductor – Cerrar
    document.getElementById('btn-close-player').addEventListener('click', () => {
        document.getElementById('player-embed-wrapper').innerHTML = '';
        document.getElementById('floating-player').style.display  = 'none';
    });

    // Cola de reproducción – Toggle panel
    document.getElementById('btn-queue-toggle').addEventListener('click', () => {
        const panel = document.getElementById('queue-panel');
        panel.style.display = panel.style.display === 'none' ? 'flex' : 'none';
    });

    // Limpiar cola
    document.getElementById('btn-clear-queue').addEventListener('click', () => {
        AppState.playbackQueue     = [];
        AppState.currentQueueIndex = -1;
        updateQueueUI();
        showToast('Cola limpiada.', 'info');
    });

    // Limpiar errores al cerrar modales
    ['modal-auth', 'modal-create-post', 'modal-edit-profile'].forEach(id => {
        const el = document.getElementById(id);
        if (el) {
            el.addEventListener('hidden.bs.modal', () => {
                el.querySelectorAll('.error-msg').forEach(e => e.style.display = 'none');
            });
        }
    });
}

// ==========================================
// 16. HELPERS UI
// ==========================================

function setActiveTab(tabId) {
    ['tab-recent','tab-popular','tab-following'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.classList.toggle('active', el.id === tabId);
    });
}

function openModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) bootstrap.Modal.getOrCreateInstance(el).show();
}

function closeModal(modalId) {
    const el = document.getElementById(modalId);
    if (el) { const m = bootstrap.Modal.getInstance(el); if (m) m.hide(); }
}

function showToast(message, type = 'success') {
    const toastEl = document.getElementById('toast-notify');
    if (!toastEl) return;
    const body = document.getElementById('toast-body-text');
    if (body) body.textContent = message;
    toastEl.classList.remove('bg-success', 'bg-danger', 'bg-info', 'text-white');
    if (type === 'success') toastEl.classList.add('bg-success', 'text-white');
    else if (type === 'error') toastEl.classList.add('bg-danger', 'text-white');
    else toastEl.classList.add('bg-info', 'text-white');
    bootstrap.Toast.getOrCreateInstance(toastEl, { delay: 3500 }).show();
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

function formatDate(dateString) {
    if (!dateString) return '';
    const date = new Date(dateString.replace(/-/g, '/'));
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function escapeHTML(str) {
    if (!str) return '';
    return str.replace(/[&<>'"]/g, tag => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[tag] || tag));
}

function handleSharePost(title, postId) {
    const shareUrl = window.location.origin + window.location.pathname + `?post=${postId}`;
    navigator.clipboard.writeText(shareUrl)
        .then(() => showToast('¡Enlace de chisme copiado al portapapeles! 📋🔗', 'success'))
        .catch(() => showToast('No se pudo copiar el enlace automáticamente.', 'error'));
}
