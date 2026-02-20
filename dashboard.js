// ─── Firebase ───
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

    const cloudinary = { cloudName: 'djxcqczh1', uploadPreset: 'database' };

    // ─── State ───
    let currentUser = null, currentEvent = null, currentPrediction = null, currentBetAmount = 100, eventsData = [];

    const carouselSamples = [
        { category: 'sport', question: 'Le Real Madrid remportera-t-il la Liga cette saison ?', date: '15 Juin 2024', image: 'https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=400&h=250&fit=crop' },
        { category: 'music', question: 'Burna Boy gagnera-t-il un Grammy Award ?', date: '20 Juin 2024', image: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=400&h=250&fit=crop' },
        { category: 'crypto', question: 'Le Bitcoin dépassera-t-il 100 000$ cette année ?', date: '30 Juin 2024', image: 'https://images.unsplash.com/photo-1639762681485-074b7f938ba0?w=400&h=250&fit=crop' },
        { category: 'politique', question: 'L\'opposition remportera-t-elle les prochaines élections ?', date: '10 Juil 2024', image: 'https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?w=400&h=250&fit=crop' }
    ];

    // ─── Init ───
    document.addEventListener('DOMContentLoaded', () => { checkAuth(); renderCarousel(); });

    function checkAuth() {
        const s = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
        if (!s) { window.location.href = 'index.html'; return; }
        try {
            currentUser = JSON.parse(s);
            loadUserData(); loadEvents(); loadHistory(); updateStats();
        } catch { window.location.href = 'index.html'; }
    }

    function loadUserData() {
        if (!currentUser) return;
        db.collection('users').doc(currentUser.id).onSnapshot(doc => {
            if (!doc.exists) return;
            const d = doc.data();
            currentUser = { ...currentUser, ...d };
            const store = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
            store.setItem('currentUser', JSON.stringify(currentUser));

            const name = `${d.prenom || ''} ${d.nom || ''}`.trim() || 'Utilisateur';
            const bal = (d.balance || 0).toLocaleString() + ' FCFA';

            document.getElementById('drawerAvatar').textContent = (d.prenom || 'U').charAt(0).toUpperCase();
            document.getElementById('drawerName').textContent = name;
            document.getElementById('drawerPseudo').textContent = '@' + (d.pseudo || 'user');
            document.getElementById('drawerBalance').textContent = bal;
            document.getElementById('topBalance').textContent = bal;
            document.getElementById('heroName').textContent = name;
            document.getElementById('heroBalance').textContent = bal;
            document.getElementById('withdrawalBalance').textContent = bal;
        });
    }

    function updateStats() {
        if (!currentUser) return;
        db.collection('bets').where('userId', '==', currentUser.id).get().then(snap => {
            const all = snap.docs.map(d => d.data());
            const wins = all.filter(b => b.status === 'won').length;
            const active = all.filter(b => b.status === 'pending').length;
            const total = all.reduce((s, b) => s + (b.amount || 0), 0);
            const winrate = all.length ? Math.round((wins / all.length) * 100) : 0;
            document.getElementById('statWins').textContent = wins;
            document.getElementById('statBets').textContent = active;
            document.getElementById('statTotal').textContent = total >= 1000 ? (total/1000).toFixed(1)+'K' : total;
            document.getElementById('statWinrate').textContent = winrate + '%';
        });
    }

    function loadEvents() {
        db.collection('events').where('status', '==', 'active').get().then(snap => {
            eventsData = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            renderEvents();
        }).catch(() => renderEvents());
    }

    function renderEvents() {
        const el = document.getElementById('eventsList');
        if (!eventsData.length) {
            el.innerHTML = `<div class="empty"><i class="fas fa-calendar-times"></i><p>Aucun événement disponible</p></div>`;
            return;
        }
        el.innerHTML = eventsData.map(ev => {
            const yB = ev.bets ? ev.bets.filter(b => b.choice==='yes').length : 0;
            const nB = ev.bets ? ev.bets.filter(b => b.choice==='no').length : 0;
            const pot = ev.bets ? ev.bets.reduce((s,b)=>s+b.amount,0) : 0;
            return `<div class="ev-card">
                <div class="ev-top">
                    <div class="ev-meta">
                        <span class="ev-cat"><i class="fas fa-${catIcon(ev.category)}"></i> ${ev.category||'Sport'}</span>
                        <span class="ev-live"><i class="fas fa-circle"></i> En cours</span>
                    </div>
                    <div class="ev-question">${ev.question}</div>
                </div>
                <div class="ev-odds">
                    <div class="ev-odd yes"><div class="ev-odd-label">OUI</div><div class="ev-odd-val">${yB} pers.</div></div>
                    <div class="ev-odd no"><div class="ev-odd-label">NON</div><div class="ev-odd-val">${nB} pers.</div></div>
                </div>
                <div class="ev-footer">
                    <div class="ev-info">
                        <span><i class="fas fa-coins"></i>${ev.minBet||100} FCFA</span>
                        <span><i class="fas fa-chart-bar"></i>${(pot/1000).toFixed(1)}K</span>
                    </div>
                    <div class="ev-btns">
                        <button class="ev-btn ev-btn-yes" onclick="openBetModal('${ev.id}','yes')"><i class="fas fa-check"></i> OUI</button>
                        <button class="ev-btn ev-btn-no" onclick="openBetModal('${ev.id}','no')"><i class="fas fa-times"></i> NON</button>
                    </div>
                </div>
            </div>`;
        }).join('');
    }

    function catIcon(c) {
        return { sport:'futbol', politique:'landmark', entertainment:'film', crypto:'bitcoin', music:'music' }[c] || 'tag';
    }

    function loadHistory() {
        if (!currentUser) return;
        db.collection('bets').where('userId','==',currentUser.id).orderBy('date','desc').limit(5).get().then(snap => {
            const el = document.getElementById('historyList');
            if (snap.empty) { el.innerHTML=`<div class="empty"><i class="fas fa-history"></i><p>Aucun historique</p></div>`; return; }
            Promise.all(snap.docs.map(doc => {
                const bet = { id:doc.id, ...doc.data() };
                return db.collection('events').doc(bet.eventId).get().then(ed => ({ bet, ev: ed.exists ? ed.data() : null }));
            })).then(res => {
                el.innerHTML = res.map(({bet,ev}) => {
                    const cls = bet.status==='won' ? 'hi-win' : bet.status==='lost' ? 'hi-loss' : 'hi-default';
                    const ic = bet.status==='won' ? 'trophy' : bet.status==='lost' ? 'times-circle' : 'ticket-alt';
                    const amtCls = bet.status==='won' ? 'pos' : 'neg';
                    const pre = bet.status==='won' ? '+' : '-';
                    const dt = bet.date ? bet.date.toDate().toLocaleDateString('fr-FR') : '-';
                    return `<div class="hist-item">
                        <div class="hist-icon ${cls}"><i class="fas fa-${ic}"></i></div>
                        <div class="hist-info">
                            <div class="hist-title">${ev ? ev.question : 'Événement'}</div>
                            <div class="hist-date">${dt}</div>
                        </div>
                        <div class="hist-amount ${amtCls}">${pre}${bet.amount.toLocaleString()} FCFA</div>
                    </div>`;
                }).join('');
            });
        }).catch(() => {
            document.getElementById('historyList').innerHTML = `<div class="empty"><i class="fas fa-exclamation-triangle"></i><p>Erreur de chargement</p></div>`;
        });
    }

    function renderCarousel() {
        const track = document.getElementById('carouselTrack');
        track.innerHTML = [...carouselSamples, ...carouselSamples].map(it => `
            <div class="c-card" onclick="showToast('Bientôt disponible!', 'info')">
                <img src="${it.image}" alt="">
                <div class="c-overlay">
                    <span class="c-tag">${it.category}</span>
                    <div class="c-question">${it.question}</div>
                    <div class="c-date"><i class="fas fa-calendar-alt"></i>${it.date}</div>
                </div>
            </div>`).join('');
    }

    // ─── Navigation ───
    function showSection(sec) {
        document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
        document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
        const map = { 'events':'events-section', 'my-bets':'my-bets-section', 'transactions':'transactions-section' };
        if (map[sec]) document.getElementById(map[sec]).classList.add('active');
        const navEl = document.getElementById('nav-'+sec);
        if (navEl) navEl.classList.add('active');
        if (sec === 'transactions') loadTransactions();
        if (sec === 'my-bets') loadMyBets();
    }

    // ─── Drawer ───
    function openDrawer() {
        document.getElementById('drawer').classList.add('open');
        document.getElementById('drawerOverlay').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeDrawer() {
        document.getElementById('drawer').classList.remove('open');
        document.getElementById('drawerOverlay').classList.remove('active');
        document.body.style.overflow = '';
    }

    // ─── Modals ───
    function openDepositModal() {
        document.getElementById('depositModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeDepositModal() {
        document.getElementById('depositModal').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('depositForm').reset();
    }
    function openWithdrawalModal() {
        if (currentUser) document.getElementById('withdrawalBalance').textContent = (currentUser.balance||0).toLocaleString()+' FCFA';
        document.getElementById('withdrawalModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeWithdrawalModal() {
        document.getElementById('withdrawalModal').classList.remove('active');
        document.body.style.overflow = '';
        document.getElementById('withdrawalForm').reset();
    }

    // ─── Deposit Submit ───
    async function submitDeposit(e) {
        e.preventDefault();
        if (!currentUser) { showToast('Erreur: non connecté', 'error'); return; }
        const btn = document.getElementById('submitDepositBtn');
        btn.innerHTML = '<span class="spinner"></span> Envoi…'; btn.disabled = true;
        const amount = parseInt(document.getElementById('depositAmount').value);
        const phone = document.getElementById('depositPhone').value;
        const tid = document.getElementById('depositTransactionId').value;
        const comment = document.getElementById('depositComment').value;
        const file = document.getElementById('depositScreenshot').files[0];
        try {
            let screenshotURL = null;
            if (file) {
                const fd = new FormData(); fd.append('file', file); fd.append('upload_preset', cloudinary.uploadPreset);
                const r = await fetch(`https://api.cloudinary.com/v1_1/${cloudinary.cloudName}/image/upload`, { method:'POST', body:fd });
                const d = await r.json(); if (d.error) throw new Error(d.error.message);
                screenshotURL = d.secure_url;
            }
            await db.collection('transactions').add({
                userId: currentUser.id, userName: `${currentUser.prenom||''} ${currentUser.nom||''}`.trim(),
                userPseudo: currentUser.pseudo, type:'deposit', amount, phone, transactionId:tid,
                screenshotURL, comment:comment||'', status:'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            showToast('Demande envoyée ! Validation sous 5-15 min.', 'success');
            closeDepositModal();
        } catch(err) { showToast('Erreur: '+err.message, 'error'); }
        finally { btn.innerHTML='<i class="fas fa-check-circle"></i> Envoyer la confirmation'; btn.disabled=false; }
    }

    // ─── Withdrawal Submit ───
    async function submitWithdrawal(e) {
        e.preventDefault();
        if (!currentUser) { showToast('Erreur: non connecté', 'error'); return; }
        const amount = parseInt(document.getElementById('withdrawalAmount').value);
        if (amount > (currentUser.balance||0)) { showToast('Solde insuffisant', 'error'); return; }
        if (amount < 1000) { showToast('Minimum 1 000 FCFA', 'error'); return; }
        const btn = document.getElementById('submitWithdrawalBtn');
        btn.innerHTML = '<span class="spinner"></span> Envoi…'; btn.disabled = true;
        try {
            await db.collection('transactions').add({
                userId: currentUser.id, userName: `${currentUser.prenom||''} ${currentUser.nom||''}`.trim(),
                userPseudo: currentUser.pseudo, type:'withdrawal', amount,
                phone: document.getElementById('withdrawalPhone').value,
                recipientName: document.getElementById('withdrawalName').value,
                reason: document.getElementById('withdrawalReason').value||'',
                status:'pending', createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            await db.collection('users').doc(currentUser.id).update({
                balance: firebase.firestore.FieldValue.increment(-amount),
                pendingWithdrawal: firebase.firestore.FieldValue.increment(amount)
            });
            showToast('Demande de retrait envoyée ! 24-48h.', 'success');
            closeWithdrawalModal();
        } catch(err) { showToast('Erreur: '+err.message, 'error'); }
        finally { btn.innerHTML='<i class="fas fa-paper-plane"></i> Demander le retrait'; btn.disabled=false; }
    }

    // ─── Transactions ───
    function loadTransactions() {
        if (!currentUser) return;
        db.collection('transactions').where('userId','==',currentUser.id).orderBy('createdAt','desc').get().then(snap => {
            const el = document.getElementById('transactionsList');
            if (snap.empty) { el.innerHTML=`<div class="empty"><i class="fas fa-exchange-alt"></i><p>Aucune transaction</p></div>`; return; }
            el.innerHTML = snap.docs.map(doc => {
                const t = doc.data();
                const dep = t.type==='deposit';
                const statMap = { pending:'En attente', completed:'Validé', approved:'Validé', rejected:'Rejeté' };
                const dt = t.createdAt ? t.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                return `<div class="hist-item">
                    <div class="hist-icon ${dep?'hi-win':'hi-loss'}"><i class="fas fa-${dep?'arrow-down':'arrow-up'}"></i></div>
                    <div class="hist-info">
                        <div class="hist-title">${dep?'Dépôt':'Retrait'} – ${statMap[t.status]||'En attente'}</div>
                        <div class="hist-date">${dt}</div>
                    </div>
                    <div class="hist-amount ${dep?'pos':'neg'}">${dep?'+':'-'}${t.amount.toLocaleString()} FCFA</div>
                </div>`;
            }).join('');
        });
    }

    // ─── My Bets ───
    function loadMyBets() {
        if (!currentUser) return;
        db.collection('bets').where('userId','==',currentUser.id).orderBy('date','desc').get().then(snap => {
            const el = document.getElementById('myBetsList');
            if (snap.empty) { el.innerHTML=`<div class="empty"><i class="fas fa-ticket-alt"></i><p>Aucun pari</p></div>`; return; }
            Promise.all(snap.docs.map(doc => {
                const bet = {id:doc.id,...doc.data()};
                return db.collection('events').doc(bet.eventId).get().then(ed => ({bet, ev:ed.exists?ed.data():null}));
            })).then(res => {
                el.innerHTML = res.map(({bet,ev}) => {
                    const sColor = {pending:'var(--yellow)',won:'var(--green)',lost:'var(--red)'}[bet.status]||'var(--muted)';
                    const sText = {pending:'En cours',won:'Gagné',lost:'Perdu'}[bet.status]||bet.status;
                    const cColor = bet.choice==='yes'?'var(--green)':'var(--red)';
                    return `<div class="bet-item">
                        <div class="bet-item-hd">
                            <div class="bet-item-meta">
                                <span class="ev-cat"><i class="fas fa-${catIcon(ev?.category)}"></i> ${ev?.category||'Sport'}</span>
                                <span style="color:${sColor};font-size:.8rem;font-weight:700;">${sText}</span>
                            </div>
                            <div class="bet-item-q">${ev?ev.question:'Événement'}</div>
                        </div>
                        <div class="bet-item-bd">
                            <span>Prédiction: <strong style="color:${cColor}">${bet.choice==='yes'?'OUI':'NON'}</strong></span>
                            <span>Mise: <strong>${bet.amount.toLocaleString()} FCFA</strong></span>
                        </div>
                    </div>`;
                }).join('');
            });
        });
    }

    // ─── Bet Modal ───
    function openBetModal(eventId, prediction) {
        currentEvent = eventsData.find(e => e.id === eventId);
        if (!currentEvent) return;
        currentPrediction = prediction; currentBetAmount = 100;
        document.getElementById('betSlider').value = 100;
        document.getElementById('betAmountDisplay').textContent = '100 FCFA';
        setPrediction(prediction); updatePotentialWin();
        document.getElementById('betModal').classList.add('active');
        document.body.style.overflow = 'hidden';
    }
    function closeBetModal() {
        document.getElementById('betModal').classList.remove('active');
        document.body.style.overflow = ''; currentEvent=null; currentPrediction=null;
    }
    function updateBetAmount(v) {
        currentBetAmount = parseInt(v);
        document.getElementById('betAmountDisplay').textContent = currentBetAmount.toLocaleString()+' FCFA';
        updatePotentialWin();
    }
    function setBetAmount(v) { document.getElementById('betSlider').value=v; updateBetAmount(v); }
    function setPrediction(p) {
        currentPrediction = p;
        document.getElementById('btnYes').classList.toggle('active', p==='yes');
        document.getElementById('btnNo').classList.toggle('active', p==='no');
        updatePotentialWin();
    }
    function updatePotentialWin() {
        if (!currentEvent) return;
        const bets = currentEvent.bets || [];
        const yT = bets.filter(b=>b.choice==='yes').reduce((s,b)=>s+b.amount,0);
        const nT = bets.filter(b=>b.choice==='no').reduce((s,b)=>s+b.amount,0);
        const losingPool = currentPrediction==='yes' ? nT : yT;
        const winners = bets.filter(b=>b.choice===currentPrediction).length + 1;
        const win = winners > 0 ? Math.floor((losingPool*.98) / winners) : 0;
        document.getElementById('potentialWin').textContent = '+'+win.toLocaleString()+' FCFA';
    }

    function placeBet() {
        if (!currentUser || !currentEvent || !currentPrediction) return;
        const btn = document.getElementById('placeBetBtn');
        btn.innerHTML='<span class="spinner"></span> Traitement…'; btn.disabled=true;
        if ((currentUser.balance||0) < currentBetAmount) {
            showToast('Solde insuffisant. Effectuez un dépôt.','error');
            btn.innerHTML='<i class="fas fa-check-circle"></i> Confirmer le pari'; btn.disabled=false; return;
        }
        const batch = db.batch();
        batch.update(db.collection('users').doc(currentUser.id), { balance: firebase.firestore.FieldValue.increment(-currentBetAmount) });
        batch.set(db.collection('bets').doc(), { userId:currentUser.id, eventId:currentEvent.id, choice:currentPrediction, amount:currentBetAmount, status:'pending', date:firebase.firestore.FieldValue.serverTimestamp() });
        batch.update(db.collection('events').doc(currentEvent.id), { bets: firebase.firestore.FieldValue.arrayUnion({ userId:currentUser.id, choice:currentPrediction, amount:currentBetAmount }) });
        batch.commit().then(() => {
            showToast('Pari placé avec succès !','success');
            closeBetModal(); loadUserData(); loadEvents(); loadHistory(); updateStats();
        }).catch(err => showToast('Erreur: '+err.message,'error'))
        .finally(() => { btn.innerHTML='<i class="fas fa-check-circle"></i> Confirmer le pari'; btn.disabled=false; });
    }

    // ─── Toast ───
    function showToast(msg, type='success') {
        const t = document.getElementById('toast');
        const icons = {success:'fa-check-circle',error:'fa-exclamation-circle',info:'fa-info-circle'};
        t.querySelector('i').className = 'fas ' + (icons[type]||icons.success);
        document.getElementById('toastMsg').textContent = msg;
        t.className = 'toast show ' + type;
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    // ─── Logout ───
    function logout() {
        sessionStorage.removeItem('currentUser'); localStorage.removeItem('currentUser');
        showToast('Déconnexion réussie','success');
        setTimeout(() => window.location.href='index.html', 1000);
    }

    // Close modals on outside tap
    window.addEventListener('click', e => {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.remove('active');
            document.body.style.overflow='';
        }
    });
