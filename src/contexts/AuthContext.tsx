import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../supabase';
import { User } from '@supabase/supabase-js';

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
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (data) {
        setUserProfile(data as UserProfile);
      } else if (error && error.code === 'PGRST116') {
        const email = user.email || '';
        const newProfile: UserProfile = {
          uid: user.id,
          email: email,
          role: 'user',
          username: user.user_metadata?.full_name || email.split('@')[0],
        };
        await supabase.from('users').insert([newProfile]);
        setUserProfile(newProfile);
      } else {
        console.error("Error fetching profile from Supabase", error);
      }
    } catch (err) {
      console.error("Error fetching user profile", err);
    }
  };

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        fetchProfile(user);
      } else {
        setLoading(false);
      }
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const user = session?.user || null;
      setCurrentUser(user);
      if (user) {
        await fetchProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
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
