import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getAuth, signInWithEmailAndPassword, signOut, onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-auth.js";
import {
  getFirestore, collection, doc, getDoc, getDocs, query, where, orderBy,
  setDoc, updateDoc, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

const firebaseConfig = {
  apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
  authDomain: "data-com-a94a8.firebaseapp.com",
  projectId: "data-com-a94a8",
  storageBucket: "data-com-a94a8.appspot.com",
  messagingSenderId: "276904640935",
  appId: "1:276904640935:web:9cd805aeba6c34c767f682"
};

const PREMIUM_MONTH_MS = 30 * 24 * 60 * 60 * 1000;
const TRIAL_MS = 12 * 60 * 60 * 1000;

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

let adminEmails = [];
let approvedSession = 0;
let allUsers = [];

async function loadAdminConfig() {
  try {
    const snap = await getDoc(doc(db, 'server_config', 'admin_settings'));
    if (snap.exists()) {
      adminEmails = (snap.data().adminEmails || []).map(e => e.toLowerCase());
    }
  } catch (e) {
    console.warn('Config admin:', e.message);
  }
  if (!adminEmails.length) {
    adminEmails = ['zinzindohouemarcio@gmail.com'];
  }
}

function isAdminEmail(email) {
  return adminEmails.includes((email || '').toLowerCase());
}

function showLogin() {
  document.getElementById('adminLogin').style.display = 'flex';
  document.getElementById('adminPanel').style.display = 'none';
}

function showPanel(user) {
  document.getElementById('adminLogin').style.display = 'none';
  document.getElementById('adminPanel').style.display = 'block';
  document.getElementById('adminUserInfo').textContent = user.email + ' · Administrateur COMEO';
}

function escapeHtml(s) {
  return String(s || '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' });
  } catch { return iso; }
}

function formatDateShort(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleDateString('fr-FR');
  } catch { return iso; }
}

function getUserSubStatus(p) {
  const now = Date.now();
  if (p.premiumUntil && new Date(p.premiumUntil).getTime() > now) {
    return { key: 'premium', label: 'Premium', cls: 'badge-premium', expires: p.premiumUntil };
  }
  if (p.subscriptionStatus === 'pending_payment') {
    return { key: 'pending', label: 'Paiement en attente', cls: 'badge-pending', expires: null };
  }
  if (p.trialEndsAt && new Date(p.trialEndsAt).getTime() > now) {
    return { key: 'trial', label: 'Essai 12 h', cls: 'badge-trial', expires: p.trialEndsAt };
  }
  return { key: 'expired', label: 'Expiré', cls: 'badge-expired', expires: p.trialEndsAt || null };
}

function statusBadgeHtml(status) {
  return `<span class="admin-badge ${status.cls}">${escapeHtml(status.label)}</span>`;
}

function paymentStatusBadge(status) {
  const map = {
    pending: ['En attente', 'badge-pending'],
    approved: ['Validé', 'badge-premium'],
    rejected: ['Refusé', 'badge-expired']
  };
  const [label, cls] = map[status] || [status || '—', 'badge-expired'];
  return `<span class="admin-badge ${cls}">${label}</span>`;
}

function adminSwitchTab(tab) {
  document.querySelectorAll('.admin-tab').forEach(t => t.classList.toggle('active', t.dataset.tab === tab));
  document.getElementById('tabPayments').style.display = tab === 'payments' ? 'block' : 'none';
  document.getElementById('tabUsers').style.display = tab === 'users' ? 'block' : 'none';
}

async function activateUserPremium(uid, requestId, btn) {
  if (!uid) return;
  if (!confirm('Activer Premium 30 jours pour cet utilisateur ?')) return;
  if (btn) { btn.disabled = true; btn.textContent = 'Activation…'; }
  try {
    const premiumUntil = new Date(Date.now() + PREMIUM_MONTH_MS).toISOString();
    await setDoc(doc(db, 'profiles', uid), {
      premiumUntil,
      subscriptionStatus: 'active',
      lastActivationAt: new Date().toISOString(),
      activationMethod: 'admin_manual',
      activatedBy: auth.currentUser?.email || 'admin'
    }, { merge: true });
    if (requestId) {
      await updateDoc(doc(db, 'payment_requests', requestId), {
        status: 'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: auth.currentUser?.email || 'admin'
      });
    }
    approvedSession++;
    document.getElementById('statApproved').textContent = approvedSession;
    await adminRefreshAll();
    alert('✅ Abonnement Premium activé pour 30 jours.');
  } catch (e) {
    alert('Erreur : ' + e.message + '\n\nVérifiez les règles Firestore (isAdmin + lecture profiles).');
    if (btn) { btn.disabled = false; btn.textContent = '✅ Activer 30 jours'; }
  }
}

