// app.js

const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const cryptoListDiv = document.getElementById('crypto-list');

// Détecteur d'état d'authentification
auth.onAuthStateChanged(user => {
    if (user) {
        // L'utilisateur est connecté
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailSpan.textContent = user.email;

        // Charger les données crypto
        fetchCryptoData();
    } else {
        // L'utilisateur est déconnecté
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
    }
});

// Déconnexion
logoutButton.addEventListener('click', () => {
    auth.signOut();
});

// Fonction pour récupérer et afficher les données de CoinGecko
async function fetchCryptoData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        if (!response.ok) {
            throw new Error('La requête a échoué');
        }
        const coins = await response.json();
        
        // Vider la liste existante
        cryptoListDiv.innerHTML = ''; 

        // Créer et ajouter chaque crypto à la liste
        coins.forEach(coin => {
            const coinElement = document.createElement('div');
            coinElement.innerHTML = `
                <p>
                    <img src="${coin.image}" width="20" alt="${coin.name}">
                    <strong>${coin.name} (${coin.symbol.toUpperCase()})</strong>: 
                    $${coin.current_price.toLocaleString()}
                </p>
            `;
            cryptoListDiv.appendChild(coinElement);
        });

    } catch (error) {
        cryptoListDiv.innerHTML = "Erreur lors du chargement des données.";
        console.error(error);
    }
}