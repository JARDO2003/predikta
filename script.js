// Firebase Configuration
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

        // Cloudinary Configuration
        const cloudinaryConfig = {
            cloudName: 'djxcqczh1',
            uploadPreset: 'database'
        };

        // Global Variables
        let currentUser = null;
        let currentEvent = null;
        let currentPrediction = null;
        let currentBetAmount = 100;
        let eventsData = [];

        // Carousel Sample Data
        const carouselSamples = [
            {
                category: 'sport',
                question: 'Le Real Madrid remportera-t-il la Liga cette saison ?',
                date: '15 Juin 2024',
                image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop'
            },
            {
                category: 'music',
                question: 'Burna Boy gagnera-t-il un Grammy Award ?',
                date: '20 Juin 2024',
                image: 'https://images.unsplash.com/photo-1493225457124-a3eb161ffa5f?w=400&h=250&fit=crop'
            },
            {
                category: 'crypto',
                question: 'Le Bitcoin dépassera-t-il 100 000$ cette année ?',
                date: '30 Juin 2024',
                image: 'https://images.unsplash.com/photo-1518546305927-5a555bb7020d?w=400&h=250&fit=crop'
            }
        ];

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            renderCarousel();
        });

        function checkAuth() {
            const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (!userStr) {
                window.location.href = 'index.html';
                return;
            }
            
            try {
                currentUser = JSON.parse(userStr);
                loadUserData();
                loadEvents();
                loadHistory();
                updateStats();
            } catch (e) {
                console.error('Error parsing user data:', e);
                window.location.href = 'index.html';
            }
        }

        function loadUserData() {
            if (!currentUser) return;

            db.collection('users').doc(currentUser.id).onSnapshot(doc => {
                if (doc.exists) {
                    const userData = doc.data();
                    currentUser = { ...currentUser, ...userData };
                    
                    // Update session
                    const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
                    storage.setItem('currentUser', JSON.stringify(currentUser));

                    // Update UI
                    document.getElementById('userAvatar').textContent = (userData.prenom || 'U').charAt(0).toUpperCase();
                    document.getElementById('userName').textContent = `${userData.prenom || ''} ${userData.nom || ''}`.trim();
                    document.getElementById('userPseudo').textContent = '@' + (userData.pseudo || 'user');
                    
                    const balance = userData.balance || 0;
                    document.getElementById('userBalance').textContent = balance.toLocaleString() + ' FCFA';
                    document.getElementById('statBalance').textContent = balance.toLocaleString() + ' FCFA';
                    document.getElementById('withdrawalBalance').textContent = balance.toLocaleString() + ' FCFA';
                }
            }, err => console.error('Error loading user data:', err));
        }

        function updateStats() {
            if (!currentUser) return;

            db.collection('bets').where('userId', '==', currentUser.id).get()
                .then(snapshot => {
                    const wins = snapshot.docs.filter(d => d.data().status === 'won').length;
                    const activeBets = snapshot.docs.filter(d => d.data().status === 'pending').length;
                    const totalBet = snapshot.docs.reduce((sum, d) => sum + (d.data().amount || 0), 0);

                    document.getElementById('statWins').textContent = wins;
                    document.getElementById('statBets').textContent = activeBets;
                    document.getElementById('statTotal').textContent = totalBet.toLocaleString() + ' FCFA';
                })
                .catch(err => console.error('Error loading stats:', err));
        }

        function loadEvents() {
            db.collection('events').where('status', '==', 'active').get()
                .then(snapshot => {
                    eventsData = [];
                    snapshot.forEach(doc => {
                        eventsData.push({ id: doc.id, ...doc.data() });
                    });
                    renderEvents();
                })
                .catch(err => {
                    console.error('Error loading events:', err);
                    renderEvents();
                });
        }

        function renderEvents() {
            const eventsList = document.getElementById('eventsList');

            if (eventsData.length === 0) {
                eventsList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-calendar-times"></i>
                        <h4>Aucun événement disponible</h4>
                        <p>Revenez plus tard pour de nouveaux événements</p>
                    </div>
                `;
                return;
            }

            eventsList.innerHTML = eventsData.map(event => {
                const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes').length : 0;
                const noBets = event.bets ? event.bets.filter(b => b.choice === 'no').length : 0;
                const totalPot = event.bets ? event.bets.reduce((sum, b) => sum + b.amount, 0) : 0;

                return `
                    <div class="event-card">
                        <div class="event-header">
                            <span class="event-category">
                                <i class="fas fa-${getCategoryIcon(event.category)}"></i>
                                ${event.category || 'Sport'}
                            </span>
                            <span class="event-status active">
                                <i class="fas fa-circle" style="font-size: 0.5rem;"></i>
                                En cours
                            </span>
                            <div class="event-question">${event.question}</div>
                        </div>
                        <div class="event-stats">
                            <div class="event-stat yes">
                                <div class="event-stat-label">OUI</div>
                                <div class="event-stat-value">${yesBets} pers.</div>
                            </div>
                            <div class="event-stat no">
                                <div class="event-stat-label">NON</div>
                                <div class="event-stat-value">${noBets} pers.</div>
                            </div>
                        </div>
                        <div class="event-footer">
                            <div class="event-info">
                                <div class="event-info-item">
                                    <i class="fas fa-coins"></i>
                                    <span>Min: ${event.minBet || 100} FCFA</span>
                                </div>
                                <div class="event-info-item">
                                    <i class="fas fa-chart-line"></i>
                                    <span>Pot: ${totalPot.toLocaleString()} FCFA</span>
                                </div>
                            </div>
                            <div class="event-actions">
                                <button class="btn-yes" onclick="openBetModal('${event.id}', 'yes')">
                                    <i class="fas fa-check"></i> OUI
                                </button>
                                <button class="btn-no" onclick="openBetModal('${event.id}', 'no')">
                                    <i class="fas fa-times"></i> NON
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function getCategoryIcon(category) {
            const icons = {
                'sport': 'futbol',
                'politique': 'landmark',
                'entertainment': 'film',
                'crypto': 'bitcoin',
                'music': 'music'
            };
            return icons[category] || 'tag';
        }

        function loadHistory() {
            if (!currentUser) return;

            db.collection('bets').where('userId', '==', currentUser.id)
                .orderBy('date', 'desc')
                .limit(5)
                .get()
                .then(snapshot => {
                    const historyList = document.getElementById('historyList');

                    if (snapshot.empty) {
                        historyList.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-history"></i>
                                <p>Aucun historique</p>
                            </div>
                        `;
                        return;
                    }

                    Promise.all(snapshot.docs.map(doc => {
                        const bet = { id: doc.id, ...doc.data() };
                        return db.collection('events').doc(bet.eventId).get()
                            .then(eventDoc => ({ bet, event: eventDoc.exists ? eventDoc.data() : null }));
                    })).then(results => {
                        historyList.innerHTML = results.map(({ bet, event }) => {
                            let iconClass = '';
                            let amountClass = 'negative';
                            let amountPrefix = '-';

                            if (bet.status === 'won') {
                                iconClass = 'win';
                                amountClass = 'positive';
                                amountPrefix = '+';
                            } else if (bet.status === 'lost') {
                                iconClass = 'loss';
                            }

                            const date = bet.date ? bet.date.toDate().toLocaleDateString('fr-FR') : '-';

                            return `
                                <div class="history-item">
                                    <div class="history-icon ${iconClass}">
                                        <i class="fas fa-${bet.status === 'won' ? 'trophy' : bet.status === 'lost' ? 'times' : 'ticket-alt'}"></i>
                                    </div>
                                    <div class="history-details">
                                        <div class="history-title">${event ? event.question : 'Événement'}</div>
                                        <div class="history-date">${date}</div>
                                    </div>
                                    <div class="history-amount ${amountClass}">
                                        ${amountPrefix}${bet.amount.toLocaleString()} FCFA
                                    </div>
                                </div>
                            `;
                        }).join('');
                    });
                })
                .catch(err => {
                    console.error('Error loading history:', err);
                    document.getElementById('historyList').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <p>Erreur de chargement</p>
                        </div>
                    `;
                });
        }

        function renderCarousel() {
            const track = document.getElementById('carouselTrack');
            const items = [...carouselSamples, ...carouselSamples];

            track.innerHTML = items.map(item => `
                <div class="carousel-item" onclick="showToast('Bientôt disponible!', 'info')">
                    <img src="${item.image}" alt="${item.category}" class="carousel-image">
                    <div class="carousel-content">
                        <span class="carousel-category">
                            <i class="fas fa-${getCategoryIcon(item.category)}"></i>
                            ${item.category}
                        </span>
                        <div class="carousel-question">${item.question}</div>
                        <div class="carousel-date">
                            <i class="fas fa-calendar-alt"></i>
                            ${item.date}
                        </div>
                    </div>
                </div>
            `).join('');
        }

        // Navigation
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            sidebar.classList.add('open');
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
            document.body.style.overflow = '';
        }

        function showSection(section) {
            // Hide all sections
            document.querySelectorAll('.content-section').forEach(s => s.classList.remove('active'));
            
            // Show selected section
            const sectionMap = {
                'events': 'events-section',
                'transactions': 'transactions-section',
                'my-bets': 'my-bets-section',
                'history': 'events-section'
            };
            
            const targetId = sectionMap[section];
            if (targetId) {
                document.getElementById(targetId).classList.add('active');
            }

            // Update nav active state
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
            event.target.closest('.nav-link')?.classList.add('active');

            // Load section data
            if (section === 'transactions') loadTransactions();
            if (section === 'my-bets') loadMyBets();
        }

        // Modals
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
            // Update balance display
            if (currentUser) {
                document.getElementById('withdrawalBalance').textContent = (currentUser.balance || 0).toLocaleString() + ' FCFA';
            }
            document.getElementById('withdrawalModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeWithdrawalModal() {
            document.getElementById('withdrawalModal').classList.remove('active');
            document.body.style.overflow = '';
            document.getElementById('withdrawalForm').reset();
        }

        async function submitDeposit(e) {
            e.preventDefault();

            if (!currentUser) {
                showToast('Erreur: utilisateur non connecté', 'error');
                return;
            }

            const btn = document.getElementById('submitDepositBtn');
            btn.innerHTML = '<span class="loading"></span> Envoi...';
            btn.disabled = true;

            const amount = parseInt(document.getElementById('depositAmount').value);
            const phone = document.getElementById('depositPhone').value;
            const transactionId = document.getElementById('depositTransactionId').value;
            const comment = document.getElementById('depositComment').value;
            const screenshot = document.getElementById('depositScreenshot').files[0];

            try {
                let screenshotURL = null;

                // Upload screenshot if provided
                if (screenshot) {
                    const formData = new FormData();
                    formData.append('file', screenshot);
                    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

                    const response = await fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
                        method: 'POST',
                        body: formData
                    });
                    const data = await response.json();
                    if (data.error) throw new Error(data.error.message);
                    screenshotURL = data.secure_url;
                }

                // Save to Firestore - Collection 'transactions' avec type 'deposit'
                await db.collection('transactions').add({
                    userId: currentUser.id,
                    userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
                    userPseudo: currentUser.pseudo,
                    type: 'deposit',
                    amount: amount,
                    phone: phone,
                    transactionId: transactionId,
                    screenshotURL: screenshotURL,
                    comment: comment || '',
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                showToast('Demande de dépôt envoyée ! Vous serez notifié une fois validée.', 'success');
                closeDepositModal();
            } catch (err) {
                console.error('Error:', err);
                showToast('Erreur: ' + err.message, 'error');
            } finally {
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Envoyer la confirmation';
                btn.disabled = false;
            }
        }

        async function submitWithdrawal(e) {
            e.preventDefault();

            if (!currentUser) {
                showToast('Erreur: utilisateur non connecté', 'error');
                return;
            }

            const amount = parseInt(document.getElementById('withdrawalAmount').value);
            const phone = document.getElementById('withdrawalPhone').value;
            const name = document.getElementById('withdrawalName').value;
            const reason = document.getElementById('withdrawalReason').value;

            // Vérifier le solde
            if (amount > (currentUser.balance || 0)) {
                showToast('Solde insuffisant pour ce retrait', 'error');
                return;
            }

            if (amount < 1000) {
                showToast('Le montant minimum de retrait est de 1 000 FCFA', 'error');
                return;
            }

            const btn = document.getElementById('submitWithdrawalBtn');
            btn.innerHTML = '<span class="loading"></span> Envoi...';
            btn.disabled = true;

            try {
                // Save to Firestore - Collection 'transactions' avec type 'withdrawal'
                await db.collection('transactions').add({
                    userId: currentUser.id,
                    userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
                    userPseudo: currentUser.pseudo,
                    type: 'withdrawal',
                    amount: amount,
                    phone: phone,
                    recipientName: name,
                    reason: reason || '',
                    status: 'pending',
                    createdAt: firebase.firestore.FieldValue.serverTimestamp()
                });

                // Déduire le montant du solde immédiatement (mise en attente)
                await db.collection('users').doc(currentUser.id).update({
                    balance: firebase.firestore.FieldValue.increment(-amount),
                    pendingWithdrawal: firebase.firestore.FieldValue.increment(amount)
                });

                showToast('Demande de retrait envoyée ! Traitement sous 24-48h.', 'success');
                closeWithdrawalModal();
                loadTransactions();
            } catch (err) {
                console.error('Error:', err);
                showToast('Erreur: ' + err.message, 'error');
            } finally {
                btn.innerHTML = '<i class="fas fa-paper-plane"></i> Demander le retrait';
                btn.disabled = false;
            }
        }

        function loadTransactions() {
            if (!currentUser) return;

            db.collection('transactions')
                .where('userId', '==', currentUser.id)
                .orderBy('createdAt', 'desc')
                .get()
                .then(snapshot => {
                    const container = document.getElementById('transactionsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-exchange-alt"></i>
                                <p>Aucune transaction</p>
                            </div>
                        `;
                        return;
                    }

                    let html = '<div class="history-list">';
                    snapshot.forEach(doc => {
                        const t = doc.data();
                        const isDeposit = t.type === 'deposit';
                        const icon = isDeposit ? 'fa-arrow-down' : 'fa-arrow-up';
                        const color = isDeposit ? 'var(--success)' : 'var(--danger)';
                        const sign = isDeposit ? '+' : '-';
                        const statusText = {
                            'pending': 'En attente',
                            'completed': 'Validé',
                            'approved': 'Validé',
                            'rejected': 'Rejeté'
                        }[t.status] || 'En attente';

                        html += `
                            <div class="history-item">
                                <div class="history-icon" style="background: ${isDeposit ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.2)'}; color: ${color};">
                                    <i class="fas ${icon}"></i>
                                </div>
                                <div class="history-details">
                                    <div class="history-title">${isDeposit ? 'Dépôt' : 'Retrait'} - ${statusText}</div>
                                    <div class="history-date">${t.createdAt ? t.createdAt.toDate().toLocaleDateString('fr-FR') : '-'}</div>
                                </div>
                                <div class="history-amount" style="color: ${color};">
                                    ${sign}${t.amount.toLocaleString()} FCFA
                                </div>
                            </div>
                        `;
                    });
                    html += '</div>';
                    container.innerHTML = html;
                })
                .catch(err => {
                    console.error('Error loading transactions:', err);
                });
        }

        function loadMyBets() {
            if (!currentUser) return;
            
            db.collection('bets').where('userId', '==', currentUser.id)
                .orderBy('date', 'desc')
                .get()
                .then(snapshot => {
                    const container = document.getElementById('myBetsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-ticket-alt"></i>
                                <p>Aucun pari</p>
                            </div>
                        `;
                        return;
                    }

                    Promise.all(snapshot.docs.map(doc => {
                        const bet = { id: doc.id, ...doc.data() };
                        return db.collection('events').doc(bet.eventId).get()
                            .then(eventDoc => ({ bet, event: eventDoc.exists ? eventDoc.data() : null }));
                    })).then(results => {
                        container.innerHTML = results.map(({ bet, event }) => {
                            const statusColors = {
                                'pending': 'var(--warning)',
                                'won': 'var(--success)',
                                'lost': 'var(--danger)'
                            };
                            const statusText = {
                                'pending': 'En cours',
                                'won': 'Gagné',
                                'lost': 'Perdu'
                            };

                            return `
                                <div class="event-card" style="margin-bottom: 1rem;">
                                    <div class="event-header">
                                        <span class="event-category">${event ? event.category : 'Sport'}</span>
                                        <span style="color: ${statusColors[bet.status] || 'var(--gray)'}; font-weight: 600;">
                                            ${statusText[bet.status] || bet.status}
                                        </span>
                                    </div>
                                    <div style="padding: 1rem;">
                                        <div style="font-weight: 600; margin-bottom: 0.5rem;">${event ? event.question : 'Événement'}</div>
                                        <div style="display: flex; justify-content: space-between; color: var(--gray); font-size: 0.9rem;">
                                            <span>Prédiction: <strong style="color: ${bet.choice === 'yes' ? 'var(--success)' : 'var(--danger)'}">${bet.choice === 'yes' ? 'OUI' : 'NON'}</strong></span>
                                            <span>Montant: <strong>${bet.amount.toLocaleString()} FCFA</strong></span>
                                        </div>
                                    </div>
                                </div>
                            `;
                        }).join('');
                    });
                });
        }

        // Bet Modal Functions
        function openBetModal(eventId, prediction) {
            currentEvent = eventsData.find(e => e.id === eventId);
            if (!currentEvent) return;

            currentPrediction = prediction;
            currentBetAmount = 100;

            document.getElementById('betSlider').value = 100;
            document.getElementById('betAmountDisplay').textContent = '100 FCFA';

            setPrediction(prediction);
            updatePotentialWin();

            document.getElementById('betModal').classList.add('active');
            document.body.style.overflow = 'hidden';
        }

        function closeBetModal() {
            document.getElementById('betModal').classList.remove('active');
            document.body.style.overflow = '';
            currentEvent = null;
            currentPrediction = null;
        }

        function updateBetAmount(amount) {
            currentBetAmount = parseInt(amount);
            document.getElementById('betAmountDisplay').textContent = currentBetAmount.toLocaleString() + ' FCFA';
            updatePotentialWin();
        }

        function setBetAmount(amount) {
            document.getElementById('betSlider').value = amount;
            updateBetAmount(amount);
        }

        function setPrediction(prediction) {
            currentPrediction = prediction;
            document.getElementById('btnYes').classList.toggle('active', prediction === 'yes');
            document.getElementById('btnNo').classList.toggle('active', prediction === 'no');
            updatePotentialWin();
        }

        function updatePotentialWin() {
            if (!currentEvent) return;

            const yesBets = currentEvent.bets ? currentEvent.bets.filter(b => b.choice === 'yes') : [];
            const noBets = currentEvent.bets ? currentEvent.bets.filter(b => b.choice === 'no') : [];

            const yesTotal = yesBets.reduce((sum, b) => sum + b.amount, 0);
            const noTotal = noBets.reduce((sum, b) => sum + b.amount, 0);

            let potentialWin = 0;

            if (currentPrediction === 'yes') {
                const totalWinners = yesBets.length + 1;
                const commission = noTotal * 0.02;
                const redistribution = noTotal - commission;
                potentialWin = redistribution / totalWinners;
            } else {
                const totalWinners = noBets.length + 1;
                const commission = yesTotal * 0.02;
                const redistribution = yesTotal - commission;
                potentialWin = redistribution / totalWinners;
            }

            document.getElementById('potentialWin').textContent = '+' + Math.floor(potentialWin).toLocaleString() + ' FCFA';
        }

        function placeBet() {
            if (!currentUser || !currentEvent || !currentPrediction) return;

            const btn = document.getElementById('placeBetBtn');
            btn.innerHTML = '<span class="loading"></span> Traitement...';
            btn.disabled = true;

            if (currentUser.balance < currentBetAmount) {
                showToast('Solde insuffisant. Effectuez un dépôt.', 'error');
                btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer le pari';
                btn.disabled = false;
                return;
            }

            const batch = db.batch();

            const userRef = db.collection('users').doc(currentUser.id);
            batch.update(userRef, {
                balance: firebase.firestore.FieldValue.increment(-currentBetAmount)
            });

            const betRef = db.collection('bets').doc();
            batch.set(betRef, {
                userId: currentUser.id,
                eventId: currentEvent.id,
                choice: currentPrediction,
                amount: currentBetAmount,
                status: 'pending',
                date: firebase.firestore.FieldValue.serverTimestamp()
            });

            const eventRef = db.collection('events').doc(currentEvent.id);
            batch.update(eventRef, {
                bets: firebase.firestore.FieldValue.arrayUnion({
                    userId: currentUser.id,
                    choice: currentPrediction,
                    amount: currentBetAmount
                })
            });

            batch.commit()
                .then(() => {
                    showToast('Pari placé avec succès !', 'success');
                    closeBetModal();
                    loadUserData();
                    loadEvents();
                    loadHistory();
                    updateStats();
                })
                .catch(err => {
                    console.error('Error placing bet:', err);
                    showToast('Erreur: ' + err.message, 'error');
                })
                .finally(() => {
                    btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer le pari';
                    btn.disabled = false;
                });
        }

        // Utilities
        function showToast(message, type = 'success') {
            const toast = document.getElementById('toast');
            const toastMessage = document.getElementById('toastMessage');
            const icon = toast.querySelector('i');

            toastMessage.textContent = message;
            toast.className = 'toast show ' + type;

            if (type === 'success') {
                icon.className = 'fas fa-check-circle';
            } else if (type === 'error') {
                icon.className = 'fas fa-exclamation-circle';
            } else if (type === 'info') {
                icon.className = 'fas fa-info-circle';
            }

            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function logout() {
            sessionStorage.removeItem('currentUser');
            localStorage.removeItem('currentUser');
            showToast('Déconnexion réussie', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }

        // Close modals on outside click
        window.onclick = function(event) {
            if (event.target.classList.contains('modal-overlay')) {
                event.target.classList.remove('active');
                document.body.style.overflow = '';
            }
        }