async function rejectPayment(requestId, btn) {
  if (!confirm('Refuser cette demande ?')) return;
  if (btn) btn.disabled = true;
  try {
    await updateDoc(doc(db, 'payment_requests', requestId), {
      status: 'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: auth.currentUser?.email || 'admin'
    });
    await adminRefreshPayments();
  } catch (e) {
    alert('Erreur : ' + e.message);
    if (btn) btn.disabled = false;
  }
}

async function adminRefreshPayments() {
  const listEl = document.getElementById('paymentsList');
  const loading = document.getElementById('paymentsLoading');
  const empty = document.getElementById('paymentsEmpty');
  const histBody = document.getElementById('paymentsHistoryBody');
  if (!listEl) return;

  loading.style.display = 'block';
  empty.style.display = 'none';
  listEl.innerHTML = '';

  try {
    const pendingQ = query(
      collection(db, 'payment_requests'),
      where('status', '==', 'pending'),
      orderBy('createdAt', 'desc')
    );
    const pendingSnap = await getDocs(pendingQ);
    loading.style.display = 'none';
    document.getElementById('statPending').textContent = pendingSnap.size;

    if (pendingSnap.empty) {
      empty.style.display = 'block';
    } else {
      pendingSnap.forEach(d => {
        const r = d.data();
        const card = document.createElement('div');
        card.className = 'admin-request-card';
        card.innerHTML = `
          <div class="admin-request-head">
            <strong>${escapeHtml(r.payerName || '—')}</strong>
            <span class="admin-request-date">${formatDate(r.createdAt)}</span>
          </div>
          <div class="admin-request-grid">
            <div><span>Entreprise</span>${escapeHtml(r.company || '—')}</div>
            <div><span>Email</span>${escapeHtml(r.email || '—')}</div>
            <div><span>N° Wave</span><strong class="admin-wave-num">${escapeHtml(r.waveNumber || '—')}</strong></div>
            <div><span>Montant</span>${escapeHtml(String(r.amount || 15000))} FCFA</div>
          </div>
          <div class="admin-request-actions">
            <button type="button" class="admin-btn-activate" data-id="${d.id}" data-uid="${escapeHtml(r.uid)}">✅ Activer Premium (30 jours)</button>
            <button type="button" class="admin-btn-reject" data-id="${d.id}">✕ Refuser</button>
          </div>`;
        listEl.appendChild(card);
      });
      listEl.querySelectorAll('.admin-btn-activate').forEach(btn => {
        btn.addEventListener('click', () => activateUserPremium(btn.dataset.uid, btn.dataset.id, btn));
      });
      listEl.querySelectorAll('.admin-btn-reject').forEach(btn => {
        btn.addEventListener('click', () => rejectPayment(btn.dataset.id, btn));
      });
    }

    const histQ = query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(50));
    const histSnap = await getDocs(histQ);
    if (histSnap.empty) {
      histBody.innerHTML = '<tr><td colspan="7" class="admin-td-muted">Aucun paiement enregistré</td></tr>';
    } else {
      histBody.innerHTML = histSnap.docs.map(d => {
        const r = d.data();
        return `<tr>
          <td>${formatDate(r.createdAt)}</td>
          <td>${escapeHtml(r.payerName)}</td>
          <td class="admin-wave-num">${escapeHtml(r.waveNumber)}</td>
          <td>${escapeHtml(r.company)}</td>
          <td>${escapeHtml(r.email)}</td>
          <td>${escapeHtml(String(r.amount || 15000))} F</td>
          <td>${paymentStatusBadge(r.status)}</td>
        </tr>`;
      }).join('');
    }
  } catch (e) {
    loading.style.display = 'none';
    listEl.innerHTML = `<div class="admin-error">Erreur paiements : ${escapeHtml(e.message)}<br><small>Créez l'index Firestore payment_requests (status + createdAt).</small></div>`;
    histBody.innerHTML = `<tr><td colspan="7" class="admin-td-muted">${escapeHtml(e.message)}</td></tr>`;
  }
}

