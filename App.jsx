// App.jsx (chemins d'importation corrigés pour une structure plate)

import React, { useState, useEffect } from 'react';
import { auth, db } from './firebase.js'; // Le '.js' est une bonne pratique
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, onSnapshot } from 'firebase/firestore';

// CHEMINS CORRIGÉS
import AuthPage from './AuthPage.jsx';
import DashboardPage from './DashboardPage.jsx';
import ProfilePage from './ProfilePage.jsx';
import Header from './Header.jsx';

function App() {
    const [user, setUser] = useState(null);
    const [userData, setUserData] = useState(null);
    const [currentPage, setCurrentPage] = useState('dashboard');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setLoading(true);
            if (currentUser) {
                setUser(currentUser);
                const userDocRef = doc(db, 'users', currentUser.uid);
                const unsubscribeSnapshot = onSnapshot(userDocRef, (doc) => {
                    if (doc.exists()) setUserData(doc.data());
                    setLoading(false);
                });
                return () => unsubscribeSnapshot();
            } else {
                setUser(null);
                setUserData(null);
                setLoading(false);
            }
        });
        return () => unsubscribeAuth();
    }, []);
    
    const handleLogout = () => { signOut(auth); setCurrentPage('dashboard'); };

    if (loading) {
        return <div className="bg-gray-900 text-white min-h-screen flex items-center justify-center text-xl">Chargement de l'application...</div>;
    }

    if (!user) {
        return <AuthPage />;
    }

    return (
        <div className="bg-gray-900 text-gray-100 min-h-screen">
            <Header userData={userData} onLogout={handleLogout} onNavigate={setCurrentPage} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {currentPage === 'dashboard' && <DashboardPage user={user} userData={userData} />}
                {currentPage === 'profile' && <ProfilePage user={user} userData={userData} />}
            </main>
        </div>
    );
}

export default App;```

---

### **Étape 3 : Vérifier les Autres Fichiers**

Les autres fichiers (`main.jsx`, `DashboardPage.jsx`, etc.) n'ont pas besoin d'être modifiés car leurs imports (`import React...`, `import { db }...`) ne dépendent pas de la structure de vos dossiers.

### **Résumé des Actions**

1.  **Assurez-vous que tous vos fichiers sont à la racine** de votre projet GitHub, comme sur votre capture d'écran.
2.  **Remplacez le contenu de `index.html`** avec la version corrigée ci-dessus.
3.  **Remplacez le contenu de `App.jsx`** avec la version corrigée ci-dessus.
4.  **Déployez les changements** sur GitHub :
    ```bash
    git add .
    git commit -m "Fix: Adapter les chemins pour une structure de fichiers plate"
    git push
    ```

Après ces modifications, Vercel saura où trouver `main.jsx` et `App.jsx` pourra trouver les autres composants. Votre application fonctionnera avec la structure de fichiers que vous souhaitez.
