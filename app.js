// ===== IMPORTS — Firebase Auth retiré =====
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, addDoc, getDocs, doc, updateDoc, onSnapshot,
  query, orderBy, serverTimestamp, where, getDoc, setDoc, increment
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// bcryptjs via CDN (hash mot de passe côté client)
import bcrypt from 'https://esm.sh/bcryptjs@2.4.3';

const firebaseConfig = { /* ... ton config ... */ };
const CLD = { cloudName: 'djxcqczh1', uploadPreset: 'database' };

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// ===== STATE =====
let currentUser = null;      // { id, ...userData }
let pendingMediaFiles = [];
let currentFilter = 'all';
let allPosts = [];
let unsubscribePosts = null;

// ===== SESSION (remplace onAuthStateChanged) =====
function saveSession(userId, userData) {
  localStorage.setItem('forum_session', JSON.stringify({ userId, userData }));
}

function loadSession() {
  try {
    const raw = localStorage.getItem('forum_session');
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function clearSession() {
  localStorage.removeItem('forum_session');
}

// ===== HELPERS =====
function generateContactKey(contact) {
  // Normalise le contact pour en faire un ID Firestore safe
  return contact.replace(/[^a-zA-Z0-9@._-]/g, '').toLowerCase();
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

// ===== TAB / AVATAR / CLOUDINARY — inchangés =====
window.switchTab = function(tab) { /* ... */ };
window.previewAvatar = function(input) { /* ... */ };

async function uploadToCloudinary(file) { /* ... */ }

// ===== REGISTER — remplace createUserWithEmailAndPassword =====
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
    const contactKey = generateContactKey(contact);
    const userRef = doc(db, 'users', contactKey);

    // Vérifier si le contact est déjà pris
    const existing = await getDoc(userRef);
    if (existing.exists()) {
      errEl.textContent = 'Ce contact est déjà utilisé.';
      errEl.style.display = 'block';
      btn.disabled = false;
      btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
      return;
    }

    // Hash du mot de passe (10 rounds)
    const passwordHash = await bcrypt.hash(password, 10);

    let avatarUrl = '';
    if (avatarFile) {
      const up = await uploadToCloudinary(avatarFile);
      avatarUrl = up.url;
    }

    const userData = {
      nom, prenom, contact, avatarUrl,
      passwordHash,           // stocké dans Firestore, jamais exposé en clair
      createdAt: serverTimestamp(),
      postsCount: 0, likesCount: 0, commentsCount: 0,
      isNew: true
    };

    await setDoc(userRef, userData);

    // Connexion directe après inscription
    const fullData = { id: contactKey, ...userData };
    currentUser = fullData;
    saveSession(contactKey, fullData);
    initApp();
    showWelcomeAI(prenom + ' ' + nom);
    showToast('Compte créé avec succès !', 'success');

  } catch (err) {
    console.error(err);
    errEl.textContent = 'Erreur lors de la création du compte.';
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte';
  }
};

// ===== LOGIN — remplace signInWithEmailAndPassword =====
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
    const contactKey = generateContactKey(contact);
    const userSnap = await getDoc(doc(db, 'users', contactKey));

    if (!userSnap.exists()) {
      throw { code: 'not-found' };
    }

    const userData = userSnap.data();

    // Vérification du mot de passe avec bcrypt
    const valid = await bcrypt.compare(password, userData.passwordHash);
    if (!valid) throw { code: 'wrong-password' };

    currentUser = { id: contactKey, ...userData };
    saveSession(contactKey, currentUser);
    initApp();

  } catch (err) {
    console.error(err);
    let msg = 'Identifiants incorrects.';
    if (err.code === 'not-found') msg = 'Aucun compte avec ce contact.';
    if (err.code === 'wrong-password') msg = 'Mot de passe incorrect.';
    errEl.textContent = msg;
    errEl.style.display = 'block';
    btn.disabled = false;
    btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
  }
};

// ===== LOGOUT — remplace signOut =====
window.handleLogout = function() {
  if (unsubscribePosts) unsubscribePosts();
  currentUser = null;
  clearSession();
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').classList.remove('show');
  // Reset boutons
  const lb = document.getElementById('login-btn');
  const rb = document.getElementById('register-btn');
  if (lb) { lb.disabled = false; lb.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter'; }
  if (rb) { rb.disabled = false; rb.innerHTML = '<i class="fas fa-user-plus"></i> Créer mon compte'; }
};

// ===== INIT AU CHARGEMENT — remplace onAuthStateChanged =====
(async function initOnLoad() {
  const session = loadSession();
  if (session) {
    // Re-fetch les données fraîches depuis Firestore
    try {
      const snap = await getDoc(doc(db, 'users', session.userId));
      if (snap.exists()) {
        currentUser = { id: session.userId, ...snap.data() };
        saveSession(session.userId, currentUser); // rafraîchit le cache
        initApp();
        if (currentUser.isNew) {
          await updateDoc(doc(db, 'users', session.userId), { isNew: false });
          showWelcomeAI(currentUser.prenom + ' ' + currentUser.nom);
        }
        return;
      }
    } catch (e) { console.error('Session invalide', e); }
    clearSession();
  }
  // Pas de session → affiche l'overlay auth
  document.getElementById('auth-overlay').style.display = 'flex';
  document.getElementById('app').classList.remove('show');
})();

// ===== INIT APP — inchangé =====
function initApp() {
  document.getElementById('auth-overlay').style.display = 'none';
  document.getElementById('app').classList.add('show');
  updateUIUser();
  loadPosts();
  loadMembers();
}

// ... le reste du code (posts, likes, commentaires, etc.) reste identique
// Remplace juste currentUser.uid par currentUser.id partout
