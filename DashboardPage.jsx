import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, runTransaction, increment } from 'firebase/firestore';

export default function DashboardPage({ user, userData }) {
    const [marketData, setMarketData] = useState([]);
    
    useEffect(() => {
        const fetchMarket = async () => {
            try {
                const response = await fetch('https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=50&page=1');
                const data = await response.json();
                setMarketData(data);
            } catch (error) { console.error("Erreur de fetch market:", error); }
        };
        fetchMarket();
    }, []);

    const handleTrade = async (symbol, price, type) => {
        if (!price) return alert("Prix indisponible.");
        const userDocRef = doc(db, 'users', user.uid);
        const ownedAmount = userData.portfolio.coins[symbol] || 0;
        
        let amount = parseFloat(prompt(type === 'buy' ? `Combien de $ de ${symbol.toUpperCase()} acheter ?` : `Combien de ${symbol.toUpperCase()} vendre ?\nPossédé: ${ownedAmount.toFixed(6)}`));
        if (isNaN(amount) || amount <= 0) return alert("Montant invalide.");
        
        try {
            await runTransaction(db, async (t) => {
                const userDoc = await t.get(userDocRef);
                if (!userDoc.exists()) throw new Error("Utilisateur non trouvé");
                const portfolio = userDoc.data().portfolio;
                
                if (type === 'buy') {
                    if (portfolio.cash < amount) throw new Error("Solde insuffisant.");
                    t.update(userDocRef, { 'portfolio.cash': increment(-amount), [`portfolio.coins.${symbol}`]: increment(amount / price) });
                } else {
                    if (ownedAmount < amount) throw new Error("Quantité de crypto insuffisante.");
                    t.update(userDocRef, { 'portfolio.cash': increment(amount * price), [`portfolio.coins.${symbol}`]: increment(-amount) });
                }
            });
            alert("Transaction réussie !");
        } catch (error) { alert(`Erreur: ${error.message}`); }
    };

    const calculatePortfolioValue = () => {
        if (!userData?.portfolio) return 0;
        return userData.portfolio.cash + Object.entries(userData.portfolio.coins).reduce((acc, [symbol, amount]) => {
            const coin = marketData.find(c => c.symbol === symbol);
            return acc + (coin ? amount * coin.current_price : 0);
        }, 0);
    };

    return (
        <div className="space-y-8">
            <div className="bg-gray-800 shadow rounded-lg p-6">
                <h2 className="text-xl font-bold text-white">Mon Portefeuille</h2>
                <p className="mt-2 text-3xl font-bold text-indigo-400">{calculatePortfolioValue().toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</p>
                <div className="mt-4"><h3 className="text-lg font-medium text-white">Mes Actifs</h3>
                    <ul className="mt-2 space-y-2">
                        <li className="flex justify-between items-center"><span className="text-gray-300">Cash</span><span>{userData?.portfolio?.cash.toLocaleString('fr-FR', { style: 'currency', currency: 'USD' })}</span></li>
                        {userData?.portfolio?.coins && Object.entries(userData.portfolio.coins).map(([symbol, amount]) => amount > 1e-6 && (
                            <li key={symbol} className="flex justify-between items-center">
                                <div><span className="text-gray-300">{symbol.toUpperCase()}: </span><span>{amount.toFixed(6)}</span></div>
                                <button onClick={() => handleTrade(symbol, marketData.find(c=>c.symbol===symbol)?.current_price, 'sell')} className="text-xs bg-red-600 hover:bg-red-700 text-white font-bold py-1 px-2 rounded">Vendre</button>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="bg-gray-800 shadow rounded-lg overflow-hidden">
                <table className="min-w-full divide-y divide-gray-700">
                    <thead className="bg-gray-700"><tr className="text-left text-xs font-medium text-gray-300 uppercase tracking-wider">
                        <th className="px-6 py-3">Actif</th><th className="px-6 py-3">Prix</th><th className="px-6 py-3">24h %</th><th className="px-6 py-3 text-right">Action</th>
                    </tr></thead>
                    <tbody className="bg-gray-800 divide-y divide-gray-700">
                        {marketData.map(c => (<tr key={c.id}>
                            <td className="px-6 py-4"><div className="flex items-center"><img className="h-6 w-6" src={c.image} alt="" /><div className="ml-4 text-sm font-medium text-white">{c.name}</div></div></td>
                            <td className="px-6 py-4 text-sm text-gray-300">${c.current_price.toLocaleString()}</td>
                            <td className={`px-6 py-4 text-sm ${c.price_change_percentage_24h > 0 ? 'text-green-400' : 'text-red-400'}`}>{c.price_change_percentage_24h.toFixed(2)}%</td>
                            <td className="px-6 py-4 text-right"><button onClick={() => handleTrade(c.symbol, c.current_price, 'buy')} className="text-xs bg-green-600 hover:bg-green-700 text-white font-bold py-1 px-2 rounded">Acheter</button></td>
                        </tr>))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
