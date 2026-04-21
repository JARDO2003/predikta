// ═══════════════════════════════════════════════════
// COMEO AI v4 — MODULE ABONNEMENT (subscription.js)
// Wave Business · WhatsApp · Firebase Firestore
// ═══════════════════════════════════════════════════

const WAVE_URL    = "https://pay.wave.com/m/M_ci_iqMcg8KwRE-W/c/ci/?amount=2000";
const WA_NUMBER   = "2250508463003";
const FREE_HOURS  = 48;

// ───────────────────────────────────────────────────
// 1. VÉRIFICATION / CRÉATION ABONNEMENT (Firestore)
// ───────────────────────────────────────────────────
export async function checkSubscription(profileId, db) {
  try {
    const { doc, getDoc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    const ref  = doc(db, "subscriptions", profileId);
    const snap = await getDoc(ref);

    // Nouveau profil → créer un essai gratuit 48h
    if (!snap.exists()) {
      const trialData = {
        profileId,
        plan:        "trial",
        status:      "active",
        startedAt:   new Date().toISOString(),
        trialEndsAt: new Date(Date.now() + FREE_HOURS * 3_600_000).toISOString(),
        paidAt:      null,
        payMethod:   null,
        renewAt:     null,
        pendingPayment: false,
      };
      await setDoc(ref, trialData);
      return { valid: true, plan: "trial", data: trialData, hoursLeft: FREE_HOURS };
    }

    const sub = snap.data();

    // Abonnement payant actif
    if (sub.plan === "paid" && sub.status === "active") {
      return { valid: true, plan: "paid", data: sub };
    }

    // Essai en cours ou expiré
    if (sub.plan === "trial") {
      const endsAt    = new Date(sub.trialEndsAt);
      const hoursLeft = Math.max(0, (endsAt - Date.now()) / 3_600_000);
      if (Date.now() < endsAt) {
        return { valid: true, plan: "trial", data: sub, hoursLeft: Math.ceil(hoursLeft) };
      }
      return { valid: false, plan: "expired", data: sub, hoursLeft: 0 };
    }

    return { valid: false, plan: sub.plan || "unknown", data: sub };
  } catch (err) {
    console.warn("[COMEO] checkSubscription:", err);
    // Fail-open : autoriser en cas d'erreur réseau
    return { valid: true, plan: "trial", data: {}, hoursLeft: FREE_HOURS };
  }
}

// ───────────────────────────────────────────────────
// 2. ENREGISTREMENT PAIEMENT EN ATTENTE (Firestore)
// ───────────────────────────────────────────────────
export async function markPaymentPending(profileId, db, method, company) {
  if (!db || !profileId) return;
  try {
    const { doc, setDoc } = await import(
      "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
    );
    await setDoc(
      doc(db, "subscriptions", profileId),
      {
        pendingPayment: true,
        pendingMethod:  method,
        pendingAt:      new Date().toISOString(),
        company,
      },
      { merge: true }
    );
  } catch (err) {
    console.warn("[COMEO] markPaymentPending:", err);
  }
}

// ───────────────────────────────────────────────────
// 3. ACTIVATION PLAN PAYANT (côté admin ou auto)
// ───────────────────────────────────────────────────
export async function activatePaidPlan(profileId, db, method = "wave") {
  const { doc, setDoc } = await import(
    "https://www.gstatic.com/firebasejs/10.12.0/firebase-firestore.js"
  );
  await setDoc(
    doc(db, "subscriptions", profileId),
    {
      plan:           "paid",
      status:         "active",
      paidAt:         new Date().toISOString(),
      payMethod:      method,
      renewAt:        new Date(Date.now() + 30 * 24 * 3_600_000).toISOString(),
      pendingPayment: false,
    },
    { merge: true }
  );
}

// ───────────────────────────────────────────────────
// 4. BANNIÈRE ESSAI (non-bloquante, affichée < 36h)
// ───────────────────────────────────────────────────
export function showTrialBanner(subInfo) {
  document.getElementById("trialBanner")?.remove();
  if (!subInfo || subInfo.plan === "paid") return;

  const h   = subInfo.hoursLeft || 0;
  if (h > 36) return; // N'afficher que si peu de temps restant

  const low = h <= 12;
  const el  = document.createElement("div");
  el.id     = "trialBanner";

  el.style.cssText = `
    position: fixed; top: 56px; left: 0; right: 0; z-index: 500;
    background: ${low
      ? "linear-gradient(90deg,rgba(220,38,38,.14),rgba(220,38,38,.07))"
      : "linear-gradient(90deg,rgba(245,158,11,.11),rgba(245,158,11,.05))"};
    border-bottom: 1px solid ${low ? "rgba(220,38,38,.3)" : "rgba(245,158,11,.25)"};
    padding: 8px 16px; display: flex; align-items: center; gap: 12px;
    font-family: 'Space Grotesk', sans-serif; font-size: 12px;
    color: rgba(255,255,255,.78); animation: tbIn .4s ease;
  `;

  el.innerHTML = `
    <style>@keyframes tbIn{from{transform:translateY(-100%)}to{transform:translateY(0)}}</style>
    <span style="font-size:16px">${low ? "⚠️" : "⏳"}</span>
    <span>
      Essai gratuit &nbsp;—&nbsp;
      <strong style="color:${low ? "#f87171" : "#fbbf24"}">${h}h restantes</strong>
      &nbsp;·&nbsp; Passez au Plan Pro pour accès illimité.
    </span>
    <button id="tbUpgradeBtn"
      style="background:${low ? "#dc2626" : "#d4a853"};color:${low ? "#fff" : "#0a0b10"};
        border:none;border-radius:4px;padding:5px 13px;font-size:11px;font-weight:700;
        cursor:pointer;font-family:'Space Grotesk',sans-serif;margin-left:auto;white-space:nowrap">
      Souscrire →
    </button>
    <button
      onclick="document.getElementById('trialBanner').remove()"
      style="background:transparent;border:none;color:rgba(255,255,255,.3);cursor:pointer;font-size:14px;padding:2px 6px">
      ✕
    </button>
  `;

  document.body.appendChild(el);
  el.querySelector("#tbUpgradeBtn").onclick = () => window._showSubModal?.();
}

// ───────────────────────────────────────────────────
// 5. MODALE ABONNEMENT PRINCIPALE
// ───────────────────────────────────────────────────
export function showSubscriptionModal(subInfo, profileId, db, company) {
  document.getElementById("subModal")?.remove();

  const expired = !subInfo.valid;
  const h       = subInfo.hoursLeft || 0;
  const low     = h <= 12 && subInfo.plan === "trial";

  const overlay = document.createElement("div");
  overlay.id    = "subModal";

  overlay.innerHTML = `
<style>
  #subModal {
    position: fixed; inset: 0; z-index: 99999;
    background: rgba(10,11,16,.9);
    display: flex; align-items: center; justify-content: center;
    backdrop-filter: blur(12px); padding: 16px;
    animation: smFadeIn .25s ease;
  }
  @keyframes smFadeIn { from { opacity: 0 } to { opacity: 1 } }

  .sm-box {
    background: linear-gradient(160deg, #0f1118 0%, #161824 55%, #0f1118 100%);
    border: 1px solid rgba(212,168,83,.22);
    border-radius: 22px; width: 490px; max-width: 100%;
    overflow: hidden;
    box-shadow:
      0 40px 100px rgba(0,0,0,.8),
      0 0 0 1px rgba(212,168,83,.06),
      inset 0 1px 0 rgba(255,255,255,.04);
    animation: smSlide .38s cubic-bezier(.34,1.4,.64,1);
  }
  @keyframes smSlide {
    from { transform: translateY(48px) scale(.95); opacity: 0 }
    to   { transform: none; opacity: 1 }
  }

  /* ── En-tête ── */
  .sm-hd {
    padding: 30px 30px 22px; text-align: center; position: relative;
    background: linear-gradient(135deg, rgba(212,168,83,.1), rgba(212,168,83,.03));
    border-bottom: 1px solid rgba(212,168,83,.15);
  }
  .sm-logo {
    font-family: 'Playfair Display', serif;
    font-size: 30px; font-weight: 900;
    color: #d4a853; letter-spacing: .08em; line-height: 1;
  }
  .sm-tagline {
    font-family: 'JetBrains Mono', monospace;
    font-size: 8px; color: rgba(212,168,83,.38);
    letter-spacing: .22em; text-transform: uppercase; margin-top: 5px;
  }
  .sm-status {
    display: inline-flex; align-items: center; gap: 6px;
    margin-top: 13px; padding: 6px 16px; border-radius: 20px;
    font-family: 'JetBrains Mono', monospace;
    font-size: 10.5px; font-weight: 700; letter-spacing: .06em;
  }
  .sm-status.expired { background: rgba(220,38,38,.12); border: 1px solid rgba(220,38,38,.3); color: #f87171 }
  .sm-status.warning { background: rgba(245,158,11,.12); border: 1px solid rgba(245,158,11,.28); color: #fbbf24 }
  .sm-close-btn {
    position: absolute; top: 12px; right: 14px;
    background: transparent; border: none;
    color: rgba(255,255,255,.22); cursor: pointer;
    font-size: 15px; padding: 4px 8px; border-radius: 4px; transition: all .14s;
  }
  .sm-close-btn:hover { color: rgba(255,255,255,.65); background: rgba(255,255,255,.07) }

  /* ── Corps ── */
  .sm-body { padding: 24px 28px 20px }
  .sm-plan-title {
    font-family: 'Playfair Display', serif;
    font-size: 21px; font-weight: 700; color: #fff; margin-bottom: 5px;
  }
  .sm-plan-desc {
    font-size: 12px; color: rgba(255,255,255,.38);
    line-height: 1.6; margin-bottom: 20px;
  }

  /* ── Tarif ── */
  .sm-price-card {
    background: rgba(212,168,83,.07);
    border: 1px solid rgba(212,168,83,.18);
    border-radius: 14px; padding: 16px 20px; margin-bottom: 20px;
    display: flex; align-items: center; justify-content: space-between; gap: 12px;
  }
  .sm-price-label {
    font-family: 'JetBrains Mono', monospace; font-size: 8px;
    color: rgba(212,168,83,.4); text-transform: uppercase;
    letter-spacing: .16em; margin-bottom: 4px;
  }
  .sm-price-value {
    font-family: 'Playfair Display', serif;
    font-size: 32px; font-weight: 900; color: #d4a853; line-height: 1;
  }
  .sm-price-value span { font-size: 14px }
  .sm-price-period {
    font-family: 'JetBrains Mono', monospace; font-size: 9px;
    color: rgba(212,168,83,.35); margin-top: 3px; letter-spacing: .07em;
  }
  .sm-price-right {
    text-align: right; font-family: 'JetBrains Mono', monospace;
    font-size: 9.5px; color: rgba(212,168,83,.5); line-height: 2;
  }

  /* ── Features ── */
  .sm-features { list-style: none; margin-bottom: 22px; display: flex; flex-direction: column; gap: 7px }
  .sm-features li {
    display: flex; align-items: center; gap: 10px;
    font-size: 12px; color: rgba(255,255,255,.58);
  }
  .sm-features li::before {
    content: '✓'; color: #4ade80; font-weight: 700; font-size: 10px;
    width: 18px; height: 18px; border-radius: 50%;
    background: rgba(74,222,128,.1);
    display: flex; align-items: center; justify-content: center;
    flex-shrink: 0;
  }

  /* ── Séparateur ── */
  .sm-divider { height: 1px; background: rgba(255,255,255,.06); margin: 0 0 18px }
  .sm-pay-title {
    font-family: 'JetBrains Mono', monospace; font-size: 8.5px;
    font-weight: 700; text-transform: uppercase; letter-spacing: .2em;
    color: rgba(255,255,255,.22); margin-bottom: 12px;
  }

  /* ── Boutons de paiement ── */
  .sm-pay-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px }
  .sm-pay-btn {
    display: flex; flex-direction: column; align-items: center; gap: 8px;
    padding: 17px 14px; border-radius: 14px; cursor: pointer;
    transition: all .22s; text-decoration: none;
    border: none; font-family: 'Space Grotesk', sans-serif;
  }
  .sm-pay-btn.wave {
    background: linear-gradient(145deg, #1a5eff, #0a3fd4);
    border: 1px solid rgba(26,94,255,.35);
    box-shadow: 0 8px 26px rgba(26,94,255,.22);
  }
  .sm-pay-btn.wave:hover {
    transform: translateY(-3px);
    box-shadow: 0 14px 36px rgba(26,94,255,.4);
    border-color: rgba(26,94,255,.65);
  }
  .sm-pay-btn.other {
    background: linear-gradient(145deg, rgba(37,211,102,.11), rgba(37,211,102,.04));
    border: 1px solid rgba(37,211,102,.22);
  }
  .sm-pay-btn.other:hover {
    transform: translateY(-3px);
    background: linear-gradient(145deg, rgba(37,211,102,.2), rgba(37,211,102,.09));
    border-color: rgba(37,211,102,.48);
    box-shadow: 0 10px 28px rgba(37,211,102,.14);
  }
  .sm-pay-icon { font-size: 22px }
  .sm-pay-name { font-size: 13px; font-weight: 700; color: #fff }
  .sm-pay-desc { font-size: 9px; color: rgba(255,255,255,.38); text-align: center; font-family: 'JetBrains Mono', monospace; letter-spacing: .04em }

  /* ── Pied ── */
  .sm-footer {
    padding: 13px 28px 18px; text-align: center;
    border-top: 1px solid rgba(255,255,255,.05);
    font-size: 10.5px; color: rgba(255,255,255,.2); line-height: 1.7;
  }
  .sm-footer a { color: rgba(37,211,102,.55); text-decoration: none }
  .sm-footer a:hover { color: rgba(37,211,102,.85) }

  @media (max-width: 460px) {
    .sm-pay-grid { grid-template-columns: 1fr }
    .sm-body { padding: 18px 16px }
    .sm-hd  { padding: 22px 16px 17px }
    .sm-price-value { font-size: 26px }
  }
</style>

<div class="sm-box">

  <!-- En-tête -->
  <div class="sm-hd">
    ${!expired
      ? `<button class="sm-close-btn" id="smCloseBtn">✕</button>`
      : ""}
    <div class="sm-logo">COMEO AI</div>
    <div class="sm-tagline">Expert Comptable SYSCOHADA · Révisé 2017</div>
    ${expired
      ? `<div class="sm-status expired">⛔ Période d'essai expirée</div>`
      : low
        ? `<div class="sm-status warning">⏳ ${h}h restantes</div>`
        : ""}
  </div>

  <!-- Corps -->
  <div class="sm-body">
    <div class="sm-plan-title">Plan Professionnel</div>
    <div class="sm-plan-desc">
      ${expired
        ? `Votre essai gratuit de ${FREE_HOURS}h est terminé. Souscrivez pour continuer à utiliser COMEO AI sans interruption.`
        : `Accès illimité à tous les modules — Journal, Grand Livre, Bilan, Résultat, IA Expert SYSCOHADA.`}
    </div>

    <!-- Tarif -->
    <div class="sm-price-card">
      <div>
        <div class="sm-price-label">Tarif mensuel</div>
        <div class="sm-price-value">2 000 <span>FCFA</span></div>
        <div class="sm-price-period">/ mois · Sans engagement</div>
      </div>
      <div class="sm-price-right">
        SYSCOHADA 2017<br>
        IA Expert<br>
        Export PDF/Word<br>
        Illimité FCFA
      </div>
    </div>

    <!-- Features -->
    <ul class="sm-features">
      <li>Journal groupé — 3 écritures liées automatiques</li>
      <li>Grand Livre, Balance &amp; Bilan SYSCOHADA complet</li>
      <li>Compte de résultat &amp; Trésorerie en temps réel</li>
      <li>IA COMEO — Saisie assistée &amp; analyse comptable</li>
      <li>Export PDF &amp; Word professionnel illimité</li>
      <li>Plan comptable SYSCOHADA Révisé 2017 intégral</li>
    </ul>

    <!-- Paiement -->
    <div class="sm-divider"></div>
    <div class="sm-pay-title">Choisissez votre moyen de paiement</div>

    <div class="sm-pay-grid">
      <!-- Wave -->
      <a class="sm-pay-btn wave"
         href="${WAVE_URL}"
         target="_blank" rel="noopener"
         id="smWaveBtn">
        <div class="sm-pay-icon">
          <svg width="26" height="26" viewBox="0 0 26 26" fill="none">
            <ellipse cx="13" cy="13" rx="10" ry="6" stroke="white" stroke-width="1.6" fill="none"/>
            <circle cx="13" cy="13" r="3" fill="white"/>
          </svg>
        </div>
        <div class="sm-pay-name">Payer via Wave</div>
        <div class="sm-pay-desc">Paiement sécurisé · Instantané</div>
      </a>

      <!-- Autre moyen -->
      <button class="sm-pay-btn other" id="smOtherBtn">
        <div class="sm-pay-icon">💬</div>
        <div class="sm-pay-name">Autre moyen</div>
        <div class="sm-pay-desc">OM · MTN MoMo · Carte · Espèces</div>
      </button>
    </div>
  </div>

  <!-- Pied -->
  <div class="sm-footer">
    🔒 Paiement sécurisé · Activation sous 24h<br>
    Assistance :
    <a href="https://wa.me/${WA_NUMBER}" target="_blank" rel="noopener">
      WhatsApp +225 0508 4630 03
    </a>
  </div>

</div>
  `;

  document.body.appendChild(overlay);

  // Fermer (sauf si expiré)
  if (!expired) {
    overlay.querySelector("#smCloseBtn").onclick = () => overlay.remove();
    overlay.addEventListener("click", e => { if (e.target === overlay) overlay.remove(); });
  }

  // ── Clic Wave : enregistrer + toast de confirmation
  overlay.querySelector("#smWaveBtn").addEventListener("click", () => {
    markPaymentPending(profileId, db, "wave", company);
    setTimeout(() => _showWaveToast(company), 1800);
  });

  // ── Clic Autre : enregistrer + ouvrir WhatsApp
  overlay.querySelector("#smOtherBtn").addEventListener("click", () => {
    markPaymentPending(profileId, db, "whatsapp", company);
    const text = encodeURIComponent(
      `Bonjour, je souhaite souscrire à COMEO AI.\n\nEntreprise : ${company}\nID : ${profileId}\n\nMerci de m'indiquer les modalités de paiement disponibles.`
    );
    window.open(`https://wa.me/${WA_NUMBER}?text=${text}`, "_blank");
    overlay.remove();
  });
}

