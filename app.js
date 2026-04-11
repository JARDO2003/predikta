// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, getDoc, setDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
  authDomain: "data-com-a94a8.firebaseapp.com",
  databaseURL: "https://data-com-a94a8-default-rtdb.firebaseio.com",
  projectId: "data-com-a94a8",
  storageBucket: "data-com-a94a8.appspot.com",
  messagingSenderId: "276904640935",
  appId: "1:276904640935:web:9cd805aeba6c34c767f682",
  measurementId: "G-FYQCWY5G4S"
};

const CLD = { cloudName: 'djxcqczh1', uploadPreset: 'database' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// bcryptjs chargé via <script> dans le HTML → disponible en global
const bcrypt = dcodeIO.bcrypt;

// ===== STATE =====
let currentUser = null;       // { id, nom, prenom, contact, avatarUrl, ... }
let pendingMediaFiles = [];
let currentFilter = 'all';
let allPosts = [];
let unsubscribePosts = null;

// ===== SESSION (localStorage) =====
function saveSession(userId) {
  localStorage.setItem('forum_uid', userId);
}

function loadSessionId() {
  return localStorage.getItem('forum_uid');
}

function clearSession() {
  localStorage.removeItem('forum_uid');
}

// ===== HELPERS =====
function contactToKey(contact) {
  // Transforme le contact en un identifiant Firestore valide
  return contact.trim().toLowerCase().replace(/[^a-z0-9@._-]/g, '_');
}

function getInitials(nom, prenom) {
  return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
}

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const diff = Math.floor((Date.now() - date) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff / 60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff / 3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff / 86400)}j`;
  return date.toLocaleDateString('fr-FR');
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function showToast(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
}

// ===== CLOUDINARY =====
async function uploadToCloudinary(file) {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('upload_preset', CLD.uploadPreset);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLD.cloudName}/auto/upload`, {
    method: 'POST', body: formData
  });
  const data = await res.json();
  if (data.secure_url) return { url: data.secure_url, type: file.type.startsWith('video') ? 'video' : 'image' };
  throw new Error('Upload Cloudinary échoué');
}

