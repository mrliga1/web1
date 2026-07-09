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
        let profile = data as UserProfile;
        const emailLower = user.email?.toLowerCase() || '';
        
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);
          
        const isAdmin = adminEmails.includes(emailLower);
        if (isAdmin && profile.role !== 'admin') {
          profile.role = 'admin';
          await supabase.from('users').update({ role: 'admin' }).eq('uid', user.id);
        }
        setUserProfile(profile);
      } else if (error && error.code === 'PGRST116') {
        // Record not found
        let role: UserRole = 'user';
        const email = user.email || '';
        const emailLower = email.toLowerCase();
        
        const adminEmails = (process.env.NEXT_PUBLIC_ADMIN_EMAILS || '')
          .split(',')
          .map(e => e.trim().toLowerCase())
          .filter(Boolean);
          
        if (adminEmails.includes(emailLower)) {
          role = 'admin';
        }
        const newProfile: UserProfile = {
          uid: user.id,
          email: email,
          role,
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
