// ===== FIREBASE CONFIG =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, where, getDoc, setDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";
import {
  getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword,
  signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";

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
const auth = getAuth(app);

// ===== STATE =====
let currentUser = null;
let currentUserData = null;
let pendingMediaFiles = [];
let currentFilter = 'all';
let allPosts = [];
let unsubscribePosts = null;

// ===== HELPERS =====
function generateEmailFromContact(contact) {
  if (contact.includes('@')) return contact;
  const clean = contact.replace(/[^0-9]/g, '');
  return `${clean}@forum-seg.app`;
}

function getInitials(nom, prenom) {
  return ((prenom?.[0] || '') + (nom?.[0] || '')).toUpperCase() || '?';
}

function timeAgo(ts) {
  if (!ts) return '';
  const date = ts.toDate ? ts.toDate() : new Date(ts);
  const now = new Date();
  const diff = Math.floor((now - date) / 1000);
  if (diff < 60) return 'À l\'instant';
  if (diff < 3600) return `Il y a ${Math.floor(diff/60)} min`;
  if (diff < 86400) return `Il y a ${Math.floor(diff/3600)}h`;
  if (diff < 604800) return `Il y a ${Math.floor(diff/86400)}j`;
  return date.toLocaleDateString('fr-FR');
}

// ===== TAB SWITCH =====
window.switchTab = function(tab) {
  document.querySelectorAll('.auth-tab').forEach(t => t.classList.remove('active'));
  document.querySelectorAll('.auth-form').forEach(f => f.classList.remove('active'));
  document.getElementById(`tab-${tab}`).classList.add('active');
  document.getElementById(`form-${tab}`).classList.add('active');
};

// ===== AVATAR PREVIEW =====
window.previewAvatar = function(input) {
  const file = input.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = e => {
    const preview = document.getElementById('avatar-preview');
    preview.innerHTML = `<img src="${e.target.result}" alt="preview"/>`;
  };
  reader.readAsDataURL(file);
};

// ===== CLOUDINARY UPLOAD =====
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

// ===== REGISTER =====
window.handleRegister = async function() {
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
    const email = generateEmailFromContact(contact);
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const uid = cred.user.uid;

    let avatarUrl = '';
    if (avatarFile) {
      const up = await uploadToCloudinary(avatarFile);
      avatarUrl = up.url;
    }

    await setDoc(doc(db, 'users', uid), {
      nom, prenom, contact, avatarUrl,
      createdAt: serverTimestamp(),
      postsCount: 0, likesCount: 0, commentsCount: 0,
      isNew: true
    });

    showToast('Compte créé avec succès !', 'success');
  } catch (err) {
    console.error(err);
    let msg = 'Erreur lors de la création du compte.';
    if (err.code === 'auth/email-already-in-use') msg = 'Ce contact est déjà utilisé.';
    errEl.textContent = msg;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
  }
};

// ===== LOGIN =====
window.handleLogin = async function() {
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
    const email = generateEmailFromContact(contact);
    await signInWithEmailAndPassword(auth, email, password);
  } catch (err) {
    console.error(err);
    let msg = 'Identifiants incorrects.';
    if (err.code === 'auth/user-not-found') msg = 'Aucun compte avec ce contact.';
    if (err.code === 'auth/wrong-password') msg = 'Mot de passe incorrect.';
    errEl.textContent = msg;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
  }
};

// ===== LOGOUT =====
window.handleLogout = async function() {
  if (unsubscribePosts) unsubscribePosts();
  await signOut(auth);
};