// ===== AUTH : INSCRIPTION =====
async function handleRegister() {
  const nom = document.getElementById('reg-nom').value.trim();
  const prenom = document.getElementById('reg-prenom').value.trim();
  const contact = document.getElementById('reg-contact').value.trim();
  const password = document.getElementById('reg-password').value;
  const avatarFile = document.getElementById('reg-avatar').files[0];
  const errEl = document.getElementById('register-error');
  const btn = document.getElementById('register-btn');

  errEl.style.display = 'none';

  if (!nom || !prenom || !contact || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs obligatoires.';
    errEl.style.display = 'block'; return;
  }
  if (password.length < 6) {
    errEl.textContent = 'Le mot de passe doit contenir au moins 6 caractères.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Création...';

  try {
    const uid = contactToKey(contact);
    const userRef = doc(db, 'users', uid);
    const existing = await getDoc(userRef);

    if (existing.exists()) {
      errEl.textContent = 'Ce contact est déjà utilisé.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
      return;
    }

    // Hash du mot de passe avec bcrypt (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    let avatarUrl = '';
    if (avatarFile) {
      const up = await uploadToCloudinary(avatarFile);
      avatarUrl = up.url;
    }

    await setDoc(userRef, {
      nom, prenom, contact, avatarUrl, passwordHash,
      createdAt: serverTimestamp(),
      postsCount: 0, likesCount: 0, commentsCount: 0,
      isNew: true
    });

    // Connexion directe après inscription
    const snap = await getDoc(userRef);
    currentUser = { id: uid, ...snap.data() };
    saveSession(uid);
    initApp();

    showToast('Compte créé avec succès !', 'success');
    showWelcomeAI(prenom + ' ' + nom);

  } catch (err) {
    console.error(err);
    errEl.textContent = 'Erreur lors de la création du compte.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
  }
}

// ===== AUTH : CONNEXION =====
async function handleLogin() {
  const contact = document.getElementById('login-contact').value.trim();
  const password = document.getElementById('login-password').value;
  const errEl = document.getElementById('login-error');
  const btn = document.getElementById('login-btn');

  errEl.style.display = 'none';

  if (!contact || !password) {
    errEl.textContent = 'Veuillez remplir tous les champs.';
    errEl.style.display = 'block'; return;
  }

  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connexion...';

  try {
    const uid = contactToKey(contact);
    const snap = await getDoc(doc(db, 'users', uid));

    if (!snap.exists()) {
      errEl.textContent = 'Aucun compte avec ce contact.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
      return;
    }

    const userData = snap.data();
    const valid = await bcrypt.compare(password, userData.passwordHash);

    if (!valid) {
      errEl.textContent = 'Mot de passe incorrect.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
      return;
    }

    currentUser = { id: uid, ...userData };
    saveSession(uid);
    initApp();

    if (currentUser.isNew) {
      await updateDoc(doc(db, 'users', uid), { isNew: false });
      showWelcomeAI(currentUser.prenom + ' ' + currentUser.nom);
    }

  } catch (err) {
    console.error(err);
    errEl.textContent = 'Erreur de connexion.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
  }
}

// ===== AUTH : DÉCONNEXION =====
function handleLogout() {
  if (unsubscribePosts) unsubscribePosts();
  currentUser = null;
  clearSession();
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').classList.remove('show');
  document.getElementById('login-btn').disabled = false;
  document.getElementById('login-btn').innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
  document.getElementById('register-btn').disabled = false;
  document.getElementById('register-btn').innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
  document.getElementById('login-contact').value = '';
  document.getElementById('login-password').value = '';
}

// ===== INIT AU CHARGEMENT (remplace onAuthStateChanged) =====
async function initOnLoad() {
  const uid = loadSessionId();
  if (uid) {
    try {
      const snap = await getDoc(doc(db, 'users', uid));
      if (snap.exists()) {
        currentUser = { id: uid, ...snap.data() };
        initApp();
        if (currentUser.isNew) {
          await updateDoc(doc(db, 'users', uid), { isNew: false });
          showWelcomeAI(currentUser.prenom + ' ' + currentUser.nom);
        }
        return;
      }
    } catch (e) {
      console.error('Session invalide :', e);
    }
    clearSession();
  }
  // Pas de session → affiche l'overlay auth
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').classList.remove('show');
}

// ===== INIT APP =====
function initApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').classList.add('show');
  updateUIUser();
  loadPosts();
  loadMembers();
}

