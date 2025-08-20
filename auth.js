alert("TEST : Mon fichier auth.js a bien été rechargé !");

// -- DÉBUT DE LA CONFIGURATION FIREBASE --
// ... le reste de votre code


// auth.js

// -- DÉBUT DE LA CONFIGURATION FIREBASE --
// Configuration de votre projet Firebase (intégrée)
const firebaseConfig = {
  apiKey: "AIzaSyAxqsrggnSSwjuKh4MsV4l4WdhCGTT2NLI",
  authDomain: "trading-b780b.firebaseapp.com",
  projectId: "trading-b780b",
  storageBucket: "trading-b780b.appspot.com",
  messagingSenderId: "946655966659",
  appId: "1:946655966659:web:465e12a9c836930bc9b976",
  measurementId: "G-VTJZS831VT"
};

// Initialisation des services Firebase
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();
// -- FIN DE LA CONFIGURATION FIREBASE --


// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const loader = document.getElementById('loader');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

// --- FONCTIONS UTILITAIRES ---
const showLoader = () => loader.classList.remove('hidden');
const hideLoader = () => loader.classList.add('hidden');

// --- GESTION DES ÉVÉNEMENTS ---
showSignupLink.addEventListener('click', (e) => {
    e.preventDefault();
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
});
showLoginLink.addEventListener('click', (e) => {
    e.preventDefault();
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
});

// Gestion de l'inscription
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;
    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('Utilisateur inscrit :', userCredential.user.uid);
            return db.collection('portfolios').doc(userCredential.user.uid).set({
                userId: userCredential.user.uid,
                cash: 10000,
                coins: {}
            });
        })
        .then(() => {
            console.log('Portefeuille créé avec succès !');
            signupForm.reset();
            hideLoader();
        })
        .catch(error => {
            hideLoader();
            alert(`Erreur d'inscription : ${error.message}`);
        });
});

// Gestion de la connexion
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(userCredential => {
            console.log('Utilisateur connecté :', userCredential.user.uid);
            loginForm.reset();
            hideLoader();
        })
        .catch(error => {
            hideLoader();
            alert(`Erreur de connexion : ${error.message}`);
        });
});
