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

const SESSION_RESTORE_TIMEOUT_MS = 8000;
const PROFILE_LOAD_TIMEOUT_MS = 8000;

const withTimeout = <T,>(
  operation: PromiseLike<T>,
  timeoutMs: number,
  message: string,
): Promise<T> =>
  new Promise<T>((resolve, reject) => {
    const timeoutId = setTimeout(() => reject(new Error(message)), timeoutMs);

    Promise.resolve(operation).then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('uid', user.id)
        .single();

      if (data) {
        return data as UserProfile;
      } else if (error && error.code === 'PGRST116') {
        const email = user.email || '';
        const newProfile: UserProfile = {
          uid: user.id,
          email: email,
          role: 'user',
          username: user.user_metadata?.full_name || email.split('@')[0],
        };
        const { error: insertError } = await supabase.from('users').insert([newProfile]);
        if (insertError) throw insertError;
        return newProfile;
      } else {
        console.error("Error fetching profile from Supabase", error);
        return null;
      }
    } catch (err) {
      console.error("Error fetching user profile", err);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let authRevision = 0;

    const applyUser = async (user: User | null) => {
      const revision = ++authRevision;

      setCurrentUser(user);
      if (!user) {
        setUserProfile(null);
        if (active && revision === authRevision) setLoading(false);
        return;
      }

      setUserProfile((profile) => (profile?.uid === user.id ? profile : null));

      try {
        const profile = await withTimeout(
          fetchProfile(user),
          PROFILE_LOAD_TIMEOUT_MS,
          "Quá thời gian tải hồ sơ người dùng",
        );
        if (active && revision === authRevision) setUserProfile(profile);
      } catch (error) {
        console.error("Không thể tải hồ sơ người dùng", error);
        if (active && revision === authRevision) setUserProfile(null);
      } finally {
        if (active && revision === authRevision) setLoading(false);
      }
    };

    // Khôi phục đầy đủ phiên và hồ sơ trước khi cho giao diện quản trị hiển thị.
    const initializeSession = async () => {
      try {
        const { data: { session }, error } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_RESTORE_TIMEOUT_MS,
          "Quá thời gian khôi phục phiên đăng nhập",
        );
        if (error) throw error;
        if (!active) return;
        await applyUser(session?.user || null);
      } catch (error) {
        console.error("Không thể khôi phục phiên đăng nhập", error);
        if (active) {
          authRevision += 1;
          setCurrentUser(null);
          setUserProfile(null);
          setLoading(false);
        }
      }
    };

    void initializeSession();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const user = session?.user || null;

      if (event === 'TOKEN_REFRESHED') {
        if (active) setCurrentUser(user);
        return;
      }

      if (active) setLoading(true);

      // Thực hiện truy vấn hồ sơ sau khi callback xác thực kết thúc để tránh chờ chéo.
      setTimeout(() => {
        if (active) void applyUser(user);
      }, 0);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const logout = async () => {
    await supabase.auth.signOut();
  };

  const reloadProfile = async () => {
    if (currentUser) {
      try {
        const profile = await withTimeout(
          fetchProfile(currentUser),
          PROFILE_LOAD_TIMEOUT_MS,
          "Quá thời gian tải lại hồ sơ người dùng",
        );
        setUserProfile(profile);
      } catch (error) {
        console.error("Không thể tải lại hồ sơ người dùng", error);
      }
    }
  };

  return (
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, reloadProfile }}>
      {children}
    </AuthContext.Provider>
  );
};
