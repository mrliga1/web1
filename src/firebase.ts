import { supabase } from './supabase';

type LegacyRecord = Record<string, unknown>;

export interface LegacyCollectionRef {
  path: string;
}

export interface LegacyDocRef {
  path: string;
  id: string;
}

export interface LegacyDocSnapshot<T = unknown> {
  id: string;
  data: () => T | undefined;
  exists: () => boolean;
}

export interface LegacyQuerySnapshot<T = unknown> {
  docs: LegacyDocSnapshot<T>[];
  empty: boolean;
  size: number;
  forEach: (callback: (doc: LegacyDocSnapshot<T>) => void) => void;
}

export interface SupabaseCompatUser {
  uid?: string;
  email?: string;
  displayName?: string | null;
  providerData: unknown[];
}

const isRecord = (value: unknown): value is LegacyRecord => {
  return Boolean(value && typeof value === 'object' && !Array.isArray(value));
};

const createAuthError = (message: string, code?: string) => {
  const err = new Error(message) as Error & { code?: string };
  if (code) err.code = code;
  return err;
};

const normalizePayload = (path: string, data: unknown, id?: string) => {
  if (path === 'users') {
    const record = isRecord(data) ? data : { data };
    return id ? { id, ...record } : record;
  }

  return id ? { id, data } : { data };
};

export const db: Record<string, never> = {};

export const collection = (_dbInstance: unknown, path: string): LegacyCollectionRef => {
  void _dbInstance;
  return { path };
};

export const doc = (_dbInstance: unknown, path: string, id?: string): LegacyDocRef => {
  void _dbInstance;
  if (id) return { path, id };
  const parts = path.split('/');
  return { path: parts.slice(0, -1).join('/'), id: parts[parts.length - 1] };
};

export const getDocs = async (collectionRef: LegacyCollectionRef): Promise<LegacyQuerySnapshot> => {
  const { data, error } = await supabase.from(collectionRef.path).select('*');
  if (error) throw error;

  const rows = (data || []) as LegacyRecord[];
  const docs = rows.map((row) => ({
    id: String(row.id || ''),
    data: () => collectionRef.path === 'users' ? row : row.data,
    exists: () => true,
  })) as LegacyDocSnapshot[];

  return {
    docs,
    empty: docs.length === 0,
    size: docs.length,
    forEach: (callback: (doc: LegacyDocSnapshot) => void) => docs.forEach(callback),
  };
};

export const getDoc = async (docRef: LegacyDocRef): Promise<LegacyDocSnapshot> => {
  const { data, error } = await supabase.from(docRef.path).select('*').eq('id', docRef.id).maybeSingle();
  if (error) throw error;

  if (!data) {
    return {
      id: docRef.id,
      exists: () => false,
      data: () => undefined,
    };
  }

  const row = data as LegacyRecord;
  return {
    id: String(row.id || docRef.id),
    exists: () => true,
    data: () => docRef.path === 'users' ? row : row.data,
  };
};

export const addDoc = async (collectionRef: LegacyCollectionRef, data: unknown) => {
  if (collectionRef.path === 'consultations' && typeof window !== 'undefined') {
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({})) as { id?: string; error?: string };
    if (!response.ok || !result.id) {
      throw new Error(result.error || 'Không thể gửi yêu cầu tư vấn');
    }
    return { id: result.id };
  }

  const payload = normalizePayload(collectionRef.path, data);
  const { data: result, error } = await supabase.from(collectionRef.path).insert(payload).select().single();
  if (error) throw error;
  return { id: (result as LegacyRecord).id };
};

export const setDoc = async (docRef: LegacyDocRef, data: unknown, options?: { merge?: boolean }) => {
  let nextData = data;
  if (options?.merge) {
    const existing = await getDoc(docRef);
    const existingData = existing.data();
    if (existing.exists() && isRecord(existingData) && isRecord(data)) {
      nextData = { ...existingData, ...data };
    }
  }

  const payload = normalizePayload(docRef.path, nextData, docRef.id);
  const { error } = await supabase.from(docRef.path).upsert(payload);
  if (error) throw error;
};

export const updateDoc = async (docRef: LegacyDocRef, data: unknown) => {
  const existing = await getDoc(docRef);
  if (!existing.exists()) throw new Error("Document not found");

  const existingData = existing.data();
  const merged = isRecord(existingData) && isRecord(data) ? { ...existingData, ...data } : data;
  const payload = normalizePayload(docRef.path, merged);
  const { error } = await supabase.from(docRef.path).update(payload).eq('id', docRef.id);
  if (error) throw error;
};

export const deleteDoc = async (docRef: LegacyDocRef) => {
  const { error } = await supabase.from(docRef.path).delete().eq('id', docRef.id);
  if (error) throw error;
};

export const dbLite = db;

/* Đối tượng auth tương thích API cũ. */
export const auth = {
  currentUser: null as SupabaseCompatUser | null,
  onAuthStateChanged: (_callback: (user: SupabaseCompatUser | null) => void) => {
    void _callback;
    return () => {};
  },
};

/* Đối tượng app tương thích API cũ. */
export const app = {};

/* Hàm theo dõi đăng nhập tương thích API cũ. */
export const onAuthStateChanged = (
  _auth: unknown,
  callback: (user: SupabaseCompatUser | null) => void,
) => {
  void _auth;
  void callback;
  return () => {};
};

/* Hàm lấy database tương thích API cũ. */
export const getFirestoreRealtime = (_app: unknown, _dbId?: string) => {
  void _app;
  void _dbId;
  return {};
};

export const getFirestore = getFirestoreRealtime;

/* Lớp tương thích Auth cũ, toàn bộ luồng thật dùng Supabase Auth. */
export const createUserWithEmailAndPassword = async (_auth: unknown, email: string, password: string) => {
  void _auth;
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    throw createAuthError(
      error.message,
      error.message.includes('already registered') ? 'auth/email-already-in-use' : undefined,
    );
  }

  return {
    user: {
      uid: data.user?.id,
      email: data.user?.email,
      displayName: data.user?.user_metadata?.full_name || null,
      providerData: [],
    },
  };
};

export const signInWithEmailAndPassword = async (_auth: unknown, email: string, password: string) => {
  void _auth;
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    throw createAuthError(
      error.message,
      error.message.includes('Invalid login') ? 'auth/wrong-password' : undefined,
    );
  }

  return {
    user: {
      uid: data.user?.id,
      email: data.user?.email,
      displayName: data.user?.user_metadata?.full_name || null,
      providerData: [],
    },
  };
};

export const sendPasswordResetEmail = async (_auth: unknown, email: string) => {
  void _auth;
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

export const signInWithPopup = async (_auth: unknown, _provider: unknown) => {
  void _auth;
  void _provider;
  const { error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: new URL('/admin', window.location.origin).toString() },
  });
  if (error) throw new Error(error.message);

  // User sẽ được lấy từ session sau khi chuyển hướng.
  return { user: null };
};

export class GoogleAuthProvider {
  static PROVIDER_ID = 'google.com';
}

export const fetchSignInMethodsForEmail = async (_auth: unknown, _email: string) => {
  void _auth;
  void _email;
  return [];
};
