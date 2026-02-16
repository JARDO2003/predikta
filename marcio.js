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

// VAPID Key for Cloud Messaging
const vapidKey = "BPViQXia_vvFLKMAe2E2q5oTOX48XpRQIdx5P4xAFEPw";

// PWA Install functionality
let deferredPrompt;
const installBtn = document.getElementById('installBtn');

window.addEventListener('beforeinstallprompt', (e) => {
    // Empêcher l'affichage automatique
    e.preventDefault();
    // Sauvegarder l'événement
    deferredPrompt = e;
    // Afficher le bouton d'installation
    installBtn.classList.add('show');
});

function installApp() {
    if (!deferredPrompt) {
        showToast('L\'installation n\'est pas disponible', 'error');
        return;
    }

    // Afficher la boîte de dialogue d'installation
    deferredPrompt.prompt();

    // Attendre le choix de l'utilisateur
    deferredPrompt.userChoice.then((choiceResult) => {
        if (choiceResult.outcome === 'accepted') {
            showToast('Application installée avec succès !', 'success');
            installBtn.classList.remove('show');
        } else {
            showToast('Installation annulée', 'error');
        }
        deferredPrompt = null;
    });
}

// Cacher le bouton si l'app est déjà installée
window.addEventListener('appinstalled', () => {
    installBtn.classList.remove('show');
    showToast('Application installée !', 'success');
});

// Storage helper functions to handle tracking prevention
const storage = {
    setItem: function(key, value) {
        try {
            sessionStorage.setItem(key, value);
            return true;
        } catch (e) {
            console.warn('SessionStorage blocked:', e);
            // Fallback to in-memory storage
            window._memoryStorage = window._memoryStorage || {};
            window._memoryStorage[key] = value;
            return false;
        }
    },
    getItem: function(key) {
        try {
            return sessionStorage.getItem(key);
        } catch (e) {
            console.warn('SessionStorage blocked:', e);
            // Fallback to in-memory storage
            return window._memoryStorage ? window._memoryStorage[key] : null;
        }
    },
    removeItem: function(key) {
        try {
            sessionStorage.removeItem(key);
        } catch (e) {
            console.warn('SessionStorage blocked:', e);
            if (window._memoryStorage) {
                delete window._memoryStorage[key];
            }
        }
    }
};

// Check if user is already logged in
document.addEventListener('DOMContentLoaded', function() {
    // Vérifier d'abord dans localStorage (connexion persistante)
    let userStr = storage.getItem('currentUser');
    if (!userStr) {
        try {
            userStr = localStorage.getItem('currentUser');
        } catch (e) {
            console.warn('LocalStorage blocked');
        }
    }
    
    if (userStr) {
        try {
            const user = JSON.parse(userStr);
            redirectUser(user);
        } catch (e) {
            console.error('Error parsing user data:', e);
            storage.removeItem('currentUser');
            try {
                localStorage.removeItem('currentUser');
            } catch (err) {
                console.warn('LocalStorage blocked');
            }
        }
    }
    
    // Show notification banner after 2 seconds
    setTimeout(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            document.getElementById('notificationBanner').classList.add('show');
        }
    }, 2000);
});

// Notification functions
function requestNotificationPermission() {
    if (!('Notification' in window)) {
        showToast('Les notifications ne sont pas supportées par ce navigateur', 'error');
        return;
    }

    Notification.requestPermission().then((permission) => {
        if (permission === 'granted') {
            showToast('Notifications activées !', 'success');
            initMessaging();
        } else {
            showToast('Notifications refusées', 'error');
        }
        closeNotificationBanner();
    });
}

function closeNotificationBanner() {
    document.getElementById('notificationBanner').classList.remove('show');
}

function initMessaging() {
    try {
        const messaging = firebase.messaging();
        
        if ('serviceWorker' in navigator) {
            navigator.serviceWorker.register('firebase-messaging-sw.js')
                .then((registration) => {
                    messaging.getToken({ vapidKey: vapidKey, serviceWorkerRegistration: registration })
                        .then((currentToken) => {
                            if (currentToken) {
                                console.log('FCM Token:', currentToken);
                                // Save token with fallback storage
                                try {
                                    localStorage.setItem('fcmToken', currentToken);
                                } catch (e) {
                                    console.warn('LocalStorage blocked, token not saved');
                                }
                            }
                        })
                        .catch((err) => {
                            console.log('Error retrieving token:', err);
                        });
                })
                .catch((err) => {
                    console.log('Service worker registration failed:', err);
                });
        }
    } catch (error) {
        console.error('Messaging initialization error:', error);
    }
}

