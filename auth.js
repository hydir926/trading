// auth.js

// 1. Initialisation de Firebase (collez votre configuration ici)
const firebaseConfig = {
    apiKey: "VOTRE_API_KEY",
    authDomain: "VOTRE_AUTH_DOMAIN",
    projectId: "VOTRE_PROJECT_ID",
    storageBucket: "VOTRE_STORAGE_BUCKET",
    messagingSenderId: "VOTRE_MESSAGING_SENDER_ID",
    appId: "VOTRE_APP_ID"
};

// Initialiser Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// 2. Références aux éléments du DOM
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignup = document.getElementById('show-signup');
const showLogin = document.getElementById('show-login');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');

// 3. Logique pour alterner entre les vues
showSignup.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
});

showLogin.addEventListener('click', (e) => {
    e.preventDefault();
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
});

// 4. Inscription
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('Utilisateur inscrit :', userCredential.user);
            // On peut aussi créer un document dans Firestore ici
            db.collection('users').doc(userCredential.user.uid).set({
                email: email,
                portfolio: { usd: 10000 } // Portefeuille de départ
            });
        })
        .catch(error => alert(error.message));
});

// 5. Connexion
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('Utilisateur connecté :', userCredential.user);
        })
        .catch(error => alert(error.message));
});