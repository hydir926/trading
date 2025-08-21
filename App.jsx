import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import ProfilePage from './pages/ProfilePage';
import Header from './components/Header';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) setUserData(doc.data());
                    setLoading(false);
                });
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });
        return () => unsubscribe();
    }, []);
    
    const handleLogout = () => { signOut(auth); setCurrentPage('dashboard'); };

    if (loading) return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center text-xl">Chargement...</div>;
    if (!user) return <AuthPage />;

    return (
        <div>
            <Header userData={userData} onLogout={handleLogout} onNavigate={setCurrentPage} />
            <main className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {currentPage === 'dashboard' && <DashboardPage user={user} userData={userData} />}
                {currentPage === 'profile' && <ProfilePage user={user} userData={userData} />}
            </main>
        </div>
    );
}
export default App;