// Tab switching function
function showTab(tabName) {
    // Retirer la classe active de tous les onglets et contenus
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
    
    // Ajouter la classe active au bon onglet
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach((tab, index) => {
        if ((tabName === 'login' && index === 0) || (tabName === 'register' && index === 1)) {
            tab.classList.add('active');
        }
    });
    
    // Afficher le bon contenu
    document.getElementById(tabName + 'Tab').classList.add('active');
}

// Login function
function login(e) {
    e.preventDefault();
    
    const btn = document.getElementById('loginBtn');
    btn.innerHTML = '<span class="loading"></span> Connexion...';
    btn.disabled = true;

    const pseudo = document.getElementById('loginPseudo').value;
    const password = document.getElementById('loginPassword').value;

    db.collection('users').where('pseudo', '==', pseudo).where('password', '==', password).get()
        .then(snapshot => {
            if (snapshot.empty) {
                showToast('Pseudo ou mot de passe incorrect', 'error');
                btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
                btn.disabled = false;
                return;
            }

            const userDoc = snapshot.docs[0];
            const userData = { id: userDoc.id, ...userDoc.data() };
            
            // Sauvegarder dans sessionStorage ET localStorage pour connexion persistante
            storage.setItem('currentUser', JSON.stringify(userData));
            try {
                localStorage.setItem('currentUser', JSON.stringify(userData));
            } catch (e) {
                console.warn('LocalStorage blocked');
            }
            
            showToast('Connexion réussie !', 'success');
            
            setTimeout(() => {
                redirectUser(userData);
            }, 1000);
        })
        .catch(error => {
            showToast('Erreur: ' + error.message, 'error');
            btn.innerHTML = '<i class="fas fa-sign-in-alt"></i> Se connecter';
            btn.disabled = false;
        });
}

// Register function
function register(e) {
    e.preventDefault();
    
    const btn = document.getElementById('registerBtn');
    btn.innerHTML = '<span class="loading"></span> Inscription...';
    btn.disabled = true;

    const nom = document.getElementById('registerNom').value;
    const prenom = document.getElementById('registerPrenom').value;
    const pseudo = document.getElementById('registerPseudo').value;
    const contact = document.getElementById('registerContact').value;
    const password = document.getElementById('registerPassword').value;

    db.collection('users').where('pseudo', '==', pseudo).get()
        .then(snapshot => {
            if (!snapshot.empty) {
                showToast('Ce pseudo est déjà utilisé', 'error');
                btn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
                btn.disabled = false;
                return Promise.reject('pseudo_exists');
            }

            return db.collection('users').add({
                nom,
                prenom,
                pseudo,
                contact,
                password,
                balance: 0,
                role: 'user',
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
        })
        .then((docRef) => {
            if (docRef) {
                // Créer l'objet utilisateur
                const userData = {
                    id: docRef.id,
                    nom,
                    prenom,
                    pseudo,
                    contact,
                    password,
                    balance: 0,
                    role: 'user'
                };
                
                // Sauvegarder dans sessionStorage ET localStorage pour connexion persistante
                storage.setItem('currentUser', JSON.stringify(userData));
                try {
                    localStorage.setItem('currentUser', JSON.stringify(userData));
                } catch (e) {
                    console.warn('LocalStorage blocked');
                }
                
                showToast('Inscription réussie ! Redirection...', 'success');
                
                setTimeout(() => {
                    redirectUser(userData);
                }, 1000);
            }
        })
        .catch(error => {
            if (error !== 'pseudo_exists') {
                showToast('Erreur: ' + error.message, 'error');
                btn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
                btn.disabled = false;
            }
        });
}

// Admin login function
function adminLogin() {
    const password = prompt("Entrez le mot de passe administrateur :");
    const adminPassword = "marci@200@";

    if (password === adminPassword) {
        // Créer un objet admin pour la session
        const adminUser = {
            id: 'admin_local',
            pseudo: 'admin',
            prenom: 'Admin',
            nom: 'System',
            role: 'admin',
            balance: 0
        };
        
        // Stocker dans sessionStorage (comme le fait la fonction login normale)
        storage.setItem('currentUser', JSON.stringify(adminUser));
        showToast('Connexion admin réussie !', 'success');
        
        setTimeout(() => {
            window.location.href = 'creator-dashboard.html';
        }, 1000);
    } else if (password !== null) {
        showToast('Mot de passe incorrect !', 'error');
    }
}

// Redirect user based on role
function redirectUser(user) {
    if (user.role === 'admin' || user.role === 'creator') {
        window.location.href = 'creator-dashboard.html';
    } else {
        window.location.href = 'user-dashboard.html';
    }
}

// Show toast notification
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
