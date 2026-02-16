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
        image: 'https://pixabay.com/images/search/real%20madrid%20football/?utm_source=chatgpt.com'
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
    initSwipeGestures();
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

    db.collection('users').doc(currentUser.id).get()
        .then(doc => {
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
            }
        })
        .catch(err => console.error('Error loading user data:', err));
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
                </div>
                <div class="event-question">${event.question}</div>
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
                    let iconClass = 'bet';
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

// Sidebar Functions
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

function initSwipeGestures() {
    const sidebar = document.getElementById('sidebar');
    let touchStartX = 0;
    let touchEndX = 0;

    sidebar.addEventListener('touchstart', e => {
        touchStartX = e.changedTouches[0].screenX;
    });

    sidebar.addEventListener('touchend', e => {
        touchEndX = e.changedTouches[0].screenX;
        if (touchStartX - touchEndX > 50) {
            closeSidebar();
        }
    });
}

// Modal Functions
function openDepositModal() {
    document.getElementById('depositModal').classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeDepositModal() {
    document.getElementById('depositModal').classList.remove('active');
    document.body.style.overflow = '';
    document.getElementById('depositForm').reset();
}

function submitDeposit(e) {
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
    const comment = document.getElementById('depositComment').value;
    const screenshot = document.getElementById('depositScreenshot').files[0];

    if (!screenshot) {
        showToast('Veuillez joindre une capture d\'écran', 'error');
        btn.innerHTML = '<i class="fas fa-check-circle"></i> Envoyer la confirmation';
        btn.disabled = false;
        return;
    }

    const formData = new FormData();
    formData.append('file', screenshot);
    formData.append('upload_preset', cloudinaryConfig.uploadPreset);

    fetch(`https://api.cloudinary.com/v1_1/${cloudinaryConfig.cloudName}/image/upload`, {
        method: 'POST',
        body: formData
    })
        .then(res => res.json())
        .then(data => {
            if (data.error) throw new Error(data.error.message);

            return db.collection('deposit_requests').add({
                userId: currentUser.id,
                userName: `${currentUser.prenom || ''} ${currentUser.nom || ''}`.trim(),
                amount: amount,
                phone: phone,
                screenshotURL: data.secure_url,
                comment: comment || '',
                status: 'pending',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then(() => {
            showToast('Demande envoyée ! Vous serez notifié une fois validée.', 'success');
            closeDepositModal();
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Envoyer la confirmation';
            btn.disabled = false;
        })
        .catch(err => {
            console.error('Error:', err);
            showToast('Erreur: ' + err.message, 'error');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Envoyer la confirmation';
            btn.disabled = false;
        });
}

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

            currentUser.balance -= currentBetAmount;
            const storage = localStorage.getItem('currentUser') ? localStorage : sessionStorage;
            storage.setItem('currentUser', JSON.stringify(currentUser));

            loadUserData();
            loadEvents();
            loadHistory();
            updateStats();

            btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer le pari';
            btn.disabled = false;
        })
        .catch(err => {
            console.error('Error placing bet:', err);
            showToast('Erreur: ' + err.message, 'error');
            btn.innerHTML = '<i class="fas fa-check-circle"></i> Confirmer le pari';
            btn.disabled = false;
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
    } else {
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

function showSection(section) {
    showToast('Section ' + section + ' en développement', 'info');
}
