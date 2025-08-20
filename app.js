// app.js

// --- SÉLECTION DES ÉLÉMENTS DU DOM ---
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const userEmailSpan = document.getElementById('user-email');
const logoutButton = document.getElementById('logout-button');
const portfolioValueDiv = document.getElementById('portfolio-value');
const portfolioCoinsDiv = document.getElementById('portfolio-coins');
const cryptoTableContainer = document.getElementById('crypto-table-container');

// --- VARIABLES GLOBALES ---
let unsubscribePortfolio;
let marketData = [];
let currentUser = null;

// --- GESTION DE L'ÉTAT DE L'APPLICATION ---
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        authContainer.classList.add('hidden');
        appContainer.classList.remove('hidden');
        userEmailSpan.textContent = user.email;
        fetchPortfolio(user.uid);
        fetchMarketData();
    } else {
        currentUser = null;
        authContainer.classList.remove('hidden');
        appContainer.classList.add('hidden');
        if (unsubscribePortfolio) unsubscribePortfolio();
    }
});

logoutButton.addEventListener('click', () => auth.signOut());

// --- LOGIQUE DE TRADING ---

// Délégation d'événements pour les boutons Acheter et Vendre
document.addEventListener('click', (e) => {
    if (e.target) {
        if (e.target.classList.contains('btn-buy')) {
            const { id, symbol, price } = e.target.dataset;
            buyCoin(id, symbol, parseFloat(price));
        }
        if (e.target.classList.contains('btn-sell')) {
            const { symbol } = e.target.dataset;
            const coinData = marketData.find(c => c.symbol === symbol);
            if (coinData) {
                sellCoin(symbol, coinData.current_price);
            } else {
                alert("Données du marché indisponibles, impossible de vendre.");
            }
        }
    }
});

async function buyCoin(coinId, symbol, price) {
    if (!currentUser) return alert("Vous devez être connecté.");
    const amountUsd = parseFloat(prompt(`Combien de $ de ${symbol.toUpperCase()} voulez-vous acheter ?\nPrix: $${price}`));
    if (isNaN(amountUsd) || amountUsd <= 0) return alert("Montant invalide.");
    
    showLoader();
    const userPortfolioRef = db.collection('portfolios').doc(currentUser.uid);
    try {
        await db.runTransaction(async (t) => {
            const doc = await t.get(userPortfolioRef);
            if (!doc.exists) throw "Portefeuille non trouvé.";
            const data = doc.data();
            if (data.cash < amountUsd) throw "Solde insuffisant.";
            
            const amountOfCoin = amountUsd / price;
            t.update(userPortfolioRef, {
                cash: data.cash - amountUsd,
                [`coins.${symbol}`]: firebase.firestore.FieldValue.increment(amountOfCoin)
            });
        });
        alert(`Achat réussi de ${amountUsd}$ de ${symbol.toUpperCase()} !`);
    } catch (error) {
        alert(`Erreur: ${error}`);
    } finally {
        hideLoader();
    }
}

async function sellCoin(symbol, price) {
    if (!currentUser) return alert("Vous devez être connecté.");
    const userPortfolioRef = db.collection('portfolios').doc(currentUser.uid);

    try {
        const doc = await userPortfolioRef.get();
        if (!doc.exists) return alert("Portefeuille non trouvé.");
        const maxAmount = doc.data().coins[symbol] || 0;
        if (maxAmount <= 0) return alert(`Vous n'avez pas de ${symbol.toUpperCase()}.`);

        const amountToSell = parseFloat(prompt(`Combien de ${symbol.toUpperCase()} voulez-vous vendre ?\nVous possédez : ${maxAmount.toFixed(6)}\nPrix: $${price}`));
        if (isNaN(amountToSell) || amountToSell <= 0 || amountToSell > maxAmount) return alert("Montant invalide ou insuffisant.");

        showLoader();
        const cashFromSale = amountToSell * price;
        await userPortfolioRef.update({
            cash: firebase.firestore.FieldValue.increment(cashFromSale),
            [`coins.${symbol}`]: firebase.firestore.FieldValue.increment(-amountToSell)
        });
        alert(`Vente réussie de ${amountToSell} ${symbol.toUpperCase()} !`);
    } catch (error) {
        alert(`Erreur: ${error}`);
    } finally {
        hideLoader();
    }
}

// --- FONCTIONS DE RÉCUPÉRATION ET D'AFFICHAGE ---

function fetchPortfolio(userId) {
    unsubscribePortfolio = db.collection('portfolios').doc(userId).onSnapshot(doc => {
        if (doc.exists) renderPortfolio(doc.data());
        else portfolioValueDiv.textContent = "Création...";
    }, error => console.error("Erreur de lecture du portefeuille:", error));
}

async function fetchMarketData() {
    try {
        const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        if (!response.ok) throw new Error('Erreur réseau');
        marketData = await response.json();
        renderCryptoTable(marketData);
        if (currentUser) {
            const doc = await db.collection('portfolios').doc(currentUser.uid).get();
            if (doc.exists) renderPortfolio(doc.data());
        }
    } catch (error) {
        cryptoTableContainer.innerHTML = `<p style="color: var(--red);">Impossible de charger les données.</p>`;
    }
}

function renderPortfolio(portfolio) {
    let totalValue = portfolio.cash;
    let coinsHTML = '<h4>Mes Actifs</h4>';
    if (!portfolio.coins || Object.keys(portfolio.coins).length === 0) {
        coinsHTML += '<p>Vous ne possédez aucun actif.</p>';
    } else {
        for (const symbol in portfolio.coins) {
            const amount = portfolio.coins[symbol];
            if (amount <= 1e-6) continue; // Ignorer les quantités quasi nulles
            const coinData = marketData.find(c => c.symbol === symbol);
            let value = 0;
            if (coinData) {
                value = amount * coinData.current_price;
                totalValue += value;
            }
            coinsHTML += `
                <div class="portfolio-item">
                    <div class="portfolio-item-info">
                        <span class="amount">${symbol.toUpperCase()}: ${amount.toFixed(6)}</span>
                        <span class="value">$${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    </div>
                    <button class="btn-sell" data-symbol="${symbol}">Vendre</button>
                </div>
            `;
        }
    }
    coinsHTML += `<div class="portfolio-item"><div><span class="amount">Cash</span></div><span>$${portfolio.cash.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span></div>`;
    portfolioValueDiv.textContent = totalValue.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
    portfolioCoinsDiv.innerHTML = coinsHTML;
}

function renderCryptoTable(coins) {
    let tableHTML = `<table class="crypto-table"><thead><tr><th>#</th><th>Nom</th><th>Prix</th><th>24h %</th><th>Action</th></tr></thead><tbody>`;
    coins.forEach((coin, index) => {
        const priceChangeClass = coin.price_change_percentage_24h >= 0 ? 'positive' : 'negative';
        tableHTML += `
            <tr>
                <td>${index + 1}</td>
                <td><div class="coin-info"><img src="${coin.image}" alt="${coin.name}"><div><strong>${coin.name}</strong><br><span class="text-secondary">${coin.symbol.toUpperCase()}</span></div></div></td>
                <td>${coin.current_price.toLocaleString('en-US', { style: 'currency', currency: 'USD' })}</td>
                <td class="${priceChangeClass}">${coin.price_change_percentage_24h.toFixed(2)}%</td>
                <td><button class="btn-buy" data-id="${coin.id}" data-symbol="${coin.symbol}" data-price="${coin.current_price}">Acheter</button></td>
            </tr>
        `;
    });
    tableHTML += `</tbody></table>`;
    cryptoTableContainer.innerHTML = tableHTML;
}
