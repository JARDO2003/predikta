// Service Worker pour Firebase Cloud Messaging
// Ce fichier doit être à la racine du projet pour fonctionner correctement

importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Configuration Firebase
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

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);

// Initialiser Cloud Messaging
const messaging = firebase.messaging();

// Gestion des messages en arrière-plan
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Message reçu en arrière-plan:', payload);

    // Personnaliser la notification
    const notificationTitle = payload.notification.title || 'Predikta - Notification';
    const notificationOptions = {
        body: payload.notification.body || 'Vous avez une nouvelle notification',
        icon: '/icon-192x192.png', // Icône de l'application
        badge: '/badge-72x72.png', // Badge pour les notifications
        tag: payload.data?.tag || 'default',
        requireInteraction: false,
        actions: [
            {
                action: 'open',
                title: 'Ouvrir'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ],
        data: payload.data || {}
    };

    // Afficher la notification
    self.registration.showNotification(notificationTitle, notificationOptions);
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification cliquée:', event);

    const notification = event.notification;
    const action = event.action;
    const notificationData = notification.data || {};

    // Fermer la notification
    notification.close();

    if (action === 'close') {
        return;
    }

    // Ouvrir ou focaliser l'application
    event.waitUntil(
        clients.matchAll({ type: 'window', includeUncontrolled: true })
            .then((clientList) => {
                // Chercher une fenêtre existante
                for (const client of clientList) {
                    if (client.url.includes(self.location.origin) && 'focus' in client) {
                        // Rediriger vers la page appropriée selon le type de notification
                        let targetUrl = client.url;
                        
                        if (notificationData.type === 'bet_result') {
                            targetUrl = '/user-dashboard.html';
                        } else if (notificationData.type === 'deposit_approved') {
                            targetUrl = '/user-dashboard.html';
                        } else if (notificationData.type === 'new_event') {
                            targetUrl = '/user-dashboard.html';
                        }
                        
                        return client.navigate(targetUrl).then(() => client.focus());
                    }
                }
                
                // Ouvrir une nouvelle fenêtre si aucune n'existe
                if (clients.openWindow) {
                    let targetUrl = '/';
                    
                    if (notificationData.type === 'bet_result') {
                        targetUrl = '/user-dashboard.html';
                    } else if (notificationData.type === 'deposit_approved') {
                        targetUrl = '/user-dashboard.html';
                    } else if (notificationData.type === 'new_event') {
                        targetUrl = '/user-dashboard.html';
                    }
                    
                    return clients.openWindow(targetUrl);
                }
            })
    );
});

// Installation du service worker
self.addEventListener('install', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker installé');
    self.skipWaiting();
});

// Activation du service worker
self.addEventListener('activate', (event) => {
    console.log('[firebase-messaging-sw.js] Service Worker activé');
    event.waitUntil(clients.claim());
});

// Gestion des messages du client (pour les notifications locales)
self.addEventListener('message', (event) => {
    console.log('[firebase-messaging-sw.js] Message reçu du client:', event.data);
    
    if (event.data && event.data.type === 'SHOW_NOTIFICATION') {
        const { title, body, icon, data } = event.data.payload;
        
        self.registration.showNotification(title, {
            body: body,
            icon: icon || '/icon-192x192.png',
            badge: '/badge-72x72.png',
            tag: data?.tag || 'local-notification',
            requireInteraction: false,
            data: data || {}
        });
    }
});
