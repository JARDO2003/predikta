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

        // Global Variables
        let currentUser = null;
        let eventsData = [];
        let currentFilter = 'all';

        // Initialize
        document.addEventListener('DOMContentLoaded', function() {
            checkAuth();
            loadDashboardData();
            loadEvents();
            loadTransactions();
            loadUsers();
        });

        // Auth Check
        function checkAuth() {
            const userStr = sessionStorage.getItem('currentUser') || localStorage.getItem('currentUser');
            if (!userStr) {
                window.location.href = 'index.html';
                return;
            }
            
            try {
                currentUser = JSON.parse(userStr);
                
                if (currentUser.role !== 'admin' && currentUser.role !== 'creator') {
                    window.location.href = 'user-dashboard.html';
                    return;
                }

                document.getElementById('userName').textContent = currentUser.prenom || currentUser.pseudo || 'Admin';
                document.getElementById('userPseudo').textContent = '@' + (currentUser.pseudo || 'admin');
                document.getElementById('userAvatar').textContent = (currentUser.prenom || currentUser.pseudo || 'A').charAt(0).toUpperCase();
            } catch (e) {
                console.error('Error parsing user data:', e);
                window.location.href = 'index.html';
            }
        }

        // Navigation
        function showSection(sectionName) {
            document.querySelectorAll('.content-section').forEach(section => {
                section.classList.remove('active');
            });
            
            document.querySelectorAll('.nav-link').forEach(link => {
                link.classList.remove('active');
            });
            
            document.getElementById(sectionName + '-section').classList.add('active');
            
            const sectionMap = {
                'dashboard': 0,
                'events': 1,
                'transactions': 2,
                'users': 3,
                'settings': 4
            };
            
            const navLinks = document.querySelectorAll('.nav-link');
            if (sectionMap[sectionName] !== undefined && navLinks[sectionMap[sectionName]]) {
                navLinks[sectionMap[sectionName]].classList.add('active');
            }

            if (sectionName === 'events') loadEvents();
            if (sectionName === 'transactions') loadTransactions();
            if (sectionName === 'users') loadUsers();
        }

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

        // Dashboard Data
        async function loadDashboardData() {
            try {
                // Events
                const eventsSnapshot = await db.collection('events').where('status', '==', 'active').get();
                const totalEvents = eventsSnapshot.size;
                document.getElementById('totalEvents').textContent = totalEvents;
                document.getElementById('eventCountBadge').textContent = totalEvents;

                // Revenue
                const betsSnapshot = await db.collection('bets').where('status', '==', 'won').get();
                let totalRevenue = 0;
                betsSnapshot.forEach(doc => {
                    const bet = doc.data();
                    totalRevenue += (bet.amount * 0.02);
                });
                document.getElementById('totalRevenue').textContent = formatCurrency(totalRevenue);
                document.getElementById('totalRevenueDisplay').textContent = formatCurrency(totalRevenue);

                // Users
                const usersSnapshot = await db.collection('users').get();
                document.getElementById('totalUsers').textContent = usersSnapshot.size;

                // Pending Transactions
                const pendingSnapshot = await db.collection('transactions').where('status', '==', 'pending').get();
                const pendingCount = pendingSnapshot.size;
                document.getElementById('pendingTransactions').textContent = pendingCount;
                document.getElementById('transactionCountBadge').textContent = pendingCount;
                
                const pendingAlert = document.getElementById('pendingAlert');
                if (pendingCount > 0) {
                    pendingAlert.style.display = 'block';
                } else {
                    pendingAlert.style.display = 'none';
                }

                loadRecentActivity();
            } catch (error) {
                console.error('Error loading dashboard:', error);
                showToast('Erreur de chargement des données', 'error');
            }
        }

        async function loadRecentActivity() {
            try {
                const snapshot = await db.collection('transactions')
                    .orderBy('createdAt', 'desc')
                    .limit(5)
                    .get();

                const container = document.getElementById('recentActivity');
                
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-inbox"></i>
                            <p>Aucune activité récente</p>
                        </div>
                    `;
                    return;
                }

                let html = '<div class="payment-list">';
                snapshot.forEach(doc => {
                    const t = doc.data();
                    html += createTransactionItemHTML(doc.id, t, true);
                });
                html += '</div>';
                container.innerHTML = html;
            } catch (error) {
                console.error('Error loading activity:', error);
            }
        }

        // Events Management
        async function loadEvents() {
            try {
                let query = db.collection('events').orderBy('createdAt', 'desc');
                
                if (currentFilter !== 'all') {
                    query = query.where('status', '==', currentFilter);
                }

                const snapshot = await query.get();
                eventsData = [];
                
                const container = document.getElementById('eventsList');
                
                if (snapshot.empty) {
                    container.innerHTML = `
                        <div class="empty-state" style="grid-column: 1/-1;">
                            <i class="fas fa-calendar-plus"></i>
                            <p>Aucun événement trouvé</p>
                        </div>
                    `;
                    return;
                }

                let html = '';
                snapshot.forEach(doc => {
                    const event = { id: doc.id, ...doc.data() };
                    eventsData.push(event);
                    html += createEventCardHTML(event);
                });
                
                container.innerHTML = html;
            } catch (error) {
                console.error('Error loading events:', error);
            }
        }

        function createEventCardHTML(event) {
            const question = event.question || 'Question non définie';
            const date = event.date ? new Date(event.date.seconds * 1000).toLocaleDateString('fr-FR', {
                day: 'numeric',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            }) : 'Date non définie';
            
            const statusClass = {
                'active': 'status-active',
                'pending': 'status-pending',
                'completed': 'status-completed',
                'cancelled': 'status-cancelled'
            }[event.status] || 'status-pending';

            const statusText = {
                'active': 'Actif',
                'pending': 'En attente',
                'completed': 'Terminé',
                'cancelled': 'Annulé'
            }[event.status] || 'En attente';

            const categoryIcon = getCategoryIcon(event.category);
            const yesBets = event.bets ? event.bets.filter(b => b.choice === 'yes').length : 0;
            const noBets = event.bets ? event.bets.filter(b => b.choice === 'no').length : 0;
            const totalPot = event.bets ? event.bets.reduce((sum, b) => sum + b.amount, 0) : 0;

            return `
                <div class="event-card" data-id="${event.id}">
                    <div class="event-header">
                        <span class="event-category">
                            <i class="fas fa-${categoryIcon}"></i>
                            ${event.category || 'Sport'}
                        </span>
                        <span class="status ${statusClass} event-status">${statusText}</span>
                        <div class="event-question" style="margin-top: 1rem;">${question}</div>
                        <div class="event-date">
                            <i class="fas fa-clock"></i> 
                            Clôture: ${date}
                        </div>
                    </div>
                    <div class="event-body">
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
                            <button class="btn btn-secondary btn-sm" onclick="editEvent('${event.id}')">
                                <i class="fas fa-edit"></i> Modifier
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="deleteEvent('${event.id}')">
                                <i class="fas fa-trash"></i> Supprimer
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }

        function getCategoryIcon(category) {
            const icons = {
                'sport': 'futbol',
                'politique': 'landmark',
                'entertainment': 'film',
                'crypto': 'bitcoin',
                'music': 'music',
                'autre': 'tag'
            };
            return icons[category] || 'tag';
        }

        function filterEvents(filter, btnElement) {
            currentFilter = filter;
            
            document.querySelectorAll('.filter-btn').forEach(btn => {
                btn.classList.remove('active');
            });
            if (btnElement) {
                btnElement.classList.add('active');
            }
            
            loadEvents();
        }

        function openModal(modalId) {
            document.getElementById(modalId).classList.add('active');
            document.body.style.overflow = 'hidden';
            
            if (modalId === 'eventModal') {
                document.getElementById('eventModalTitle').textContent = 'Nouvel Événement';
                document.getElementById('eventForm').reset();
                document.getElementById('eventId').value = '';
                const defaultDate = new Date();
                defaultDate.setDate(defaultDate.getDate() + 7);
                document.getElementById('eventDate').value = defaultDate.toISOString().slice(0, 16);
            }
        }

        function closeModal(modalId) {
            document.getElementById(modalId).classList.remove('active');
            document.body.style.overflow = '';
        }

        async function saveEvent() {
            const eventId = document.getElementById('eventId').value;
            
            const eventData = {
                question: document.getElementById('eventQuestion').value.trim(),
                category: document.getElementById('eventCategory').value,
                date: new Date(document.getElementById('eventDate').value),
                description: document.getElementById('eventDescription').value.trim(),
                minBet: parseInt(document.getElementById('eventMinBet').value) || 100,
                status: document.getElementById('eventStatus').value,
                updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (!eventData.question) {
                showToast('Veuillez entrer la question de prédiction', 'error');
                return;
            }

            if (!document.getElementById('eventDate').value) {
                showToast('Veuillez sélectionner une date', 'error');
                return;
            }

            try {
                if (eventId) {
                    await db.collection('events').doc(eventId).update(eventData);
                    showToast('Événement modifié avec succès !', 'success');
                } else {
                    eventData.createdAt = firebase.firestore.FieldValue.serverTimestamp();
                    eventData.createdBy = currentUser.id;
                    eventData.bets = [];
                    await db.collection('events').add(eventData);
                    showToast('Événement créé avec succès !', 'success');
                }
                
                closeModal('eventModal');
                loadEvents();
                loadDashboardData();
            } catch (error) {
                console.error('Error saving event:', error);
                showToast('Erreur: ' + error.message, 'error');
            }
        }

        async function editEvent(eventId) {
            try {
                const doc = await db.collection('events').doc(eventId).get();
                if (!doc.exists) {
                    showToast('Événement non trouvé', 'error');
                    return;
                }

                const event = doc.data();
                
                document.getElementById('eventId').value = eventId;
                document.getElementById('eventQuestion').value = event.question || '';
                document.getElementById('eventCategory').value = event.category || 'sport';
                document.getElementById('eventDate').value = event.date ? new Date(event.date.seconds * 1000).toISOString().slice(0, 16) : '';
                document.getElementById('eventDescription').value = event.description || '';
                document.getElementById('eventMinBet').value = event.minBet || 100;
                document.getElementById('eventStatus').value = event.status || 'active';

                document.getElementById('eventModalTitle').textContent = 'Modifier l\'Événement';
                openModal('eventModal');
            } catch (error) {
                console.error('Error loading event:', error);
                showToast('Erreur de chargement', 'error');
            }
        }

        async function deleteEvent(eventId) {
            if (!confirm('Êtes-vous sûr de vouloir supprimer cet événement ?')) return;

            try {
                const betsSnapshot = await db.collection('bets').where('eventId', '==', eventId).limit(1).get();
                
                if (!betsSnapshot.empty) {
                    if (!confirm('Attention: Des paris ont été placés. Supprimer quand même ?')) {
                        return;
                    }
                }

                await db.collection('events').doc(eventId).delete();
                showToast('Événement supprimé', 'success');
                loadEvents();
                loadDashboardData();
            } catch (error) {
                console.error('Error deleting event:', error);
                showToast('Erreur de suppression', 'error');
            }
        }

        // Transactions Management
        async function loadTransactions() {
            try {
                // Pending Deposits
                const depositsSnapshot = await db.collection('transactions')
                    .where('type', '==', 'deposit')
                    .where('status', '==', 'pending')
                    .orderBy('createdAt', 'desc')
                    .get();

                const depositsContainer = document.getElementById('pendingDepositsList');
                
                if (depositsSnapshot.empty) {
                    depositsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <p>Aucun dépôt en attente</p>
                        </div>
                    `;
                } else {
                    let html = '';
                    depositsSnapshot.forEach(doc => {
                        const t = doc.data();
                        html += createTransactionItemHTML(doc.id, t);
                    });
                    depositsContainer.innerHTML = html;
                }

                // Pending Withdrawals
                const withdrawalsSnapshot = await db.collection('transactions')
                    .where('type', '==', 'withdrawal')
                    .where('status', '==', 'pending')
                    .orderBy('createdAt', 'desc')
                    .get();

                const withdrawalsContainer = document.getElementById('pendingWithdrawalsList');
                
                if (withdrawalsSnapshot.empty) {
                    withdrawalsContainer.innerHTML = `
                        <div class="empty-state">
                            <i class="fas fa-check-circle" style="color: var(--success);"></i>
                            <p>Aucun retrait en attente</p>
                        </div>
                    `;
                } else {
                    let html = '';
                    withdrawalsSnapshot.forEach(doc => {
                        const t = doc.data();
                        html += createTransactionItemHTML(doc.id, t);
                    });
                    withdrawalsContainer.innerHTML = html;
                }

                // History
                const historySnapshot = await db.collection('transactions')
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();

                const historyTable = document.getElementById('transactionsHistoryTable');
                
                if (historySnapshot.empty) {
                    historyTable.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray);">
                                <i class="fas fa-inbox" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                                Aucun historique
                            </td>
                        </tr>
                    `;
                } else {
                    let html = '';
                    historySnapshot.forEach(doc => {
                        const t = doc.data();
                        html += createTransactionRowHTML(doc.id, t);
                    });
                    historyTable.innerHTML = html;
                }
            } catch (error) {
                console.error('Error loading transactions:', error);
            }
        }

        function createTransactionItemHTML(id, t, compact = false) {
            const user = t.userName || t.userPseudo || 'Utilisateur';
            const initial = user.charAt(0).toUpperCase();
            const amount = t.amount || 0;
            const isDeposit = t.type === 'deposit';
            
            return `
                <div class="payment-item">
                    <div class="payment-avatar" style="background: ${isDeposit ? 'linear-gradient(135deg, #10b981 0%, #059669 100%)' : 'linear-gradient(135deg, #ef4444 0%, #dc2626 100%)'};">
                        ${initial}
                    </div>
                    <div class="payment-info">
                        <div class="payment-user">${user}</div>
                        <div class="payment-details">
                            <span class="type-badge ${t.type}">${isDeposit ? 'DÉPÔT' : 'RETRAIT'}</span>
                            • ${formatDate(t.createdAt)}
                        </div>
                    </div>
                    <div class="payment-amount ${t.type}">
                        ${isDeposit ? '+' : '-'}${formatCurrency(amount)}
                    </div>
                    ${!compact ? `
                        <div class="payment-actions">
                            <button class="btn btn-success btn-sm" onclick="openTransactionModal('${id}', '${user}', ${amount}, '${t.type}', '${t.userId}', '${t.screenshotURL || ''}')">
                                <i class="fas fa-check"></i>
                            </button>
                            <button class="btn btn-danger btn-sm" onclick="rejectTransaction('${id}', '${t.userId}', ${amount}, '${t.type}')">
                                <i class="fas fa-times"></i>
                            </button>
                        </div>
                    ` : ''}
                </div>
            `;
        }

        function createTransactionRowHTML(id, t) {
            const statusClass = {
                'pending': 'status-pending',
                'completed': 'status-completed',
                'approved': 'status-completed',
                'rejected': 'status-cancelled'
            }[t.status] || 'status-pending';

            const statusText = {
                'pending': 'En attente',
                'completed': 'Validé',
                'approved': 'Validé',
                'rejected': 'Rejeté'
            }[t.status] || 'En attente';

            const user = t.userName || t.userPseudo || 'Utilisateur';
            const isDeposit = t.type === 'deposit';

            return `
                <tr>
                    <td><span class="type-badge ${t.type}">${isDeposit ? 'DÉPÔT' : 'RETRAIT'}</span></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 0.75rem;">
                            <div class="payment-avatar" style="width: 35px; height: 35px; font-size: 0.9rem;">
                                ${user.charAt(0).toUpperCase()}
                            </div>
                            <span>${user}</span>
                        </div>
                    </td>
                    <td style="font-weight: 600; color: ${isDeposit ? 'var(--success)' : 'var(--danger)'};">
                        ${isDeposit ? '+' : '-'}${formatCurrency(t.amount || 0)}
                    </td>
                    <td>
                        ${t.phone ? `<div><i class="fas fa-phone" style="font-size: 0.8rem; color: var(--gray);"></i> ${t.phone}</div>` : ''}
                        ${t.transactionId ? `<div style="font-size: 0.8rem; color: var(--gray);">ID: ${t.transactionId}</div>` : ''}
                        ${t.screenshotURL ? `<a href="${t.screenshotURL}" target="_blank" style="font-size: 0.8rem; color: var(--primary);"><i class="fas fa-image"></i> Voir capture</a>` : ''}
                    </td>
                    <td>${formatDate(t.createdAt)}</td>
                    <td><span class="status ${statusClass}">${statusText}</span></td>
                    <td>
                        ${t.status === 'pending' ? `
                            <button class="btn btn-success btn-sm" onclick="openTransactionModal('${id}', '${user}', ${t.amount}, '${t.type}', '${t.userId}', '${t.screenshotURL || ''}')">
                                <i class="fas fa-check"></i>
                            </button>
                        ` : '<span style="color: var(--gray);">-</span>'}
                    </td>
                </tr>
            `;
        }

        function openTransactionModal(id, userName, amount, type, userId, screenshotURL) {
            document.getElementById('transactionId').value = id;
            document.getElementById('transactionType').value = type;
            document.getElementById('transactionUserId').value = userId;
            document.getElementById('transactionUserName').textContent = userName;
            document.getElementById('transactionUserAvatar').textContent = userName.charAt(0).toUpperCase();
            document.getElementById('transactionDetails').textContent = type === 'deposit' ? 'Demande de dépôt' : 'Demande de retrait';
            document.getElementById('transactionAmount').textContent = (type === 'deposit' ? '+' : '-') + formatCurrency(amount);
            document.getElementById('transactionAction').value = 'approve';
            document.getElementById('transactionComment').value = '';
            
            // Show screenshot if available
            const screenshotContainer = document.getElementById('transactionScreenshotContainer');
            const screenshotImg = document.getElementById('transactionScreenshot');
            if (screenshotURL) {
                screenshotContainer.style.display = 'block';
                screenshotImg.src = screenshotURL;
            } else {
                screenshotContainer.style.display = 'none';
                screenshotImg.src = '';
            }

            // Update warning text
            const warningText = document.getElementById('transactionWarningText');
            if (type === 'deposit') {
                warningText.textContent = 'Le solde de l\'utilisateur sera crédité du montant du dépôt';
            } else {
                warningText.textContent = 'Le retrait sera marqué comme complété (le montant a déjà été déduit du solde)';
            }
            
            openModal('transactionModal');
        }

        async function processTransaction() {
            const id = document.getElementById('transactionId').value;
            const type = document.getElementById('transactionType').value;
            const action = document.getElementById('transactionAction').value;
            const comment = document.getElementById('transactionComment').value;
            const userId = document.getElementById('transactionUserId').value;

            if (!id) {
                showToast('Erreur: ID de transaction manquant', 'error');
                return;
            }

            try {
                const transactionRef = db.collection('transactions').doc(id);
                const transactionDoc = await transactionRef.get();
                
                if (!transactionDoc.exists) {
                    showToast('Transaction non trouvée', 'error');
                    return;
                }

                const transaction = transactionDoc.data();

                if (action === 'approve') {
                    // Mettre à jour la transaction
                    await transactionRef.update({
                        status: 'completed',
                        validatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        validatedBy: currentUser.id,
                        comment: comment
                    });

                    // Pour un dépôt, créditer le compte
                    if (type === 'deposit') {
                        if (userId || transaction.userId) {
                            const targetUserId = userId || transaction.userId;
                            const userRef = db.collection('users').doc(targetUserId);
                            const userDoc = await userRef.get();
                            
                            if (userDoc.exists) {
                                await userRef.update({
                                    balance: firebase.firestore.FieldValue.increment(transaction.amount || 0)
                                });
                            }
                        }
                        showToast('Dépôt approuvé et solde crédité', 'success');
                    } else {
                        // Pour un retrait, déduire le pendingWithdrawal
                        if (userId || transaction.userId) {
                            const targetUserId = userId || transaction.userId;
                            const userRef = db.collection('users').doc(targetUserId);
                            await userRef.update({
                                pendingWithdrawal: firebase.firestore.FieldValue.increment(-(transaction.amount || 0))
                            });
                        }
                        showToast('Retrait approuvé et traité', 'success');
                    }
                } else {
                    // Rejeter la transaction
                    await transactionRef.update({
                        status: 'rejected',
                        validatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                        validatedBy: currentUser.id,
                        comment: comment
                    });

                    // Si c'était un retrait, rembourser l'utilisateur
                    if (type === 'withdrawal') {
                        if (userId || transaction.userId) {
                            const targetUserId = userId || transaction.userId;
                            const userRef = db.collection('users').doc(targetUserId);
                            await userRef.update({
                                balance: firebase.firestore.FieldValue.increment(transaction.amount || 0),
                                pendingWithdrawal: firebase.firestore.FieldValue.increment(-(transaction.amount || 0))
                            });
                        }
                        showToast('Retrait rejeté - Montant remboursé', 'error');
                    } else {
                        showToast('Dépôt rejeté', 'error');
                    }
                }

                closeModal('transactionModal');
                loadTransactions();
                loadDashboardData();
            } catch (error) {
                console.error('Error processing transaction:', error);
                showToast('Erreur: ' + error.message, 'error');
            }
        }

        async function rejectTransaction(id, userId, amount, type) {
            if (!confirm('Êtes-vous sûr de vouloir rejeter cette transaction ?')) return;

            try {
                await db.collection('transactions').doc(id).update({
                    status: 'rejected',
                    validatedAt: firebase.firestore.FieldValue.serverTimestamp(),
                    validatedBy: currentUser.id
                });

                // Si c'était un retrait, rembourser
                if (type === 'withdrawal') {
                    const userRef = db.collection('users').doc(userId);
                    await userRef.update({
                        balance: firebase.firestore.FieldValue.increment(amount),
                        pendingWithdrawal: firebase.firestore.FieldValue.increment(-amount)
                    });
                }

                showToast('Transaction rejetée', 'error');
                loadTransactions();
                loadDashboardData();
            } catch (error) {
                console.error('Error rejecting transaction:', error);
                showToast('Erreur', 'error');
            }
        }

        function refreshTransactions() {
            loadTransactions();
            showToast('Liste actualisée', 'success');
        }

        // Users Management
        async function loadUsers() {
            try {
                const snapshot = await db.collection('users').orderBy('createdAt', 'desc').get();
                const table = document.getElementById('usersTable');
                
                if (snapshot.empty) {
                    table.innerHTML = `
                        <tr>
                            <td colspan="7" style="text-align: center; padding: 2rem; color: var(--gray);">
                                <i class="fas fa-users" style="font-size: 2rem; margin-bottom: 0.5rem; display: block;"></i>
                                Aucun utilisateur
                            </td>
                        </tr>
                    `;
                    return;
                }

                // Compter les paris pour chaque utilisateur
                const betsSnapshot = await db.collection('bets').get();
                const userBets = {};
                betsSnapshot.forEach(doc => {
                    const bet = doc.data();
                    userBets[bet.userId] = (userBets[bet.userId] || 0) + 1;
                });

                let html = '';
                snapshot.forEach(doc => {
                    const user = doc.data();
                    const userId = doc.id;
                    const betsCount = userBets[userId] || 0;
                    
                    html += `
                        <tr>
                            <td>
                                <div style="display: flex; align-items: center; gap: 0.75rem;">
                                    <div class="payment-avatar" style="width: 35px; height: 35px; font-size: 0.9rem; background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                                        ${(user.prenom || user.pseudo || 'U').charAt(0).toUpperCase()}
                                    </div>
                                    <div>
                                        <div style="font-weight: 600;">${user.prenom || ''} ${user.nom || ''}</div>
                                        <div style="font-size: 0.8rem; color: var(--gray);">@${user.pseudo}</div>
                                    </div>
                                </div>
                            </td>
                            <td>${user.contact || '-'}</td>
                            <td style="font-weight: 600;">${formatCurrency(user.balance || 0)}</td>
                            <td style="color: var(--warning);">${formatCurrency(user.pendingWithdrawal || 0)}</td>
                            <td>${betsCount}</td>
                            <td><span class="status ${user.role === 'admin' ? 'status-active' : 'status-completed'}">${user.role || 'user'}</span></td>
                            <td>
                                <button class="btn btn-secondary btn-sm" onclick="viewUser('${userId}')">
                                    <i class="fas fa-eye"></i>
                                </button>
                            </td>
                        </tr>
                    `;
                });
                
                table.innerHTML = html;
            } catch (error) {
                console.error('Error loading users:', error);
            }
        }

        function viewUser(userId) {
            showToast('Détails utilisateur - Fonctionnalité en développement', 'info');
        }

        // Settings
        function saveSettings() {
            const settings = {
                commission: parseFloat(document.getElementById('commissionRate').value),
                minBet: parseInt(document.getElementById('minBet').value),
                maxBet: parseInt(document.getElementById('maxBet').value),
                minWithdrawal: parseInt(document.getElementById('minWithdrawal').value),
                updatedAt: new Date().toISOString()
            };
            
            localStorage.setItem('predikta_settings', JSON.stringify(settings));
            showToast('Paramètres enregistrés avec succès', 'success');
        }

        // Utilities
        function formatCurrency(amount) {
            if (amount === undefined || amount === null) return '0 FCFA';
            return new Intl.NumberFormat('fr-FR').format(Math.floor(amount)) + ' FCFA';
        }

        function formatDate(timestamp) {
            if (!timestamp) return '-';
            
            let date;
            if (timestamp.toDate) {
                date = timestamp.toDate();
            } else if (timestamp.seconds) {
                date = new Date(timestamp.seconds * 1000);
            } else {
                date = new Date(timestamp);
            }
            
            return date.toLocaleDateString('fr-FR', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit'
            });
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

        // Load saved settings
        function loadSettings() {
            const saved = localStorage.getItem('predikta_settings');
            if (saved) {
                try {
                    const settings = JSON.parse(saved);
                    document.getElementById('commissionRate').value = settings.commission || 2;
                    document.getElementById('minBet').value = settings.minBet || 100;
                    document.getElementById('maxBet').value = settings.maxBet || 100000;
                    document.getElementById('minWithdrawal').value = settings.minWithdrawal || 1000;
                } catch (e) {
                    console.error('Error loading settings:', e);
                }
            }
        }

        document.addEventListener('DOMContentLoaded', loadSettings);
