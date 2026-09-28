// Chỉ tải SDK khi thực sự gọi cơ sở dữ liệu hoặc đăng nhập.
const loadSupabase = async () => (await import('./supabase')).supabase;
import { generateSlug } from './lib/utils';

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

const preservePreviousSlugs = (path: string, existingData: unknown, nextData: unknown) => {
  if (!['products', 'projects', 'news'].includes(path) || !isRecord(existingData) || !isRecord(nextData)) {
    return nextData;
  }
  const oldTitle = typeof existingData.title === 'string' ? existingData.title : '';
  const newTitle = typeof nextData.title === 'string' ? nextData.title : oldTitle;
  const oldSlug = generateSlug(oldTitle);
  const newSlug = generateSlug(newTitle);
  const previous = [existingData.previousSlugs, nextData.previousSlugs]
    .flatMap((value) => Array.isArray(value) ? value : [])
    .filter((slug): slug is string => typeof slug === 'string' && Boolean(generateSlug(slug)));
  if (oldSlug && newSlug && oldSlug !== newSlug) previous.push(oldSlug);
  if (previous.length === 0) return nextData;
  return { ...nextData, previousSlugs: [...new Set(previous)].filter((slug) => slug !== newSlug) };
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
  const supabase = await loadSupabase();
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
  const supabase = await loadSupabase();
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

export const addDoc = async (
  collectionRef: LegacyCollectionRef,
  data: unknown,
): Promise<{ id: string; trackingEligible?: boolean }> => {
  if (collectionRef.path === 'consultations' && typeof window !== 'undefined') {
    const response = await fetch('/api/consultations', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await response.json().catch(() => ({})) as {
      id?: string;
      error?: string;
      trackingEligible?: boolean;
    };
    if (!response.ok || !result.id) {
      throw new Error(result.error || 'Không thể gửi yêu cầu tư vấn');
    }
    return { id: result.id, trackingEligible: result.trackingEligible === true };
  }

  const supabase = await loadSupabase();
  const payload = normalizePayload(collectionRef.path, data);
  const { data: result, error } = await supabase.from(collectionRef.path).insert(payload).select().single();
  if (error) throw error;
  return { id: String((result as LegacyRecord).id) };
};

export const setDoc = async (docRef: LegacyDocRef, data: unknown, options?: { merge?: boolean }) => {
  const supabase = await loadSupabase();
  let nextData = data;
  let existingData: unknown;
  if (options?.merge) {
    const existing = await getDoc(docRef);
    existingData = existing.data();
    if (existing.exists() && isRecord(existingData) && isRecord(data)) {
      nextData = { ...existingData, ...data };
    }
  } else if (['products', 'projects', 'news'].includes(docRef.path)) {
    existingData = (await getDoc(docRef)).data();
  }

  nextData = preservePreviousSlugs(docRef.path, existingData, nextData);

  const payload = normalizePayload(docRef.path, nextData, docRef.id);
  const { error } = await supabase.from(docRef.path).upsert(payload);
  if (error) throw error;
};

export const updateDoc = async (docRef: LegacyDocRef, data: unknown) => {
  const supabase = await loadSupabase();
  if (docRef.path === 'consultations') {
    if (!isRecord(data)) throw new Error('Dữ liệu cập nhật khách hàng không hợp lệ');
    const { error } = await supabase.rpc('patch_consultation', {
      p_id: docRef.id,
      p_patch: data,
    });
    if (error) throw error;
    return;
  }

  const existing = await getDoc(docRef);
  if (!existing.exists()) throw new Error("Document not found");

  const existingData = existing.data();
  const merged = isRecord(existingData) && isRecord(data)
    ? preservePreviousSlugs(docRef.path, existingData, { ...existingData, ...data })
    : data;
  const payload = normalizePayload(docRef.path, merged);
  const { error } = await supabase.from(docRef.path).update(payload).eq('id', docRef.id);
  if (error) throw error;
};

export const appendConsultationCareHistory = async (id: string, note: string) => {
  const supabase = await loadSupabase();
  const { data, error } = await supabase.rpc('append_consultation_care_history', {
    p_id: id,
    p_note: note,
  });
  if (error) throw error;
  const result = data as { careHistory?: unknown } | null;
  if (!Array.isArray(result?.careHistory)) {
    throw new Error('Không nhận được lịch sử chăm sóc mới từ máy chủ');
  }
  return result.careHistory as { time: number; note: string; author: string }[];
};

export const deleteDoc = async (docRef: LegacyDocRef) => {
  const supabase = await loadSupabase();
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
  const supabase = await loadSupabase();
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
  const supabase = await loadSupabase();
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
  const supabase = await loadSupabase();
  void _auth;
  const { error } = await supabase.auth.resetPasswordForEmail(email);
  if (error) throw new Error(error.message);
};

export const signInWithPopup = async (_auth: unknown, _provider: unknown) => {
  const supabase = await loadSupabase();
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
