// ==================== CONFIGURATION ====================
    firebase.initializeApp({
        apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
        authDomain: "data-com-a94a8.firebaseapp.com",
        databaseURL: "https://data-com-a94a8-default-rtdb.firebaseio.com",
        projectId: "data-com-a94a8",
        storageBucket: "data-com-a94a8.firebasestorage.app",
        messagingSenderId: "276904640935",
        appId: "1:276904640935:web:9cd805aeba6c34c767f682",
        measurementId: "G-FYQCWY5G4S"
    });
    const db = firebase.firestore();

    const cloudinaryConfig = { cloudName: 'djxcqczh1', uploadPreset: 'database' };

    // ==================== GLOBAL STATE ====================
    let uploadedImageUrl = '';
    let currentResultEvent = null;
    let selectedResult = null;

    // ==================== INIT ====================
    document.addEventListener('DOMContentLoaded', function() {
        loadTransactions();
        loadUserSelect();
        updateStats();
        loadActiveEvents();
        loadPendingResults();
        loadAnnouncedResults();

        const defaultDate = new Date();
        defaultDate.setDate(defaultDate.getDate() + 7);
        defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
        document.getElementById('eventEndDate').value = defaultDate.toISOString().slice(0, 16);
    });

    // ==================== SIDEBAR ====================
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.querySelector('.sidebar-overlay').classList.toggle('active');
    }
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.querySelector('.sidebar-overlay').classList.remove('active');
    }

    // ==================== TABS ====================
    function showTab(tabName) {
        document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.getElementById(tabName + 'Tab').classList.add('active');

        const tabs = document.querySelectorAll('.tab');
        const tabMap = { deposits: 0, 'new-deposit': 1, events: 2, results: 3 };
        if (tabMap[tabName] !== undefined && tabs[tabMap[tabName]]) {
            tabs[tabMap[tabName]].classList.add('active');
        }

        // Update sidebar active link
        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        const activeLink = [...document.querySelectorAll('.nav-link')].find(l => l.getAttribute('onclick') && l.getAttribute('onclick').includes(tabName));
        if (activeLink) activeLink.classList.add('active');
    }

    // ==================== STATS ====================
    async function updateStats() {
        try {
            const snap = await db.collection('transactions').where('status', '==', 'pending').limit(100).get();
            let depCount = 0, withCount = 0, total = 0;
            snap.forEach(doc => {
                const t = doc.data();
                if (t.type === 'deposit') { depCount++; total += t.amount || 0; }
                else if (t.type === 'withdrawal') { withCount++; total += t.amount || 0; }
            });
            document.getElementById('pendingCount').textContent = snap.size;
            document.getElementById('pendingDeposits').textContent = depCount;
            document.getElementById('pendingWithdrawals').textContent = withCount;
            document.getElementById('totalAmount').textContent = total.toLocaleString() + ' FCFA';
        } catch (err) { console.error('Stats error:', err); }
    }

    // ==================== TRANSACTIONS ====================
    async function loadTransactions() {
        try {
            const snap = await db.collection('transactions').where('status', '==', 'pending').limit(100).get();
            const deposits = [], withdrawals = [];
            snap.forEach(doc => {
                const t = { id: doc.id, ...doc.data() };
                (t.type === 'deposit' ? deposits : withdrawals).push(t);
            });

            const sortByDate = (a, b) => {
                const da = a.createdAt ? a.createdAt.toMillis() : 0;
                const db2 = b.createdAt ? b.createdAt.toMillis() : 0;
                return db2 - da;
            };
            deposits.sort(sortByDate);
            withdrawals.sort(sortByDate);

            renderTransactionList('pendingDepositsList', deposits, 'dépôt');
            renderTransactionList('pendingWithdrawalsList', withdrawals, 'retrait');
        } catch (err) {
            console.error('Load transactions error:', err);
            showToast('Erreur de chargement des transactions', 'error');
        }
    }

    function renderTransactionList(containerId, items, type) {
        const el = document.getElementById(containerId);
        if (!items.length) {
            el.innerHTML = `
                <div class="empty-state" style="grid-column:1/-1;">
                    <i class="fas fa-check-circle" style="color:var(--success);"></i>
                    <h4>Aucun ${type} en attente</h4>
                    <p>Tous les ${type}s ont été traités</p>
                </div>`;
            return;
        }
        el.innerHTML = items.map(renderTransactionCard).join('');
    }

    function renderTransactionCard(t) {
        const date = t.createdAt ? t.createdAt.toDate().toLocaleDateString('fr-FR', { day:'2-digit', month:'2-digit', year:'numeric', hour:'2-digit', minute:'2-digit' }) : '-';
        const userName = t.userName || 'Inconnu';
        const initials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
        const isDeposit = t.type === 'deposit';

        return `
            <div class="deposit-card">
                <div class="deposit-header">
                    <div class="deposit-user">
                        <div class="deposit-avatar" style="background: ${isDeposit ? 'var(--gradient-success)' : 'var(--gradient-danger)'};">
                            ${initials}
                        </div>
                        <div class="deposit-user-info">
                            <h4>${userName}</h4>
                            <p>
                                <span class="type-badge ${t.type}">${isDeposit ? 'DÉPÔT' : 'RETRAIT'}</span>
                                ${t.userPseudo ? ' @' + t.userPseudo : ''}
                            </p>
                        </div>
                    </div>
                    <div class="deposit-amount ${isDeposit ? '' : 'withdrawal'}">
                        ${isDeposit ? '+' : '-'}${(t.amount || 0).toLocaleString()} FCFA
                    </div>
                </div>

                <div class="deposit-details">
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Téléphone</span>
                        <span class="deposit-detail-value">${t.phone || '-'}</span>
                    </div>
                    ${t.recipientName ? `
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Nom compte</span>
                        <span class="deposit-detail-value">${t.recipientName}</span>
                    </div>` : ''}
                    ${t.transactionId ? `
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">ID Transaction</span>
                        <span class="deposit-detail-value">${t.transactionId}</span>
                    </div>` : ''}
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Date</span>
                        <span class="deposit-detail-value">${date}</span>
                    </div>
                    ${t.comment ? `
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Commentaire</span>
                        <span class="deposit-detail-value">${t.comment}</span>
                    </div>` : ''}
                    ${t.reason ? `
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Motif</span>
                        <span class="deposit-detail-value">${t.reason}</span>
                    </div>` : ''}
                    <div class="deposit-detail">
                        <span class="deposit-detail-label">Statut</span>
                        <span class="status-badge pending"><i class="fas fa-clock"></i> En attente</span>
                    </div>
                </div>

                ${t.screenshotURL ? `
                <img src="${t.screenshotURL}" alt="Capture" class="deposit-screenshot"
                     onclick="openImageModal('${t.screenshotURL}')">
                ` : ''}

                <div class="deposit-actions">
                    <button class="btn btn-success"
                        onclick="approveTransaction('${t.id}', '${t.userId}', ${t.amount}, '${t.type}')">
                        <i class="fas fa-check"></i> Approuver
                    </button>
                    <button class="btn btn-danger"
                        onclick="rejectTransaction('${t.id}', '${t.userId}', ${t.amount}, '${t.type}')">
                        <i class="fas fa-times"></i> Rejeter
                    </button>
                </div>
            </div>`;
    }

    // ==================== TRANSACTION ACTIONS ====================
    async function approveTransaction(transactionId, userId, amount, type) {
        const label = type === 'deposit' ? 'dépôt' : 'retrait';
        if (!confirm(`Approuver ce ${label} de ${Number(amount).toLocaleString()} FCFA ?`)) return;

        try {
            const transRef = db.collection('transactions').doc(transactionId);

            await db.runTransaction(async (txn) => {
                const transDoc = await txn.get(transRef);
                if (!transDoc.exists) throw new Error('Transaction introuvable');
                if (transDoc.data().status !== 'pending') throw new Error('Transaction déjà traitée');

                txn.update(transRef, {
                    status: 'completed',
                    processedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    processedBy: 'admin'
                });

                const userRef = db.collection('users').doc(userId);
                if (type === 'deposit') {
                    txn.update(userRef, {
                        balance: firebase.firestore.FieldValue.increment(amount)
                    });
                } else {
                    // withdrawal was already deducted from balance, clear pendingWithdrawal
                    txn.update(userRef, {
                        pendingWithdrawal: firebase.firestore.FieldValue.increment(-amount)
                    });
                }
            });

            showToast(`${type === 'deposit' ? 'Dépôt' : 'Retrait'} approuvé avec succès !`, 'success');
            loadTransactions();
            updateStats();

        } catch (err) {
            console.error('Approve error:', err);
            showToast('Erreur: ' + err.message, 'error');
        }
    }

    async function rejectTransaction(transactionId, userId, amount, type) {
        const label = type === 'deposit' ? 'dépôt' : 'retrait';
        if (!confirm(`Rejeter ce ${label} ? ${type === 'withdrawal' ? 'Le montant sera remboursé.' : ''}`)) return;

        try {
            const transRef = db.collection('transactions').doc(transactionId);

            await db.runTransaction(async (txn) => {
                const transDoc = await txn.get(transRef);
                if (!transDoc.exists) throw new Error('Transaction introuvable');
                if (transDoc.data().status !== 'pending') throw new Error('Transaction déjà traitée');

                txn.update(transRef, {
                    status: 'rejected',
                    processedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    processedBy: 'admin'
                });

                if (type === 'withdrawal') {
                    const userRef = db.collection('users').doc(userId);
                    txn.update(userRef, {
                        balance: firebase.firestore.FieldValue.increment(amount),
                        pendingWithdrawal: firebase.firestore.FieldValue.increment(-amount)
                    });
                }
            });

            showToast(
                type === 'withdrawal'
                    ? 'Retrait rejeté – montant remboursé à l\'utilisateur'
                    : 'Dépôt rejeté',
                'success'
            );
            loadTransactions();
            updateStats();

        } catch (err) {
            console.error('Reject error:', err);
            showToast('Erreur: ' + err.message, 'error');
        }
    }

    // ==================== USER SELECT ====================
    function loadUserSelect() {
        db.collection('users').orderBy('prenom').get()
            .then(snap => {
                const select = document.getElementById('depositUser');
                snap.forEach(doc => {
                    const u = doc.data();
                    const opt = document.createElement('option');
                    opt.value = doc.id;
                    opt.textContent = `${u.prenom || ''} ${u.nom || ''} (@${u.pseudo || 'inconnu'})`;
                    select.appendChild(opt);
                });
            })
            .catch(err => console.error('User select error:', err));
    }

    // ==================== CLOUDINARY UPLOAD ====================
    function openCloudinaryWidget() {
        cloudinary.openUploadWidget({
            cloudName: cloudinaryConfig.cloudName,
            uploadPreset: cloudinaryConfig.uploadPreset,
            sources: ['local', 'url', 'camera'],
            multiple: false, maxFiles: 1, cropping: false,
            resourceType: 'image',
            styles: {
                palette: {
                    window: '#0f172a', windowBorder: '#6366f1',
                    tabIcon: '#6366f1', menuIcons: '#94a3b8',
                    textDark: '#f8fafc', textLight: '#f8fafc',
                    link: '#6366f1', action: '#6366f1',
                    inactiveTabIcon: '#94a3b8', error: '#ef4444',
                    inProgress: '#6366f1', complete: '#22c55e',
                    sourceBg: '#1e293b'
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === 'success') {
                uploadedImageUrl = result.info.secure_url;
                document.getElementById('screenshotUrl').value = uploadedImageUrl;
                document.getElementById('previewImage').src = uploadedImageUrl;
                document.getElementById('uploadPreview').style.display = 'block';
                showToast('Image uploadée avec succès !', 'success');
            }
        });
    }

    // ==================== MANUAL DEPOSIT SUBMIT ====================
    async function submitDeposit(e) {
        e.preventDefault();
        const btn = document.getElementById('submitDepositBtn');
        btn.innerHTML = '<span class="loading"></span> Soumission...';
        btn.disabled = true;

        const userId = document.getElementById('depositUser').value;
        if (!userId) {
            showToast('Veuillez sélectionner un utilisateur', 'error');
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre le dépôt';
            btn.disabled = false;
            return;
        }

        const amount = parseInt(document.getElementById('depositAmount').value);
        const name = document.getElementById('depositName').value;
        const contact = document.getElementById('depositContact').value;
        const screenshot = document.getElementById('screenshotUrl').value;

        try {
            const userDoc = await db.collection('users').doc(userId).get();
            const user = userDoc.data();

            await db.collection('transactions').add({
                userId,
                userName: user ? `${user.prenom || ''} ${user.nom || ''}`.trim() : name,
                userPseudo: user ? user.pseudo : null,
                type: 'deposit',
                amount,
                phone: contact,
                screenshotURL: screenshot || null,
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast('Dépôt soumis avec succès !', 'success');
            document.getElementById('depositForm').reset();
            document.getElementById('uploadPreview').style.display = 'none';
            uploadedImageUrl = '';
            loadTransactions();
            updateStats();

        } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre le dépôt';
            btn.disabled = false;
        }
    }

    // ==================== EVENTS ====================
    async function publishEvent(e) {
        e.preventDefault();
        const btn = document.getElementById('publishEventBtn');
        btn.innerHTML = '<span class="loading"></span> Publication...';
        btn.disabled = true;

        try {
            await db.collection('events').add({
                question: document.getElementById('eventQuestion').value,
                category: document.getElementById('eventCategory').value,
                minBet: parseInt(document.getElementById('eventMinBet').value),
                endDate: document.getElementById('eventEndDate').value,
                description: document.getElementById('eventDescription').value,
                status: 'active',
                bets: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });

            showToast('Événement publié avec succès !', 'success');
            document.getElementById('eventForm').reset();

            const d = new Date();
            d.setDate(d.getDate() + 7);
            d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
            document.getElementById('eventEndDate').value = d.toISOString().slice(0, 16);

            loadActiveEvents();
            loadPendingResults();

        } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Publier l\'événement';
            btn.disabled = false;
        }
    }

    // ==================== RESULTS ====================
    async function loadPendingResults() {
        const container = document.getElementById('pendingResultsList');
        try {
            const snap = await db.collection('events').where('status', '==', 'active').get();

            if (snap.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-check-circle" style="font-size:3rem; color:var(--success);"></i>
                        <h4>Aucun événement en attente</h4>
                        <p>Tous les résultats ont été annoncés</p>
                    </div>`;
                return;
            }

            const events = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    if (!a.createdAt || !b.createdAt) return 0;
                    return b.createdAt.toMillis() - a.createdAt.toMillis();
                });

            container.innerHTML = events.map(ev => {
                const yesBets = (ev.bets || []).filter(b => b.choice === 'yes');
                const noBets = (ev.bets || []).filter(b => b.choice === 'no');
                const yesTotal = yesBets.reduce((s, b) => s + b.amount, 0);
                const noTotal = noBets.reduce((s, b) => s + b.amount, 0);
                const totalPot = yesTotal + noTotal;

                return `
                <div class="event-card">
                    <div class="event-header">
                        <span class="event-category">
                            <i class="fas fa-${getCategoryIcon(ev.category)}"></i>
                            ${ev.category || 'Sport'}
                        </span>
                        <span class="status-badge active"><i class="fas fa-circle" style="font-size:.5rem;"></i> En cours</span>
                    </div>
                    <div class="event-question">${ev.question}</div>
                    <div class="event-stats">
                        <div class="event-stat">
                            <i class="fas fa-check-circle" style="color:var(--success);"></i>
                            ${yesBets.length} OUI — ${yesTotal.toLocaleString()} FCFA
                        </div>
                        <div class="event-stat">
                            <i class="fas fa-times-circle" style="color:var(--danger);"></i>
                            ${noBets.length} NON — ${noTotal.toLocaleString()} FCFA
                        </div>
                        <div class="event-stat">
                            <i class="fas fa-coins"></i>
                            Pot total: ${totalPot.toLocaleString()} FCFA
                        </div>
                    </div>
                    <div class="event-actions-row">
                        <button class="btn btn-primary" onclick="openResultModal('${ev.id}')">
                            <i class="fas fa-trophy"></i> Résultat
                        </button>
                        <button class="btn btn-danger" onclick="openDeleteModal('${ev.id}', this)">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>`;
            }).join('');

        } catch (err) {
            console.error('Load pending results error:', err);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erreur de chargement</h4>
                    <p>${err.message}</p>
                </div>`;
        }
    }

    async function loadAnnouncedResults() {
        const container = document.getElementById('announcedResultsList');
        try {
            const snap = await db.collection('events').where('status', '==', 'closed').get();

            if (snap.empty) {
                container.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-history"></i>
                        <h4>Aucun résultat annoncé</h4>
                        <p>Les résultats apparaîtront ici</p>
                    </div>`;
                return;
            }

            const events = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    if (!b.closedAt || !a.closedAt) return 0;
                    return b.closedAt.toMillis() - a.closedAt.toMillis();
                });

            container.innerHTML = events.map(ev => {
                const yesBets = (ev.bets || []).filter(b => b.choice === 'yes');
                const noBets = (ev.bets || []).filter(b => b.choice === 'no');
                const winnerBets = ev.winner === 'yes' ? yesBets : noBets;
                const loserBets = ev.winner === 'yes' ? noBets : yesBets;
                const loserTotal = loserBets.reduce((s, b) => s + b.amount, 0);
                const commission = loserTotal * 0.02;
                const redistribution = loserTotal - commission;
                const gainPerWinner = winnerBets.length > 0 ? redistribution / winnerBets.length : 0;
                const closedDate = ev.closedAt ? ev.closedAt.toDate().toLocaleDateString('fr-FR') : '-';

                return `
                <div class="event-card" style="border-left:4px solid ${ev.winner === 'yes' ? 'var(--success)' : 'var(--danger)'};">
                    <div class="event-header">
                        <span class="event-category">
                            <i class="fas fa-${getCategoryIcon(ev.category)}"></i>
                            ${ev.category || 'Sport'}
                        </span>
                        <span class="status-badge closed"><i class="fas fa-lock"></i> Terminé</span>
                    </div>
                    <div class="event-question">${ev.question}</div>
                    <div style="background:rgba(15,23,42,0.5); border-radius:8px; padding:1rem; margin:0.75rem 0;">
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="color:var(--text-muted);">Résultat :</span>
                            <strong style="color:${ev.winner === 'yes' ? 'var(--success)' : 'var(--danger)'};">
                                ${ev.winner === 'yes' ? '✓ OUI' : '✗ NON'}
                            </strong>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="color:var(--text-muted);">Gagnants :</span>
                            <span style="color:var(--success); font-weight:600;">${winnerBets.length} pers.</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="color:var(--text-muted);">Perdants :</span>
                            <span style="color:var(--danger); font-weight:600;">${loserBets.length} pers.</span>
                        </div>
                        <div style="display:flex; justify-content:space-between; margin-bottom:0.5rem;">
                            <span style="color:var(--text-muted);">Gain par gagnant :</span>
                            <span style="color:var(--success); font-weight:700;">+${Math.floor(gainPerWinner).toLocaleString()} FCFA</span>
                        </div>
                        <div style="display:flex; justify-content:space-between;">
                            <span style="color:var(--text-muted);">Date clôture :</span>
                            <span>${closedDate}</span>
                        </div>
                    </div>
                    <div class="event-actions-row" style="margin-top:0.75rem;">
                        <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${ev.id}', this)" style="width:100%;">
                            <i class="fas fa-trash"></i> Supprimer cet événement
                        </button>
                    </div>
                </div>`;
            }).join('');

        } catch (err) {
            console.error('Load announced results error:', err);
            container.innerHTML = `
                <div class="empty-state">
                    <i class="fas fa-exclamation-triangle"></i>
                    <h4>Erreur de chargement</h4>
                    <p>${err.message}</p>
                </div>`;
        }
    }

    function getCategoryIcon(cat) {
        const icons = { sport:'futbol', politique:'landmark', entertainment:'film', crypto:'bitcoin', music:'music', autre:'tag' };
        return icons[cat] || 'tag';
    }

    // ==================== RESULT MODAL ====================
    async function openResultModal(eventId) {
        try {
            const doc = await db.collection('events').doc(eventId).get();
            if (!doc.exists) { showToast('Événement introuvable', 'error'); return; }

            currentResultEvent = { id: doc.id, ...doc.data() };
            selectedResult = null;

            // Reset modal state
            document.getElementById('resultOptYes').classList.remove('selected');
            document.getElementById('resultOptNo').classList.remove('selected');
            document.getElementById('resultPreview').style.display = 'none';
            document.getElementById('confirmResultBtn').disabled = true;

            const bets = currentResultEvent.bets || [];
            const yesBets = bets.filter(b => b.choice === 'yes');
            const noBets = bets.filter(b => b.choice === 'no');
            const yesTotal = yesBets.reduce((s, b) => s + b.amount, 0);
            const noTotal = noBets.reduce((s, b) => s + b.amount, 0);

            document.getElementById('resultEventSummary').innerHTML = `
                <div class="event-summary-item">
                    <span class="event-summary-label">Question</span>
                    <span class="event-summary-value" style="font-size:.9rem;">${currentResultEvent.question}</span>
                </div>
                <div class="event-summary-item">
                    <span class="event-summary-label">Paris OUI</span>
                    <span class="event-summary-value" style="color:var(--success);">${yesBets.length} — ${yesTotal.toLocaleString()} FCFA</span>
                </div>
                <div class="event-summary-item">
                    <span class="event-summary-label">Paris NON</span>
                    <span class="event-summary-value" style="color:var(--danger);">${noBets.length} — ${noTotal.toLocaleString()} FCFA</span>
                </div>
                <div class="event-summary-item">
                    <span class="event-summary-label">Pot total</span>
                    <span class="event-summary-value">${(yesTotal + noTotal).toLocaleString()} FCFA</span>
                </div>`;

            document.getElementById('resultModal').classList.add('active');

        } catch (err) {
            showToast('Erreur: ' + err.message, 'error');
        }
    }

    function closeResultModal() {
        document.getElementById('resultModal').classList.remove('active');
        currentResultEvent = null;
        selectedResult = null;
    }

    function selectResult(choice) {
        selectedResult = choice;

        // Update UI
        document.getElementById('resultOptYes').classList.toggle('selected', choice === 'yes');
        document.getElementById('resultOptNo').classList.toggle('selected', choice === 'no');
        if (choice === 'no') document.getElementById('resultOptNo').classList.add('no');

        // Calculate preview
        if (!currentResultEvent) return;
        const bets = currentResultEvent.bets || [];
        const winners = bets.filter(b => b.choice === choice);
        const losers = bets.filter(b => b.choice !== choice);
        const loserTotal = losers.reduce((s, b) => s + b.amount, 0);
        const commission = Math.floor(loserTotal * 0.02);
        const redistribution = loserTotal - commission;
        const gainPerWinner = winners.length > 0 ? Math.floor(redistribution / winners.length) : 0;

        document.getElementById('winnersCount').textContent = winners.length + ' personne(s)';
        document.getElementById('losersCount').textContent = losers.length + ' personne(s)';
        document.getElementById('redistributionAmount').textContent = redistribution.toLocaleString() + ' FCFA';
        document.getElementById('commissionAmount').textContent = commission.toLocaleString() + ' FCFA';
        document.getElementById('gainPerWinner').textContent = '+' + gainPerWinner.toLocaleString() + ' FCFA';

        document.getElementById('resultPreview').style.display = 'block';
        document.getElementById('confirmResultBtn').disabled = false;
    }

    async function confirmResult() {
        if (!currentResultEvent || !selectedResult) return;

        const btn = document.getElementById('confirmResultBtn');
        btn.innerHTML = '<span class="loading"></span> Traitement en cours...';
        btn.disabled = true;

        try {
            const bets = currentResultEvent.bets || [];
            const winners = bets.filter(b => b.choice === selectedResult);
            const losers = bets.filter(b => b.choice !== selectedResult);
            const loserTotal = losers.reduce((s, b) => s + b.amount, 0);
            const commission = Math.floor(loserTotal * 0.02);
            const redistribution = loserTotal - commission;
            const gainPerWinner = winners.length > 0 ? Math.floor(redistribution / winners.length) : 0;

            // Batch all Firestore writes
            const batch = db.batch();

            // Close the event
            const eventRef = db.collection('events').doc(currentResultEvent.id);
            batch.update(eventRef, {
                status: 'closed',
                winner: selectedResult,
                closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                gainPerWinner,
                commission
            });

            // Save individual bet results
            const betSnap = await db.collection('bets').where('eventId', '==', currentResultEvent.id).get();

            // Build a map of userId -> totalGain
            const userGainMap = {};
            if (gainPerWinner > 0) {
                winners.forEach(w => {
                    if (!userGainMap[w.userId]) userGainMap[w.userId] = 0;
                    userGainMap[w.userId] += gainPerWinner;
                });
            }

            // Update each bet's status
            betSnap.forEach(betDoc => {
                const betData = betDoc.data();
                const isWinner = betData.choice === selectedResult;
                const betRef = db.collection('bets').doc(betDoc.id);
                batch.update(betRef, {
                    status: isWinner ? 'won' : 'lost',
                    gainAmount: isWinner ? gainPerWinner : 0
                });
            });

            // Credit winners' balances
            for (const [userId, gain] of Object.entries(userGainMap)) {
                if (gain > 0) {
                    const userRef = db.collection('users').doc(userId);
                    batch.update(userRef, {
                        balance: firebase.firestore.FieldValue.increment(gain)
                    });
                }
            }

            await batch.commit();

            showToast(
                `Résultat annoncé ! ${winners.length} gagnant(s) ont reçu +${gainPerWinner.toLocaleString()} FCFA chacun.`,
                'success'
            );
            closeResultModal();
            loadPendingResults();
            loadAnnouncedResults();

        } catch (err) {
            console.error('Confirm result error:', err);
            showToast('Erreur: ' + err.message, 'error');
            btn.innerHTML = '<i class="fas fa-trophy"></i> Confirmer le résultat';
            btn.disabled = false;
        }
    }


    // ==================== DELETE EVENT ====================
    let deleteEventId = null;
    let deleteEventStatus = null;

    function openDeleteModal(eventId, triggerEl) {
        deleteEventId = eventId;
        // Try to find question text from the card
        const card = triggerEl ? triggerEl.closest('.event-card') : null;
        const question = card ? (card.querySelector('.event-question') || {}).textContent || '' : '';
        document.getElementById('deleteEventQuestion').textContent = question ? '"' + question.trim().slice(0,80) + (question.length > 80 ? '…' : '') + '"' : '';
        document.getElementById('deleteModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }

    function closeDeleteModal() {
        document.getElementById('deleteModal').classList.remove('active');
        document.body.style.overflow = '';
        deleteEventId = null;
    }

    async function confirmDelete() {
        if (!deleteEventId) return;
        const btn = document.getElementById('confirmDeleteBtn');
        btn.innerHTML = '<span class="loading"></span> Suppression...';
        btn.disabled = true;

        try {
            // Delete the event document
            await db.collection('events').doc(deleteEventId).delete();

            // Delete associated bets
            const betsSnap = await db.collection('bets').where('eventId', '==', deleteEventId).get();
            const batch = db.batch();
            betsSnap.forEach(doc => batch.delete(doc.ref));
            if (!betsSnap.empty) await batch.commit();

            showToast('Événement supprimé avec succès !', 'success');
            closeDeleteModal();
            // Refresh all event lists
            loadActiveEvents();
            loadPendingResults();
            loadAnnouncedResults();
        } catch (err) {
            console.error('Delete error:', err);
            showToast('Erreur de suppression: ' + err.message, 'error');
        } finally {
            btn.innerHTML = '<i class="fas fa-trash"></i> Supprimer';
            btn.disabled = false;
        }
    }

    // ==================== ACTIVE EVENTS LIST (in events tab) ====================
    async function loadActiveEvents() {
        const container = document.getElementById('activeEventsList');
        if (!container) return;
        container.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><i class="fas fa-spinner fa-spin" style="font-size:1.5rem;"></i><p>Chargement...</p></div>';
        try {
            const snap = await db.collection('events').get();
            if (snap.empty) {
                container.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><i class="fas fa-calendar-times"></i><p>Aucun événement</p></div>';
                return;
            }
            const events = snap.docs
                .map(doc => ({ id: doc.id, ...doc.data() }))
                .sort((a, b) => {
                    const da = a.createdAt ? a.createdAt.toMillis() : 0;
                    const db2 = b.createdAt ? b.createdAt.toMillis() : 0;
                    return db2 - da;
                });

            container.innerHTML = events.map(ev => {
                const bets = ev.bets || [];
                const totalBets = bets.length;
                const pot = bets.reduce((s, b) => s + (b.amount || 0), 0);
                const isActive = ev.status === 'active';
                const statusHtml = isActive
                    ? '<span class="status-badge active"><i class="fas fa-circle" style="font-size:.45rem;"></i> Actif</span>'
                    : '<span class="status-badge closed"><i class="fas fa-lock"></i> Terminé</span>';

                return `<div class="event-card">
                    <div class="event-header">
                        <span class="event-category">
                            <i class="fas fa-${getCategoryIcon(ev.category)}"></i>
                            ${ev.category || 'Sport'}
                        </span>
                        ${statusHtml}
                    </div>
                    <div class="event-question">${ev.question}</div>
                    <div class="event-stats">
                        <div class="event-stat"><i class="fas fa-ticket-alt"></i>${totalBets} paris</div>
                        <div class="event-stat"><i class="fas fa-coins"></i>${pot.toLocaleString()} FCFA</div>
                    </div>
                    <div class="event-actions-row">
                        <button class="btn btn-danger btn-sm" onclick="openDeleteModal('${ev.id}', this)">
                            <i class="fas fa-trash"></i> Supprimer
                        </button>
                    </div>
                </div>`;
            }).join('');
        } catch (err) {
            console.error('loadActiveEvents error:', err);
            container.innerHTML = '<div class="empty-state" style="padding:1.5rem;"><i class="fas fa-exclamation-triangle"></i><p>Erreur: ' + err.message + '</p></div>';
        }
    }

    // ==================== MODALS ====================
    function openImageModal(url) {
        document.getElementById('modalImage').src = url;
        document.getElementById('imageModal').classList.add('active');
    }
    function closeImageModal() {
        document.getElementById('imageModal').classList.remove('active');
    }

    // Close modals on outside click
    window.addEventListener('click', function(e) {
        if (e.target.id === 'imageModal') closeImageModal();
        if (e.target.id === 'resultModal') closeResultModal();
        if (e.target.id === 'deleteModal') closeDeleteModal();
    });

    // ==================== TOAST ====================
    function showToast(message, type = 'success') {
        const toast = document.getElementById('toast');
        const icon = toast.querySelector('i');
        document.getElementById('toastMessage').textContent = message;
        toast.className = 'toast show ' + type;
        icon.className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        setTimeout(() => toast.classList.remove('show'), 4000);
    }
