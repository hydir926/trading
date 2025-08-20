// app.js

// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');

const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const portfolioValueDiv = document.getElementById('portfolio-value');
const cryptoTableContainer = document.getElementById('crypto-table-container');

// Variable pour stocker la fonction de désinscription de l'écouteur
let unsubscribePortfolio;

// --- GESTION DE L'ÉTAT DE L'APPLICATION ---

// Observateur central qui réagit aux changements d'état de connexion
auth.onAuthStateChanged(user => {
    if (user) {
        // L'utilisateur est connecté
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailSpan.textContent = user.email;

        // Charger les données de l'application
        fetchPortfolio(user.uid); // Ceci met en place l'écouteur
        fetchMarketData();

    } else {
        // L'utilisateur est déconnecté
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        
        // S'il y a un écouteur de portefeuille actif, on le stoppe pour économiser les ressources
        if (unsubscribePortfolio) {
            unsubscribePortfolio();
        }
    }
});

// Gestion de la déconnexion
logoutButton.addEventListener('click', () => {
    auth.signOut().then(() => {
        console.log('Utilisateur déconnecté');
    });
});

// --- FONCTIONS DE RÉCUPÉRATION DE DONNÉES ---

// VERSION CORRIGÉE : Mettre en place un écouteur en temps réel sur le portefeuille
function fetchPortfolio(userId) {
    // onSnapshot crée un lien direct avec la base de données.
    // La fonction se déclenchera automatiquement dès que les données seront disponibles
    // ou mises à jour, ce qui résout le problème de timing.
    unsubscribePortfolio = db.collection('portfolios').doc(userId).onSnapshot(doc => {
        if (doc.exists) {
            console.log("Données du portefeuille reçues :", doc.data());
            const portfolio = doc.data();
            const formattedCash = portfolio.cash.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
            portfolioValueDiv.textContent = formattedCash;
        } else {
            console.log("Le document du portefeuille n'existe pas encore, en attente de sa création...");
            portfolioValueDiv.textContent = "Création du portefeuille...";
        }
    }, error => {
        console.error("Erreur de lecture du portefeuille :", error);
        portfolioValueDiv.textContent = "Erreur de permission";
    });
}

// Récupérer les données du marché depuis l'API CoinGecko
async function fetchMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1&sparkline=false');
        if (!response.ok) throw new Error('Réponse réseau non OK');
        
        const coins = await response.json();
        renderCryptoTable(coins);

    } catch (error) {
        console.error("Erreur de récupération des données du marché :", error);
        cryptoTableContainer.innerHTML = `<p style="color: var(--red);">Impossible de charger les données du marché.</p>`;
    }
}

// --- FONCTIONS D'AFFICHAGE (RENDER) ---

// Construire et afficher le tableau des cryptomonnaies
function renderCryptoTable(coins) {
    let tableHTML = `
        <table class="crypto-table">
            <thead>
                <tr>
                    <th>#</th>
                    <th>Nom</th>
                    <th>Prix</th>
                    <th>24h %</th>
                    <th>Capitalisation</th>
                </tr>
            </thead>
            <tbody>
    `;

    coins.forEach((coin, index) => {
        const priceChange = coin.price_change_percentage_24h;
        const priceChangeClass = priceChange >= 0 ? 'positive' : 'negative';

        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td>
                    <div class="coin-info">
                        <img src="${coin.image}" alt="${coin.name}">
                        <div>
                            <strong>${coin.name}</strong>
                            <span class="text-secondary">${coin.symbol.toUpperCase()}</span>
                        </div>
                    </div>
                </td>
                <td>${coin.current_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                <td class="${priceChangeClass}">${priceChange.toFixed(2)}%</td>
                <td>${coin.market_cap.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
            </tr>
        `;
    });

    tableHTML += `</tbody></table>`;
    cryptoTableContainer.innerHTML = tableHTML;
}