// ===== AUTH STATE =====
onAuthStateChanged(auth, async (user) => {
  if (user) {
    currentUser = user;
    const userSnap = await getDoc(doc(db, 'users', user.uid));
    if (userSnap.exists()) {
      currentUserData = { id: user.uid, ...userSnap.data() };
      initApp();

      // Show welcome for new users
      if (currentUserData.isNew) {
        await updateDoc(doc(db, 'users', user.uid), { isNew: false });
        showWelcomeAI(currentUserData.prenom + ' ' + currentUserData.nom);
      }
    }
  } else {
    currentUser = null;
    currentUserData = null;
    document.getElementById('auth-overlay').style.display = 'flex';
    document.getElementById('app').classList.remove('show');
    // Reset buttons
    const lb = document.getElementById('login-btn');
    const rb = document.getElementById('register-btn');
    if (lb) { lb.disabled = false; lb.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter'; }
    if (rb) { rb.disabled = false; rb.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte'; }
  }
});

// ===== INIT APP =====
function initApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').classList.add('show');
  updateUIUser();
  loadPosts();
  loadMembers();
}

function updateUIUser() {
  if (!currentUserData) return;
  const { nom, prenom, contact, avatarUrl } = currentUserData;
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
  }

  // Sidebar profile
  document.getElementById('profile-fullname').textContent = fullName;
  document.getElementById('profile-contact-display').textContent = contact;
  if (avatarUrl) {
    document.getElementById('profile-avatar-img').src = avatarUrl;
    document.getElementById('profile-avatar-img').style.display = 'block';
    document.getElementById('profile-avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('profile-avatar-placeholder').textContent = initials;
    document.getElementById('profile-avatar-placeholder').style.display = 'flex';
  }

  // Composer avatar
  if (avatarUrl) {
    document.getElementById('composer-avatar-img').src = avatarUrl;
    document.getElementById('composer-avatar-img').style.display = 'block';
    document.getElementById('composer-avatar-placeholder').style.display = 'none';
  } else {
    document.getElementById('composer-avatar-placeholder').textContent = initials;
    document.getElementById('composer-avatar-placeholder').style.display = 'flex';
  }

  // Stats
  document.getElementById('stat-posts').textContent = currentUserData.postsCount || 0;
  document.getElementById('stat-likes').textContent = currentUserData.likesCount || 0;
  document.getElementById('stat-comments').textContent = currentUserData.commentsCount || 0;
}

// ===== WELCOME AI =====
window.showWelcomeAI = function(name) {
  document.getElementById('welcome-name').textContent = name;
  document.getElementById('welcome-overlay').classList.add('show');

  const messages = [
    `Bonjour et bienvenue dans notre espace d'échange ! 🎓\n\nJe suis ravi de vous accueillir sur le Forum Science Économique & Gestion, la communauté où les passionnés d'économie, de finance et de gestion se retrouvent pour partager leurs connaissances, analyses et perspectives.\n\nIci, vous pouvez publier vos articles, poser des questions, commenter les publications des autres membres et enrichir vos compétences. Ensemble, faisons avancer la science économique ! 💼📊`
  ];

  const text = messages[0];
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
};

window.closeWelcome = function() {
  document.getElementById('welcome-overlay').classList.remove('show');
};

// ===== MEDIA SELECT =====
window.handleMediaSelect = function(input) {
  const files = Array.from(input.files);
  pendingMediaFiles = [...pendingMediaFiles, ...files].slice(0, 4);
  renderMediaPreview();
  input.value = '';
};

function renderMediaPreview() {
  const container = document.getElementById('media-preview');
  container.innerHTML = '';
  pendingMediaFiles.forEach((file, idx) => {
    const thumb = document.createElement('div');
    thumb.className = 'media-thumb';
    const url = URL.createObjectURL(file);
    if (file.type.startsWith('video')) {
      thumb.innerHTML = `<video src="${url}" muted></video>
        <button class="media-remove" onclick="removeMedia(${idx})"><i class="fas fa-times"></i></button>`;
    } else {
      thumb.innerHTML = `<img src="${url}" alt=""/>
        <button class="media-remove" onclick="removeMedia(${idx})"><i class="fas fa-times"></i></button>`;
    }
    container.appendChild(thumb);
  });
}

window.removeMedia = function(idx) {
  pendingMediaFiles.splice(idx, 1);
  renderMediaPreview();
};

// ===== SUBMIT POST =====
window.submitPost = async function() {
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
      authorId: currentUser.uid,
      authorNom: currentUserData.nom,
      authorPrenom: currentUserData.prenom,
      authorAvatar: currentUserData.avatarUrl || '',
      likes: [],
      commentsCount: 0,
      createdAt: serverTimestamp()
    });

    await updateDoc(doc(db, 'users', currentUser.uid), { postsCount: increment(1) });
    currentUserData.postsCount = (currentUserData.postsCount || 0) + 1;
    document.getElementById('stat-posts').textContent = currentUserData.postsCount;

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
};

