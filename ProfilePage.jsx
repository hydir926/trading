import React, { useState } from 'react';
import { auth } from '../firebase';
import { updatePassword } from 'firebase/auth';

export default function ProfilePage({ user, userData }) {
    const [newPassword, setNewPassword] = useState('');
    const [message, setMessage] = useState('');
    
    const handlePasswordChange = async (e) => {
        e.preventDefault();
        setMessage('');
        if (newPassword.length < 6) return setMessage("Le mot de passe doit faire au moins 6 caractères.");
        try {
            await updatePassword(user, newPassword);
            setMessage("Mot de passe mis à jour avec succès !");
            setNewPassword('');
        } catch (error) { setMessage(`Erreur: ${error.message.replace('Firebase: ','')}`); }
    };
    
    return <div className="space-y-8">
        <div className="bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-bold">Mes Informations</h2>
            <div className="mt-4 space-y-2 text-gray-300">
                <p><strong>Nom complet:</strong> {userData?.fullName}</p>
                <p><strong>Nom d'utilisateur:</strong> {userData?.username}</p>
                <p><strong>Email:</strong> {userData?.email}</p>
            </div>
        </div>
        <div className="bg-gray-800 shadow rounded-lg p-6">
            <h2 className="text-xl font-bold">Changer mon mot de passe</h2>
            <form onSubmit={handlePasswordChange} className="mt-4 space-y-4">
                <div>
                    <label className="block text-sm font-medium text-gray-300">Nouveau mot de passe</label>
                    <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} required className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500" />
                </div>
                {message && <p className="text-sm text-indigo-400">{message}</p>}
                <div><button type="submit" className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">Mettre à jour</button></div>
            </form>
        </div>
    </div>;
}
