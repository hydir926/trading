// app.js

// -- SÉLECTION DES ÉLÉMENTS DU DOM --
const authContainer = document.getElementById('auth-container');
const appContainer = document.getElementById('app-container');
const profileContainer = document.getElementById('profile-container');
const transactionsContainer = document.getElementById('transactions-container');
const cardModal = document.getElementById('card-modal');
const userGreetingSpan = document.getElementById('user-greeting');
const logoutButton = document.getElementById('logout-button');
const showProfileBtn = document.getElementById('show-profile-btn');
const showTransactionsBtn = document.getElementById('show-transactions-btn');
const backToDashboardBtn = document.getElementById('back-to-dashboard-btn');
const backToDashboardFromTxBtn = document.getElementById('back-to-dashboard-from-tx-btn');
const portfolioValueDiv = document.getElementById('portfolio-value');
const portfolioCoinsDiv = document.getElementById('portfolio-coins');
const cryptoTableContainer = document.getElementById('crypto-table-container');
const profileFullnameSpan = document.getElementById('profile-fullname');
const profileUsernameSpan = document.getElementById('profile-username');
const profileEmailSpan = document.getElementById('profile-email');
const passwordChangeForm = document.getElementById('password-change-form');
const depositForm = document.getElementById('deposit-form');
const withdrawalForm = document.getElementById('withdrawal-form');
const transactionHistoryList = document.getElementById('transaction-history-list');
const cardForm = document.getElementById('card-form');
const closeModalBtn = document.getElementById('close-modal-btn');
const payButton = document.getElementById('pay-button');

// -- VARIABLES GLOBALES --
let currentUser = null;
let userData = {};
let marketData = [];
let unsubscribeUser, unsubscribeTransactions;
let depositAmountInProgress = 0;

// -- GESTION DE LA NAVIGATION & MODALE --
function showPage(pageId) {
    [authContainer, appContainer, profileContainer, transactionsContainer].forEach(p => p.classList.add('hidden'));
    document.getElementById(pageId).classList.remove('hidden');
}
const openCardModal = () => cardModal.classList.remove('hidden');
const closeCardModal = () => cardModal.classList.add('hidden');

showProfileBtn.addEventListener('click', () => showPage('profile-container'));
showTransactionsBtn.addEventListener('click', () => showPage('transactions-container'));
backToDashboardBtn.addEventListener('click', () => showPage('app-container'));
backToDashboardFromTxBtn.addEventListener('click', () => showPage('app-container'));
logoutButton.addEventListener('click', () => auth.signOut());
closeModalBtn.addEventListener('click', closeCardModal);
cardModal.addEventListener('click', (e) => { if (e.target === cardModal) closeCardModal(); }); // Ferme si on clique sur l'arrière-plan

// -- GESTION DE L'ÉTAT D'AUTHENTIFICATION --
auth.onAuthStateChanged(user => {
    if (user) {
        currentUser = user;
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeTransactions) unsubscribeTransactions();
        unsubscribeUser = db.collection('users').doc(user.uid).onSnapshot(doc => {
            if (doc.exists) {
                userData = doc.data();
                renderProfile(userData);
                renderPortfolio(userData.portfolio);
                userGreetingSpan.textContent = `Bonjour, ${userData.username}`;
            }
        });
        unsubscribeTransactions = db.collection('users').doc(user.uid).collection('transactions').orderBy('timestamp', 'desc').limit(10).onSnapshot(snapshot => renderTransactionHistory(snapshot.docs));
        fetchMarketData();
        showPage('app-container');
    } else {
        currentUser = null;
        if (unsubscribeUser) unsubscribeUser();
        if (unsubscribeTransactions) unsubscribeTransactions();
        showPage('auth-container');
    }
});

// -- PROFIL UTILISATEUR --
function renderProfile(data) { /* ... (inchangé) ... */ }
passwordChangeForm.addEventListener('submit', e => { /* ... (inchangé) ... */ });

// -- DÉPÔTS ET RETRAITS --
depositForm.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('deposit-amount').value);
    if (isNaN(amount) || amount <= 0) return alert("Montant invalide.");
    depositAmountInProgress = amount;
    payButton.textContent = `Payer ${amount.toLocaleString('fr-FR', {style:'currency', currency:'USD'})}`;
    openCardModal();
});

