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

    const cloudinaryConfig = { cloudName:'djxcqczh1', uploadPreset:'database' };

    let uploadedImageUrl = '';
    let currentResultEvent = null;
    let selectedResult = null;

    // ── Sidebar ──
    function toggleSidebar() {
        document.getElementById('sidebar').classList.toggle('open');
        document.getElementById('sidebarOverlay').classList.toggle('active');
    }
    function closeSidebar() {
        document.getElementById('sidebar').classList.remove('open');
        document.getElementById('sidebarOverlay').classList.remove('active');
    }

    // ── Tabs ──
    function showTab(tab) {
        document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
        const tabNames = ['deposits','new-deposit','events','results'];
        const idx = tabNames.indexOf(tab);
        const btns = document.querySelectorAll('.tab-btn');
        if (idx >= 0 && btns[idx]) btns[idx].classList.add('active');

        document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
        document.querySelectorAll('.tab-pane').forEach(p => p.classList.remove('active'));

        // Map tab name to pane id (new-deposit → new-depositPane)
        const pane = document.getElementById(tab + 'Pane');
        if (pane) pane.classList.add('active');

        if (tab === 'deposits') { loadPendingDeposits(); updateStats(); }
        if (tab === 'results') { loadPendingResults(); loadAnnouncedResults(); }
    }

    // ── Init ──
    document.addEventListener('DOMContentLoaded', () => {
        loadPendingDeposits();
        loadUserSelect();
        updateStats();
        loadPendingResults();
        loadAnnouncedResults();
        const d = new Date();
        d.setDate(d.getDate() + 7);
        d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
        document.getElementById('eventEndDate').value = d.toISOString().slice(0, 16);
    });

    // ── Helpers ──
    function fmt(n) { return (n||0).toLocaleString(); }

    function getCatIcon(cat) {
        return {sport:'futbol',politique:'landmark',entertainment:'film',crypto:'bitcoin',autre:'tag'}[cat]||'tag';
    }

    function showToast(msg, type='success') {
        const t = document.getElementById('toast');
        t.querySelector('i').className = type === 'success' ? 'fas fa-check-circle' : 'fas fa-exclamation-circle';
        document.getElementById('toastMsg').textContent = msg;
        t.className = 'toast show ' + type;
        setTimeout(() => t.classList.remove('show'), 3500);
    }

    // ── Stats ──
    function updateStats() {
        db.collection('deposit_requests').where('status','==','pending').get()
            .then(s => document.getElementById('statPending').textContent = s.size);
        db.collection('deposit_requests').where('status','==','approved').get()
            .then(s => {
                document.getElementById('statApproved').textContent = s.size;
                let total = 0;
                s.forEach(d => total += d.data().amount || 0);
                document.getElementById('statTotal').textContent = fmt(total);
            });
    }

    // ── Pending Deposits ──
    function loadPendingDeposits() {
        const container = document.getElementById('pendingDepositsList');
        container.innerHTML = '<div class="empty" style="grid-column:1/-1;"><i class="fas fa-circle-notch fa-spin"></i><p>Chargement…</p></div>';

        db.collection('deposit_requests').where('status','==','pending').get()
            .then(snap => {
                if (snap.empty) {
                    container.innerHTML = '<div class="empty" style="grid-column:1/-1;"><i class="fas fa-check-circle" style="opacity:1;color:var(--success);"></i><h4>Aucun dépôt en attente</h4><p>Tous les dépôts ont été traités</p></div>';
                    return;
                }
                let deps = snap.docs.map(d=>({id:d.id,...d.data()}))
                    .sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));

                container.innerHTML = deps.map(dep => {
                    const name = dep.userName || 'Inconnu';
                    const initials = name.split(' ').map(n=>n[0]||'').join('').toUpperCase().slice(0,2);
                    const date = dep.createdAt ? dep.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                    return `
                    <div class="dep-card">
                        <div class="dep-top">
                            <div class="dep-user">
                                <div class="dep-avatar">${initials}</div>
                                <div class="dep-user-info">
                                    <div class="dep-name">${name}</div>
                                    <div class="dep-email">${dep.userEmail||'Pas d\'email'}</div>
                                </div>
                            </div>
                            <div class="dep-amount">+${fmt(dep.amount)} FCFA</div>
                        </div>
                        <div class="dep-details">
                            <div class="dep-detail">
                                <span class="dep-key">Téléphone</span>
                                <span class="dep-val">${dep.phone||'-'}</span>
                            </div>
                            <div class="dep-detail">
                                <span class="dep-key">Date</span>
                                <span class="dep-val">${date}</span>
                            </div>
                            ${dep.comment ? `<div class="dep-detail"><span class="dep-key">Commentaire</span><span class="dep-val">${dep.comment}</span></div>` : ''}
                            <div class="dep-detail">
                                <span class="dep-key">Statut</span>
                                <span class="badge pending">En attente</span>
                            </div>
                        </div>
                        ${dep.screenshotURL ? `<img src="${dep.screenshotURL}" class="dep-screenshot" onclick="openImageModal('${dep.screenshotURL}')" alt="Capture">` : ''}
                        <div class="dep-actions">
                            <button class="btn btn-success" onclick="approveDeposit('${dep.id}')">
                                <i class="fas fa-check"></i> Approuver
                            </button>
                            <button class="btn btn-danger" onclick="rejectDeposit('${dep.id}')">
                                <i class="fas fa-times"></i> Rejeter
                            </button>
                        </div>
                    </div>`;
                }).join('');
            })
            .catch(err => {
                container.innerHTML = `<div class="empty" style="grid-column:1/-1;"><i class="fas fa-exclamation-triangle"></i><h4>Erreur</h4><p>${err.message}</p></div>`;
            });
    }

    // ── User Select ──
    function loadUserSelect() {
        db.collection('users').get().then(snap => {
            const sel = document.getElementById('depositUser');
            snap.forEach(doc => {
                const u = doc.data();
                const opt = document.createElement('option');
                opt.value = doc.id;
                opt.textContent = `${u.prenom} ${u.nom} (@${u.pseudo})`;
                sel.appendChild(opt);
            });
        });
    }

    // ── Cloudinary ──
    function openCloudinaryWidget() {
        cloudinary.openUploadWidget({
            cloudName: cloudinaryConfig.cloudName,
            uploadPreset: cloudinaryConfig.uploadPreset,
            sources: ['local','url','camera'],
            multiple: false, maxFiles: 1,
            cropping: false, resourceType: 'image',
            styles: {
                palette: {
                    window:'#0d0f1e', windowBorder:'#7c3aed',
                    tabIcon:'#a855f7', menuIcons:'#6b7094',
                    textDark:'#f0f0ff', textLight:'#f0f0ff',
                    link:'#7c3aed', action:'#7c3aed',
                    inactiveTabIcon:'#6b7094', error:'#f43f5e',
                    inProgress:'#7c3aed', complete:'#10b981',
                    sourceBg:'#121428'
                }
            }
        }, (error, result) => {
            if (!error && result && result.event === 'success') {
                uploadedImageUrl = result.info.secure_url;
                document.getElementById('screenshotUrl').value = uploadedImageUrl;
                document.getElementById('previewImage').src = uploadedImageUrl;
                document.getElementById('uploadPreview').style.display = 'block';
                showToast('Image uploadée !', 'success');
            }
        });
    }

    // ── Submit Deposit ──
    function submitDeposit(e) {
        e.preventDefault();
        const btn = document.getElementById('submitDepositBtn');
        btn.innerHTML = '<span class="spin"></span> Soumission…'; btn.disabled = true;

        const userId = document.getElementById('depositUser').value;
        const amount = parseInt(document.getElementById('depositAmount').value);
        const name   = document.getElementById('depositName').value;
        const contact= document.getElementById('depositContact').value;
        const screenshot = document.getElementById('screenshotUrl').value;

        if (!userId) { showToast('Veuillez sélectionner un utilisateur','error'); btn.innerHTML='<i class="fas fa-paper-plane"></i> Soumettre le dépôt'; btn.disabled=false; return; }
        if (!screenshot) { showToast('Veuillez uploader une capture d\'écran','error'); btn.innerHTML='<i class="fas fa-paper-plane"></i> Soumettre le dépôt'; btn.disabled=false; return; }

        db.collection('users').doc(userId).get()
            .then(doc => {
                const u = doc.data();
                return db.collection('deposit_requests').add({
                    userId, amount,
                    userName: u ? `${u.prenom} ${u.nom}` : name,
                    userEmail: u?.email || null,
                    phone: contact, screenshotURL: screenshot,
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });
            })
            .then(() => {
                showToast('Dépôt soumis avec succès !', 'success');
                document.getElementById('depositForm').reset();
                document.getElementById('uploadPreview').style.display = 'none';
                uploadedImageUrl = '';
                loadPendingDeposits(); updateStats();
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre le dépôt'; btn.disabled = false;
            })
            .catch(err => {
                showToast('Erreur: ' + err.message, 'error');
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Soumettre le dépôt'; btn.disabled = false;
            });
    }

    // ── Approve / Reject ──
    function approveDeposit(id) {
        if (!confirm('Approuver ce dépôt ?')) return;
        db.collection('deposit_requests').doc(id).get().then(doc => {
            const dep = doc.data();
            const batch = db.batch();
            batch.update(doc.ref, { status:'approved', processedAt:firebase.firestore.FieldValue.serverTimestamp() });
            batch.update(db.collection('users').doc(dep.userId), { balance:firebase.firestore.FieldValue.increment(dep.amount) });
            return batch.commit();
        }).then(() => {
            showToast('Dépôt approuvé ! Solde mis à jour.', 'success');
            loadPendingDeposits(); updateStats();
        }).catch(err => showToast('Erreur: ' + err.message, 'error'));
    }

    function rejectDeposit(id) {
        if (!confirm('Rejeter ce dépôt ?')) return;
        db.collection('deposit_requests').doc(id).update({
            status:'rejected', processedAt:firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showToast('Dépôt rejeté', 'success');
            loadPendingDeposits(); updateStats();
        }).catch(err => showToast('Erreur: ' + err.message, 'error'));
    }

    // ── Publish Event ──
    function publishEvent(e) {
        e.preventDefault();
        const btn = document.getElementById('publishEventBtn');
        btn.innerHTML = '<span class="spin"></span> Publication…'; btn.disabled = true;
        db.collection('events').add({
            question:    document.getElementById('eventQuestion').value,
            category:    document.getElementById('eventCategory').value,
            minBet:      parseInt(document.getElementById('eventMinBet').value),
            endDate:     document.getElementById('eventEndDate').value,
            description: document.getElementById('eventDescription').value,
            status:'active', bets:[],
            createdAt: firebase.firestore.FieldValue.serverTimestamp()
        }).then(() => {
            showToast('Événement publié !', 'success');
            document.getElementById('eventForm').reset();
            const d = new Date(); d.setDate(d.getDate()+7);
            d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
            document.getElementById('eventEndDate').value = d.toISOString().slice(0,16);
            btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Publier l\'événement'; btn.disabled = false;
            loadPendingResults();
        }).catch(err => {
            showToast('Erreur: ' + err.message, 'error');
            btn.innerHTML = '<i class="fas fa-calendar-plus"></i> Publier l\'événement'; btn.disabled = false;
        });
    }

    // ── Pending Results ──
    function loadPendingResults() {
        db.collection('events').where('status','==','active').get().then(snap => {
            const c = document.getElementById('pendingResultsList');
            if (snap.empty) {
                c.innerHTML = '<div class="empty"><i class="fas fa-check-circle" style="opacity:1;color:var(--success);"></i><h4>Aucun événement en attente</h4><p>Tous les résultats ont été annoncés</p></div>';
                return;
            }
            let events = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.createdAt?.toMillis()||0)-(a.createdAt?.toMillis()||0));
            c.innerHTML = events.map(ev => {
                const yes=(ev.bets||[]).filter(b=>b.choice==='yes');
                const no=(ev.bets||[]).filter(b=>b.choice==='no');
                const pot=(ev.bets||[]).reduce((s,b)=>s+b.amount,0);
                return `
                <div class="event-card">
                    <div class="event-top">
                        <span class="cat-tag"><i class="fas fa-${getCatIcon(ev.category)}"></i> ${ev.category||'sport'}</span>
                        <span class="badge active">En cours</span>
                    </div>
                    <div class="event-q">${ev.question}</div>
                    <div class="event-meta" style="margin-bottom:0.875rem;">
                        <span class="meta-item yes"><i class="fas fa-check-circle"></i> ${yes.length} OUI (${fmt(yes.reduce((s,b)=>s+b.amount,0))} FCFA)</span>
                        <span class="meta-item no"><i class="fas fa-times-circle"></i> ${no.length} NON (${fmt(no.reduce((s,b)=>s+b.amount,0))} FCFA)</span>
                        <span class="meta-item pot"><i class="fas fa-coins"></i> ${fmt(pot)} FCFA</span>
                    </div>
                    <button class="btn btn-success btn-full" onclick="openResultModal('${ev.id}')">
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
            const c = document.getElementById('announcedResultsList');
            if (snap.empty) {
                c.innerHTML = '<div class="empty"><i class="fas fa-history"></i><h4>Aucun résultat annoncé</h4><p>Les résultats apparaîtront ici</p></div>';
                return;
            }
            let events = snap.docs.map(d=>({id:d.id,...d.data()})).sort((a,b)=>(b.closedAt?.toMillis()||0)-(a.closedAt?.toMillis()||0));
            c.innerHTML = events.map(ev => {
                const yes=(ev.bets||[]).filter(b=>b.choice==='yes');
                const no=(ev.bets||[]).filter(b=>b.choice==='no');
                const winners=ev.winner==='yes'?yes:no;
                const losers=ev.winner==='yes'?no:yes;
                const loserTotal=losers.reduce((s,b)=>s+b.amount,0);
                const comm=loserTotal*0.02;
                const gain=winners.length?(loserTotal-comm)/winners.length:0;
                return `
                <div class="event-card" style="border-left:3px solid ${ev.winner==='yes'?'var(--success)':'var(--danger)'};">
                    <div class="event-top">
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

    // ── Result Modal ──
    function openResultModal(eventId) {
        db.collection('events').doc(eventId).get().then(doc => {
            if (!doc.exists) { showToast('Événement introuvable','error'); return; }
            currentResultEvent = { id:doc.id, ...doc.data() };
            selectedResult = null;
            const yes=(currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
            const no=(currentResultEvent.bets||[]).filter(b=>b.choice==='no');
            const yesT=yes.reduce((s,b)=>s+b.amount,0);
            const noT=no.reduce((s,b)=>s+b.amount,0);
            document.getElementById('resultEventSummary').innerHTML = `
                <div class="summary-row"><span class="summary-key">Question</span><span class="summary-val" style="max-width:60%;text-align:right;">${currentResultEvent.question}</span></div>
                <div class="summary-row"><span class="summary-key">Paris OUI</span><span class="summary-val" style="color:var(--success);">${yes.length} (${fmt(yesT)} FCFA)</span></div>
                <div class="summary-row"><span class="summary-key">Paris NON</span><span class="summary-val" style="color:var(--danger);">${no.length} (${fmt(noT)} FCFA)</span></div>
                <div class="summary-row"><span class="summary-key">Pot total</span><span class="summary-val">${fmt(yesT+noT)} FCFA</span></div>`;
            document.querySelectorAll('.result-opt').forEach(el=>el.classList.remove('selected','yes','no'));
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
        document.querySelectorAll('.result-opt').forEach(el=>el.classList.remove('selected','yes','no'));
        document.querySelector(`.result-opt.${result}-opt`).classList.add('selected', result);
        const yes=(currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
        const no=(currentResultEvent.bets||[]).filter(b=>b.choice==='no');
        const winners=result==='yes'?yes:no;
        const losers=result==='yes'?no:yes;
        const loserTotal=losers.reduce((s,b)=>s+b.amount,0);
        const comm=loserTotal*0.02;
        const redist=loserTotal-comm;
        const gain=winners.length?redist/winners.length:0;
        document.getElementById('winnersCount').textContent=winners.length;
        document.getElementById('losersCount').textContent=losers.length;
        document.getElementById('redistributionAmount').textContent=fmt(Math.floor(redist))+' FCFA';
        document.getElementById('commissionAmount').textContent=fmt(Math.floor(comm))+' FCFA';
        document.getElementById('gainPerWinner').textContent='+'+fmt(Math.floor(gain))+' FCFA';
        document.getElementById('resultPreview').style.display='block';
        document.getElementById('confirmResultBtn').disabled=false;
    }

    function confirmResult() {
        if (!selectedResult||!currentResultEvent) return;
        const btn = document.getElementById('confirmResultBtn');
        btn.innerHTML = '<span class="spin"></span> Traitement…'; btn.disabled = true;
        const yes=(currentResultEvent.bets||[]).filter(b=>b.choice==='yes');
        const no=(currentResultEvent.bets||[]).filter(b=>b.choice==='no');
        const winners=selectedResult==='yes'?yes:no;
        const losers=selectedResult==='yes'?no:yes;
        const loserTotal=losers.reduce((s,b)=>s+b.amount,0);
        const comm=loserTotal*0.02;
        const redist=loserTotal-comm;
        const gain=winners.length?redist/winners.length:0;
        const batch=db.batch();
        batch.update(db.collection('events').doc(currentResultEvent.id),{
            status:'closed', winner:selectedResult,
            closedAt:firebase.firestore.FieldValue.serverTimestamp(),
            commission:comm, redistribution:redist
        });
        winners.forEach(wb => {
            batch.update(db.collection('users').doc(wb.userId),{balance:firebase.firestore.FieldValue.increment(wb.amount+gain)});
        });
        batch.commit().then(() => {
            showToast('Résultat annoncé ! Gains distribués.','success');
            closeResultModal(); loadPendingResults(); loadAnnouncedResults();
            btn.innerHTML='<i class="fas fa-trophy"></i> Confirmer le résultat'; btn.disabled=false;
        }).catch(err => {
            showToast('Erreur: '+err.message,'error');
            btn.innerHTML='<i class="fas fa-trophy"></i> Confirmer le résultat'; btn.disabled=false;
        });
    }

    // ── Image Modal ──
    function openImageModal(src) {
        document.getElementById('modalImage').src = src;
        document.getElementById('imageModal').classList.add('active');
    }
    function closeImageModal() {
        document.getElementById('imageModal').classList.remove('active');
    }
