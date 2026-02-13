// Import Firebase scripts for service worker
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.0/firebase-messaging-compat.js');

// Initialize Firebase in the service worker
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

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
    console.log('[firebase-messaging-sw.js] Received background message ', payload);
    
    const notificationTitle = payload.notification.title || 'Predikta';
    const notificationOptions = {
        body: payload.notification.body || 'Vous avez une nouvelle notification',
        icon: '/icon-192x192.png',
        badge: '/icon-72x72.png',
        data: payload.data,
        requireInteraction: true,
        actions: [
            {
                action: 'open',
                title: 'Ouvrir'
            },
            {
                action: 'close',
                title: 'Fermer'
            }
        ]
    };

    return self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification clicks
self.addEventListener('notificationclick', (event) => {
    console.log('[firebase-messaging-sw.js] Notification click received.');
    
    event.notification.close();

    if (event.action === 'open' || !event.action) {
        // Open the app
        event.waitUntil(
            clients.openWindow('/')
        );
    }
});
