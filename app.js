// app.js (Version finale, propre et sans doublons)

// --- SÉLECTION UNIQUE DE TOUS LES ÉLÉMENTS DU DOM ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const profileContainer = document.getElementById('profile-container');
const loader = document.getElementById('loader');

// Header
const userGreetingSpan = document.getElementById('user-greeting');
const logoutButton = document.getElementById('logout-button');

// Navigation
const showProfileBtn = document.getElementById('show-profile-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');

// Dashboard
const portfolioValueDiv = document.getElementById('portfolio-value');
const portfolioCoinsDiv = document.getElementById('portfolio-coins');
const cryptoTableContainer = document.getElementById('crypto-table-container');

// Profil
const profileFullnameSpan = document.getElementById('profile-fullname');
const profileUsernameSpan = document.getElementById('profile-username');
const profileEmailSpan = document.getElementById('profile-email');
const passwordChangeForm = document.getElementById('password-change-form');

// --- VARIABLES GLOBALES ---
let unsubscribeUser;
let marketData = [];
let currentUser = null;

// --- FONCTIONS UTILITAIRES ---
const showLoader = () => loader.classList.remove('hidden');
const hideLoader = () => loader.classList.add('hidden');

// --- GESTION DE L'ÉTAT DE L'APPLICATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        fetchUserData(user.uid);
        fetchMarketData();
        showDashboardPage();
    } else {
        currentUser = null;
        if (unsubscribeUser) unsubscribeUser();
        showAuthPage();
    }
});

logoutButton.addEventListener('click', () => auth.signOut());

// --- GESTION DE LA NAVIGATION ---
showProfileBtn.addEventListener('click', showProfilePage);
backToDashboardBtn.addEventListener('click', showDashboardPage);

function showAuthPage() { authContainer.classList.remove('hidden'); appContainer.classList.add('hidden'); profileContainer.classList.add('hidden'); }
function showDashboardPage() { authContainer.classList.add('hidden'); appContainer.classList.remove('hidden'); profileContainer.classList.add('hidden'); }
function showProfilePage() { authContainer.classList.add('hidden'); appContainer.classList.add('hidden'); profileContainer.classList.remove('hidden'); }

// --- LOGIQUE DU PROFIL ET PARAMÈTRES ---
passwordChangeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.length < 6) return alert("Le mot de passe doit faire au moins 6 caractères.");
    showLoader();
    currentUser.updatePassword(newPassword)
        .then(() => { hideLoader(); passwordChangeForm.reset(); alert("Mot de passe mis à jour !"); })
        .catch(error => { hideLoader(); alert(`Erreur : ${error.message}`); });
});

// --- LOGIQUE DE TRADING ---
document.addEventListener('click', (e) => {
    if (!e.target) return;
    if (e.target.classList.contains('btn-buy')) {
        const { id, symbol, price } = e.target.dataset;
        buyCoin(id, symbol, parseFloat(price));
    }
    if (e.target.classList.contains('btn-sell')) {
        const { symbol } = e.target.dataset;
        const coinData = marketData.find(c => c.symbol === symbol);
        if (coinData) sellCoin(symbol, coinData.current_price);
        else alert("Données du marché indisponibles.");
    }
});

async function buyCoin(coinId, symbol, price) {
    const amountUsd = parseFloat(prompt(`Combien de $ de ${symbol.toUpperCase()} acheter ?\nPrix: $${price}`));
    if (isNaN(amountUsd) || amountUsd <= 0) return alert("Montant invalide.");
    
    showLoader();
    const userDocRef = db.collection('users').doc(currentUser.uid);
    try {
        await db.runTransaction(async t => {
            const doc = await t.get(userDocRef);
            if (!doc.exists) throw "Profil non trouvé.";
            const data = doc.data();
            if (data.portfolio.cash < amountUsd) throw "Solde insuffisant.";
            const amountOfCoin = amountUsd / price;
            t.update(userDocRef, {
                'portfolio.cash': data.portfolio.cash - amountUsd,
                [`portfolio.coins.${symbol}`]: firebase.firestore.FieldValue.increment(amountOfCoin)
            });
        });
        alert(`Achat réussi !`);
    } catch (error) { alert(`Erreur: ${error}`); } finally { hideLoader(); }
}

