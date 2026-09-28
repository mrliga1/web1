import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';

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
  ensureAuthReady: () => Promise<void>;
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
  const pathname = usePathname();
  const initializeRef = useRef<(() => Promise<void>) | null>(null);
  const ensureAuthReady = useCallback(async () => {
    if (!initializeRef.current) throw new Error('Chưa thể khởi tạo đăng nhập, vui lòng thử lại.');
    await initializeRef.current();
  }, []);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchProfile = async (user: User): Promise<UserProfile | null> => {
    try {
      const { supabase } = await import('../supabase');
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
        console.error("Không thể tải hồ sơ từ Supabase", error);
        return null;
      }
    } catch (err) {
      console.error("Không thể tải hồ sơ người dùng", err);
      return null;
    }
  };

  useEffect(() => {
    let active = true;
    let authRevision = 0;
    let initialization: Promise<void> | null = null;
    let unsubscribe: (() => void) | undefined;

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

    // Chỉ tải SDK khi có phiên cần khôi phục hoặc người dùng mở đăng nhập.
    const initializeSession = () => {
      if (initialization) return initialization;
      setLoading(true);
      initialization = (async () => {
        try {
          const { supabase } = await withTimeout(import('../supabase'), SESSION_RESTORE_TIMEOUT_MS, 'Quá thời gian tải đăng nhập');
          if (!active) return;
          const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            if (!active) return;
            const user = session?.user || null;
            if (event === 'TOKEN_REFRESHED') { setCurrentUser(user); return; }
            // Không truy vấn hồ sơ bên trong khóa của callback xác thực.
            setTimeout(() => { if (active) { setLoading(true); void applyUser(user); } }, 0);
          });
          unsubscribe = () => subscription.unsubscribe();
          const { data: { session }, error } = await withTimeout(
            supabase.auth.getSession(), SESSION_RESTORE_TIMEOUT_MS,
            'Quá thời gian khôi phục phiên đăng nhập',
          );
          if (error) throw error;
          if (active) await applyUser(session?.user || null);
        } catch (error) {
          unsubscribe?.();
          unsubscribe = undefined;
          initialization = null;
          if (active) {
            authRevision += 1;
            setCurrentUser(null); setUserProfile(null); setLoading(false);
          }
          throw error;
        }
      })();
      return initialization;
    };
    initializeRef.current = initializeSession;
    setLoading(false);
    return () => { active = false; initializeRef.current = null; unsubscribe?.(); };
  }, []);

  useEffect(() => {
    let shouldRestore = pathname?.startsWith('/admin') || /(?:^|[?&])code=/.test(window.location.search)
      || /(?:^|[#&])access_token=/.test(window.location.hash);
    try {
      const host = new URL(process.env.NEXT_PUBLIC_SUPABASE_URL || '').hostname.split('.')[0];
      shouldRestore ||= Boolean(localStorage.getItem('sb-' + host + '-auth-token'));
    } catch { /* Nếu lưu trữ bị chặn, vẫn cho phép đăng nhập trực tiếp. */ }
    if (shouldRestore) void ensureAuthReady().catch(error => console.error('Không thể khôi phục đăng nhập:', error));
  }, [pathname, ensureAuthReady]);

  const logout = async () => {
    const { supabase } = await import('../supabase');
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
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
    <AuthContext.Provider value={{ currentUser, userProfile, loading, logout, reloadProfile, ensureAuthReady }}>
      {children}
    </AuthContext.Provider>
  );
};