async function adminRefreshUsers() {
  const tbody = document.getElementById('usersTableBody');
  const loading = document.getElementById('usersLoading');
  loading.style.display = 'block';

  try {
    const snap = await getDocs(collection(db, 'profiles'));
    allUsers = snap.docs.map(d => ({ id: d.id, ...d.data() }));
    allUsers.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    const now = Date.now();
    const premiumCount = allUsers.filter(u => u.premiumUntil && new Date(u.premiumUntil).getTime() > now).length;
    document.getElementById('statUsers').textContent = allUsers.length;
    document.getElementById('statPremium').textContent = premiumCount;

    loading.style.display = 'none';
    adminFilterUsers();
  } catch (e) {
    loading.style.display = 'none';
    tbody.innerHTML = `<tr><td colspan="6" class="admin-td-muted">Erreur : ${escapeHtml(e.message)}<br><small>Autorisez la lecture profiles pour isAdmin() dans firestore.rules.</small></td></tr>`;
  }
}

function adminFilterUsers() {
  const tbody = document.getElementById('usersTableBody');
  const search = (document.getElementById('userSearch')?.value || '').toLowerCase();
  const filter = document.getElementById('userFilterStatus')?.value || 'all';

  let list = allUsers.filter(u => {
    const hay = `${u.company || ''} ${u.email || ''} ${u.id || ''}`.toLowerCase();
    if (search && !hay.includes(search)) return false;
    if (filter === 'all') return true;
    return getUserSubStatus(u).key === filter;
  });

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="admin-td-muted">Aucun utilisateur trouvé</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(u => {
    const st = getUserSubStatus(u);
    const expires = st.expires ? formatDateShort(st.expires) : '—';
    const isPremium = st.key === 'premium';
    return `<tr>
      <td><strong>${escapeHtml(u.company || '—')}</strong></td>
      <td>${escapeHtml(u.email || '—')}</td>
      <td>${formatDateShort(u.createdAt)}</td>
      <td>${statusBadgeHtml(st)}</td>
      <td>${expires}</td>
      <td class="admin-td-actions">
        ${isPremium
          ? `<span class="admin-td-muted">Actif</span>`
          : `<button type="button" class="admin-btn-activate admin-btn-sm" data-uid="${escapeHtml(u.id)}">✅ Activer 30 jours</button>`}
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('.admin-btn-activate').forEach(btn => {
    btn.addEventListener('click', () => activateUserPremium(btn.dataset.uid, null, btn));
  });
}

async function adminRefreshAll() {
  await Promise.all([adminRefreshPayments(), adminRefreshUsers()]);
}

async function adminDoLogin() {
  const email = document.getElementById('admin-email').value.trim();
  const pass = document.getElementById('admin-pass').value;
  const errEl = document.getElementById('admin-login-err');
  errEl.classList.remove('show');
  if (!email || !pass) {
    errEl.textContent = 'Email et mot de passe requis.';
    errEl.classList.add('show');
    return;
  }
  try {
    await signInWithEmailAndPassword(auth, email, pass);
  } catch (e) {
    errEl.textContent = e.message || 'Connexion impossible.';
    errEl.classList.add('show');
  }
}

async function adminDoLogout() {
  await signOut(auth);
  showLogin();
}

window.adminDoLogin = adminDoLogin;
window.adminDoLogout = adminDoLogout;
window.adminRefreshAll = adminRefreshAll;
window.adminSwitchTab = adminSwitchTab;
window.adminFilterUsers = adminFilterUsers;

(async function initAdmin() {
  await loadAdminConfig();
  onAuthStateChanged(auth, async (user) => {
    if (!user) { showLogin(); return; }
    if (!isAdminEmail(user.email)) {
      await signOut(auth);
      const errEl = document.getElementById('admin-login-err');
      errEl.textContent = 'Accès refusé. Email non autorisé comme administrateur.';
      errEl.classList.add('show');
      showLogin();
      return;
    }
    showPanel(user);
    await adminRefreshAll();
  });
})();
