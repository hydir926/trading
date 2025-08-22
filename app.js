// app.js

// -- SÉLECTION DES ÉLÉMENTS DU DOM --
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const profileContainer = document.getElementById('profile-container');
const userGreetingSpan = document.getElementById('user-greeting');
const logoutButton = document.getElementById('logout-button');
const showProfileBtn = document.getElementById('show-profile-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const portfolioValueDiv = document.getElementById('portfolio-value');
const portfolioCoinsDiv = document.getElementById('portfolio-coins');
const cryptoTableContainer = document.getElementById('crypto-table-container');
const profileFullnameSpan = document.getElementById('profile-fullname');
const profileUsernameSpan = document.getElementById('profile-username');
const profileEmailSpan = document.getElementById('profile-email');
const passwordChangeForm = document.getElementById('password-change-form');

// -- VARIABLES GLOBALES --
let currentUser = null;
let userData = {};
let marketData = [];
let unsubscribeUser; // Pour stopper l'écouteur lors de la déconnexion

// -- GESTION DE LA NAVIGATION --
function showPage(pageId) {
    [authContainer, appContainer, profileContainer].forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}

showProfileBtn.addEventListener('click', () => showPage('profile-container'));
backToDashboardBtn.addEventListener('click', () => showPage('app-container'));
logoutButton.addEventListener('click', () => auth.signOut());

// -- GESTION DE L'ÉTAT D'AUTHENTIFICATION --
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        if (unsubscribeUser) unsubscribeUser(); // Nettoie l'ancien écouteur
        
        // Écouteur en temps réel pour les données de l'utilisateur
        unsubscribeUser = db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                userData = doc.data();
                renderProfile(userData);
                renderPortfolio(userData.portfolio);
                userGreetingSpan.textContent = `Bonjour, ${userData.username}`;
            }
        });
        
        fetchMarketData();
        showPage('app-container');
    } else {
        currentUser = null;
        if (unsubscribeUser) unsubscribeUser();
        showPage('auth-container');
    }
});

// -- PROFIL UTILISATEUR --
function renderProfile(data) {
    profileFullnameSpan.textContent = data.fullName;
    profileUsernameSpan.textContent = data.username;
    profileEmailSpan.textContent = data.email;
}

passwordChangeForm.addEventListener('submit', e => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.length < 6) {
        return alert("Le mot de passe doit faire au moins 6 caractères.");
    }
    currentUser.updatePassword(newPassword)
        .then(() => {
            alert("Mot de passe mis à jour avec succès !");
            passwordChangeForm.reset();
        })
        .catch(err => alert(err.message));
});

// -- DONNÉES DU MARCHÉ & AFFICHAGE --
async function fetchMarketData() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        marketData = await res.json();
        renderCryptoTable();
        // Rafraîchit le portefeuille avec les nouveaux prix
        if (userData.portfolio) renderPortfolio(userData.portfolio);
    } catch (err) {
        console.error("Erreur de récupération des données du marché:", err);
    }
}

// === FONCTION CORRIGÉE AVEC LES ICÔNES ===
function renderCryptoTable() {
    let html = `<table class="crypto-table">
        <thead>
            <tr>
                <th>Nom</th>
                <th>Prix</th>
                <th>24h %</th>
                <th>Action</th>
            </tr>
        </thead>
        <tbody>`;

    marketData.forEach(coin => {
        html += `<tr>
            <td>
                <div style="display: flex; align-items: center; gap: 10px;">
                    <img src="${coin.image}" alt="${coin.name}" width="24" height="24" style="border-radius: 50%;">
                    <div>
                        ${coin.name}
                        <span style="color: var(--text-secondary-color); text-transform: uppercase; font-size: 0.8em; display: block;">${coin.symbol}</span>
                    </div>
                </div>
            </td>
            <td>$${coin.current_price.toLocaleString()}</td>
            <td class="${coin.price_change_percentage_24h > 0 ? 'positive' : 'negative'}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
            <td><button class="btn-buy" data-symbol="${coin.symbol}" data-price="${coin.current_price}">Acheter</button></td>
        </tr>`;
    });

    html += `</tbody></table>`;
    cryptoTableContainer.innerHTML = html;
}

