 const firebaseConfig = {
        apiKey: "AIzaSyCPGgtXoDUycykLaTSee0S0yY0tkeJpqKI",
        authDomain: "data-com-a94a8.firebaseapp.com",
        databaseURL: "https://data-com-a94a8-default-rtdb.firebaseio.com",
        projectId: "data-com-a94a8",
        storageBucket: "data-com-a94a8.firebasestorage.app",
        messagingSenderId: "276904640935",
        appId: "1:276904640935:web:9cd805aeba6c34c767f682",
        measurementId: "G-FYQCWY5G4S"
    };

    firebase.initializeApp(firebaseConfig);
    const db = firebase.firestore();
    const messaging = firebase.messaging();
    const vapidKey = "PViQXia_vvFLKMAe2E2q5oTOX48XpRQIdx5P4xAFEPw";

    let currentUser = null;
    let currentResultEvent = null;
    let selectedResult = null;
    let notifications = [];

    // ── Sidebar ──
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    // ── Notifications ──
    function toggleNotifPanel() {
        const panel = document.getElementById('notifPanel');
        const ov = document.getElementById('notifOverlay');
        const isOpen = panel.classList.contains('active');
        if (isOpen) { closeNotifPanel(); } else {
            panel.classList.add('active');
            ov.classList.add('active');
            renderNotifications();
        }
    }
    function closeNotifPanel() {
        document.getElementById('notifPanel').classList.remove('active');
        document.getElementById('notifOverlay').classList.remove('active');
    }

    function renderNotifications() {
        const list = document.getElementById('notifList');
        if (!notifications.length) {
            list.innerHTML = '<div class="empty"><i class="fas fa-bell-slash"></i><p>Aucune notification</p></div>';
            return;
        }
        list.innerHTML = notifications.map(n => `
            <div class="notif-item ${n.type}">
                <div class="notif-item-title">${n.title}</div>
                <div class="notif-item-msg">${n.message}</div>
                <div class="notif-item-time">${n.time}</div>
            </div>
        `).join('');
    }

    function addNotification(title, message, type = 'info') {
        notifications.unshift({ id: Date.now(), title, message, type, read: false, time: new Date().toLocaleTimeString('fr-FR') });
        updateBadge();
    }
    function updateBadge() {
        const count = notifications.filter(n => !n.read).length;
        ['badgeDot','badgeDotDesktop'].forEach(id => {
            const el = document.getElementById(id);
            if (el) el.style.display = count > 0 ? 'block' : 'none';
        });
    }

    // ── FCM ──
    function initMessaging() {
        if (!('serviceWorker' in navigator)) return;
        navigator.serviceWorker.register('firebase-messaging-sw.js').then(reg => {
            messaging.getToken({ vapidKey, serviceWorkerRegistration: reg })
                .then(token => { if (token && currentUser) saveToken(token); })
                .catch(console.error);
        }).catch(console.error);

        messaging.onMessage(payload => {
            addNotification(payload.notification.title, payload.notification.body, 'info');
            showToast(payload.notification.body, 'success');
        });
    }

    function saveToken(token) {
        db.collection('users').doc(currentUser.id).update({
            fcmToken: token,
            tokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
        }).catch(console.error);
    }

    // ── Tabs ──
    function showTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const tabBtns = document.querySelectorAll('.tab-btn');
        const tabNames = ['overview','events','results','users','deposits'];
        const idx = tabNames.indexOf(tab);
        if (idx >= 0 && tabBtns[idx]) tabBtns[idx].classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));
        const pane = document.getElementById(tab + 'Pane');
        if (pane) pane.classList.add('active');

        if (tab === 'events') loadEventsTable();
        if (tab === 'users') loadUsersTable();
        if (tab === 'deposits') loadDepositsTable();
        if (tab === 'results') { loadPendingResults(); loadAnnouncedResults(); }
    }

    // ── Auth ──
    document.addEventListener('DOMContentLoaded', () => {
        checkAuth();
        Notification.requestPermission().then(p => { if (p === 'granted') initMessaging(); });
    });

    function checkAuth() {
        const user = JSON.parse(sessionStorage.getItem('currentUser'));
        if (!user || (user.role !== 'admin' && user.role !== 'creator')) {
            window.location.href = 'index.html'; return;
        }
        currentUser = user;
        document.getElementById('userAvatar').textContent = currentUser.prenom.charAt(0).toUpperCase();
        document.getElementById('userName').textContent = currentUser.prenom + ' ' + currentUser.nom;
        updateStats(); loadRecentEvents(); loadRecentDeposits();
        loadEventsTable(); loadUsersTable(); loadDepositsTable();
        calculateCommission(); loadPendingResults(); loadAnnouncedResults();
    }

    // ── Stats ──
    function updateStats() {
        db.collection('users').get().then(s => document.getElementById('statUsers').textContent = s.size);
        db.collection('events').where('status','==','active').get().then(s => document.getElementById('statEvents').textContent = s.size);
        db.collection('bets').get().then(s => {
            document.getElementById('statBets').textContent = s.size;
            let pot = 0;
            s.forEach(d => pot += d.data().amount || 0);
            document.getElementById('statPot').textContent = pot.toLocaleString();
        });
    }

    function calculateCommission() {
        db.collection('events').where('status','==','closed').get().then(s => {
            let total = 0;
            s.forEach(d => {
                const ev = d.data();
                if (ev.winner && ev.bets) {
                    const loserTotal = ev.bets.filter(b => b.choice !== ev.winner).reduce((sum,b) => sum + b.amount, 0);
                    total += loserTotal * 0.02;
                }
            });
            document.getElementById('totalCommission').textContent = Math.floor(total).toLocaleString() + ' FCFA';
        });
    }

    // ── Utils ──
    function getCatIcon(cat) {
        return { sport:'futbol', politique:'landmark', entertainment:'film', crypto:'bitcoin', autre:'tag' }[cat] || 'tag';
    }

    function fmt(n) { return (n||0).toLocaleString(); }

    // ── Recent Events ──
    function loadRecentEvents() {
        db.collection('events').get().then(snap => {
            const container = document.getElementById('recentEventsList');
            if (snap.empty) { container.innerHTML = '<div class="empty"><i class="fas fa-calendar-plus"></i><p>Aucun événement</p></div>'; return; }
            let events = snap.docs.map(d => ({id:d.id,...d.data()}))
                .sort((a,b) => (b.createdAt?.toMillis()||0) - (a.createdAt?.toMillis()||0))
                .slice(0,3);
            container.innerHTML = events.map(ev => eventCardHTML(ev)).join('');
        }).catch(console.error);
    }

    function eventCardHTML(ev) {
        const yes = (ev.bets||[]).filter(b=>b.choice==='yes');
        const no  = (ev.bets||[]).filter(b=>b.choice==='no');
        const pot = (ev.bets||[]).reduce((s,b)=>s+b.amount,0);
        return `
        <div class="event-card">
            <div class="event-card-top">
                <span class="cat-tag"><i class="fas fa-${getCatIcon(ev.category)}"></i> ${ev.category||'sport'}</span>
                <span class="badge ${ev.status}">${ev.status==='active'?'Actif':'Clôturé'}</span>
            </div>
            <div class="event-q">${ev.question}</div>
            <div class="event-meta">
                <span class="meta-item yes"><i class="fas fa-check-circle"></i> ${yes.length} OUI</span>
                <span class="meta-item no"><i class="fas fa-times-circle"></i> ${no.length} NON</span>
                <span class="meta-item pot"><i class="fas fa-coins"></i> ${fmt(pot)} FCFA</span>
            </div>
        </div>`;
    }

    // ── Recent Deposits ──
    function loadRecentDeposits() {
        db.collection('deposit_requests').get().then(snap => {
            const container = document.getElementById('recentDepositsList');
            if (snap.empty) { container.innerHTML = '<div class="empty"><i class="fas fa-money-bill-wave"></i><p>Aucun dépôt</p></div>'; return; }
            let deps = snap.docs.map(d=>({id:d.id,...d.data()}))
                .sort((a,b) => (b.createdAt?.toMillis()||0) - (a.createdAt?.toMillis()||0))
                .slice(0,3);
            const labels = { pending:'En attente', approved:'Approuvé', rejected:'Rejeté' };
            container.innerHTML = deps.map(dep => `
                <div class="event-card">
                    <div class="event-card-top">
                        <span class="cat-tag"><i class="fas fa-user"></i> ${dep.userName||'Utilisateur'}</span>
                        <span class="badge ${dep.status}">${labels[dep.status]||dep.status}</span>
                    </div>
                    <div class="event-q">${fmt(dep.amount)} FCFA</div>
                    <div class="event-meta">
                        <span class="meta-item pot"><i class="fas fa-calendar"></i> ${dep.createdAt?dep.createdAt.toDate().toLocaleDateString('fr-FR'):'-'}</span>
                    </div>
                </div>
            `).join('');
        }).catch(console.error);
    }

    // ── Events Table ──
    function loadEventsTable() {
        db.collection('events').get().then(snap => {
            const tbody = document.getElementById('eventsTableBody');
            if (snap.empty) { tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;padding:2rem;color:var(--text-muted);">Aucun événement</td></tr>'; return; }
            let events = snap.docs.map(d=>({id:d.id,...d.data()}))
                .sort((a,b) => (b.createdAt?.toMillis()||0) - (a.createdAt?.toMillis()||0));
            tbody.innerHTML = events.map(({id,...ev}) => {
                const yes = (ev.bets||[]).filter(b=>b.choice==='yes').length;
                const no  = (ev.bets||[]).filter(b=>b.choice==='no').length;
                const pot = (ev.bets||[]).reduce((s,b)=>s+b.amount,0);
                return `<tr>
                    <td style="color:var(--text-muted);font-size:0.75rem;">#${id.substr(-6)}</td>
                    <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${ev.question}</td>
                    <td>${ev.category||'sport'}</td>
                    <td style="color:var(--success);">${yes}</td>
                    <td style="color:var(--danger);">${no}</td>
                    <td style="color:var(--text);">${fmt(pot)}</td>
                    <td><span class="badge ${ev.status}">${ev.status==='active'?'Actif':'Clôturé'}</span></td>
                    <td>
                        <div class="actions">
                            <button class="act-btn view" onclick="viewEvent('${id}')" title="Voir"><i class="fas fa-eye"></i></button>
                            ${ev.status==='active'?`<button class="act-btn result" onclick="openResultModal('${id}')" title="Résultat"><i class="fas fa-trophy"></i></button>`:''}
                            <button class="act-btn del" onclick="deleteEvent('${id}')" title="Supprimer"><i class="fas fa-trash"></i></button>
                        </div>
                    </td>
                </tr>`;
            }).join('');
        }).catch(console.error);
    }

    // ── Pending Results ──
    function loadPendingResults() {
        db.collection('events').where('status','==','active').get().then(snap => {
            const container = document.getElementById('pendingResultsList');
            if (snap.empty) {
                container.innerHTML = '<div class="empty"><i class="fas fa-check-circle" style="color:var(--success);opacity:1;"></i><h4>Aucun en attente</h4><p>Tous les résultats ont été annoncés</p></div>';
                return;
            }
            let events = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
            container.innerHTML = events.map(ev => {
                const yes = (ev.bets||[]).filter(b=>b.choice==='yes');
                const no  = (ev.bets||[]).filter(b=>b.choice==='no');
                const pot = (ev.bets||[]).reduce((s,b)=>s+b.amount,0);
                return `
                <div class="event-card">
                    <div class="event-card-top">
                        <span class="cat-tag"><i class="fas fa-${getCatIcon(ev.category)}"></i> ${ev.category||'sport'}</span>
                        <span class="badge active">En cours</span>
                    </div>
                    <div class="event-q">${ev.question}</div>
                    <div class="event-meta" style="margin-bottom:0.875rem;">
                        <span class="meta-item yes"><i class="fas fa-check-circle"></i> ${yes.length} OUI (${fmt(yes.reduce((s,b)=>s+b.amount,0))} FCFA)</span>
                        <span class="meta-item no"><i class="fas fa-times-circle"></i> ${no.length} NON (${fmt(no.reduce((s,b)=>s+b.amount,0))} FCFA)</span>
                        <span class="meta-item pot"><i class="fas fa-coins"></i> ${fmt(pot)} FCFA</span>
                    </div>
                    <button class="btn btn-success" onclick="openResultModal('${ev.id}')" style="width:100%;justify-content:center;">
                        <i class="fas fa-trophy"></i> Annoncer le résultat
                    </button>
                </div>`;
            }).join('');
        }).catch(err => {
            document.getElementById('pendingResultsList').innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i><h4>Erreur</h4><p>${err.message}</p></div>`;
        });
    }

    // ── Announced Results ──
    function loadAnnouncedResults() {
        db.collection('events').where('status','==','closed').get().then(snap => {
            const container = document.getElementById('announcedResultsList');
            if (snap.empty) { container.innerHTML = '<div class="empty"><i class="fas fa-history"></i><h4>Aucun résultat annoncé</h4><p>Les résultats apparaîtront ici</p></div>'; return; }
            let events = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.closedAt?.toMillis()||0)-(a.closedAt?.toMillis()||0));
            container.innerHTML = events.map(ev => {
                const yes = (ev.bets||[]).filter(b=>b.choice==='yes');
                const no  = (ev.bets||[]).filter(b=>b.choice==='no');
                const winners = ev.winner==='yes'?yes:no;
                const losers  = ev.winner==='yes'?no:yes;
                const loserTotal = losers.reduce((s,b)=>s+b.amount,0);
                const comm = loserTotal*0.02;
                const gain = winners.length ? (loserTotal-comm)/winners.length : 0;
                return `
                <div class="event-card" style="border-left:3px solid ${ev.winner==='yes'?'var(--success)':'var(--danger)'};">
                    <div class="event-card-top">
                        <span class="cat-tag"><i class="fas fa-${getCatIcon(ev.category)}"></i> ${ev.category||'sport'}</span>
                        <span class="badge closed">Terminé</span>
                    </div>
                    <div class="event-q">${ev.question}</div>
                    <div class="summary-box" style="margin-top:0.75rem;">
                        <div class="summary-row">
                            <span class="summary-key">Résultat</span>
                            <span class="summary-val" style="color:${ev.winner==='yes'?'var(--success)':'var(--danger)'};">${ev.winner==='yes'?'OUI':'NON'}</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-key">Gagnants</span>
                            <span class="summary-val" style="color:var(--success);">${winners.length} personnes</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-key">Perdants</span>
                            <span class="summary-val" style="color:var(--danger);">${losers.length} personnes</span>
                        </div>
                        <div class="summary-row">
                            <span class="summary-key">Gain/gagnant</span>
                            <span class="summary-val" style="color:var(--success);">+${fmt(Math.floor(gain))} FCFA</span>
                        </div>
                    </div>
                </div>`;
            }).join('');
        }).catch(err => {
            document.getElementById('announcedResultsList').innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i><h4>Erreur</h4><p>${err.message}</p></div>`;
        });
    }

    // ── Users Table ──
    function loadUsersTable() {
        db.collection('users').get().then(snap => {
            const tbody = document.getElementById('usersTableBody');
            if (snap.empty) { tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:2rem;color:var(--text-muted);">Aucun utilisateur</td></tr>'; return; }
            Promise.all(snap.docs.map(doc =>
                db.collection('bets').where('userId','==',doc.id).get().then(bs => ({ u:doc.data(), id:doc.id, bc:bs.size }))
            )).then(rows => {
                tbody.innerHTML = rows.map(({u,id,bc}) => `<tr>
                    <td style="color:var(--text-muted);font-size:0.75rem;">#${id.substr(-6)}</td>
                    <td>${u.prenom} ${u.nom}</td>
                    <td style="color:var(--primary-light);">@${u.pseudo}</td>
                    <td>${u.contact}</td>
                    <td style="color:var(--success);">${fmt(u.balance||0)}</td>
                    <td>${bc}</td>
                    <td>${u.createdAt?u.createdAt.toDate().toLocaleDateString('fr-FR'):'-'}</td>
                </tr>`).join('');
            });
        }).catch(console.error);
    }

    // ── Deposits Table ──
    function loadDepositsTable() {
        db.collection('deposit_requests').get().then(snap => {
            const tbody = document.getElementById('depositsTableBody');
            if (snap.empty) { tbody.innerHTML = '<tr><td colspan="6" style="text-align:center;padding:2rem;color:var(--text-muted);">Aucun dépôt</td></tr>'; return; }
            const labels = { pending:'En attente', approved:'Approuvé', rejected:'Rejeté' };
            let deps = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
            tbody.innerHTML = deps.map(({id,...d}) => `<tr>
                <td style="color:var(--text-muted);font-size:0.75rem;">#${id.substr(-6)}</td>
                <td>${d.userName||'Inconnu'}</td>
                <td style="color:var(--text);">${fmt(d.amount)} FCFA</td>
                <td>${d.createdAt?d.createdAt.toDate().toLocaleDateString('fr-FR'):'-'}</td>
                <td><span class="badge ${d.status}">${labels[d.status]||d.status}</span></td>
                <td><div class="actions"><button class="act-btn view" onclick="window.open('anit.html','_blank')"><i class="fas fa-eye"></i></button></div></td>
            </tr>`).join('');
        }).catch(console.error);
    }

    // ── Event Modal ──
    function openEventModal() {
        const d = new Date(); d.setDate(d.getDate()+7);
        d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
        document.getElementById('eventEndDate').value = d.toISOString().slice(0,16);
        document.getElementById('eventModal').classList.add('active');
    }
    function closeEventModal() {
        document.getElementById('eventModal').classList.remove('active');
        document.getElementById('eventForm').reset();
    }

    function createEvent(e) {
        e.preventDefault();
        const btn = document.getElementById('createEventBtn');
        btn.innerHTML = '<span class="spin"></span> Création…'; btn.disabled = true;
        db.collection('events').add({
            question: document.getElementById('eventQuestion').value,
            category: document.getElementById('eventCategory').value,
            minBet:   parseInt(document.getElementById('eventMinBet').value),
            endDate:  document.getElementById('eventEndDate').value,
            description: document.getElementById('eventDescription').value,
            status: 'active', bets: [],
            createdAt: firebase.firestore.FieldValue.serverTimestamp(),
            createdBy: currentUser.id
        }).then(() => {
            showToast('Événement créé avec succès !', 'success');
            closeEventModal(); updateStats(); loadRecentEvents(); loadEventsTable(); loadPendingResults();
            btn.innerHTML = '<i class="fas fa-plus"></i> Créer l\'événement'; btn.disabled = false;
        }).catch(err => {
            showToast('Erreur: ' + err.message, 'error');
            btn.innerHTML = '<i class="fas fa-plus"></i> Créer l\'événement'; btn.disabled = false;
        });
    }

    // ── Result Modal ──
    function openResultModal(eventId) {
        db.collection('events').doc(eventId).get().then(doc => {
            if (!doc.exists) { showToast('Événement introuvable', 'error'); return; }
            currentResultEvent = { id: doc.id, ...doc.data() };
            selectedResult = null;
            const yes = (currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
            const no  = (currentResultEvent.bets||[]).filter(b=>b.choice==='no');
            const yesT = yes.reduce((s,b)=>s+b.amount,0);
            const noT  = no.reduce((s,b)=>s+b.amount,0);
            document.getElementById('resultEventSummary').innerHTML = `
                <div class="summary-row"><span class="summary-key">Question</span><span class="summary-val" style="max-width:60%;text-align:right;">${currentResultEvent.question}</span></div>
                <div class="summary-row"><span class="summary-key">Paris OUI</span><span class="summary-val" style="color:var(--success);">${yes.length} (${fmt(yesT)} FCFA)</span></div>
                <div class="summary-row"><span class="summary-key">Paris NON</span><span class="summary-val" style="color:var(--danger);">${no.length} (${fmt(noT)} FCFA)</span></div>
                <div class="summary-row"><span class="summary-key">Pot total</span><span class="summary-val">${fmt(yesT+noT)} FCFA</span></div>`;
            document.querySelectorAll('.result-opt').forEach(el => el.classList.remove('selected','yes','no'));
            document.getElementById('resultPreview').style.display = 'none';
            document.getElementById('confirmResultBtn').disabled = true;
            document.getElementById('resultModal').classList.add('active');
        }).catch(err => showToast('Erreur: '+err.message,'error'));
    }
    function closeResultModal() {
        document.getElementById('resultModal').classList.remove('active');
        currentResultEvent = null; selectedResult = null;
    }

    function selectResult(result) {
        selectedResult = result;
        document.querySelectorAll('.result-opt').forEach(el => el.classList.remove('selected','yes','no'));
        document.querySelector(`.result-opt.${result}-opt`).classList.add('selected', result);
        const yes = (currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
        const no  = (currentResultEvent.bets||[]).filter(b=>b.choice==='no');
        const winners = result==='yes'?yes:no;
        const losers  = result==='yes'?no:yes;
        const loserTotal = losers.reduce((s,b)=>s+b.amount,0);
        const comm = loserTotal*0.02;
        const redist = loserTotal-comm;
        const gain = winners.length ? redist/winners.length : 0;
        document.getElementById('winnersCount').textContent = winners.length;
        document.getElementById('losersCount').textContent = losers.length;
        document.getElementById('redistributionAmount').textContent = fmt(Math.floor(redist))+' FCFA';
        document.getElementById('commissionAmount').textContent = fmt(Math.floor(comm))+' FCFA';
        document.getElementById('gainPerWinner').textContent = '+'+fmt(Math.floor(gain))+' FCFA';
        document.getElementById('resultPreview').style.display = 'block';
        document.getElementById('confirmResultBtn').disabled = false;
    }

    function confirmResult() {
        if (!selectedResult||!currentResultEvent) return;
        const btn = document.getElementById('confirmResultBtn');
        btn.innerHTML = '<span class="spin"></span> Traitement…'; btn.disabled = true;
        const yes = (currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
        const no  = (currentResultEvent.bets||[]).filter(b=>b.choice==='no');
        const winners = selectedResult==='yes'?yes:no;
        const losers  = selectedResult==='yes'?no:yes;
        const loserTotal = losers.reduce((s,b)=>s+b.amount,0);
        const comm = loserTotal*0.02;
        const redist = loserTotal-comm;
        const gain = winners.length ? redist/winners.length : 0;
        const batch = db.batch();
        batch.update(db.collection('events').doc(currentResultEvent.id), {
            status:'closed', winner:selectedResult,
            closedAt:firebase.firestore.FieldValue.serverTimestamp(),
            commission:comm, redistribution:redist
        });
        winners.forEach(wb => {
            batch.update(db.collection('users').doc(wb.userId), { balance:firebase.firestore.FieldValue.increment(wb.amount+gain) });
            db.collection('bets').where('userId','==',wb.userId).where('eventId','==',currentResultEvent.id).get()
                .then(s=>s.forEach(d=>batch.update(d.ref,{status:'won',gain,result:selectedResult,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})));
        });
        losers.forEach(lb => {
            db.collection('bets').where('userId','==',lb.userId).where('eventId','==',currentResultEvent.id).get()
                .then(s=>s.forEach(d=>batch.update(d.ref,{status:'lost',gain:0,result:selectedResult,updatedAt:firebase.firestore.FieldValue.serverTimestamp()})));
        });
        batch.commit().then(() => {
            showToast('Résultat annoncé ! Gains distribués.', 'success');
            addNotification('Résultat annoncé', `"${currentResultEvent.question}" → ${selectedResult==='yes'?'OUI':'NON'}`, 'success');
            closeResultModal(); loadRecentEvents(); loadEventsTable();
            loadPendingResults(); loadAnnouncedResults(); calculateCommission();
            btn.innerHTML = '<i class="fas fa-trophy"></i> Confirmer le résultat'; btn.disabled = false;
        }).catch(err => {
            showToast('Erreur: '+err.message, 'error');
            btn.innerHTML = '<i class="fas fa-trophy"></i> Confirmer le résultat'; btn.disabled = false;
        });
    }

    function viewEvent(id) {
        db.collection('events').doc(id).get().then(doc => {
            if (!doc.exists) return;
            const ev = doc.data();
            const yes = (ev.bets||[]).filter(b=>b.choice==='yes');
            const no  = (ev.bets||[]).filter(b=>b.choice==='no');
            alert(`#${id.substr(-6)}\n\n${ev.question}\nCatégorie: ${ev.category}\nStatut: ${ev.status}\n\nOUI: ${yes.length} (${fmt(yes.reduce((s,b)=>s+b.amount,0))} FCFA)\nNON: ${no.length} (${fmt(no.reduce((s,b)=>s+b.amount,0))} FCFA)\nPot: ${fmt((ev.bets||[]).reduce((s,b)=>s+b.amount,0))} FCFA`);
        });
    }

    function deleteEvent(id) {
        if (!confirm('Supprimer cet événement ?')) return;
        db.collection('events').doc(id).delete().then(() => {
            showToast('Événement supprimé', 'success');
            loadRecentEvents(); loadEventsTable(); loadPendingResults(); updateStats();
        }).catch(err => showToast('Erreur: '+err.message,'error'));
    }

    function showToast(msg, type='success') {
        const toast = document.getElementById('toast');
        toast.querySelector('i').className = type==='success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        document.getElementById('toastMsg').textContent = msg;
        toast.className = 'toast show ' + type;
        setTimeout(() => toast.classList.remove('show'), 3500);
    }

    function logout() {
        sessionStorage.removeItem('currentUser');
        showToast('Déconnexion réussie', 'success');
        setTimeout(() => window.location.href = 'index.html', 1000);
    }
