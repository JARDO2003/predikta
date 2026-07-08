import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.0/firebase-app.js";
import {
  getFirestore, collection, doc, getDocs, query,
  orderBy, setDoc, updateDoc, limit
} from "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js";

// ══════════════════════════════════════════
// CONFIG FIREBASE
// ══════════════════════════════════════════
const firebaseConfig = {
  apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
  authDomain: "data-com-a94a8.firebaseapp.com",
  projectId: "data-com-a94a8",
  storageBucket: "data-com-a94a8.appspot.com",
  messagingSenderId: "276904640935",
  appId: "1:276904640935:web:9cd805aeba6c34c767f682"
};

const PREMIUM_MONTH_MS = 30 * 24 * 60 * 60 * 1000;

const app = initializeApp(firebaseConfig);
const db  = getFirestore(app);

// ══════════════════════════════════════════
// ÉTAT
// ══════════════════════════════════════════
let profiles = [];
let payments = [];

// ══════════════════════════════════════════
// UTILITAIRES
// ══════════════════════════════════════════
function $(id) { return document.getElementById(id); }

function escapeHtml(s) {
  return String(s || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatDate(iso) {
  if (!iso) return '—';
  try {
    return new Date(iso).toLocaleString('fr-FR', {
      dateStyle: 'short', timeStyle: 'short'
    });
  } catch { return iso; }
}

function formatDateShort(iso) {
  if (!iso) return '—';
  try { return new Date(iso).toLocaleDateString('fr-FR'); }
  catch { return iso; }
}

function toast(msg, type = 'ok') {
  const wrap = $('toastWrap');
  if (!wrap) return;
  const el = document.createElement('div');
  el.className = 'toast ' + type;
  el.textContent = msg;
  wrap.appendChild(el);
  setTimeout(() => el.style.opacity = '0', 3200);
  setTimeout(() => el.remove(), 3800);
}

function showLoading(v) {
  const el = $('loadingOverlay');
  if (el) el.style.display = v ? 'flex' : 'none';
}

function showError(msg) {
  const el = $('errorBanner');
  if (!el) return;
  el.style.display = 'block';
  el.innerHTML =
    '<strong>Erreur Firestore</strong><br>' + escapeHtml(msg) +
    '<br><small>Vérifiez les règles Firestore et votre connexion.</small>';
}

// ══════════════════════════════════════════
// STATUT ABONNEMENT
// ══════════════════════════════════════════
function getStatus(p) {
  const now = Date.now();
  if (p.subscriptionStatus === 'cancelled') {
    return { key: 'cancelled', label: 'Résilié', cls: 'badge-cancelled', expires: null };
  }
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

function badgeHtml(st) {
  return `<span class="badge ${st.cls}">${escapeHtml(st.label)}</span>`;
}

function payBadge(status) {
  const m = {
    pending:  ['En attente', 'badge-pending'],
    approved: ['Validé',     'badge-premium'],
    rejected: ['Refusé',     'badge-expired']
  };
  const [l, c] = m[status] || [status, 'badge-expired'];
  return `<span class="badge ${c}">${l}</span>`;
}

// ══════════════════════════════════════════
// STATS
// ══════════════════════════════════════════
function updateStats() {
  const now = Date.now();
  $('sTotal').textContent   = profiles.length;
  $('sPremium').textContent = profiles.filter(p =>
    p.premiumUntil && new Date(p.premiumUntil).getTime() > now
  ).length;
  $('sTrial').textContent   = profiles.filter(p => getStatus(p).key === 'trial').length;
  $('sPending').textContent = payments.filter(p => p.status === 'pending').length;
  $('sExpired').textContent = profiles.filter(p => getStatus(p).key === 'expired').length;
}

// ══════════════════════════════════════════
// NAVIGATION ONGLETS
// ══════════════════════════════════════════
window.switchTab = function(tab) {
  document.querySelectorAll('.admin-tab').forEach(t =>
    t.classList.toggle('active', t.dataset.tab === tab)
  );
  document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
  const panel = $('panel' + tab.charAt(0).toUpperCase() + tab.slice(1));
  if (panel) panel.classList.add('active');
};

// ══════════════════════════════════════════
// ACTIONS ADMIN
// ══════════════════════════════════════════
async function activatePremium(uid, paymentId) {
  if (!confirm('Activer Premium 30 jours pour cette entreprise ?')) return;
  showLoading(true);
  try {
    const premiumUntil = new Date(Date.now() + PREMIUM_MONTH_MS).toISOString();

    await setDoc(doc(db, 'profiles', uid), {
      premiumUntil,
      subscriptionStatus:  'active',
      lastActivationAt:    new Date().toISOString(),
      activationMethod:    'admin_panel',
      cancelledAt:         null
    }, { merge: true });

    if (paymentId) {
      await updateDoc(doc(db, 'payment_requests', paymentId), {
        status:     'approved',
        approvedAt: new Date().toISOString(),
        approvedBy: 'admin_panel'
      });
    }

    toast('✅ Abonnement Premium activé (30 jours)');
    await loadAll();
  } catch (e) {
    toast('Erreur : ' + e.message, 'err');
    console.error('[COMEO Admin] activatePremium:', e);
  } finally {
    showLoading(false);
  }
}

async function cancelPremium(uid) {
  if (!confirm('Mettre fin à l\'abonnement Premium ?\nL\'accès sera immédiatement révoqué.')) return;
  showLoading(true);
  try {
    await setDoc(doc(db, 'profiles', uid), {
      premiumUntil:       null,
      subscriptionStatus: 'cancelled',
      cancelledAt:        new Date().toISOString(),
      cancelledBy:        'admin_panel'
    }, { merge: true });

    toast('Abonnement résilié');
    await loadAll();
  } catch (e) {
    toast('Erreur : ' + e.message, 'err');
    console.error('[COMEO Admin] cancelPremium:', e);
  } finally {
    showLoading(false);
  }
}

async function rejectPayment(paymentId) {
  if (!confirm('Refuser ce paiement ?')) return;
  showLoading(true);
  try {
    await updateDoc(doc(db, 'payment_requests', paymentId), {
      status:     'rejected',
      rejectedAt: new Date().toISOString(),
      rejectedBy: 'admin_panel'
    });

    toast('Paiement refusé');
    await loadAll();
  } catch (e) {
    toast('Erreur : ' + e.message, 'err');
  } finally {
    showLoading(false);
  }
}

// ══════════════════════════════════════════
// RENDER — ENTREPRISES
// ══════════════════════════════════════════
window.renderCompanies = function() {
  const q    = ($('searchCompanies')?.value || '').toLowerCase();
  const list = profiles.filter(p =>
    !q || `${p.company} ${p.email} ${p.id}`.toLowerCase().includes(q)
  );
  const tbody = $('companiesBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="td-muted">Aucune entreprise trouvée</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(p => {
    const st        = getStatus(p);
    const isPremium = st.key === 'premium';
    return `<tr>
      <td>
        <div class="td-company">${escapeHtml(p.company || '—')}</div>
        <div class="td-email td-mono">${escapeHtml(p.id?.slice(0, 8))}…</div>
      </td>
      <td>${escapeHtml(p.email || '—')}</td>
      <td>${formatDateShort(p.createdAt)}</td>
      <td>${escapeHtml(p.exercice || '—')}</td>
      <td>${badgeHtml(st)}</td>
      <td class="td-actions">
        ${isPremium
          ? `<button class="btn btn-danger btn-sm" data-cancel="${escapeHtml(p.id)}">⏹ Fin abonnement</button>`
          : `<button class="btn btn-success btn-sm" data-activate="${escapeHtml(p.id)}">✅ Activer 30 j</button>`
        }
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-activate]').forEach(b =>
    b.addEventListener('click', () => activatePremium(b.dataset.activate, null))
  );
  tbody.querySelectorAll('[data-cancel]').forEach(b =>
    b.addEventListener('click', () => cancelPremium(b.dataset.cancel))
  );
};

// ══════════════════════════════════════════
// RENDER — ABONNEMENTS
// ══════════════════════════════════════════
window.renderSubscriptions = function() {
  const q      = ($('searchSubs')?.value || '').toLowerCase();
  const filter = $('filterSubs')?.value || 'all';
  const list   = profiles.filter(p => {
    const st = getStatus(p);
    if (filter !== 'all' && st.key !== filter) return false;
    return !q || `${p.company} ${p.email}`.toLowerCase().includes(q);
  });
  const tbody = $('subsBody');
  if (!tbody) return;

  if (!list.length) {
    tbody.innerHTML = '<tr><td colspan="6" class="td-muted">Aucun abonnement trouvé</td></tr>';
    return;
  }

  tbody.innerHTML = list.map(p => {
    const st        = getStatus(p);
    const isPremium = st.key === 'premium';
    return `<tr>
      <td class="td-company">${escapeHtml(p.company || '—')}</td>
      <td>${escapeHtml(p.email || '—')}</td>
      <td>${badgeHtml(st)}</td>
      <td>${st.expires ? formatDateShort(st.expires) : '—'}</td>
      <td class="td-mono">${escapeHtml(p.lastWaveNumber || '—')}</td>
      <td class="td-actions">
        ${isPremium
          ? `<button class="btn btn-danger btn-sm" data-cancel="${escapeHtml(p.id)}">⏹ Résilier</button>`
          : `<button class="btn btn-success btn-sm" data-activate="${escapeHtml(p.id)}">✅ Activer 30 j</button>`
        }
      </td>
    </tr>`;
  }).join('');

  tbody.querySelectorAll('[data-activate]').forEach(b =>
    b.addEventListener('click', () => activatePremium(b.dataset.activate, null))
  );
  tbody.querySelectorAll('[data-cancel]').forEach(b =>
    b.addEventListener('click', () => cancelPremium(b.dataset.cancel))
  );
};

// ══════════════════════════════════════════
// RENDER — PAIEMENTS
// ══════════════════════════════════════════
function renderPayments() {
  const pending = payments.filter(p => p.status === 'pending');
  const grid    = $('pendingPayments');

  if (grid) {
    if (!pending.length) {
      grid.innerHTML = '<div class="empty-state"><span>✅</span>Aucun paiement en attente</div>';
    } else {
      grid.innerHTML = pending.map(p => `
        <div class="pay-card">
          <div class="pay-card-head">
            <strong>${escapeHtml(p.payerName || '—')}</strong>
            <span class="pay-card-date">${formatDate(p.createdAt)}</span>
          </div>
          <div class="pay-grid">
            <div><span>Entreprise</span>${escapeHtml(p.company || '—')}</div>
            <div><span>Email</span>${escapeHtml(p.email || '—')}</div>
            <div><span>N° Wave</span><strong class="td-mono">${escapeHtml(p.waveNumber || '—')}</strong></div>
            <div><span>Montant</span>${escapeHtml(String(p.amount || 15000))} FCFA</div>
          </div>
          <div class="pay-actions">
            <button class="btn btn-success btn-sm"
              data-approve="${escapeHtml(p._id)}"
              data-uid="${escapeHtml(p.uid)}">
              ✅ Valider & activer
            </button>
            <button class="btn btn-danger btn-sm"
              data-reject="${escapeHtml(p._id)}">
              ✕ Refuser
            </button>
          </div>
        </div>`).join('');

      grid.querySelectorAll('[data-approve]').forEach(b =>
        b.addEventListener('click', () => activatePremium(b.dataset.uid, b.dataset.approve))
      );
      grid.querySelectorAll('[data-reject]').forEach(b =>
        b.addEventListener('click', () => rejectPayment(b.dataset.reject))
      );
    }
  }

  const tbody = $('paymentsBody');
  if (!tbody) return;
  const hist = payments.slice(0, 60);

  if (!hist.length) {
    tbody.innerHTML = '<tr><td colspan="7" class="td-muted">Aucun paiement</td></tr>';
    return;
  }

  tbody.innerHTML = hist.map(p => `<tr>
    <td>${formatDate(p.createdAt)}</td>
    <td>${escapeHtml(p.payerName || '—')}</td>
    <td class="td-mono">${escapeHtml(p.waveNumber || '—')}</td>
    <td>${escapeHtml(p.company || '—')}</td>
    <td>${escapeHtml(p.email || '—')}</td>
    <td>${escapeHtml(String(p.amount || 15000))} F</td>
    <td>${payBadge(p.status)}</td>
  </tr>`).join('');
}

// ══════════════════════════════════════════
// CHARGEMENT DONNÉES
// ══════════════════════════════════════════
async function loadAll() {
  showLoading(true);
  try {
    const [profSnap, paySnap] = await Promise.all([
      getDocs(collection(db, 'profiles')),
      getDocs(
        query(collection(db, 'payment_requests'), orderBy('createdAt', 'desc'), limit(80))
      ).catch(() =>
        getDocs(collection(db, 'payment_requests'))
      )
    ]);

    profiles = profSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    profiles.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || ''));

    payments = paySnap.docs.map(d => ({ _id: d.id, ...d.data() }));

    profiles.forEach(p => {
      const lastPay = payments.find(x => x.uid === p.id && x.status === 'pending');
      p.lastWaveNumber = lastPay?.waveNumber || p.lastWaveNumber || '';
    });

    const adminApp    = $('adminApp');
    const errorBanner = $('errorBanner');
    if (adminApp)    adminApp.style.display   = 'block';
    if (errorBanner) errorBanner.style.display = 'none';

    updateStats();
    window.renderCompanies();
    window.renderSubscriptions();
    renderPayments();

  } catch (e) {
    console.error('[COMEO Admin] loadAll:', e);
    showError(e.message);
  } finally {
    showLoading(false);
  }
}

window.adminRefresh = loadAll;

// ══════════════════════════════════════════
// INIT — accès direct, sans connexion
// ══════════════════════════════════════════
loadAll();
