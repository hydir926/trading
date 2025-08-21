// src/pages/DashboardPage.jsx (CORRIGÉ)

import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
// 1. MODIFICATION DE L'IMPORT : On importe firebase pour accéder à firestore.FieldValue
import firebase from 'firebase/compat/app';
import 'firebase/compat/firestore';
import { doc, runTransaction } from 'firebase/firestore';

export default function DashboardPage({ user, userData }) {
    const [marketData, setMarketData] = useState([]);
    
    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
                const data = await response.json();
                setMarketData(data);
            } catch (error) {
                console.error("Erreur de fetch market:", error);
            }
        };
        fetchMarket();
    }, []);

    const handleTrade = async (symbol, price, type) => {
        if (!price) return alert("Le prix de cet actif n'est pas disponible, impossible de trader.");
        const userDocRef = doc(db, 'users', user.uid);
        const ownedAmount = userData.portfolio.coins[symbol] || 0;
        
        let amount;
        if (type === 'buy') {
            amount = parseFloat(prompt(`Combien de $ de ${symbol.toUpperCase()} voulez-vous acheter ?`));
        } else {
            amount = parseFloat(prompt(`Combien de ${symbol.toUpperCase()} voulez-vous vendre ?\nVous possédez: ${ownedAmount.toFixed(6)}`));
        }

        if (isNaN(amount) || amount <= 0) return alert("Montant invalide.");
        
        try {
            await runTransaction(db, async (transaction) => {
                const userDoc = await transaction.get(userDocRef);
                if (!userDoc.exists()) throw new Error("Utilisateur non trouvé");
                
                const portfolio = userDoc.data().portfolio;
                
                if (type === 'buy') {
                    if (portfolio.cash < amount) throw new Error("Solde insuffisant.");
                    const coinAmount = amount / price;
                    transaction.update(userDocRef, {
                        'portfolio.cash': firebase.firestore.FieldValue.increment(-amount),
                        [`portfolio.coins.${symbol}`]: firebase.firestore.FieldValue.increment(coinAmount)
                    });
                } else { // sell
                    if (ownedAmount < amount) throw new Error("Quantité de crypto insuffisante.");
                    const cashValue = amount * price;
                    transaction.update(userDocRef, {
                        'portfolio.cash': firebase.firestore.FieldValue.increment(cashValue),
                        [`portfolio.coins.${symbol}`]: firebase.firestore.FieldValue.increment(-amount)
                    });
                }
            });
            alert("Transaction réussie !");
        } catch (error) {
            alert(`Erreur: ${error.message}`);
        }
    };

    const calculatePortfolioValue = () => {
        if (!userData || !userData.portfolio) return 0;
        let total = userData.portfolio.cash;
        for (const symbol in userData.portfolio.coins) {
            const coin = marketData.find(c => c.symbol === symbol);
            if (coin) {
                total += userData.portfolio.coins[symbol] * coin.current_price;
            }
        }
        return total;
    };

    return (
        <div className="space-y-8">
            {/* Section Portefeuille */}
            <div className="bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-white">Mon Portefeuille</h2>
                <p className="mt-2 text-3xl font-bold text-indigo-400">
                    {calculatePortfolioValue().toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}
                </p>
                <div className="mt-4">
                    <h3 className="text-lg font-medium text-white">Mes Actifs</h3>
                    <ul className="mt-2 space-y-2">
                        <li className="flex justify-between items-center"><span className="text-gray-300">Cash</span> <span>{userData?.portfolio?.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span></li>
                        {userData?.portfolio?.coins && Object.entries(userData.portfolio.coins).map(([symbol, amount]) => {
                            if (amount > 1e-6) {
                                return (
                                    <li key={symbol} className="flex justify-between items-center">
                                        <span className="text-gray-300">{symbol.toUpperCase()}</span>
                                        <span>{amount.toFixed(6)}</span>
                                        <button onClick={() => handleTrade(symbol, marketData.find(c=>c.symbol===symbol)?.current_price, 'sell')} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Vendre</button>
                                    </li>
                                )
                            }
                            return null;
                        })}
                    </ul>
                </div>
            </div>
            
            {/* Section Marché */}
            <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Actif</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">Prix</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-300 uppercase tracking-wider">24h %</th>
                            <th className="px-6 py-3 text-right text-xs font-medium text-gray-300 uppercase tracking-wider">Action</th>
                        </tr>
                    </thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {marketData.map(coin => (
                            <tr key={coin.id}>
                                <td className="px-6 py-4 whitespace-nowrap"><div className="flex items-center"><img className="h-6 w-6 rounded-full" src={coin.image} alt="" /><div className="ml-4 text-sm font-medium text-white">{coin.name}</div></div></td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">${coin.current_price.toLocaleString()}</td>
                                <td className={`px-6 py-4 whitespace-nowrap text-sm ${coin.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>{coin.price_change_percentage_24h.toFixed(2)}%</td>
                                <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                                    <button onClick={() => handleTrade(coin.symbol, coin.current_price, 'buy')} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">Acheter</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
