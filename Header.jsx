import React from 'react';

export default function Header({ userData, onLogout, onNavigate }) {
    return (
        <header className="bg-gray-800 shadow">
            <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
                <h1 className="text-2xl font-bold text-white">CryptoDash</h1>
                <div className="flex items-center space-x-2 sm:space-x-4">
                    <span className="text-gray-300 hidden sm:block">Bonjour, {userData?.username}</span>
                    <button onClick={() => onNavigate('dashboard')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Dashboard</button>
                    <button onClick={() => onNavigate('profile')} className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium">Profil</button>
                    <button onClick={onLogout} className="bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-2 px-4 rounded">Déconnexion</button>
                </div>
            </div>
        </header>
    );
}