async function sellCoin(symbol, price) {
    const userDocRef = db.collection('users').doc(currentUser.uid);
    try {
        const doc = await userDocRef.get();
        if (!doc.exists) return alert("Profil non trouvé.");
        const maxAmount = doc.data().portfolio.coins[symbol] || 0;
        if (maxAmount <= 1e-6) return alert(`Vous n'avez pas de ${symbol.toUpperCase()}.`);

        const amountToSell = parseFloat(prompt(`Combien de ${symbol.toUpperCase()} vendre ?\nPossédé: ${maxAmount.toFixed(6)}\nPrix: $${price}`));
        if (isNaN(amountToSell) || amountToSell <= 0 || amountToSell > maxAmount) return alert("Montant invalide.");

        showLoader();
        const cashFromSale = amountToSell * price;
        await userDocRef.update({
            'portfolio.cash': firebase.firestore.FieldValue.increment(cashFromSale),
            [`portfolio.coins.${symbol}`]: firebase.firestore.FieldValue.increment(-amountToSell)
        });
        alert(`Vente réussie !`);
    } catch (error) { alert(`Erreur: ${error}`); } finally { hideLoader(); }
}

// --- FONCTIONS DE RÉCUPÉRATION ET D'AFFICHAGE ---
function fetchUserData(userId) {
    unsubscribeUser = db.collection('users').doc(userId).onSnapshot(doc => {
        if (doc.exists) {
            const userData = doc.data();
            renderPortfolio(userData.portfolio);
            renderProfile(userData);
            userGreetingSpan.textContent = `Bonjour, ${userData.username}`;
        }
    }, error => console.error("Erreur lecture utilisateur:", error));
}

async function fetchMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        if (!response.ok) throw new Error('Erreur réseau');
        marketData = await response.json();
        renderCryptoTable(marketData);
        if (currentUser) {
            const doc = await db.collection('users').doc(currentUser.uid).get();
            if (doc.exists) renderPortfolio(doc.data().portfolio);
        }
    } catch (error) { cryptoTableContainer.innerHTML = `<p>Impossible de charger les données.</p>`; }
}

function renderProfile(userData) {
    profileFullnameSpan.textContent = userData.fullName;
    profileUsernameSpan.textContent = userData.username;
    profileEmailSpan.textContent = userData.email;
}

function renderPortfolio(portfolio) {
    let totalValue = portfolio.cash;
    let coinsHTML = '<h4>Mes Actifs</h4>';
    const ownedCoins = portfolio.coins && Object.keys(portfolio.coins).some(k => portfolio.coins[k] > 1e-6);
    if (!ownedCoins) {
        coinsHTML += '<p>Vous ne possédez aucun actif.</p>';
    } else {
        for (const symbol in portfolio.coins) {
            const amount = portfolio.coins[symbol];
            if (amount <= 1e-6) continue;
            const coinData = marketData.find(c => c.symbol === symbol);
            let value = 0;
            if (coinData) {
                value = amount * coinData.current_price;
                totalValue += value;
            }
            coinsHTML += `<div class="portfolio-item"><div class="portfolio-item-info"><span class="amount">${symbol.toUpperCase()}: ${amount.toFixed(6)}</span><span class="value">$${value.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div><button class="btn-sell" data-symbol="${symbol}">Vendre</button></div>`;
        }
    }
    coinsHTML += `<div class="portfolio-item"><div><span class="amount">Cash</span></div><span>$${portfolio.cash.toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`;
    portfolioValueDiv.textContent = totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    portfolioCoinsDiv.innerHTML = coinsHTML;
}

function renderCryptoTable(coins) {
    let tableHTML = `<table class="crypto-table"><thead><tr><th>#</th><th>Nom</th><th>Prix</th><th>24h %</th><th>Action</th></tr></thead><tbody>`;
    coins.forEach((coin, index) => {
        const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        tableHTML += `<tr><td>${index + 1}</td><td><div class="coin-info"><img src="${coin.image}" alt="${coin.name}"><div><strong>${coin.name}</strong><br><span class="text-secondary">${coin.symbol.toUpperCase()}</span></div></div></td><td>${coin.current_price.toLocaleString('en-US',{style:'currency',currency:'USD'})}</td><td class="${priceChangeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td><td><button class="btn-buy" data-id="${coin.id}" data-symbol="${coin.symbol}" data-price="${coin.current_price}">Acheter</button></td></tr>`;
    });
    tableHTML += `</tbody></table>`;
    cryptoTableContainer.innerHTML = tableHTML;
}
