// auth.js

const firebaseConfig = {
  apiKey: "AIzaSyAxqsrggnSSwjuKh4MsV4l4WdhCGTT2NLI",
  authDomain: "trading-b780b.firebaseapp.com",
  projectId: "trading-b780b",
  storageBucket: "trading-b780b.appspot.com",
  messagingSenderId: "946655966659",
  appId: "1:946655966659:web:465e12a9c836930bc9b976",
  measurementId: "G-VTJZS831VT"
};

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();
const db = firebase.firestore();

const loader = document.getElementById('loader');
const loginView = document.getElementById('login-view');
const signupView = document.getElementById('signup-view');
const loginForm = document.getElementById('login-form');
const signupForm = document.getElementById('signup-form');
const showSignupLink = document.getElementById('show-signup');
const showLoginLink = document.getElementById('show-login');

const showLoader = () => loader.classList.remove('hidden');
const hideLoader = () => loader.classList.add('hidden');

showSignupLink.addEventListener('click', (e) => { e.preventDefault(); loginView.classList.add('hidden'); signupView.classList.remove('hidden'); });
showLoginLink.addEventListener('click', (e) => { e.preventDefault(); signupView.classList.add('hidden'); loginView.classList.remove('hidden'); });

signupForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();
    
    const fullName = document.getElementById('signup-fullname').value;
    const username = document.getElementById('signup-username').value;
    const email = document.getElementById('signup-email').value;
    const password = document.getElementById('signup-password').value;

    if (fullName.trim() === '' || username.trim() === '') {
        hideLoader();
        return alert("Veuillez remplir tous les champs.");
    }

    auth.createUserWithEmailAndPassword(email, password)
        .then(userCredential => {
            // Création d'un document utilisateur complet dans la collection 'users'
            return db.collection('users').doc(userCredential.user.uid).set({
                userId: userCredential.user.uid,
                email: email,
                fullName: fullName,
                username: username,
                portfolio: { // Le portefeuille est maintenant un objet imbriqué
                    cash: 10000,
                    coins: {}
                }
            });
        })
        .then(() => {
            console.log('Utilisateur et profil créés avec succès !');
            signupForm.reset();
            hideLoader();
        })
        .catch(error => {
            hideLoader();
            alert(`Erreur d'inscription : ${error.message}`);
        });
});

loginForm.addEventListener('submit', (e) => {
    e.preventDefault();
    showLoader();
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    auth.signInWithEmailAndPassword(email, password)
        .then(() => { loginForm.reset(); hideLoader(); })
        .catch(error => { hideLoader(); alert(`Erreur de connexion : ${error.message}`); });
});