cardForm.addEventListener('submit', e => {
    e.preventDefault();
    loader.classList.remove('hidden');
    
    // -- SIMULATION DE PAIEMENT --
    // Nous ne lisons pas les données de la carte. Nous procédons directement au dépôt.
    const amount = depositAmountInProgress;
    const userDocRef = db.collection('users').doc(currentUser.uid);

    Promise.all([
        userDocRef.update({ 'portfolio.cash': firebase.firestore.FieldValue.increment(amount) }),
        userDocRef.collection('transactions').add({ type: 'deposit', amount, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
    ]).then(() => {
        alert(`Dépôt de ${amount.toLocaleString('fr-FR',{style:'currency',currency:'USD'})} réussi !`);
        depositForm.reset();
        cardForm.reset();
        closeCardModal();
    }).catch(err => {
        alert(`Erreur : ${err.message}`);
    }).finally(() => {
        loader.classList.add('hidden');
    });
});

withdrawalForm.addEventListener('submit', e => {
    e.preventDefault();
    const amount = parseFloat(document.getElementById('withdrawal-amount').value);
    if (isNaN(amount) || amount <= 0) return alert("Montant invalide.");
    if (amount > userData.portfolio.cash) return alert("Solde insuffisant.");
    
    const userDocRef = db.collection('users').doc(currentUser.uid);
    Promise.all([
        userDocRef.update({ 'portfolio.cash': firebase.firestore.FieldValue.increment(-amount) }),
        userDocRef.collection('transactions').add({ type: 'withdrawal', amount, timestamp: firebase.firestore.FieldValue.serverTimestamp() })
    ]).then(() => {
        alert(`Retrait de ${amount.toLocaleString('fr-FR',{style:'currency',currency:'USD'})} réussi !`);
        withdrawalForm.reset();
    }).catch(err => alert(`Erreur : ${err.message}`));
});

function renderTransactionHistory(docs) { /* ... (inchangé) ... */ }

// -- DONNÉES DU MARCHÉ & AFFICHAGE --
async function fetchMarketData() { /* ... (inchangé) ... */ }
function renderCryptoTable() { /* ... (inchangé) ... */ }
function renderPortfolio(portfolio) { /* ... (inchangé) ... */ }

// -- LOGIQUE DE TRADING (ACHAT/VENTE) --
document.addEventListener('click', e => { /* ... (inchangé) ... */ });


// --- Recopiez ici les fonctions manquantes de la version précédente ---
function renderProfile(data) {
    profileFullnameSpan.textContent = data.fullName;
    profileUsernameSpan.textContent = data.username;
    profileEmailSpan.textContent = data.email;
}
passwordChangeForm.addEventListener('submit', e => {
    e.preventDefault();
    const newPassword = document.getElementById('new-password').value;
    if (newPassword.length < 6) return alert("Le mot de passe doit faire au moins 6 caractères.");
    currentUser.updatePassword(newPassword)
        .then(() => { alert("Mot de passe mis à jour !"); passwordChangeForm.reset(); })
        .catch(err => alert(err.message));
});
function renderTransactionHistory(docs) {
    if (docs.length === 0) { transactionHistoryList.innerHTML = '<p>Aucune transaction.</p>'; return; }
    let html = '';
    docs.forEach(doc => {
        const tx = doc.data();
        const typeClass = tx.type === 'deposit' ? 'transaction-deposit' : 'transaction-withdrawal';
        const typeText = tx.type === 'deposit' ? 'Dépôt' : 'Retrait';
        const sign = tx.type === 'deposit' ? '+' : '-';
        const date = tx.timestamp ? tx.timestamp.toDate().toLocaleString('fr-FR') : 'En attente...';
        html += `<div class="transaction-item ${typeClass}"><div class="info"><span>${typeText}</span><span class="date">${date}</span></div><span class="amount">${sign}${tx.amount.toLocaleString('fr-FR',{style:'currency',currency:'USD'})}</span></div>`;
    });
    transactionHistoryList.innerHTML = html;
}
async function fetchMarketData() {
    try {
        const res = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
        marketData = await res.json();
        renderCryptoTable();
        if (userData.portfolio) renderPortfolio(userData.portfolio);
    } catch (err) { console.error("Erreur du marché:", err); }
}
function renderCryptoTable() {
    let html = `<table class="crypto-table"><thead><tr><th>Nom</th><th>Prix</th><th>24h %</th><th>Action</th></tr></thead><tbody>`;
    marketData.forEach(coin => {
        html += `<tr><td><div style="display: flex; align-items: center; gap: 10px;"><img src="${coin.image}" alt="${coin.name}" width="24" height="24" style="border-radius: 50%;"><div>${coin.name}<span style="color: var(--text-secondary-color); text-transform: uppercase; font-size: 0.8em; display: block;">${coin.symbol}</span></div></div></td><td>$${coin.current_price.toLocaleString()}</td><td class="${coin.price_change_percentage_24h > 0 ? 'positive' : 'negative'}">${coin.price_change_percentage_24h.toFixed(2)}%</td><td><button class="btn-buy" data-symbol="${coin.symbol}" data-price="${coin.current_price}">Acheter</button></td></tr>`;
    });
    html += `</tbody></table>`;
    cryptoTableContainer.innerHTML = html;
}
function renderPortfolio(portfolio) {
    let totalValue = portfolio.cash;
    let html = '<h4>Mes Actifs</h4>';
    for (const symbol in portfolio.coins) {
        const amount = portfolio.coins[symbol];
        if (amount > 1e-6) {
            const coinData = marketData.find(c => c.symbol === symbol);
            const value = coinData ? amount * coinData.current_price : 0;
            totalValue += value;
            html += `<div class="portfolio-item"><span>${symbol.toUpperCase()}: ${amount.toFixed(6)}</span><span>$${value.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}</span><button class="btn-sell" data-symbol="${symbol}">Vendre</button></div>`;
        }
    }
    html += `<div class="portfolio-item"><span>Cash</span><span>$${portfolio.cash.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}</span></div>`;
    portfolioValueDiv.innerHTML = `$${totalValue.toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})}`;
    portfolioCoinsDiv.innerHTML = html;
}
document.addEventListener('click', e => {
    if (!currentUser) return;
    const userDocRef = db.collection('users').doc(currentUser.uid);
    if (e.target.matches('.btn-buy')) {
        const { symbol, price } = e.target.dataset;
        const amountUsd = parseFloat(prompt(`Combien de $ de ${symbol.toUpperCase()} voulez-vous acheter ?`));
        if (isNaN(amountUsd) || amountUsd <= 0) return;
        db.runTransaction(async t => {
            const doc = await t.get(userDocRef);
            const portfolio = doc.data().portfolio;
            if (portfolio.cash < amountUsd) throw new Error("Solde insuffisant.");
            const coinAmount = amountUsd / parseFloat(price);
            const currentCoinAmount = portfolio.coins[symbol] || 0;
            t.update(userDocRef, { 'portfolio.cash': portfolio.cash - amountUsd, [`portfolio.coins.${symbol}`]: currentCoinAmount + coinAmount });
        }).catch(err => alert(err.message));
    }
    if (e.target.matches('.btn-sell')) {
        const { symbol } = e.target.dataset;
        const coinData = marketData.find(c => c.symbol === symbol);
        if (!coinData) return alert("Données indisponibles.");
        const price = coinData.current_price;
        const currentCoinAmount = userData.portfolio.coins[symbol] || 0;
        const amountToSell = parseFloat(prompt(`Combien de ${symbol.toUpperCase()} vendre ? (Possédé: ${currentCoinAmount.toFixed(6)})`));
        if (isNaN(amountToSell) || amountToSell <= 0 || amountToSell > currentCoinAmount) return alert("Montant invalide.");
        const cashGain = amountToSell * price;
        db.runTransaction(async t => {
            const doc = await t.get(userDocRef);
            const portfolio = doc.data().portfolio;
            t.update(userDocRef, { 'portfolio.cash': portfolio.cash + cashGain, [`portfolio.coins.${symbol}`]: portfolio.coins[symbol] - amountToSell });
        }).catch(err => alert(err.message));
    }
});```
