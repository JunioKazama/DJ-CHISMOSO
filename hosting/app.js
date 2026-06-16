const AppState = {
    currentUser: null,
    currentCategory: '',
    currentSearch: '',
    currentFilter: 'recent',
    currentView: 'feed',
    selectedProfileId: null,
    searchTimeout: null
};

document.addEventListener('DOMContentLoaded', () => {
    AppInit();
});

function AppInit() {
    fetchSession();
    loadFeed();
    loadRankings();
    loadTrends();
    bindEventEvents();
}

async function fetchSession() {
    try {
        const response = await fetch('api.php?action=get_session');
        const result = await response.json();
        
        if (result.success && result.data) {
            AppState.currentUser = result.data;
            renderUserHeader(result.data);
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

function switchView(viewName, targetId = null) {
    const views = document.querySelectorAll('.app-view');
    views.forEach(v => v.classList.remove('active'));
    
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
        if (targetId && AppState.currentUser && parseInt(targetId) === parseInt(AppState.currentUser.id)) {
            document.getElementById('btn-nav-profile').classList.add('active');
        }
        AppState.selectedProfileId = targetId;
        loadProfileData(targetId);
    }
    
    document.querySelector('.content-area').scrollTop = 0;
}

async function loadFeed() {
    const postsContainer = document.getElementById('posts-container');
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

function renderPostCard(post) {
    const card = document.createElement('article');
    card.className = 'post-card';
    card.id = `post-${post.id}`;

    const userAvatar = post.user_avatar || '🎧';
    
    let followBtnHtml = '';
    if (AppState.currentUser && parseInt(post.user_id) !== parseInt(AppState.currentUser.id)) {
        followBtnHtml = `<button class="follow-badge-btn" onclick="handleQuickFollow(event, ${post.user_id})">+ Seguir</button>`;
    }

    let musicCardHtml = '';
    const iconType = post.spotify_type === 'playlist' ? 'fa-music' : (post.spotify_type === 'album' ? 'fa-record-vinyl' : 'fa-compact-disc');
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
            if (AppState.currentView === 'profile' && parseInt(AppState.selectedProfileId) === parseInt(targetUserId)) {
                loadProfileData(targetUserId);
            }
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
        const postResponse = await fetch(`api.php?action=get_posts`);
        const postResult = await postResponse.json();
        
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
                if (e.key === 'Enter') {
                    submitComment(postId);
                }
            });
        } else {
            formArea.innerHTML = `
                <div style="text-align: center; width:100%; color: var(--text-muted); font-size: 0.85rem; padding: 10px;">
                    Debes <span class="setup-link" style="cursor:pointer;" onclick="openModal('modal-auth')">iniciar sesión</span> para unirte al chisme musical.
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
            loadCommentsForPost(postId);
            loadFeed();
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

async function loadProfileData(userId) {
    try {
        const response = await fetch(`api.php?action=get_profile&user_id=${userId}`);
        const result = await response.json();

        if (result.success && result.data) {
            const profile = result.data;
            const user = profile.user;

            document.getElementById('profile-avatar').textContent = user.avatar || '🎧';
            document.getElementById('profile-username').textContent = user.username;
            document.getElementById('profile-joined').textContent = `Miembro desde: ${formatDate(user.created_at)}`;
            document.getElementById('profile-bio').textContent = user.bio || 'Este usuario es un DJ silencioso sin biografía.';
            
            document.getElementById('profile-followers-count').textContent = profile.followers_count;
            document.getElementById('profile-following-count').textContent = profile.following_count;
            document.getElementById('profile-posts-user').textContent = user.username;

            const followBtn = document.getElementById('profile-follow-btn');
            const logoutBtn = document.getElementById('profile-logout-btn');

            if (AppState.currentUser && parseInt(AppState.currentUser.id) === parseInt(user.id)) {
                followBtn.style.display = 'none';
                logoutBtn.style.display = 'inline-flex';
            } else {
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

function playMusic(spotifyId, type, title, category) {
    const playerBar = document.getElementById('floating-player');
    const embedWrapper = document.getElementById('player-embed-wrapper');
    const waves = document.getElementById('audio-waves-visualizer');
    
    document.getElementById('player-title').textContent = title;
    document.getElementById('player-category').textContent = `#${category}`;
    
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

    playerBar.style.display = 'flex';
    waves.style.display = 'flex';
    
    showToast(`Reproduciendo chisme de canal #${category} 🎧`, 'info');
}

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
                    selectCategory(trend.name);
                });
                container.appendChild(btn);
            });
        }
    } catch (error) {
        console.error('Error al cargar tendencias:', error);
    }
}

