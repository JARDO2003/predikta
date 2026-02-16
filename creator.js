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

        // VAPID Key for Cloud Messaging
        const vapidKey = "PViQXia_vvFLKMAe2E2q5oTOX48XpRQIdx5P4xAFEPw";

        let currentUser = null;
        let currentResultEvent = null;
        let selectedResult = null;
        let notifications = [];

        // Mobile sidebar functions
        function toggleSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            sidebar.classList.toggle('open');
            overlay.classList.toggle('active');
        }

        function closeSidebar() {
            const sidebar = document.getElementById('sidebar');
            const overlay = document.querySelector('.sidebar-overlay');
            sidebar.classList.remove('open');
            overlay.classList.remove('active');
        }

        // Notification Panel Functions
        function openNotificationPanel() {
            document.getElementById('notificationPanel').classList.add('active');
            document.querySelector('.notification-overlay').classList.add('active');
            loadNotifications();
        }

        function closeNotificationPanel() {
            document.getElementById('notificationPanel').classList.remove('active');
            document.querySelector('.notification-overlay').classList.remove('active');
        }

        function loadNotifications() {
            const notificationList = document.getElementById('notificationList');
            
            if (notifications.length === 0) {
                notificationList.innerHTML = `
                    <div class="empty-state">
                        <i class="fas fa-bell-slash"></i>
                        <p>Aucune notification</p>
                    </div>
                `;
                return;
            }

            notificationList.innerHTML = notifications.map(notif => `
                <div class="notification-item ${notif.type} ${notif.read ? '' : 'unread'}">
                    <div class="notification-title">${notif.title}</div>
                    <div class="notification-message">${notif.message}</div>
                    <div class="notification-time">${notif.time}</div>
                </div>
            `).join('');
        }

        function addNotification(title, message, type = 'info') {
            const notif = {
                id: Date.now(),
                title,
                message,
                type,
                read: false,
                time: new Date().toLocaleTimeString('fr-FR')
            };
            notifications.unshift(notif);
            updateNotificationBadge();
        }

        function updateNotificationBadge() {
            const badge = document.getElementById('notificationBadge');
            const unreadCount = notifications.filter(n => !n.read).length;
            
            if (unreadCount > 0) {
                badge.textContent = unreadCount;
                badge.style.display = 'block';
            } else {
                badge.style.display = 'none';
            }
        }

        // Initialize Firebase Cloud Messaging
        function initMessaging() {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('firebase-messaging-sw.js')
                    .then((registration) => {
                        console.log('Service Worker registered:', registration);
                        
                        messaging.getToken({ vapidKey: vapidKey, serviceWorkerRegistration: registration })
                            .then((currentToken) => {
                                if (currentToken) {
                                    console.log('FCM Token:', currentToken);
                                    saveTokenToServer(currentToken);
                                } else {
                                    console.log('No registration token available.');
                                }
                            })
                            .catch((err) => {
                                console.log('An error occurred while retrieving token:', err);
                            });
                    })
                    .catch((err) => {
                        console.log('Service Worker registration failed:', err);
                    });
            }

            messaging.onMessage((payload) => {
                console.log('Message received:', payload);
                addNotification(
                    payload.notification.title,
                    payload.notification.body,
                    'info'
                );
                showToast(payload.notification.body, 'success');
            });
        }

        function saveTokenToServer(token) {
            // Save the token to Firestore for this user
            if (currentUser) {
                db.collection('users').doc(currentUser.id).update({
                    fcmToken: token,
                    tokenUpdatedAt: firebase.firestore.FieldValue.serverTimestamp()
                }).catch(err => console.error('Error saving token:', err));
            }
        }

        // Request notification permission
        function requestNotificationPermission() {
            Notification.requestPermission().then((permission) => {
                if (permission === 'granted') {
                    console.log('Notification permission granted.');
                    initMessaging();
                } else {
                    console.log('Unable to get permission to notify.');
                }
            });
        }

        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            requestNotificationPermission();
        });

        function checkAuth() {
            const user = JSON.parse(sessionStorage.getItem('currentUser'));
            if (!user || (user.role !== 'admin' && user.role !== 'creator')) {
                window.location.href = 'index.html';
                return;
            }
            currentUser = user;
            loadUserData();
            updateStats();
            loadRecentEvents();
            loadRecentDeposits();
            loadEventsTable();
            loadUsersTable();
            loadDepositsTable();
            calculateCommission();
            loadPendingResults();
            loadAnnouncedResults();
        }

        function loadUserData() {
            if (!currentUser) return;
            document.getElementById('userAvatar').textContent = currentUser.prenom.charAt(0).toUpperCase();
            document.getElementById('userName').textContent = currentUser.prenom + ' ' + currentUser.nom;
        }

        function updateStats() {
            db.collection('users').get().then(snapshot => {
                document.getElementById('statUsers').textContent = snapshot.size;
            }).catch(err => console.error('Erreur stats users:', err));

            db.collection('events').where('status', '==', 'active').get().then(snapshot => {
                document.getElementById('statEvents').textContent = snapshot.size;
            }).catch(err => console.error('Erreur stats events:', err));

            db.collection('bets').get().then(snapshot => {
                document.getElementById('statBets').textContent = snapshot.size;
            }).catch(err => console.error('Erreur stats bets:', err));

            db.collection('bets').get().then(snapshot => {
                let totalPot = 0;
                snapshot.forEach(doc => {
                    totalPot += doc.data().amount || 0;
                });
                document.getElementById('statPot').textContent = totalPot.toLocaleString() + ' FCFA';
            }).catch(err => console.error('Erreur stats pot:', err));
        }

        function calculateCommission() {
            db.collection('events').where('status', '==', 'closed').get()
                .then(snapshot => {
                    let totalCommission = 0;
                    snapshot.forEach(doc => {
                        const event = doc.data();
                        if (event.winner && event.bets) {
                            const loserBets = event.bets.filter(b => b.choice !== event.winner);
                            const loserTotal = loserBets.reduce((sum, b) => sum + b.amount, 0);
                            totalCommission += loserTotal * 0.02;
                        }
                    });
                    document.getElementById('totalCommission').textContent = Math.floor(totalCommission).toLocaleString() + ' FCFA';
                })
                .catch(err => console.error('Erreur commission:', err));
        }

        function loadRecentEvents() {
            db.collection('events').get()
                .then(snapshot => {
                    const container = document.getElementById('recentEventsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state" style="padding: 2rem;">
                                <i class="fas fa-calendar-plus" style="font-size: 2rem;"></i>
                                <p>Aucun événement créé</p>
                            </div>
                        `;
                        return;
                    }

                    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    events.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    });
                    events = events.slice(0, 3);

                    container.innerHTML = events.map(event => {
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
                                    <span class="status-badge ${event.status}">
                                        ${event.status === 'active' ? 'Actif' : 'Clôturé'}
                                    </span>
                                </div>
                                <div class="event-question">${event.question}</div>
                                <div class="event-stats">
                                    <div class="event-stat">
                                        <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                        <span>${yesBets} OUI</span>
                                    </div>
                                    <div class="event-stat">
                                        <i class="fas fa-times-circle" style="color: var(--danger);"></i>
                                        <span>${noBets} NON</span>
                                    </div>
                                    <div class="event-stat">
                                        <i class="fas fa-coins"></i>
                                        <span>${totalPot.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                })
                .catch(err => console.error('Erreur recent events:', err));
        }

        function loadRecentDeposits() {
            db.collection('deposit_requests').get()
                .then(snapshot => {
                    const container = document.getElementById('recentDepositsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state" style="padding: 2rem;">
                                <i class="fas fa-money-bill-wave" style="font-size: 2rem;"></i>
                                <p>Aucun dépôt</p>
                            </div>
                        `;
                        return;
                    }

                    let deposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    deposits.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    });
                    deposits = deposits.slice(0, 3);

                    container.innerHTML = deposits.map(deposit => {
                        const date = deposit.createdAt ? deposit.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                        return `
                            <div class="event-card">
                                <div class="event-header">
                                    <span class="event-category">
                                        <i class="fas fa-user"></i>
                                        ${deposit.userName || 'Utilisateur'}
                                    </span>
                                    <span class="status-badge ${deposit.status}">
                                        ${deposit.status === 'pending' ? 'En attente' : deposit.status === 'approved' ? 'Approuvé' : 'Rejeté'}
                                    </span>
                                </div>
                                <div class="event-question">${deposit.amount.toLocaleString()} FCFA</div>
                                <div class="event-stats">
                                    <div class="event-stat">
                                        <i class="fas fa-calendar"></i>
                                        <span>${date}</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                })
                .catch(err => console.error('Erreur recent deposits:', err));
        }

        function loadEventsTable() {
            db.collection('events').get()
                .then(snapshot => {
                    const tbody = document.getElementById('eventsTableBody');
                    
                    if (snapshot.empty) {
                        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; padding: 2rem;">Aucun événement</td></tr>';
                        return;
                    }

                    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    events.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    });

                    tbody.innerHTML = events.map(({ id, ...event }) => {
                        const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes').length : 0;
                        const noBets = event.bets ? event.bets.filter(b => b.choice === 'no').length : 0;
                        const totalPot = event.bets ? event.bets.reduce((sum, b) => sum + b.amount, 0) : 0;

                        return `
                            <tr>
                                <td>#${id.substr(-6)}</td>
                                <td>${event.question}</td>
                                <td>${event.category || 'Sport'}</td>
                                <td style="color: var(--success);">${yesBets}</td>
                                <td style="color: var(--danger);">${noBets}</td>
                                <td>${totalPot.toLocaleString()}</td>
                                <td><span class="status-badge ${event.status}">${event.status === 'active' ? 'Actif' : 'Clôturé'}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-icon view" onclick="viewEvent('${id}')" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                        ${event.status === 'active' ? `
                                            <button class="btn-icon result" onclick="openResultModal('${id}')" title="Annoncer résultat">
                                                <i class="fas fa-trophy"></i>
                                            </button>
                                        ` : ''}
                                        <button class="btn-icon delete" onclick="deleteEvent('${id}')" title="Supprimer">
                                            <i class="fas fa-trash"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                })
                .catch(err => console.error('Erreur events table:', err));
        }

        function loadPendingResults() {
            db.collection('events').where('status', '==', 'active').get()
                .then(snapshot => {
                    const container = document.getElementById('pendingResultsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-check-circle" style="font-size: 3rem; color: var(--success);"></i>
                                <h4>Aucun événement en attente</h4>
                                <p>Tous les résultats ont été annoncés</p>
                            </div>
                        `;
                        return;
                    }

                    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    events.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    });

                    container.innerHTML = events.map(event => {
                        const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes') : [];
                        const noBets = event.bets ? event.bets.filter(b => b.choice === 'no') : [];
                        const totalPot = event.bets ? event.bets.reduce((sum, b) => sum + b.amount, 0) : 0;

                        return `
                            <div class="event-card">
                                <div class="event-header">
                                    <span class="event-category">
                                        <i class="fas fa-${getCategoryIcon(event.category)}"></i>
                                        ${event.category || 'Sport'}
                                    </span>
                                    <span class="status-badge active">En cours</span>
                                </div>
                                <div class="event-question">${event.question}</div>
                                <div class="event-stats">
                                    <div class="event-stat">
                                        <i class="fas fa-check-circle" style="color: var(--success);"></i>
                                        <span>${yesBets.length} OUI (${yesBets.reduce((s, b) => s + b.amount, 0).toLocaleString()} FCFA)</span>
                                    </div>
                                    <div class="event-stat">
                                        <i class="fas fa-times-circle" style="color: var(--danger);"></i>
                                        <span>${noBets.length} NON (${noBets.reduce((s, b) => s + b.amount, 0).toLocaleString()} FCFA)</span>
                                    </div>
                                    <div class="event-stat">
                                        <i class="fas fa-coins"></i>
                                        <span>Pot: ${totalPot.toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                                <div style="margin-top: 1rem; display: flex; gap: 0.75rem;">
                                    <button class="btn btn-success" onclick="openResultModal('${event.id}')" style="flex: 1;">
                                        <i class="fas fa-trophy"></i> Annoncer le résultat
                                    </button>
                                </div>
                            </div>
                        `;
                    }).join('');
                })
                .catch(err => {
                    console.error('Erreur pending results:', err);
                    document.getElementById('pendingResultsList').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Erreur de chargement</h4>
                            <p>${err.message}</p>
                        </div>
                    `;
                });
        }

        function loadAnnouncedResults() {
            db.collection('events').where('status', '==', 'closed').get()
                .then(snapshot => {
                    const container = document.getElementById('announcedResultsList');
                    
                    if (snapshot.empty) {
                        container.innerHTML = `
                            <div class="empty-state">
                                <i class="fas fa-history"></i>
                                <h4>Aucun résultat annoncé</h4>
                                <p>Les résultats apparaîtront ici</p>
                            </div>
                        `;
                        return;
                    }

                    let events = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    events.sort((a, b) => {
                        if (!b.closedAt || !a.closedAt) return 0;
                        return b.closedAt.toMillis() - a.closedAt.toMillis();
                    });

                    container.innerHTML = events.map(event => {
                        const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes') : [];
                        const noBets = event.bets ? event.bets.filter(b => b.choice === 'no') : [];
                        const winnerBets = event.winner === 'yes' ? yesBets : noBets;
                        const loserBets = event.winner === 'yes' ? noBets : yesBets;
                        const loserTotal = loserBets.reduce((s, b) => s + b.amount, 0);
                        const commission = loserTotal * 0.02;
                        const redistribution = loserTotal - commission;
                        const gainPerWinner = winnerBets.length > 0 ? redistribution / winnerBets.length : 0;

                        return `
                            <div class="event-card" style="border-left: 4px solid ${event.winner === 'yes' ? 'var(--success)' : 'var(--danger)'};">
                                <div class="event-header">
                                    <span class="event-category">
                                        <i class="fas fa-${getCategoryIcon(event.category)}"></i>
                                        ${event.category || 'Sport'}
                                    </span>
                                    <span class="status-badge closed">Terminé</span>
                                </div>
                                <div class="event-question">${event.question}</div>
                                <div style="background: rgba(15, 23, 42, 0.5); border-radius: 8px; padding: 1rem; margin: 1rem 0;">
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span style="color: var(--text-muted);">Résultat:</span>
                                        <span style="font-weight: 700; color: ${event.winner === 'yes' ? 'var(--success)' : 'var(--danger)'};">
                                            ${event.winner === 'yes' ? 'OUI' : 'NON'}
                                        </span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span style="color: var(--text-muted);">Gagnants:</span>
                                        <span style="font-weight: 600; color: var(--success);">${winnerBets.length} personnes</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                        <span style="color: var(--text-muted);">Perdants:</span>
                                        <span style="font-weight: 600; color: var(--danger);">${loserBets.length} personnes</span>
                                    </div>
                                    <div style="display: flex; justify-content: space-between;">
                                        <span style="color: var(--text-muted);">Gain par gagnant:</span>
                                        <span style="font-weight: 700; color: var(--success);">+${Math.floor(gainPerWinner).toLocaleString()} FCFA</span>
                                    </div>
                                </div>
                            </div>
                        `;
                    }).join('');
                })
                .catch(err => {
                    console.error('Erreur announced results:', err);
                    document.getElementById('announcedResultsList').innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-exclamation-triangle"></i>
                            <h4>Erreur de chargement</h4>
                            <p>${err.message}</p>
                        </div>
                    `;
                });
        }

        function loadUsersTable() {
            db.collection('users').get()
                .then(snapshot => {
                    const tbody = document.getElementById('usersTableBody');
                    
                    if (snapshot.empty) {
                        tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 2rem;">Aucun utilisateur</td></tr>';
                        return;
                    }

                    Promise.all(snapshot.docs.map(doc => {
                        const user = doc.data();
                        return db.collection('bets').where('userId', '==', doc.id).get()
                            .then(betsSnapshot => ({ user, id: doc.id, betsCount: betsSnapshot.size }));
                    })).then(results => {
                        tbody.innerHTML = results.map(({ user, id, betsCount }) => {
                            const date = user.createdAt ? user.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                            return `
                                <tr>
                                    <td>#${id.substr(-6)}</td>
                                    <td>${user.prenom} ${user.nom}</td>
                                    <td>@${user.pseudo}</td>
                                    <td>${user.contact}</td>
                                    <td>${(user.balance || 0).toLocaleString()}</td>
                                    <td>${betsCount}</td>
                                    <td>${date}</td>
                                </tr>
                            `;
                        }).join('');
                    });
                })
                .catch(err => console.error('Erreur users table:', err));
        }

        function loadDepositsTable() {
            db.collection('deposit_requests').get()
                .then(snapshot => {
                    const tbody = document.getElementById('depositsTableBody');
                    
                    if (snapshot.empty) {
                        tbody.innerHTML = '<tr><td colspan="6" style="text-align: center; padding: 2rem;">Aucun dépôt</td></tr>';
                        return;
                    }

                    let deposits = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    deposits.sort((a, b) => {
                        if (!a.createdAt || !b.createdAt) return 0;
                        return b.createdAt.toMillis() - a.createdAt.toMillis();
                    });

                    tbody.innerHTML = deposits.map(({ id, ...deposit }) => {
                        const date = deposit.createdAt ? deposit.createdAt.toDate().toLocaleDateString('fr-FR') : '-';
                        return `
                            <tr>
                                <td>#${id.substr(-6)}</td>
                                <td>${deposit.userName || 'Inconnu'}</td>
                                <td>${deposit.amount.toLocaleString()}</td>
                                <td>${date}</td>
                                <td><span class="status-badge ${deposit.status}">${deposit.status === 'pending' ? 'En attente' : deposit.status === 'approved' ? 'Approuvé' : 'Rejeté'}</span></td>
                                <td>
                                    <div class="action-btns">
                                        <button class="btn-icon view" onclick="viewDeposit('${id}')" title="Voir">
                                            <i class="fas fa-eye"></i>
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }).join('');
                })
                .catch(err => console.error('Erreur deposits table:', err));
        }

        function getCategoryIcon(category) {
            const icons = {
                'sport': 'futbol',
                'politique': 'landmark',
                'entertainment': 'film',
                'crypto': 'bitcoin',
                'autre': 'tag'
            };
            return icons[category] || 'tag';
        }

        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            event.target.classList.add('active');
            document.querySelectorAll('.nav-link').forEach(l => l.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            document.getElementById(tab + 'Tab').classList.add('active');

            if (tab === 'events') loadEventsTable();
            if (tab === 'users') loadUsersTable();
            if (tab === 'deposits') loadDepositsTable();
            if (tab === 'results') {
                loadPendingResults();
                loadAnnouncedResults();
            }
        }

        function openEventModal() {
            const defaultDate = new Date();
            defaultDate.setDate(defaultDate.getDate() + 7);
            defaultDate.setMinutes(defaultDate.getMinutes() - defaultDate.getTimezoneOffset());
            document.getElementById('eventEndDate').value = defaultDate.toISOString().slice(0, 16);
            document.getElementById('eventModal').classList.add('active');
        }

        function closeEventModal() {
            document.getElementById('eventModal').classList.remove('active');
            document.getElementById('eventForm').reset();
        }

        function createEvent(e) {
            e.preventDefault();
            
            const btn = document.getElementById('createEventBtn');
            btn.innerHTML = '<span class="loading"></span> Création...';
            btn.disabled = true;

            const question = document.getElementById('eventQuestion').value;
            const category = document.getElementById('eventCategory').value;
            const minBet = parseInt(document.getElementById('eventMinBet').value);
            const endDate = document.getElementById('eventEndDate').value;
            const description = document.getElementById('eventDescription').value;

            db.collection('events').add({
                question,
                category,
                minBet,
                endDate,
                description,
                status: 'active',
                bets: [],
                createdAt: firebase.firestore.FieldValue.serverTimestamp(),
                createdBy: currentUser.id
            })
            .then(() => {
                showToast('Événement créé avec succès !', 'success');
                closeEventModal();
                loadRecentEvents();
                loadEventsTable();
                updateStats();
                loadPendingResults();
                btn.innerHTML = '<i class="fas fa-plus"></i> Créer l\'événement';
                btn.disabled = false;
            })
            .catch(error => {
                showToast('Erreur: ' + error.message, 'error');
                btn.innerHTML = '<i class="fas fa-plus"></i> Créer l\'événement';
                btn.disabled = false;
            });
        }

        // Result Modal Functions
        function openResultModal(eventId) {
            db.collection('events').doc(eventId).get()
                .then(doc => {
                    if (!doc.exists) {
                        showToast('Événement introuvable', 'error');
                        return;
                    }
                    
                    currentResultEvent = { id: doc.id, ...doc.data() };
                    selectedResult = null;
                    
                    const yesBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'yes') : [];
                    const noBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'no') : [];
                    const yesTotal = yesBets.reduce((sum, b) => sum + b.amount, 0);
                    const noTotal = noBets.reduce((sum, b) => sum + b.amount, 0);
                    
                    document.getElementById('resultEventSummary').innerHTML = `
                        <div class="event-summary-item">
                            <span class="event-summary-label">Question</span>
                            <span class="event-summary-value">${currentResultEvent.question}</span>
                        </div>
                        <div class="event-summary-item">
                            <span class="event-summary-label">Paris OUI</span>
                            <span class="event-summary-value" style="color: var(--success);">${yesBets.length} (${yesTotal.toLocaleString()} FCFA)</span>
                        </div>
                        <div class="event-summary-item">
                            <span class="event-summary-label">Paris NON</span>
                            <span class="event-summary-value" style="color: var(--danger);">${noBets.length} (${noTotal.toLocaleString()} FCFA)</span>
                        </div>
                        <div class="event-summary-item">
                            <span class="event-summary-label">Pot total</span>
                            <span class="event-summary-value">${(yesTotal + noTotal).toLocaleString()} FCFA</span>
                        </div>
                    `;
                    
                    // Reset selection
                    document.querySelectorAll('.result-option').forEach(el => {
                        el.classList.remove('selected');
                    });
                    document.getElementById('resultPreview').style.display = 'none';
                    document.getElementById('confirmResultBtn').disabled = true;
                    
                    document.getElementById('resultModal').classList.add('active');
                })
                .catch(err => {
                    console.error('Erreur:', err);
                    showToast('Erreur: ' + err.message, 'error');
                });
        }

        function closeResultModal() {
            document.getElementById('resultModal').classList.remove('active');
            currentResultEvent = null;
            selectedResult = null;
        }

        function selectResult(result) {
            selectedResult = result;
            
            document.querySelectorAll('.result-option').forEach(el => {
                el.classList.remove('selected');
            });
            
            const selectedEl = document.querySelector(`.result-option.${result}-option`);
            selectedEl.classList.add('selected');
            
            // Calculate and show preview
            const yesBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'yes') : [];
            const noBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'no') : [];
            const yesTotal = yesBets.reduce((sum, b) => sum + b.amount, 0);
            const noTotal = noBets.reduce((sum, b) => sum + b.amount, 0);
            
            const winnerBets = result === 'yes' ? yesBets : noBets;
            const loserBets = result === 'yes' ? noBets : yesBets;
            const loserTotal = loserBets.reduce((sum, b) => sum + b.amount, 0);
            const commission = loserTotal * 0.02;
            const redistribution = loserTotal - commission;
            const gainPerWinner = winnerBets.length > 0 ? redistribution / winnerBets.length : 0;
            
            document.getElementById('winnersCount').textContent = winnerBets.length;
            document.getElementById('losersCount').textContent = loserBets.length;
            document.getElementById('redistributionAmount').textContent = Math.floor(redistribution).toLocaleString() + ' FCFA';
            document.getElementById('commissionAmount').textContent = Math.floor(commission).toLocaleString() + ' FCFA';
            document.getElementById('gainPerWinner').textContent = '+' + Math.floor(gainPerWinner).toLocaleString() + ' FCFA';
            
            document.getElementById('resultPreview').style.display = 'block';
            document.getElementById('confirmResultBtn').disabled = false;
        }

        function confirmResult() {
            if (!selectedResult || !currentResultEvent) return;
            
            const btn = document.getElementById('confirmResultBtn');
            btn.innerHTML = '<span class="loading"></span> Traitement...';
            btn.disabled = true;
            
            const yesBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'yes') : [];
            const noBets = currentResultEvent.bets ? currentResultEvent.bets.filter(b => b.choice === 'no') : [];
            const winnerBets = selectedResult === 'yes' ? yesBets : noBets;
            const loserBets = selectedResult === 'yes' ? noBets : yesBets;
            const loserTotal = loserBets.reduce((sum, b) => sum + b.amount, 0);
            const commission = loserTotal * 0.02;
            const redistribution = loserTotal - commission;
            const gainPerWinner = winnerBets.length > 0 ? redistribution / winnerBets.length : 0;
            
            const batch = db.batch();
            
            // Update event status
            const eventRef = db.collection('events').doc(currentResultEvent.id);
            batch.update(eventRef, {
                status: 'closed',
                winner: selectedResult,
                closedAt: firebase.firestore.FieldValue.serverTimestamp(),
                commission: commission,
                redistribution: redistribution
            });
            
            // Update winner balances and bets
            winnerBets.forEach(wb => {
                const userRef = db.collection('users').doc(wb.userId);
                batch.update(userRef, {
                    balance: firebase.firestore.FieldValue.increment(wb.amount + gainPerWinner)
                });
                
                // Update bet status
                const betQuery = db.collection('bets')
                    .where('userId', '==', wb.userId)
                    .where('eventId', '==', currentResultEvent.id);
                
                betQuery.get().then(snapshot => {
                    snapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            status: 'won',
                            gain: gainPerWinner,
                            result: selectedResult,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                });
            });
            
            // Update loser bets
            loserBets.forEach(lb => {
                const betQuery = db.collection('bets')
                    .where('userId', '==', lb.userId)
                    .where('eventId', '==', currentResultEvent.id);
                
                betQuery.get().then(snapshot => {
                    snapshot.forEach(doc => {
                        batch.update(doc.ref, {
                            status: 'lost',
                            gain: 0,
                            result: selectedResult,
                            updatedAt: firebase.firestore.FieldValue.serverTimestamp()
                        });
                    });
                });
            });
            
            batch.commit()
                .then(() => {
                    showToast('Résultat annoncé avec succès ! Les gains ont été distribués.', 'success');
                    
                    // Add notification
                    addNotification(
                        'Résultat annoncé',
                        `Le résultat de "${currentResultEvent.question}" est ${selectedResult === 'yes' ? 'OUI' : 'NON'}`,
                        'success'
                    );
                    
                    closeResultModal();
                    loadRecentEvents();
                    loadEventsTable();
                    loadPendingResults();
                    loadAnnouncedResults();
                    calculateCommission();
                    
                    btn.innerHTML = '<i class="fas fa-trophy"></i> Confirmer le résultat';
                    btn.disabled = false;
                })
                .catch(error => {
                    showToast('Erreur: ' + error.message, 'error');
                    btn.innerHTML = '<i class="fas fa-trophy"></i> Confirmer le résultat';
                    btn.disabled = false;
                });
        }

        function viewEvent(eventId) {
            db.collection('events').doc(eventId).get()
                .then(doc => {
                    if (!doc.exists) return;
                    const event = doc.data();
                    const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes') : [];
                    const noBets = event.bets ? event.bets.filter(b => b.choice === 'no') : [];
                    const yesTotal = yesBets.reduce((sum, b) => sum + b.amount, 0);
                    const noTotal = noBets.reduce((sum, b) => sum + b.amount, 0);

                    alert(`Détails #${eventId.substr(-6)}\n\nQuestion: ${event.question}\nCatégorie: ${event.category}\nStatut: ${event.status}\n\nOUI: ${yesBets.length} (${yesTotal.toLocaleString()} FCFA)\nNON: ${noBets.length} (${noTotal.toLocaleString()} FCFA)\n\nPot: ${(yesTotal + noTotal).toLocaleString()} FCFA`);
                });
        }

        function deleteEvent(eventId) {
            if (!confirm('Supprimer cet événement ?')) return;

            db.collection('events').doc(eventId).delete()
                .then(() => {
                    showToast('Événement supprimé', 'success');
                    loadRecentEvents();
                    loadEventsTable();
                    loadPendingResults();
                    updateStats();
                })
                .catch(error => {
                    showToast('Erreur: ' + error.message, 'error');
                });
        }

        function viewDeposit(depositId) {
            window.open('anit.html', '_blank');
        }

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
            }
            
            setTimeout(() => {
                toast.classList.remove('show');
            }, 3000);
        }

        function logout() {
            sessionStorage.removeItem('currentUser');
            showToast('Déconnexion réussie', 'success');
            setTimeout(() => {
                window.location.href = 'index.html';
            }, 1000);
        }
