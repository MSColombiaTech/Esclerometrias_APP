import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, onIdTokenChanged, signInWithPopup, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, googleAuthProvider } from '../lib/firebase';

interface AuthContextType {
  user: User | null;
  token: string | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  getToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  token: null,
  loading: true,
  signInWithGoogle: async () => {},
  signOut: async () => {},
  getToken: async () => null,
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onIdTokenChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
          const idToken = await currentUser.getIdToken();
          setToken(idToken);

          // Sync user with PostgreSQL Cloud SQL
          await fetch('/api/auth/sync', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${idToken}`,
            },
          }).catch((err) => console.warn('User cloud sync notice:', err));
        } catch (e) {
          console.error('Error acquiring Firebase ID token:', e);
          setToken(null);
        }
      } else {
        setToken(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    try {
      const res = await signInWithPopup(auth, googleAuthProvider);
      if (res.user) {
        const idToken = await res.user.getIdToken();
        setToken(idToken);
      }
    } catch (error) {
      console.error('Error during Google sign-in:', error);
      throw error;
    }
  };

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      setUser(null);
      setToken(null);
    } catch (error) {
      console.error('Error during sign-out:', error);
      throw error;
    }
  };

  const getToken = async (): Promise<string | null> => {
    if (auth.currentUser) {
      const freshToken = await auth.currentUser.getIdToken();
      setToken(freshToken);
      return freshToken;
    }
    return token;
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        signInWithGoogle,
        signOut,
        getToken,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
