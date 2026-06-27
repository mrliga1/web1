import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth, db, handleFirestoreError, OperationType } from '../firebase';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore/lite';

export type UserRole = 'admin' | 'editor' | 'member' | 'user';

export interface UserProfile {
  uid: string;
  email: string;
  role: UserRole;
  username?: string;
  phone?: string;
  avatarUrl?: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  logout: () => Promise<void>;
  reloadProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({} as AuthContextType);

// @ts-ignore
export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User) => {
    try {
      const docRef = doc(db, 'users', user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as UserProfile;
        if (user.email?.toLowerCase() === 'nguyenthanhthuan091095@gmail.com' && data.role !== 'admin') {
          data.role = 'admin';
          await setDoc(docRef, data, { merge: true });
        }
        setUserProfile(data);
      } else {
        let role: UserRole = 'user';
        const email = user.email || '';
        if (email.toLowerCase() === 'nguyenthanhthuan091095@gmail.com') {
          role = 'admin';
        }
        const newProfile: UserProfile = {
          uid: user.uid,
          email: email,
          role,
          username: user.displayName || email.split('@')[0],
        };
        await setDoc(docRef, newProfile);
        setUserProfile(newProfile);
      }
    } catch (err) {
      console.error("Error fetching user profile", err);
    }
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const logout = async () => {
    await firebaseSignOut(auth);
  };

  const reloadProfile = async () => {
    if (currentUser) {
      await fetchProfile(currentUser);
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