function renderPortfolio(portfolio) {
    let totalValue = portfolio.cash;
    let html = '<h4>Mes Actifs</h4>';
    for (const symbol in portfolio.coins) {
        const amount = portfolio.coins[symbol];
        if (amount > 1e-6) { // Ne pas afficher si la quantité est quasi nulle
            const coinData = marketData.find(c => c.symbol === symbol);
            const value = coinData ? amount * coinData.current_price : 0;
            totalValue += value;
            html += `<div class="portfolio-item">
                <span>${symbol.toUpperCase()}: ${amount.toFixed(6)}</span>
                <span>$${value.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                <button class="btn-sell" data-symbol="${symbol}">Vendre</button>
            </div>`;
        }
    }
    html += `<div class="portfolio-item"><span>Cash</span><span>$${portfolio.cash.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>`;
    portfolioValueDiv.innerHTML = `$${totalValue.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    portfolioCoinsDiv.innerHTML = html;
}

// -- LOGIQUE DE TRADING (ACHAT/VENTE) --
document.addEventListener('click', e => {
    if (!currentUser) return;
    const userDocRef = db.collection('users').doc(currentUser.uid);

    // Logique d'Achat
    if (e.target.matches('.btn-buy')) {
        const { symbol, price } = e.target.dataset;
        const amountUsd = parseFloat(prompt(`Combien de $ de ${symbol.toUpperCase()} voulez-vous acheter ?`));
        if (isNaN(amountUsd) || amountUsd <= 0) return;

        db.runTransaction(async t => {
            const doc = await t.get(userDocRef);
            const portfolio = doc.data().portfolio;
            if (portfolio.cash < amountUsd) throw new Error("Solde en cash insuffisant.");
            
            const coinAmount = amountUsd / parseFloat(price);
            const currentCoinAmount = portfolio.coins[symbol] || 0;
            
            t.update(userDocRef, {
                'portfolio.cash': portfolio.cash - amountUsd,
                [`portfolio.coins.${symbol}`]: currentCoinAmount + coinAmount
            });
        }).catch(err => alert(err.message));
    }

    // Logique de Vente
    if (e.target.matches('.btn-sell')) {
        const { symbol } = e.target.dataset;
        const coinData = marketData.find(c => c.symbol === symbol);
        if (!coinData) return alert("Les données du marché pour cette crypto ne sont pas disponibles.");
        
        const price = coinData.current_price;
        const currentCoinAmount = userData.portfolio.coins[symbol] || 0;
        
        const amountToSell = parseFloat(prompt(`Combien de ${symbol.toUpperCase()} voulez-vous vendre ? (Vous possédez: ${currentCoinAmount.toFixed(6)})`));
        if (isNaN(amountToSell) || amountToSell <= 0 || amountToSell > currentCoinAmount) {
            return alert("Montant invalide ou vous n'en possédez pas assez.");
        }

        const cashGain = amountToSell * price;
        
        db.runTransaction(async t => {
            const doc = await t.get(userDocRef);
            const portfolio = doc.data().portfolio;
            t.update(userDocRef, {
                'portfolio.cash': portfolio.cash + cashGain,
                [`portfolio.coins.${symbol}`]: portfolio.coins[symbol] - amountToSell
            });
        }).catch(err => alert(err.message));
    }
});
```</details>

### **Résumé des Actions**

1.  Ouvrez votre fichier `app.js`.
2.  Remplacez son contenu par le code complet ci-dessus.
3.  Sauvegardez le fichier.
4.  Déployez vos changements sur GitHub (`git add .`, `git commit -m "Fix: restaurer les icônes des cryptos"`, `git push`).

Une fois ces changements déployés, les icônes réapparaîtront, rendant votre application plus agréable à utiliser.
