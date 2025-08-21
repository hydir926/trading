// auth.js

// -- INITIALISATION DE FIREBASE --
const firebaseConfig = {
  apiKey: "AIzaSyAxqsrggnSSwjuKh4MsV4l4WdhCGTT2NLI",
  authDomain: "trading-b780b.firebaseapp.com",
  projectId: "trading-b780b",
  storageBucket: "trading-b780b.appspot.com",
  messagingSenderId: "946655966659",
  appId: "1:946655966659:web:465e12a9c836930bc9b976",
};
firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

// -- SÉLECTION DES ÉLÉMENTS DU DOM --
const loader = document.getElementById('loader');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

// -- GESTION DES FORMULAIRES --
showSignupLink.addEventListener('click', () => {
    loginView.classList.add('hidden');
    signupView.classList.remove('hidden');
});
showLoginLink.addEventListener('click', () => {
    signupView.classList.add('hidden');
    loginView.classList.remove('hidden');
});

// -- LOGIQUE D'INSCRIPTION --
signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loader.classList.remove('hidden');
    
    const fullName = document.getElementById('signup-fullname').value;
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    auth.createUserWithEmailAndPassword(email, password)
        .then(cred => {
            // Sauvegarde les informations additionnelles dans Firestore
            return db.collection('users').doc(cred.user.uid).set({
                fullName: fullName,
                username: username,
                email: email,
                portfolio: {
                    cash: 10000,
                    coins: {}
                }
            });
        })
        .then(() => {
            signupForm.reset();
            loader.classList.add('hidden');
            // La redirection est gérée par l'observateur dans app.js
        })
        .catch(err => {
            alert(err.message);
            loader.classList.add('hidden');
        });
});

// -- LOGIQUE DE CONNEXION --
loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    loader.classList.remove('hidden');
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;

    auth.signInWithEmailAndPassword(email, password)
        .then(() => {
            loginForm.reset();
            loader.classList.add('hidden');
            // La redirection est gérée par l'observateur dans app.js
        })
        .catch(err => {
            alert(err.message);
            loader.classList.add('hidden');
        });
});