// ===== LOAD POSTS =====
function loadPosts() {
  const container = document.getElementById('posts-container');
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
    filtered = filtered.filter(p => p.authorId === currentUser.uid);
  } else if (currentFilter === 'photo') {
    filtered = filtered.filter(p => p.media && p.media.length > 0);
  } else if (currentFilter === 'liked') {
    filtered = filtered.filter(p => p.likes && p.likes.includes(currentUser.uid));
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
  filtered.forEach(post => {
    container.appendChild(createPostCard(post));
  });

  // Update notif badge
  const newCount = allPosts.filter(p =>
    p.authorId !== currentUser.uid &&
    p.createdAt &&
    (new Date() - p.createdAt.toDate()) < 3600000
  ).length;
  document.getElementById('notif-count').textContent = newCount > 9 ? '9+' : newCount;
}

function createPostCard(post) {
  const div = document.createElement('div');
  div.className = 'post-card';
  div.id = `post-${post.id}`;

  const initials = getInitials(post.authorNom, post.authorPrenom);
  const avatarHtml = post.authorAvatar
    ? `<img src="${post.authorAvatar}" alt="" onerror="this.style.display='none';this.nextSibling.style.display='flex'"/>
       <div class="placeholder" style="display:none">${initials}</div>`
    : `<div class="placeholder">${initials}</div>`;

  const liked = post.likes && post.likes.includes(currentUser.uid);
  const likeCount = post.likes ? post.likes.length : 0;

  const mediaHtml = buildMediaHtml(post.media || []);

  div.innerHTML = `
    <div class="post-header">
      <div class="post-avatar">${avatarHtml}</div>
      <div class="post-author-info">
        <div class="post-author">${post.authorPrenom} ${post.authorNom}</div>
        <div class="post-meta"><i class="fas fa-clock" style="font-size:11px"></i> ${timeAgo(post.createdAt)}</div>
      </div>
      ${post.authorId === currentUser.uid ? `<button class="post-options-btn" onclick="deletePost('${post.id}')"><i class="fas fa-trash-alt"></i></button>` : ''}
    </div>
    ${post.text ? `<div class="post-text">${escapeHtml(post.text)}</div>` : ''}
    ${mediaHtml}
    <div class="post-actions">
      <button class="action-btn ${liked ? 'liked' : ''}" id="like-btn-${post.id}" onclick="toggleLike('${post.id}')">
        <i class="${liked ? 'fas' : 'far'} fa-heart"></i> <span id="like-count-${post.id}">${likeCount}</span>
      </button>
      <button class="action-btn" onclick="toggleComments('${post.id}')">
        <i class="far fa-comment"></i> <span id="comment-count-${post.id}">${post.commentsCount || 0}</span>
      </button>
      <button class="action-btn" onclick="sharePost('${post.id}')">
        <i class="fas fa-share-alt"></i> Partager
      </button>
    </div>
    <div class="comments-section" id="comments-${post.id}">
      <div id="comments-list-${post.id}"></div>
      <div class="comment-input-area">
        <div class="comment-avatar">
          ${currentUserData.avatarUrl
            ? `<img src="${currentUserData.avatarUrl}" alt=""/>`
            : `<div class="placeholder">${getInitials(currentUserData.nom, currentUserData.prenom)}</div>`}
        </div>
        <input type="text" placeholder="Écrire un commentaire..." id="comment-input-${post.id}"
          onkeypress="if(event.key==='Enter') addComment('${post.id}')"/>
        <button class="comment-send" onclick="addComment('${post.id}')">
          <i class="fas fa-paper-plane"></i>
        </button>
      </div>
    </div>`;

  return div;
}

