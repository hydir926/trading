import React, { useState } from 'react';
import { auth, db } from '../firebase';
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { setDoc, doc } from 'firebase/firestore';

export default function AuthPage() {
    const [isLogin, setIsLogin] = useState(true);
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [username, setUsername] = useState('');
    const [error, setError] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        try {
            if (isLogin) {
                await signInWithEmailAndPassword(auth, email, password);
            } else {
                const cred = await createUserWithEmailAndPassword(auth, email, password);
                await setDoc(doc(db, 'users', cred.user.uid), {
                    userId: cred.user.uid, email, fullName, username,
                    portfolio: { cash: 10000, coins: {} }
                });
            }
        } catch (err) { setError(err.message.replace('Firebase: ','')); }
    };
    const inputClasses = "mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 focus:border-indigo-500";
    return (
        <div className="min-h-screen flex flex-col justify-center items-center py-12 px-4">
            <div className="w-full max-w-md"><h2 className="text-center text-3xl font-extrabold text-white">{isLogin ? 'Connectez-vous' : 'Créez un compte'}</h2></div>
            <div className="mt-8 w-full max-w-md"><div className="bg-gray-800 py-8 px-4 shadow sm:rounded-lg sm:px-10">
                <form className="space-y-6" onSubmit={handleSubmit}>
                    {!isLogin && <>
                        <div><label className="block text-sm font-medium text-gray-300">Nom complet</label><input type="text" value={fullName} onChange={e => setFullName(e.target.value)} required className={inputClasses} /></div>
                        <div><label className="block text-sm font-medium text-gray-300">Nom d'utilisateur</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} required className={inputClasses} /></div>
                    </>}
                    <div><label className="block text-sm font-medium text-gray-300">Adresse email</label><input type="email" value={email} onChange={e => setEmail(e.target.value)} required className={inputClasses} /></div>
                    <div><label className="block text-sm font-medium text-gray-300">Mot de passe</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} required className={inputClasses} /></div>
                    {error && <p className="text-red-400 text-sm text-center">{error}</p>}
                    <div><button type="submit" className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500">{isLogin ? 'Se connecter' : 'S\'inscrire'}</button></div>
                </form>
                <p className="mt-6 text-center text-sm text-gray-400">
                    {isLogin ? 'Pas de compte ?' : 'Déjà un compte ?'}{' '}
                    <button onClick={() => setIsLogin(!isLogin)} className="font-medium text-indigo-400 hover:text-indigo-300">{isLogin ? 'Inscrivez-vous' : 'Connectez-vous'}</button>
                </p>
            </div></div>
        </div>
    );
}