function selectCategory(categoryName) {
    AppState.currentCategory = categoryName;

    const pills = document.querySelectorAll('.category-pill');
    pills.forEach(pill => {
        if (pill.getAttribute('data-category') === categoryName) {
            pill.classList.add('active');
        } else {
            pill.classList.remove('active');
        }
    });

    const feedTitle = document.getElementById('feed-title');
    feedTitle.textContent = categoryName ? `Canal #${categoryName}` : 'Explorar Chismes';

    if (AppState.currentView !== 'feed') {
        switchView('feed');
    } else {
        loadFeed();
    }
}

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
            
            spotifyUrlInput.value = '';
            titleInput.value = '';
            chismeInput.value = '';
            document.getElementById('chisme-char-count').textContent = '0';
            
            closeModal('modal-create-post');
            
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

function bindEventEvents() {
    document.getElementById('nav-home-logo').addEventListener('click', () => {
        AppState.currentCategory = '';
        AppState.currentSearch = '';
        document.getElementById('search-input').value = '';
        document.getElementById('search-clear-btn').style.display = 'none';
        selectCategory('');
        switchView('feed');
    });

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

    const categoryButtons = document.querySelectorAll('.category-pill');
    categoryButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const cat = e.currentTarget.getAttribute('data-category');
            selectCategory(cat);
        });
    });

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

    document.getElementById('btn-close-modal-auth').addEventListener('click', () => closeModal('modal-auth'));
    document.getElementById('btn-close-modal-create').addEventListener('click', () => closeModal('modal-create-post'));
    document.getElementById('btn-close-modal-comments').addEventListener('click', () => closeModal('modal-comments'));

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

    document.getElementById('form-login').addEventListener('submit', handleLoginSubmit);
    document.getElementById('form-register').addEventListener('submit', handleRegisterSubmit);
    document.getElementById('form-create-post').addEventListener('submit', handleCreatePostSubmit);

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

    const chismeTextarea = document.getElementById('post-chisme');
    chismeTextarea.addEventListener('input', (e) => {
        const len = e.target.value.length;
        document.getElementById('chisme-char-count').textContent = len;
    });

    document.getElementById('btn-close-player').addEventListener('click', () => {
        const playerBar = document.getElementById('floating-player');
        const embedWrapper = document.getElementById('player-embed-wrapper');
        embedWrapper.innerHTML = '';
        playerBar.style.display = 'none';
    });

    const overlays = document.querySelectorAll('.modal-overlay');
    overlays.forEach(overlay => {
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                closeModal(overlay.id);
            }
        });
    });
}

function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
    if (modalId === 'modal-auth') {
        document.getElementById('auth-error-msg').style.display = 'none';
    }
    if (modalId === 'modal-create-post') {
        document.getElementById('post-error-msg').style.display = 'none';
    }
}

function showToast(message, type = 'success') {
    const toast = document.getElementById('toast-notify');
    toast.textContent = message;
    toast.className = 'toast-notification';
    toast.classList.add(type);
    toast.classList.add('active');
    
    setTimeout(() => {
        toast.classList.remove('active');
    }, 3500);
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
    const date = new Date(dateString.replace(/-/g, "/"));
    const options = { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' };
    return date.toLocaleDateString('es-ES', options);
}

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
    navigator.clipboard.writeText(shareUrl).then(() => {
        showToast('¡Enlace de chisme copiado al portapapeles! 📋🔗', 'success');
    }).catch(err => {
        console.error('Error al copiar enlace:', err);
        showToast('No se pudo copiar el enlace automáticamente.', 'error');
    });
}