function updateUIUser() {
  if (!currentUser) return;
  const { nom, prenom, contact, avatarUrl } = currentUser;
  const fullName = `${prenom} ${nom}`;
  const initials = getInitials(nom, prenom);

  // Header chip
  document.getElementById('chip-name').textContent = prenom;
  if (avatarUrl) {
    document.getElementById('chip-avatar-img').src = avatarUrl;
    document.getElementById('chip-avatar-img').style.display = 'block';
    document.getElementById('chip-avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('chip-avatar-placeholder').textContent = initials;
    document.getElementById('chip-avatar-placeholder').style.display = 'flex';
    document.getElementById('chip-avatar-img').style.display = 'none';
  }

  // Sidebar profil
  document.getElementById('profile-fullname').textContent = fullName;
  document.getElementById('profile-contact-display').textContent = contact;
  if (avatarUrl) {
    document.getElementById('profile-avatar-img').src = avatarUrl;
    document.getElementById('profile-avatar-img').style.display = 'block';
    document.getElementById('profile-avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('profile-avatar-placeholder').textContent = initials;
    document.getElementById('profile-avatar-placeholder').style.display = 'flex';
    document.getElementById('profile-avatar-img').style.display = 'none';
  }

  // Composer avatar
  if (avatarUrl) {
    document.getElementById('composer-avatar-img').src = avatarUrl;
    document.getElementById('composer-avatar-img').style.display = 'block';
    document.getElementById('composer-avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('composer-avatar-placeholder').textContent = initials;
    document.getElementById('composer-avatar-placeholder').style.display = 'flex';
    document.getElementById('composer-avatar-img').style.display = 'none';
  }

  // Stats
  document.getElementById('stat-posts').textContent = currentUser.postsCount || 0;
  document.getElementById('stat-likes').textContent = currentUser.likesCount || 0;
  document.getElementById('stat-comments').textContent = currentUser.commentsCount || 0;
}

// ===== WELCOME IA =====
function showWelcomeAI(name) {
  document.getElementById('welcome-name').textContent = name;
  document.getElementById('welcome-overlay').classList.add('show');

  const text = `Bonjour et bienvenue dans notre espace d'échange ! 🎓\n\nJe suis ravi de vous accueillir sur le Forum Science Économique & Gestion, la communauté où les passionnés d'économie, de finance et de gestion se retrouvent pour partager leurs connaissances, analyses et perspectives.\n\nIci, vous pouvez publier vos articles, poser des questions, commenter les publications des autres membres et enrichir vos compétences. Ensemble, faisons avancer la science économique ! 💼📊`;

  let i = 0;
  const el = document.getElementById('welcome-text');
  el.innerHTML = '<span class="typing-cursor"></span>';

  const type = () => {
    if (i < text.length) {
      el.innerHTML = text.slice(0, i + 1).replace(/\n/g, '<br>') + '<span class="typing-cursor"></span>';
      i++;
      setTimeout(type, 18);
    } else {
      el.innerHTML = text.replace(/\n/g, '<br>');
    }
  };
  setTimeout(type, 600);
}

// ===== AVATAR PREVIEW =====
function previewAvatar(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('avatar-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
  };
  reader.readAsDataURL(file);
}

// ===== MEDIA SELECT =====
function handleMediaSelect(input) {
  const files = Array.from(input.files);
  pendingMediaFiles = [...pendingMediaFiles, ...files].slice(0, 4);
  renderMediaPreview();
  input.value = '';
}

function renderMediaPreview() {
  const container = document.getElementById('media-preview');
  container.innerHTML = '';
  pendingMediaFiles.forEach((file, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'media-thumb';
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video')) {
      thumb.innerHTML = `<video src="${url}" muted></video>
        <button class="media-remove" data-idx="${idx}"><i class="fas fa-times"></i></button>`;
    } else {
      thumb.innerHTML = `<img src="${url}" alt=""/>
        <button class="media-remove" data-idx="${idx}"><i class="fas fa-times"></i></button>`;
    }
    container.appendChild(thumb);
  });

  // Attache les boutons de suppression
  container.querySelectorAll('.media-remove').forEach(btn => {
    btn.addEventListener('click', () => {
      pendingMediaFiles.splice(parseInt(btn.dataset.idx), 1);
      renderMediaPreview();
    });
  });
}

// ===== PUBLIER =====
async function submitPost() {
  const text = document.getElementById('post-textarea').value.trim();
  if (!text && pendingMediaFiles.length === 0) {
    showToast('Rédigez quelque chose ou ajoutez un média.', 'error'); return;
  }

  const btn = document.getElementById('submit-post');
  btn.disabled = true;
  btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Publication...';

  try {
    const mediaItems = [];
    for (const file of pendingMediaFiles) {
      const up = await uploadToCloudinary(file);
      mediaItems.push(up);
    }

    await addDoc(collection(db, 'posts'), {
      text,
      media: mediaItems,
      authorId: currentUser.id,
      authorNom: currentUser.nom,
      authorPrenom: currentUser.prenom,
      authorAvatar: currentUser.avatarUrl || '',
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'users', currentUser.id), { postsCount: increment(1) });
    currentUser.postsCount = (currentUser.postsCount || 0) + 1;
    document.getElementById('stat-posts').textContent = currentUser.postsCount;

    document.getElementById('post-textarea').value = '';
    pendingMediaFiles = [];
    renderMediaPreview();
    showToast('Publication partagée !', 'success');
  } catch (err) {
    console.error(err);
    showToast('Erreur lors de la publication.', 'error');
  }

  btn.disabled = false;
  btn.innerHTML = '<i class="fas fa-paper-plane"></i> Publier';
}

// ===== CHARGEMENT DES POSTS =====
function loadPosts() {
  const q = query(collection(db, 'posts'), orderBy('createdAt', 'desc'));
  if (unsubscribePosts) unsubscribePosts();

  unsubscribePosts = onSnapshot(q, (snap) => {
    allPosts = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    renderPosts();
  });
}

function renderPosts() {
  const container = document.getElementById('posts-container');
  let filtered = [...allPosts];

  if (currentFilter === 'mine') {
    filtered = filtered.filter(p => p.authorId === currentUser.id);
  } else if (currentFilter === 'photo') {
    filtered = filtered.filter(p => p.media && p.media.length > 0);
  } else if (currentFilter === 'liked') {
    filtered = filtered.filter(p => p.likes && p.likes.includes(currentUser.id));
  }

  const search = document.getElementById('search-input')?.value?.toLowerCase();
  if (search) {
    filtered = filtered.filter(p =>
      (p.text && p.text.toLowerCase().includes(search)) ||
      (`${p.authorPrenom} ${p.authorNom}`).toLowerCase().includes(search)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="empty-state">
        <i class="fas fa-newspaper"></i>
        <h3>Aucune publication</h3>
        <p>Soyez le premier à partager quelque chose !</p>
      </div>`;
    return;
  }

  container.innerHTML = '';
  filtered.forEach(post => container.appendChild(createPostCard(post)));

  // Badge notifications
  const newCount = allPosts.filter(p =>
    p.authorId !== currentUser.id &&
    p.createdAt &&
    (Date.now() - p.createdAt.toDate()) < 3600000
  ).length;
  document.getElementById('notif-count').textContent = newCount > 9 ? '9+' : newCount;
}

function createPostCard(post) {
  const div = document.createElement('div');
  div.className = 'post-card';
  div.id = `post-${post.id}`;

  const initials = getInitials(post.authorNom, post.authorPrenom);
  const avatarHtml = post.authorAvatar
    ? `<img src="${post.authorAvatar}" alt="" onerror="this.style.display='none';this.nextElementSibling.style.display='flex'"/>
       <div class="placeholder" style="display:none">${initials}</div>`
    : `<div class="placeholder">${initials}</div>`;

  const liked = post.likes && post.likes.includes(currentUser.id);
  const likeCount = post.likes ? post.likes.length : 0;
  const mediaHtml = buildMediaHtml(post.media || []);

  div.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${avatarHtml}</div>
      <div class="post-author-info">
        <div class="post-author">${post.authorPrenom} ${post.authorNom}</div>
        <div class="post-meta"><i class="fas fa-clock" style="font-size:11px"></i> ${timeAgo(post.createdAt)}</div>
      </div>
      ${post.authorId === currentUser.id
        ? `<button class="post-options-btn" data-delete="${post.id}"><i class="fas fa-trash-alt"></i></button>`
        : ''}
    </div>
    ${post.text ? `<div class="post-text">${escapeHtml(post.text)}</div>` : ''}
    ${mediaHtml}
    <div class="post-actions">
      <button class="action-btn ${liked ? 'liked' : ''}" id="like-btn-${post.id}" data-like="${post.id}">
        <i class="${liked ? 'fas' : 'far'} fa-heart"></i>
        <span id="like-count-${post.id}">${likeCount}</span>
      </button>
      <button class="action-btn" data-comments="${post.id}">
        <i class="far fa-comment"></i>
        <span id="comment-count-${post.id}">${post.commentsCount || 0}</span>
      </button>
      <button class="action-btn" data-share="${post.id}">
        <i class="fas fa-share-alt"></i> Partager
      </button>
    </div>
    <div class="comments-section" id="comments-${post.id}">
      <div id="comments-list-${post.id}"></div>
      <div class="comment-input-area">
        <div class="comment-avatar">
          ${currentUser.avatarUrl
            ? `<img src="${currentUser.avatarUrl}" alt=""/>`
            : `<div class="placeholder">${getInitials(currentUser.nom, currentUser.prenom)}</div>`}
        </div>
        <input type="text" placeholder="Écrire un commentaire..." id="comment-input-${post.id}"/>
        <button class="comment-send" data-comment-send="${post.id}">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>`;

  // Événements de la carte
  const deleteBtn = div.querySelector('[data-delete]');
  if (deleteBtn) deleteBtn.addEventListener('click', () => deletePost(post.id));

  div.querySelector(`[data-like="${post.id}"]`).addEventListener('click', () => toggleLike(post.id));
  div.querySelector(`[data-comments="${post.id}"]`).addEventListener('click', () => toggleComments(post.id));
  div.querySelector(`[data-share="${post.id}"]`).addEventListener('click', () => sharePost(post.id));

  const commentInput = div.querySelector(`#comment-input-${post.id}`);
  commentInput.addEventListener('keypress', e => { if (e.key === 'Enter') addComment(post.id); });
  div.querySelector(`[data-comment-send="${post.id}"]`).addEventListener('click', () => addComment(post.id));

  // Lightbox sur les images
  div.querySelectorAll('.post-media-grid img').forEach(img => {
    img.addEventListener('click', () => openLightbox(img.src));
  });

  return div;
}

function buildMediaHtml(media) {
  if (!media.length) return '';
  const cls = ['', 'one', 'two', 'three', 'three'][Math.min(media.length, 4)];
  const items = media.slice(0, 3).map(m =>
    m.type === 'video'
      ? `<video src="${m.url}" controls></video>`
      : `<img src="${m.url}" alt="" loading="lazy"/>`
  ).join('');
  return `<div class="post-media-grid ${cls}">${items}</div>`;
}

// ===== LIKE =====
async function toggleLike(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;
  const uid = currentUser.id;
  const likes = post.likes || [];
  const hasLiked = likes.includes(uid);
  const newLikes = hasLiked ? likes.filter(l => l !== uid) : [...likes, uid];

  // UI optimiste
  const btn = document.getElementById(`like-btn-${postId}`);
  const countEl = document.getElementById(`like-count-${postId}`);
  if (btn) {
    btn.classList.toggle('liked', !hasLiked);
    btn.querySelector('i').className = (!hasLiked ? 'fas' : 'far') + ' fa-heart';
  }
  if (countEl) countEl.textContent = newLikes.length;

  await updateDoc(doc(db, 'posts', postId), { likes: newLikes });
  if (!hasLiked) {
    await updateDoc(doc(db, 'users', uid), { likesCount: increment(1) });
    currentUser.likesCount = (currentUser.likesCount || 0) + 1;
    document.getElementById('stat-likes').textContent = currentUser.likesCount;
  }
}

// ===== COMMENTAIRES =====
async function toggleComments(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const isOpen = section.classList.contains('open');
  section.classList.toggle('open');
  if (!isOpen) loadComments(postId);
}

async function loadComments(postId) {
  const list = document.getElementById(`comments-list-${postId}`);
  list.innerHTML = '<div class="loading-spinner"><div class="spinner"></div></div>';
  const q = query(collection(db, 'posts', postId, 'comments'), orderBy('createdAt', 'asc'));
  const snap = await getDocs(q);
  list.innerHTML = '';
  snap.forEach(d => {
    const c = d.data();
    const initials = getInitials(c.authorNom, c.authorPrenom);
    const el = document.createElement('div');
    el.className = 'comment-item';
    el.innerHTML = `
      <div class="comment-avatar">
        ${c.authorAvatar
          ? `<img src="${c.authorAvatar}" alt=""/>`
          : `<div class="placeholder">${initials}</div>`}
      </div>
      <div class="comment-content">
        <div class="comment-author">${c.authorPrenom} ${c.authorNom}</div>
        <div class="comment-text">${escapeHtml(c.text)}</div>
      </div>`;
    list.appendChild(el);
  });
}

async function addComment(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  await addDoc(collection(db, 'posts', postId, 'comments'), {
    text,
    authorId: currentUser.id,
    authorNom: currentUser.nom,
    authorPrenom: currentUser.prenom,
    authorAvatar: currentUser.avatarUrl || '',
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
  await updateDoc(doc(db, 'users', currentUser.id), { commentsCount: increment(1) });

  const countEl = document.getElementById(`comment-count-${postId}`);
  if (countEl) countEl.textContent = parseInt(countEl.textContent || 0) + 1;
  currentUser.commentsCount = (currentUser.commentsCount || 0) + 1;
  document.getElementById('stat-comments').textContent = currentUser.commentsCount;

  loadComments(postId);
}

// ===== SUPPRIMER POST =====
async function deletePost(postId) {
  if (!confirm('Supprimer cette publication ?')) return;
  try {
    await updateDoc(doc(db, 'posts', postId), { deleted: true, text: '[Publication supprimée]', media: [] });
    showToast('Publication supprimée.', 'success');
  } catch (e) {
    showToast('Erreur lors de la suppression.', 'error');
  }
}

// ===== PARTAGER =====
function sharePost(postId) {
  const url = `${location.origin}${location.pathname}#post-${postId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('Lien copié !', 'success'));
  } else {
    showToast('Lien : ' + url);
  }
}

// ===== MEMBRES =====
async function loadMembers() {
  const widget = document.getElementById('members-widget');
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('postsCount', 'desc')));
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5);
    widget.innerHTML = '';
    members.forEach(m => {
      if (m.id === currentUser.id) return;
      const initials = getInitials(m.nom, m.prenom);
      const el = document.createElement('div');
      el.className = 'member-item';
      el.innerHTML = `
        <div class="member-avatar">
          ${m.avatarUrl
            ? `<img src="${m.avatarUrl}" alt=""/>`
            : `<div class="placeholder">${initials}</div>`}
        </div>
        <div class="member-info">
          <strong>${m.prenom} ${m.nom}</strong>
          <small>${m.postsCount || 0} publications</small>
        </div>
        <button class="member-follow">Suivre</button>`;
      el.querySelector('.member-follow').addEventListener('click', () =>
        showToast('Fonctionnalité bientôt disponible')
      );
      widget.appendChild(el);
    });
    if (widget.children.length === 0) {
      widget.innerHTML = '<p style="font-size:13px;color:var(--text2);text-align:center">Aucun autre membre pour l\'instant</p>';
    }
  } catch (e) {
    widget.innerHTML = '<p style="font-size:13px;color:var(--text2);">Impossible de charger</p>';
  }
}

// ===== LIGHTBOX =====
function openLightbox(url) {
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox').classList.add('show');
}

function closeLightbox() {
  document.getElementById('lightbox').classList.remove('show');
}

// ===== SWITCH TAB =====
function switchTab(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`form-${tab}`).classList.add('active');
}

// ===== FILTRE POSTS =====
function setFilter(filter) {
  currentFilter = filter;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelector(`[data-filter="${filter}"]`)?.classList.add('active');
  renderPosts();
}

// ===== ATTACHE TOUS LES ÉVÉNEMENTS =====
document.addEventListener('DOMContentLoaded', () => {

  // Auth tabs
  document.getElementById('tab-login').addEventListener('click', () => switchTab('login'));
  document.getElementById('tab-register').addEventListener('click', () => switchTab('register'));

  // Boutons auth
  document.getElementById('login-btn').addEventListener('click', handleLogin);
  document.getElementById('register-btn').addEventListener('click', handleRegister);

  // Enter dans les champs login
  document.getElementById('login-password').addEventListener('keypress', e => {
    if (e.key === 'Enter') handleLogin();
  });

  // Logout
  document.getElementById('logout-btn').addEventListener('click', handleLogout);

  // Avatar preview
  document.getElementById('reg-avatar').addEventListener('change', function() {
    previewAvatar(this);
  });

  // Media composer
  document.getElementById('media-input').addEventListener('change', function() {
    handleMediaSelect(this);
  });

  // Publier
  document.getElementById('submit-post').addEventListener('click', submitPost);

  // Recherche
  document.getElementById('search-input').addEventListener('input', () => renderPosts());

  // Fermer welcome
  document.getElementById('welcome-close-btn').addEventListener('click', () => {
    document.getElementById('welcome-overlay').classList.remove('show');
  });

  // Lightbox
  document.getElementById('lightbox').addEventListener('click', closeLightbox);
  document.getElementById('lightbox-close').addEventListener('click', e => {
    e.stopPropagation();
    closeLightbox();
  });

  // Navigation sidebar
  document.querySelectorAll('.nav-item[data-filter]').forEach(item => {
    item.addEventListener('click', () => {
      const filter = item.dataset.filter;
      if (filter === 'trends' || filter === 'members') {
        setFilter('all');
        if (filter === 'trends') showToast('Tendances du forum');
      } else {
        setFilter(filter);
      }
    });
  });

  // Lancer l'initialisation
  initOnLoad();
});