function buildMediaHtml(media) {
  if (!media.length) return '';
  const cls = ['', 'one', 'two', 'three', 'three'][Math.min(media.length, 4)];
  const items = media.slice(0, 3).map(m => {
    if (m.type === 'video') {
      return `<video src="${m.url}" controls></video>`;
    }
    return `<img src="${m.url}" alt="" loading="lazy" onclick="openLightbox('${m.url}')"/>`;
  }).join('');
  return `<div class="post-media-grid ${cls}">${items}</div>`;
}

function escapeHtml(text) {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// ===== LIKE =====
window.toggleLike = async function(postId) {
  const post = allPosts.find(p => p.id === postId);
  if (!post) return;
  const uid = currentUser.uid;
  const likes = post.likes || [];
  const hasLiked = likes.includes(uid);
  const newLikes = hasLiked ? likes.filter(l => l !== uid) : [...likes, uid];

  // Optimistic UI
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
    currentUserData.likesCount = (currentUserData.likesCount || 0) + 1;
    document.getElementById('stat-likes').textContent = currentUserData.likesCount;
  }
};

// ===== COMMENTS =====
window.toggleComments = async function(postId) {
  const section = document.getElementById(`comments-${postId}`);
  const isOpen = section.classList.contains('open');
  section.classList.toggle('open');
  if (!isOpen) loadComments(postId);
};

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

window.addComment = async function(postId) {
  const input = document.getElementById(`comment-input-${postId}`);
  const text = input.value.trim();
  if (!text) return;
  input.value = '';

  await addDoc(collection(db, 'posts', postId, 'comments'), {
    text,
    authorId: currentUser.uid,
    authorNom: currentUserData.nom,
    authorPrenom: currentUserData.prenom,
    authorAvatar: currentUserData.avatarUrl || '',
    createdAt: serverTimestamp()
  });

  await updateDoc(doc(db, 'posts', postId), { commentsCount: increment(1) });
  await updateDoc(doc(db, 'users', currentUser.uid), { commentsCount: increment(1) });

  const el = document.getElementById(`comment-count-${postId}`);
  if (el) el.textContent = parseInt(el.textContent || 0) + 1;
  currentUserData.commentsCount = (currentUserData.commentsCount || 0) + 1;
  document.getElementById('stat-comments').textContent = currentUserData.commentsCount;

  loadComments(postId);
};

// ===== DELETE POST =====
window.deletePost = async function(postId) {
  if (!confirm('Supprimer cette publication ?')) return;
  try {
    await updateDoc(doc(db, 'posts', postId), { deleted: true, text: '[Publication supprimée]', media: [] });
    showToast('Publication supprimée.', 'success');
  } catch (e) {
    showToast('Erreur lors de la suppression.', 'error');
  }
};

// ===== SHARE =====
window.sharePost = function(postId) {
  const url = `${location.origin}${location.pathname}#post-${postId}`;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).then(() => showToast('Lien copié !', 'success'));
  } else {
    showToast('Lien : ' + url);
  }
};

// ===== FILTER =====
window.setFilter = function(filter) {
  currentFilter = filter;
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  event.currentTarget.classList.add('active');
  renderPosts();
};

window.filterPosts = function(val) {
  renderPosts();
};

window.showTrends = function() { setFilter('all'); showToast('Tendances du forum'); };
window.showMembers = function() { setFilter('all'); };

// ===== MEMBERS =====
async function loadMembers() {
  const widget = document.getElementById('members-widget');
  try {
    const snap = await getDocs(query(collection(db, 'users'), orderBy('postsCount', 'desc')));
    const members = snap.docs.map(d => ({ id: d.id, ...d.data() })).slice(0, 5);
    widget.innerHTML = '';
    members.forEach(m => {
      if (m.id === currentUser.uid) return;
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
        <button class="member-follow" onclick="showToast('Fonctionnalité bientôt disponible')">Suivre</button>`;
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
window.openLightbox = function(url) {
  document.getElementById('lightbox-img').src = url;
  document.getElementById('lightbox').classList.add('show');
};

window.closeLightbox = function() {
  document.getElementById('lightbox').classList.remove('show');
};

// ===== TOAST =====
window.showToast = function(msg, type = '') {
  const container = document.getElementById('toast-container');
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = msg;
  container.appendChild(toast);
  setTimeout(() => toast.remove(), 3500);
};