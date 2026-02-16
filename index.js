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
            const userStr = storage.getItem('currentUser');
            if (userStr) {
                try {
                    const user = JSON.parse(userStr);
                    redirectUser(user);
                } catch (e) {
                    console.error('Error parsing user data:', e);
                    storage.removeItem('currentUser');
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

        function showTab(tab) {
            document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
            document.querySelectorAll('.tab-content').forEach(c => c.classList.remove('active'));
            
            event.target.classList.add('active');
            document.getElementById(tab + 'Tab').classList.add('active');
        }

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
                    
                    storage.setItem('currentUser', JSON.stringify(userData));
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
                        return;
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
                .then(() => {
                    showToast('Inscription réussie ! Vous pouvez maintenant vous connecter.', 'success');
                    document.getElementById('registerForm').reset();
                    showTab('login');
                    btn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
                    btn.disabled = false;
                })
                .catch(error => {
                    showToast('Erreur: ' + error.message, 'error');
                    btn.innerHTML = '<i class="fas fa-user-plus"></i> S\'inscrire';
                    btn.disabled = false;
                });
        }

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

        function redirectUser(user) {
            if (user.role === 'admin' || user.role === 'creator') {
                window.location.href = 'creator-dashboard.html';
            } else {
                window.location.href = 'user-dashboard.html';
            }
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