// ───────────────────────────────────────────────────
// 6. TOAST CONFIRMATION APRÈS PAIEMENT WAVE
// ───────────────────────────────────────────────────
function _showWaveToast(company) {
  const toast = document.createElement("div");
  toast.style.cssText = `
    position: fixed; bottom: 24px; left: 50%;
    transform: translateX(-50%); z-index: 99999;
    background: #0a0b10; border: 1.5px solid #1a5eff;
    border-radius: 14px; padding: 20px 24px;
    max-width: 370px; width: calc(100vw - 32px);
    font-family: 'Space Grotesk', sans-serif;
    font-size: 13px; color: rgba(255,255,255,.8);
    text-align: center;
    box-shadow: 0 16px 48px rgba(0,0,0,.65), 0 0 0 1px rgba(26,94,255,.12);
    animation: smFadeIn .3s ease;
  `;

  const waText = encodeURIComponent(
    `Bonjour, j'ai effectué un paiement Wave pour COMEO AI.\nEntreprise : ${company}\nMerci d'activer mon accès.`
  );

  toast.innerHTML = `
    <div style="font-size:28px;margin-bottom:10px">〰️</div>
    <strong style="color:#4d8fff;font-size:14px">Paiement Wave initié</strong>
    <p style="margin:9px 0 15px;font-size:11.5px;color:rgba(255,255,255,.38);line-height:1.55">
      Après confirmation du paiement, envoyez une capture d'écran
      sur WhatsApp pour activer votre accès immédiatement.
    </p>
    <a href="https://wa.me/${WA_NUMBER}?text=${waText}"
       target="_blank" rel="noopener"
       style="display:inline-flex;align-items:center;gap:8px;
         background:#25d366;color:#fff;padding:10px 20px;
         border-radius:8px;text-decoration:none;
         font-size:12px;font-weight:700">
      📲 Confirmer sur WhatsApp
    </a>
    <br>
    <button onclick="this.parentElement.remove()"
      style="background:transparent;border:none;color:rgba(255,255,255,.22);
        cursor:pointer;font-size:11px;margin-top:10px;
        font-family:'Space Grotesk',sans-serif">
      Fermer
    </button>
  `;

  document.body.appendChild(toast);
  setTimeout(() => toast?.remove(), 30_000);
}

// ───────────────────────────────────────────────────
// 7. BLOCAGE TOTAL (essai expiré)
// ───────────────────────────────────────────────────
export function showExpiredBlock(profileId, db, company) {
  showSubscriptionModal(
    { valid: false, plan: "expired", hoursLeft: 0 },
    profileId, db, company
  );
}
